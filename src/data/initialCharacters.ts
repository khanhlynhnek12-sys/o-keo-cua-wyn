import { Character } from '../types/character';

export const INITIAL_CHARACTERS: Character[] = [
  {
    id: 'lucian-valerius-01',
    name: 'Lucian Valerius',
    genre: 'Chữa lành',
    tagline: 'Gieo chút ngọt ngào mật ong rừng vào tâm hồn',
    sweetFlavor: 'Kẹo Chocolate Đắng Nhân Mật Ong Rừng Ấm Áp',
    backstory: 'Lucian mang vẻ ngoài trầm ổn lạnh lùng nhưng ánh mắt luôn dõi theo vỗ về từng nỗi niềm sâu thẳm của nàng. Một bờ vai vững chãi cùng nụ cười ấm áp sẵn sàng soi bóng và sưởi ấm tim nàng.',
    firstMessage: 'Nàng vừa bước vào vườn hoa lúc này sao? Trà hoa hồng chocolate mật ong rừng ấm áp đã sẵn sàng cho nàng rồi đấy...',
    characterLink: 'https://character.ai/',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=800&q=80',
    personalityTraits: ['Ngọt ngào', 'Ấm áp', 'Dịu dàng'],
    tastedCount: 1,
    themeColor: {
      bgGradient: 'from-purple-500/10 to-rose-500/10',
      badgeBg: 'bg-purple-100 text-purple-700 border-purple-200',
      badgeText: 'text-purple-700',
      borderActive: 'border-purple-400 ring-purple-200',
      accent: '#8b5cf6',
      softGlow: 'rgba(139, 92, 246, 0.25)',
    },
  },
];
