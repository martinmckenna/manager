import * as Cookies from 'js-cookie';

const localStorageCache = {};

export const getStorage = (key: string, fallback?: any) => {
  if (localStorageCache[key]) {
    return localStorageCache[key];
  }

  const item = window.localStorage.getItem(key);
  /*
   * Basically, if localstorage doesn't exist,
   * return whatever we set as a fallback
   */
  if (item === null && !!fallback) {
    return fallback;
  }

  try {
    // Try to parse as JSON first. This will turn "true" (string) into `true` (boolean).
    const parsedItem = JSON.parse(item as any);
    localStorageCache[key] = parsedItem;
    return parsedItem;
  } catch (e) {
    // It's okay if we can't parse as JSON -- just use the raw value instead.
    localStorageCache[key] = item;
    return item;
  }
};

export const setStorage = (key: string, value: string) => {
  try {
    // Store parsed JSON if possible.
    localStorageCache[key] = JSON.parse(value);
  } catch {
    // Otherwise just use the raw value.
    localStorageCache[key] = value;
  }
  return window.localStorage.setItem(key, value);
};

const PAGE_SIZE = 'PAGE_SIZE';
const BETA_NOTIFICATION = 'BetaNotification';
const VAT_NOTIFICATION = 'vatNotification';
const HIDE_DISPLAY_GROUPS_CTA = 'importDisplayGroupsCTA';
const HAS_IMPORTED_GROUPS = 'hasImportedGroups';
const BACKUPSCTA_DISMISSED = 'BackupsCtaDismissed';
const TOKEN = 'authentication/token';
const NONCE = 'authentication/nonce';
const SCOPES = 'authentication/scopes';
const EXPIRE = 'authentication/expire';

export type PageSize = number;
type Beta = 'open' | 'closed';
type Notification = 'show' | 'hide';

interface AuthGetAndSet {
  get: () => any;
  set: (value: string) => void;
}

export interface Storage {
  authentication: {
    token: AuthGetAndSet;
    nonce: AuthGetAndSet;
    scopes: AuthGetAndSet;
    expire: AuthGetAndSet;
  };
  pageSize: {
    get: () => PageSize;
    set: (perPage: PageSize) => void;
  };
  notifications: {
    welcome: {
      get: () => Beta;
      set: (open: Beta) => void;
    };
    VAT: {
      get: () => Notification;
      set: (show: Notification) => void;
    };
  };
  loginCloudManager: {
    get: () => undefined | string;
    set: (v: string | object, options?: Cookies.CookieAttributes) => void;
  };
  hideGroupImportCTA: {
    get: () => 'true' | 'false';
    set: () => void;
  };
  hasImportedGroups: {
    get: () => 'true' | 'false';
    set: () => void;
  };
  BackupsCtaDismissed: {
    get: () => boolean;
    set: (v: 'true' | 'false') => void;
  };
}

export const storage: Storage = {
  authentication: {
    token: {
      get: () => getStorage(TOKEN),
      set: v => setStorage(TOKEN, v)
    },
    nonce: {
      get: () => getStorage(NONCE),
      set: v => setStorage(NONCE, v)
    },
    scopes: {
      get: () => getStorage(SCOPES),
      set: v => setStorage(SCOPES, v)
    },
    expire: {
      get: () => getStorage(EXPIRE),
      set: v => setStorage(EXPIRE, v)
    }
  },
  pageSize: {
    get: () => {
      return parseInt(getStorage(PAGE_SIZE, '25'), 10);
    },
    set: v => setStorage(PAGE_SIZE, `${v}`)
  },
  notifications: {
    welcome: {
      /** Leaving the LS key alone so it's not popping for those who've dismissed it. */
      get: () => getStorage(BETA_NOTIFICATION, 'open'),
      set: open => setStorage(BETA_NOTIFICATION, open)
    },
    VAT: {
      get: () => getStorage(VAT_NOTIFICATION, 'show'),
      set: show => setStorage(VAT_NOTIFICATION, show)
    }
  },
  loginCloudManager: {
    get: () => Cookies.get('loginCloudManager'),
    set: (
      v: string | object,
      options: Cookies.CookieAttributes = {
        domain: '.linode.com',
        expires: 1000 * 60 * 60 * 24 * 356
      }
    ) => Cookies.set('loginCloudManager', v, options)
  },
  hideGroupImportCTA: {
    get: () => getStorage(HIDE_DISPLAY_GROUPS_CTA),
    set: () => setStorage(HIDE_DISPLAY_GROUPS_CTA, 'true')
  },
  hasImportedGroups: {
    get: () => getStorage(HAS_IMPORTED_GROUPS),
    set: () => setStorage(HAS_IMPORTED_GROUPS, 'true')
  },
  BackupsCtaDismissed: {
    get: () => getStorage(BACKUPSCTA_DISMISSED),
    set: () => setStorage(BACKUPSCTA_DISMISSED, 'true')
  }
};

export const { notifications, authentication, BackupsCtaDismissed } = storage;
