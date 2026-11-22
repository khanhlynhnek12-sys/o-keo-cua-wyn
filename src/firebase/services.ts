import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  increment,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from './config';
import { Character } from '../types/character';
import { WebBackgroundConfig, DEFAULT_WEB_BG } from '../types/settings';
import { INITIAL_CHARACTERS } from '../data/initialCharacters';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const CHARACTERS_COLLECTION = 'characters';
const SETTINGS_COLLECTION = 'settings';
const BG_DOC_ID = 'webBackground';

/**
 * Subscribe in real-time to the characters collection in Firestore.
 * Automatically seeds INITIAL_CHARACTERS if the collection is brand new and empty.
 */
export function subscribeCharacters(
  onData: (characters: Character[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, CHARACTERS_COLLECTION);

  const unsubscribe = onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // Automatically seed INITIAL_CHARACTERS (Lucian Valerius) to Firestore
        INITIAL_CHARACTERS.forEach((char) => {
          saveCharacterToFirestore(char).catch(() => {});
        });
        onData(INITIAL_CHARACTERS);
      } else {
        const chars: Character[] = [];
        snapshot.forEach((d) => {
          chars.push(d.data() as Character);
        });
        onData(chars);
      }
    },
    (error) => {
      console.warn('Real-time characters snapshot error, falling back to local cache:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, CHARACTERS_COLLECTION);
    }
  );

  return unsubscribe;
}

import { compressDataUrl } from '../utils/imageCompressor';

/**
 * Save or update a single character in Firestore with automatic data URL compression
 * to guarantee the document size stays well below Firestore's 1MB limit.
 */
