import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Play, Pause, Download, Share2, Music, Volume2, 
  VolumeX, Sparkles, CheckCircle2, Sliders, 
  Upload, Search, Copy, Check, RotateCcw, Plus
} from 'lucide-react';
import { audioEngine } from '../lib/audioEngine';
import { 
  PRESET_SONGS, 
  loadStoredCustomSongs, 
  saveStoredCustomSong, 
  registerAudioBuffer 
} from '../lib/songLibrary';
import { generateStatusVideo, ExportProgress, drawMusicSticker, drawWaveformOverlay, drawSparkleParticles } from '../lib/videoGenerator';
import { drawContactPlate } from '../lib/contactPlate';
import { drawFullPosterCanvas } from '../lib/posterLibrary';
import type { SongTrack, StatusCustomization, AgentProfile, PosterTemplate } from '../types';

interface PosterMusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  poster: PosterTemplate;
  agent: AgentProfile;
  onChangeAgent: (a: AgentProfile) => void;
}

export const PosterMusicModal: React.FC<PosterMusicModalProps> = ({
  isOpen,
  onClose,
  poster,
  agent,
  onChangeAgent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedSong, setSelectedSong] = useState<SongTrack>(poster?.song || PRESET_SONGS[0]);
  const [customSongsList, setCustomSongsList] = useState<SongTrack[]>([]);
  const [showCustomDrawer, setShowCustomDrawer] = useState(false);
  const [customSongTitle, setCustomSongTitle] = useState('');
  const [customSongArtist, setCustomSongArtist] = useState('Downloaded from Music App');
  const [customSongUrl, setCustomSongUrl] = useState('');
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [posterImg, setPosterImg] = useState<HTMLImageElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [activeSideTab, setActiveSideTab] = useState<'songs' | 'trimmer' | 'agent' | 'whatsapp'>('songs');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchSongQuery, setSearchSongQuery] = useState('');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [shareSuccessMessage, setShareSuccessMessage] = useState<string | null>(null);
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

  // Load layout image
  useEffect(() => {
    if (!poster?.imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setPosterImg(img);
    img.onerror = () => setPosterImg(null);
    img.src = poster.imageUrl;
  }, [poster?.imageUrl]);

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

  // Load stored custom songs on open & sync with poster song
  useEffect(() => {
    if (isOpen) {
      const stored = loadStoredCustomSongs();
      setCustomSongsList(stored);
      if (poster?.song) {
        setSelectedSong(poster.song);
      }
      if (poster?.songStartOffsetSec !== undefined) {
        setCustomization(prev => ({ ...prev, startOffsetSec: poster.songStartOffsetSec || 0 }));
      }
      if (poster?.songDurationSec) {
        setCustomization(prev => ({ ...prev, durationSec: poster.songDurationSec || 15 }));
      }
    }
  }, [isOpen, poster]);

  // Stop audio on unmount or close
  useEffect(() => {
    if (!isOpen) {
      audioEngine.stop();
    }
  }, [isOpen]);

  const handleCustomSongUpload = async (file: File) => {
    setCustomError(null);
    try {
      const buffer = await audioEngine.decodeFile(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const customTrack: SongTrack = {
        id: `custom-${Date.now()}`,
        title: customSongTitle.trim() || cleanName,
        artist: customSongArtist.trim() || 'Custom Uploaded Audio',
        genre: 'Custom',
        durationSec: Math.round(buffer.duration),
        bpm: 100,
        isCustom: true,
        audioBuffer: buffer,
        color: '#E11D48',
        albumArt: '🎵',
      };

      registerAudioBuffer(customTrack.id, buffer);
      const updated = saveStoredCustomSong(customTrack);
      setCustomSongsList(updated);
      setSelectedSong(customTrack);
      setShowCustomDrawer(false);
      setCustomSongTitle('');
      audioEngine.play(customTrack, 0, customization.musicVolume);
    } catch (err) {
      console.error('Failed to decode audio file', err);
      setCustomError('Could not decode audio file. Please choose an MP3, WAV, M4A or AAC file.');
    }
  };

  const handleImportAudioUrl = async () => {
    if (!customSongUrl.trim()) return;
    setCustomError(null);
    setIsImportingUrl(true);
    try {
      const buffer = await audioEngine.decodeUrl(customSongUrl.trim());
      const customTrack: SongTrack = {
        id: `custom-url-${Date.now()}`,
        title: customSongTitle.trim() || 'Imported Song Stream',
        artist: customSongArtist.trim() || 'Online Music Stream',
        genre: 'Custom',
        durationSec: Math.round(buffer.duration),
        bpm: 100,
        isCustom: true,
        audioUrl: customSongUrl.trim(),
        audioBuffer: buffer,
        color: '#8B5CF6',
        albumArt: '🌐',
      };

      registerAudioBuffer(customTrack.id, buffer);
      const updated = saveStoredCustomSong(customTrack);
      setCustomSongsList(updated);
      setSelectedSong(customTrack);
      setShowCustomDrawer(false);
      setCustomSongUrl('');
      setCustomSongTitle('');
      audioEngine.play(customTrack, 0, customization.musicVolume);
    } catch (err) {
      console.error('Audio URL fetch failed', err);
      setCustomError('Failed to load audio from URL. Please ensure it is a public direct audio link (CORS enabled).');
    } finally {
      setIsImportingUrl(false);
    }
  };

  // Canvas render loop for live interactive preview
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

          // Draw Poster Content
          drawFullPosterCanvas(ctx, W, H, poster, posterImg);
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
  }, [poster, posterImg, selectedSong, customization, currentTime, agent]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play(selectedSong, customization.startOffsetSec + (currentTime % customization.durationSec), isMuted ? 0 : customization.musicVolume);
    }
  };

  const handleReplay = () => {
    audioEngine.play(selectedSong, customization.startOffsetSec, isMuted ? 0 : customization.musicVolume);
  };

  const handleSelectSong = (song: SongTrack) => {
    setSelectedSong(song);
    audioEngine.play(song, customization.startOffsetSec, isMuted ? 0 : customization.musicVolume);
  };


  const formatCaption = () => {
    const isPartner = agent.role === 'Referral Partner';
    if (isPartner) {
      return (
        `🏡 *सरस्वती नगरी — Nagpur Prime Plots*\n` +
        `📍 Project: ${poster.projectName}\n` +
        `✨ ${poster.headline}\n\n` +
        `प्लॉट माहिती व विनामूल्य साईट व्हिजिटसाठी संपर्क करा:\n` +
        `👤 *${agent.name}* (Referral Partner)\n` +
        `📞 *${agent.phone}*`
      );
    }
    return (
      `🏡 *${poster.title} — ${poster.projectName}*\n` +
      `✨ ${poster.headline}\n` +
      `🎯 ${poster.subheadline}\n\n` +
      `Immediate Registry & Clear Title plots in Nagpur.\n` +
      `📞 Enquire Now: *${agent.name}* (${agent.phone})`
    );
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(formatCaption());
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  // Direct video download
  const handleDownloadVideo = async () => {
    setIsExporting(true);
    try {
      const res = await generateStatusVideo(
        poster,
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
      setShareSuccessMessage('Status Video Downloaded! Share to WhatsApp Status from your gallery.');
      setTimeout(() => setShareSuccessMessage(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Direct image download (for native WhatsApp sticker music flow)
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;
    drawFullPosterCanvas(ctx, 1080, 1920, poster, posterImg);
    if (customization.personalizePlate) {
      drawContactPlate(ctx, 1080, 1920, agent);
    }
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `saraswati_nagri_${poster.id}_branded.png`;
    a.click();
    setShareSuccessMessage('Stamped Poster Downloaded! You can add music via WhatsApp sticker.');
    setTimeout(() => setShareSuccessMessage(null), 5000);
  };

  // WhatsApp Share Workflow (Native Share or Web fallback)
  const handleWhatsAppShare = async () => {
    setIsExporting(true);
    try {
      const res = await generateStatusVideo(
        poster,
        posterImg,
        selectedSong,
        agent,
        customization,
        (p) => setExportProgress(p)
      );

      const caption = formatCaption();

      // Native share attempt (Mobile Chrome/Safari/Edge)
      if (typeof navigator !== 'undefined' && navigator.canShare) {
        const file = new File([res.blob], res.fileName, { type: res.mimeType });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: caption });
          setShareSuccessMessage('Shared directly to WhatsApp!');
          setTimeout(() => setShareSuccessMessage(null), 5000);
          return;
        }
      }

      // Desktop / Web Fallback: Download file & trigger wa.me
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);

      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`, '_blank');
      setShareSuccessMessage('Video downloaded & WhatsApp opened! Attach video to your status message.');
      setTimeout(() => setShareSuccessMessage(null), 6000);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      console.error('WhatsApp share error', err);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  if (!isOpen) return null;

  const allSongs = [...customSongsList, ...PRESET_SONGS];
  const genres = ['All', 'Devotional', 'Festive', 'Trending', 'Real Estate', 'Morning', 'Custom'];
  
  const filteredSongs = allSongs.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchSongQuery.toLowerCase()) ||
                          s.artist.toLowerCase().includes(searchSongQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || s.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const progressPercent = Math.min(100, ((currentTime % customization.durationSec) / customization.durationSec) * 100);

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-6xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md font-black">
              🪷
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  {poster.title}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {poster.projectName}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  WhatsApp Music Status
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Generate branded 9:16 vertical status video with music sticker & agent contact plate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCaption}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
              title="Copy WhatsApp Status Caption"
            >
              {copiedCaption ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedCaption ? 'Caption Copied!' : 'Copy Caption'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Screen (Left: Phone Status Preview, Right: Audio Studio Controls) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 bg-slate-50">
          
          {/* LEFT COLUMN: Smartphone Mockup Live Status Player (col-span-5) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800 overflow-y-auto">
            
            {/* Phone Bezel */}
            <div className="relative w-[280px] sm:w-[310px] aspect-[9/16] bg-black rounded-[42px] p-3 shadow-2xl border-[5px] border-slate-700/80 flex flex-col overflow-hidden">
              
              {/* Speaker Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-b-xl z-30 flex items-center justify-center">
                <div className="w-10 h-1 bg-slate-700 rounded-full" />
              </div>

              {/* Status Screen Inner */}
              <div className="relative flex-1 rounded-[32px] overflow-hidden bg-slate-950 flex flex-col">
                
                {/* Top WhatsApp Status Bar */}
                <div className="absolute top-0 inset-x-0 pt-3 px-3 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                  {/* Story Progress Bars */}
                  <div className="w-full bg-white/30 h-1 rounded-full overflow-hidden mb-2">
                    <div 
                      className="bg-white h-full transition-all duration-100 ease-linear"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Status User Header */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-rose-600 text-[10px] font-black flex items-center justify-center ring-2 ring-white/50">
                        RM
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold leading-tight truncate">
                          {agent.name}
                        </div>
                        <div className="text-[9px] text-white/70 leading-tight">
                          Today, 1:15 PM • {customization.durationSec}s status
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-white/80">
                      <span className="text-[10px] font-mono bg-black/40 px-1.5 py-0.5 rounded">
                        {Math.floor(currentTime % customization.durationSec)}s / {customization.durationSec}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Canvas Screen */}
                <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black">
                  <canvas
                    ref={canvasRef}
                    width={1080}
                    height={1920}
                    className="w-full h-full object-cover"
                  />

                  {/* Play Overlay Button if paused */}
                  {!isPlaying && (
                    <button
                      onClick={handleTogglePlay}
                      className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/30 hover:scale-105 transition"
                    >
                      <Play size={24} className="ml-1" />
                    </button>
                  )}
                </div>

                {/* Bottom WhatsApp Reply Bar */}
                <div className="absolute bottom-0 inset-x-0 p-3 pt-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 flex items-center gap-2">
                  <div className="flex-1 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 text-[10px] text-white/80 border border-white/20">
                    Reply to {agent.name}...
                  </div>
                  <div className="w-7 h-7 rounded-full bg-emerald-500/90 text-white flex items-center justify-center text-xs">
                    💬
                  </div>
                </div>
              </div>
            </div>

            {/* Playback Controls beneath phone */}
            <div className="mt-4 w-[280px] sm:w-[310px] flex items-center justify-between gap-2 px-2 text-white">
              <button
                onClick={handleTogglePlay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition border border-slate-700"
              >
                {isPlaying ? <Pause size={14} className="text-amber-400" /> : <Play size={14} className="text-emerald-400" />}
                <span>{isPlaying ? 'Pause' : 'Play Status'}</span>
              </button>

              <button
                onClick={handleReplay}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
                title="Restart playback"
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={14} className="text-rose-400" /> : <Volume2 size={14} className="text-emerald-400" />}
              </button>

              <div className="text-[11px] font-mono text-slate-400">
                {Math.floor(currentTime % customization.durationSec)}s / {customization.durationSec}s
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Audio Studio Controls (col-span-7) */}
          <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-white">
            
            {/* Tab navigation headers */}
            <div className="flex items-center border-b border-slate-200 px-5 pt-3 bg-slate-50 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveSideTab('songs')}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                  activeSideTab === 'songs'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Music size={14} />
                <span>Choose Song ({allSongs.length})</span>
              </button>

              <button
                onClick={() => setActiveSideTab('trimmer')}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                  activeSideTab === 'trimmer'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders size={14} />
                <span>Audio Trimmer & Duration</span>
              </button>

              <button
                onClick={() => setActiveSideTab('agent')}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                  activeSideTab === 'agent'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles size={14} />
                <span>Sticker & Branding</span>
              </button>

              <button
                onClick={() => setActiveSideTab('whatsapp')}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                  activeSideTab === 'whatsapp'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Share2 size={14} />
                <span>WhatsApp Tips</span>
              </button>
            </div>

            {/* TAB CONTENT CONTAINER */}
            <div className="flex-1 overflow-y-auto p-5">
              
              {/* TAB 1: SONGS SELECTOR & CUSTOM UPLOAD */}
              {activeSideTab === 'songs' && (
                <div className="space-y-4">
                  
                  {/* Upload Custom Song Section with File / URL choice */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50/70 via-amber-50/50 to-slate-50 border border-rose-200/80 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-600/20 shrink-0 font-bold">
                          🎵
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                            <span>Add Song Chosen from Other Music Apps</span>
                            <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">Custom</span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Import audio downloaded from Spotify, YouTube Music, Reels, Gaana or audio files
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowCustomDrawer(!showCustomDrawer)}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus size={13} />
                        <span>{showCustomDrawer ? 'Close Importer' : 'Import Custom Song'}</span>
                      </button>
                    </div>

                    {customError && (
                      <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-200">
                        {customError}
                      </div>
                    )}

                    {showCustomDrawer && (
                      <div className="pt-3 border-t border-rose-200/60 space-y-3 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 bg-white hover:bg-rose-50/40 border border-rose-200 rounded-xl text-left cursor-pointer transition flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                              <Upload size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Select Audio File</p>
                              <p className="text-[10px] text-slate-400">MP3, WAV, M4A, AAC from phone/PC</p>
                            </div>
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleCustomSongUpload(e.target.files[0]);
                              }
                            }}
                          />

                          <div className="p-2.5 bg-white border border-rose-200 rounded-xl space-y-1">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="url"
                                value={customSongUrl}
                                onChange={(e) => setCustomSongUrl(e.target.value)}
                                placeholder="Paste Audio URL link..."
                                className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                              />
                              <button
                                onClick={handleImportAudioUrl}
                                disabled={isImportingUrl || !customSongUrl.trim()}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shrink-0"
                              >
                                {isImportingUrl ? 'Loading...' : 'Load'}
                              </button>
                            </div>
                            <p className="text-[9px] text-slate-400">
                              Direct cloud MP3 link or stream
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <input
                            type="text"
                            value={customSongTitle}
                            onChange={(e) => setCustomSongTitle(e.target.value)}
                            placeholder="Custom Song Title (e.g. Kesariya, Deva Shree)"
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                          />
                          <input
                            type="text"
                            value={customSongArtist}
                            onChange={(e) => setCustomSongArtist(e.target.value)}
                            placeholder="Artist / Music App (e.g. Spotify / Reels)"
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search & Genre filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchSongQuery}
                        onChange={(e) => setSearchSongQuery(e.target.value)}
                        placeholder="Search song title, artist, Marathi bansuri, Dhol Tasha..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {genres.map((g) => (
                        <button
                          key={g}
                          onClick={() => setSelectedGenre(g)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                            selectedGenre === g
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Songs List */}
                  <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                    {filteredSongs.map((song) => {
                      const isSelected = selectedSong.id === song.id;
                      return (
                        <div
                          key={song.id}
                          onClick={() => handleSelectSong(song)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-rose-50/70 border-rose-400 ring-1 ring-rose-400 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Track Icon / Art */}
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold shrink-0 shadow-xs"
                              style={{ backgroundColor: song.color || '#E11D48' }}
                            >
                              {song.albumArt || '🎵'}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {song.title}
                                </h4>
                                {song.isCustom && (
                                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                {song.artist}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="font-semibold text-slate-600">{song.genre}</span>
                                <span>•</span>
                                <span>{song.durationSec}s</span>
                                {song.bpm && (
                                  <>
                                    <span>•</span>
                                    <span>{song.bpm} BPM</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center">
                                <Check size={13} />
                              </div>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSong(song);
                              }}
                              className={`p-2 rounded-xl text-xs font-semibold transition ${
                                isSelected
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                              title={isSelected ? 'Playing in preview' : 'Select & Audition'}
                            >
                              {isSelected && isPlaying ? <Pause size={13} /> : <Play size={13} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: AUDIO TRIMMER & DURATION */}
              {activeSideTab === 'trimmer' && (
                <div className="space-y-6">
                  {/* Duration Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-2">
                      WhatsApp Status Duration Limit
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setCustomization({ ...customization, durationSec: 15 })}
                        className={`p-3.5 rounded-2xl border text-left transition ${
                          customization.durationSec === 15
                            ? 'bg-rose-50 border-rose-500 ring-1 ring-rose-500 text-rose-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">15 Seconds</span>
                          <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">Standard</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Lightweight quick status, fast uploads, crisp audio punch.
                        </p>
                      </button>

                      <button
                        onClick={() => setCustomization({ ...customization, durationSec: 30 })}
                        className={`p-3.5 rounded-2xl border text-left transition ${
                          customization.durationSec === 30
                            ? 'bg-rose-50 border-rose-500 ring-1 ring-rose-500 text-rose-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">30 Seconds</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">WhatsApp Max</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Full WhatsApp status story duration with extended melodies.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Audio Start Offset (Trimmer) */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Music Start Position (Trimmer Offset)</span>
                      <span className="text-rose-600 font-mono">
                        {customization.startOffsetSec}s ({customization.startOffsetSec}s - {customization.startOffsetSec + customization.durationSec}s)
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, (selectedSong.durationSec || 45) - customization.durationSec)}
                      step={1}
                      value={customization.startOffsetSec}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCustomization({ ...customization, startOffsetSec: val });
                        audioEngine.play(selectedSong, val, customization.musicVolume);
                      }}
                      className="w-full accent-rose-600 cursor-pointer"
                    />

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>0:00 (Song Start)</span>
                      <span>Best Chorus / Beat</span>
                      <span>{(selectedSong.durationSec || 45) - customization.durationSec}s (End Range)</span>
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Music Volume in Status Video</span>
                      <span className="text-slate-600 font-mono">
                        {Math.round(customization.musicVolume * 100)}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      value={customization.musicVolume}
                      onChange={(e) => {
                        const vol = Number(e.target.value);
                        setCustomization({ ...customization, musicVolume: vol });
                        audioEngine.setVolume(vol);
                      }}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: STICKER & BRANDING */}
              {activeSideTab === 'agent' && (
                <div className="space-y-6">
                  {/* Sticker Position */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-2">
                      WhatsApp Music Sticker Position
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'top_right', label: 'Top Right' },
                        { id: 'top_left', label: 'Top Left' },
                        { id: 'bottom_center', label: 'Bottom Center' },
                        { id: 'bottom_left', label: 'Bottom Left' },
                        { id: 'bottom_right', label: 'Bottom Right' },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => setCustomization({ 
                            ...customization, 
                            showMusicSticker: true, 
                            musicStickerPosition: pos.id as any 
                          })}
                          className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                            customization.showMusicSticker && customization.musicStickerPosition === pos.id
                              ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}

                      <button
                        onClick={() => setCustomization({ ...customization, showMusicSticker: !customization.showMusicSticker })}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                          !customization.showMusicSticker
                            ? 'bg-amber-50 border-amber-500 text-amber-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {customization.showMusicSticker ? 'Hide Sticker' : 'Sticker Hidden'}
                      </button>
                    </div>
                  </div>

                  {/* Motion Effect */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-2">
                      Video Motion Visual Effect
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'ken_burns', label: 'Ken Burns Zoom (Recommended)' },
                        { id: 'golden_sparkles', label: 'Golden Sparkles Flow' },
                        { id: 'audio_wave', label: 'Audio Reactive Pulse' },
                        { id: 'none', label: 'Static Poster Art' },
                      ].map((eff) => (
                        <button
                          key={eff.id}
                          onClick={() => setCustomization({ ...customization, motionEffect: eff.id as any })}
                          className={`p-2.5 rounded-xl border text-xs text-left font-medium transition ${
                            customization.motionEffect === eff.id
                              ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {eff.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Agent Contact Plate Info */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Agent Contact Stamping Plate
                      </span>
                      <button
                        onClick={() => setCustomization({ ...customization, personalizePlate: !customization.personalizePlate })}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          customization.personalizePlate ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {customization.personalizePlate ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Agent Name</label>
                        <input
                          type="text"
                          value={agent.name}
                          onChange={(e) => onChangeAgent({ ...agent, name: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                        <input
                          type="text"
                          value={agent.phone}
                          onChange={(e) => onChangeAgent({ ...agent, phone: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WHATSAPP TIPS & WORKFLOW */}
              {activeSideTab === 'whatsapp' && (
                <div className="space-y-4 text-xs text-slate-700">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                      <span>📲</span>
                      <span>Method 1: Direct Video WhatsApp Status (Automatic)</span>
                    </h4>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Tap <strong>"Export & Share on WhatsApp"</strong> below. The studio compiles the poster image + your chosen song into an HD 9:16 vertical video. When published as your status, the song plays automatically for everyone who views it!
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <h4 className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                      <span>🎵</span>
                      <span>Method 2: Native WhatsApp Music Sticker (In-App)</span>
                    </h4>
                    <p className="text-[11px] text-amber-800 leading-relaxed mb-2">
                      If you prefer using WhatsApp's own internal music catalog from Instagram/Meta:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-amber-900">
                      <li>Tap <strong>"Download Stamped Poster (PNG)"</strong> to save the branded high-res image.</li>
                      <li>Open WhatsApp on phone ➡️ <strong>Status / Updates</strong> ➡️ Tap Camera icon.</li>
                      <li>Select the saved poster from your photo gallery.</li>
                      <li>Tap the <strong>Smiley / Sticker</strong> icon at top bar ➡️ Tap <strong>Music</strong>.</li>
                      <li>Search any Bollywood or regional song from WhatsApp catalog and publish!</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM EXPORT & ACTION FOOTER */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col gap-3">
              
              {/* Export Progress Bar if encoding */}
              {isExporting && exportProgress && (
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span>{exportProgress.statusText}</span>
                    </span>
                    <span className="font-mono text-rose-600">{exportProgress.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-100 ease-out"
                      style={{ width: `${exportProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Notification Alert */}
              {shareSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{shareSuccessMessage}</span>
                </div>
              )}

              {/* Main Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                
                {/* Secondary Download Options */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadVideo}
                    disabled={isExporting}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
                    title="Download 1080x1920 Status Video with Song"
                  >
                    <Download size={14} />
                    <span>Download Video (HD)</span>
                  </button>

                  <button
                    onClick={handleDownloadImage}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
                    title="Download branded poster image (for in-app WhatsApp music sticker)"
                  >
                    <Download size={14} />
                    <span>Poster Image (PNG)</span>
                  </button>
                </div>

                {/* Primary WhatsApp Export & Share Action */}
                <button
                  onClick={handleWhatsAppShare}
                  disabled={isExporting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/25 transition cursor-pointer flex items-center gap-2"
                >
                  <Share2 size={15} />
                  <span>{isExporting ? 'Generating Video...' : 'Export & Share on WhatsApp'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
