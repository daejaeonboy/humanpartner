import express, { Request, Response } from 'express';
import { auth } from '../config/firebaseAdmin';

const router = express.Router();

// 사용자 이메일 변경
router.put('/update-email', async (req: Request, res: Response) => {
    try {
        const { firebaseUid, newEmail } = req.body;

        if (!firebaseUid || !newEmail) {
            res.status(400).json({ error: 'firebaseUid와 newEmail이 필요합니다.' });
            return;
        }

        // Firebase Auth에서 이메일 업데이트
        const userRecord = await auth.updateUser(firebaseUid, {
            email: newEmail
        });

        res.json({
            success: true,
            message: '이메일이 변경되었습니다.',
            user: {
                uid: userRecord.uid,
                email: userRecord.email
            }
        });
    } catch (error: any) {
        console.error('이메일 변경 실패:', error);
        res.status(500).json({ error: error.message || '이메일 변경에 실패했습니다.' });
    }
});

// 사용자 비밀번호 변경
router.put('/update-password', async (req: Request, res: Response) => {
    try {
        const { firebaseUid, newPassword } = req.body;

        if (!firebaseUid || !newPassword) {
            res.status(400).json({ error: 'firebaseUid와 newPassword가 필요합니다.' });
            return;
        }

        if (newPassword.length < 6) {
            res.status(400).json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' });
            return;
        }

        // Firebase Auth에서 비밀번호 업데이트
        await auth.updateUser(firebaseUid, {
            password: newPassword
        });

        res.json({
            success: true,
            message: '비밀번호가 변경되었습니다.'
        });
    } catch (error: any) {
        console.error('비밀번호 변경 실패:', error);
        res.status(500).json({ error: error.message || '비밀번호 변경에 실패했습니다.' });
    }
});

// 사용자 정보 조회 (Firebase UID로)
router.get('/:firebaseUid', async (req: Request, res: Response) => {
    try {
        const firebaseUid = req.params.firebaseUid as string;
        const userRecord = await auth.getUser(firebaseUid);

        res.json({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            disabled: userRecord.disabled,
            emailVerified: userRecord.emailVerified
        });
    } catch (error: any) {
        console.error('사용자 조회 실패:', error);
        res.status(500).json({ error: error.message || '사용자 조회에 실패했습니다.' });
    }
});

export default router;
