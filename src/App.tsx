/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutGrid,
  Sparkles,
  Film,
  Plus,
  Candy,
  Trash2,
  Upload,
  BookOpen,
} from 'lucide-react';
import { Character, ViewMode } from './types/character';
import { INITIAL_CHARACTERS } from './data/initialCharacters';
import { Navbar, AppPage } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CharacterCard } from './components/CharacterCard';
import { CinemaSpotlight } from './components/CinemaSpotlight';
import { CharacterDetailModal } from './components/CharacterDetailModal';
import { CharacterFormModal } from './components/CharacterFormModal';
import { WynIntroModal } from './components/WynIntroModal';
import { WelcomeGateModal } from './components/WelcomeGateModal';
import { AdminModal } from './components/AdminModal';
import { FeedbackPage } from './components/FeedbackPage';
import { LuckyCandyPage } from './components/LuckyCandyPage';
import { GenresPage } from './components/GenresPage';
import { FlavorGuide } from './components/FlavorGuide';
import { GenreShowcase } from './components/GenreShowcase';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import {
  FloatingParticles,
  FloatingEffectConfig,
  DEFAULT_FLOATING_CONFIG,
} from './components/FloatingParticles';
import { SpinningMusicPlayer } from './components/SpinningMusicPlayer';
import { sound } from './utils/audio';
import { WebBackgroundConfig, DEFAULT_WEB_BG } from './types/settings';
import { getYouTubeId } from './utils/imageCompressor';
import {
  persistSiteBg,
  loadPersistedSiteBg,
  persistFloatingConfig,
  loadPersistedFloatingConfig,
  persistHeroPolaroidPhoto,
  loadPersistedHeroPolaroidPhoto,
} from './utils/persistentStorage';
import {
  subscribeCharacters,
  saveCharacterToFirestore,
  deleteCharacterFromFirestore,
  subscribeSiteBackground,
  saveSiteBackgroundToFirestore,
  incrementTastedCount,
  subscribeHeroPolaroidPhoto,
  saveHeroPolaroidPhotoToFirestore,
  subscribeSiteLogo,
  saveSiteLogoToFirestore,
} from './firebase/services';

const STORAGE_KEY = 'wyn_candy_nest_characters_v4';
const FAVORITES_KEY = 'wyn_candy_nest_favorites_v4';

