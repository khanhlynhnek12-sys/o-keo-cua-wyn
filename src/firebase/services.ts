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
  query,
  orderBy,
  limit,
  runTransaction,
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

const FIRESTORE_SAFE_IMAGE_CHARS = 720000;
const FIRESTORE_SAFE_AVATAR_CHARS = 450000;

export interface CloudSyncResult {
  synced: boolean;
  reason?: 'local_video_blob' | 'oversized_media';
}

/**
 * Progressively compress static data:image/* URLs (skipping GIFs to keep animation)
 * until they fit comfortably inside Firestore's 1MB document limit.
 */
async function ensureFirestoreSafeImage(
  url: string,
  maxChars: number,
  presets: Array<[number, number, number]>
): Promise<string> {
  if (!url || !url.startsWith('data:image/') || url.startsWith('data:image/gif')) {
    return url;
  }
  let current = url;
  for (const [w, h, q] of presets) {
    if (current.length <= maxChars) break;
    try {
      const next = await compressDataUrl(current, w, h, q);
      if (next && next.length < current.length) {
        current = next;
      }
    } catch {
      break;
    }
  }
  return current;
}

/**
 * Save or update a single character in Firestore with automatic data URL compression
 * to guarantee the document size stays well below Firestore's 1MB limit.
 */
