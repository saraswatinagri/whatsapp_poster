import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Calendar, Sparkles, Upload, Image as ImageIcon, 
  Video, MessageSquare, Send, CalendarClock, Music, 
  Play, Pause, Volume2, Share2, Check, Clock, AlertCircle,
  Loader2, CheckCircle2, ChevronRight, Sliders, Link as LinkIcon,
  Plus, FileAudio, RotateCcw
} from 'lucide-react';
import { PosterTemplate, SongTrack, AgentProfile } from '../types';
import { 
  PRESET_SONGS, 
  loadStoredCustomSongs, 
  saveStoredCustomSong, 
  registerAudioBuffer 
} from '../lib/songLibrary';
import { audioEngine } from '../lib/audioEngine';
import { generateStatusVideo, ExportProgress } from '../lib/videoGenerator';
import { DbProject } from '../lib/supabaseClient';

interface CreatePosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: DbProject[];
  agent: AgentProfile;
  onSavePoster: (poster: PosterTemplate) => void;
  onShareToWhatsAppWithSong?: (poster: PosterTemplate, song: SongTrack, durationSec: 15 | 30) => void;
}

export const CreatePosterModal: React.FC<CreatePosterModalProps> = ({
  isOpen,
  onClose,
  projects,
  agent,
  onSavePoster,
}) => {
  // Content Type
  const [contentType, setContentType] = useState<'image' | 'video' | 'message'>('image');

  // Form Fields matching CRM
  const [title, setTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState('General (no project)');
  const [postDate, setPostDate] = useState(() => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}-${m}-${y}`;
  });
  const [personalizeForAgent, setPersonalizeForAgent] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [sendToPartners, setSendToPartners] = useState(true);

  // Song Attachment Features (15s or 30s)
  const [hasSong, setHasSong] = useState(true);
  const [songDurationSec, setSongDurationSec] = useState<15 | 30>(15);
  const [selectedSong, setSelectedSong] = useState<SongTrack>(PRESET_SONGS[0]);
  const [customSongs, setCustomSongs] = useState<SongTrack[]>([]);
  const [songOffsetSec, setSongOffsetSec] = useState(0);
  const [songVolume, setSongVolume] = useState(0.85);

  // Custom Song Drawer / Importer Mode
  const [showCustomSongDrawer, setShowCustomSongDrawer] = useState(false);
  const [customSongTitle, setCustomSongTitle] = useState('');
  const [customSongArtist, setCustomSongArtist] = useState('Downloaded from Music App');
  const [customSongUrl, setCustomSongUrl] = useState('');
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [customSongError, setCustomSongError] = useState<string | null>(null);

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentPlayTime, setCurrentPlayTime] = useState(0);

  // Export & Sharing Status
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [showShareSuccessModal, setShowShareSuccessModal] = useState(false);
  const [createdPosterData, setCreatedPosterData] = useState<PosterTemplate | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const songFileInputRef = useRef<HTMLInputElement | null>(null);

  // Dynamic formatted time for real-time card preview
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState(() => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
  });

  // Load custom songs from localStorage on open
  useEffect(() => {
    if (isOpen) {
      const stored = loadStoredCustomSongs();
      setCustomSongs(stored);
      if (stored.length > 0 && selectedSong.id === PRESET_SONGS[0].id) {
        // keep preset as default or let user pick
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeFormatted(
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()
      );
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Audio engine subscriber
  useEffect(() => {
    const unsub = audioEngine.subscribe((playing, time) => {
      setIsPlayingAudio(playing);
      setCurrentPlayTime(time);
      if (hasSong && time >= (songOffsetSec + songDurationSec)) {
        audioEngine.stop();
      }
    });
    return () => {
      unsub();
    };
  }, [hasSong, songDurationSec, songOffsetSec]);

  // Stop audio when modal is closed
  useEffect(() => {
    if (!isOpen) {
      audioEngine.stop();
      setIsPlayingAudio(false);
      setShowShareSuccessModal(false);
      setIsExportingVideo(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePlaySong = () => {
    if (isPlayingAudio) {
      audioEngine.pause();
    } else {
      audioEngine.play(selectedSong, songOffsetSec, songVolume);
    }
  };

  const handleSelectSong = (song: SongTrack) => {
    setSelectedSong(song);
    audioEngine.play(song, songOffsetSec, songVolume);
  };

  // Custom song upload from user device (exported from Spotify, YT Music, etc.)
  const handleCustomSongUpload = async (file: File) => {
    setCustomSongError(null);
    try {
      const buffer = await audioEngine.decodeFile(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const customTrack: SongTrack = {
        id: `custom-song-${Date.now()}`,
        title: customSongTitle.trim() || cleanName,
        artist: customSongArtist.trim() || 'Custom Music File',
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
      setCustomSongs(updated);
      setSelectedSong(customTrack);
      setShowCustomSongDrawer(false);
      setCustomSongTitle('');
      audioEngine.play(customTrack, 0, songVolume);
    } catch (err) {
      console.error('Audio upload failed', err);
      setCustomSongError('Could not decode audio file. Please choose an MP3, WAV, M4A or AAC file.');
    }
  };

  // Custom song import from direct audio URL
  const handleImportAudioUrl = async () => {
    if (!customSongUrl.trim()) return;
    setCustomSongError(null);
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
      setCustomSongs(updated);
      setSelectedSong(customTrack);
      setShowCustomSongDrawer(false);
      setCustomSongUrl('');
      setCustomSongTitle('');
      audioEngine.play(customTrack, 0, songVolume);
    } catch (err) {
      console.error('Audio URL fetch failed', err);
      setCustomSongError('Failed to load audio from URL. Please ensure it is a public direct audio link (CORS enabled).');
    } finally {
      setIsImportingUrl(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const buildCaptionText = (posterTitle: string, projectName: string) => {
    if (caption.trim()) return caption;
    const isPartner = agent.role === 'Referral Partner';
    if (isPartner) {
      return (
        `🏡 *सरस्वती नगरी — Nagpur Prime Plots*\n` +
        `📍 Project: ${projectName}\n` +
        `✨ ${posterTitle}\n\n` +
        `प्लॉट माहिती व विनामूल्य साईट व्हिजिटसाठी संपर्क करा:\n` +
        `👤 *${agent.name}* (Referral Partner)\n` +
        `📞 *${agent.phone}*`
      );
    }
    return (
      `🏡 *${posterTitle} — ${projectName}*\n` +
      `✨ Immediate Registry & Sanctioned RL Plots in Nagpur.\n` +
      `📞 For Site Visit & Special Offers: *${agent.name}* (${agent.phone})`
    );
  };

  // Submit and Create Poster (With Song option)
  const handleSubmit = async () => {
    const finalTitle = title.trim() || 'Nagpur Prime Plots Special Offer';
    const finalProject = selectedProject === 'General (no project)' ? 'Saraswati Nagri Group' : selectedProject;
    
    // Default image fallback if user didn't select custom image
    const finalImage = imagePreview || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1080&q=80';

    const newPoster: PosterTemplate = {
      id: `crm-post-${Date.now()}`,
      title: finalTitle,
      projectName: finalProject,
      category: 'db',
      imageUrl: finalImage,
      urls: [finalImage],
      aspectRatio: '9:16',
      tag: finalProject,
      headline: finalTitle,
      subheadline: `${finalProject} • Nagpur RL & Clear Title Plots`,
      badge: 'Today Post',
      highlights: ['Immediate Registry', 'Clear Title', 'Cement Roads & Water'],
      downloadsCount: 0,
      posterName: agent.name,
      createdAt: new Date().toISOString(),
      postDate: postDate,
      type: contentType,
      content: caption,
      hasSong: hasSong,
      song: hasSong ? selectedSong : undefined,
      songDurationSec: hasSong ? songDurationSec : undefined,
      songStartOffsetSec: hasSong ? songOffsetSec : undefined,
      personalizeForAgent: personalizeForAgent,
      sendToPartnersWhatsApp: sendToPartners,
    };

    // Save to Daily Board state
    onSavePoster(newPoster);
    setCreatedPosterData(newPoster);

    // If song is attached, launch the WhatsApp status video generator!
    if (hasSong) {
      audioEngine.stop();
      setIsExportingVideo(true);

      try {
        const layoutImg = new Image();
        layoutImg.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
          layoutImg.onload = resolve;
          layoutImg.onerror = resolve;
          layoutImg.src = finalImage;
        });

        const videoRes = await generateStatusVideo(
          newPoster,
          layoutImg,
          selectedSong,
          agent,
          {
            durationSec: songDurationSec,
            startOffsetSec: songOffsetSec,
            showMusicSticker: true,
            musicStickerPosition: 'top_right',
            motionEffect: 'ken_burns',
            showWaveformOverlay: true,
            musicVolume: songVolume,
            personalizePlate: personalizeForAgent,
          },
          (prog) => setExportProgress(prog)
        );

        const fullCaption = buildCaptionText(finalTitle, finalProject);

        if (typeof navigator !== 'undefined' && navigator.canShare) {
          const file = new File([videoRes.blob], videoRes.fileName, { type: videoRes.mimeType });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              text: fullCaption,
            });
            onClose();
            return;
          }
        }

        // Fallback: Download file
        const url = URL.createObjectURL(videoRes.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = videoRes.fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);

        setShowShareSuccessModal(true);
      } catch (err) {
        console.error('Video generation failed', err);
        onClose();
      } finally {
        setIsExportingVideo(false);
        setExportProgress(null);
      }
    } else {
      onClose();
    }
  };

  const allSongs = [...customSongs, ...PRESET_SONGS];

  return (
    <div 
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 font-black">
              🪷
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Post to Daily Board
                </h2>
                <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                  Media Library
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Create a high-impact poster with background song for WhatsApp status &amp; daily marketing.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body: Two Columns */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/50">
          
          {/* LEFT COLUMN: Controls & Form (col-span-7) */}
          <div className="md:col-span-7 space-y-5">
            
            {/* Content Type Selector */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                CONTENT TYPE *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'image', label: 'Image Poster', icon: ImageIcon },
                  { id: 'video', label: 'Video Status', icon: Video },
                  { id: 'message', label: 'Text Offer', icon: MessageSquare },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSel = contentType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setContentType(t.id as any)}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition border cursor-pointer ${
                        isSel 
                          ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-2xs' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={14} className={isSel ? 'text-rose-600' : 'text-slate-400'} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                POST TITLE *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Saraswati Nagri 3 • Grand Launch Special Offer"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 transition shadow-2xs"
              />
            </div>

            {/* Project & Date Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  PROJECT
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500 cursor-pointer shadow-2xs"
                >
                  <option value="General (no project)">General (no project)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  POST DATE
                </label>
                <input
                  type="text"
                  value={postDate}
                  onChange={(e) => setPostDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Upload Poster Image */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                POSTER MEDIA (9:16 RECOMMENDED)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-rose-400 bg-white hover:bg-rose-50/20 rounded-2xl p-4 text-center cursor-pointer transition group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition">
                    <Upload size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    {imageFile ? imageFile.name : 'Click to upload poster image'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    PNG, JPG, WebP up to 15MB • Stamped with agent details
                  </p>
                </div>
              </div>
            </div>

            {/* SONG ATTACHMENT CARD */}
            <div className="bg-gradient-to-br from-rose-50/70 via-pink-50/50 to-amber-50/60 border border-rose-200 rounded-2xl p-4 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-600 to-pink-600 text-white flex items-center justify-center shadow-xs">
                    <Music size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                      <span>WhatsApp Status Song (15s / 30s)</span>
                      <span className="text-[9px] font-bold bg-rose-200/60 text-rose-800 px-1.5 py-0.2 rounded">HD Video</span>
                    </h3>
                    <p className="text-[10px] text-rose-800/80">
                      Creates 1080x1920 MP4 status with music sticker &amp; audio playing
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHasSong(!hasSong)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ${
                    hasSong ? 'bg-rose-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
                      hasSong ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {hasSong && (
                <div className="pt-2 border-t border-rose-200/60 space-y-3 animate-in fade-in duration-200">
                  
                  {/* DURATION SELECTOR (15s OR 30s) */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-rose-900/80 block mb-1">
                      WHATSAPP STATUS DURATION *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSongDurationSec(15)}
                        className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer border ${
                          songDurationSec === 15
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                        }`}
                      >
                        <Clock size={13} />
                        <span>15 Seconds (Quick Status)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSongDurationSec(30)}
                        className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer border ${
                          songDurationSec === 30
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                        }`}
                      >
                        <Clock size={13} />
                        <span>30 Seconds (Full Status)</span>
                      </button>
                    </div>
                  </div>

                  {/* SONG SELECTOR WITH CUSTOM MUSIC APP IMPORT */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-rose-900/80">
                        SELECT SONG TRACK
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCustomSongDrawer(!showCustomSongDrawer)}
                        className="text-[10px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-rose-200 shadow-2xs"
                      >
                        <Music size={11} />
                        <span>{showCustomSongDrawer ? 'Close Importer' : '➕ Add Custom Song from App / File'}</span>
                      </button>
                    </div>

                    {/* CUSTOM SONG IMPORTER DRAWER */}
                    {showCustomSongDrawer && (
                      <div className="p-3.5 bg-white rounded-2xl border border-rose-300 shadow-sm mb-3 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <Music size={14} className="text-rose-600" />
                            <span>Add Song Chosen from Other Music Apps</span>
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            Spotify, YouTube, Reels, Gaana
                          </span>
                        </div>

                        {customSongError && (
                          <div className="p-2 bg-red-50 text-red-700 rounded-xl text-[11px] font-medium border border-red-200">
                            {customSongError}
                          </div>
                        )}

                        {/* File Upload Button */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => songFileInputRef.current?.click()}
                            className="p-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex flex-col items-center justify-center gap-1 border border-rose-200 cursor-pointer transition"
                          >
                            <Upload size={16} />
                            <span>Upload MP3 / Audio File</span>
                            <span className="text-[9px] text-rose-500 font-normal">From phone / computer files</span>
                          </button>
                          <input
                            ref={songFileInputRef}
                            type="file"
                            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleCustomSongUpload(e.target.files[0]);
                              }
                            }}
                          />

                          {/* URL Direct Import */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1">
                              <input
                                type="url"
                                value={customSongUrl}
                                onChange={(e) => setCustomSongUrl(e.target.value)}
                                placeholder="Paste Audio URL (.mp3 / stream)..."
                                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                              />
                              <button
                                type="button"
                                onClick={handleImportAudioUrl}
                                disabled={isImportingUrl || !customSongUrl.trim()}
                                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                              >
                                {isImportingUrl ? <Loader2 size={12} className="animate-spin" /> : 'Load'}
                              </button>
                            </div>
                            <p className="text-[9px] text-slate-400">
                              Direct cloud or external link to audio
                            </p>
                          </div>
                        </div>

                        {/* Custom Song Metadata Inputs */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <input
                            type="text"
                            value={customSongTitle}
                            onChange={(e) => setCustomSongTitle(e.target.value)}
                            placeholder="Song Title (e.g. Kesariya, Deva Shree)"
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                          />
                          <input
                            type="text"
                            value={customSongArtist}
                            onChange={(e) => setCustomSongArtist(e.target.value)}
                            placeholder="Artist / Source (e.g. Arijit Singh)"
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Active Song Selector Dropdown */}
                    <select
                      value={selectedSong.id}
                      onChange={(e) => {
                        const found = allSongs.find((s) => s.id === e.target.value);
                        if (found) handleSelectSong(found);
                      }}
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 cursor-pointer shadow-2xs"
                    >
                      {customSongs.length > 0 && (
                        <optgroup label="⭐ My Custom Songs (From Music Apps)">
                          {customSongs.map((s) => (
                            <option key={s.id} value={s.id}>
                              🎵 {s.title} • {s.artist} ({s.durationSec}s)
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="🪷 Devotional & Auspicious Ragas">
                        {PRESET_SONGS.filter(s => s.genre === 'Devotional').map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.albumArt} {s.title}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🥁 Festive & Celebration Dhol">
                        {PRESET_SONGS.filter(s => s.genre === 'Festive').map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.albumArt} {s.title}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🚩 Royal Maratha & Trending Reels">
                        {PRESET_SONGS.filter(s => s.genre === 'Trending').map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.albumArt} {s.title}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🏡 Real Estate & Morning Peace">
                        {PRESET_SONGS.filter(s => s.genre === 'Real Estate' || s.genre === 'Morning').map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.albumArt} {s.title}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* ACTIVE TRACK PLAYER CARD */}
                  <div className="bg-white rounded-xl border border-rose-200 p-2.5 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={handleTogglePlaySong}
                        className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs shrink-0 cursor-pointer transition active:scale-95"
                      >
                        {isPlayingAudio ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                      </button>

                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-800 truncate leading-tight flex items-center gap-1.5">
                          <span>{selectedSong.title}</span>
                          {selectedSong.isCustom && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">Custom</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1.5 mt-0.5">
                          <span>{selectedSong.artist}</span>
                          <span>•</span>
                          <span className="text-rose-600 font-bold">{songDurationSec}s Status Clip</span>
                        </div>
                      </div>
                    </div>

                    {/* Animated soundwave bars when playing */}
                    <div className="flex items-center gap-1 shrink-0 h-5 px-2">
                      <span className={`w-1 rounded-full bg-rose-600 transition-all ${isPlayingAudio ? 'soundwave-bar h-5' : 'h-2'}`} />
                      <span className={`w-1 rounded-full bg-rose-600 transition-all ${isPlayingAudio ? 'soundwave-bar h-5' : 'h-3'}`} />
                      <span className={`w-1 rounded-full bg-rose-600 transition-all ${isPlayingAudio ? 'soundwave-bar h-5' : 'h-4'}`} />
                      <span className={`w-1 rounded-full bg-rose-600 transition-all ${isPlayingAudio ? 'soundwave-bar h-5' : 'h-2'}`} />
                    </div>
                  </div>

                  {/* SONG TRIMMER / START OFFSET SCRUBBER */}
                  <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200/80 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                      <span className="flex items-center gap-1">
                        <Sliders size={11} className="text-rose-600" />
                        <span>Song Start Hook / Chorus:</span>
                        <strong className="text-rose-700 font-mono">+{songOffsetSec}s</strong>
                      </span>
                      <span className="text-slate-400">
                        Plays from {songOffsetSec}s to {songOffsetSec + songDurationSec}s
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={Math.max(10, (selectedSong.durationSec || 40) - songDurationSec)}
                      step={1}
                      value={songOffsetSec}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSongOffsetSec(val);
                        if (isPlayingAudio) {
                          audioEngine.play(selectedSong, val, songVolume);
                        }
                      }}
                      className="w-full accent-rose-600 cursor-pointer"
                    />

                    {/* Volume Slider */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 pt-1 border-t border-rose-100">
                      <span className="flex items-center gap-1">
                        <Volume2 size={11} className="text-rose-600" />
                        <span>Music Volume:</span>
                        <strong className="text-rose-700 font-mono">{Math.round(songVolume * 100)}%</strong>
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={songVolume}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSongVolume(val);
                          audioEngine.setVolume(val);
                        }}
                        className="w-24 accent-rose-600 cursor-pointer"
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* CAPTION */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                CAPTION (optional)
              </label>
              <textarea
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add an optional caption for this WhatsApp status..."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 resize-none transition"
              />
            </div>

            {/* Send to referral partners */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <Send size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    Send to referral partners on WhatsApp
                  </h4>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                    Each partner gets it on WhatsApp with their stamped name &amp; contact plate.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSendToPartners(!sendToPartners)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ${
                  sendToPartners ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
                    sendToPartners ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Live Mobile Mockup Preview (col-span-5) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              LIVE WHATSAPP STATUS PREVIEW
            </p>

            {/* Phone Bezel */}
            <div className="relative w-[240px] sm:w-[260px] aspect-[9/16] bg-black rounded-[36px] p-2.5 shadow-xl border-[4px] border-slate-800 flex flex-col overflow-hidden">
              <div className="relative flex-1 rounded-[28px] overflow-hidden bg-slate-900 flex flex-col">
                
                {/* Background Image */}
                <img
                  src={imagePreview || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1080&q=80'}
                  alt="Status Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Top WhatsApp status bar */}
                <div className="absolute top-0 inset-x-0 p-2.5 bg-gradient-to-b from-black/80 via-black/30 to-transparent z-10">
                  <div className="w-full bg-white/30 h-1 rounded-full overflow-hidden mb-1.5">
                    <div 
                      className="bg-white h-full transition-all duration-100 ease-linear"
                      style={{ 
                        width: isPlayingAudio 
                          ? `${Math.min(100, (((currentPlayTime - songOffsetSec) % songDurationSec) / songDurationSec) * 100)}%` 
                          : '15%' 
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-white text-[10px]">
                    <div>
                      <p className="font-bold truncate leading-tight">{agent.name}</p>
                      <p className="text-[8px] text-white/70 leading-none mt-0.5">Today, {currentTimeFormatted}</p>
                    </div>
                    <span className="font-mono text-[9px] bg-black/40 px-1.5 py-0.2 rounded">
                      {hasSong ? `${songDurationSec}s` : 'Photo'}
                    </span>
                  </div>
                </div>

                {/* Animated Music Sticker if song enabled */}
                {hasSong && (
                  <div className="absolute top-10 right-2 z-10 bg-slate-950/85 backdrop-blur-md text-white px-2.5 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 shadow-lg max-w-[200px]">
                    <div 
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white shrink-0"
                      style={{ backgroundColor: selectedSong.color || '#E11D48' }}
                    >
                      ♫
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold truncate leading-tight">{selectedSong.title}</p>
                      <p className="text-[7px] text-slate-300 truncate leading-tight">{selectedSong.artist}</p>
                    </div>
                  </div>
                )}

                {/* Bottom Stamped Agent Contact Plate */}
                {personalizeForAgent && (
                  <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent text-white z-10">
                    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-2 border border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-wider">
                          {agent.role}
                        </p>
                        <p className="text-[11px] font-black text-white leading-tight">
                          {agent.name}
                        </p>
                        <p className="text-[9px] font-mono text-slate-300 mt-0.5">
                          {agent.phone}
                        </p>
                      </div>
                      <span className="text-[8px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded uppercase">
                        Enquire
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[9px] text-slate-400 mt-2 text-center max-w-[240px]">
              {hasSong 
                ? 'Plays background music automatically when shared to WhatsApp status.' 
                : 'Silent photo status without song.'}
            </p>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-600">
              Ready for: <strong>{agent.name}</strong> ({agent.phone})
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isExportingVideo}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/25 flex items-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-60"
            >
              {isExportingVideo ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Encoding Status Video ({exportProgress?.progress || 0}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>{hasSong ? 'Create Poster & Music Status Video' : 'Post to Daily Board'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Export Success Modal */}
      {showShareSuccessModal && createdPosterData && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowShareSuccessModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
              ✅
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                WhatsApp Status Ready with Song!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your 1080x1920 HD Status Video with <strong>{selectedSong.title}</strong> and stamped contact plate has been generated.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1">
              <p className="font-bold text-slate-800">Next Step:</p>
              <p className="text-slate-600">
                1. Open WhatsApp ➡️ Status / Updates ➡️ Camera.
              </p>
              <p className="text-slate-600">
                2. Select the downloaded status video from gallery &amp; share!
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  const captionText = buildCaptionText(createdPosterData.title, createdPosterData.projectName);
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(captionText)}`, '_blank');
                  setShowShareSuccessModal(false);
                  onClose();
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 cursor-pointer"
              >
                <Share2 size={14} />
                <span>Open WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  setShowShareSuccessModal(false);
                  onClose();
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
