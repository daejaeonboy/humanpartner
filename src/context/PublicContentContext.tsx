import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Banner,
  NavMenuItem,
  Popup,
  QuickMenuItem,
  TabMenuItem,
  getAllNavMenuItems,
  getHeroBanners,
  getPopups,
  getQuickMenuItems,
  getTabMenuItems,
} from '../api/cmsApi';
import { Section, getActiveSections } from '../api/sectionApi';

interface PublicContentValue {
  activeSections: Section[];
  heroBanners: Banner[];
  navMenuItems: NavMenuItem[];
  popups: Popup[];
  quickMenuItems: QuickMenuItem[];
  tabMenuItems: TabMenuItem[];
  loading: boolean;
  refresh: () => Promise<void>;
}

interface PublicContentSnapshot {
  activeSections: Section[];
  heroBanners: Banner[];
  navMenuItems: NavMenuItem[];
  popups: Popup[];
  quickMenuItems: QuickMenuItem[];
  tabMenuItems: TabMenuItem[];
}

const EMPTY_SNAPSHOT: PublicContentSnapshot = {
  activeSections: [],
  heroBanners: [],
  navMenuItems: [],
  popups: [],
  quickMenuItems: [],
  tabMenuItems: [],
};

const SHELL_ONLY_SNAPSHOT: PublicContentSnapshot = {
  ...EMPTY_SNAPSHOT,
};

const PublicContentContext = createContext<PublicContentValue>({
  ...EMPTY_SNAPSHOT,
  loading: true,
  refresh: async () => {},
});

let cachedHomeSnapshot: PublicContentSnapshot | null = null;
let cachedHomeAt = 0;
let pendingHomeSnapshotPromise: Promise<PublicContentSnapshot> | null = null;
let cachedShellSnapshot: PublicContentSnapshot | null = null;
let cachedShellAt = 0;
let pendingShellSnapshotPromise: Promise<PublicContentSnapshot> | null = null;

const PUBLIC_CONTENT_TTL_MS = 60_000;

const fetchShellContent = async (): Promise<PublicContentSnapshot> => {
  const navMenuItems = await getAllNavMenuItems();

  return {
    ...SHELL_ONLY_SNAPSHOT,
    navMenuItems,
  };
};

const fetchHomeContent = async (): Promise<PublicContentSnapshot> => {
  const [activeSections, heroBanners, navMenuItems, popups, quickMenuItems, tabMenuItems] =
    await Promise.all([
      getActiveSections(),
      getHeroBanners(),
      getAllNavMenuItems(),
      getPopups(),
      getQuickMenuItems(),
      getTabMenuItems(),
    ]);

  return {
    activeSections,
    heroBanners,
    navMenuItems,
    popups,
    quickMenuItems,
    tabMenuItems,
  };
};

const getCachedShellContent = async (force = false) => {
  const now = Date.now();
  const canReuseHomeSnapshot =
    !force && cachedHomeSnapshot && now - cachedHomeAt < PUBLIC_CONTENT_TTL_MS;
  const isFresh = !force && cachedShellSnapshot && now - cachedShellAt < PUBLIC_CONTENT_TTL_MS;

  if (canReuseHomeSnapshot && cachedHomeSnapshot) {
    return cachedHomeSnapshot;
  }

  if (isFresh && cachedShellSnapshot) {
    return cachedShellSnapshot;
  }

  if (!force && pendingShellSnapshotPromise) {
    return pendingShellSnapshotPromise;
  }

  pendingShellSnapshotPromise = fetchShellContent()
    .then((snapshot) => {
      cachedShellSnapshot = snapshot;
      cachedShellAt = Date.now();
      return snapshot;
    })
    .finally(() => {
      pendingShellSnapshotPromise = null;
    });

  return pendingShellSnapshotPromise;
};

const getCachedHomeContent = async (force = false) => {
  const now = Date.now();
  const isFresh = !force && cachedHomeSnapshot && now - cachedHomeAt < PUBLIC_CONTENT_TTL_MS;

  if (isFresh && cachedHomeSnapshot) {
    return cachedHomeSnapshot;
  }

  if (!force && pendingHomeSnapshotPromise) {
    return pendingHomeSnapshotPromise;
  }

  pendingHomeSnapshotPromise = fetchHomeContent()
    .then((snapshot) => {
      cachedHomeSnapshot = snapshot;
      cachedHomeAt = Date.now();
      cachedShellSnapshot = {
        ...SHELL_ONLY_SNAPSHOT,
        navMenuItems: snapshot.navMenuItems,
      };
      cachedShellAt = cachedHomeAt;
      return snapshot;
    })
    .finally(() => {
      pendingHomeSnapshotPromise = null;
    });

  return pendingHomeSnapshotPromise;
};

export const PublicContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isHomeRoute = location.pathname === '/';
  const initialSnapshot = isHomeRoute
    ? cachedHomeSnapshot || cachedShellSnapshot || EMPTY_SNAPSHOT
    : cachedShellSnapshot || cachedHomeSnapshot || EMPTY_SNAPSHOT;

  const [snapshot, setSnapshot] = useState<PublicContentSnapshot>(initialSnapshot);
  const [loading, setLoading] = useState(!initialSnapshot.navMenuItems.length);

  const load = async (force = false) => {
    if (!force) {
      if (isHomeRoute && cachedHomeSnapshot) {
        setSnapshot(cachedHomeSnapshot);
        setLoading(false);
        return;
      }

      if (!isHomeRoute && (cachedShellSnapshot || cachedHomeSnapshot)) {
        setSnapshot(cachedShellSnapshot || cachedHomeSnapshot || EMPTY_SNAPSHOT);
        setLoading(false);
        return;
      }

      if (isHomeRoute && cachedShellSnapshot) {
        setSnapshot(cachedShellSnapshot);
      }
    }

    setLoading(true);
    try {
      const nextSnapshot = isHomeRoute
        ? await getCachedHomeContent(force)
        : await getCachedShellContent(force);
      setSnapshot(nextSnapshot);
    } catch (error) {
      console.error('Failed to load public content:', error);
      if (!cachedHomeSnapshot && !cachedShellSnapshot) {
        setSnapshot(EMPTY_SNAPSHOT);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [isHomeRoute]);

  useEffect(() => {
    const handleVisibility = () => {
      const lastCachedAt = isHomeRoute ? cachedHomeAt : Math.max(cachedShellAt, cachedHomeAt);

      if (document.visibilityState === 'visible' && Date.now() - lastCachedAt >= PUBLIC_CONTENT_TTL_MS) {
        void load(true);
      }
    };

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isHomeRoute]);

  const value = useMemo(
    () => ({
      ...snapshot,
      loading,
      refresh: async () => {
        await load(true);
      },
    }),
    [loading, snapshot],
  );

  return (
    <PublicContentContext.Provider value={value}>
      {children}
    </PublicContentContext.Provider>
  );
};

export const usePublicContent = () => useContext(PublicContentContext);