export async function saveCharacterToFirestore(character: Character): Promise<void> {
  const path = `${CHARACTERS_COLLECTION}/${character.id}`;
  try {
    let safeAvatar = character.avatar || '';
    if (safeAvatar.startsWith('data:image/') && safeAvatar.length > 100000) {
      safeAvatar = await ensureFirestoreSafeImage(safeAvatar, FIRESTORE_SAFE_AVATAR_CHARS, [
        [500, 500, 0.78],
        [360, 360, 0.68],
        [240, 240, 0.56],
      ]);
    }

    // Safety fallback if character avatar still exceeds 800KB
    if (safeAvatar.startsWith('blob:') || safeAvatar.length > 800000) {
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
        if (
          data &&
          ((data.url && data.url.trim().length > 0 && !data.url.startsWith('blob:')) ||
            data.type === 'none')
        ) {
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
 * Save site background configuration to Firestore so all users & devices sync in real-time.
 * Static uploaded images are automatically re-compressed if needed so they always fit inside Firestore.
 * Local video blobs or oversized animated GIFs (>850KB) are kept locally without overwriting Cloud state.
 */
export async function saveSiteBackgroundToFirestore(bg: WebBackgroundConfig): Promise<CloudSyncResult> {
  const path = `${SETTINGS_COLLECTION}/${BG_DOC_ID}`;
  const rawUrl = (bg.url || '').trim();

  if (rawUrl.startsWith('blob:')) {
    return { synced: false, reason: 'local_video_blob' };
  }

  let safeUrl = rawUrl;
  if (safeUrl.startsWith('data:image/') && safeUrl.length > 150000) {
    safeUrl = await ensureFirestoreSafeImage(safeUrl, FIRESTORE_SAFE_IMAGE_CHARS, [
      [1280, 720, 0.72],
      [960, 540, 0.64],
      [800, 450, 0.56],
      [640, 360, 0.48],
    ]);
  }

  if (safeUrl.length > 850000) {
    return { synced: false, reason: 'oversized_media' };
  }

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, BG_DOC_ID);
    await setDoc(
      docRef,
      {
        id: BG_DOC_ID,
        mode: bg.mode || 'image',
        type: safeUrl ? (bg.type || 'image') : 'none',
        url: safeUrl,
        opacity: bg.opacity ?? 0.85,
        blur: bg.blur ?? 0,
        overlayTint: bg.overlayTint || 'pink',
        loop: bg.loop !== false,
        name: bg.name || (safeUrl ? 'Nền tùy biến của Wyn' : 'Mặc định'),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { synced: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { synced: false };
  }
}

const POLAROID_DOC_ID = 'heroPolaroid';
const LOGO_DOC_ID = 'siteLogo';
const GENRES_DOC_ID = 'customGenres';
export const DEFAULT_POLAROID_PHOTO = '/assets/aistudio/hero_bedroom_photo.png';

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
      } else {
        saveHeroPolaroidPhotoToFirestore(DEFAULT_POLAROID_PHOTO).catch(() => {});
        onData(DEFAULT_POLAROID_PHOTO);
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
export async function saveHeroPolaroidPhotoToFirestore(photo: string): Promise<CloudSyncResult> {
  const path = `${SETTINGS_COLLECTION}/${POLAROID_DOC_ID}`;
  if (!photo || photo.startsWith('blob:')) {
    return { synced: false, reason: 'local_video_blob' };
  }

  let safePhoto = photo.trim();
  if (safePhoto.startsWith('data:image/') && safePhoto.length > 100000) {
    safePhoto = await ensureFirestoreSafeImage(safePhoto, FIRESTORE_SAFE_IMAGE_CHARS, [
      [800, 800, 0.78],
      [640, 640, 0.68],
      [480, 480, 0.58],
    ]);
  }

  if (safePhoto.length > 850000) {
    return { synced: false, reason: 'oversized_media' };
  }

  try {
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
    return { synced: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { synced: false };
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
        if (data && typeof data.logo === 'string') {
          onData(data.logo.trim().length > 0 ? data.logo : null);
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
export async function saveSiteLogoToFirestore(logo: string | null): Promise<CloudSyncResult> {
  const path = `${SETTINGS_COLLECTION}/${LOGO_DOC_ID}`;
  if (logo && logo.startsWith('blob:')) {
    return { synced: false, reason: 'local_video_blob' };
  }

  let safeLogo = logo ? logo.trim() : '';
  if (safeLogo.startsWith('data:image/') && safeLogo.length > 80000) {
    safeLogo = await ensureFirestoreSafeImage(safeLogo, FIRESTORE_SAFE_AVATAR_CHARS, [
      [300, 300, 0.8],
      [220, 220, 0.7],
      [160, 160, 0.6],
    ]);
  }

  if (safeLogo.length > 850000) {
    return { synced: false, reason: 'oversized_media' };
  }

  try {
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
    return { synced: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { synced: false };
  }
}

const WYN_AVATAR_DOC_ID = 'wynAvatar';
export const DEFAULT_WYN_AVATAR = '/images/wyn_char_lian_1793720549992.jpg';

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
      } else {
        saveWynAvatarToFirestore(DEFAULT_WYN_AVATAR).catch(() => {});
        onData(DEFAULT_WYN_AVATAR);
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
export async function saveWynAvatarToFirestore(avatar: string): Promise<CloudSyncResult> {
  const path = `${SETTINGS_COLLECTION}/${WYN_AVATAR_DOC_ID}`;
  if (!avatar || avatar.startsWith('blob:')) {
    return { synced: false, reason: 'local_video_blob' };
  }

  let safeAvatar = avatar.trim();
  if (safeAvatar.startsWith('data:image/') && safeAvatar.length > 80000) {
    safeAvatar = await ensureFirestoreSafeImage(safeAvatar, FIRESTORE_SAFE_AVATAR_CHARS, [
      [400, 400, 0.82],
      [300, 300, 0.72],
      [220, 220, 0.62],
    ]);
  }

  if (safeAvatar.length > 850000) {
    return { synced: false, reason: 'oversized_media' };
  }

  try {
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
    return { synced: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return { synced: false };
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

/**
 * Toggle character heart/likesCount atomically in Firestore using a transaction
 * so concurrent visitors never push the counter below zero.
 */
export async function toggleCharacterLikeCount(
  characterId: string,
  delta: 1 | -1,
  fallbackCharacter?: Character
): Promise<void> {
  const path = `${CHARACTERS_COLLECTION}/${characterId}`;
  const docRef = doc(db, CHARACTERS_COLLECTION, characterId);
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (snap.exists()) {
        const currentLikes =
          typeof snap.data()?.likesCount === 'number' ? snap.data().likesCount : 0;
        const nextLikes = Math.max(0, currentLikes + delta);
        transaction.update(docRef, {
          likesCount: nextLikes,
          updatedAt: new Date().toISOString(),
        });
      } else if (fallbackCharacter) {
        let safeAvatar = fallbackCharacter.avatar || '';
        if (safeAvatar.startsWith('blob:') || safeAvatar.length > 800000) {
          safeAvatar =
            'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=800&q=80';
        }
        transaction.set(
          docRef,
          {
            ...fallbackCharacter,
            id: characterId,
            name: (fallbackCharacter.name || 'Nhân vật').slice(0, 128),
            avatar: safeAvatar,
            likesCount: delta > 0 ? 1 : 0,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// =============================================================================
// GÓC FEEDBACK & Ý TƯỞNG KẸO MỚI (REAL-TIME FIRESTORE)
// =============================================================================

const FEEDBACKS_COLLECTION = 'feedbacks';
const IDEAS_COLLECTION = 'ideas';

export interface FeedbackEntry {
  id: string;
  characterName: string;
  sender: string;
  sweetness: number;
  quoteImpression?: string;
  reviewText: string;
  isPublic: boolean;
  date: string;
  sticker?: string;
  createdAt: string;
}

export interface IdeaEntry {
  id: string;
  ideaTitle: string;
  sender: string;
  characterSetup: string;
  firstWhisper?: string;
  backstory?: string;
  date: string;
  createdAt: string;
}

function makeSafeFirestoreId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function subscribeFeedbacks(
  onData: (items: FeedbackEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, FEEDBACKS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: FeedbackEntry[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as FeedbackEntry);
      });
      onData(items);
    },
    (error) => {
      console.warn('Real-time feedbacks snapshot error:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, FEEDBACKS_COLLECTION);
    }
  );
}

export async function saveFeedbackToFirestore(
  entry: Omit<FeedbackEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<FeedbackEntry> {
  const id = (entry.id && /^[a-zA-Z0-9_-]+$/.test(entry.id)
    ? entry.id
    : makeSafeFirestoreId('fb')
  ).slice(0, 128);
  const path = `${FEEDBACKS_COLLECTION}/${id}`;
  const createdAt = (entry.createdAt || new Date().toISOString()).slice(0, 64);

  const payload: FeedbackEntry = {
    id,
    characterName: (entry.characterName || 'Toàn bộ ổ kẹo của Wyn').trim().slice(0, 150),
    sender: (entry.sender || 'Một nàng độc giả mê kẹo').trim().slice(0, 128),
    sweetness: Math.min(5, Math.max(1, Number(entry.sweetness) || 5)),
    reviewText: entry.reviewText.trim().slice(0, 4000),
    isPublic: Boolean(entry.isPublic),
    date: (entry.date || new Date().toLocaleDateString('vi-VN')).slice(0, 64),
    createdAt,
    ...(entry.quoteImpression && entry.quoteImpression.trim()
      ? { quoteImpression: entry.quoteImpression.trim().slice(0, 500) }
      : {}),
    ...(entry.sticker && entry.sticker.trim()
      ? { sticker: entry.sticker.trim().slice(0, 128) }
      : {}),
  };

  try {
    await setDoc(doc(db, FEEDBACKS_COLLECTION, id), payload);
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return payload;
  }
}

export async function deleteFeedbackFromFirestore(feedbackId: string): Promise<void> {
  const path = `${FEEDBACKS_COLLECTION}/${feedbackId}`;
  try {
    await deleteDoc(doc(db, FEEDBACKS_COLLECTION, feedbackId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeIdeas(
  onData: (items: IdeaEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, IDEAS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: IdeaEntry[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as IdeaEntry);
      });
      onData(items);
    },
    (error) => {
      console.warn('Real-time ideas snapshot error:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, IDEAS_COLLECTION);
    }
  );
}

export async function saveIdeaToFirestore(
  entry: Omit<IdeaEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<IdeaEntry> {
  const id = (entry.id && /^[a-zA-Z0-9_-]+$/.test(entry.id)
    ? entry.id
    : makeSafeFirestoreId('idea')
  ).slice(0, 128);
  const path = `${IDEAS_COLLECTION}/${id}`;
  const createdAt = (entry.createdAt || new Date().toISOString()).slice(0, 64);

  const payload: IdeaEntry = {
    id,
    ideaTitle: entry.ideaTitle.trim().slice(0, 200),
    sender: (entry.sender || 'Nàng độc giả sáng tạo').trim().slice(0, 128),
    characterSetup: entry.characterSetup.trim().slice(0, 4000),
    date: (entry.date || new Date().toLocaleDateString('vi-VN')).slice(0, 64),
    createdAt,
    ...(entry.firstWhisper && entry.firstWhisper.trim()
      ? { firstWhisper: entry.firstWhisper.trim().slice(0, 1000) }
      : {}),
    ...(entry.backstory && entry.backstory.trim()
      ? { backstory: entry.backstory.trim().slice(0, 4000) }
      : {}),
  };

  try {
    await setDoc(doc(db, IDEAS_COLLECTION, id), payload);
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return payload;
  }
}

export async function deleteIdeaFromFirestore(ideaId: string): Promise<void> {
  const path = `${IDEAS_COLLECTION}/${ideaId}`;
  try {
    await deleteDoc(doc(db, IDEAS_COLLECTION, ideaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =============================================================================
// BỐC KẸO DUYÊN ĐỊNH (REAL-TIME FIRESTORE)
// =============================================================================

const LUCKY_DRAWS_COLLECTION = 'luckyCandyDraws';
const LUCKY_STATS_DOC_ID = 'luckyCandyStats';

export interface LuckyCandyDrawEntry {
  id: string;
  characterId: string;
  characterName: string;
  characterAvatar?: string;
  sweetFlavor?: string;
  genre?: string;
  type: 'character' | 'fortune';
  createdAt: string;
}

export interface LuckyCandyStats {
  totalDraws: number;
  lastCharacterName?: string;
  updatedAt?: string;
}

export function subscribeLuckyCandyStats(
  onData: (stats: LuckyCandyStats) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `${SETTINGS_COLLECTION}/${LUCKY_STATS_DOC_ID}`;
  const docRef = doc(db, SETTINGS_COLLECTION, LUCKY_STATS_DOC_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onData({
          totalDraws: typeof data?.totalDraws === 'number' ? data.totalDraws : 0,
          lastCharacterName:
            typeof data?.lastCharacterName === 'string' ? data.lastCharacterName : undefined,
          updatedAt: typeof data?.updatedAt === 'string' ? data.updatedAt : undefined,
        });
      } else {
        onData({ totalDraws: 0 });
      }
    },
    (error) => {
      console.warn('Real-time lucky candy stats snapshot error:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeLuckyCandyDraws(
  onData: (draws: LuckyCandyDrawEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, LUCKY_DRAWS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(12)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const draws: LuckyCandyDrawEntry[] = [];
      snapshot.forEach((d) => {
        draws.push(d.data() as LuckyCandyDrawEntry);
      });
      onData(draws);
    },
    (error) => {
      console.warn('Real-time lucky candy draws snapshot error:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, LUCKY_DRAWS_COLLECTION);
    }
  );
}

export async function recordLuckyCandyDrawInFirestore(
  draw: Omit<LuckyCandyDrawEntry, 'id' | 'createdAt'>
): Promise<LuckyCandyDrawEntry> {
  const id = makeSafeFirestoreId('draw');
  const createdAt = new Date().toISOString();
  const safeAvatar =
    draw.characterAvatar &&
    !draw.characterAvatar.startsWith('blob:') &&
    draw.characterAvatar.length <= 200000
      ? draw.characterAvatar
      : '';

  const payload: LuckyCandyDrawEntry = {
    id,
    characterId: (draw.characterId || 'wyn_special_candy_fortune').slice(0, 128),
    characterName: (draw.characterName || 'Kẹo Ngọt Của Wyn').trim().slice(0, 128),
    type: draw.type === 'fortune' ? 'fortune' : 'character',
    createdAt,
    ...(safeAvatar ? { characterAvatar: safeAvatar } : {}),
    ...(draw.sweetFlavor ? { sweetFlavor: draw.sweetFlavor.trim().slice(0, 128) } : {}),
    ...(draw.genre ? { genre: draw.genre.trim().slice(0, 128) } : {}),
  };

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, LUCKY_DRAWS_COLLECTION, id), payload);
    batch.set(
      doc(db, SETTINGS_COLLECTION, LUCKY_STATS_DOC_ID),
      {
        id: LUCKY_STATS_DOC_ID,
        totalDraws: increment(1),
        lastCharacterName: payload.characterName,
        updatedAt: createdAt,
      },
      { merge: true }
    );
    await batch.commit();
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${LUCKY_DRAWS_COLLECTION}/${id}`);
    return payload;
  }
}


