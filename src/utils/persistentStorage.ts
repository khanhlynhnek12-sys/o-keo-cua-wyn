/**
 * Persistent Storage for Wyn Candy Nest
 * Uses IndexedDB with automatic localStorage fallback to guarantee that
 * uploaded background videos/images, settings, and particle effects NEVER get lost
 * even on page reload or when localStorage quota is exceeded by large media files.
 */

import { WebBackgroundConfig } from '../types/settings';
import { FloatingEffectConfig } from '../components/FloatingParticles';

const DB_NAME = 'wyn_candy_nest_storage_v2';
const STORE_NAME = 'app_settings';
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  return dbPromise;
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbSet failed:', err);
  }
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result !== undefined ? (req.result as T) : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    //
  }
}

// ----------------------------------------------------
// Specific Helpers for Web Background & Particle Config
// ----------------------------------------------------

const BG_KEY = 'wyn_site_bg';
const BG_BLOB_KEY = 'wyn_site_bg_raw_blob';
const FLOATING_KEY = 'wyn_floating_effect_config';

/**
 * Save site background persistently to both IndexedDB and localStorage.
 * If rawBlob is provided (for uploaded videos or GIFs), it is stored as a binary Blob
 * in IndexedDB so that every time the page reloads, a fresh valid Object URL is regenerated.
 */
export async function persistSiteBg(bg: WebBackgroundConfig, rawBlob?: Blob): Promise<void> {
  try {
    // 1. If rawBlob is supplied, store binary Blob in IndexedDB
    if (rawBlob instanceof Blob) {
      await idbSet(BG_BLOB_KEY, rawBlob);
    } else if (bg.url && !bg.url.startsWith('blob:')) {
      // If switching to an external URL or data URL, remove old local blob
      await idbDelete(BG_BLOB_KEY);
    }

    // 2. Save config in IndexedDB
    await idbSet(BG_KEY, bg);

    // 3. Save to localStorage
    if (bg.url && !bg.url.startsWith('blob:')) {
      try {
        localStorage.setItem(BG_KEY, JSON.stringify(bg));
      } catch (e) {
        console.warn('localStorage quota exceeded for background, safely in IndexedDB:', e);
      }
    } else {
      // Do not store invalid blob URLs in localStorage across sessions
      try {
        const safeBg = { ...bg, url: '' };
        localStorage.setItem(BG_KEY, JSON.stringify(safeBg));
      } catch {
        //
      }
    }
  } catch (err) {
    console.warn('persistSiteBg failed:', err);
  }
}

/**
 * Load site background checking IndexedDB first for high-capacity media and stored Blobs,
 * then localStorage. Generates a fresh Object URL if a video/media Blob is stored.
 */
export async function loadPersistedSiteBg(): Promise<WebBackgroundConfig | null> {
  try {
    // 1. Check for stored binary Blob in IndexedDB (for uploaded videos/large media)
    const storedBlob = await idbGet<Blob>(BG_BLOB_KEY);
    const idbConfig = await idbGet<WebBackgroundConfig>(BG_KEY);

    if (storedBlob instanceof Blob && idbConfig) {
      const freshObjectUrl = URL.createObjectURL(storedBlob);
      return {
        ...idbConfig,
        url: freshObjectUrl,
      };
    }

    if (idbConfig && idbConfig.url && !idbConfig.url.startsWith('blob:')) {
      return idbConfig;
    }
  } catch (err) {
    console.warn('loadPersistedSiteBg IDB read error:', err);
  }

  // 2. Fallback to localStorage
  try {
    const local = localStorage.getItem(BG_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && parsed.url && !parsed.url.startsWith('blob:')) {
        return parsed;
      }
    }
  } catch {
    //
  }

  return null;
}

/**
 * Save floating effect config persistently
 */
export async function persistFloatingConfig(cfg: FloatingEffectConfig): Promise<void> {
  await idbSet(FLOATING_KEY, cfg);
  try {
    localStorage.setItem(FLOATING_KEY, JSON.stringify(cfg));
  } catch {
    //
  }
}

