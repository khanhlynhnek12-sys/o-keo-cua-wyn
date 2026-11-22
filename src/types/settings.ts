export type OverlayTint = 'pink' | 'peach' | 'lavender' | 'none';

export interface WebBackgroundConfig {
  mode: 'video' | 'image';
  type: 'none' | 'image' | 'video' | 'gif';
  url: string;
  opacity: number; // 0.1 to 1 (controls opacity / softening)
  blur?: number; // 0 to 16 px
  overlayTint: OverlayTint;
  loop: boolean;
  name?: string;
  fileSizeText?: string;
  updatedAt?: string;
}

export const DEFAULT_WEB_BG: WebBackgroundConfig = {
  mode: 'image',
  type: 'image',
  url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=80',
  opacity: 0.55,
  blur: 0,
  overlayTint: 'lavender',
  loop: true,
  name: 'Rừng hoa Jacaranda tím ngát',
};
