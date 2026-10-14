import React, { useState } from 'react';
import { 
  FolderOpen, FileText, Download, Share2, Search, 
  CheckCircle2, ShieldCheck, ExternalLink, Calendar, Building2
} from 'lucide-react';
import { AgentProfile } from '../types';
import { DbProject } from '../lib/supabaseClient';

interface ProjectDocumentsViewProps {
  projects: DbProject[];
  agent: AgentProfile;
}

interface ProjectDoc {
  id: string;
  projectName: string;
  title: string;
  docType: 'Sanctioned RL Map' | '7/12 Extract' | 'RERA Certificate' | 'NA Sanction Order' | 'Title Search Report';
  fileSize: string;
  updatedDate: string;
  verified: boolean;
  authority: string;
  description: string;
}

const SAMPLE_PROJECT_DOCS: ProjectDoc[] = [
  {
    id: 'doc-1',
    projectName: 'Saraswati Nagri 3',
    title: 'NMRDA Sanctioned Final RL Layout Map (With Plot Numbers)',
    docType: 'Sanctioned RL Map',
    fileSize: '3.4 MB',
    updatedDate: '10 Oct 2026',
    verified: true,
    authority: 'Nagpur Metropolitan Region Development Authority',
    description: 'Official approved master layout showing 9m/12m roads, public utility, and sanctioned plot demarcation.',
  },
  {
    id: 'doc-2',
    projectName: 'Saraswati Nagri 3',
    title: '7/12 Land Extract & Ferfar Record (Clear Title)',
    docType: '7/12 Extract',
    fileSize: '1.2 MB',
    updatedDate: '08 Oct 2026',
    verified: true,
    authority: 'Revenue Department, Government of Maharashtra',
    description: 'Latest updated digitized 7/12 land extract verifying undisputed company ownership with zero encumbrance.',
  },
  {
    id: 'doc-3',
    projectName: 'Saraswati Nagri 5',
    title: 'MahaRERA Project Registration Certificate',
    docType: 'RERA Certificate',
    fileSize: '850 KB',
    updatedDate: '05 Oct 2026',
    verified: true,
    authority: 'Maharashtra Real Estate Regulatory Authority',
    description: 'RERA approved project registration certificate guaranteeing complete buyer protection and registry timeline.',
  },
  {
    id: 'doc-4',
    projectName: 'Saraswati Nagri 1',
    title: 'Collector Non-Agricultural (NA) & T&CP Sanction Order',
    docType: 'NA Sanction Order',
    fileSize: '2.1 MB',
    updatedDate: '01 Oct 2026',
    verified: true,
    authority: 'District Collector Office, Nagpur',
    description: 'Formal Non-Agricultural residential order for immediate registry and nationalized bank loan approvals.',
  },
  {
    id: 'doc-5',
    projectName: 'Saraswati Nagri 8',
    title: 'Advocate 30 Years Legal Search & Clear Title Report',
    docType: 'Title Search Report',
    fileSize: '1.8 MB',
    updatedDate: '28 Sep 2026',
    verified: true,
    authority: 'High Court Senior Real Estate Advocate, Nagpur',
    description: 'Comprehensive 30-year search title certificate ensuring 100% legal clarity without litigations.',
  },
];

export const ProjectDocumentsView: React.FC<ProjectDocumentsViewProps> = ({
  projects,
  agent,
}) => {
  const [selectedProject, setSelectedProject] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const docTypes = ['All', 'Sanctioned RL Map', '7/12 Extract', 'RERA Certificate', 'NA Sanction Order', 'Title Search Report'];

  const filteredDocs = SAMPLE_PROJECT_DOCS.filter((doc) => {
    const matchesProj = selectedProject === 'All' || doc.projectName === selectedProject;
    const matchesType = selectedType === 'All' || doc.docType === selectedType;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.authority.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProj && matchesType && matchesSearch;
  });

  const handleShareDoc = (doc: ProjectDoc) => {
    const caption = 
      `📁 *${doc.title}*\n` +
      `📍 *Project:* ${doc.projectName}\n` +
      `🏛️ *Issuing Authority:* ${doc.authority}\n` +
      `✅ *Status:* 100% Sanctioned & Verified Clear Title\n\n` +
      `सँक्शन्ड लेआउट नकाशा, ७/१२ उतारा व अधिक माहितीसाठी संपर्क करा:\n` +
      `👤 *${agent.name}* (${agent.role})\n` +
      `📞 *${agent.phone}*`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Project Legal Documents &amp; Sanctioned RL Maps
            </h2>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              Verified Legal Vault
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant client verification: Access sanctioned layout maps, 7/12 land extracts, Collector NA orders, and MahaRERA certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            {filteredDocs.length} Verified Files
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {docTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedType === type
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {type}
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
              placeholder="Search documents or RERA..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <FileText size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                    {doc.projectName}
                  </span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {doc.docType}
                  </span>
                  {doc.verified && (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                      <ShieldCheck size={11} className="text-emerald-600" />
                      <span>Verified Title</span>
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {doc.description}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                  <span>🏛️ {doc.authority}</span>
                  <span>•</span>
                  <span>📦 {doc.fileSize}</span>
                  <span>•</span>
                  <span>Updated {doc.updatedDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleShareDoc(doc)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Share2 size={13} />
                <span>WhatsApp to Client</span>
              </button>

              <button
                onClick={() => alert(`Downloading verified legal PDF: ${doc.title}`)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer active:scale-95"
              >
                <Download size={13} />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
