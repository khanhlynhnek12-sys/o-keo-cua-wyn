import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  ShieldCheck,
  Plus,
  Trash2,
  Download,
  Upload,
  LogOut,
  Sparkles,
  Megaphone,
  Image as ImageIcon,
  Palette,
  Eye,
  EyeOff,
  KeyRound,
  RotateCcw,
  Check,
  ExternalLink,
  MessageCircle,
  Tag,
  Radio,
  Candy,
  UploadCloud,
  Film,
  CheckCircle2,
  Sliders,
  RefreshCw,
  Layers,
  Pencil,
  Heart,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { Character } from '../types/character';
import { PRESET_GENRES } from '../data/genres';
import {
  saveCustomGenresToFirestore,
  subscribeCustomGenres,
  saveWynAvatarToFirestore,
  subscribeWynAvatar,
} from '../firebase/services';
import { WebBackgroundConfig, DEFAULT_WEB_BG, OverlayTint } from '../types/settings';
import { compressMediaFile, formatBytes } from '../utils/imageCompressor';
import { AVAILABLE_EFFECTS, HEART_PALETTES, HeartPalette } from './FloatingParticles';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  characters: Character[];
  onSaveCharacter: (char: Character) => void;
  onDeleteCharacter: (id: string) => void;
  onExport: () => void;
  onImport: () => void;
  onClearAll: () => void;
  onToast: (msg: string) => void;
  siteLogo?: string | null;
  onUpdateLogo?: (logo: string | null) => void;
  webBg?: WebBackgroundConfig;
  onUpdateWebBg?: (bg: WebBackgroundConfig, rawBlob?: Blob) => void;
  floatingConfig?: any;
  onUpdateFloatingConfig?: (cfg: any) => void;
  heroPolaroidPhoto?: string;
  onUpdateHeroPolaroidPhoto?: (photo: string) => void;
  initialTab?: AdminTab;
}

type AdminTab = 'create' | 'announcement' | 'background' | 'avatar' | 'polaroid' | 'manage';

