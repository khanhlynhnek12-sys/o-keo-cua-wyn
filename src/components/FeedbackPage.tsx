import React, { useState, useEffect } from 'react';
import {
  MessageSquareHeart,
  Send,
  Heart,
  Sparkles,
  ArrowLeft,
  Candy,
  Clock,
  Trash2,
  Lightbulb,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Character } from '../types/character';
import { sound } from '../utils/audio';
import {
  FeedbackEntry,
  IdeaEntry,
  subscribeFeedbacks,
  saveFeedbackToFirestore,
  deleteFeedbackFromFirestore,
  subscribeIdeas,
  saveIdeaToFirestore,
  deleteIdeaFromFirestore,
} from '../firebase/services';

interface FeedbackPageProps {
  characters?: Character[];
  onBackToHome: () => void;
  onToast: (msg: string) => void;
  isAdmin: boolean;
  wynAvatar?: string;
}

export const FeedbackPage: React.FC<FeedbackPageProps> = ({
  characters = [],
  onBackToHome,
  onToast,
  isAdmin,
  wynAvatar,
}) => {
  // Tab state: 'review' (Cảm nhận nhân vật) | 'idea' (Gửi Idea kẹo mới)
  const [activeTab, setActiveTab] = useState<'review' | 'idea'>('review');

  // Review Form state
  const [targetCharacter, setTargetCharacter] = useState<string>(() => {
    return characters.length > 0 ? characters[0].name : 'Toàn bộ ổ kẹo của Wyn';
  });
  const [reviewerName, setReviewerName] = useState('');
  const [sweetnessRating, setSweetnessRating] = useState(5);
  const [quoteImpression, setQuoteImpression] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [isPublicReview, setIsPublicReview] = useState(true);

  // Idea Form state
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaSender, setIdeaSender] = useState('');
  const [characterSetup, setCharacterSetup] = useState('');
  const [firstWhisper, setFirstWhisper] = useState('');
  const [backstory, setBackstory] = useState('');

  // Feedbacks database - synced in real-time with Firestore
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>(() => {
    try {
      const saved = localStorage.getItem('wyn_char_reviews_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      //
    }
    return [];
  });

  // Ideas database - synced in real-time with Firestore
  const [ideas, setIdeas] = useState<IdeaEntry[]>(() => {
    try {
      const saved = localStorage.getItem('wyn_idea_submissions_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      //
    }
    return [];
  });

  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isSubmittingIdea, setIsSubmittingIdea] = useState(false);

  useEffect(() => {
    const unsubFeedbacks = subscribeFeedbacks(
      (remoteItems) => {
        setFeedbacks(remoteItems);
        try {
          localStorage.setItem('wyn_char_reviews_v2', JSON.stringify(remoteItems));
        } catch {
          //
        }
      },
      (err) => {
        console.warn('Feedbacks real-time fallback:', err);
      }
    );

    const unsubIdeas = subscribeIdeas(
      (remoteIdeas) => {
        setIdeas(remoteIdeas);
        try {
          localStorage.setItem('wyn_idea_submissions_v2', JSON.stringify(remoteIdeas));
        } catch {
          //
        }
      },
      (err) => {
        console.warn('Ideas real-time fallback:', err);
      }
    );

    return () => {
      unsubFeedbacks();
      unsubIdeas();
    };
  }, []);

  const getRatingLabel = (num: number) => {
    switch (num) {
      case 1:
        return '1 KẸO - HƠI CHÁT / CẦN THÊM VỊ';
      case 2:
        return '2 KẸO - NGỌT THANH DỊU DÀNG';
      case 3:
        return '3 KẸO - VỪA MIỆNG RUNG ĐỘNG';
      case 4:
        return '4 KẸO - RẤT NGỌT SAY ĐẮM';
      case 5:
      default:
        return '5 KẸO - CỰC NGỌT 🍬';
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingReview) return;
    if (!reviewMessage.trim()) {
      onToast('Nàng hãy viết lời cảm nhận chi tiết trước khi gửi nhé!');
      return;
    }

    setIsSubmittingReview(true);
    sound.playSuccess();
    const dateStr = new Date().toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });

    try {
      await saveFeedbackToFirestore({
        characterName: targetCharacter || 'Toàn bộ ổ kẹo của Wyn',
        sender: reviewerName.trim() || 'Một nàng độc giả mê kẹo',
        sweetness: sweetnessRating,
        quoteImpression: quoteImpression.trim(),
        reviewText: reviewMessage.trim(),
        isPublic: isPublicReview,
        date: dateStr,
      });
      onToast('Lời cảm nhận đã được gửi và đồng bộ trực tuyến tới Wyn thành công! 💕');
      setReviewMessage('');
      setQuoteImpression('');
      setReviewerName('');
    } catch (err) {
      console.warn('Could not sync feedback to Firestore:', err);
      onToast('Không thể đồng bộ lên Cloud lúc này, vui lòng thử lại!');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingIdea) return;
    if (!ideaTitle.trim()) {
      onToast('Nàng hãy điền Tên ý tưởng / Vị kẹo đề xuất nhé!');
      return;
    }
    if (!characterSetup.trim()) {
      onToast('Nàng hãy viết thiết lập hình tượng nhân vật (tính cách, vibe) nhé!');
      return;
    }

    setIsSubmittingIdea(true);
    sound.playSuccess();
    const dateStr = new Date().toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });

    try {
      await saveIdeaToFirestore({
        ideaTitle: ideaTitle.trim(),
        sender: ideaSender.trim() || 'Nàng độc giả sáng tạo',
        characterSetup: characterSetup.trim(),
        firstWhisper: firstWhisper.trim(),
        backstory: backstory.trim(),
        date: dateStr,
      });
      onToast('Idea nhân vật mới đã được đồng bộ gửi cho Wyn! Wyn cảm ơn nàng nhiều! ✨');
      setIdeaTitle('');
      setIdeaSender('');
      setCharacterSetup('');
      setFirstWhisper('');
      setBackstory('');
    } catch (err) {
      console.warn('Could not sync idea to Firestore:', err);
      onToast('Không thể đồng bộ ý tưởng lên Cloud lúc này, vui lòng thử lại!');
    } finally {
      setIsSubmittingIdea(false);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    sound.playPop();
    try {
      await deleteFeedbackFromFirestore(id);
      onToast('Đã xóa phản hồi khỏi Cloud.');
    } catch (err) {
      console.warn('Could not delete feedback:', err);
      onToast('Không thể xóa phản hồi lúc này.');
    }
  };

  const handleDeleteIdea = async (id: string) => {
    sound.playPop();
    try {
      await deleteIdeaFromFirestore(id);
      onToast('Đã xóa ý tưởng khỏi Cloud.');
    } catch (err) {
      console.warn('Could not delete idea:', err);
      onToast('Không thể xóa ý tưởng lúc này.');
    }
  };

  const visibleFeedbacks = isAdmin ? feedbacks : feedbacks.filter((f) => f.isPublic);

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
          <span>Hòm thư của Wyn</span>
        </span>
      </div>

      {/* Hero Header Card (matching user feedback layout mockup image_65a1147a.png) */}
      <div className="relative bg-gradient-to-br from-white via-[#fff7f7] to-[#fff0f2] rounded-3xl border border-[#fae2e5] p-6 sm:p-10 shadow-xs space-y-4 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-pink-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff0f3] border border-[#fbd3db] text-[11px] font-bold text-[#cf385e] uppercase tracking-wider">
              <MessageSquareHeart className="w-3.5 h-3.5 text-[#cf385e]" />
              <span>HÒM THƯ TÂM TÌNH TRỰC TUYẾN 🌸</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-[#b53457] tracking-tight">
              Góc Feedback & Hòm Thư Tâm Tình
            </h1>

            {/* Wyn's Quote box */}
            <div className="p-3.5 rounded-2xl bg-white/80 border border-[#fbd9df] text-xs sm:text-sm text-slate-700 italic leading-relaxed">
              &ldquo;Nếu có gì sai sót thì hãy feedback để Wyn biết nè, xin đừng nặng lời nha. Xia xỉa! 🙏 Tym tym! 💕&rdquo;
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#b53457] not-italic mt-2">
                {wynAvatar && (
                  <img
                    src={wynAvatar}
                    alt="Wyn"
                    onError={(e) => {
                      e.currentTarget.src = '/images/wyn_char_lian_1793720549992.jpg';
                    }}
                    className="w-6 h-6 rounded-full object-cover border border-rose-300 shrink-0"
                  />
                )}
                <span>— Wyn 🌸 (Chủ tiệm kẹo)</span>
              </div>
            </div>

            {/* Stat tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#fac8d1] text-slate-700 font-semibold shadow-2xs">
                🧧 Đã nhận {feedbacks.length} lời nhắn yêu thương
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#fac8d1] text-amber-600 font-semibold shadow-2xs">
                ⚡ Thời gian phản hồi: Siêu tốc
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#fac8d1] text-rose-600 font-semibold shadow-2xs">
                🍬 Hương vị: Ngọt ngào 100%
              </span>
            </div>
          </div>

          {/* Right graphic preview box */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="w-full max-w-xs bg-white/90 rounded-2xl border border-[#fae2e5] p-5 shadow-sm space-y-3 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-[#ff6b81] to-[#ffa07a] flex items-center justify-center text-white shadow-md">
                <Heart className="w-7 h-7 fill-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Gửi Lời Thì Thầm
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-hand text-sm">
                Đôi môi em nhạt... Gieo chút kẹo ngọt trên môi em 🍬💋
              </p>
              <div className="text-[10px] text-slate-400">
                Từ hũ kẹo nhỏ của Wyn với cả tình yêu 🌸
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Buttons (Matching user mockups) */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            sound.playPop();
            setActiveTab('review');
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
            activeTab === 'review'
              ? 'bg-gradient-to-r from-[#ff5364] via-[#ff6b57] to-[#ff7d45] text-white shadow-md'
              : 'bg-white text-slate-700 hover:text-[#b53457] hover:bg-rose-50 border border-[#fae2e5]'
          }`}
        >
          <Heart className="w-4 h-4 fill-current" />
          <span>Cảm nhận nhân vật</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playPop();
            setActiveTab('idea');
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
            activeTab === 'idea'
              ? 'bg-gradient-to-r from-[#ff5364] via-[#ff6b57] to-[#ff7d45] text-white shadow-md'
              : 'bg-white text-slate-700 hover:text-[#b53457] hover:bg-rose-50 border border-[#fae2e5]'
          }`}
        >
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Gửi Idea kẹo mới</span>
        </button>
      </div>

      {/* Tab 1: Cảm nhận nhân vật (Review Form + Right Card) */}
      {activeTab === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (8 cols): Review Form matching image_36c7d07d.png */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-3xl border border-[#fae2e5] p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span>Gửi lời thì thầm tới nhân vật</span>
                    <span>🍬</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gửi gắm tình cảm và những xúc cảm rung rinh của bạn đến các bạn kẹo ngọt.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                  Review Form
                </span>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Row 1: Select Character + Nickname */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nhân vật muốn gửi gắm <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={targetCharacter}
                      onChange={(e) => setTargetCharacter(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-rose-50/30 border border-rose-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300 font-medium"
                    >
                      <option value="Toàn bộ ổ kẹo của Wyn">
                        🍯 Toàn bộ ổ kẹo của Wyn
                      </option>
                      {characters.map((c) => (
                        <option key={c.id} value={c.name}>
                          🍬 {c.name} ({c.sweetFlavor})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Biệt danh của bạn <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="Ví dụ: Bé Dâu, Mèo Mướp, Cục Kẹo..."
                      className="w-full px-3.5 py-2.5 text-xs bg-rose-50/30 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>
                </div>

                {/* Row 2: Candy Rating matching mockup */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Đánh giá độ ngọt ngào của nhân vật <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs font-bold text-[#b53457]">
                      {getRatingLabel(sweetnessRating)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          sound.playPop();
                          setSweetnessRating(lvl);
                        }}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                          sweetnessRating >= lvl
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
                    Chạm vào viên kẹo để chấm điểm độ ngọt ngào (1 - 5 kẹo).
                  </p>
                </div>

                {/* Row 3: First Quote impression */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Lời thì thầm chạm đến tim bạn nhất / Trích dẫn ấn tượng
                  </label>
                  <input
                    type="text"
                    value={quoteImpression}
                    onChange={(e) => setQuoteImpression(e.target.value)}
                    placeholder="&ldquo;Em có biết không? Giữa muôn vàn viên kẹo trên đời...&rdquo;"
                    className="w-full px-3.5 py-2.5 text-xs bg-rose-50/30 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>

                {/* Row 4: Detailed Review Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cảm nhận chi tiết & Lời nhắn riêng cho nhân vật <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={reviewMessage}
                    onChange={(e) => setReviewMessage(e.target.value)}
                    placeholder="Kể cho Wyn nghe khoảnh khắc bạn rung động nhất, hoặc điều bạn muốn gửi gắm đến nhân vật này nè..."
                    className="w-full px-3.5 py-2.5 text-xs bg-rose-50/30 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                  />
                </div>

                {/* Row 5: Radios and Submit button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-5 text-xs font-medium text-slate-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="reviewPrivacy"
                        checked={isPublicReview}
                        onChange={() => setIsPublicReview(true)}
                        className="text-rose-500 focus:ring-rose-400"
                      />
                      <span>Công khai lên Bảng Kẹo Ngọt 📌</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="reviewPrivacy"
                        checked={!isPublicReview}
                        onChange={() => setIsPublicReview(false)}
                        className="text-rose-500 focus:ring-rose-400"
                      />
                      <span>Gửi riêng tư cho Wyn 🔒</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#ff5364] via-[#ff6b57] to-[#ff7d45] hover:opacity-95 disabled:opacity-60 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingReview ? 'Đang gửi...' : 'Gửi cảm nhận nhân vật 💕'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column (4 cols): Lời Nhắn Từ Chiếc Hòm Kẹo card */}
          <div className="lg:col-span-4 space-y-5">
            {/* Box matching image_65a1147a.png right card */}
            <div className="bg-white rounded-3xl border border-[#fae2e5] p-6 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff6b81] to-[#ff5364] flex items-center justify-center text-white shadow-sm">
                <Heart className="w-5 h-5 fill-white" />
              </div>

              <h3 className="text-base font-bold text-slate-800">
                Lời Nhắn Từ Chiếc Hòm Kẹo
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Mỗi dòng cảm nhận của bạn chính là nguồn đường mật lớn nhất nuôi dưỡng tâm hồn viết lách của Wyn. Wyn sẽ đọc hết từng câu từng chữ và ghim những lá thư ấm áp nhất lên bảng tin đó!
              </p>

              <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200/80 space-y-1 text-xs">
                <span className="font-bold text-[#b53457] block uppercase tracking-wider text-[10px]">
                  GỢI Ý NGỌT NGÀO
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Đừng ngại chia sẻ cả những đoạn bạn thấy hơi chát nhẹ hay cần nêm thêm vị ngọt nhé!
                </p>
              </div>
            </div>

            {/* Public Review Letters List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Thư tâm tình ({visibleFeedbacks.length})
                </h4>
                <span className="text-[10px] text-emerald-600 font-semibold">● Đồng bộ Realtime</span>
              </div>

              {visibleFeedbacks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-[#fac8d1] p-6 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-xl">
                    💌
                  </div>
                  <h5 className="text-xs font-bold text-slate-700">Chưa có bức thư nào</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Hãy là người đầu tiên gửi lời thì thầm ngọt ngào tới nhân vật nhé! 🍬
                  </p>
                </div>
              ) : (
                visibleFeedbacks.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-[#fae2e5] p-4 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-rose-50 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-[#b53457] font-bold text-xs">
                            {item.sender.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h5 className="text-xs font-bold text-slate-800">
                                {item.sender}
                              </h5>
                              {!item.isPublic && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                  <Lock className="w-2.5 h-2.5" />
                                  Riêng tư
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-rose-500 font-medium">
                              Gửi tới: {item.characterName}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">
                            {item.date}
                          </span>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteFeedback(item.id)}
                              className="p-1 text-slate-300 hover:text-red-500 cursor-pointer"
                              title="Xóa phản hồi này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {item.quoteImpression && (
                        <div className="text-[11px] text-[#b53457] bg-rose-50/70 p-2 rounded-xl italic">
                          &ldquo;{item.quoteImpression}&rdquo;
                        </div>
                      )}

                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        &ldquo;{item.reviewText}&rdquo;
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-amber-600 font-semibold pt-1">
                        <span>🍬 {item.sweetness}/5 kẹo</span>
                        {item.sticker && (
                          <span className="text-rose-500 font-medium">{item.sticker}</span>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Gửi Idea kẹo mới (Concept Form matching image_c1235de4.png) */}
      {activeTab === 'idea' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (8 cols): Concept Form */}
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

              <form onSubmit={handleIdeaSubmit} className="space-y-4">
                {/* Tên ý tưởng / Vị kẹo đề xuất */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tên ý tưởng / Vị kẹo đề xuất <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value)}
                    placeholder="VD: Kẹo Trà Sữa Trân Châu, Kẹo Táo Gai Hoàng Gia..."
                    className="w-full px-4 py-2.5 text-xs bg-rose-50/30 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>

                {/* Biệt danh tác giả idea */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Biệt danh của bạn
                  </label>
                  <input
                    type="text"
                    value={ideaSender}
                    onChange={(e) => setIdeaSender(e.target.value)}
                    placeholder="Ví dụ: Bé Dâu, Mèo Mướp..."
                    className="w-full px-4 py-2.5 text-xs bg-rose-50/30 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>

                {/* Thiết lập hình tượng nhân vật */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Thiết lập hình tượng nhân vật (Tính cách, Vibe, Ngoại hình) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={characterSetup}
                    onChange={(e) => setCharacterSetup(e.target.value)}
                    placeholder="Ví dụ: Tóc bạch kim bồng bềnh, tính cách ngoài mặt lạnh lùng kiêu hãnh nhưng thích ăn đồ ngọt ngầm, hay đỏ mặt khi được khen..."
                    className="w-full px-4 py-2.5 text-xs bg-rose-50/30 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                  />
                </div>

                {/* Gợi ý câu thì thầm đầu tiên */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gợi ý câu thì thầm đầu tiên (First whisper khi lên kệ)
                  </label>
                  <input
                    type="text"
                    value={firstWhisper}
                    onChange={(e) => setFirstWhisper(e.target.value)}
                    placeholder="&ldquo;Hương trà sữa hôm nay ngọt ngào, nhưng không bằng nụ cười của cậu...&rdquo;"
                    className="w-full px-4 py-2.5 text-xs bg-rose-50/30 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>

                {/* Cốt truyện / Backstory tóm tắt */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cốt truyện / Backstory tóm tắt
                  </label>
                  <textarea
                    rows={3}
                    value={backstory}
                    onChange={(e) => setBackstory(e.target.value)}
                    placeholder="Tóm tắt bối cảnh hai người gặp nhau, tình huống trớ trêu hoặc mối duyên ngọt ngào..."
                    className="w-full px-4 py-2.5 text-xs bg-rose-50/30 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmittingIdea}
                  className="w-full flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#ff5364] via-[#ff6b57] to-[#ff7d45] hover:opacity-95 disabled:opacity-60 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingIdea ? 'Đang gửi...' : 'Gửi Idea cho Wyn ✨'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column (4 cols): Advice & Submissions */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white rounded-3xl border border-[#fae2e5] p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Gợi Ý Từ Phòng Thí Nghiệm Kẹo
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Một nhân vật cuốn hút thường có sự tương phản thú vị: chẳng hạn như bề ngoài dữ dằn nhưng bên trong là "cún con", hoặc là một tổng tài nhưng luôn mang theo kẹo sữa cho bạn.
              </p>
            </div>

            {/* Ideas List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ý tưởng đã nộp ({ideas.length})
                </h4>
                <span className="text-[10px] text-slate-400">Được yêu thích</span>
              </div>

              {ideas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-amber-200 p-6 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-xl">
                    💡
                  </div>
                  <h5 className="text-xs font-bold text-slate-700">Chưa có ý tưởng nào</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Hãy gửi ý tưởng nhân vật hoặc vị kẹo đầu tiên cho Wyn nhé! ✨
                  </p>
                </div>
              ) : (
                ideas.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-[#fae2e5] p-4 shadow-2xs space-y-2 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-700">
                        💡 {item.ideaTitle}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400">{item.date}</span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteIdea(item.id)}
                            className="p-1 text-slate-300 hover:text-red-500 cursor-pointer"
                            title="Xóa ý tưởng này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      &ldquo;{item.characterSetup}&rdquo;
                    </p>

                    {item.firstWhisper && (
                      <div className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-xl">
                        &ldquo;{item.firstWhisper}&rdquo;
                      </div>
                    )}

                    {item.backstory && (
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {item.backstory}
                      </p>
                    )}

                    <div className="text-[10px] text-slate-400 pt-1">
                      Người gửi: {item.sender}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
