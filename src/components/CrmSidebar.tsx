import React from 'react';
import { 
  Share2, PanelLeftClose, PanelLeftOpen,
  Music, Image as ImageIcon, FolderOpen,
  Sparkles, Calendar, Layers, CheckCircle2
} from 'lucide-react';
import { CrmTab } from '../types';

interface CrmSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: CrmTab;
  onSelectTab: (t: CrmTab) => void;
  agentRole?: string;
  agentName?: string;
  postCount?: number;
}

export const CrmSidebar: React.FC<CrmSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  activeTab,
  onSelectTab,
  agentRole = 'Sales Executive',
  agentName = 'Rahul Mehta',
  postCount = 0,
}) => {
  const mediaLibraryViews = [
    {
      id: 'daily' as CrmTab,
      label: 'Daily Poster Board',
      icon: Calendar,
      badge: postCount > 0 ? `${postCount} Posts` : 'Active',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Daily WhatsApp status posters with song & contact stamp',
      emoji: '📌',
    },
    {
      id: 'songs_app' as CrmTab,
      label: 'WhatsApp Song Studio',
      icon: Music,
      badge: 'Song + Video',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      description: 'Add custom songs from music apps & generate HD 9:16 status',
      emoji: '🎵',
    },
    {
      id: 'layout_media' as CrmTab,
      label: 'Daily Layout Media',
      icon: ImageIcon,
      badge: 'Plots',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Nagpur site progress, roads, demarcation & gate photos',
      emoji: '📸',
    },
    {
      id: 'vault' as CrmTab,
      label: 'Project Documents',
      icon: FolderOpen,
      badge: '7/12 & RERA',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      description: 'Sanctioned RL maps, RERA certs & legal papers',
      emoji: '📁',
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-slate-900 text-white border-r border-slate-800 shrink-0 sticky top-0 h-[100dvh] z-40 transition-[width] duration-200 ease-out select-none ${
        collapsed ? 'w-[72px] overflow-visible' : 'w-64 overflow-y-auto'
      }`}
    >
      {/* Brand Header */}
      <div className={`flex items-center border-b border-slate-800 ${collapsed ? 'flex-col gap-2 p-3 pb-3 justify-center' : 'justify-between p-4 px-5'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-500/20 font-black">
            <span className="text-base">🪷</span>
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-tight text-white leading-tight truncate">
                Saraswati Nagri
              </h1>
              <span className="text-[10px] text-rose-400 font-bold tracking-widest uppercase flex items-center gap-1">
                <span>Nagpur CRM</span>
                <span>•</span>
                <span className="text-slate-400">Media Hub</span>
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Media Library Core Section (Other non-media CRM sections removed) */}
      <nav className={`flex-1 space-y-2 py-4 ${collapsed ? 'px-2.5' : 'px-3'}`}>
        {!collapsed && (
          <div className="px-2 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Share2 size={13} className="text-rose-400" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Media Library
              </p>
            </div>
            <span className="text-[9px] font-bold bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
              CRM Section
            </span>
          </div>
        )}

        {mediaLibraryViews.map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 rounded-xl transition text-left cursor-pointer group relative ${
                collapsed ? 'p-3 justify-center' : 'p-3'
              } ${
                isSelected
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold shadow-lg shadow-rose-600/25 border border-rose-500/40'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
              }`}
              title={collapsed ? `${item.emoji} ${item.label}` : undefined}
            >
              <div className={`p-1 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-slate-700'} shrink-0`}>
                <Icon size={16} className={isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'} />
              </div>

              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate">
                      {item.label}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 group-hover:text-slate-300 truncate mt-0.5 font-normal">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Active Indicator bar */}
              {isSelected && (
                <span className="absolute left-0 inset-y-2 w-1 bg-white rounded-r-full shadow-xs" />
              )}
            </button>
          );
        })}

        {/* Feature highlight card */}
        {!collapsed && (
          <div className="mt-6 p-3.5 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-950 border border-slate-700/60 text-slate-300 shadow-inner">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm">🎵</span>
              <span className="text-xs font-bold text-white">Music Status Engine</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Export 1080x1920 HD video posters with custom songs from Spotify, YouTube Music or files with your stamped contact plate for WhatsApp.
            </p>
          </div>
        )}
      </nav>

      {/* Footer Profile info matching CRM */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm ring-1 ring-white/20">
            {agentName.slice(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-200 truncate">
                {agentName}
              </div>
              <div className="text-[10px] font-semibold text-rose-400 truncate flex items-center gap-1">
                <span>{agentRole}</span>
                <span>•</span>
                <span className="text-slate-400">Nagpur</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
