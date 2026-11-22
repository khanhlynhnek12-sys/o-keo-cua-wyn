/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Volume1,
  Music,
  ExternalLink,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ListMusic,
  Heart,
} from 'lucide-react';
import { sound } from '../utils/audio';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, any>;
          events?: {
            onReady?: (event: { target: any }) => void;
            onStateChange?: (event: { data: number; target: any }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => any;
      PlayerState?: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
  }
}

export interface SongTrack {
  id: string;
  title: string;
  artist: string;
  videoId: string;
  link: string;
  emoji: string;
}

export const PLAYLIST: SongTrack[] = [
  {
    id: 'song-2',
    title: 'Nhẹ Buông',
    artist: 'Hằng ssi',
    videoId: 'NbKCJtFkQ4s',
    link: 'https://youtu.be/NbKCJtFkQ4s?si=wQFsuMVY-VskkQIt',
    emoji: '🍃',
  },
  {
    id: 'song-1',
    title: 'Gửi em, người bất tử',
    artist: 'Ân Ngờ FT. Mỹ Mỹ',
    videoId: 'PF3exV7ck7s',
    link: 'https://youtu.be/PF3exV7ck7s?si=Ppiww8SFrl-KL17J',
    emoji: '🌸',
  },
  {
    id: 'song-3',
    title: 'Take Me Hand',
    artist: 'Dance Daishi',
    videoId: 'oE6n_AG9j0Q',
    link: 'https://youtu.be/oE6n_AG9j0Q?si=JYMCw4P_EJDxcwdj',
    emoji: '✨',
  },
  {
    id: 'song-4',
    title: 'Gái Tây Gốc Việt',
    artist: 'Nicole Nguyễn ft Tommy Tèo',
    videoId: 'uGO9XiPiZsQ',
    link: 'https://youtu.be/uGO9XiPiZsQ?si=JHDamTyDgZGf1O_A',
    emoji: '💃',
  },
  {
    id: 'song-5',
    title: 'Bạch Nguyệt Quang Và Nốt Chu Sa',
    artist: 'Đại Tử',
    videoId: 'm6yytX2gHxs',
    link: 'https://youtu.be/m6yytX2gHxs?si=Kc_9xGVwfAbPdcuM',
    emoji: '🌙',
  },
  {
    id: 'song-6',
    title: 'Phi Điểu và Ve Sầu',
    artist: 'Nhậm Nhiên',
    videoId: '5RdSua1R8c0',
    link: 'https://youtu.be/5RdSua1R8c0?si=S7FL7xz9sH5BfqnD',
    emoji: '🕊️',
  },
];

interface SpinningMusicPlayerProps {
  autoPlayTrigger?: boolean;
}

