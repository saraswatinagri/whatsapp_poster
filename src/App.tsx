import React, { useState, useEffect } from 'react';
import { 
  Music, Plus, ChevronDown, CheckCircle2 
} from 'lucide-react';
import { PosterTemplate, AgentProfile, CrmTab } from './types';
import { DailyBoardView } from './components/DailyBoardView';
import { CreatePosterModal } from './components/CreatePosterModal';
import { PosterMusicModal } from './components/PosterMusicModal';
import { CrmSidebar } from './components/CrmSidebar';
import { DailyLayoutMediaView } from './components/DailyLayoutMediaView';
import { ProjectDocumentsView } from './components/ProjectDocumentsView';
import { 
  checkSupabaseConnection, 
  fetchLiveDailyPosts, 
  fetchLiveProjects, 
  DbProject 
} from './lib/supabaseClient';
import { drawContactPlate } from './lib/contactPlate';
import { drawFullPosterCanvas } from './lib/posterLibrary';

export function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<CrmTab>('daily');
  const [posters, setPosters] = useState<PosterTemplate[]>([]);
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedPosterForModal, setSelectedPosterForModal] = useState<PosterTemplate | null>(null);

  const [agent, setAgent] = useState<AgentProfile>({
    name: 'Rahul Mehta',
    phone: '+91 94221 54321',
    role: 'Sales Executive',
    customLabel: 'ENQUIRE NOW',
  });

  // Database status
  const [dbConnected, setDbConnected] = useState(false);
  const [dbPostCount, setDbPostCount] = useState(0);

  // Modals & UI
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Fetch real data directly from the CRM Supabase database
  const loadCrmData = () => {
    checkSupabaseConnection().then((res) => {
      setDbConnected(res.connected);
      setDbPostCount(res.count);
    });

    fetchLiveProjects().then((proj) => {
      setProjects(proj);
    });

    setLoadingPosts(true);
    fetchLiveDailyPosts().then((dbPosts) => {
      if (dbPosts && dbPosts.length > 0) {
        const mappedRealPosters: PosterTemplate[] = dbPosts
          .filter((p) => p.urls && p.urls.length > 0)
          .map((p) => ({
            id: p.id,
            title: p.title || 'Daily Poster',
            projectName: p.projectName || 'Saraswati Nagri Group',
            category: 'db',
            imageUrl: p.urls[0],
            urls: p.urls,
            aspectRatio: '9:16',
            tag: p.projectName || 'Daily Layout Media',
            headline: p.title || 'Nagpur Prime Plots',
            subheadline: p.content || p.projectName || 'Immediate Registry & Sanctioned RL',
            badge: 'Live CRM Post',
            highlights: ['Immediate Registry', 'Clear Title', 'Cement Roads'],
            downloadsCount: p.downloads || 0,
            postDate: p.post_date,
            createdAt: p.created_at,
            posterName: p.poster_name || 'CRM Team',
            type: p.type || 'image',
            content: p.content,
          }));

        setPosters(mappedRealPosters);
      } else {
        setPosters([]);
      }
      setLoadingPosts(false);
    });
  };

  useEffect(() => {
    loadCrmData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Download original poster
  const handleDownloadOriginal = (poster: PosterTemplate) => {
    const a = document.createElement('a');
    a.href = poster.imageUrl;
    a.download = `saraswati_nagri_${poster.id}_original.png`;
    a.click();
    showToast(`Downloading original: ${poster.title}`);
  };

  // Download branded poster with agent plate
  const handleDownloadBranded = (poster: PosterTemplate) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      drawFullPosterCanvas(ctx, 1080, 1920, poster, img);
      drawContactPlate(ctx, 1080, 1920, agent);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `saraswati_nagri_${agent.name.replace(/\s+/g, '_')}_poster.png`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Branded poster for ${agent.name} downloaded in HD!`);
      }, 'image/png');
    };
    img.onerror = () => {
      drawFullPosterCanvas(ctx, 1080, 1920, poster, null);
      drawContactPlate(ctx, 1080, 1920, agent);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `saraswati_nagri_${agent.name.replace(/\s+/g, '_')}_poster.png`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Branded poster for ${agent.name} downloaded in HD!`);
      }, 'image/png');
    };
    img.src = poster.imageUrl;
  };

  // Share to WhatsApp with bilingual caption matching CRM
  const handleShareWhatsApp = (poster: PosterTemplate) => {
    const isPartner = agent.role === 'Referral Partner';
    const caption = isPartner
      ? `🏡 *सरस्वती नगरी — Nagpur Prime Plots*\n` +
        `📍 Project: ${poster.projectName}\n` +
        `✨ ${poster.title}\n\n` +
        `प्लॉट माहिती व विनामूल्य साईट व्हिजिटसाठी संपर्क करा:\n` +
        `👤 *${agent.name}* (Referral Partner)\n` +
        `📞 *${agent.phone}*`
      : `🏡 *${poster.title} — ${poster.projectName}*\n` +
        `✨ Immediate Registry & Clear Title plots in Nagpur.\n` +
        `📞 For details & site visit, contact: ${agent.name} (${agent.phone})`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`, '_blank');
  };

  const handleSelectTab = (tab: CrmTab) => {
    setActiveTab(tab);
    if (tab === 'songs_app') {
      // If user selected Song Studio tab, open studio for active poster or first poster
      if (!selectedPosterForModal && posters.length > 0) {
        setSelectedPosterForModal(posters[0]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] text-slate-800 font-sans antialiased selection:bg-rose-200 flex">
      
      {/* 1. Sidebar - Exclusively focused on Media Library views */}
      <CrmSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        agentRole={agent.role}
        agentName={agent.name}
        postCount={posters.length}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        
        {/* Exact CRM Top Header Navigation Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          
          {/* Brand & Section Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-600/20 font-black shrink-0">
              🪷
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-slate-900 leading-tight">
                  Saraswati Nagri CRM
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Media Library
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-400">
                  • {activeTab === 'daily' && 'Daily Poster Board'}
                  • {activeTab === 'songs_app' && 'WhatsApp Song Studio'}
                  • {activeTab === 'layout_media' && 'Daily Layout Media'}
                  • {activeTab === 'vault' && 'Project Legal Documents'}
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                Marketing • Posters • Song Status Studio
              </p>
            </div>
          </div>

          {/* Right: DB sync indicator & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Supabase Connection Status */}
            <div 
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                dbConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{dbConnected ? `Live CRM DB (${dbPostCount} Posts)` : 'Live DB Sync'}</span>
            </div>

            {/* Create Poster / Post to Board Header Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-600/20 transition cursor-pointer active:scale-95"
            >
              <Plus size={14} />
              <span>Post to Board</span>
            </button>

            {/* User Persona Switcher matching CRM */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 pl-1 cursor-pointer py-1 px-2 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-600 to-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  {agent.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {agent.name}
                  </div>
                  <div className="text-[10px] font-bold text-rose-600 leading-tight flex items-center gap-0.5">
                    <span>{agent.role}</span>
                    <ChevronDown size={10} />
                  </div>
                </div>
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-800">{agent.name}</p>
                    <p className="text-[11px] text-slate-500">{agent.phone}</p>
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setAgent({ ...agent, role: 'Sales Executive', customLabel: 'ENQUIRE NOW' });
                        setShowRoleMenu(false);
                        showToast('Switched to Sales Executive branding');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-medium cursor-pointer ${
                        agent.role === 'Sales Executive' ? 'bg-rose-50 text-rose-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>Sales Executive</span>
                      {agent.role === 'Sales Executive' && <CheckCircle2 size={13} className="text-rose-600" />}
                    </button>

                    <button
                      onClick={() => {
                        setAgent({ ...agent, role: 'Referral Partner', customLabel: 'Referral Partner' });
                        setShowRoleMenu(false);
                        showToast('Switched to Referral Partner branding');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-medium cursor-pointer ${
                        agent.role === 'Referral Partner' ? 'bg-rose-50 text-rose-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>Referral Partner</span>
                      {agent.role === 'Referral Partner' && <CheckCircle2 size={13} className="text-rose-600" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 3. Main Views Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          
          {/* TAB 1: Daily Poster Board */}
          {activeTab === 'daily' && (
            <DailyBoardView
              posters={posters}
              projects={projects}
              agent={agent}
              loading={loadingPosts}
              onOpenMusicModal={(p) => setSelectedPosterForModal(p)}
              onOpenUpload={() => setShowCreateModal(true)}
              onDownloadOriginal={handleDownloadOriginal}
              onDownloadBranded={handleDownloadBranded}
              onShareWhatsApp={handleShareWhatsApp}
            />
          )}

          {/* TAB 2: WhatsApp Song Studio Hub */}
          {activeTab === 'songs_app' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="max-w-xl space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full border border-white/30">
                    🎵 WhatsApp Music Status Studio
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Create WhatsApp Status Posters with Custom Songs
                  </h2>
                  <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                    Pick any poster, attach songs chosen from Spotify, YouTube Music or device audio files, trim 15s/30s hooks, and export ready-to-share 1080x1920 HD Status Videos with your stamped contact plate.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (posters.length > 0) {
                      setSelectedPosterForModal(posters[0]);
                    } else {
                      setShowCreateModal(true);
                    }
                  }}
                  className="px-6 py-3.5 bg-white text-rose-700 hover:bg-rose-50 font-black text-sm rounded-2xl shadow-xl transition cursor-pointer shrink-0 active:scale-95 flex items-center gap-2"
                >
                  <Music size={18} />
                  <span>Launch Status Studio</span>
                </button>
              </div>

              {/* Poster Picker Cards for Song Studio */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>Select a Poster to Attach Song &amp; Export Video</span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      {posters.length} Posters Available
                    </span>
                  </h3>

                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Upload New Poster with Song</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {posters.map((poster) => (
                    <div
                      key={poster.id}
                      onClick={() => setSelectedPosterForModal(poster)}
                      className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col"
                    >
                      <div className="relative aspect-[4/5] bg-slate-950 overflow-hidden">
                        <img
                          src={poster.imageUrl}
                          alt={poster.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5">
                            <Music size={14} />
                            <span>Edit Song in Studio</span>
                          </span>
                        </div>
                      </div>

                      <div className="p-3">
                        <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                          {poster.projectName}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 truncate mt-1">
                          {poster.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Daily Layout Media */}
          {activeTab === 'layout_media' && (
            <DailyLayoutMediaView
              projects={projects}
              agent={agent}
              onShareWhatsApp={(caption, title) => {
                showToast(`Sharing ${title} to WhatsApp!`);
              }}
            />
          )}

          {/* TAB 4: Project Legal Documents */}
          {activeTab === 'vault' && (
            <ProjectDocumentsView
              projects={projects}
              agent={agent}
            />
          )}

        </main>
      </div>

      {/* 4. EXACT CRM "Post to Daily Board" Modal with 15s/30s Song Option & WhatsApp Posting */}
      <CreatePosterModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projects={projects}
        agent={agent}
        onSavePoster={(newPoster) => {
          setPosters((prev) => [newPoster, ...prev]);
          showToast(`Posted "${newPoster.title}" with song to Daily Board!`);
        }}
      />

      {/* 5. WhatsApp Music Status Studio Modal */}
      {selectedPosterForModal && (
        <PosterMusicModal
          isOpen={!!selectedPosterForModal}
          onClose={() => setSelectedPosterForModal(null)}
          poster={selectedPosterForModal}
          agent={agent}
          onChangeAgent={(a) => setAgent(a)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl z-50 text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
