'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Play, Pause, Download, Share2, Volume2, 
  VolumeX, 
  Upload, Search, Loader2
} from 'lucide-react';
import { audioEngine } from '../lib/audioEngine';
import { PRESET_SONGS } from '../lib/songLibrary';
import { searchOnlineMusic, POPULAR_MUSIC_SEARCH_PRESETS } from '../lib/musicSearch';
import { generateStatusVideo, ExportProgress, drawMusicSticker, drawWaveformOverlay, drawSparkleParticles } from '../lib/videoGenerator';
import { drawContactPlate } from '../lib/contactPlate';
import type { SongTrack, StatusCustomization, AgentProfile, PosterTemplate } from '../types';

interface PosterMusicStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  posterUrl: string;
  posterTitle: string;
  projectName?: string;
  agentName: string;
  agentPhone: string;
  agentRole?: 'Sales Executive' | 'Referral Partner' | 'Relationship Manager';
}

export function PosterMusicStatusModal({
  isOpen,
  onClose,
  posterUrl,
  posterTitle,
  projectName = 'Saraswati Nagri',
  agentName,
  agentPhone,
  agentRole = 'Sales Executive',
}: PosterMusicStatusModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedSong, setSelectedSong] = useState<SongTrack>(PRESET_SONGS[0]);
  const [customSongs, setCustomSongs] = useState<SongTrack[]>([]);
  const [onlineSearchResults, setOnlineSearchResults] = useState<SongTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [activePresetFilter, setActivePresetFilter] = useState('All');

  const [posterImg, setPosterImg] = useState<HTMLImageElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [customization, setCustomization] = useState<StatusCustomization>({
    durationSec: 15,
    startOffsetSec: 0,
    showMusicSticker: true,
    musicStickerPosition: 'top_right',
    motionEffect: 'ken_burns',
    showWaveformOverlay: true,
    musicVolume: 0.85,
    personalizePlate: true,
  });

  const agent: AgentProfile = React.useMemo(() => ({
    name: agentName || 'Rahul Mehta',
    phone: agentPhone || '+91 94221 54321',
    role: agentRole,
  }), [agentName, agentPhone, agentRole]);

  const template: PosterTemplate = {
    id: 'crm-poster',
    title: posterTitle,
    projectName,
    category: 'sn3',
    imageUrl: posterUrl,
    aspectRatio: '9:16',
    tag: 'Daily Layout Media',
    headline: posterTitle,
    subheadline: projectName,
    badge: 'Saraswati Nagri',
    highlights: [],
  };

  // Load image
  useEffect(() => {
    if (!posterUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setPosterImg(img);
    img.onerror = () => setPosterImg(null);
    img.src = posterUrl;
  }, [posterUrl]);

  // Audio subscribe
  useEffect(() => {
    const unsub = audioEngine.subscribe((playing, time) => {
      setIsPlaying(playing);
      setCurrentTime(time);
      if (time >= customization.durationSec) {
        audioEngine.play(selectedSong, customization.startOffsetSec, isMuted ? 0 : customization.musicVolume);
      }
    });
    return () => { unsub(); };
  }, [selectedSong, customization.durationSec, customization.startOffsetSec, customization.musicVolume, isMuted]);

  // Stop audio on unmount or close
  useEffect(() => {
    if (!isOpen) {
      audioEngine.stop();
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setOnlineSearchResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const results = await searchOnlineMusic(searchQuery.trim(), 10);
        setOnlineSearchResults(results);
      } catch (err) {
        console.error('Online search error', err);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Render loop
  useEffect(() => {
    let animId: number;
    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const W = canvas.width;
          const H = canvas.height;
          const animTime = currentTime;

          // Motion Zoom
          ctx.save();
          if (customization.motionEffect === 'ken_burns') {
            const zoom = 1 + ((animTime % customization.durationSec) / customization.durationSec) * 0.05;
            ctx.translate(W / 2, H / 2);
            ctx.scale(zoom, zoom);
            ctx.translate(-W / 2, -H / 2);
          }

          if (posterImg) {
            ctx.drawImage(posterImg, 0, 0, W, H);
          } else {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, W, H);
          }
          ctx.restore();

          // Sparkles
          if (customization.motionEffect === 'golden_sparkles') {
            drawSparkleParticles(ctx, W, H, animTime);
          }

          const freq = audioEngine.getFrequencyData();
          if (customization.showWaveformOverlay || customization.motionEffect === 'audio_wave') {
            drawWaveformOverlay(ctx, W, H, freq, animTime);
          }

          if (customization.personalizePlate) {
            drawContactPlate(ctx, W, H, agent);
          }

          if (customization.showMusicSticker) {
            drawMusicSticker(ctx, W, H, selectedSong, customization, animTime, freq);
          }
        }
      }
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [posterImg, selectedSong, customization, currentTime, agent]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play(selectedSong, customization.startOffsetSec + (currentTime % customization.durationSec), isMuted ? 0 : customization.musicVolume);
    }
  };

  const handleCustomUpload = async (file: File) => {
    try {
      const buffer = await audioEngine.decodeFile(file);
      const customTrack: SongTrack = {
        id: `custom-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Custom Uploaded Audio',
        genre: 'Custom',
        durationSec: Math.round(buffer.duration),
        bpm: 100,
        isCustom: true,
        audioBuffer: buffer,
        color: '#e11d48',
        albumArt: '🎵',
        sourceApp: 'device',
      };
      setCustomSongs([customTrack, ...customSongs]);
      setSelectedSong(customTrack);
      audioEngine.play(customTrack, 0, customization.musicVolume);
    } catch (e) {
      console.error('Audio decode error', e);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await generateStatusVideo(
        template,
        posterImg,
        selectedSong,
        agent,
        customization,
        (p) => setExportProgress(p)
      );
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleWhatsAppShare = async () => {
    setIsExporting(true);
    try {
      const res = await generateStatusVideo(
        template,
        posterImg,
        selectedSong,
        agent,
        customization,
        (p) => setExportProgress(p)
      );

      const caption = 
        `🏡 *${posterTitle}*\n` +
        `📍 ${projectName} — Nagpur\n` +
        `📞 Contact: ${agent.name} (${agent.phone})`;

      if (typeof navigator !== 'undefined' && navigator.canShare) {
        const file = new File([res.blob], res.fileName, { type: res.mimeType });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: caption });
          return;
        }
      }

      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`, '_blank');
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      console.error('Share error', err);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  if (!isOpen) return null;

  const allAvailableSongs = [
    ...onlineSearchResults,
    ...customSongs,
    ...PRESET_SONGS,
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full p-5 sm:p-6 text-slate-900 relative max-h-[94vh] overflow-y-auto shadow-2xl">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer">
          <X size={20} />
        </button>

        <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 pb-3">
          <span className="text-xl">🪷</span>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">WhatsApp Status Poster with Song Studio</h2>
            <p className="text-xs text-slate-500">{posterTitle} • {projectName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Phone Mockup Canvas Preview (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="w-[260px] aspect-[9/16] bg-black rounded-[36px] overflow-hidden shadow-2xl relative border-[4px] border-slate-800">
              <canvas
                ref={canvasRef}
                width={1080}
                height={1920}
                className="w-full h-full object-cover cursor-pointer"
                onClick={handleTogglePlay}
              />
              {!isPlaying && (
                <div 
                  onClick={handleTogglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xl">
                    <Play size={22} className="ml-1" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button 
                onClick={handleTogglePlay}
                className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={14} className="text-rose-600" /> : <Volume2 size={14} />}
              </button>

              <span className="text-xs font-mono text-slate-500">
                {Math.floor(currentTime % customization.durationSec)}s / {customization.durationSec}s
              </span>
            </div>
          </div>

          {/* Song selection, upload & export (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-3.5">
            
            {/* Live Song Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any song (Deva Shree Ganesha, Kesariya, Marathi Powada)..."
                className="w-full pl-9 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500"
              />
              {isSearchingOnline && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-rose-600 font-bold">
                  <Loader2 size={11} className="animate-spin" />
                  <span>Searching...</span>
                </div>
              )}
            </div>

            {/* Presets Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => {
                  setActivePresetFilter('All');
                  setSearchQuery('');
                  setOnlineSearchResults([]);
                }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
                  activePresetFilter === 'All' && !searchQuery
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {POPULAR_MUSIC_SEARCH_PRESETS.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePresetFilter(p.id);
                    setSearchQuery(p.query);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                    activePresetFilter === p.id
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            {/* Custom Song Upload Dropzone */}
            <div className="p-2.5 bg-rose-50/60 rounded-xl border border-dashed border-rose-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Upload size={14} className="text-rose-600" />
                <span className="text-xs font-bold text-slate-800">Import Spotify / Gaana Audio File</span>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Browse MP3
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleCustomUpload(e.target.files[0]);
                  }
                }}
              />
            </div>

            {/* Song List */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Select Background Song</span>
                <span className="text-[10px] text-slate-400">{allAvailableSongs.length} tracks available</span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                {allAvailableSongs.map((s) => {
                  const isSelected = selectedSong.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedSong(s);
                        audioEngine.play(s, 0, customization.musicVolume);
                      }}
                      className={`p-2 rounded-xl border text-xs cursor-pointer flex justify-between items-center transition ${
                        isSelected ? 'border-rose-500 bg-rose-50/70 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {s.albumCoverUrl ? (
                          <img src={s.albumCoverUrl} alt={s.title} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                        ) : (
                          <span className="text-base">{s.albumArt || '🎵'}</span>
                        )}
                        <div className="min-w-0">
                          <div className="text-slate-900 truncate leading-tight">{s.title}</div>
                          <div className="text-[10px] text-slate-500 truncate leading-none mt-0.5">{s.artist} • {s.genre}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isSelected && <span className="text-rose-600 font-bold text-xs">✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Duration Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCustomization({ ...customization, durationSec: 15 })}
                className={`py-2 text-xs rounded-xl border font-bold transition cursor-pointer ${
                  customization.durationSec === 15 ? 'border-rose-500 text-rose-700 bg-rose-50' : 'border-slate-200 text-slate-600'
                }`}
              >
                15s Quick Status
              </button>
              <button
                onClick={() => setCustomization({ ...customization, durationSec: 30 })}
                className={`py-2 text-xs rounded-xl border font-bold transition cursor-pointer ${
                  customization.durationSec === 30 ? 'border-rose-500 text-rose-700 bg-rose-50' : 'border-slate-200 text-slate-600'
                }`}
              >
                30s Full Status (Max)
              </button>
            </div>

            {/* Progress bar */}
            {isExporting && exportProgress && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{exportProgress.statusText}</span>
                  <span>{exportProgress.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-600 h-full transition-all duration-100" style={{ width: `${exportProgress.progress}%` }} />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs transition cursor-pointer disabled:opacity-50"
              >
                <Download size={13} />
                <span>Download Video</span>
              </button>

              <button
                onClick={handleWhatsAppShare}
                disabled={isExporting}
                className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 text-xs transition cursor-pointer disabled:opacity-50"
              >
                <Share2 size={13} />
                <span>Share to WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
