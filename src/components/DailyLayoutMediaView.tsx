import React, { useState } from 'react';
import { 
  Camera, Image as ImageIcon, Download, Share2, Search, 
  MapPin, Tag, Check
} from 'lucide-react';
import { AgentProfile } from '../types';
import { DbProject } from '../lib/supabaseClient';

interface DailyLayoutMediaViewProps {
  projects: DbProject[];
  agent: AgentProfile;
  onShareWhatsApp: (caption: string, title: string) => void;
}

interface LayoutItem {
  id: string;
  projectName: string;
  title: string;
  category: 'Site Progress' | 'Road Work' | 'Entrance Gate' | 'Demarcation' | 'Drone View' | 'Park & Garden';
  imageUrl: string;
  capturedDate: string;
  location: string;
  highlights: string[];
}

const SAMPLE_LAYOUT_ITEMS: LayoutItem[] = [
  {
    id: 'lm-1',
    projectName: 'Saraswati Nagri 3',
    title: 'Grand Entrance Arch & Concrete Approach Road',
    category: 'Entrance Gate',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1080&q=80',
    capturedDate: 'Today',
    location: 'Besa-Pipla Road, Nagpur',
    highlights: ['Grand Entrance Arch', 'Security Cabin', 'Street Lights'],
  },
  {
    id: 'lm-2',
    projectName: 'Saraswati Nagri 5',
    title: 'Sanctioned Layout Cement Concrete Roads (9M & 12M)',
    category: 'Road Work',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80',
    capturedDate: 'Yesterday',
    location: 'Wardha Road Corridor, Nagpur',
    highlights: ['Cement Concrete Roads', 'Underground Storm Drainage', 'Paved Footpath'],
  },
  {
    id: 'lm-3',
    projectName: 'Saraswati Nagri 1',
    title: 'Individual Plot Demarcation & Boundary Stones',
    category: 'Demarcation',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1080&q=80',
    capturedDate: '12 Oct 2026',
    location: 'Hingna Road, Nagpur',
    highlights: ['Numbered Boundary Stones', 'Clear Demarcation', 'Ready for Registry'],
  },
  {
    id: 'lm-4',
    projectName: 'Saraswati Nagri 8',
    title: 'High Resolution Drone Master Layout Survey',
    category: 'Drone View',
    imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1080&q=80',
    capturedDate: '10 Oct 2026',
    location: 'Umred Road, Nagpur',
    highlights: ['NMRDA Sanctioned RL', 'Full Layout Aerial Survey', 'Near Metro Station'],
  },
  {
    id: 'lm-5',
    projectName: 'Saraswati Nagri 2',
    title: 'Landscaped Children Park & Green Buffer Zone',
    category: 'Park & Garden',
    imageUrl: 'https://images.unsplash.com/photo-1588880331179-bc9b93a0cb5e?auto=format&fit=crop&w=1080&q=80',
    capturedDate: '09 Oct 2026',
    location: 'Besa-Pipla Road, Nagpur',
    highlights: ['Jogging Track', 'Children Play Area', 'Tree Plantation'],
  },
  {
    id: 'lm-6',
    projectName: 'Saraswati Nagri 4',
    title: 'Underground Electrification & Transformer Installation',
    category: 'Site Progress',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1080&q=80',
    capturedDate: '08 Oct 2026',
    location: 'Wardha Road, Nagpur',
    highlights: ['MSEDCL Transformer', 'Underground Cabling', 'Street Light Poles'],
  },
];

export const DailyLayoutMediaView: React.FC<DailyLayoutMediaViewProps> = ({
  projects,
  agent,
}) => {
  const [selectedProject, setSelectedProject] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<LayoutItem | null>(null);

  const categories = ['All', 'Entrance Gate', 'Road Work', 'Demarcation', 'Site Progress', 'Drone View', 'Park & Garden'];

  const filteredItems = SAMPLE_LAYOUT_ITEMS.filter((item) => {
    const matchesProj = selectedProject === 'All' || item.projectName === selectedProject;
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProj && matchesCat && matchesSearch;
  });

  const handleShareWhatsApp = (item: LayoutItem) => {
    const caption = 
      `📸 *${item.title}*\n` +
      `📍 *Project:* ${item.projectName} (${item.location})\n` +
      `✨ *Work Update:* ${item.highlights.join(' • ')}\n\n` +
      `नागपूरमधील सँक्शन्ड आर. एल. प्लॉट साईट व्हिजिटसाठी संपर्क करा:\n` +
      `👤 *${agent.name}* (${agent.role})\n` +
      `📞 *${agent.phone}*`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`, '_blank');
  };

  const handleDownload = (item: LayoutItem) => {
    const a = document.createElement('a');
    a.href = item.imageUrl;
    a.download = `saraswati_nagri_${item.projectName.replace(/\s+/g, '_')}_${item.id}.jpg`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Daily Layout Media
            </h2>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
              Live Nagpur Site Photos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real ground photography of layout demarcation, cement roads, grand entrance gates, and site development for WhatsApp updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            {filteredItems.length} Site Media Items
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Project & Search */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="py-1.5 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="All">All Nagpur Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search site work or location..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Grid of Layout Media Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
          >
            <div 
              className="relative aspect-[16/10] bg-slate-950 overflow-hidden cursor-pointer"
              onClick={() => setPreviewItem(item)}
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                <span className="text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white px-2.5 py-1 rounded-md shadow-xs">
                  {item.projectName}
                </span>
                <span className="text-[9px] font-bold bg-black/60 backdrop-blur-md text-amber-300 px-2 py-1 rounded-md border border-white/10">
                  {item.category}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[10px] text-white/90 font-medium bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <MapPin size={10} className="text-rose-400" />
                <span>{item.location}</span>
              </div>
            </div>

            <div className="p-4 flex flex-col justify-between flex-1">
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                  {item.title}
                </h3>

                <div className="flex flex-wrap gap-1 mt-2.5">
                  {item.highlights.map((h, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      ✓ {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleShareWhatsApp(item)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Share2 size={13} />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => handleDownload(item)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Save HD</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Preview */}
      {previewItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewItem(null)}
        >
          <div 
            className="bg-slate-900 rounded-3xl max-w-3xl w-full p-6 text-white border border-slate-800 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">{previewItem.title}</h3>
                <p className="text-xs text-rose-400 font-bold uppercase tracking-wider">{previewItem.projectName} • {previewItem.location}</p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-[16/10] bg-black rounded-2xl overflow-hidden mb-5">
              <img
                src={previewItem.imageUrl}
                alt={previewItem.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  handleDownload(previewItem);
                  setPreviewItem(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>Save Full Photo</span>
              </button>

              <button
                onClick={() => {
                  handleShareWhatsApp(previewItem);
                  setPreviewItem(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-700/25"
              >
                <Share2 size={14} />
                <span>Share to WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
