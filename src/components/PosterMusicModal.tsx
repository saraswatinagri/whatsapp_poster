import React, { useState, useEffect, useRef, useTransition } from 'react';
import { 
  X, Play, Pause, Download, Share2, Music, Volume2, 
  VolumeX, Sparkles, Sliders, 
  Upload, Search, Copy, Check, RotateCcw, Plus,
  Radio, Loader2
} from 'lucide-react';
import { audioEngine } from '../lib/audioEngine';
import { 
  PRESET_SONGS, 
  loadStoredCustomSongs, 
  saveStoredCustomSong, 
  registerAudioBuffer 
} from '../lib/songLibrary';
import { 
  searchOnlineMusic, 
  POPULAR_MUSIC_SEARCH_PRESETS 
} from '../lib/musicSearch';
import { 
  generateStatusVideo, 
  ExportProgress, 
  drawMusicSticker, 
  drawWaveformOverlay, 
  drawSparkleParticles 
} from '../lib/videoGenerator';
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
  const [, startTransition] = useTransition();

  // Song selection & list
  const [selectedSong, setSelectedSong] = useState<SongTrack>(() => poster?.song || PRESET_SONGS[0]);
  const [customSongsList, setCustomSongsList] = useState<SongTrack[]>(() => loadStoredCustomSongs());
  const [onlineSearchResults, setOnlineSearchResults] = useState<SongTrack[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [activePresetFilter, setActivePresetFilter] = useState<string>('All');
  const [searchSongQuery, setSearchSongQuery] = useState('');

  // Custom song drawer / direct import
  const [showCustomDrawer, setShowCustomDrawer] = useState(false);
  const [customSongTitle, setCustomSongTitle] = useState('');
  const [customSongArtist, setCustomSongArtist] = useState('');
  const [customSongUrl, setCustomSongUrl] = useState('');
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // Playback & preview state
  const [posterImg, setPosterImg] = useState<HTMLImageElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [activeSideTab, setActiveSideTab] = useState<'songs' | 'trimmer' | 'agent' | 'whatsapp'>('songs');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [shareSuccessMessage, setShareSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [customization, setCustomization] = useState<StatusCustomization>({
    durationSec: poster?.songDurationSec || 15,
    startOffsetSec: poster?.songStartOffsetSec || 0,
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

  // Update selected song when poster prop changes
  useEffect(() => {
    if (poster?.song) {
      setSelectedSong(poster.song);
    }
    if (poster?.songStartOffsetSec !== undefined) {
      setCustomization(prev => ({ ...prev, startOffsetSec: poster.songStartOffsetSec || 0 }));
    }
    if (poster?.songDurationSec) {
      setCustomization(prev => ({ ...prev, durationSec: poster.songDurationSec || 15 }));
    }
  }, [poster]);

  // Stop audio when modal is closed
  useEffect(() => {
    if (!isOpen) {
      audioEngine.stop();
    }
  }, [isOpen]);

  // Debounced online music search
  useEffect(() => {
    if (!searchSongQuery.trim() || searchSongQuery.trim().length < 2) {
      setOnlineSearchResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const results = await searchOnlineMusic(searchSongQuery.trim(), 12);
        startTransition(() => {
          setOnlineSearchResults(results);
          setIsSearchingOnline(false);
        });
      } catch (err) {
        console.error('Online search failed', err);
        setIsSearchingOnline(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchSongQuery]);

  // Quick preset filter handler
  const handleSelectPreset = async (preset: { id: string; name: string; query: string }) => {
    setActivePresetFilter(preset.id);
    setSearchSongQuery(preset.query);
    setIsSearchingOnline(true);
    try {
      const results = await searchOnlineMusic(preset.query, 12);
      startTransition(() => {
        setOnlineSearchResults(results);
        setIsSearchingOnline(false);
      });
    } catch (err) {
      console.error('Preset search failed', err);
      setIsSearchingOnline(false);
    }
  };

  const handleCustomSongUpload = async (file: File) => {
    setCustomError(null);
    try {
      const buffer = await audioEngine.decodeFile(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const customTrack: SongTrack = {
        id: `custom-${Date.now()}`,
        title: customSongTitle.trim() || cleanName,
        artist: customSongArtist.trim() || 'Uploaded Audio Track',
        genre: 'Custom',
        durationSec: Math.round(buffer.duration),
        bpm: 100,
        isCustom: true,
        audioBuffer: buffer,
        color: '#E11D48',
        albumArt: '📁',
        sourceApp: 'device',
      };

      registerAudioBuffer(customTrack.id, buffer);
      const updated = saveStoredCustomSong(customTrack);
      setCustomSongsList(updated);
      setSelectedSong(customTrack);
      setShowCustomDrawer(false);
      setCustomSongTitle('');
      setCustomSongArtist('');
      audioEngine.play(customTrack, 0, customization.musicVolume);
    } catch (err) {
      console.error('Failed to decode audio file', err);
      setCustomError('Could not decode audio file. Please select an MP3, WAV, M4A or AAC file.');
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
        artist: customSongArtist.trim() || 'Online Audio Link',
        genre: 'Custom',
        durationSec: Math.round(buffer.duration),
        bpm: 100,
        isCustom: true,
        audioUrl: customSongUrl.trim(),
        audioBuffer: buffer,
        color: '#8B5CF6',
        albumArt: '🌐',
        sourceApp: 'device',
      };

      registerAudioBuffer(customTrack.id, buffer);
      const updated = saveStoredCustomSong(customTrack);
      setCustomSongsList(updated);
      setSelectedSong(customTrack);
      setShowCustomDrawer(false);
      setCustomSongUrl('');
      setCustomSongTitle('');
      setCustomSongArtist('');
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

          // Draw Poster Base
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
      setShareSuccessMessage('Status Video Downloaded! Share to WhatsApp Status from your phone gallery.');
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
    setShareSuccessMessage('Stamped Poster Downloaded! You can add any song via WhatsApp Music Sticker.');
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

      // Native mobile share attempt
      if (typeof navigator !== 'undefined' && navigator.canShare) {
        const file = new File([res.blob], res.fileName, { type: res.mimeType });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: caption });
          setShareSuccessMessage('Shared directly to WhatsApp!');
          setTimeout(() => setShareSuccessMessage(null), 5000);
          return;
        }
      }

      // Desktop / Web Fallback
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);

      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`, '_blank');
      setShareSuccessMessage('Video downloaded & WhatsApp opened! Attach video to your status.');
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

  // Active song list display logic
  const displaySongs: SongTrack[] = [
    ...onlineSearchResults,
    ...customSongsList,
    ...PRESET_SONGS,
  ];

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
        {/* Modal Top Header matching CRM styling */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md font-black shrink-0">
              🪷
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md">
                  {poster.title}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  {poster.projectName}
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                  WhatsApp Music Status
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                Attach songs from Spotify, Gaana or device audio &amp; create branded 9:16 WhatsApp status video
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCaption}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
              title="Copy WhatsApp Status Caption"
            >
              {copiedCaption ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedCaption ? 'Copied' : 'Copy Caption'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Screen (Left: Phone Preview, Right: Audio Controls) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 bg-slate-50">
          
          {/* LEFT: Smartphone Status Screen Preview (col-span-5) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800 overflow-y-auto">
            
            {/* Phone Bezel */}
            <div className="relative w-[270px] sm:w-[295px] aspect-[9/16] bg-black rounded-[40px] p-2.5 shadow-2xl border-[4px] border-slate-700/80 flex flex-col overflow-hidden">
              
              {/* Speaker Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-slate-900 rounded-b-xl z-30 flex items-center justify-center">
                <div className="w-8 h-1 bg-slate-700 rounded-full" />
              </div>

              {/* Status Screen Inner */}
              <div className="relative flex-1 rounded-[30px] overflow-hidden bg-slate-950 flex flex-col">
                
                {/* Top Status Header Bar */}
                <div className="absolute top-0 inset-x-0 pt-2.5 px-3 z-20 bg-gradient-to-b from-black/80 via-black/30 to-transparent">
                  {/* Progress Line */}
                  <div className="w-full bg-white/30 h-1 rounded-full overflow-hidden mb-2">
                    <div 
                      className="bg-white h-full transition-all duration-100 ease-linear"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Status Author Details */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-rose-600 text-[9px] font-black flex items-center justify-center ring-1 ring-white/60">
                        {agent.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold leading-tight truncate">
                          {agent.name}
                        </div>
                        <div className="text-[8px] text-white/70 leading-none">
                          Today • {customization.durationSec}s Status Story
                        </div>
                      </div>
                    </div>

                    <span className="text-[9px] font-mono bg-black/50 px-1.5 py-0.5 rounded text-white/90">
                      {Math.floor(currentTime % customization.durationSec)}s / {customization.durationSec}s
                    </span>
                  </div>
                </div>

                {/* Canvas Canvas Preview */}
                <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black">
                  <canvas
                    ref={canvasRef}
                    width={1080}
                    height={1920}
                    className="w-full h-full object-cover"
                  />

                  {/* Play Button Overlay */}
                  {!isPlaying && (
                    <button
                      onClick={handleTogglePlay}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-rose-600/95 text-white flex items-center justify-center shadow-xl backdrop-blur-sm border border-white/40 hover:scale-105 transition cursor-pointer"
                    >
                      <Play size={22} className="ml-0.5" />
                    </button>
                  )}
                </div>

                {/* Bottom WhatsApp Reply Bar */}
                <div className="absolute bottom-0 inset-x-0 p-2.5 pt-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 flex items-center gap-2">
                  <div className="flex-1 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-[9px] text-white/80 border border-white/20">
                    Reply to {agent.name}...
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-500/90 text-white flex items-center justify-center text-[10px]">
                    💬
                  </div>
                </div>
              </div>
            </div>

            {/* Playback Controls Row */}
            <div className="mt-3.5 w-[270px] sm:w-[295px] flex items-center justify-between gap-2 px-1 text-white">
              <button
                onClick={handleTogglePlay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition border border-slate-700 cursor-pointer"
              >
                {isPlaying ? <Pause size={13} className="text-amber-400" /> : <Play size={13} className="text-emerald-400" />}
                <span>{isPlaying ? 'Pause' : 'Play Status'}</span>
              </button>

              <button
                onClick={handleReplay}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700 cursor-pointer"
                title="Restart playback"
              >
                <RotateCcw size={13} />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700 cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={13} className="text-rose-400" /> : <Volume2 size={13} className="text-emerald-400" />}
              </button>

              <div className="text-[10px] font-mono text-slate-400">
                {Math.floor(currentTime % customization.durationSec)}s / {customization.durationSec}s
              </div>
            </div>
          </div>

          {/* RIGHT: Audio Studio & Customization Controls (col-span-7) */}
          <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-white">
            
            {/* Clean Tab Navigation Headers */}
            <div className="flex items-center border-b border-slate-200 px-5 pt-3 bg-slate-50 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveSideTab('songs')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
                  activeSideTab === 'songs'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Music size={14} />
                <span>1. Select Music</span>
              </button>

              <button
                onClick={() => setActiveSideTab('trimmer')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
                  activeSideTab === 'trimmer'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders size={14} />
                <span>2. Trimmer &amp; Duration</span>
              </button>

              <button
                onClick={() => setActiveSideTab('agent')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
                  activeSideTab === 'agent'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles size={14} />
                <span>3. Sticker &amp; Branding</span>
              </button>

              <button
                onClick={() => setActiveSideTab('whatsapp')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
                  activeSideTab === 'whatsapp'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Share2 size={14} />
                <span>4. WhatsApp Methods</span>
              </button>
            </div>

            {/* TAB CONTENT VIEWPORT */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              
              {/* TAB 1: MUSIC CATALOG & SEARCH */}
              {activeSideTab === 'songs' && (
                <div className="space-y-4">
                  
                  {/* Real-Time Universal Music Search Bar */}
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchSongQuery}
                      onChange={(e) => setSearchSongQuery(e.target.value)}
                      placeholder="Search any song (e.g. Deva Shree Ganesha, Kesariya, Zingaat, Arijit Singh)..."
                      className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white transition font-medium"
                    />
                    {isSearchingOnline ? (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-rose-600 font-bold">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Searching...</span>
                      </div>
                    ) : searchSongQuery ? (
                      <button
                        onClick={() => {
                          setSearchSongQuery('');
                          setOnlineSearchResults([]);
                          setActivePresetFilter('All');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded-md cursor-pointer font-semibold"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>

                  {/* Quick Vibe & Regional Preset Pills */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-600 flex items-center gap-1">
                        <Radio size={12} className="text-rose-500" />
                        <span>Popular Regional &amp; Devotional Presets:</span>
                      </span>
                      {onlineSearchResults.length > 0 && (
                        <span className="font-bold text-rose-600 text-[10px]">
                          {onlineSearchResults.length} Results Found
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        onClick={() => {
                          setActivePresetFilter('All');
                          setSearchSongQuery('');
                          setOnlineSearchResults([]);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                          activePresetFilter === 'All' && !searchSongQuery
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All Tracks
                      </button>

                      {POPULAR_MUSIC_SEARCH_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                            activePresetFilter === preset.id
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span>{preset.icon}</span>
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spotify, Gaana & Custom Audio Upload Bar */}
                  <div className="p-3 bg-gradient-to-r from-rose-50/70 via-amber-50/40 to-slate-50 border border-rose-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">
                        🎵
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          Import from Spotify, Gaana, Reels or Device
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-none mt-0.5">
                          Upload downloaded MP3/M4A audio or direct streaming link
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload size={13} className="text-rose-600" />
                        <span>Upload Audio</span>
                      </button>

                      <button
                        onClick={() => setShowCustomDrawer(!showCustomDrawer)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>Link</span>
                      </button>
                    </div>

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
                  </div>

                  {/* Expandable Audio URL Link Form */}
                  {showCustomDrawer && (
                    <div className="p-3 bg-white border border-rose-200 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={customSongUrl}
                          onChange={(e) => setCustomSongUrl(e.target.value)}
                          placeholder="Paste direct audio URL (e.g. https://.../audio.mp3)..."
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                        />
                        <button
                          onClick={handleImportAudioUrl}
                          disabled={isImportingUrl || !customSongUrl.trim()}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                        >
                          {isImportingUrl ? 'Loading...' : 'Load'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={customSongTitle}
                          onChange={(e) => setCustomSongTitle(e.target.value)}
                          placeholder="Song Title (e.g. Kesariya, Deva Shree)"
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                        />
                        <input
                          type="text"
                          value={customSongArtist}
                          onChange={(e) => setCustomSongArtist(e.target.value)}
                          placeholder="Artist Name (e.g. Arijit Singh / Spotify)"
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      {customError && (
                        <p className="text-red-600 text-[11px] font-semibold">{customError}</p>
                      )}
                    </div>
                  )}

                  {/* Songs List */}
                  <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                    {displaySongs.map((song) => {
                      const isSelected = selectedSong.id === song.id;
                      return (
                        <div
                          key={song.id}
                          onClick={() => handleSelectSong(song)}
                          className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-rose-50/70 border-rose-400 ring-1 ring-rose-400 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Track Artwork */}
                            {song.albumCoverUrl ? (
                              <img
                                src={song.albumCoverUrl}
                                alt={song.title}
                                className="w-10 h-10 rounded-xl object-cover shadow-xs shrink-0 border border-slate-200"
                              />
                            ) : (
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold shrink-0 shadow-xs"
                                style={{ backgroundColor: song.color || '#E11D48' }}
                              >
                                {song.albumArt || '🎵'}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {song.title}
                                </h4>
                                {song.genre === 'Online Search' ? (
                                  <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded shrink-0">
                                    Catalog
                                  </span>
                                ) : song.isCustom ? (
                                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded shrink-0">
                                    Custom
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded shrink-0">
                                    Original
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate leading-tight">
                                {song.artist}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                <span className="font-semibold text-slate-600">{song.genre}</span>
                                <span>•</span>
                                <span>{song.durationSec}s status clip</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs">
                                <Check size={13} />
                              </div>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSong(song);
                              }}
                              className={`p-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
                <div className="space-y-5">
                  {/* WhatsApp Status Duration Limit */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-2">
                      WhatsApp Status Duration Limit
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setCustomization({ ...customization, durationSec: 15 })}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
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
                          Lightweight quick status, instant uploads, punchy chorus.
                        </p>
                      </button>

                      <button
                        onClick={() => setCustomization({ ...customization, durationSec: 30 })}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
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
                          Full WhatsApp status story limit with extended melody.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Audio Start Position Scrubber */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Song Hook / Chorus Scrubber</span>
                      <span className="text-rose-600 font-mono">
                        {customization.startOffsetSec}s to {customization.startOffsetSec + customization.durationSec}s
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, (selectedSong.durationSec || 30) - customization.durationSec)}
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
                      <span>0:00 (Intro)</span>
                      <span>Best Chorus / Drop</span>
                      <span>{(selectedSong.durationSec || 30) - customization.durationSec}s (Outro)</span>
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
                <div className="space-y-5">
                  {/* WhatsApp Music Sticker Position */}
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
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            musicStickerPosition: pos.id as any 
                          })}
                          className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
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
                        className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          !customization.showMusicSticker
                            ? 'bg-amber-50 border-amber-500 text-amber-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {customization.showMusicSticker ? 'Hide Sticker' : 'Sticker Hidden'}
                      </button>
                    </div>
                  </div>

                  {/* Video Motion Effect */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-2">
                      Visual Motion Effect
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
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          onClick={() => setCustomization({ ...customization, motionEffect: eff.id as any })}
                          className={`p-2.5 rounded-xl border text-xs text-left font-medium transition cursor-pointer ${
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
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
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

              {/* TAB 4: WHATSAPP WORKFLOW OPTIONS */}
              {activeSideTab === 'whatsapp' && (
                <div className="space-y-4 text-xs text-slate-700">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <span>📲</span>
                      <span>Method 1: Direct Video WhatsApp Status (Automatic)</span>
                    </h4>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Click <strong>&quot;Export &amp; Share on WhatsApp&quot;</strong> below. The studio compiles the poster image + your chosen song into an HD 9:16 vertical video. When posted as your status story, the music plays automatically!
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                    <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                      <span>🎵</span>
                      <span>Method 2: Native WhatsApp Music Sticker (In-App)</span>
                    </h4>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      If you prefer using WhatsApp&apos;s own internal music catalog (which has Meta&apos;s complete licensed library):
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-amber-900 font-medium">
                      <li>Click <strong>&quot;Poster Image (PNG)&quot;</strong> below to save your stamped high-res poster.</li>
                      <li>Open <strong>WhatsApp</strong> ➡️ <strong>Status / Updates</strong> ➡️ Tap the Camera icon.</li>
                      <li>Pick the saved poster from your photo gallery.</li>
                      <li>Tap the <strong>Smiley / Sticker</strong> icon at top ➡️ Tap <strong>Music</strong>.</li>
                      <li>Search any song and publish!</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM EXPORT & ACTION FOOTER */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col gap-3">
              
              {/* Export Encoding Progress Bar */}
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
                      className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 h-full transition-all duration-100 ease-out"
                      style={{ width: `${exportProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Notification Alert */}
              {shareSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>{shareSuccessMessage}</span>
                </div>
              )}

              {/* Main Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadVideo}
                    disabled={isExporting}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer disabled:opacity-50"
                    title="Download 1080x1920 Status Video with Song"
                  >
                    <Download size={14} />
                    <span>Download Video (HD)</span>
                  </button>

                  <button
                    onClick={handleDownloadImage}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                    title="Download branded poster image (for WhatsApp music sticker)"
                  >
                    <Download size={14} />
                    <span>Poster Image (PNG)</span>
                  </button>
                </div>

                <button
                  onClick={handleWhatsAppShare}
                  disabled={isExporting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/25 transition cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
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
