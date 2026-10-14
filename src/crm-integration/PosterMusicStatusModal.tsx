'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Play, Pause, Download, Share2, Music, Volume2, 
  VolumeX, Clock, Sparkles, CheckCircle2, Sliders, ShieldCheck,
  Upload, Check
} from 'lucide-react';
import { audioEngine } from '../lib/audioEngine';
import { PRESET_SONGS } from '../lib/songLibrary';
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

  const agent: AgentProfile = {
    name: agentName || 'Rahul Mehta',
    phone: agentPhone || '+91 94221 54321',
    role: agentRole,
  };

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

  const allAvailableSongs = [...customSongs, ...PRESET_SONGS];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full p-6 text-slate-900 relative max-h-[94vh] overflow-y-auto shadow-2xl">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition">
          <X size={20} />
        </button>

        <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 pb-3">
          <span className="text-xl">🪷</span>
          <div>
            <h2 className="text-base font-bold text-slate-900">WhatsApp Status Poster with Song Studio</h2>
            <p className="text-xs text-slate-500">{posterTitle} • {projectName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Phone Mockup Canvas Preview (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="w-[270px] aspect-[9/16] bg-black rounded-[36px] overflow-hidden shadow-2xl relative border-[4px] border-slate-800">
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
                  <div className="w-14 h-14 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xl">
                    <Play size={24} className="ml-1" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-3">
              <button 
                onClick={handleTogglePlay}
                className="px-3.5 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <span className="text-xs font-mono text-slate-500">
                {Math.floor(currentTime % customization.durationSec)}s / {customization.durationSec}s Status
              </span>
            </div>
          </div>

          {/* Song selection, upload & export (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-4">
            
            {/* Custom Song Upload Dropzone */}
            <div className="p-3 bg-rose-50/60 rounded-xl border border-dashed border-rose-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Upload size={16} className="text-rose-600" />
                <span className="text-xs font-bold text-slate-800">Upload Custom Music / Song File</span>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
              >
                Browse Audio
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
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
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Select Background Song</label>
              <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                {allAvailableSongs.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedSong(s);
                      audioEngine.play(s, 0, customization.musicVolume);
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer flex justify-between items-center transition ${
                      selectedSong.id === s.id ? 'border-rose-500 bg-rose-50/60 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{s.albumArt || '🎵'}</span>
                      <div>
                        <div className="text-slate-900">{s.title}</div>
                        <div className="text-[10px] text-slate-500">{s.artist} • {s.genre}</div>
                      </div>
                    </div>
                    {selectedSong.id === s.id && <span className="text-rose-600 font-bold">✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Duration Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCustomization({ ...customization, durationSec: 15 })}
                className={`py-2 text-xs rounded-xl border font-bold transition ${
                  customization.durationSec === 15 ? 'border-rose-500 text-rose-700 bg-rose-50' : 'border-slate-200 text-slate-600'
                }`}
              >
                15s Quick Status
              </button>
              <button
                onClick={() => setCustomization({ ...customization, durationSec: 30 })}
                className={`py-2 text-xs rounded-xl border font-bold transition ${
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
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs transition"
              >
                <Download size={14} />
                <span>Download Video</span>
              </button>

              <button
                onClick={handleWhatsAppShare}
                disabled={isExporting}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 text-xs transition cursor-pointer"
              >
                <Share2 size={14} />
                <span>Share to WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