const PRESET_AVATARS = [
  { label: 'Liên Vũ (Dâu tây)', path: '/src/assets/images/wyn_char_lian_1793720549992.jpg' },
  { label: 'Dạ Thần (Việt quất)', path: '/src/assets/images/wyn_char_kaelen_1793720550098.jpg' },
  { label: 'Lâm Miêu (Bạc hà)', path: '/src/assets/images/wyn_char_mio_1793720551324.jpg' },
  { label: 'Bạch Dạ Dạ (Kẹo bông)', path: '/src/assets/images/wyn_char_sylvie_1793720552627.jpg' },
  { label: 'Tiểu Đường (Mật đào)', path: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80' },
  { label: 'Hàn Dạ (Sô-cô-la)', path: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80' },
];

const PRESET_POLAROID_PHOTOS = [
  {
    label: 'Thỏ Con & Kẹo Bông (Mặc định)',
    tag: 'Coquette Y2K',
    url: '/assets/aistudio/hero_bedroom_photo.png',
    thumb: '/assets/aistudio/hero_bedroom_photo.png',
  },
  {
    label: 'Phòng Ngủ Dâu Tây Pastel',
    tag: 'Strawberry Gingham',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Mộng Mơ Ánh Sao Fairy',
    tag: 'Dreamy Fairy',
    url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4b12?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1540518614846-7ede433c4b12?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Góc Trú Ẩn Kẹo Ngọt Nơ Ren',
    tag: 'Sweet Sanctuary',
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
  },
];

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  setIsAdmin,
  characters,
  onSaveCharacter,
  onDeleteCharacter,
  onExport,
  onImport,
  onClearAll,
  onToast,
  siteLogo,
  onUpdateLogo,
  webBg,
  onUpdateWebBg,
  floatingConfig,
  onUpdateFloatingConfig,
  heroPolaroidPhoto,
  onUpdateHeroPolaroidPhoto,
  initialTab,
}) => {
  // Passcode verification (hidden & masked)
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [savedPasscode, setSavedPasscode] = useState(() => {
    try {
      return localStorage.getItem('wyn_admin_passcode') || '9512';
    } catch {
      return '9512';
    }
  });
  const [isChangingPasscode, setIsChangingPasscode] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [showNewPasscode, setShowNewPasscode] = useState(false);

  // Active admin tab matching mockup: 'create' = Tạo nhân vật mới
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || 'create');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Polaroid Photo State & Handlers
  const [heroPhoto, setHeroPhoto] = useState<string>(() => {
    return heroPolaroidPhoto || '/assets/aistudio/hero_bedroom_photo.png';
  });
  const [heroPhotoUrlInput, setHeroPhotoUrlInput] = useState<string>('');
  const [isCompressingHeroPhoto, setIsCompressingHeroPhoto] = useState<boolean>(false);
  const heroPhotoFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (heroPolaroidPhoto) {
      setHeroPhoto(heroPolaroidPhoto);
    }
  }, [heroPolaroidPhoto]);

  const handleHeroPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playPop();
    setIsCompressingHeroPhoto(true);

    try {
      const result = await compressMediaFile(file, 800, 800, 0.88);
      const optimized = result.dataUrl;

      setHeroPhoto(optimized);
      if (onUpdateHeroPolaroidPhoto) {
        onUpdateHeroPolaroidPhoto(optimized);
      }
      onToast('Đã tải lên và thay ảnh khung Polaroid thành công! ✨');
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setHeroPhoto(result);
          if (onUpdateHeroPolaroidPhoto) {
            onUpdateHeroPolaroidPhoto(result);
          }
          onToast('Đã tải lên ảnh khung Polaroid thành công! ✨');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingHeroPhoto(false);
      if (heroPhotoFileInputRef.current) {
        heroPhotoFileInputRef.current.value = '';
      }
    }
  };

  const handleApplyHeroPhotoUrl = () => {
    if (!heroPhotoUrlInput.trim()) return;
    sound.playChime();
    const cleanUrl = heroPhotoUrlInput.trim();
    setHeroPhoto(cleanUrl);
    if (onUpdateHeroPolaroidPhoto) {
      onUpdateHeroPolaroidPhoto(cleanUrl);
    }
    setHeroPhotoUrlInput('');
    onToast('Đã cập nhật ảnh khung Polaroid từ URL thành công! ✨');
  };

  const handleResetHeroPhoto = () => {
    sound.playPop();
    const defaultPhoto = '/assets/aistudio/hero_bedroom_photo.png';
    setHeroPhoto(defaultPhoto);
    if (onUpdateHeroPolaroidPhoto) {
      onUpdateHeroPolaroidPhoto(defaultPhoto);
    }
    onToast('Đã khôi phục ảnh khung Polaroid về mặc định! 🎀');
  };

  // Form states matching image_f80f32f1.png exactly:
  const [editingId, setEditingId] = useState<string | null>(null);
  const [charAvatar, setCharAvatar] = useState<string>('');
  const [charName, setCharName] = useState<string>('');
  const [charTagline, setCharTagline] = useState<string>('');
  const [charSweetFlavor, setCharSweetFlavor] = useState<string>('');
  const [charSweetness, setCharSweetness] = useState<number>(5);
  const [charFirstMessage, setCharFirstMessage] = useState<string>('');
  const [charBackstory, setCharBackstory] = useState<string>('');
  const [charLink, setCharLink] = useState<string>('');
  const [charGenre, setCharGenre] = useState<string>('Thanh mai trúc mã');
  const [customGenres, setCustomGenres] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wyn_custom_genres');
      if (saved) return JSON.parse(saved);
    } catch {
      //
    }
    return [];
  });
  const [newGenreInput, setNewGenreInput] = useState<string>('');

  const allAvailableGenres = React.useMemo(() => {
    const list: { name: string; emoji: string }[] = PRESET_GENRES.map((g) => ({
      name: g.name,
      emoji: g.emoji,
    }));

    customGenres.forEach((cg) => {
      if (!list.some((item) => item.name.toLowerCase() === cg.toLowerCase())) {
        list.push({ name: cg, emoji: '✨' });
      }
    });

    characters.forEach((c) => {
      if (c.genre) {
        c.genre.split('·').forEach((part) => {
          const trimmed = part.trim();
          if (trimmed && !list.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())) {
            list.push({ name: trimmed, emoji: '🍓' });
          }
        });
      }
    });

    return list;
  }, [customGenres, characters]);

  const handleToggleGenreTag = (genreName: string) => {
    sound.playPop();
    const currentTags = charGenre
      .split('·')
      .map((s) => s.trim())
      .filter(Boolean);

    const exists = currentTags.some((t) => t.toLowerCase() === genreName.toLowerCase());
    if (exists) {
      const updated = currentTags.filter((t) => t.toLowerCase() !== genreName.toLowerCase());
      setCharGenre(updated.join(' · '));
    } else {
      const updated = [...currentTags, genreName];
      setCharGenre(updated.join(' · '));
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeCustomGenres((remoteGenres) => {
      if (Array.isArray(remoteGenres)) {
        setCustomGenres(remoteGenres);
        try {
          localStorage.setItem('wyn_custom_genres', JSON.stringify(remoteGenres));
        } catch {
          //
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddCustomGenre = () => {
    const trimmed = newGenreInput.trim();
    if (!trimmed) {
      onToast('Vui lòng nhập tên thể loại mới!');
      return;
    }
    sound.playSuccess();

    if (!customGenres.some((g) => g.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...customGenres, trimmed];
      setCustomGenres(updated);
      saveCustomGenresToFirestore(updated).catch(() => {});
      try {
        localStorage.setItem('wyn_custom_genres', JSON.stringify(updated));
      } catch {
        //
      }
    }

    handleToggleGenreTag(trimmed);
    setNewGenreInput('');
    onToast(`Đã thêm thể loại mới "${trimmed}" vào danh sách (Đồng bộ Cloud)! ✨`);
  };

  // Live Card Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Hidden file input for character avatar upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Web Background Management State (matching image_52551d12.png)
  const [bgMode, setBgMode] = useState<'video' | 'image'>(webBg?.mode || 'video');
  const [bgUrl, setBgUrl] = useState<string>(webBg?.url || '');
  const [bgOpacity, setBgOpacity] = useState<number>(webBg?.opacity ?? 0.45);
  const [bgOverlayTint, setBgOverlayTint] = useState<OverlayTint>(webBg?.overlayTint || 'pink');
  const [bgLoop, setBgLoop] = useState<boolean>(webBg?.loop !== false);
  const [bgSelectedFileName, setBgSelectedFileName] = useState<string>('');
  const [isDraggingBg, setIsDraggingBg] = useState(false);
  const [isCompressingBg, setIsCompressingBg] = useState(false);
  const [bgCompressionBadge, setBgCompressionBadge] = useState<string | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync when webBg changes
  useEffect(() => {
    if (webBg) {
      setBgMode(webBg.mode || 'video');
      setBgUrl(webBg.url || '');
      setBgOpacity(webBg.opacity ?? 0.45);
      setBgOverlayTint(webBg.overlayTint || 'pink');
      setBgLoop(webBg.loop !== false);
      if (webBg.name) setBgSelectedFileName(webBg.name);
    }
  }, [webBg]);

  // Avatar & Logo Management State (matching image_a60a77eb.png)
  const [wynAvatar, setWynAvatar] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('wyn_admin_avatar') ||
        '/src/assets/images/wyn_char_lian_1793720549992.jpg'
      );
    } catch {
      return '/src/assets/images/wyn_char_lian_1793720549992.jpg';
    }
  });
  const [wynAvatarUrlInput, setWynAvatarUrlInput] = useState('');
  const [isCompressingWynAvatar, setIsCompressingWynAvatar] = useState(false);
  const wynAvatarFileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentSiteLogo, setCurrentSiteLogo] = useState<string | null>(siteLogo || null);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isCompressingLogo, setIsCompressingLogo] = useState(false);
  const [logoCompressionBadge, setLogoCompressionBadge] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCurrentSiteLogo(siteLogo || null);
  }, [siteLogo]);

  // Extra Tab Settings: Announcement & Signature
  const [announcementText, setAnnouncementText] = useState(() => {
    try {
      return localStorage.getItem('wyn_admin_announcement') || 'Chiếc ổ này có đủ vị kẹo, từ ngọt ngào đến đắng cay. Chúc các nàng một ngày ngập tràn ngọt ngào!';
    } catch {
      return '';
    }
  });

  const [wynSignature, setWynSignature] = useState(() => {
    try {
      return localStorage.getItem('wyn_admin_signature') || 'Wyn 🌸 (Chủ tiệm kẹo)';
    } catch {
      return 'Wyn 🌸 (Chủ tiệm kẹo)';
    }
  });

  useEffect(() => {
    const unsubscribe = subscribeWynAvatar((remoteAvatar) => {
      if (remoteAvatar) {
        setWynAvatar(remoteAvatar);
        try {
          localStorage.setItem('wyn_admin_avatar', remoteAvatar);
        } catch {
          //
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveCode = localStorage.getItem('wyn_admin_passcode') || '9512';
    if (pin.trim() === effectiveCode) {
      sound.playSuccess();
      setIsAdmin(true);
      setPin('');
      setShowPin(false);
      setPinError(false);
      try {
        sessionStorage.setItem('wyn_admin_auth', 'true');
      } catch {
        //
      }
      onToast('Chào mừng Wyn trở lại bảng quản trị! 👑✨');
    } else {
      sound.playPop();
      setPinError(true);
      onToast('Mật mã không chính xác! Vui lòng thử lại.');
    }
  };

  const handleUpdatePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasscode.trim()) {
      onToast('Vui lòng nhập mật mã mới!');
      return;
    }
    try {
      localStorage.setItem('wyn_admin_passcode', newPasscode.trim());
      setSavedPasscode(newPasscode.trim());
      setNewPasscode('');
      setShowNewPasscode(false);
      setIsChangingPasscode(false);
      sound.playSuccess();
      onToast('Đã đổi mật mã quản trị mới thành công! 🔐');
    } catch {
      onToast('Không thể lưu mật mã mới!');
    }
  };

  const handleLogout = () => {
    sound.playPop();
    setIsAdmin(false);
    setPin('');
    try {
      sessionStorage.removeItem('wyn_admin_auth');
    } catch {
      //
    }
    onToast('Đã khóa chế độ quản trị viên.');
    onClose();
  };

  // Background media handler with auto-compression & drag-and-drop support
  const handleBgFile = async (file: File) => {
    if (!file) return;
    setIsCompressingBg(true);
    setBgCompressionBadge(null);
    setBgSelectedFileName(file.name);
    try {
      const isVideo = file.type.startsWith('video/');
      const isGif = file.type === 'image/gif';

      const result = await compressMediaFile(file, 1600, 900, 0.75);
      const detectedType: 'video' | 'gif' | 'image' = isVideo ? 'video' : isGif ? 'gif' : 'image';
      const detectedMode: 'video' | 'image' = isVideo ? 'video' : 'image';

      setBgMode(detectedMode);
      setBgUrl(result.dataUrl);

      const updatedConfig: WebBackgroundConfig = {
        mode: detectedMode,
        type: detectedType,
        url: result.dataUrl,
        opacity: bgOpacity,
        blur: 0,
        overlayTint: bgOverlayTint,
        loop: bgLoop,
        name: file.name,
      };

      onUpdateWebBg?.(updatedConfig, result.rawBlob || file);

      if (result.reductionPercent > 0) {
        setBgCompressionBadge(
          `✨ Đã nén giảm ${result.reductionPercent}%: ${formatBytes(result.originalSize)} ➔ ${formatBytes(result.compressedSize)}`
        );
      } else if (isGif) {
        setBgCompressionBadge(
          `🎬 Đã tải ảnh động GIF (${formatBytes(result.originalSize)}) - Bảo toàn chuyển động mượt mà!`
        );
      } else if (isVideo) {
        setBgCompressionBadge(
          `🎥 Video nền MP4/WebM (${formatBytes(result.originalSize)}) tự động chạy lặp!`
        );
      }

      sound.playSuccess();
      onToast(`Đã áp dụng nền web mới (${file.name})! 🖼️✨`);
    } catch {
      sound.playPop();
      onToast('Có lỗi khi xử lý tệp ảnh/video nền!');
    } finally {
      setIsCompressingBg(false);
    }
  };

  const handleApplyBg = (
    customUrl?: string,
    customMode?: 'video' | 'image',
    overrides?: { opacity?: number; overlayTint?: OverlayTint; loop?: boolean },
    quiet = true
  ) => {
    const finalUrl = customUrl !== undefined ? customUrl : bgUrl;
    const finalMode = customMode !== undefined ? customMode : bgMode;
    const finalOpacity = overrides?.opacity !== undefined ? overrides.opacity : bgOpacity;
    const finalOverlayTint = overrides?.overlayTint !== undefined ? overrides.overlayTint : bgOverlayTint;
    const finalLoop = overrides?.loop !== undefined ? overrides.loop : bgLoop;

    const isVideo = finalMode === 'video' || finalUrl.endsWith('.mp4') || finalUrl.endsWith('.webm');
    const isGif = finalUrl.endsWith('.gif') || finalUrl.includes('image/gif');

    const updatedConfig: WebBackgroundConfig = {
      mode: finalMode,
      type: finalUrl ? (isVideo ? 'video' : isGif ? 'gif' : 'image') : 'none',
      url: finalUrl,
      opacity: finalOpacity,
      blur: 0,
      overlayTint: finalOverlayTint,
      loop: finalLoop,
      name: finalUrl ? 'Nền tùy biến của Wyn' : 'Mặc định',
    };

    onUpdateWebBg?.(updatedConfig);
    if (!quiet) {
      sound.playSuccess();
      onToast('Đã lưu & áp dụng nền mới cho toàn bộ trang web! 🖼️✨');
    }
  };

  const handleResetBg = () => {
    setBgUrl('');
    setBgSelectedFileName('');
    setBgCompressionBadge(null);
    onUpdateWebBg?.(DEFAULT_WEB_BG);
    sound.playPop();
    onToast('Đã đặt lại hình nền web về màu hồng pastel mặc định! 🌸');
  };

  // Wyn Personal Avatar Handler with auto-compression
  const handleWynAvatarFile = async (file: File) => {
    if (!file) return;
    setIsCompressingWynAvatar(true);
    try {
      const result = await compressMediaFile(file, 400, 400, 0.88);
      setWynAvatar(result.dataUrl);
      saveWynAvatarToFirestore(result.dataUrl).catch(() => {});
      try {
        localStorage.setItem('wyn_admin_avatar', result.dataUrl);
      } catch {
        //
      }
      sound.playSuccess();
      onToast('Đã cập nhật ảnh đại diện của nàng Wyn thành công (Đồng bộ Cloud)! 🎀');
    } catch {
      onToast('Không thể tải ảnh đại diện Wyn!');
    } finally {
      setIsCompressingWynAvatar(false);
    }
  };

  const handleApplyWynAvatarUrl = () => {
    if (!wynAvatarUrlInput.trim()) {
      onToast('Vui lòng nhập URL ảnh đại diện!');
      return;
    }
    const cleanUrl = wynAvatarUrlInput.trim();
    setWynAvatar(cleanUrl);
    saveWynAvatarToFirestore(cleanUrl).catch(() => {});
    try {
      localStorage.setItem('wyn_admin_avatar', cleanUrl);
    } catch {
      //
    }
    setWynAvatarUrlInput('');
    sound.playSuccess();
    onToast('Đã cập nhật ảnh đại diện Wyn qua URL (Đồng bộ Cloud)! 🎀');
  };

  // Navbar Corner Logo Handler with auto-compression
  const handleLogoFile = async (file: File) => {
    if (!file) return;
    setIsCompressingLogo(true);
    setLogoCompressionBadge(null);
    try {
      const result = await compressMediaFile(file, 300, 300, 0.85);
      setCurrentSiteLogo(result.dataUrl);
      onUpdateLogo?.(result.dataUrl);

      if (result.reductionPercent > 0) {
        setLogoCompressionBadge(
          `✨ Đã nén ${result.reductionPercent}%: ${formatBytes(result.originalSize)} ➔ ${formatBytes(result.compressedSize)}`
        );
      }
      sound.playSuccess();
      onToast('Đã đổi Logo ở góc cạnh tên web thành công! 🍭✨');
    } catch {
      sound.playPop();
      onToast('Có lỗi khi xử lý tệp ảnh logo!');
    } finally {
      setIsCompressingLogo(false);
    }
  };

  const handleApplyLogoUrl = () => {
    if (!logoUrlInput.trim()) {
      onToast('Vui lòng nhập URL logo!');
      return;
    }
    setCurrentSiteLogo(logoUrlInput.trim());
    onUpdateLogo?.(logoUrlInput.trim());
    setLogoUrlInput('');
    sound.playSuccess();
    onToast('Đã cập nhật Logo kẹo ở góc cạnh tên web! 🍭');
  };

  const handleResetLogo = () => {
    setCurrentSiteLogo(null);
    onUpdateLogo?.(null);
    setLogoCompressionBadge(null);
    sound.playPop();
    onToast('Đã đặt lại Logo góc cạnh tên web về mặc định! 🍭');
  };

  // Character Avatar upload handler with client-side auto-compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast('Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP)!');
      return;
    }

    try {
      const result = await compressMediaFile(file, 600, 600, 0.8);
      setCharAvatar(result.dataUrl);
      sound.playSuccess();
      onToast(`Đã nén và tải ảnh đại diện nhân vật thành công (${formatBytes(result.compressedSize)})!`);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCharAvatar(dataUrl);
        sound.playSuccess();
        onToast('Đã tải ảnh đại diện nhân vật thành công!');
      };
      reader.readAsDataURL(file);
    } finally {
      e.target.value = '';
    }
  };

  // Reset form
  const handleResetForm = () => {
    sound.playPop();
    setEditingId(null);
    setCharAvatar('');
    setCharName('');
    setCharTagline('');
    setCharSweetFlavor('');
    setCharSweetness(5);
    setCharFirstMessage('');
    setCharBackstory('');
    setCharLink('');
    setCharGenre('Thanh mai trúc mã');
    onToast('Đã xóa biểu mẫu.');
  };

  // Load existing character to edit
  const handleEditCharacter = (char: Character) => {
    sound.playPop();
    setEditingId(char.id);
    setCharAvatar(char.avatar);
    setCharName(char.name);
    setCharTagline(char.tagline || '');
    setCharSweetFlavor(char.sweetFlavor || '');
    setCharSweetness(char.sweetFlavor?.includes('1') ? 1 : 5);
    setCharFirstMessage(char.firstMessage || '');
    setCharBackstory(char.backstory || '');
    setCharLink(char.characterLink || '');
    setCharGenre(char.genre || 'Thanh mai trúc mã');
    setActiveTab('create');
    onToast(`Đang chỉnh sửa nhân vật: ${char.name}`);
  };

  // Submit & Publish character
  const handleSaveAndPublish = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!charName.trim()) {
      sound.playPop();
      onToast('Vui lòng nhập Tên nhân vật!');
      return;
    }

    if (!charFirstMessage.trim()) {
      sound.playPop();
      onToast('Vui lòng điền Tin nhắn đầu tiên (First Whisper)!');
      return;
    }

    if (!charBackstory.trim()) {
      sound.playPop();
      onToast('Vui lòng điền Cốt truyện & Xuất thân (Backstory)!');
      return;
    }

    const finalAvatar =
      charAvatar.trim() ||
      PRESET_AVATARS[0].path;

    const newChar: Character = {
      id: editingId || `char-${Date.now()}`,
      name: charName.trim(),
      tagline: charTagline.trim() || 'Một viên kẹo ngọt ngào trong Ổ kẹo của Wyn',
      sweetFlavor: charSweetFlavor.trim() || `Kẹo ngọt ${charSweetness}/5 kẹo`,
      genre: charGenre.trim() || 'Thanh mai trúc mã',
      avatar: finalAvatar,
      firstMessage: charFirstMessage.trim(),
      backstory: charBackstory.trim(),
      characterLink: charLink.trim() || '',
      personalityTraits: ['Ngọt ngào', 'Ấm áp', 'Dịu dàng'],
      tastedCount: (editingId ? characters.find((c) => c.id === editingId)?.tastedCount : 0) || 0,
      themeColor: {
        bgGradient: 'from-pink-500/10 to-rose-500/10',
        badgeBg: 'bg-rose-100',
        badgeText: 'text-rose-700',
        borderActive: 'border-rose-400',
        accent: '#ff5364',
        softGlow: 'rgba(255, 83, 100, 0.25)',
      },
    };

    sound.playSuccess();
    onSaveCharacter(newChar);
    onToast(
      editingId
        ? `Đã cập nhật nhân vật "${newChar.name}" thành công! ✨`
        : `Đã đúc và phát hành "${newChar.name}" vào Ổ kẹo! 🍬🎉`
    );

    // Reset after save
    handleResetForm();
  };

  // Save Announcement
  const handleSaveAnnouncement = () => {
    try {
      localStorage.setItem('wyn_admin_announcement', announcementText);
    } catch {
      //
    }
    sound.playSuccess();
    onToast('Đã lưu thông báo mới lên trang!');
  };

  // Save Signature
  const handleSaveSignature = () => {
    try {
      localStorage.setItem('wyn_admin_signature', wynSignature);
    } catch {
      //
    }
    sound.playSuccess();
    onToast('Đã lưu chữ ký và ảnh đại diện của Wyn!');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="relative w-full max-w-5xl bg-[#fdf9f8] rounded-3xl shadow-2xl border border-[#fae2e5] p-4 sm:p-6 md:p-8 z-10 max-h-[94vh] flex flex-col overflow-hidden"
        >
          {/* Top Control Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#fbdde2] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff5364] to-[#ff7d45] flex items-center justify-center text-white shadow-2xs">
                {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  {isAdmin ? 'Trung Tâm Quản Trị Của Wyn' : 'Xác Thực Quản Trị Viên'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isAdmin
                    ? 'Chế độ độc quyền dành cho Wyn để đúc kẹo & điều hành ổ'
                    : 'Nhập mật mã bí mật để mở khóa bảng điều khiển'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-100/60 rounded-xl transition-colors flex items-center gap-1"
                  title="Khóa quản trị"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Khóa lại</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  onClose();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-rose-100/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Hidden File Input for Avatar */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Hidden File Input for Full Web Background (Video, GIF, or Image) */}
          <input
            ref={bgFileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleBgFile(file);
              e.target.value = '';
            }}
            className="hidden"
          />

          {/* Hidden File Input for Wyn Personal Profile Picture */}
          <input
            ref={wynAvatarFileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleWynAvatarFile(file);
              e.target.value = '';
            }}
            className="hidden"
          />

          {/* Hidden File Input for Website Corner Logo */}
          <input
            ref={logoFileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/svg+xml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleLogoFile(file);
              e.target.value = '';
            }}
            className="hidden"
          />

          {/* SCREEN 1: Locked PIN verification */}
          {!isAdmin ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 max-w-sm mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100/70 border border-rose-200 flex items-center justify-center text-[#ff5364] shadow-xs">
                <KeyRound className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-bold text-slate-800">Cổng Quản Trị Viên</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Trang này chỉ dành cho chủ ổ Wyn. Người đọc ghé thăm không có quyền tạo hoặc chỉnh sửa nhân vật.
                </p>
              </div>

              <form onSubmit={handleVerifyPin} className="w-full space-y-3">
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={20}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setPinError(false);
                    }}
                    placeholder="Nhập mật mã quản trị..."
                    autoFocus
                    className={`w-full px-4 py-3 pr-11 text-center text-lg font-mono tracking-widest bg-white border rounded-2xl focus:outline-none transition-all ${
                      pinError
                        ? 'border-red-400 ring-2 ring-red-200 text-red-600'
                        : 'border-[#fac8d1] focus:ring-2 focus:ring-rose-300 text-slate-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      setShowPin(!showPin);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title={showPin ? 'Ẩn mật mã' : 'Hiện mật mã'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {pinError && (
                  <p className="text-xs text-red-500 font-medium">
                    Mật mã không chính xác! Vui lòng thử lại.
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] hover:opacity-95 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Mở Khóa Quản Trị ✨
                </button>
              </form>
            </div>
          ) : (
            /* SCREEN 2: Exact Dashboard from image_f80f32f1.png */
            <div className="flex-1 overflow-y-auto pt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 pr-1">
              
              {/* LEFT SIDEBAR: DANH MỤC ĐIỀU KHIỂN (matching image_f80f32f1.png) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white rounded-3xl border border-[#fae2e5] p-4 sm:p-5 shadow-2xs space-y-3">
                  <h4 className="text-[11px] font-bold text-[#d65174] uppercase tracking-wider">
                    DANH MỤC ĐIỀU KHIỂN
                  </h4>

                  <div className="space-y-2">
                    {/* Item 1: ✨ Tạo nhân vật mới (Active pink-orange gradient) */}
                    <button
                      type="button"
                      onClick={() => {
                        sound.playPop();
                        setActiveTab('create');
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between ${
                        activeTab === 'create'
                          ? 'bg-gradient-to-r from-[#ff5364] to-[#ff7d45] text-white shadow-md'
                          : 'bg-[#fffbfc] hover:bg-[#fff0f2] text-slate-700 border border-[#fce3e7]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">✨</span>
                        <div>
                          <div className={`text-xs font-bold ${activeTab === 'create' ? 'text-white' : 'text-slate-800'}`}>
                            Tạo nhân vật mới
                          </div>
                          <div className={`text-[10px] mt-0.5 ${activeTab === 'create' ? 'text-rose-100' : 'text-slate-400'}`}>
                            Thêm thẻ kẹo & cốt truyện
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Item 2: 📢 Đăng thông báo */}
                    <button
                      type="button"
                      onClick={() => {
                        sound.playPop();
                        setActiveTab('announcement');
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between ${
                        activeTab === 'announcement'
                          ? 'bg-gradient-to-r from-[#ff5364] to-[#ff7d45] text-white shadow-md'
                          : 'bg-[#fffbfc] hover:bg-[#fff0f2] text-slate-700 border border-[#fce3e7]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📢</span>
                        <div>
                          <div className={`text-xs font-bold ${activeTab === 'announcement' ? 'text-white' : 'text-slate-800'}`}>
                            Đăng thông báo
                          </div>
                          <div className={`text-[10px] mt-0.5 ${activeTab === 'announcement' ? 'text-rose-100' : 'text-slate-400'}`}>
                            Banner, popup, tin mật
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Item 3: 🖼️ Đổi ảnh / Video nền */}
                    <button
                      type="button"
                      onClick={() => {
                        sound.playPop();
                        setActiveTab('background');
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between ${
                        activeTab === 'background'
                          ? 'bg-gradient-to-r from-[#ff5364] to-[#ff7d45] text-white shadow-md'
                          : 'bg-[#fffbfc] hover:bg-[#fff0f2] text-slate-700 border border-[#fce3e7]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🖼️</span>
                        <div>
                          <div className={`text-xs font-bold ${activeTab === 'background' ? 'text-white' : 'text-slate-800'}`}>
                            Đổi ảnh / Video nền
                          </div>
                          <div className={`text-[10px] mt-0.5 ${activeTab === 'background' ? 'text-rose-100' : 'text-slate-400'}`}>
                            Hỗ trợ MP4, WebM, Wallpaper
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Item 4: 🎭 Ảnh đại diện & Logo (has pink dot on right) */}
                    <button
                      type="button"
                      onClick={() => {
                        sound.playPop();
                        setActiveTab('avatar');
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between ${
                        activeTab === 'avatar'
                          ? 'bg-gradient-to-r from-[#ff5364] to-[#ff7d45] text-white shadow-md'
                          : 'bg-[#fffbfc] hover:bg-[#fff0f2] text-slate-700 border border-[#fce3e7]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🎭</span>
                        <div>
                          <div className={`text-xs font-bold ${activeTab === 'avatar' ? 'text-white' : 'text-slate-800'}`}>
                            Ảnh đại diện & Logo
                          </div>
                          <div className={`text-[10px] mt-0.5 ${activeTab === 'avatar' ? 'text-rose-100' : 'text-slate-400'}`}>
                            Avatar chủ ổ Wyn & icon web
                          </div>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-[#ff5364]" />
                    </button>

                    {/* Item 5: 🖼️ Khung ảnh Polaroid Trang Chủ */}
                    <button
                      type="button"
                      onClick={() => {
                        sound.playPop();
                        setActiveTab('polaroid');
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between ${
                        activeTab === 'polaroid'
                          ? 'bg-gradient-to-r from-[#ff5364] to-[#ff7d45] text-white shadow-md'
                          : 'bg-[#fffbfc] hover:bg-[#fff0f2] text-slate-700 border border-[#fce3e7]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🎀</span>
                        <div>
                          <div className={`text-xs font-bold ${activeTab === 'polaroid' ? 'text-white' : 'text-slate-800'}`}>
                            Khung ảnh Polaroid
                          </div>
                          <div className={`text-[10px] mt-0.5 ${activeTab === 'polaroid' ? 'text-rose-100' : 'text-slate-400'}`}>
                            Đổi ảnh phòng ngủ trang chủ
                          </div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-100 text-rose-700">Mới ✨</span>
                    </button>

                    {/* Extra item: Quản lý kẹo hiện có */}
                    <button
                      type="button"
                      onClick={() => {
                        sound.playPop();
                        setActiveTab('manage');
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between ${
                        activeTab === 'manage'
                          ? 'bg-gradient-to-r from-[#ff5364] to-[#ff7d45] text-white shadow-md'
                          : 'bg-[#fffbfc] hover:bg-[#fff0f2] text-slate-700 border border-[#fce3e7]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🍬</span>
                        <div>
                          <div className={`text-xs font-bold ${activeTab === 'manage' ? 'text-white' : 'text-slate-800'}`}>
                            Quản lý kẹo ({characters.length})
                          </div>
                          <div className={`text-[10px] mt-0.5 ${activeTab === 'manage' ? 'text-rose-100' : 'text-slate-400'}`}>
                            Chỉnh sửa, xóa & sao lưu JSON
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Bottom Tip Box matching image_f80f32f1.png */}
                <div className="bg-[#fff5f6] rounded-3xl border border-[#fac8d1] p-4 sm:p-5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#b53457]">
                    <span>💡</span>
                    <span>Mẹo kẹo ngọt:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Các thay đổi về video nền và ảnh đại diện sẽ được lưu tự động và cập nhật trực tiếp ra toàn bộ trang người xem.
                  </p>
                </div>

                {/* Passcode Security Card for Wyn (Kept completely hidden) */}
                <div className="bg-white rounded-3xl border border-[#fae2e5] p-4 sm:p-5 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-xs font-bold text-slate-800">Mật mã quản trị</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      Bảo mật ẩn
                    </span>
                  </div>

                  {!isChangingPasscode ? (
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="text-[11px] text-slate-500">
                        Trạng thái: <span className="font-mono font-bold text-slate-700">••••••••</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playPop();
                          setIsChangingPasscode(true);
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                      >
                        Đổi mật mã
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdatePasscode} className="space-y-2 pt-1">
                      <div className="relative">
                        <input
                          type={showNewPasscode ? 'text' : 'password'}
                          value={newPasscode}
                          onChange={(e) => setNewPasscode(e.target.value)}
                          placeholder="Nhập mật mã mới..."
                          className="w-full text-xs px-3 py-2 pr-9 bg-[#fffbfc] border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 font-mono tracking-widest text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPasscode(!showNewPasscode)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title={showNewPasscode ? 'Ẩn' : 'Hiện'}
                        >
                          {showNewPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          className="flex-1 py-1.5 text-[11px] font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] rounded-xl cursor-pointer"
                        >
                          Lưu mã mới
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsChangingPasscode(false);
                            setNewPasscode('');
                          }}
                          className="px-2.5 py-1.5 text-[11px] text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* RIGHT MAIN PANEL: Form or Tab Content matching image_f80f32f1.png */}
              <div className="lg:col-span-8">
                {activeTab === 'create' && (
                  <div className="bg-white rounded-3xl border border-[#fae2e5] p-5 sm:p-7 shadow-2xs space-y-5">
                    {/* Header Row */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#fbe4e8]">
                      <div className="space-y-0.5">
                        <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                          <span className="text-rose-500">🍬</span>
                          <span>
                            {editingId ? 'Chỉnh sửa thẻ nhân vật kẹo ngọt' : 'Tạo thẻ nhân vật kẹo ngọt mới'}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Điền đầy đủ các thông tin để đúc một viên kẹo nhân vật mới vào hũ của Wyn
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          sound.playPop();
                          setIsPreviewOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-200 text-xs font-medium text-slate-700 hover:bg-rose-50 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-rose-500" />
                        <span>Xem trước thẻ</span>
                      </button>
                    </div>

                    {/* Main Form Fields */}
                    <form onSubmit={handleSaveAndPublish} className="space-y-4">
                      {/* Top Row: Avatar Box (left) + Info Inputs (right) */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                        
                        {/* ẢNH ĐẠI DIỆN NHÂN VẬT * (matching dashed container) */}
                        <div className="md:col-span-5 space-y-1.5">
                          <label className="block text-[11px] font-bold text-rose-500 uppercase tracking-wider">
                            ẢNH ĐẠI DIỆN NHÂN VẬT *
                          </label>

                          <div className="relative border-2 border-dashed border-[#fac8d1] rounded-2xl p-4 sm:p-6 bg-[#fffbfc] hover:bg-[#fff5f7] transition-all flex flex-col items-center justify-center text-center group min-h-[220px]">
                            {charAvatar ? (
                              <div className="relative w-full flex flex-col items-center space-y-2">
                                <img
                                  src={charAvatar}
                                  alt="Preview"
                                  className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-2xl border-2 border-rose-200 shadow-sm"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-1 text-[11px] font-semibold text-rose-600 bg-white border border-rose-200 rounded-lg shadow-2xs hover:bg-rose-50"
                                  >
                                    Đổi ảnh
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCharAvatar('')}
                                    className="px-3 py-1 text-[11px] font-semibold text-red-500 bg-white border border-red-200 rounded-lg shadow-2xs hover:bg-red-50"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-14 h-14 rounded-2xl bg-[#fdebf0] flex items-center justify-center text-rose-400 shadow-2xs mb-2">
                                  <Palette className="w-6 h-6" />
                                </div>
                                <div className="text-xs font-bold text-slate-800">
                                  Tải ảnh nhân vật lên
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 mb-3">
                                  Tỷ lệ 1:1 hoặc 3:4 (PNG, JPG)
                                </div>
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="px-4 py-1.5 bg-white border border-[#fac8d1] hover:border-rose-400 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
                                >
                                  Chọn từ máy
                                </button>
                              </>
                            )}
                          </div>

                          {/* Quick preset selector */}
                          <div className="pt-1">
                            <span className="text-[10px] text-slate-400 block mb-1">
                              Hoặc chọn ảnh mẫu nhanh:
                            </span>
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                              {PRESET_AVATARS.map((p, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    sound.playPop();
                                    setCharAvatar(p.path);
                                  }}
                                  className="text-[10px] px-2 py-0.5 bg-white border border-rose-100 hover:border-rose-300 text-slate-600 rounded-lg whitespace-nowrap"
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Inputs Column */}
                        <div className="md:col-span-7 space-y-3">
                          {/* Row 1: Tên nhân vật & Danh xưng */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[11px] font-bold text-slate-700">
                                Tên nhân vật *
                              </label>
                              <input
                                type="text"
                                value={charName}
                                onChange={(e) => setCharName(e.target.value)}
                                placeholder="Ví dụ: Hoàng tử Kẹo Bơ — Cedric"
                                className="w-full px-3.5 py-2 text-xs bg-white border border-[#fac8d1] rounded-xl focus:outline-none focus:border-[#ff5364] text-slate-800 placeholder-slate-400 transition-colors shadow-2xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[11px] font-bold text-slate-700">
                                Danh xưng / Thân phận
                              </label>
                              <input
                                type="text"
                                value={charTagline}
                                onChange={(e) => setCharTagline(e.target.value)}
                                placeholder="Ví dụ: Đại Hoàng Tử Vương Quốc Bơ..."
                                className="w-full px-3.5 py-2 text-xs bg-white border border-[#fac8d1] rounded-xl focus:outline-none focus:border-[#ff5364] text-slate-800 placeholder-slate-400 transition-colors shadow-2xs"
                              />
                            </div>
                          </div>

                          {/* Row 2: Vị kẹo chủ đạo & Độ ngọt ngào slider */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                            <div className="space-y-1">
                              <label className="block text-[11px] font-bold text-slate-700">
                                Vị kẹo chủ đạo 🍬
                              </label>
                              <input
                                type="text"
                                value={charSweetFlavor}
                                onChange={(e) => setCharSweetFlavor(e.target.value)}
                                placeholder="Ví dụ: Kẹo Bơ Sữa Vani"
                                className="w-full px-3.5 py-2 text-xs bg-white border border-[#fac8d1] rounded-xl focus:outline-none focus:border-[#ff5364] text-slate-800 placeholder-slate-400 transition-colors shadow-2xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-700">Độ ngọt ngào</span>
                                <span className="font-bold text-[#b53457]">{charSweetness}/5 kẹo</span>
                              </div>
                              <input
                                type="range"
                                min={1}
                                max={5}
                                step={1}
                                value={charSweetness}
                                onChange={(e) => setCharSweetness(Number(e.target.value))}
                                className="w-full accent-[#ff5364] cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Row 3: Thể loại tag (QTV tự viết hoặc bấm chọn thêm thể loại) */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-bold text-slate-700">
                                Thuộc thể loại *
                              </label>
                              <span className="text-[10px] text-[#ff5364] font-semibold">
                                QTV có thể tự viết hoặc chọn bên dưới
                              </span>
                            </div>

                            {/* Direct editable text input */}
                            <input
                              type="text"
                              value={charGenre}
                              onChange={(e) => setCharGenre(e.target.value)}
                              placeholder="Nhập thể loại (VD: Thanh mai trúc mã · Ngụy côn trùng...)"
                              className="w-full px-3.5 py-2 text-xs bg-white border border-[#fac8d1] rounded-xl focus:outline-none focus:border-[#ff5364] text-slate-800 transition-colors shadow-2xs font-semibold"
                            />

                            {/* Interactive Genre Chips & Add Custom Genre */}
                            <div className="space-y-2 bg-[#fff8f9] p-2.5 rounded-2xl border border-[#fac8d1]">
                              <span className="text-[10px] font-bold text-slate-500 block">
                                Bấm chọn thể loại có sẵn hoặc tự viết thể loại mới:
                              </span>
                              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white rounded-xl border border-rose-100">
                                {allAvailableGenres.map((g) => {
                                  const isSelected = charGenre
                                    .split('·')
                                    .map((s) => s.trim().toLowerCase())
                                    .includes(g.name.toLowerCase());
                                  return (
                                    <button
                                      key={g.name}
                                      type="button"
                                      onClick={() => handleToggleGenreTag(g.name)}
                                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                                        isSelected
                                          ? 'bg-[#ff5364] text-white border-[#ff5364] font-bold shadow-2xs'
                                          : 'bg-rose-50/70 text-slate-700 border-rose-200 hover:border-[#ff5364] hover:text-[#b53457]'
                                      }`}
                                    >
                                      <span>{g.emoji}</span>
                                      <span>{g.name}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Form để QTV viết thêm thể loại mới */}
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  value={newGenreInput}
                                  onChange={(e) => setNewGenreInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddCustomGenre();
                                    }
                                  }}
                                  placeholder="Viết thêm thể loại mới của QTV..."
                                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-rose-200 rounded-xl focus:outline-none focus:border-[#ff5364] text-slate-800 placeholder-slate-400"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddCustomGenre}
                                  className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] hover:opacity-95 rounded-xl shadow-2xs shrink-0 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Thêm thể loại</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Row 4: Tin nhắn đầu (First Whisper) */}
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-700">
                              Tin nhắn đầu (First Whisper) *
                            </label>
                            <textarea
                              rows={3}
                              value={charFirstMessage}
                              onChange={(e) => setCharFirstMessage(e.target.value)}
                              placeholder="Câu chào đầu tiên khi người đọc ghé thăm (VD: Nàng vừa bước vào vườn hoa lúc này sao? Trà hoa hồng đã nguội mất rồi...)"
                              className="w-full px-3.5 py-2 text-xs bg-white border border-[#fac8d1] rounded-xl focus:outline-none focus:border-[#ff5364] text-slate-800 placeholder-slate-400 transition-colors shadow-2xs resize-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Full Width Row: Cốt truyện & Xuất thân (Backstory) */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Cốt truyện & Xuất thân (Backstory) *
                        </label>
                        <textarea
                          rows={4}
                          value={charBackstory}
                          onChange={(e) => setCharBackstory(e.target.value)}
                          placeholder="Kể câu chuyện về nguồn gốc, số phận hoặc tính cách đặc biệt của nhân vật..."
                          className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#fac8d1] rounded-xl focus:outline-none focus:border-[#ff5364] text-slate-800 placeholder-slate-400 transition-colors shadow-2xs resize-none"
                        />
                      </div>

                      {/* Full Width Row: Cổng liên kết trò chuyện */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Cổng liên kết trò chuyện (AI Bot / Link Chat) 🔗
                        </label>
                        <input
                          type="text"
                          value={charLink}
                          onChange={(e) => setCharLink(e.target.value)}
                          placeholder="https://character.ai/chat/..."
                          className="w-full px-3.5 py-2 text-xs bg-white border border-[#fac8d1] rounded-xl focus:outline-none focus:border-[#ff5364] text-slate-800 placeholder-slate-400 transition-colors shadow-2xs"
                        />
                      </div>

                      {/* Bottom Action Buttons matching image_f80f32f1.png */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#fbe4e8]">
                        <button
                          type="button"
                          onClick={handleResetForm}
                          className="px-5 py-2.5 rounded-xl border border-[#fac8d1] text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shadow-2xs"
                        >
                          Xóa biểu mẫu
                        </button>

                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5364] to-[#ff7d45] hover:opacity-95 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 fill-white" />
                          <span>
                            {editingId ? 'Cập nhật nhân vật ✨' : '✨ Lưu & Phát hành nhân vật'}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Tab 2: Announcement */}
                {activeTab === 'announcement' && (
                  <div className="bg-white rounded-3xl border border-[#fae2e5] p-5 sm:p-7 shadow-2xs space-y-4">
                    <div className="pb-2 border-b border-rose-100">
                      <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <span>📢</span>
                        <span>Đăng thông báo & Lời thì thầm trang chủ</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Cập nhật biểu ngữ thông báo nổi bật cho các nàng khi vừa ghé thăm ổ kẹo
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nội dung lời nhắn gửi từ Wyn
                        </label>
                        <textarea
                          rows={4}
                          value={announcementText}
                          onChange={(e) => setAnnouncementText(e.target.value)}
                          className="w-full p-3 text-xs bg-rose-50/30 border border-[#fac8d1] rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-slate-800"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveAnnouncement}
                          className="px-6 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] rounded-xl shadow-xs"
                        >
                          Lưu & Phát hành thông báo ✨
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Background - Matching image_52551d12.png */}
                {activeTab === 'background' && (
                  <div className="bg-white rounded-3xl border border-[#fae2e5] p-5 sm:p-7 shadow-2xs space-y-5">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-rose-100 gap-2">
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                          <span className="text-xl">🎬</span>
                          <span>Thay đổi ảnh nền & Video nền</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tùy biến hình nền toàn trang hoặc nền động dạng Video (MP4 / WebM / YouTube loop)
                        </p>
                      </div>
                      <span className="self-start sm:self-auto text-[11px] font-bold text-[#b52d55] bg-[#fff0f3] border border-[#fbd3db] px-3 py-1 rounded-full whitespace-nowrap shadow-2xs">
                        Hỗ trợ Video nền sống động
                      </span>
                    </div>

                    {/* Mode Selector Radio Cards (Matching image_52551d12.png) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* Card 1: Chế độ Video nền */}
                      <div
                        onClick={() => {
                          sound.playPop();
                          setBgMode('video');
                          handleApplyBg(bgUrl, 'video', undefined, true);
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                          bgMode === 'video'
                            ? 'border-[#ff5364] bg-[#fff7f8] shadow-sm ring-2 ring-rose-100'
                            : 'border-slate-200 bg-white hover:border-rose-200'
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              bgMode === 'video' ? 'border-[#ff5364]' : 'border-slate-300'
                            }`}
                          >
                            {bgMode === 'video' && <div className="w-2.5 h-2.5 rounded-full bg-[#ff5364]" />}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-800">
                            <span>📽️</span>
                            <span>Chế độ Video nền (Khuyên dùng)</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Video tự động chạy lặp, mượt mà, tạo cảm giác lấp lánh
                          </p>
                        </div>
                      </div>

                      {/* Card 2: Chế độ Ảnh tĩnh / Hoa văn kẹo */}
                      <div
                        onClick={() => {
                          sound.playPop();
                          setBgMode('image');
                          handleApplyBg(bgUrl, 'image', undefined, true);
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                          bgMode === 'image'
                            ? 'border-[#ff5364] bg-[#fff7f8] shadow-sm ring-2 ring-rose-100'
                            : 'border-slate-200 bg-white hover:border-rose-200'
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              bgMode === 'image' ? 'border-[#ff5364]' : 'border-slate-300'
                            }`}
                          >
                            {bgMode === 'image' && <div className="w-2.5 h-2.5 rounded-full bg-[#ff5364]" />}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-800">
                            <span>🖼️</span>
                            <span>Chế độ Ảnh tĩnh / Hoa văn kẹo</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Hình nền tĩnh nghệ thuật, hoa anh đào, tone màu pastel
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Configuration Box (Matching image_52551d12.png) */}
                    <div className="border border-[#fce3e7] rounded-2xl bg-[#fffbfc] p-4 sm:p-5 space-y-4">
                      {/* Section Title */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800">
                          <span>{bgMode === 'video' ? '🎞️' : '🖼️'}</span>
                          <span>
                            {bgMode === 'video'
                              ? 'Cấu hình Video nền trang chủ'
                              : 'Cấu hình Ảnh nền & Hoa văn trang chủ'}
                          </span>
                        </div>
                      </div>

                      {/* Inputs Row: Direct URL + File Upload */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Column 1: Direct URL */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-700">
                            {bgMode === 'video'
                              ? 'Đường dẫn Video trực tiếp (URL MP4 / WebM)'
                              : 'Đường dẫn Ảnh nền trực tiếp (URL Image / GIF)'}
                          </label>
                          <input
                            type="text"
                            value={bgUrl}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBgUrl(val);
                              handleApplyBg(val, bgMode, undefined, true);
                            }}
                            placeholder={
                              bgMode === 'video'
                                ? 'https://assets.mixkit.co/videos/preview/mixkit-pink-ne...'
                                : 'https://images.unsplash.com/... hoặc ảnh GIF'
                            }
                            className="w-full px-3.5 py-2 text-xs bg-white border border-[#fac8d1] rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-slate-800 placeholder-slate-400 transition-colors shadow-2xs"
                          />
                          <p className="text-[10px] text-slate-400">
                            {bgMode === 'video'
                              ? 'Hỗ trợ link video direct (.mp4, .webm) hoặc CDN lưu trữ'
                              : 'Hỗ trợ link ảnh direct (.jpg, .png, .webp, .gif)'}
                          </p>
                        </div>

                        {/* Column 2: File Upload with Drag & Drop & Auto Compression */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-700">
                            {bgMode === 'video' ? 'Hoặc tải file video từ máy' : 'Hoặc tải file ảnh / GIF từ máy'}
                          </label>
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDraggingBg(true);
                            }}
                            onDragLeave={() => setIsDraggingBg(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDraggingBg(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file) handleBgFile(file);
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 bg-white border rounded-xl transition-all ${
                              isDraggingBg
                                ? 'border-[#ff5364] bg-rose-50/60 ring-2 ring-rose-200'
                                : 'border-[#fac8d1]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => bgFileInputRef.current?.click()}
                              className="px-3 py-1 text-xs font-semibold text-slate-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                            >
                              Chọn tệp
                            </button>
                            <span className="text-xs text-slate-500 truncate flex-1">
                              {bgSelectedFileName || 'Không có tệp nào được chọn'}
                            </span>
                            <UploadCloud className="w-4 h-4 text-slate-400 shrink-0" />
                          </div>
                          <p className="text-[10px] text-rose-500">
                            ⚡ Có thể kéo thả file trực tiếp vào ô, tự động nén dung lượng cao
                          </p>
                        </div>
                      </div>

                      {/* Controls Row: Opacity, Overlay Tint, Loop Checkbox */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 items-center">
                        {/* Opacity Slider */}
                        <div className="md:col-span-4 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                            <span>Độ trong suốt / Làm mờ video</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.05"
                            value={bgOpacity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setBgOpacity(val);
                              handleApplyBg(undefined, undefined, { opacity: val });
                            }}
                            className="w-full accent-[#ff5364] cursor-pointer"
                          />
                          <div className="text-[10px] font-medium text-[#b52d55]">
                            {Math.round(bgOpacity * 100)}% độ mờ (êm dịu mắt)
                          </div>
                        </div>

                        {/* Overlay Tint Dropdown */}
                        <div className="md:col-span-5 space-y-1">
                          <label className="block text-[11px] font-bold text-slate-700">
                            Hiệu ứng phủ màu (Overlay Tint)
                          </label>
                          <select
                            value={bgOverlayTint}
                            onChange={(e) => {
                              const tint = e.target.value as OverlayTint;
                              setBgOverlayTint(tint);
                              handleApplyBg(undefined, undefined, { overlayTint: tint });
                            }}
                            className="w-full px-3 py-2 text-xs bg-white border border-[#fac8d1] rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-slate-800 transition-colors shadow-2xs cursor-pointer"
                          >
                            <option value="pink">Ánh hồng kẹo dâu (Pink Dream)</option>
                            <option value="peach">Hồng phấn dịu ngọt (Soft Peach)</option>
                            <option value="lavender">Tím oải hương mộng mơ (Lavender Dream)</option>
                            <option value="none">Trong suốt tự nhiên (None)</option>
                          </select>
                        </div>

                        {/* Loop Checkbox */}
                        <div className="md:col-span-3 flex items-center pt-3">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={bgLoop}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setBgLoop(checked);
                                handleApplyBg(undefined, undefined, { loop: checked });
                              }}
                              className="w-4 h-4 rounded text-rose-500 accent-[#ff5364] cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-700">
                              Tự động phát lặp lại (Loop)
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Live Background Sync Status Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-[#fff2f5] border border-[#fbcdd6] shadow-2xs gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-rose-100 border border-rose-200 shrink-0 flex items-center justify-center shadow-xs">
                          {bgUrl ? (
                            <img src={bgUrl} alt="Nền hiện tại" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">🌸</span>
                          )}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {bgUrl ? 'Đang đồng bộ trực tiếp trên toàn bộ web' : 'Đang dùng nền hồng pastel mặc định'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#b52d55] truncate">
                            {bgSelectedFileName || (bgUrl ? bgUrl : 'Màu nền thuần dịu mắt')}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyBg(undefined, undefined, undefined, false)}
                        className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] rounded-xl shadow-xs hover:opacity-95 transition-all cursor-pointer whitespace-nowrap self-end sm:self-auto shrink-0 flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Đồng bộ toàn web ⚡</span>
                      </button>
                    </div>

                    {/* Quick Preset Backgrounds */}
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>✨ Gợi ý hình nền & ảnh nghệ thuật thịnh hành:</span>
                        <span className="text-[10px] text-rose-500 font-semibold">⚡ Chạm 1 lần đổi và đồng bộ toàn bộ web ngay</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {[
                          {
                            title: '🌸 Hoa Anh Đào',
                            tag: 'Ảnh nghệ thuật',
                            mode: 'image' as const,
                            url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1920&q=80',
                          },
                          {
                            title: '✨ Trời Sao Lấp Lánh',
                            tag: 'Huyền ảo lung linh',
                            mode: 'image' as const,
                            url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80',
                          },
                          {
                            title: '☁️ Mây Kẹo Bông',
                            tag: 'Hoàng hôn pastel',
                            mode: 'image' as const,
                            url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
                          },
                          {
                            title: '🍓 Vườn Dâu Tây',
                            tag: 'Tươi tắn ngọt ngào',
                            mode: 'image' as const,
                            url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1920&q=80',
                          },
                          {
                            title: '🍬 Tiệm Bánh & Kẹo',
                            tag: 'Pastel mộng mơ',
                            mode: 'image' as const,
                            url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1920&q=80',
                          },
                          {
                            title: '🌹 Vườn Hồng Mơ',
                            tag: 'Ngọt ngào lãng mạn',
                            mode: 'image' as const,
                            url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1920&q=80',
                          },
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              sound.playChime();
                              setBgMode(preset.mode);
                              setBgUrl(preset.url);
                              setBgSelectedFileName(preset.title);
                              setBgOpacity(0.85);
                              handleApplyBg(preset.url, preset.mode, { opacity: 0.85, overlayTint: bgOverlayTint }, false);
                              onToast(`Đã đổi và đồng bộ nền "${preset.title}" cho toàn bộ web! 🌸✨`);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer shadow-2xs space-y-1 ${
                              bgUrl === preset.url
                                ? 'border-[#ff5364] bg-rose-50/80 ring-2 ring-rose-200'
                                : 'border-rose-200/70 bg-rose-50/30 hover:bg-rose-100/60'
                            }`}
                          >
                            <div className="text-xs font-bold text-slate-800 truncate">{preset.title}</div>
                            <div className="text-[10px] text-pink-500 truncate">{preset.tag}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Floating Heart Particle Effect Controls Card */}
                    <div className="border border-[#fce3e7] rounded-2xl bg-[#fffbfc] p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800">
                          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                          <span>Hiệu ứng Trái tim rơi lãng mạn 💖</span>
                          <span className="text-[11px] font-normal text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Rơi xen kẽ, rải rác mượt mà
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playPop();
                            if (floatingConfig && onUpdateFloatingConfig) {
                              onUpdateFloatingConfig({
                                ...floatingConfig,
                                enabled: !floatingConfig.enabled,
                                activeEffects: ['hearts'],
                              });
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                            floatingConfig?.enabled
                              ? 'bg-gradient-to-r from-[#ff5364] to-[#ff7d45] text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {floatingConfig?.enabled ? 'Đang bật ✨' : 'Đã tắt 🚫'}
                        </button>
                      </div>

                      {/* Tone màu trái tim */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-xs font-bold text-slate-700">Tone màu trái tim:</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {HEART_PALETTES.map((palette) => {
                            const isSelected = (floatingConfig?.heartPalette || 'all') === palette.id;
                            return (
                              <button
                                key={palette.id}
                                type="button"
                                onClick={() => {
                                  sound.playPop();
                                  if (floatingConfig && onUpdateFloatingConfig) {
                                    onUpdateFloatingConfig({
                                      ...floatingConfig,
                                      heartPalette: palette.id as HeartPalette,
                                      activeEffects: ['hearts'],
                                      enabled: true,
                                    });
                                  }
                                }}
                                className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                  isSelected && floatingConfig?.enabled
                                    ? 'border-[#ff5364] bg-rose-50 text-[#b52d55] font-bold shadow-2xs'
                                    : 'border-slate-200 hover:border-rose-200 text-slate-700 bg-white'
                                }`}
                              >
                                <span>{palette.emojis.slice(0, 3).join(' ')}</span>
                                <span className="truncate text-[11px]">{palette.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-rose-100">
                      <button
                        type="button"
                        onClick={handleResetBg}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      >
                        Đặt lại nền mặc định 🔄
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyBg(undefined, undefined, undefined, false)}
                        className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] hover:opacity-95 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4 fill-white" />
                        <span>Lưu & Áp dụng nền cho toàn bộ web ✨</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 4: Avatar & Logo - Matching image_a60a77eb.png & user request */}
                {activeTab === 'avatar' && (
                  <div className="bg-white rounded-3xl border border-[#fae2e5] p-5 sm:p-7 shadow-2xs space-y-6">
                    {/* Header Row */}
                    <div className="pb-3 border-b border-rose-100">
                      <h4 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-xl">🎀</span>
                        <span>Thay đổi ảnh đại diện & Nhận diện thương hiệu</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cập nhật Avatar cá nhân của nàng Wyn, Logo kẹo ngọt và biểu tượng Favicon...
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column: ẢNH ĐẠI DIỆN CỦA NÀNG WYN (Matching image_a60a77eb.png) */}
                      <div className="bg-[#fff9fa] rounded-3xl border border-[#fbdbe1] p-5 sm:p-6 flex flex-col items-center text-center space-y-4 shadow-2xs">
                        <h5 className="text-xs font-bold text-[#b52d55] uppercase tracking-wider">
                          ẢNH ĐẠI DIỆN CỦA NÀNG WYN
                        </h5>

                        {/* Circular Avatar with Pink Border Ring & Orange Pencil Edit Badge */}
                        <div
                          className="relative group cursor-pointer"
                          onClick={() => wynAvatarFileInputRef.current?.click()}
                        >
                          <div className="w-32 h-32 rounded-full border-4 border-[#ff6083] p-1 bg-white shadow-md overflow-hidden">
                            <img
                              src={wynAvatar}
                              alt="Avatar của nàng Wyn"
                              className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          {/* Pencil badge at bottom-right */}
                          <div
                            className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-gradient-to-tr from-[#ff6b57] to-[#ffa07a] border-2 border-white flex items-center justify-center text-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                            title="Tải ảnh mới từ máy tính"
                          >
                            <Pencil className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-800">Wyn's Profile Picture</div>
                          <p className="text-[11px] text-slate-500">
                            Khuyên dùng tỷ lệ 1:1, dung lượng &lt; 5MB (PNG, JPG, WebP)
                          </p>
                          {isCompressingWynAvatar && (
                            <div className="text-[11px] text-rose-500 font-medium animate-pulse">
                              Đang nén & tối ưu ảnh đại diện...
                            </div>
                          )}
                        </div>

                        {/* URL input and update button */}
                        <div className="w-full space-y-2 pt-1">
                          <input
                            type="text"
                            value={wynAvatarUrlInput}
                            onChange={(e) => setWynAvatarUrlInput(e.target.value)}
                            placeholder="Hoặc dán URL ảnh đại diện..."
                            className="w-full px-3.5 py-2 text-xs bg-white border border-[#fac8d1] rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-slate-800 placeholder-slate-400 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={handleApplyWynAvatarUrl}
                            className="w-full py-2 rounded-xl bg-[#fde8ee] hover:bg-[#fad8e1] text-[#b52d55] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            Cập nhật ảnh qua URL
                          </button>
                        </div>
                      </div>

                      {/* Right Column: LOGO KẸO NGỌT (GÓC TÊN TRANG WEB) */}
                      <div className="bg-[#fff9fa] rounded-3xl border border-[#fbdbe1] p-5 sm:p-6 flex flex-col items-center text-center space-y-4 shadow-2xs">
                        <h5 className="text-xs font-bold text-[#b52d55] uppercase tracking-wider">
                          LOGO GÓC CẠNH TÊN WEB (NAVBAR)
                        </h5>

                        {/* Navbar Brand Preview showing exact live logo */}
                        <div className="p-3 bg-white rounded-2xl border border-rose-200/80 shadow-xs flex items-center gap-3 w-full max-w-xs justify-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#ff6b81] to-[#ffa07a] flex items-center justify-center text-white shadow-sm border border-rose-200 overflow-hidden shrink-0">
                            {currentSiteLogo ? (
                              <img
                                src={currentSiteLogo}
                                alt="Logo Ổ kẹo của Wyn"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Candy className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-1">
                              <span className="font-script text-lg font-bold text-[#b53457]">Ổ kẹo ngọt</span>
                              <span className="font-hand text-xs font-bold text-[#c73e63] bg-[#fde9ec] border border-[#fbd0d8] px-1.5 py-0.2 rounded-full">
                                của Wyn
                              </span>
                            </div>
                            <span className="text-[9px] text-pink-400 font-sans tracking-widest uppercase">
                              sweet candies & whispers
                            </span>
                          </div>
                        </div>

                        {/* Upload Logo button with Drag & Drop & Compression */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingLogo(true);
                          }}
                          onDragLeave={() => setIsDraggingLogo(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingLogo(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file) handleLogoFile(file);
                          }}
                          className={`w-full p-3 rounded-2xl border-2 border-dashed transition-all ${
                            isDraggingLogo
                              ? 'border-[#ff5364] bg-rose-100/50'
                              : 'border-rose-200 hover:border-rose-300 bg-white'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => logoFileInputRef.current?.click()}
                            className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#ff5364] to-[#ff7d45] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Tải ảnh Logo mới lên</span>
                          </button>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Hỗ trợ kéo thả ảnh vào đây (tự động nén tối ưu)
                          </p>
                        </div>

                        {/* Quick Preset Logos */}
                        <div className="w-full space-y-1.5 text-left">
                          <label className="block text-[11px] font-bold text-slate-700">
                            Hoặc chọn nhanh biểu tượng kẹo ngọt:
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={handleResetLogo}
                              className={`p-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-1 justify-center transition-colors cursor-pointer ${
                                currentSiteLogo === null
                                  ? 'border-[#ff5364] bg-rose-50 text-rose-700 font-bold'
                                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span>🍭</span>
                              <span>Kẹo xoắn</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const url =
                                  'https://images.unsplash.com/photo-1518635017480-d450b4042f2b?auto=format&fit=crop&w=300&q=80';
                                setCurrentSiteLogo(url);
                                onUpdateLogo?.(url);
                                sound.playSuccess();
                                onToast('Đã chọn Logo Dâu Tây ngọt ngào! 🍓');
                              }}
                              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-medium flex items-center gap-1 justify-center transition-colors cursor-pointer text-slate-700"
                            >
                              <span>🍓</span>
                              <span>Dâu tây</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const url =
                                  'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=300&q=80';
                                setCurrentSiteLogo(url);
                                onUpdateLogo?.(url);
                                sound.playSuccess();
                                onToast('Đã chọn Logo Hoa Anh Đào! 🌸');
                              }}
                              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-medium flex items-center gap-1 justify-center transition-colors cursor-pointer text-slate-700"
                            >
                              <span>🌸</span>
                              <span>Hoa đào</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const url =
                                  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80';
                                setCurrentSiteLogo(url);
                                onUpdateLogo?.(url);
                                sound.playSuccess();
                                onToast('Đã chọn Logo Mèo Con kẹo ngọt! 🐱');
                              }}
                              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-medium flex items-center gap-1 justify-center transition-colors cursor-pointer text-slate-700"
                            >
                              <span>🐱</span>
                              <span>Mèo kẹo</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const url =
                                  'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=300&q=80';
                                setCurrentSiteLogo(url);
                                onUpdateLogo?.(url);
                                sound.playSuccess();
                                onToast('Đã chọn Logo Trái Tim Pha Lê! 💖');
                              }}
                              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-medium flex items-center gap-1 justify-center transition-colors cursor-pointer text-slate-700"
                            >
                              <span>💖</span>
                              <span>Trái tim</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const url =
                                  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80';
                                setCurrentSiteLogo(url);
                                onUpdateLogo?.(url);
                                sound.playSuccess();
                                onToast('Đã chọn Logo Cupcake hoàng gia! 🧁');
                              }}
                              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-medium flex items-center gap-1 justify-center transition-colors cursor-pointer text-slate-700"
                            >
                              <span>🧁</span>
                              <span>Cupcake</span>
                            </button>
                          </div>
                        </div>

                        {/* URL input and update button for logo */}
                        <div className="w-full space-y-2 pt-1">
                          <input
                            type="text"
                            value={logoUrlInput}
                            onChange={(e) => setLogoUrlInput(e.target.value)}
                            placeholder="Hoặc dán URL Logo kẹo..."
                            className="w-full px-3.5 py-2 text-xs bg-white border border-[#fac8d1] rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-slate-800 placeholder-slate-400 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={handleApplyLogoUrl}
                            className="w-full py-2 rounded-xl bg-[#fde8ee] hover:bg-[#fad8e1] text-[#b52d55] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            Cập nhật Logo qua URL
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Chữ ký của chủ tiệm Wyn */}
                    <div className="p-4 bg-[#fffbfc] border border-[#fbdde2] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="space-y-0.5 text-left w-full sm:w-auto">
                        <label className="block text-xs font-bold text-slate-800">
                          Chữ ký hiển thị dưới các bức thư & lời thì thầm
                        </label>
                        <input
                          type="text"
                          value={wynSignature}
                          onChange={(e) => setWynSignature(e.target.value)}
                          className="w-full sm:w-72 px-3.5 py-1.5 text-xs bg-white border border-[#fac8d1] rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-slate-800"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveSignature}
                        className="px-6 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] rounded-xl shadow-xs hover:opacity-95 transition-all cursor-pointer whitespace-nowrap self-end sm:self-auto"
                      >
                        Lưu chữ ký & Nhận diện ✨
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab: Khung ảnh Polaroid Trang Chủ */}
                {activeTab === 'polaroid' && (
                  <div className="bg-white rounded-3xl border border-[#fae2e5] p-5 sm:p-7 shadow-2xs space-y-6">
                    {/* Hidden file input */}
                    <input
                      ref={heroPhotoFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleHeroPhotoUpload}
                      className="hidden"
                    />

                    {/* Header */}
                    <div className="pb-3 border-b border-rose-100 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                          <span className="text-xl">🖼️</span>
                          <span>Thay đổi ảnh Khung Polaroid Trang Chủ</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tùy biến hình ảnh phòng ngủ / không gian thiếu nữ xuất hiện trên thẻ ghim Polaroid trang chủ
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetHeroPhoto}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Khôi phục lại ảnh ban đầu"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Về ảnh mặc định</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Column (5 cols): Live Polaroid Card Preview */}
                      <div className="lg:col-span-5 bg-[#fff9fa] rounded-3xl border border-[#fbdbe1] p-5 flex flex-col items-center text-center space-y-3">
                        <span className="text-xs font-bold text-[#b52d55] uppercase tracking-wider">
                          Xem trước khung ảnh thực tế
                        </span>

                        {/* Polaroid Card Simulation */}
                        <div className="relative max-w-[240px] w-full pt-3 pb-1 select-none">
                          {/* Top Clip Pin */}
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-7 bg-gradient-to-b from-[#f3cf83] to-[#c79a42] rounded-xs shadow-md z-30 border border-[#b88c3a] flex items-center justify-center">
                            <div className="w-1 h-3.5 border-l border-r border-[#8d651d]/50" />
                          </div>

                          {/* Top Right Heart Badge */}
                          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-purple-300 to-pink-300 flex items-center justify-center text-xs shadow-md border-2 border-white rotate-12 z-30 animate-pulse">
                            💖
                          </div>

                          {/* Polaroid Body */}
                          <div className="bg-white rounded-2xl p-2.5 shadow-xl border border-pink-200/90 space-y-2">
                            {/* Photo frame */}
                            <div className="relative rounded-xl overflow-hidden aspect-[4/4.3] bg-pink-100 border border-pink-100">
                              <img
                                src={heroPhoto || '/assets/aistudio/hero_bedroom_photo.png'}
                                alt="Khung ảnh Polaroid"
                                className="w-full h-full object-cover"
                              />

                              {/* Frosted Quote Overlay Bubble */}
                              <div className="absolute bottom-1.5 inset-x-1.5 bg-white/95 backdrop-blur-md rounded-xl p-2 shadow-md border border-pink-200/70 text-center space-y-0.5">
                                <div className="flex items-center justify-center gap-1 text-[10px] text-rose-400">
                                  <span>🌸</span>
                                  <span className="w-4 h-px bg-pink-300" />
                                  <span>🎀</span>
                                </div>
                                <p className="font-serif italic text-[11px] text-rose-700 font-semibold leading-tight">
                                  “Đôi môi em nhạt... 🥀”
                                </p>
                                <p className="text-[11px] font-bold text-[#ff4071] leading-tight">
                                  “Gieo chút kẹo ngọt trên môi em 🍭 💋”
                                </p>
                                <div className="text-[9px] text-pink-400 font-medium">
                                  ✦ ký ức dâu sữa thơm lừng ✦
                                </div>
                              </div>
                            </div>

                            {/* Bottom Row */}
                            <div className="flex items-center justify-between px-0.5 pt-0.5">
                              <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                                <span>🎀</span>
                                <span>Wyn's Memory #01</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-600">
                                ★ 2000s Coquette
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 max-w-xs">
                          Ảnh mới sẽ xuất hiện trực tiếp trong khung ghim tại vị trí trung tâm trên trang chủ của nàng Wyn.
                        </p>
                      </div>

                      {/* Right Column (7 cols): Upload, URL, and Presets */}
                      <div className="lg:col-span-7 space-y-4">
                        {/* Upload Zone */}
                        <div className="bg-[#fffbfc] rounded-2xl border border-[#fce3e7] p-4 sm:p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <UploadCloud className="w-4 h-4 text-rose-500" />
                              <span>Tải ảnh từ máy tính (Khuyên dùng)</span>
                            </span>
                            <span className="text-[10px] text-slate-400">PNG, JPG, WebP, GIF</span>
                          </div>

                          <div
                            onClick={() => heroPhotoFileInputRef.current?.click()}
                            className="border-2 border-dashed border-rose-300/80 hover:border-rose-400 bg-rose-50/40 hover:bg-rose-50/70 rounded-2xl p-5 text-center cursor-pointer transition-colors space-y-2 group"
                          >
                            <div className="w-10 h-10 mx-auto rounded-full bg-white shadow-xs flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                                Nhấn để chọn ảnh từ máy tính
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Tự động tối ưu hoá dung lượng, lưu giữ vĩnh viễn trên thiết bị
                              </p>
                            </div>
                            {isCompressingHeroPhoto && (
                              <div className="text-xs font-bold text-rose-600 animate-pulse pt-1">
                                Đang xử lý & tối ưu hoá hình ảnh...
                              </div>
                            )}
                          </div>
                        </div>

                        {/* URL Input */}
                        <div className="bg-[#fffbfc] rounded-2xl border border-[#fce3e7] p-4 space-y-2.5">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <ExternalLink className="w-4 h-4 text-rose-500" />
                            <span>Hoặc dán URL ảnh trực tiếp từ internet</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={heroPhotoUrlInput}
                              onChange={(e) => setHeroPhotoUrlInput(e.target.value)}
                              placeholder="https://example.com/anh-phong-ngu.jpg"
                              className="flex-1 px-3.5 py-2 text-xs bg-white border border-[#fac8d1] rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-slate-800 placeholder-slate-400"
                            />
                            <button
                              type="button"
                              onClick={handleApplyHeroPhotoUrl}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff5364] to-[#ff7d45] hover:opacity-95 text-white text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap"
                            >
                              Áp dụng
                            </button>
                          </div>
                        </div>

                        {/* Presets Grid */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Gợi ý ảnh phòng ngủ & không gian ngọt ngào có sẵn:</span>
                          </span>
                          <div className="grid grid-cols-2 gap-2.5">
                            {PRESET_POLAROID_PHOTOS.map((preset, idx) => {
                              const isSelected = heroPhoto === preset.url;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    sound.playPop();
                                    setHeroPhoto(preset.url);
                                    if (onUpdateHeroPolaroidPhoto) {
                                      onUpdateHeroPolaroidPhoto(preset.url);
                                    }
                                    onToast(`Đã chọn: ${preset.label} ✨`);
                                  }}
                                  className={`p-2 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-300 shadow-xs'
                                      : 'bg-white hover:bg-rose-50/40 border-[#fae2e5]'
                                  }`}
                                >
                                  <img
                                    src={preset.thumb}
                                    alt={preset.label}
                                    className="w-10 h-10 rounded-xl object-cover border border-rose-200 shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[11px] font-bold text-slate-800 truncate">
                                      {preset.label}
                                    </div>
                                    <div className="text-[10px] text-pink-500 font-semibold truncate">
                                      {preset.tag}
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mr-1" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 5: Characters List & Backups */}
                {activeTab === 'manage' && (
                  <div className="bg-white rounded-3xl border border-[#fae2e5] p-5 sm:p-7 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                      <div>
                        <h4 className="text-base font-bold text-slate-800">
                          Hũ Kẹo Nhân Vật ({characters.length})
                        </h4>
                        <p className="text-xs text-slate-500">
                          Danh sách toàn bộ nhân vật hiện đang có trên web
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={onExport}
                          className="p-2 text-xs font-semibold text-slate-700 bg-rose-50 hover:bg-rose-100 rounded-xl flex items-center gap-1"
                          title="Xuất file JSON"
                        >
                          <Download className="w-3.5 h-3.5 text-rose-600" />
                          <span className="hidden sm:inline">Xuất JSON</span>
                        </button>
                        <button
                          type="button"
                          onClick={onImport}
                          className="p-2 text-xs font-semibold text-slate-700 bg-rose-50 hover:bg-rose-100 rounded-xl flex items-center gap-1"
                          title="Nhập file JSON"
                        >
                          <Upload className="w-3.5 h-3.5 text-rose-600" />
                          <span className="hidden sm:inline">Nạp JSON</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Wyn có chắc chắn muốn xóa hết tất cả nhân vật trong ổ không?')) {
                              onClearAll();
                            }
                          }}
                          className="p-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl flex items-center gap-1"
                          title="Dọn sạch ổ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Dọn sạch</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {characters.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-xs">
                          Chưa có nhân vật nào. Bấm vào tab "Tạo nhân vật mới" để đúc viên kẹo đầu tiên nhé! 🍬
                        </div>
                      ) : (
                        characters.map((char) => (
                          <div
                            key={char.id}
                            className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/40 border border-rose-100 hover:bg-rose-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={char.avatar}
                                alt={char.name}
                                className="w-10 h-10 rounded-xl object-cover border border-rose-200"
                              />
                              <div>
                                <h5 className="text-xs font-bold text-slate-800">{char.name}</h5>
                                <p className="text-[10px] text-slate-500">
                                  {char.genre} · {char.sweetFlavor || 'Kẹo ngọt'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditCharacter(char)}
                                className="px-3 py-1 text-xs font-semibold text-rose-600 bg-white hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteCharacter(char.id)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                title="Xóa nhân vật"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 flex items-center justify-between border-t border-[#fbdde2] text-[11px] text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>Bảo mật: Mật mã riêng tư · Quyền hạn: Chủ tiệm Wyn</span>
            </div>
            <span>Chỉ quản trị viên mới có thể đúc nhân vật 🍬</span>
          </div>
        </motion.div>

        {/* LIVE CARD PREVIEW POPUP */}
        {isPreviewOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl border border-rose-200 p-6 max-w-sm w-full space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <span className="text-xs font-bold text-[#b53457] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem trước thẻ nhân vật</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Card visual */}
              <div className="rounded-2xl border border-rose-200 overflow-hidden bg-white shadow-sm space-y-3 p-4">
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-rose-50 flex items-center justify-center">
                  {charAvatar ? (
                    <img
                      src={charAvatar}
                      alt={charName || 'Preview'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Candy className="w-8 h-8 text-rose-300 mx-auto mb-1" />
                      <span className="text-xs text-slate-400">Chưa có ảnh</span>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-[#b53457] backdrop-blur-xs border border-rose-100">
                    {charGenre}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">
                    {charName || 'Tên nhân vật'}
                  </h4>
                  {charTagline && (
                    <p className="text-[11px] text-rose-500 italic">
                      &ldquo;{charTagline}&rdquo;
                    </p>
                  )}
                  {charSweetFlavor && (
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                      🍬 {charSweetFlavor}
                    </span>
                  )}
                  {charFirstMessage && (
                    <div className="p-2 rounded-xl bg-rose-50/50 border border-rose-100 text-[11px] text-slate-600 italic mt-2">
                      &ldquo;{charFirstMessage}&rdquo;
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] rounded-xl shadow-xs"
                >
                  Đóng xem trước
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
