import React, { useState, useEffect } from 'react';
import { 
  Download, Share2, Search, Calendar, Filter, 
  Sparkles, CheckCircle2, Music, Clock, Eye, 
  Building2, Plus, ArrowRight, Video, FileText, ChevronDown,
  Activity, CalendarClock, Layers, Trash2, Loader2, Play, Pause
} from 'lucide-react';
import { PosterTemplate, AgentProfile } from '../types';
import { DbProject } from '../lib/supabaseClient';
import { audioEngine } from '../lib/audioEngine';

interface DailyBoardViewProps {
  posters: PosterTemplate[];
  projects: DbProject[];
  agent: AgentProfile;
  loading: boolean;
  onOpenMusicModal: (p: PosterTemplate) => void;
  onOpenUpload: () => void;
  onDownloadOriginal: (p: PosterTemplate) => void;
  onDownloadBranded: (p: PosterTemplate) => void;
  onShareWhatsApp: (p: PosterTemplate) => void;
}

export const DailyBoardView: React.FC<DailyBoardViewProps> = ({
  posters,
  projects,
  agent,
  loading,
  onOpenMusicModal,
  onOpenUpload,
  onDownloadOriginal,
  onDownloadBranded,
  onShareWhatsApp,
}) => {
  const [activeView, setActiveView] = useState<'today' | 'scheduled' | 'archive' | 'downloads'>('today');
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'image' | 'video' | 'message'>('all');
  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeLeft, setTimeLeft] = useState('11h 15m');
  const [lightboxPoster, setLightboxPoster] = useState<PosterTemplate | null>(null);
  const [playingPostId, setPlayingPostId] = useState<string | null>(null);

  const handleTogglePlayPostSong = (post: PosterTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingPostId === post.id) {
      audioEngine.pause();
      setPlayingPostId(null);
    } else {
      if (post.song) {
        audioEngine.play(post.song, post.songStartOffsetSec || 0);
        setPlayingPostId(post.id);
      }
    }
  };

  useEffect(() => {
    const calcTime = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setTimeLeft(`${h}h ${m}m`);
    };
    calcTime();
    const interval = setInterval(calcTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredPosters = posters.filter((p) => {
    const matchesProj = selectedProject === 'All' || p.projectName === selectedProject;
    const matchesType = activeTypeFilter === 'all' || 
                        (activeTypeFilter === 'image' && (p.type === 'image' || !p.type)) ||
                        (activeTypeFilter === 'video' && p.type === 'video') ||
                        (activeTypeFilter === 'message' && p.type === 'message');
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.posterName && p.posterName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesProj && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Exact CRM Top Header: Views & Actions Row matching DailyBoard.tsx */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        
        {/* Left: View Tabs Segmented Control (Today, Scheduled, Archive, Downloads) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveView('today')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeView === 'today'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Today</span>
            <span className="text-[10px] font-mono bg-violet-100 text-violet-700 px-1.5 py-0.2 rounded-full font-bold">
              {filteredPosters.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView('scheduled')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeView === 'scheduled'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Scheduled</span>
          </button>

          <button
            onClick={() => setActiveView('archive')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeView === 'archive'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Archive</span>
          </button>

          <button
            onClick={() => setActiveView('downloads')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeView === 'downloads'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Downloads</span>
          </button>
        </div>

        {/* Right: Countdown & Post Button matching CRM */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Clock size={13} className="text-violet-600" />
            <span className="font-bold text-slate-800">{timeLeft}</span>
            <span className="text-slate-400">left for today&apos;s post</span>
          </div>

          <button
            onClick={onOpenUpload}
            className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-violet-600/20 transition cursor-pointer"
          >
            <Plus size={14} />
            <span>Post to Board</span>
          </button>
        </div>
      </div>

      {/* 2. Exact Filters Row matching DailyBoard.tsx */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        
        {/* Media Type Filter Pills (All, Images, Videos, Messages) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'image', label: 'Images' },
            { id: 'video', label: 'Videos' },
            { id: 'message', label: 'Messages' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveTypeFilter(type.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTypeFilter === type.id
                  ? 'bg-violet-50 text-violet-700 border border-violet-200 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Project Selector & Search Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="py-1.5 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="All">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posters or authors..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 3. Loading State */}
      {loading && (
        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 mb-3" />
          <p className="text-slate-800 font-black text-sm">Loading Live CRM Posters...</p>
          <p className="text-slate-400 font-semibold text-xs mt-1">Connecting to Supabase Database</p>
        </div>
      )}

      {/* 4. Empty State */}
      {!loading && filteredPosters.length === 0 && (
        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 text-center p-6">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
            <CalendarClock size={24} />
          </div>
          <h3 className="text-base font-black text-slate-800">No Posters Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            There are no active posters matching your current filter in the CRM database.
          </p>
          <button
            onClick={onOpenUpload}
            className="mt-4 px-4 py-2 bg-violet-600 text-white font-bold text-xs rounded-xl hover:bg-violet-700 transition"
          >
            Upload New Poster
          </button>
        </div>
      )}

      {/* 5. Live CRM Post Cards Grid (Matching DailyBoard.tsx Card Layout) */}
      {!loading && filteredPosters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPosters.map((post) => {
            const authorInitials = post.posterName ? post.posterName.slice(0, 2).toUpperCase() : 'SN';
            const displayDate = post.createdAt 
              ? new Date(post.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
              : 'Today';

            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Poster Media Image Container */}
                <div 
                  className="relative aspect-[4/5] bg-slate-950 overflow-hidden cursor-pointer"
                  onClick={() => setLightboxPoster(post)}
                >
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                    loading="lazy"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-50/95 backdrop-blur-md text-amber-800 border border-amber-300/80 px-2.5 py-1 rounded-md shadow-xs">
                      {post.projectName}
                    </span>
                  </div>

                  {/* Song Badge on Top Right if poster has song */}
                  {post.hasSong && post.song && (
                    <button
                      onClick={(e) => handleTogglePlayPostSong(post, e)}
                      className="absolute top-3 right-3 bg-black/80 hover:bg-black text-white text-[9px] font-black px-2.5 py-1 rounded-full border border-purple-400/50 flex items-center gap-1.5 shadow-lg backdrop-blur-md z-10 cursor-pointer transition active:scale-95"
                    >
                      {playingPostId === post.id ? (
                        <>
                          <Pause size={10} className="text-purple-400" />
                          <span className="text-purple-300">Playing</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                        </>
                      ) : (
                        <>
                          <Music size={10} className="text-purple-400" />
                          <span className="truncate max-w-[90px]">{post.song.title}</span>
                          <span className="text-purple-300 font-extrabold">({post.songDurationSec || 15}s)</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Multi-images indicator if any */}
                  {post.urls && post.urls.length > 1 && !post.hasSong && (
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white/10 z-10">
                      1 OF {post.urls.length}
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-black px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all flex items-center gap-1.5 shadow-xl">
                      <Music size={14} className="text-emerald-600" />
                      <span>{post.hasSong ? 'Customize Song & Status' : 'Add Song & Create WhatsApp Status'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body matching CRM */}
                <div className="p-4 flex flex-col gap-3 flex-1 justify-between bg-white">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm leading-snug group-hover:text-violet-600 transition-colors">
                      {post.title}
                    </h3>

                    {/* Attached Song Mini Player if present */}
                    {post.hasSong && post.song && (
                      <div className="mt-2 p-2 rounded-xl bg-purple-50/80 border border-purple-100 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={(e) => handleTogglePlayPostSong(post, e)}
                            className="w-6 h-6 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-2xs transition active:scale-95"
                          >
                            {playingPostId === post.id ? <Pause size={11} /> : <Play size={11} className="ml-0.5" />}
                          </button>
                          <div className="truncate">
                            <p className="font-bold text-slate-800 truncate leading-tight">{post.song.title}</p>
                            <p className="text-[10px] text-purple-700 font-semibold leading-none mt-0.5">
                              WhatsApp Status • {post.songDurationSec || 15}s Clip
                            </p>
                          </div>
                        </div>
                        {playingPostId === post.id && (
                          <div className="flex items-center gap-0.5 shrink-0 px-1">
                            <span className="soundwave-bar w-0.5 h-3 bg-purple-600 rounded-full" />
                            <span className="soundwave-bar w-0.5 h-4 bg-purple-600 rounded-full" />
                            <span className="soundwave-bar w-0.5 h-2 bg-purple-600 rounded-full" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Author & Time Details matching DailyBoard.tsx */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-black text-[10px] flex items-center justify-center shadow-inner uppercase shrink-0">
                          {authorInitials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-700 leading-tight">
                            {post.posterName || 'Saraswati Team'}
                          </span>
                          <span className="text-[9px] font-semibold text-slate-400 leading-none mt-0.5">
                            {displayDate}
                          </span>
                        </div>
                      </div>

                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-100">
                        <Activity size={10} />
                        <span>{post.downloadsCount || 0} DLs</span>
                      </span>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                      <span>Personalized for: <strong>{agent.name}</strong></span>
                    </div>
                  </div>

                  {/* Exact Action Row with Newly Added "Music Status" Button */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                    
                    {/* 1. Direct WhatsApp Share */}
                    <button
                      onClick={() => {
                        if (post.hasSong) {
                          onOpenMusicModal(post);
                        } else {
                          onShareWhatsApp(post);
                        }
                      }}
                      className="flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 hover:shadow-md hover:shadow-green-500/20 active:scale-95 text-white py-2 px-1 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
                      title={post.hasSong ? "Share to WhatsApp with Song Video" : "Share to WhatsApp"}
                    >
                      <Share2 size={13} />
                      <span>Share</span>
                    </button>

                    {/* 2. Download Branded Poster */}
                    <button
                      onClick={() => onDownloadBranded(post)}
                      className="flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 py-2 px-1 rounded-xl font-bold text-xs transition-all border border-slate-200 cursor-pointer"
                      title="Download with your name & number"
                    >
                      <Sparkles size={13} className="text-amber-500" />
                      <span>My Poster</span>
                    </button>

                    {/* 3. NEW REQUESTED FEATURE: Music Status Studio */}
                    <button
                      onClick={() => onOpenMusicModal(post)}
                      className="flex items-center justify-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white py-2 px-1 rounded-xl font-bold text-xs transition-all shadow-sm shadow-purple-700/20 cursor-pointer"
                      title="Add/Customize song & create WhatsApp video status"
                    >
                      <Music size={13} />
                      <span>Music Status</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Preview Modal matching CRM */}
      {lightboxPoster && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxPoster(null)}
        >
          <div 
            className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 text-white border border-slate-800 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white">{lightboxPoster.title}</h3>
                <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">{lightboxPoster.projectName}</p>
              </div>
              <button
                onClick={() => setLightboxPoster(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-[4/5] bg-black rounded-2xl overflow-hidden mb-5">
              <img
                src={lightboxPoster.imageUrl}
                alt={lightboxPoster.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  onDownloadBranded(lightboxPoster);
                  setLightboxPoster(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>Save Poster</span>
              </button>

              <button
                onClick={() => {
                  const target = lightboxPoster;
                  setLightboxPoster(null);
                  onOpenMusicModal(target);
                }}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-700/25"
              >
                <Music size={14} />
                <span>Add Song & Create Status Video</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