export const SpinningMusicPlayer: React.FC<SpinningMusicPlayerProps> = ({
  autoPlayTrigger = false,
}) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    try {
      const saved = localStorage.getItem('wyn_music_track_index');
      if (saved) {
        const idx = Number(saved);
        if (idx >= 0 && idx < PLAYLIST.length) return idx;
      }
    } catch {
      //
    }
    return 0;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('wyn_music_volume');
      return saved ? Number(saved) : 80;
    } catch {
      return 80;
    }
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaylistTab, setShowPlaylistTab] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const playerRef = useRef<any>(null);
  const currentTrackIndexRef = useRef(currentTrackIndex);
  currentTrackIndexRef.current = currentTrackIndex;

  const hasAttemptedAutoPlayRef = useRef(false);

  const currentSong = PLAYLIST[currentTrackIndex] || PLAYLIST[0];

  // 1. Initialize YouTube IFrame API
  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;

      try {
        playerRef.current = new window.YT.Player('wyn-yt-music-player', {
          videoId: currentSong.videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            loop: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (!isMounted) return;
              setIsReady(true);
              event.target.setVolume(volume);
              if (isMuted) {
                event.target.mute();
              } else {
                event.target.unMute();
              }

              // Autoplay immediately on ready
              try {
                event.target.playVideo();
                setIsPlaying(true);
              } catch {
                // Browser might block until user gesture
              }
            },
            onStateChange: (event) => {
              if (!isMounted) return;
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                // Auto-advance to next song in playlist when finished
                const nextIdx = (currentTrackIndexRef.current + 1) % PLAYLIST.length;
                setCurrentTrackIndex(nextIdx);
                try {
                  localStorage.setItem('wyn_music_track_index', String(nextIdx));
                } catch {
                  //
                }
                const nextSong = PLAYLIST[nextIdx];
                if (nextSong && event.target?.loadVideoById) {
                  event.target.loadVideoById(nextSong.videoId);
                  event.target.playVideo();
                  setIsPlaying(true);
                }
              }
            },
          },
        });
      } catch (err) {
        console.warn('YT Player init error:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Load YouTube API script if not already present
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = () => {
        if (isMounted) initPlayer();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Play on trigger (e.g. when welcome modal closes or user enters web)
  useEffect(() => {
    if (autoPlayTrigger && playerRef.current && isReady) {
      try {
        playerRef.current.unMute();
        playerRef.current.playVideo();
        setIsPlaying(true);
      } catch {
        //
      }
    }
  }, [autoPlayTrigger, isReady]);

  // 3. User interaction listener to satisfy browser autoplay policy on first click/tap
  useEffect(() => {
    const handleFirstUserInteraction = () => {
      if (!hasAttemptedAutoPlayRef.current && playerRef.current && isReady) {
        hasAttemptedAutoPlayRef.current = true;
        try {
          if (playerRef.current.getPlayerState?.() !== 1) {
            playerRef.current.playVideo();
            setIsPlaying(true);
          }
        } catch {
          //
        }
      }
    };

    window.addEventListener('click', handleFirstUserInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstUserInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('touchstart', handleFirstUserInteraction);
    };
  }, [isReady]);

  // Control handlers
  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sound.playPop();

    if (!playerRef.current || !isReady) return;

    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.unMute();
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSelectTrack = (index: number) => {
    sound.playChime();
    setCurrentTrackIndex(index);
    try {
      localStorage.setItem('wyn_music_track_index', String(index));
    } catch {
      //
    }

    const targetSong = PLAYLIST[index];
    if (playerRef.current && targetSong) {
      try {
        playerRef.current.unMute();
        playerRef.current.loadVideoById(targetSong.videoId);
        playerRef.current.playVideo();
        setIsPlaying(true);
      } catch {
        //
      }
    }
  };

  const handleNextTrack = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextIdx = (currentTrackIndex + 1) % PLAYLIST.length;
    handleSelectTrack(nextIdx);
  };

  const handlePrevTrack = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const prevIdx = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    handleSelectTrack(prevIdx);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    try {
      localStorage.setItem('wyn_music_volume', String(newVol));
    } catch {
      //
    }
    if (playerRef.current && isReady) {
      try {
        playerRef.current.setVolume(newVol);
        if (newVol > 0 && isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
        }
      } catch {
        //
      }
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sound.playPop();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (playerRef.current && isReady) {
      try {
        if (nextMuted) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
          playerRef.current.setVolume(volume);
        }
      } catch {
        //
      }
    }
  };

  return (
    <>
      {/* Hidden YouTube IFrame */}
      <div
        className="fixed -top-[9999px] -left-[9999px] w-1 h-1 opacity-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div id="wyn-yt-music-player" />
      </div>

      {/* Floating Animated Music Notes when playing */}
      {isPlaying && (
        <div
          className="fixed bottom-16 left-8 z-35 pointer-events-none overflow-visible select-none"
          aria-hidden="true"
        >
          <span className="absolute animate-float-note-1 text-sm text-pink-400 opacity-80">
            🎵
          </span>
          <span className="absolute animate-float-note-2 text-xs text-rose-500 opacity-75">
            🎶
          </span>
          <span className="absolute animate-float-note-3 text-sm text-amber-400 opacity-85">
            ✨
          </span>
        </div>
      )}

      {/* Keyframe styles for spinning vinyl disc and floating notes */}
      <style>{`
        @keyframes vinylSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-vinyl-spin {
          animation: vinylSpin 6s linear infinite;
        }
        .paused-vinyl {
          animation-play-state: paused !important;
        }

        @keyframes floatNote1 {
          0% { transform: translate3d(0, 0, 0) scale(0.6); opacity: 0; }
          25% { opacity: 0.9; }
          100% { transform: translate3d(-18px, -65px, 0) scale(1.1) rotate(-20deg); opacity: 0; }
        }
        @keyframes floatNote2 {
          0% { transform: translate3d(10px, 0, 0) scale(0.5); opacity: 0; }
          30% { opacity: 0.85; }
          100% { transform: translate3d(22px, -80px, 0) scale(1) rotate(25deg); opacity: 0; }
        }
        @keyframes floatNote3 {
          0% { transform: translate3d(4px, 0, 0) scale(0.6); opacity: 0; }
          20% { opacity: 0.95; }
          100% { transform: translate3d(-8px, -95px, 0) scale(1.2) rotate(15deg); opacity: 0; }
        }
        .animate-float-note-1 { animation: floatNote1 2.8s ease-in-out infinite; }
        .animate-float-note-2 { animation: floatNote2 3.2s ease-in-out infinite 0.9s; }
        .animate-float-note-3 { animation: floatNote3 2.5s ease-in-out infinite 1.6s; }

        @keyframes soundWave {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .animate-sound-wave-1 { animation: soundWave 0.8s ease-in-out infinite; }
        .animate-sound-wave-2 { animation: soundWave 1.1s ease-in-out infinite 0.2s; }
        .animate-sound-wave-3 { animation: soundWave 0.9s ease-in-out infinite 0.4s; }
        .animate-sound-wave-4 { animation: soundWave 1.2s ease-in-out infinite 0.1s; }
      `}</style>

      {/* Main Spinning Music Player Widget at Bottom-Left */}
      <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-2 select-none">
        
        {/* Expanded Music Player Card */}
        {isExpanded && (
          <div className="w-80 sm:w-92 bg-[#231422]/95 backdrop-blur-md rounded-3xl border border-[#ff8db3]/40 p-4 sm:p-5 shadow-2xl space-y-3.5 text-white animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Header with Title & Playlist Toggle */}
            <div className="flex items-center justify-between pb-2 border-b border-pink-500/20">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold text-pink-200 uppercase tracking-wider">
                  Nhạc nền Ổ kẹo của Wyn
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* Playlist Drawer Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setShowPlaylistTab(!showPlaylistTab);
                  }}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    showPlaylistTab
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-pink-300 hover:text-white hover:bg-pink-500/20'
                  }`}
                  title="Danh sách bài hát"
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{PLAYLIST.length} bài</span>
                </button>

                {/* Collapse button */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setIsExpanded(false);
                  }}
                  className="p-1 text-pink-300 hover:text-white rounded-lg hover:bg-pink-500/20 cursor-pointer transition-colors"
                  title="Thu nhỏ thanh nhạc"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Playlist Drawer (When toggled on) */}
            {showPlaylistTab && (
              <div className="space-y-1.5 bg-pink-950/50 p-2 rounded-2xl border border-pink-500/20 max-h-52 sm:max-h-60 overflow-y-auto">
                <div className="text-[11px] font-bold text-pink-300 px-1 flex items-center justify-between">
                  <span>Danh sách phát ({PLAYLIST.length})</span>
                  <span className="text-[10px] font-normal text-pink-200/80">Chạm để đổi bài</span>
                </div>
                <div className="space-y-1">
                  {PLAYLIST.map((track, idx) => {
                    const isCurrent = idx === currentTrackIndex;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => handleSelectTrack(idx)}
                        className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-gradient-to-r from-rose-500/80 to-pink-600/80 text-white font-bold shadow-xs'
                            : 'bg-black/20 hover:bg-black/40 text-pink-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm shrink-0">{track.emoji}</span>
                          <div className="min-w-0">
                            <div className="truncate font-bold text-xs">{track.title}</div>
                            <div className="truncate text-[10px] text-pink-200/80 font-normal">
                              {track.artist}
                            </div>
                          </div>
                        </div>

                        {/* Playing wave animation indicator */}
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end gap-0.5 h-3 px-1 shrink-0">
                            <span className="w-0.5 bg-white rounded-full animate-sound-wave-1" />
                            <span className="w-0.5 bg-pink-100 rounded-full animate-sound-wave-2" />
                            <span className="w-0.5 bg-white rounded-full animate-sound-wave-3" />
                          </div>
                        ) : isCurrent ? (
                          <span className="text-[10px] text-pink-200 shrink-0">Đã chọn</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Currently Playing Track Highlight Box */}
            <div className="flex items-center gap-3.5 bg-pink-950/40 p-2.5 rounded-2xl border border-pink-500/20">
              {/* Spinning Vinyl Disc */}
              <div
                onClick={togglePlay}
                className="relative w-12 h-12 rounded-full bg-slate-900 border-2 border-pink-300/60 shadow-md shrink-0 flex items-center justify-center cursor-pointer group"
                style={{
                  background:
                    'radial-gradient(circle, #2d182b 25%, #180d17 50%, #2e172a 75%, #140b13 100%)',
                }}
              >
                {/* Vinyl Grooves effect */}
                <div className="absolute inset-1 rounded-full border border-pink-400/20 pointer-events-none" />
                <div className="absolute inset-2 rounded-full border border-pink-400/10 pointer-events-none" />

                {/* Spinning Center Label */}
                <div
                  className={`w-5 h-5 rounded-full bg-gradient-to-tr from-[#ff4d6d] to-[#ffa07a] flex items-center justify-center text-[10px] text-white shadow-xs ${
                    isPlaying ? 'animate-vinyl-spin' : 'paused-vinyl'
                  }`}
                >
                  {currentSong.emoji}
                </div>

                {/* Play/Pause Hover Overlay */}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs">
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </div>
              </div>

              {/* Song Title & Author */}
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-bold text-pink-100 truncate">
                  {currentSong.title}
                </div>
                <div className="text-[11px] text-pink-300 truncate">
                  {currentSong.artist}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  <span className="text-[10px] text-pink-200/80">
                    {isPlaying ? 'Đang phát du dương...' : 'Tạm dừng'}
                  </span>
                </div>
              </div>

              {/* External YouTube Link Button */}
              <a
                href={currentSong.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-xl bg-pink-900/60 hover:bg-pink-800 text-pink-200 hover:text-white transition-colors shrink-0"
                title="Mở MV trên YouTube"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Controls Row: Prev, Play/Pause, Next, Mute, Volume Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between gap-2">
                {/* Previous Track Button */}
                <button
                  type="button"
                  onClick={handlePrevTrack}
                  className="p-2 rounded-2xl bg-pink-950/60 hover:bg-pink-900 text-pink-200 border border-pink-500/30 transition-colors cursor-pointer active:scale-95"
                  title="Bài trước đó"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                {/* Main Play / Pause Button */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="flex-1 py-2 px-3 rounded-2xl bg-gradient-to-r from-[#ff4d6d] to-[#ff7d45] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-rose-900/40 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Tạm dừng</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      <span>Bật nhạc</span>
                    </>
                  )}
                </button>

                {/* Next Track Button */}
                <button
                  type="button"
                  onClick={handleNextTrack}
                  className="p-2 rounded-2xl bg-pink-950/60 hover:bg-pink-900 text-pink-200 border border-pink-500/30 transition-colors cursor-pointer active:scale-95"
                  title="Bài kế tiếp"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>

                {/* Mute / Unmute Button */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-2 rounded-2xl bg-pink-950/60 hover:bg-pink-900 text-pink-200 border border-pink-500/30 transition-colors cursor-pointer"
                  title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : volume > 50 ? (
                    <Volume2 className="w-4 h-4 text-pink-300" />
                  ) : (
                    <Volume1 className="w-4 h-4 text-pink-300" />
                  )}
                </button>
              </div>

              {/* Volume Slider Bar */}
              <div className="flex items-center gap-2.5 pt-1">
                <span className="text-[11px] font-bold text-pink-300 shrink-0">Âm lượng</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={2}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer h-1.5 rounded-lg bg-pink-950/80"
                />
                <span className="text-[11px] font-bold text-pink-300 w-7 text-right shrink-0">
                  {isMuted ? '0%' : `${volume}%`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Compact Bar / Disc Button (Default Always Visible) */}
        <div
          onClick={() => {
            sound.playChime();
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-full bg-[#241322]/90 backdrop-blur-md border border-pink-400/50 text-white text-xs font-bold shadow-xl hover:shadow-2xl hover:scale-102 transition-all cursor-pointer group"
          title="Nhấn để mở trình phát nhạc & danh sách bài hát"
        >
          {/* Spinning Vinyl Record Badge */}
          <div
            className="relative w-8 h-8 rounded-full bg-slate-900 border border-pink-300/80 shadow-inner shrink-0 flex items-center justify-center overflow-hidden"
            style={{
              background:
                'radial-gradient(circle, #2d182b 30%, #150b14 60%, #2f172a 100%)',
            }}
          >
            {/* Center label with rotating animation */}
            <div
              className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#ff4d6d] to-[#ffa07a] flex items-center justify-center text-[7px] text-white shadow-xs ${
                isPlaying ? 'animate-vinyl-spin' : 'paused-vinyl'
              }`}
            >
              {currentSong.emoji}
            </div>

            {/* Center hole dot */}
            <div className="absolute w-1 h-1 rounded-full bg-slate-950 pointer-events-none" />
          </div>

          {/* Song Info Marquee / Label */}
          <div className="flex flex-col text-left max-w-[120px] sm:max-w-[160px] overflow-hidden leading-tight">
            <span className="text-[11px] sm:text-xs font-bold text-pink-100 truncate group-hover:text-white transition-colors">
              {currentSong.title}
            </span>
            <span className="text-[9px] sm:text-[10px] text-pink-300 truncate font-normal">
              {currentSong.artist}
            </span>
          </div>

          {/* Animated Sound Wave bars when playing */}
          {isPlaying ? (
            <div className="flex items-end gap-0.5 h-4 px-1" title="Đang phát">
              <span className="w-0.5 bg-rose-400 rounded-full animate-sound-wave-1" />
              <span className="w-0.5 bg-pink-300 rounded-full animate-sound-wave-2" />
              <span className="w-0.5 bg-rose-400 rounded-full animate-sound-wave-3" />
              <span className="w-0.5 bg-pink-200 rounded-full animate-sound-wave-4" />
            </div>
          ) : (
            <div className="flex items-center text-pink-300/70 text-[10px] px-1">
              ⏸️
            </div>
          )}

          {/* Quick Next Track Button on Compact Bar */}
          <button
            type="button"
            onClick={handleNextTrack}
            className="p-1 rounded-full hover:bg-pink-800/60 text-pink-300 hover:text-white transition-colors shrink-0"
            title="Đổi sang bài kế tiếp"
          >
            <SkipForward className="w-3 h-3" />
          </button>

          {/* Quick Play/Pause Button on Compact Bar */}
          <button
            type="button"
            onClick={togglePlay}
            className="p-1 rounded-full bg-pink-900/60 hover:bg-pink-700/80 text-white transition-colors shrink-0"
            title={isPlaying ? 'Tạm dừng nhạc' : 'Phát nhạc'}
          >
            {isPlaying ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3 fill-white ml-0.2" />
            )}
          </button>

          {/* Expand Arrow */}
          <span className="text-pink-300 group-hover:text-white transition-transform">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </span>
        </div>
      </div>
    </>
  );
};
