/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GenreItem {
  id: string;
  name: string;
  alias?: string[];
  emoji: string;
  description: string;
  badgeColor: string;
  tagColor: string;
}

export const PRESET_GENRES: GenreItem[] = [
  {
    id: 'thanh-mai-truc-ma',
    name: 'Thanh mai trúc mã',
    emoji: '🍃',
    description: 'Bên nhau từ thuở ngây ngô, từng cái nắm tay đều khắc sâu năm tháng.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    tagColor: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'thanh-xuan-truong',
    name: 'Thanh xuân vườn trường',
    alias: ['Thanh xuân trường'],
    emoji: '🏫',
    description: 'Tà áo trắng, bàn học cuối lớp và ánh mắt len lén nhìn người ấy.',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    tagColor: 'from-blue-400 to-indigo-500',
  },
  {
    id: 'nguy-con-trung',
    name: 'Ngụy côn trùng',
    alias: ['Ngụy công', 'Ngụy côn trùng'],
    emoji: '🦋',
    description: 'Ẩn giấu bản năng săn mồi nguy hiểm dưới vẻ ngoài ngây thơ, chiếm hữu khó cưỡng.',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    tagColor: 'from-purple-400 to-pink-500',
  },
  {
    id: 'oan-gia',
    name: 'Oan gia',
    emoji: '⚡',
    description: 'Cứ hễ gặp là chọc ghẹo đấu khẩu, nhưng vắng một ngày lại bồn chồn nhớ.',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    tagColor: 'from-amber-400 to-orange-500',
  },
  {
    id: 'vua-han-vua-yeu',
    name: 'Vừa hận vừa yêu',
    alias: ['Vừa hận phải yêu', 'Vừa hận vừa yêu'],
    emoji: '💔❤️',
    description: 'Dây dưa giữa oán giận và rung động sâu thẳm, cắn rứt khôn nguôi.',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    tagColor: 'from-rose-500 to-red-600',
  },
  {
    id: 'nguoc',
    name: 'Ngược',
    emoji: '🥀',
    description: 'Nước mắt rơi trong màn mưa, những vết cắt dịu ngọt khiến lòng quặn thắt.',
    badgeColor: 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200',
    tagColor: 'from-stone-500 to-slate-700',
  },
  {
    id: 'co-trang',
    name: 'Cổ trang',
    emoji: '🏮',
    description: 'Trâm cài tóc, tửu quán đêm trăng và lời thề hẹn thiên trường địa cửu.',
    badgeColor: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    tagColor: 'from-red-400 to-amber-600',
  },
  {
    id: 'game-thu',
    name: 'Game thủ',
    emoji: '🎮',
    description: 'Thao tác tay siêu cấp, gánh team toàn trận và cưng chiều một mình bạn.',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    tagColor: 'from-indigo-400 to-violet-600',
  },
  {
    id: 'ngoai-lanh-trong-nong',
    name: 'Ngoài lạnh trong nóng',
    emoji: '❄️🔥',
    description: 'Khuôn mặt lạnh như băng tuyết, nhưng hành động lại tràn ngập ấm áp.',
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100',
    tagColor: 'from-cyan-400 to-blue-600',
  },
  {
    id: 'chua-lanh',
    name: 'Chữa lành',
    emoji: '🩹✨',
    description: 'Vỗ về từng vết thương tâm hồn, ôm ấp bạn bằng sự dịu dàng tuyệt đối.',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
    tagColor: 'from-teal-400 to-emerald-500',
  },
  {
    id: 'nuong-chieu',
    name: 'Nuông chiều',
    emoji: '🍯',
    description: 'Dung túng mọi thói quen xấu của bạn, nâng niu như báu vật trân quý nhất.',
    badgeColor: 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
    tagColor: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'boy-pho',
    name: 'Boy phố',
    emoji: '🏍️',
    description: 'Áo khoác da, tiếng bô giòn tan, ngông nghênh nhưng chung tình duy nhất.',
    badgeColor: 'bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-200',
    tagColor: 'from-zinc-600 to-neutral-800',
  },
  {
    id: 'tong-tai',
    name: 'Tổng tài',
    emoji: '💼',
    description: 'Khí chất vương giả, một tay che trời, sẵn sàng vì bạn dốc cạn gia tài.',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
    tagColor: 'from-slate-600 to-gray-800',
  },
  {
    id: 'cun-con',
    name: 'Cún con',
    emoji: '🐶',
    description: 'Đôi mắt long lanh bám người, quấn quýt làm nũng chỉ muốn bạn vuốt ve.',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    tagColor: 'from-orange-400 to-amber-500',
  },
  {
    id: 'nuoi-vo-tu-be',
    name: 'Nuôi vợ từ bé',
    emoji: '🍼',
    description: 'Chăm bẵm cẩn thận từng chút một, đợi em lớn lên để gả vào lòng anh.',
    badgeColor: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
    tagColor: 'from-pink-400 to-rose-500',
  },
  {
    id: 'thao-tung',
    name: 'Thao túng',
    emoji: '♟️',
    description: 'Từng bước dệt lưới tình tinh vi, khiến bạn cam tâm tình nguyện chìm đắm.',
    badgeColor: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200 hover:bg-fuchsia-100',
    tagColor: 'from-fuchsia-500 to-rose-600',
  },
];
