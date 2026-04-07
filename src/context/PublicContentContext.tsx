import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

const PublicContentContext = createContext<PublicContentValue>({
  ...EMPTY_SNAPSHOT,
  loading: true,
  refresh: async () => {},
});

let cachedSnapshot: PublicContentSnapshot | null = null;
let cachedAt = 0;
let pendingSnapshotPromise: Promise<PublicContentSnapshot> | null = null;

const PUBLIC_CONTENT_TTL_MS = 60_000;

const fetchPublicContent = async (): Promise<PublicContentSnapshot> => {
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

const getCachedPublicContent = async (force = false) => {
  const now = Date.now();
  const isFresh = !force && cachedSnapshot && now - cachedAt < PUBLIC_CONTENT_TTL_MS;

  if (isFresh && cachedSnapshot) {
    return cachedSnapshot;
  }

  if (!force && pendingSnapshotPromise) {
    return pendingSnapshotPromise;
  }

  pendingSnapshotPromise = fetchPublicContent()
    .then((snapshot) => {
      cachedSnapshot = snapshot;
      cachedAt = Date.now();
      return snapshot;
    })
    .finally(() => {
      pendingSnapshotPromise = null;
    });

  return pendingSnapshotPromise;
};

export const PublicContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snapshot, setSnapshot] = useState<PublicContentSnapshot>(cachedSnapshot || EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(!cachedSnapshot);

  const load = async (force = false) => {
    if (!force && cachedSnapshot) {
      setSnapshot(cachedSnapshot);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const nextSnapshot = await getCachedPublicContent(force);
      setSnapshot(nextSnapshot);
    } catch (error) {
      console.error('Failed to load public content:', error);
      if (!cachedSnapshot) {
        setSnapshot(EMPTY_SNAPSHOT);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && Date.now() - cachedAt >= PUBLIC_CONTENT_TTL_MS) {
        void load(true);
      }
    };

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

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