/**
 * Load floating effect config checking IndexedDB then localStorage
 */
export async function loadPersistedFloatingConfig(): Promise<FloatingEffectConfig | null> {
  try {
    const idbResult = await idbGet<FloatingEffectConfig>(FLOATING_KEY);
    if (idbResult && Array.isArray(idbResult.activeEffects)) {
      return idbResult;
    }
  } catch {
    //
  }

  try {
    const local = localStorage.getItem(FLOATING_KEY);
    if (local) {
      return JSON.parse(local);
    }
  } catch {
    //
  }

  return null;
}

const HERO_POLAROID_KEY = 'wyn_hero_polaroid_photo';

/**
 * Save hero polaroid photo persistently to IndexedDB and localStorage
 */
export async function persistHeroPolaroidPhoto(photoUrl: string): Promise<void> {
  try {
    await idbSet(HERO_POLAROID_KEY, photoUrl);
  } catch {
    //
  }
  try {
    localStorage.setItem(HERO_POLAROID_KEY, photoUrl);
  } catch (e) {
    console.warn('localStorage quota exceeded for polaroid photo, stored in IndexedDB:', e);
  }
}

/**
 * Load hero polaroid photo checking IndexedDB first then localStorage
 */
export async function loadPersistedHeroPolaroidPhoto(): Promise<string | null> {
  try {
    const idbResult = await idbGet<string>(HERO_POLAROID_KEY);
    if (idbResult) return idbResult;
  } catch {
    //
  }
  try {
    const local = localStorage.getItem(HERO_POLAROID_KEY);
    if (local) return local;
  } catch {
    //
  }
  return null;
}

const WYN_AVATAR_KEY = 'wyn_admin_avatar';
const SITE_LOGO_KEY = 'wyn_site_logo';

/**
 * Save Wyn avatar persistently to IndexedDB and localStorage
 */
export async function persistWynAvatar(avatarUrl: string): Promise<void> {
  try {
    await idbSet(WYN_AVATAR_KEY, avatarUrl);
  } catch {
    //
  }
  try {
    if (avatarUrl) {
      localStorage.setItem(WYN_AVATAR_KEY, avatarUrl);
    } else {
      localStorage.removeItem(WYN_AVATAR_KEY);
    }
  } catch {
    //
  }
}

/**
 * Load Wyn avatar checking IndexedDB first then localStorage
 */
export async function loadPersistedWynAvatar(): Promise<string | null> {
  try {
    const idbResult = await idbGet<string>(WYN_AVATAR_KEY);
    if (idbResult) return idbResult;
  } catch {
    //
  }
  try {
    const local = localStorage.getItem(WYN_AVATAR_KEY);
    if (local) return local;
  } catch {
    //
  }
  return null;
}

/**
 * Save site logo persistently to IndexedDB and localStorage
 */
export async function persistSiteLogo(logoUrl: string | null): Promise<void> {
  try {
    if (logoUrl) {
      await idbSet(SITE_LOGO_KEY, logoUrl);
    } else {
      await idbDelete(SITE_LOGO_KEY);
    }
  } catch {
    //
  }
  try {
    if (logoUrl) {
      localStorage.setItem(SITE_LOGO_KEY, logoUrl);
    } else {
      localStorage.removeItem(SITE_LOGO_KEY);
    }
  } catch {
    //
  }
}

/**
 * Load site logo checking IndexedDB first then localStorage
 */
export async function loadPersistedSiteLogo(): Promise<string | null | undefined> {
  try {
    const idbResult = await idbGet<string>(SITE_LOGO_KEY);
    if (idbResult) return idbResult;
  } catch {
    //
  }
  try {
    const local = localStorage.getItem(SITE_LOGO_KEY);
    if (local) return local;
  } catch {
    //
  }
  return undefined;
}