export async function saveCharacterToFirestore(character: Character): Promise<void> {
  const path = `${CHARACTERS_COLLECTION}/${character.id}`;
  try {
    let safeAvatar = character.avatar || '';
    if (safeAvatar.startsWith('data:image/') && safeAvatar.length > 100000) {
      try {
        safeAvatar = await compressDataUrl(safeAvatar, 500, 500, 0.75);
      } catch {
        //
      }
    }

    // Safety fallback if character avatar still exceeds 800KB
    if (safeAvatar.length > 800000) {
      safeAvatar = 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=800&q=80';
    }

    const payload: Character = {
      ...character,
      avatar: safeAvatar,
      updatedAt: new Date().toISOString(),
    };

    const docRef = doc(db, CHARACTERS_COLLECTION, character.id);
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Increment the count of users who opened/tasted this character's candy link ("Đã có ... nàng thưởng thức kẹo")
 */
export async function incrementTastedCount(characterId: string): Promise<void> {
  const path = `${CHARACTERS_COLLECTION}/${characterId}`;
  try {
    const docRef = doc(db, CHARACTERS_COLLECTION, characterId);
    await updateDoc(docRef, {
      tastedCount: increment(1),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    try {
      const docRef = doc(db, CHARACTERS_COLLECTION, characterId);
      await setDoc(
        docRef,
        {
          tastedCount: increment(1),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not increment tastedCount in Firestore:', err);
    }
  }
}

/**
 * Delete a character from Firestore
 */
export async function deleteCharacterFromFirestore(characterId: string): Promise<void> {
  const path = `${CHARACTERS_COLLECTION}/${characterId}`;
  try {
    const docRef = doc(db, CHARACTERS_COLLECTION, characterId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe in real-time to the website background configuration in Firestore
 */
export function subscribeSiteBackground(
  onData: (bg: WebBackgroundConfig) => void,
  onError?: (err: Error) => void
): () => void {
  const docRef = doc(db, SETTINGS_COLLECTION, BG_DOC_ID);

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as WebBackgroundConfig;
        // ONLY propagate remote background if it has a real, non-empty, non-blob URL
        if (data && data.url && data.url.trim().length > 0 && !data.url.startsWith('blob:')) {
          onData(data);
        }
      } else {
        saveSiteBackgroundToFirestore(DEFAULT_WEB_BG).catch(() => {});
        onData(DEFAULT_WEB_BG);
      }
    },
    (error) => {
      console.warn('Real-time background snapshot error:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/${BG_DOC_ID}`);
    }
  );

  return unsubscribe;
}

/**
 * Save site background configuration to Firestore so all users & devices sync in real-time
 */
export async function saveSiteBackgroundToFirestore(bg: WebBackgroundConfig): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${BG_DOC_ID}`;
  // Do not send temporary blob: URLs or oversized (>900KB) data to Firestore
  const isTemporaryBlob = bg.url ? bg.url.startsWith('blob:') : false;
  const isTooLargeForFirestoreDoc = bg.url ? bg.url.length > 900000 : false;
  const safeUrl = isTemporaryBlob || isTooLargeForFirestoreDoc ? '' : (bg.url || '');

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, BG_DOC_ID);
    await setDoc(
      docRef,
      {
        id: BG_DOC_ID,
        mode: bg.mode || 'image',
        type: bg.type || 'none',
        url: safeUrl,
        opacity: bg.opacity ?? 0.85,
        blur: bg.blur ?? 0,
        overlayTint: bg.overlayTint || 'pink',
        loop: bg.loop !== false,
        name: bg.name || 'Nền tùy biến của Wyn',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

const POLAROID_DOC_ID = 'heroPolaroid';
const LOGO_DOC_ID = 'siteLogo';
const GENRES_DOC_ID = 'customGenres';

/**
 * Subscribe to Hero Polaroid Photo from Firestore
 */
export function subscribeHeroPolaroidPhoto(
  onData: (photo: string) => void
): () => void {
  const path = `${SETTINGS_COLLECTION}/${POLAROID_DOC_ID}`;
  const docRef = doc(db, SETTINGS_COLLECTION, POLAROID_DOC_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.photo && typeof data.photo === 'string' && data.photo.trim().length > 0) {
          onData(data.photo);
        }
      }
    },
    (error) => {
      console.warn('Real-time polaroid snapshot error:', error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Save Hero Polaroid Photo to Firestore with auto-compression for uploaded Base64 images
 */
export async function saveHeroPolaroidPhotoToFirestore(photo: string): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${POLAROID_DOC_ID}`;
  try {
    let safePhoto = photo && !photo.startsWith('blob:') ? photo : '';
    if (safePhoto.startsWith('data:image/') && safePhoto.length > 100000) {
      try {
        safePhoto = await compressDataUrl(safePhoto, 800, 800, 0.8);
      } catch {
        //
      }
    }
    const docRef = doc(db, SETTINGS_COLLECTION, POLAROID_DOC_ID);
    await setDoc(
      docRef,
      {
        id: POLAROID_DOC_ID,
        photo: safePhoto,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not save hero polaroid photo to Firestore:', error);
  }
}

export const DEFAULT_SITE_LOGO =
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=300&q=80';

/**
 * Subscribe to Site Logo from Firestore
 */
export function subscribeSiteLogo(
  onData: (logo: string | null) => void
): () => void {
  const path = `${SETTINGS_COLLECTION}/${LOGO_DOC_ID}`;
  const docRef = doc(db, SETTINGS_COLLECTION, LOGO_DOC_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && typeof data.logo === 'string' && data.logo.trim().length > 0) {
          onData(data.logo);
        }
      } else {
        saveSiteLogoToFirestore(DEFAULT_SITE_LOGO).catch(() => {});
        onData(DEFAULT_SITE_LOGO);
      }
    },
    (error) => {
      console.warn('Real-time site logo snapshot error:', error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Save Site Logo to Firestore with auto-compression for uploaded Base64 images
 */
export async function saveSiteLogoToFirestore(logo: string | null): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${LOGO_DOC_ID}`;
  try {
    let safeLogo = logo && !logo.startsWith('blob:') ? logo : '';
    if (safeLogo.startsWith('data:image/') && safeLogo.length > 80000) {
      try {
        safeLogo = await compressDataUrl(safeLogo, 300, 300, 0.8);
      } catch {
        //
      }
    }
    const docRef = doc(db, SETTINGS_COLLECTION, LOGO_DOC_ID);
    await setDoc(
      docRef,
      {
        id: LOGO_DOC_ID,
        logo: safeLogo,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not save site logo to Firestore:', error);
  }
}

const WYN_AVATAR_DOC_ID = 'wynAvatar';

/**
 * Subscribe to Wyn Admin Avatar from Firestore
 */
export function subscribeWynAvatar(
  onData: (avatar: string) => void
): () => void {
  const path = `${SETTINGS_COLLECTION}/${WYN_AVATAR_DOC_ID}`;
  const docRef = doc(db, SETTINGS_COLLECTION, WYN_AVATAR_DOC_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && typeof data.avatar === 'string' && data.avatar.trim().length > 0) {
          onData(data.avatar);
        }
      }
    },
    (error) => {
      console.warn('Real-time Wyn avatar snapshot error:', error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Save Wyn Admin Avatar to Firestore with auto-compression
 */
export async function saveWynAvatarToFirestore(avatar: string): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${WYN_AVATAR_DOC_ID}`;
  try {
    let safeAvatar = avatar && !avatar.startsWith('blob:') ? avatar : '';
    if (safeAvatar.startsWith('data:image/') && safeAvatar.length > 80000) {
      try {
        safeAvatar = await compressDataUrl(safeAvatar, 400, 400, 0.8);
      } catch {
        //
      }
    }
    const docRef = doc(db, SETTINGS_COLLECTION, WYN_AVATAR_DOC_ID);
    await setDoc(
      docRef,
      {
        id: WYN_AVATAR_DOC_ID,
        avatar: safeAvatar,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not save Wyn avatar to Firestore:', error);
  }
}

/**
 * Subscribe to Custom Genres from Firestore
 */
export function subscribeCustomGenres(
  onData: (genres: string[]) => void
): () => void {
  const path = `${SETTINGS_COLLECTION}/${GENRES_DOC_ID}`;
  const docRef = doc(db, SETTINGS_COLLECTION, GENRES_DOC_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.genres)) {
          onData(data.genres);
        }
      }
    },
    (error) => {
      console.warn('Real-time custom genres snapshot error:', error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Save Custom Genres to Firestore
 */
export async function saveCustomGenresToFirestore(genres: string[]): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${GENRES_DOC_ID}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, GENRES_DOC_ID);
    await setDoc(
      docRef,
      {
        id: GENRES_DOC_ID,
        genres,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not save custom genres to Firestore:', error);
  }
}