export default function App() {
  // Characters state - starts at 0 characters until Wyn adds characters
  const [characters, setCharacters] = useState<Character[]>(() => {
    try {
      localStorage.removeItem('wyn_candy_characters_v1');
      localStorage.removeItem('wyn_candy_favorites_v1');
      localStorage.removeItem('wyn_candy_nest_characters_v2');
      localStorage.removeItem('wyn_candy_nest_favorites_v2');
      localStorage.removeItem('wyn_candy_nest_characters_v3');
      localStorage.removeItem('wyn_candy_nest_favorites_v3');

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      //
    }
    return INITIAL_CHARACTERS;
  });

  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      //
    }
    return new Set();
  });

  // Sound
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => sound.enabled);

  // Page routing
  const [currentPage, setCurrentPage] = useState<AppPage>('home');

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Tất cả');
  const [selectedFlavor, setSelectedFlavor] = useState('Tất cả');
  const [showingFavoritesOnly, setShowingFavoritesOnly] = useState(false);

  // Modals
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalDefaultGenre, setModalDefaultGenre] = useState('');
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
  const [isWelcomeGateOpen, setIsWelcomeGateOpen] = useState(true);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('wyn_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  // Website Logo & Background customizable by Wyn in AdminModal
  const [siteLogo, setSiteLogo] = useState<string | null>(() => {
    try {
      return (
        localStorage.getItem('wyn_site_logo') ||
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=300&q=80'
      );
    } catch {
      return 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=300&q=80';
    }
  });

  // Hero Polaroid Photo (customizable by Admin)
  const [heroPolaroidPhoto, setHeroPolaroidPhoto] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('wyn_hero_polaroid_photo') ||
        '/assets/aistudio/hero_bedroom_photo.png'
      );
    } catch {
      return '/assets/aistudio/hero_bedroom_photo.png';
    }
  });
  const [adminInitialTab, setAdminInitialTab] = useState<any>('create');

  const [webBg, setWebBg] = useState<WebBackgroundConfig>(() => {
    try {
      const stored = localStorage.getItem('wyn_site_bg');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.url && !parsed.url.startsWith('blob:')) {
          return parsed;
        }
      }
    } catch {
      //
    }
    return DEFAULT_WEB_BG;
  });

  const handleUpdateSiteLogo = (logo: string | null) => {
    setSiteLogo(logo);
    saveSiteLogoToFirestore(logo).catch(() => {});
    try {
      if (logo) {
        localStorage.setItem('wyn_site_logo', logo);
      } else {
        localStorage.removeItem('wyn_site_logo');
      }
    } catch {
      //
    }
  };

  const handleUpdateWebBg = (bg: WebBackgroundConfig, rawBlob?: Blob) => {
    setWebBg(bg);
    // 1. Save to Firebase Firestore for cloud persistence across all users & devices
    saveSiteBackgroundToFirestore(bg).catch((err) => {
      console.warn('Could not save background to Firebase:', err);
    });
    // 2. Persist locally to IndexedDB and localStorage (handles large media with no 5MB limit and stores raw Blobs for reload)
    persistSiteBg(bg, rawBlob);
    try {
      // 3. Broadcast to other tabs & windows via BroadcastChannel
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('wyn_site_sync_channel');
        channel.postMessage({ type: 'UPDATE_BG', payload: bg });
        channel.close();
      }
      // 4. Dispatch in-window event for instant local component sync
      window.dispatchEvent(new CustomEvent('wyn_site_bg_sync', { detail: bg }));
    } catch {
      //
    }
  };

  // Real-time synchronization listener with Firebase Firestore, BroadcastChannel, and persistent offline loader
  useEffect(() => {
    // 1. Real-time Firebase Firestore subscription for characters
    const unsubscribeChars = subscribeCharacters(
      (remoteChars) => {
        if (Array.isArray(remoteChars) && remoteChars.length > 0) {
          setCharacters(remoteChars);
        }
      },
      (err) => {
        console.warn('Firestore characters subscription fallback:', err);
      }
    );

    // 2. Real-time Firebase Firestore subscription for shared background
    const unsubscribeBg = subscribeSiteBackground(
      (remoteBg) => {
        // ONLY accept remote background if it has a real non-empty URL
        if (remoteBg && remoteBg.url && remoteBg.url.trim().length > 0 && !remoteBg.url.startsWith('blob:')) {
          setWebBg(remoteBg);
          persistSiteBg(remoteBg);
        }
      },
      (err) => {
        console.warn('Firestore background subscription fallback:', err);
      }
    );

    // 3. Load persisted background from IndexedDB on startup (guarantees videos/large images never get lost on reload)
    loadPersistedSiteBg().then((savedBg) => {
      if (savedBg && savedBg.url) {
        setWebBg(savedBg);
      }
    });

    // 4. Load persisted particle effect configuration (hearts only)
    loadPersistedFloatingConfig().then((savedCfg) => {
      if (savedCfg) {
        setFloatingConfig({ ...savedCfg, activeEffects: ['hearts'] });
      }
    });

    // 5. Load persisted hero polaroid photo
    loadPersistedHeroPolaroidPhoto().then((storedPhoto) => {
      if (storedPhoto) {
        setHeroPolaroidPhoto(storedPhoto);
      }
    });

    // 6. Subscribe in real-time to Hero Polaroid Photo from Cloud Firestore
    const unsubscribePolaroid = subscribeHeroPolaroidPhoto((remotePhoto) => {
      if (remotePhoto && remotePhoto.trim().length > 0) {
        setHeroPolaroidPhoto(remotePhoto);
        persistHeroPolaroidPhoto(remotePhoto);
      }
    });

    // 7. Subscribe in real-time to Site Logo from Cloud Firestore
    const unsubscribeLogo = subscribeSiteLogo((remoteLogo) => {
      setSiteLogo(remoteLogo);
      try {
        if (remoteLogo) {
          localStorage.setItem('wyn_site_logo', remoteLogo);
        } else {
          localStorage.removeItem('wyn_site_logo');
        }
      } catch {
        //
      }
    });

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wyn_site_bg' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setWebBg(parsed);
        } catch {
          //
        }
      }
    };

    const handleCustomSync = (e: Event) => {
      const customEvent = e as CustomEvent<WebBackgroundConfig>;
      if (customEvent.detail) {
        setWebBg(customEvent.detail);
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('wyn_site_sync_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'UPDATE_BG' && event.data.payload) {
            setWebBg(event.data.payload);
          }
        };
      }
    } catch {
      //
    }

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wyn_site_bg_sync', handleCustomSync);

    return () => {
      unsubscribeChars();
      unsubscribeBg();
      unsubscribePolaroid();
      unsubscribeLogo();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wyn_site_bg_sync', handleCustomSync);
      if (bc) bc.close();
    };
  }, []);

  const [floatingConfig, setFloatingConfig] = useState<FloatingEffectConfig>(() => {
    try {
      const stored = localStorage.getItem('wyn_floating_effect_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          parsed.activeEffects = ['hearts'];
          if (typeof parsed.density === 'number' && parsed.density <= 12) {
            parsed.density = 20;
          }
          return parsed;
        }
      }
    } catch {
      //
    }
    return DEFAULT_FLOATING_CONFIG;
  });

  const handleUpdateFloatingConfig = (cfg: FloatingEffectConfig) => {
    setFloatingConfig(cfg);
    persistFloatingConfig(cfg);
  };

  const handleUpdateHeroPolaroidPhoto = (photo: string) => {
    setHeroPolaroidPhoto(photo);
    persistHeroPolaroidPhoto(photo);
    saveHeroPolaroidPhotoToFirestore(photo).catch(() => {});
  };

  // Cinema Index
  const [cinemaIndex, setCinemaIndex] = useState(0);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
    } catch {
      //
    }
  }, [characters]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
    } catch {
      //
    }
  }, [favorites]);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Genre list
  const genres = useMemo(() => {
    const list = new Set<string>();
    characters.forEach((c) => {
      if (c.genre) {
        const mainGenre = c.genre.split('·')[0].trim();
        list.add(mainGenre);
      }
    });
    return ['Tất cả', ...Array.from(list)];
  }, [characters]);

  // Flavor list
  const flavors = useMemo(() => {
    const list = new Set<string>();
    characters.forEach((c) => {
      if (c.sweetFlavor) {
        const main = c.sweetFlavor.replace('Kẹo ', '').split(' ')[0].trim();
        if (main) list.add(main);
      }
    });
    return ['Tất cả', ...Array.from(list)];
  }, [characters]);

  // Filtered characters
  const filteredCharacters = useMemo(() => {
    return characters.filter((char) => {
      if (showingFavoritesOnly && !favorites.has(char.id)) {
        return false;
      }
      if (selectedGenre && selectedGenre !== 'Tất cả') {
        const matchesGenre = char.genre?.toLowerCase().includes(selectedGenre.toLowerCase());
        if (!matchesGenre) return false;
      }
      if (selectedFlavor && selectedFlavor !== 'Tất cả') {
        const matchesFlavor = char.sweetFlavor?.toLowerCase().includes(selectedFlavor.toLowerCase());
        if (!matchesFlavor) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = char.name?.toLowerCase().includes(q);
        const matchesGenre = char.genre?.toLowerCase().includes(q);
        const matchesFlavor = char.sweetFlavor?.toLowerCase().includes(q);
        const matchesBackstory = char.backstory?.toLowerCase().includes(q);
        const matchesTagline = char.tagline?.toLowerCase().includes(q);
        return matchesName || matchesGenre || matchesFlavor || matchesBackstory || matchesTagline;
      }
      return true;
    });
  }, [characters, selectedGenre, selectedFlavor, searchQuery, showingFavoritesOnly, favorites]);

  // Handlers
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Đã bỏ nhân vật khỏi danh sách yêu thích');
      } else {
        next.add(id);
        showToast('Đã thêm nhân vật vào danh sách yêu thích!');
      }
      return next;
    });
  };

  const handleCopyFirstMessage = (msg: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      navigator.clipboard.writeText(msg);
      showToast('Đã sao chép tin nhắn đầu tiên vào khay nhớ tạm!');
    } catch {
      showToast('Đã chọn tin nhắn đầu tiên');
    }
  };

  const handleCopyLink = (link: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      navigator.clipboard.writeText(link);
      showToast('Đã sao chép đường link nhân vật!');
    } catch {
      showToast('Đã chọn link nhân vật');
    }
  };

  const handleSaveCharacter = (char: Character) => {
    // 1. Persist to Firebase Firestore for real-time cloud sync across all users & devices
    saveCharacterToFirestore(char).catch((err) => {
      console.warn('Could not save character to Firebase:', err);
    });

    setCharacters((prev) => {
      const exists = prev.some((c) => c.id === char.id);
      if (exists) {
        showToast(`Đã cập nhật thông tin nhân vật "${char.name}" (Đồng bộ Cloud)!`);
        return prev.map((c) => (c.id === char.id ? char : c));
      } else {
        showToast(`Đã thêm nhân vật mới "${char.name}" vào Ổ kẹo (Đồng bộ Cloud)!`);
        return [char, ...prev];
      }
    });

    if (selectedCharacter && selectedCharacter.id === char.id) {
      setSelectedCharacter(char);
    }
  };

  const handleDeleteCharacter = (id: string) => {
    sound.playPop();
    // 1. Delete from Firebase Firestore
    deleteCharacterFromFirestore(id).catch((err) => {
      console.warn('Could not delete character from Firebase:', err);
    });

    setCharacters((prev) => prev.filter((c) => c.id !== id));
    if (selectedCharacter?.id === id) {
      setSelectedCharacter(null);
    }
    showToast('Đã xóa nhân vật khỏi Ổ kẹo và Cloud.');
  };

  const handleTastedCharacter = (characterId: string) => {
    sound.playChime();
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === characterId ? { ...c, tastedCount: (c.tastedCount || 0) + 1 } : c
      )
    );
    if (selectedCharacter && selectedCharacter.id === characterId) {
      setSelectedCharacter((prev) =>
        prev ? { ...prev, tastedCount: (prev.tastedCount || 0) + 1 } : null
      );
    }
    incrementTastedCount(characterId).catch((err) => {
      console.warn('Could not increment tasted count in cloud:', err);
    });
    const char = characters.find((c) => c.id === characterId);
    showToast(`🍬 Chúc nàng có những giây phút ngọt ngào cùng "${char?.name || 'nhân vật'}"!`);
  };

  const handleClearAll = () => {
    sound.playPop();
    setCharacters([]);
    setFavorites(new Set());
    setSelectedCharacter(null);
    setSearchQuery('');
    setSelectedGenre('Tất cả');
    setSelectedFlavor('Tất cả');
    setShowingFavoritesOnly(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([]));
    } catch {
      //
    }
    showToast('Đã dọn sạch tất cả nhân vật trong Ổ kẹo!');
  };

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    sound.enabled = nextState;
    setSoundEnabled(nextState);
    try {
      localStorage.setItem('wyn_sound_enabled', String(nextState));
    } catch {
      //
    }
    showToast(nextState ? 'Đã bật hiệu ứng âm thanh' : 'Đã tắt âm thanh');
  };

  const currentDetailIndex = selectedCharacter
    ? filteredCharacters.findIndex((c) => c.id === selectedCharacter.id)
    : -1;

  const handleNextDetail = () => {
    if (filteredCharacters.length === 0) return;
    const nextIdx = (currentDetailIndex + 1) % filteredCharacters.length;
    setSelectedCharacter(filteredCharacters[nextIdx]);
  };

  const handlePrevDetail = () => {
    if (filteredCharacters.length === 0) return;
    const prevIdx = (currentDetailIndex - 1 + filteredCharacters.length) % filteredCharacters.length;
    setSelectedCharacter(filteredCharacters[prevIdx]);
  };

  const handleExport = () => {
    if (characters.length === 0) {
      showToast('Danh sách đang trống, chưa có dữ liệu để xuất!');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(characters, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'o_keo_ngot_cua_wyn_characters.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Đã xuất danh sách nhân vật ra file JSON!');
  };

  const handleImportTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const importedChars = parsed.map((c: Character) => ({ ...c }));
          setCharacters(importedChars);
          // Sync all imported characters to Firestore
          importedChars.forEach((c) => {
            saveCharacterToFirestore(c).catch(() => {});
          });
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(importedChars));
          } catch {
            //
          }
          sound.playSuccess();
          showToast(`Nhập dữ liệu thành công! Đã nạp & đồng bộ ${importedChars.length} nhân vật lên Cloud.`);
        } else {
          showToast('Tệp JSON không đúng cấu trúc danh sách nhân vật!');
        }
      } catch {
        showToast('Không thể đọc tệp JSON. Vui lòng kiểm tra lại!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const scrollToRoster = () => {
    document.getElementById('roster')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFlavors = () => {
    document.getElementById('flavor-guide')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToGenres = () => {
    document.getElementById('the-loai-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`relative min-h-screen flex flex-col text-slate-800 transition-colors ${webBg.url ? 'bg-transparent' : 'bg-[#fdf9f8]'}`}>
      {/* Dynamic Full Web Background (Video MP4/WebM/YouTube/Blob or Image/GIF) */}
      {webBg.url && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {(() => {
            const ytId = getYouTubeId(webBg.url);
            const isVideoMode =
              webBg.mode === 'video' ||
              webBg.type === 'video' ||
              ytId !== null ||
              webBg.url.startsWith('blob:') ||
              webBg.url.includes('video/') ||
              webBg.url.endsWith('.mp4') ||
              webBg.url.endsWith('.webm');

            if (ytId) {
              return (
                <iframe
                  key={ytId}
                  src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&playsinline=1&enablejsapi=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1`}
                  title="YouTube background video"
                  className="w-[120vw] h-[120vh] min-w-[100vw] min-h-[100vh] fixed -top-[10vh] -left-[10vw] object-cover pointer-events-none border-0"
                  style={{
                    filter: webBg.blur ? `blur(${webBg.blur}px)` : undefined,
                    opacity: webBg.opacity ?? 1,
                  }}
                />
              );
            }

            if (isVideoMode) {
              return (
                <video
                  key={webBg.url}
                  ref={(el) => {
                    if (el) {
                      el.muted = true;
                      el.play().catch(() => {});
                    }
                  }}
                  src={webBg.url}
                  autoPlay
                  loop={webBg.loop !== false}
                  muted
                  playsInline
                  preload="auto"
                  onLoadedData={(e) => {
                    e.currentTarget.muted = true;
                    e.currentTarget.play().catch(() => {});
                  }}
                  onCanPlay={(e) => {
                    e.currentTarget.muted = true;
                    e.currentTarget.play().catch(() => {});
                  }}
                  className="w-full h-full object-cover fixed inset-0 pointer-events-none"
                  style={{
                    filter: webBg.blur ? `blur(${webBg.blur}px)` : undefined,
                    transform: webBg.blur ? 'scale(1.04)' : undefined,
                    opacity: webBg.opacity ?? 1,
                  }}
                />
              );
            }

            return (
              <div
                key={webBg.url}
                className="w-full h-full bg-cover bg-center bg-no-repeat fixed inset-0 transition-all duration-500 pointer-events-none"
                style={{
                  backgroundImage: `url(${webBg.url})`,
                  filter: webBg.blur ? `blur(${webBg.blur}px)` : undefined,
                  transform: webBg.blur ? 'scale(1.04)' : undefined,
                  opacity: webBg.opacity ?? 1,
                }}
              />
            );
          })()}
        </div>
      )}

      {/* Background Tint Overlay for crisp text legibility */}
      {webBg.url && webBg.overlayTint && webBg.overlayTint !== 'none' && (
        <div
          className={`fixed inset-0 pointer-events-none z-0 transition-all duration-300 ${
            webBg.overlayTint === 'peach'
              ? 'bg-gradient-to-b from-[#fff5ee]/35 via-[#ffe8dc]/25 to-[#fff8f2]/35'
              : webBg.overlayTint === 'lavender'
              ? 'bg-gradient-to-b from-[#faf5ff]/35 via-[#f3e8ff]/25 to-[#fdf4ff]/35'
              : 'bg-gradient-to-b from-[#fff0f3]/35 via-[#ffe4e9]/25 to-[#fff5f7]/35'
          }`}
        />
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Relative Container above z-0 Background */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Top Bar Navigation matching mockup */}
        <Navbar
        currentPage={currentPage}
        onNavigate={(p) => setCurrentPage(p)}
        onOpenAddModal={() => {
          setEditingCharacter(null);
          setModalDefaultGenre('');
          setIsAddModalOpen(true);
        }}
        onOpenIntroModal={() => setIsIntroModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        isAdmin={isAdmin}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        favoritesCount={favorites.size}
        onFilterFavorites={() => setShowingFavoritesOnly((prev) => !prev)}
        showingFavoritesOnly={showingFavoritesOnly}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onScrollToRoster={scrollToRoster}
        onScrollToFlavors={scrollToFlavors}
        onScrollToGenres={scrollToGenres}
        siteLogo={siteLogo}
      />

      {/* Main Content Area */}
      <main className="flex-1 space-y-4">
        {currentPage === 'home' && (
          <>
            {/* Hero Section matching mockup */}
            <HeroBanner
              polaroidPhoto={heroPolaroidPhoto}
              isAdmin={isAdmin}
              onOpenAdminPolaroid={() => {
                setAdminInitialTab('polaroid');
                setIsAdminModalOpen(true);
              }}
              onOpenAddModal={() => {
                setEditingCharacter(null);
                setIsAddModalOpen(true);
              }}
              onOpenIntroModal={() => setIsIntroModalOpen(true)}
              onOpenFeedbackModal={() => {
                setCurrentPage('feedback');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onScrollToRoster={scrollToRoster}
            />

            {/* Teaser Banner to Lucky Candy Page matching mockup */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
              <div
                onClick={() => {
                  sound.playPop();
                  setCurrentPage('lucky-candy');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative bg-gradient-to-r from-[#fff5f6] via-white to-[#fff2f4] rounded-3xl border border-[#fac8d1] p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-500 flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform">
                    🍬
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#b53457] uppercase tracking-wider">
                        🎁 Hũ Kẹo Bất Ngờ — Bốc Kẹo Duyên Định
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700">
                        ✨ Rút ngẫu nhiên
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">
                      Mỗi viên kẹo là một tâm hồn chờ bạn mở lòng
                    </h3>
                    <p className="text-xs text-slate-500">
                      Chạm vào hũ kẹo thần kỳ để rút ngẫu nhiên nhân vật ngọt ngào đồng hành cùng nàng hôm nay!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] shadow-xs group-hover:shadow-md transition-all">
                    🍓 Bốc kẹo ngay
                  </span>
                </div>
              </div>
            </section>

            {/* Section: Ổ kẹo (nhân vật) & Hương vị kẹo hôm nay */}
            <section id="roster" className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
              
              {/* Section Header matching mockup line */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5364]" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                    Ổ kẹo (nhân vật) & Hương vị kẹo hôm nay
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      scrollToRoster();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#b53457] hover:bg-[#fff0f2] rounded-xl border border-rose-100 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Danh mục nhân vật ({characters.length})</span>
                  </button>

                  {characters.length > 0 && (
                    <div className="flex items-center p-0.5 bg-white border border-rose-100 rounded-xl shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playPop();
                          setViewMode('grid');
                        }}
                        className={`p-1.5 rounded-lg text-xs ${
                          viewMode === 'grid' ? 'bg-[#ff5364] text-white' : 'text-slate-500'
                        }`}
                        title="Lưới thẻ"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playPop();
                          setViewMode('cinema');
                        }}
                        className={`p-1.5 rounded-lg text-xs ${
                          viewMode === 'cinema' ? 'bg-[#ff5364] text-white' : 'text-slate-500'
                        }`}
                        title="Điện ảnh"
                      >
                        <Film className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Roster Showcase or Empty State matching mockup */}
              {characters.length === 0 ? (
                /* EXACT Empty State Box from User Mockup */
                <div className="bg-white rounded-3xl border border-[#fae2e5] p-12 sm:p-20 text-center space-y-4 shadow-2xs">
                  
                  {/* Circular Candy Icon in pink halo */}
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#fff0f3] flex items-center justify-center text-[#ff5364] shadow-xs">
                    <Candy className="w-8 h-8 fill-rose-200" />
                  </div>

                  {/* Title & Description matching screenshot */}
                  <div className="space-y-1.5 max-w-lg mx-auto">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                      Chưa có nhân vật nào ghé thăm
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                      {isAdmin
                        ? 'Ổ kẹo đang trống. Wyn có thể nhấn nút bên dưới để đúc viên kẹo nhân vật đầu tiên nhé! ✨'
                        : 'Các vị kẹo ngọt ngào đang được Wyn ấp ủ và pha chế. Hãy đón chờ nhé! 🍬'}
                    </p>
                  </div>

                  {/* Gradient Button: ONLY visible to Admin */}
                  {isAdmin && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playChime();
                          setIsAdminModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-7 py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#ff5364] via-[#ff6b57] to-[#ff7d45] hover:opacity-95 rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Đúc nhân vật kẹo mới (Admin) ✨</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : filteredCharacters.length === 0 ? (
                /* Filter miss state */
                <div className="bg-white rounded-3xl border border-[#fae2e5] p-12 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                    <Candy className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    Không tìm thấy nhân vật theo bộ lọc này
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGenre('Tất cả');
                      setSelectedFlavor('Tất cả');
                      setShowingFavoritesOnly(false);
                    }}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#ff5364] hover:bg-rose-600 rounded-xl"
                  >
                    Xem tất cả {characters.length} nhân vật
                  </button>
                </div>
              ) : viewMode === 'cinema' ? (
                /* Cinema Spotlight Mode */
                <CinemaSpotlight
                  characters={filteredCharacters}
                  selectedIndex={cinemaIndex}
                  onSelectIndex={setCinemaIndex}
                  onViewDetails={(char) => setSelectedCharacter(char)}
                  onToggleFavorite={handleToggleFavorite}
                  onCopyFirstMessage={handleCopyFirstMessage}
                  onCopyLink={handleCopyLink}
                  favorites={favorites}
                  onTasted={handleTastedCharacter}
                  isAdmin={isAdmin}
                  onEdit={(char) => {
                    setEditingCharacter(char);
                    setIsAddModalOpen(true);
                  }}
                  onDelete={handleDeleteCharacter}
                />
              ) : (
                /* Card Grid View Mode */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredCharacters.map((character) => (
                    <CharacterCard
                      key={character.id}
                      character={character}
                      onSelect={(char) => setSelectedCharacter(char)}
                      onToggleFavorite={handleToggleFavorite}
                      onCopyFirstMessage={handleCopyFirstMessage}
                      onCopyLink={handleCopyLink}
                      isFavorite={favorites.has(character.id)}
                      onTasted={handleTastedCharacter}
                      isAdmin={isAdmin}
                      onEdit={(char, e) => {
                        e.stopPropagation();
                        setEditingCharacter(char);
                        setIsAddModalOpen(true);
                      }}
                      onDelete={(id, e) => {
                        e.stopPropagation();
                        handleDeleteCharacter(id);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Flavor Guide section */}
            {characters.length > 0 && (
              <FlavorGuide
                onSelectFlavor={(keyword) => {
                  setSelectedFlavor(keyword);
                  scrollToRoster();
                }}
              />
            )}
          </>
        )}

        {/* Dedicated Góc Feedback Page */}
        {currentPage === 'feedback' && (
          <FeedbackPage
            characters={characters}
            onBackToHome={() => {
              setCurrentPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onToast={showToast}
            isAdmin={isAdmin}
          />
        )}

        {/* Dedicated Thể Loại Page */}
        {currentPage === 'genres' && (
          <GenresPage
            characters={characters}
            onBackToHome={() => {
              setCurrentPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectCharacter={(char) => setSelectedCharacter(char)}
            onOpenAddModalWithGenre={(genreName) => {
              setEditingCharacter(null);
              setModalDefaultGenre(genreName);
              setIsAddModalOpen(true);
            }}
            onToast={showToast}
            isAdmin={isAdmin}
          />
        )}

        {/* Dedicated Bốc Kẹo Ngon (Nhân Vật) Page */}
        {currentPage === 'lucky-candy' && (
          <LuckyCandyPage
            characters={characters}
            onBackToHome={() => {
              setCurrentPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectCharacter={(char) => setSelectedCharacter(char)}
            onOpenAddModal={() => {
              setIsAdminModalOpen(true);
            }}
            onToast={showToast}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={(id) => favorites.has(id)}
            isAdmin={isAdmin}
            onTasted={handleTastedCharacter}
          />
        )}
      </main>

      {/* Detailed Character Modal */}
      <CharacterDetailModal
        character={selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
        onToggleFavorite={handleToggleFavorite}
        onCopyFirstMessage={handleCopyFirstMessage}
        onCopyLink={handleCopyLink}
        onEdit={(char) => {
          setSelectedCharacter(null);
          setIsAdminModalOpen(true);
        }}
        onDelete={handleDeleteCharacter}
        onNext={handleNextDetail}
        onPrev={handlePrevDetail}
        isFavorite={selectedCharacter ? favorites.has(selectedCharacter.id) : false}
        totalCharacters={filteredCharacters.length}
        currentIndex={currentDetailIndex}
        isAdmin={isAdmin}
        onTasted={handleTastedCharacter}
      />

      {/* Add / Edit Character Form Modal (Guarded for Admin if ever invoked) */}
      {isAdmin && (
        <CharacterFormModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingCharacter(null);
            setModalDefaultGenre('');
          }}
          onSave={handleSaveCharacter}
          initialData={editingCharacter}
          defaultGenre={modalDefaultGenre}
        />
      )}

      {/* Welcome Gate / Entrance Loading Modal matching user design */}
      <WelcomeGateModal
        isOpen={isWelcomeGateOpen}
        onEnter={() => setIsWelcomeGateOpen(false)}
        siteLogo={siteLogo}
      />

      {/* Wyn's Personal Whisper Modal */}
      <WynIntroModal
        isOpen={isIntroModalOpen}
        onClose={() => setIsIntroModalOpen(false)}
      />

      {/* Admin Modal protected with Passcode 9512 matching image_f80f32f1.png */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        characters={characters}
        onSaveCharacter={handleSaveCharacter}
        onDeleteCharacter={handleDeleteCharacter}
        onExport={handleExport}
        onImport={handleImportTrigger}
        onClearAll={handleClearAll}
        onToast={showToast}
        siteLogo={siteLogo}
        onUpdateLogo={handleUpdateSiteLogo}
        webBg={webBg}
        onUpdateWebBg={handleUpdateWebBg}
        floatingConfig={floatingConfig}
        onUpdateFloatingConfig={handleUpdateFloatingConfig}
        heroPolaroidPhoto={heroPolaroidPhoto}
        onUpdateHeroPolaroidPhoto={handleUpdateHeroPolaroidPhoto}
        initialTab={adminInitialTab}
      />

      {/* Floating Particles Animation Layer & Interactive Widget */}
      <FloatingParticles
        config={floatingConfig}
        onUpdateConfig={handleUpdateFloatingConfig}
      />

      {/* Spinning Music Player in the Corner with Autoplay */}
      <SpinningMusicPlayer autoPlayTrigger={!isWelcomeGateOpen} />

      {/* Toast Feedback */}
      <Toast message={toastMessage} />

      {/* Footer */}
      <Footer />
      </div>
    </div>
  );
}
