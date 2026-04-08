import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../api/userApi';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    isAdmin: boolean;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    isAdmin: false,
    logout: async () => { },
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (firebaseUser: User) => {
        try {
            const [{ getUserProfileByFirebaseUid }, { auth }, { signOut }] = await Promise.all([
                import('../api/userApi'),
                import('../firebase'),
                import('firebase/auth'),
            ]);
            const profile = await getUserProfileByFirebaseUid(firebaseUser.uid);
            
            // 승인되지 않은 일반 사용자만 자동 로그아웃 처리
            if (profile && !profile.is_admin && !profile.is_approved) {
                await signOut(auth);
                setUser(null);
                setUserProfile(null);
                // alert('관리자 승인이 필요한 계정입니다.'); // 자동 로그인 시 계속 뜰 수 있어 생략하거나 필요 시 추가
                return;
            }

            setUserProfile(profile);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            setUserProfile(null);
        }
    };

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        let isMounted = true;

        const initializeAuth = async () => {
            try {
                const [{ onAuthStateChanged }, { auth }] = await Promise.all([
                    import('firebase/auth'),
                    import('../firebase'),
                ]);

                if (!isMounted) {
                    return;
                }

                unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                    if (!isMounted) {
                        return;
                    }

                    setUser(currentUser);

                    if (currentUser) {
                        await fetchProfile(currentUser);
                    } else {
                        setUserProfile(null);
                    }

                    if (isMounted) {
                        setLoading(false);
                    }
                });
            } catch (error) {
                console.error('Failed to initialize auth:', error);
                if (isMounted) {
                    setUser(null);
                    setUserProfile(null);
                    setLoading(false);
                }
            }
        };

        void initializeAuth();

        return () => {
            isMounted = false;
            unsubscribe?.();
        };
    }, []);

    const logout = async () => {
        const [{ signOut }, { auth }] = await Promise.all([
            import('firebase/auth'),
            import('../firebase'),
        ]);
        await signOut(auth);
        setUserProfile(null);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user);
        }
    };

    const isAdmin = userProfile?.is_admin === true;

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, isAdmin, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
