export interface Character {
  id: string;
  name: string;
  genre: string; // Thể loại
  tagline: string;
  backstory: string; // Tiểu sử / Cốt truyện
  firstMessage: string; // Tin nhắn đầu
  characterLink: string; // Link nhân vật
  avatar: string;
  sweetFlavor: string; // Vị kẹo biểu tượng
  personalityTraits: string[];
  themeColor: {
    bgGradient: string;
    badgeBg: string;
    badgeText: string;
    borderActive: string;
    accent: string;
    softGlow: string;
  };
  sampleReplies?: string[];
  isFavorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
  tastedCount?: number; // Đã có ... nàng thưởng thức kẹo
}

export type ViewMode = 'grid' | 'cinema' | 'compact';
