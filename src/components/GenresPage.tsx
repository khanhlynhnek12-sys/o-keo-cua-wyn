import React, { useState } from 'react';
import {
  Tag,
  Sparkles,
  ArrowLeft,
  Candy,
  Plus,
  Send,
  Heart,
  CheckCircle2,
  BookOpen,
  Filter,
  Search,
  MessageSquare,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { PRESET_GENRES, GenreItem } from '../data/genres';
import { Character } from '../types/character';
import { sound } from '../utils/audio';

export interface GenreSuggestion {
  id: number;
  genreName: string;
  sender: string;
  characterVibe: string;
  sampleQuote: string;
  storyIdea: string;
  sweetnessLevel: number;
  isPublic: boolean;
  date: string;
}

interface GenresPageProps {
  characters: Character[];
  onBackToHome: () => void;
  onSelectCharacter: (char: Character) => void;
  onOpenAddModalWithGenre: (genreName: string) => void;
  onToast: (msg: string) => void;
  isAdmin: boolean;
}

export const GenresPage: React.FC<GenresPageProps> = ({
  characters,
  onBackToHome,
  onSelectCharacter,
  onOpenAddModalWithGenre,
  onToast,
  isAdmin,
}) => {
  // Tabs: 'explore' (Khám phá thể loại) vs 'propose' (Đề xuất thể loại / Gu kẹo mới)
  const [activeTab, setActiveTab] = useState<'explore' | 'propose'>('explore');

  // Search in genres
  const [searchFilter, setSearchFilter] = useState('');

  // Propose form state
  const [proposeGenreName, setProposeGenreName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [characterVibe, setCharacterVibe] = useState('');
  const [sampleQuote, setSampleQuote] = useState('');
  const [storyIdea, setStoryIdea] = useState('');
  const [sweetnessLevel, setSweetnessLevel] = useState(5);
  const [isPublic, setIsPublic] = useState(true);

  // Stored genre suggestions
  const [suggestions, setSuggestions] = useState<GenreSuggestion[]>(() => {
    try {
      const saved = localStorage.getItem('wyn_genre_suggestions');
      if (saved) return JSON.parse(saved);
    } catch {
      //
    }
    return [
      {
        id: 1,
        genreName: 'Thanh mai trúc mã x Ngụy côn trùng',
        sender: 'Tiểu Đường',
        characterVibe: 'Ngoài mặt là thanh niên bảo vệ thanh mai, sau lưng lại thích làm nũng đòi bế.',
        sampleQuote: 'Nếu em đã hứa bên anh cả đời, thì đừng hòng quay lưng bước đi...',
        storyIdea: 'Hai người lớn lên bên nhau từ nhỏ ở xóm kẹo...',
        sweetnessLevel: 5,
        isPublic: true,
        date: 'Vừa xong',
      },
    ];
  });

  const getSweetnessLabel = (level: number) => {
    switch (level) {
      case 1:
        return '1 KẸO - NHẸ NHÀNG, VỜI VỢI 🍬';
      case 2:
        return '2 KẸO - NGỌT THANH DỊU DÀNG 🍬';
      case 3:
        return '3 KẸO - VỪA MIỆNG RUNG ĐỘNG 🍬';
      case 4:
        return '4 KẸO - NGỌT LỊM SAY ĐẮM 🍬';
      case 5:
      default:
        return '5 KẸO - CỰC NGỌT ĐẬM SÂU 🍬';
    }
  };

  const handleProposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposeGenreName.trim()) {
      onToast('Nàng hãy điền tên thể loại / gu kẹo đề xuất nhé!');
      return;
    }
    if (!characterVibe.trim()) {
      onToast('Nàng hãy mô tả chút tính cách hoặc vibe nhân vật mong muốn nha!');
      return;
    }

    sound.playSuccess();
    const newEntry: GenreSuggestion = {
      id: Date.now(),
      genreName: proposeGenreName.trim(),
      sender: senderName.trim() || 'Nàng độc giả giấu tên',
      characterVibe: characterVibe.trim(),
      sampleQuote: sampleQuote.trim(),
      storyIdea: storyIdea.trim(),
      sweetnessLevel,
      isPublic,
      date: new Date().toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      }),
    };

    const updated = [newEntry, ...suggestions];
    setSuggestions(updated);
    try {
      localStorage.setItem('wyn_genre_suggestions', JSON.stringify(updated));
    } catch {
      //
    }

    onToast('Đề xuất thể loại mới của nàng đã được gửi tới Wyn thành công! 💕');
    setProposeGenreName('');
    setCharacterVibe('');
    setSampleQuote('');
    setStoryIdea('');
    setSenderName('');
  };

  // Custom genres added by QTV
  const customGenres = React.useMemo<GenreItem[]>(() => {
    try {
      const saved = localStorage.getItem('wyn_custom_genres');
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        return parsed.map((name, idx) => ({
          id: `custom-genre-${idx}`,
          name,
          emoji: '✨',
          description: 'Thể loại tùy chỉnh đặc biệt do QTV / Wyn khởi tạo riêng cho Ổ kẹo.',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
          tagColor: 'from-pink-400 to-rose-500',
        }));
      }
    } catch {
      //
    }
    return [];
  }, []);

  const combinedGenresList = React.useMemo(() => {
    const list = [...PRESET_GENRES];
    customGenres.forEach((cg) => {
      if (!list.some((g) => g.name.toLowerCase() === cg.name.toLowerCase())) {
        list.push(cg);
      }
    });

    characters.forEach((c) => {
      if (c.genre) {
        c.genre.split('·').forEach((p) => {
          const name = p.trim();
          if (name && !list.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
            list.push({
              id: `char-genre-${name}`,
              name,
              emoji: '🍓',
              description: 'Thể loại độc đáo gắn với nhân vật trong Ổ kẹo của Wyn.',
              badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
              tagColor: 'from-rose-400 to-pink-500',
            });
          }
        });
      }
    });

    return list;
  }, [customGenres, characters]);

  // Filtered genres
  const filteredGenres = combinedGenresList.filter((g) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      (g.alias && g.alias.some((a) => a.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-fadeIn">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            sound.playPop();
            onBackToHome();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#b53457] bg-white border border-[#fac8d1] hover:bg-rose-50 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Trang chủ</span>
        </button>

        <span className="text-xs text-pink-400 font-medium flex items-center gap-1.5">
          <Candy className="w-3.5 h-3.5" />
          <span>Thẻ thể loại & Gu kẹo</span>
        </span>
      </div>

      {/* Hero Header Card (matching user feedback layout mockup) */}
      <div className="relative bg-gradient-to-br from-white via-[#fff7f7] to-[#fff0f2] rounded-3xl border border-[#fae2e5] p-6 sm:p-10 shadow-xs space-y-4 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-pink-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff0f3] border border-[#fbd3db] text-[11px] font-bold text-[#cf385e] uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-[#cf385e]" />
              <span>BẢNG THỂ LOẠI TÌNH CẢM & GU KẸO CỦA WYN</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-[#b53457] tracking-tight">
              Góc Khám Phá Thể Loại & Gu Nhân Vật 🏷️
            </h1>

            {/* Wyn's quote block */}
            <div className="p-3.5 rounded-2xl bg-white/80 border border-[#fbd9df] text-xs sm:text-sm text-slate-700 italic leading-relaxed">
              &ldquo;Chiếc ổ này có đủ vị kẹo, từ ngọt ngào đến đắng cay. 🍬☕ Từ thanh xuân vườn trường đến cưng chiều, boy phố hay ngược tâm... Mỗi thể loại đều ấp ủ một trái tim chân thành.&rdquo;
              <div className="text-[11px] font-bold text-[#b53457] not-italic mt-1.5">
                — Wyn 🌸 (Chủ tiệm kẹo)
              </div>
            </div>

            {/* Sub stats tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#fac8d1] text-slate-700 font-semibold shadow-2xs">
                🏷️ Đã mở 16 thể loại ngọt ngào
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#fac8d1] text-slate-700 font-semibold shadow-2xs">
                👥 {characters.length} nhân vật đã lên kệ
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#fac8d1] text-rose-600 font-semibold shadow-2xs">
                🍬 Hương vị: Phong phú 100%
              </span>
            </div>
          </div>

          {/* Right illustration / candy box card */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="w-full max-w-xs bg-white/90 rounded-2xl border border-[#fae2e5] p-5 shadow-sm space-y-3 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-[#ff6b81] to-[#ffa07a] flex items-center justify-center text-white shadow-md">
                <Candy className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                16 Vị Kẹo Cảm Xúc
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Chọn bất kỳ thể loại nào bạn thích để viết nên câu chuyện ngọt ngào cùng Wyn nhé!
              </p>
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  if (isAdmin) {
                    onOpenAddModalWithGenre('Thanh mai trúc mã');
                  } else {
                    setActiveTab('propose');
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }
                }}
                className="w-full py-2 px-3 text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] hover:opacity-95 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isAdmin ? '+ Tạo nhân vật theo thể loại (Admin) ✨' : '💡 Đề xuất ý tưởng thể loại cho Wyn ✨'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tab Buttons (Matching user mockup) */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            sound.playPop();
            setActiveTab('explore');
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
            activeTab === 'explore'
              ? 'bg-gradient-to-r from-[#ff5364] via-[#ff6b57] to-[#ff7d45] text-white shadow-md'
              : 'bg-white text-slate-700 hover:text-[#b53457] hover:bg-rose-50 border border-[#fae2e5]'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Khám phá các thể loại ({combinedGenresList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playPop();
            setActiveTab('propose');
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
            activeTab === 'propose'
              ? 'bg-gradient-to-r from-[#ff5364] via-[#ff6b57] to-[#ff7d45] text-white shadow-md'
              : 'bg-white text-slate-700 hover:text-[#b53457] hover:bg-rose-50 border border-[#fae2e5]'
          }`}
        >
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Gửi Idea thể loại mới cho Wyn 💡</span>
        </button>
      </div>

      {/* Tab 1: Explore 16 Genres Grid */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          {/* Search bar inside genre page */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#fae2e5]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Tìm thể loại (thanh mai, boy phố, tổng tài...)"
                className="w-full pl-9 pr-3 py-2 text-xs bg-rose-50/40 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>

            <div className="text-xs text-slate-500">
              Hiển thị <span className="font-bold text-[#b53457]">{filteredGenres.length}</span> / {PRESET_GENRES.length} thể loại
            </div>
          </div>

          {/* Grid of 16 Genres */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGenres.map((genre) => {
              // Find characters that belong to this genre
              const genreChars = characters.filter((c) => {
                if (!c.genre) return false;
                const cGenre = c.genre.toLowerCase();
                const gName = genre.name.toLowerCase();
                if (cGenre.includes(gName)) return true;
                if (genre.alias && genre.alias.some((a) => cGenre.includes(a.toLowerCase()))) {
                  return true;
                }
                return false;
              });

              return (
                <div
                  key={genre.id}
                  className="bg-white rounded-3xl border border-[#fae2e5] p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-rose-300 space-y-4"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Emoji & Name */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-2 rounded-2xl bg-rose-50 border border-rose-100 group-hover:scale-110 transition-transform">
                          {genre.emoji}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#b53457] transition-colors">
                            {genre.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {genreChars.length} nhân vật hiện có
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {genre.description}
                    </p>

                    {/* Characters belonging to this genre */}
                    {genreChars.length > 0 && (
                      <div className="pt-2 border-t border-rose-50 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Nhân vật tiêu biểu:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {genreChars.map((char) => (
                            <button
                              key={char.id}
                              type="button"
                              onClick={() => {
                                sound.playPop();
                                onSelectCharacter(char);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-semibold text-[#b53457] hover:bg-rose-100 cursor-pointer"
                            >
                              <span>{char.avatar || '🍬'}</span>
                              <span>{char.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-rose-50">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playPop();
                        if (isAdmin) {
                          onOpenAddModalWithGenre(genre.name);
                        } else {
                          setProposeGenreName(genre.name);
                          setActiveTab('propose');
                          window.scrollTo({ top: 350, behavior: 'smooth' });
                          onToast(`Đã chọn đề xuất cho thể loại ${genre.name}`);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-[#b53457] bg-rose-50 hover:bg-[#fff0f3] border border-[#fbd3db] transition-colors cursor-pointer"
                    >
                      {isAdmin ? (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm nhân vật thể loại này (Admin)</span>
                        </>
                      ) : (
                        <>
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          <span>Gợi ý nhân vật thể loại này</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Propose New Genre / Vibe Form (matching image_c1235de4.png) */}
      {activeTab === 'propose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (8 cols): Concept Form matching user screenshot image_c1235de4.png */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-3xl border border-[#fae2e5] p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span>Gửi Ý Tưởng / Vị Kẹo Mới Cho Wyn</span>
                    <span className="text-amber-500">💡</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cùng Wyn nhào nặn nên những nhân vật độc nhất vô nhị từ trí tưởng tượng của bạn.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                  Concept Form
                </span>
              </div>

              <form onSubmit={handleProposeSubmit} className="space-y-4">
                {/* 1. Tên ý tưởng / vị kẹo đề xuất */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tên ý tưởng / Vị kẹo đề xuất <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={proposeGenreName}
                    onChange={(e) => setProposeGenreName(e.target.value)}
                    placeholder="VD: Kẹo Trà Sữa Trân Châu, Kẹo Táo Gai Hoàng Gia, Boy Phố Si Tình..."
                    className="w-full px-4 py-2.5 text-xs bg-rose-50/30 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>

                {/* Sender Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Biệt danh của bạn
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Ví dụ: Bé Dâu, Mèo Mướp, Cục Kẹo..."
                    className="w-full px-4 py-2.5 text-xs bg-rose-50/30 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>

                {/* 2. Thiết lập hình tượng nhân vật */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Thiết lập hình tượng nhân vật (Tính cách, Vibe, Ngoại hình) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={characterVibe}
                    onChange={(e) => setCharacterVibe(e.target.value)}
                    placeholder="Ví dụ: Tóc bạch kim bồng bềnh, tính cách ngoài mặt lạnh lùng kiêu hãnh nhưng thích ăn đồ ngọt ngầm, hay đỏ mặt khi được khen..."
                    className="w-full px-4 py-2.5 text-xs bg-rose-50/30 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                  />
                </div>

                {/* 3. Đánh giá độ ngọt mong muốn (1 - 5 kẹo) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Đánh giá độ ngọt ngào mong muốn <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs font-bold text-[#b53457]">
                      {getSweetnessLabel(sweetnessLevel)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          sound.playPop();
                          setSweetnessLevel(lvl);
                        }}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                          sweetnessLevel >= lvl
                            ? 'bg-[#fff0f3] border-[#ff5364] shadow-xs scale-105'
                            : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'
                        }`}
                        title={`${lvl} kẹo`}
                      >
                        <Candy className="w-5 h-5 text-[#ff5364]" />
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Chạm vào viên kẹo để chọn độ ngọt mong muốn (1 - 5 kẹo).
                  </p>
                </div>

                {/* 4. Gợi ý câu thì thầm đầu tiên */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gợi ý câu thì thầm đầu tiên (First whisper khi lên kệ)
                  </label>
                  <input
                    type="text"
                    value={sampleQuote}
                    onChange={(e) => setSampleQuote(e.target.value)}
                    placeholder="&ldquo;Hương trà sữa hôm nay ngọt ngào, nhưng không bằng nụ cười của cậu...&rdquo;"
                    className="w-full px-4 py-2.5 text-xs bg-rose-50/30 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>

                {/* 5. Cốt truyện / Backstory tóm tắt */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cốt truyện / Backstory tóm tắt
                  </label>
                  <textarea
                    rows={3}
                    value={storyIdea}
                    onChange={(e) => setStoryIdea(e.target.value)}
                    placeholder="Tóm tắt bối cảnh hai người gặp nhau, tình huống trớ trêu hoặc mối duyên ngọt ngào..."
                    className="w-full px-4 py-2.5 text-xs bg-rose-50/30 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                  />
                </div>

                {/* Privacy Radios */}
                <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-medium text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="genrePrivacy"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                      className="text-rose-500 focus:ring-rose-400"
                    />
                    <span>Công khai lên Bảng Kẹo Ngọt 📌</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="genrePrivacy"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                      className="text-rose-500 focus:ring-rose-400"
                    />
                    <span>Gửi riêng tư cho Wyn 🔒</span>
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#ff5364] via-[#ff6b57] to-[#ff7d45] hover:opacity-95 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi Idea cho Wyn ✨</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column (4 cols): Sidebar Tips & Suggestions Feed */}
          <div className="lg:col-span-4 space-y-5">
            {/* Advice Card */}
            <div className="bg-white rounded-3xl border border-[#fae2e5] p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff6b81] to-[#ffa07a] flex items-center justify-center text-white shadow-sm">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Lời Nhắn Từ Bảng Thể Loại
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Mỗi ý tưởng về tính cách, bối cảnh hay một câu thoại nhỏ của bạn đều là nguồn cảm hứng vô tận để Wyn tạo nên những bạn kẹo mới.
              </p>
              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                <span className="font-bold block uppercase tracking-wider text-[10px]">
                  💡 Gợi ý gu kẹo độc lạ:
                </span>
                <p>
                  Thử kết hợp 2 thể loại đối lập: ví dụ "Ngoài lạnh trong nóng x Cún con" hoặc "Oan gia x Boy phố"!
                </p>
              </div>
            </div>

            {/* Public Suggestions Feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ý tưởng đã gửi ({suggestions.filter((s) => s.isPublic).length})
                </h4>
                <span className="text-[10px] text-slate-400">Từ độc giả</span>
              </div>

              {suggestions
                .filter((s) => s.isPublic)
                .map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-[#fae2e5] p-4 shadow-2xs space-y-2 hover:border-rose-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#b53457]">
                        {item.genreName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.date}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      &ldquo;{item.characterVibe}&rdquo;
                    </p>

                    {item.sampleQuote && (
                      <div className="text-[11px] text-rose-500 font-medium bg-rose-50/60 p-2 rounded-xl">
                        &ldquo;{item.sampleQuote}&rdquo;
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                      <span>Bởi: {item.sender}</span>
                      <span>🍬 {item.sweetnessLevel}/5 kẹo</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
