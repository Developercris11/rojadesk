'use client';

import { useState, useEffect, Suspense } from 'react';
import { Search, Download, Plus, Globe, Phone, Trash2, Filter, Loader2, Database, MapPin, CheckSquare, Square, Check, X, ChevronDown, ChevronRight, Menu, Target, ExternalLink } from 'lucide-react';
import { US_CITIES } from '@/lib/data/cities';
import { cn } from '@/lib/utils';

interface Lead {
  id: string; // Changed to string for Prisma cuid
  companyName: string;
  phoneNumber: string;
  zipCode?: string;
  website?: string;
  category: string;
  state: string;
  city?: string;
  createdAt: string;
}

interface Stats {
  [state: string]: {
    [city: string]: {
      [category: string]: number;
    };
  };
}

const CATEGORIES = ['Aviation', 'Heavy equipment', 'Motor Pool', 'Real Estate', 'Unique items'];
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

function ProspectorContent() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Motor Pool');
  const [extractState, setExtractState] = useState('UT');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Navigation & Filtering
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expandedStates, setExpandedStates] = useState<string[]>([]);
  const [expandedCities, setExpandedCities] = useState<string[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [extractCity, setExtractCity] = useState('');
  const [isCustomCity, setIsCustomCity] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkState, setBulkState] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filter state
  const [zipFilter, setZipFilter] = useState('');
  const [recentScrapeIds, setRecentScrapeIds] = useState<string[]>([]);

  useEffect(() => {
    fetchStats();
    const timer = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedState, selectedCity, selectedCategories, zipFilter]);

  const fetchLeads = async () => {
    let endpoint = '/api/leads?app=prospector&';
    if (selectedState) endpoint += `state=${selectedState}&`;
    if (selectedCity) endpoint += `city=${selectedCity}&`;
    if (selectedCategories.length > 0) endpoint += `selections=${selectedCategories.join(',')}&`;
    if (zipFilter) endpoint += `zipCode=${zipFilter}&`;

    const res = await fetch(endpoint);
    const data = await res.json();
    setLeads(data);
  };

  const fetchStats = async () => {
    const res = await fetch('/api/leads/stats?app=prospector');
    const data = await res.json();
    setStats(data);
  };

  const [scrapeResult, setScrapeResult] = useState<{ newCount: number; duplicateCount: number } | null>(null);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !category) {
      alert('Please fill in URL and Category.');
      return;
    }
    setLoading(true);
    setScrapeResult(null);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, category, state: extractState, city: extractCity }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        setScrapeResult({ newCount: data.newCount, duplicateCount: data.duplicateCount });
        setRecentScrapeIds(data.processedIds || []);
        setUrl('');
        fetchStats();
        fetchLeads();
      }
    } catch (err) {
      alert('Failed to scrape leads');
    } finally {
      setLoading(false);
    }
  };

  const updateIndividual = async (id: string, updates: Partial<Lead>) => {
    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    fetchStats();
    fetchLeads();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredLeads.length) setSelectedIds([]);
    else setSelectedIds(filteredLeads.map(l => l.id));
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0 || (!bulkCategory && !bulkState)) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/leads/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          category: bulkCategory || undefined,
          state: bulkState || undefined
        }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        setSelectedIds([]);
        setBulkCategory('');
        setBulkState('');
        fetchStats();
        fetchLeads();
      }
    } catch (err) {
      alert('Bulk update failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
    fetchStats();
    fetchLeads();
  };

  const handleExport = () => {
    let exportUrl = '/api/export?app=prospector&';
    if (selectedState) exportUrl += `state=${selectedState}&`;
    if (selectedCity) exportUrl += `city=${encodeURIComponent(selectedCity)}&`;
    if (selectedCategories.length > 0) exportUrl += `selections=${encodeURIComponent(selectedCategories.join(','))}&`;
    if (zipFilter) exportUrl += `zipCode=${zipFilter}&`;
    window.location.href = exportUrl;
  };

  const toggleStateExpand = (state: string) => {
    setExpandedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  const hasActiveFilters = !!(selectedState || selectedCity || selectedCategories.length > 0 || zipFilter || search);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.companyName.toLowerCase().includes(search.toLowerCase());
    const matchesZip = !zipFilter || lead.zipCode?.includes(zipFilter);
    return matchesSearch && matchesZip;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-10 min-h-[800px]">
      
      {/* Navigator Sidebar - Integrated into RojaDesk Layout */}
      <aside className={cn(
        "w-full lg:w-72 glass-premium rounded-[2rem] p-6 h-fit sticky top-10",
        isSidebarCollapsed && "lg:w-20"
      )}>
        <div className="flex items-center justify-between mb-8 px-2">
            {!isSidebarCollapsed && <h2 className="text-xl font-black tracking-tighter uppercase">Navigator</h2>}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-white/10 rounded-xl">
                <Menu size={20} />
            </button>
        </div>

        {!isSidebarCollapsed && (
            <div className="space-y-2 overflow-y-auto max-h-[600px] custom-scrollbar px-1">
                <button
                    onClick={() => { setSelectedState(null); setSelectedCity(null); setSelectedCategories([]); }}
                    className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-sm",
                        !selectedState ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "hover:bg-white/5 text-slate-500"
                    )}
                >
                    <span className="flex items-center gap-2"><Globe size={16} /> All Leads</span>
                    <span className="text-[10px] font-black bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                        {Object.values(stats).reduce((total, cities) =>
                            total + Object.values(cities).reduce((cityTotal, cats) =>
                            cityTotal + Object.values(cats).reduce((a, b: any) => a + b, 0), 0
                            ), 0
                        )}
                    </span>
                </button>

                {Object.entries(stats).map(([state, cities]) => (
                    <div key={state} className="space-y-1">
                        <button
                            onClick={() => toggleStateExpand(state)}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-sm group",
                                selectedState === state && !selectedCity ? "bg-emerald-500/10 text-emerald-500" : "hover:bg-white/5 text-slate-500"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                {expandedStates.includes(state) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <span onClick={(e) => { e.stopPropagation(); setSelectedState(state); setSelectedCity(null); setSelectedCategories([]); }}>{state}</span>
                            </div>
                            <span className="text-[10px] font-black bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md group-hover:bg-emerald-500/10 transition-colors">
                                {Object.values(cities).reduce((cityTotal, cats) =>
                                    cityTotal + Object.values(cats).reduce((a, b: any) => a + b, 0), 0
                                )}
                            </span>
                        </button>

                        {expandedStates.includes(state) && (
                            <div className="ml-4 pl-2 border-l border-white/10 space-y-1">
                                {Object.entries(cities).map(([city, categories]) => (
                                    <div key={city}>
                                        <button
                                            onClick={() => {
                                                setExpandedCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
                                                setSelectedState(state);
                                                setSelectedCity(city);
                                                setSelectedCategories([]);
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all font-bold text-xs",
                                                selectedState === state && selectedCity === city && selectedCategories.length === 0 ? "bg-indigo-500/10 text-indigo-500" : "hover:bg-white/5 text-slate-500"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                {expandedCities.includes(city) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                {city}
                                            </div>
                                            <span className="text-[10px] opacity-60">
                                                {Object.values(categories).reduce((a, b: any) => a + b, 0)}
                                            </span>
                                        </button>

                                        {expandedCities.includes(city) && (
                                            <div className="ml-4 mt-1 space-y-0.5">
                                                {Object.keys(categories).length > 1 && (
                                                    <button
                                                        onClick={() => {
                                                            const allCats = Object.keys(categories).map(cat => `${state}|${city}|${cat}`);
                                                            const isAllLocalSelected = allCats.every(c => selectedCategories.includes(c));
                                                            if (isAllLocalSelected) {
                                                                setSelectedCategories(prev => prev.filter(c => !allCats.includes(c)));
                                                            } else {
                                                                setSelectedCategories(prev => Array.from(new Set([...prev, ...allCats])));
                                                            }
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-1.5 rounded-md text-slate-400 hover:text-emerald-500 transition-all font-bold text-[10px] uppercase border border-dashed border-white/10 mb-1"
                                                    >
                                                        {Object.keys(categories).every(cat => selectedCategories.includes(`${state}|${city}|${cat}`)) ? <CheckSquare size={12} /> : <Square size={12} />}
                                                        Select All
                                                    </button>
                                                )}
                                                {Object.entries(categories).map(([cat, count]) => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => {
                                                            const key = `${state}|${city}|${cat}`;
                                                            setSelectedState(state);
                                                            setSelectedCity(city);
                                                            setSelectedCategories(prev =>
                                                                prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
                                                            );
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-4 py-1.5 rounded-md transition-all font-bold text-[10px] uppercase",
                                                            selectedCategories.includes(`${state}|${city}|${cat}`) ? "text-emerald-500 bg-emerald-500/5" : "text-slate-400 hover:text-emerald-500"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {selectedCategories.includes(`${state}|${city}|${cat}`) ? <CheckSquare size={12} /> : <Square size={12} />}
                                                            {cat}
                                                        </div>
                                                        <span>{count as number}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-500">
                    <Target size={20} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Autonomous Extraction</span>
                </div>
                <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                    Lead <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500">Prospector</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-lg max-w-2xl">
                    Upload business directories in real-time. Verified intelligence with automated tagging.
                </p>
            </div>
            
            <div className="flex items-center gap-3">
                 <div className="relative">
                    <MapPin size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      className="pl-14 pr-6 py-4 glass-premium rounded-2xl border-white/20 focus:ring-4 focus:ring-emerald-500/20 transition-all font-bold text-sm w-48"
                      placeholder="Zip Code..."
                      value={zipFilter}
                      onChange={(e) => setZipFilter(e.target.value)}
                    />
                </div>
                <button onClick={handleExport} className="p-4 glass-premium rounded-2xl text-emerald-500 hover:bg-emerald-500/10 transition-all">
                    <Download size={20} />
                </button>
            </div>
        </div>

        {/* Scrape Form */}
        <div className="glass-premium rounded-[2.5rem] p-8 border-white/20 dark:border-white/5">
            <form onSubmit={handleScrape} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-1 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Target URL</label>
                    <input
                        className="w-full px-6 py-4 glass-premium rounded-2xl border-white/20 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                        placeholder="https://www.yellowpages.com/..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                </div>
                
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Tag: State</label>
                    <select
                        className="w-full px-6 py-4 glass-premium rounded-2xl border-white/20 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm bg-transparent"
                        value={extractState}
                        onChange={(e) => {
                            setExtractState(e.target.value);
                            setExtractCity('');
                            setIsCustomCity(false);
                        }}
                    >
                        <option value="" disabled>Select State</option>
                        {US_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Tag: City</label>
                    {extractState ? (
                        <select
                            className="w-full px-6 py-4 glass-premium rounded-2xl border-white/20 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm bg-transparent"
                            value={isCustomCity ? 'other' : extractCity}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'other') {
                                    setIsCustomCity(true);
                                    setExtractCity('');
                                } else {
                                    setIsCustomCity(false);
                                    setExtractCity(val);
                                }
                            }}
                        >
                            <option value="" disabled>Select City</option>
                            <option value="General">General (State-Wide)</option>
                            {(US_CITIES[extractState] || []).map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                            <option value="other">Other...</option>
                        </select>
                    ) : (
                        <input
                            className="w-full px-6 py-4 glass-premium rounded-2xl border-white/20 opacity-50 cursor-not-allowed font-bold text-sm"
                            placeholder="State needed"
                            disabled
                        />
                    )}
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Tag: Category</label>
                    <select
                        className="w-full px-6 py-4 glass-premium rounded-2xl border-white/20 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm bg-transparent"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                <div className="flex items-end">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 glow-button text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        {loading ? 'Uploading...' : 'Initialize Extraction'}
                    </button>
                </div>

                {isCustomCity && (
                     <div className="col-span-full space-y-3 mt-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Custom City Designation</label>
                        <input
                            className="w-full px-6 py-4 glass-premium rounded-2xl border-white/20 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                            placeholder="Enter city name manually..."
                            value={extractCity}
                            onChange={(e) => setExtractCity(e.target.value)}
                        />
                    </div>
                )}
            </form>

            {scrapeResult && (
                <div className="mt-8 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between animate-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                            <Check size={20} />
                        </div>
                        <div>
                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Deployment Successful</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Added {scrapeResult.newCount} new prospects • Skipped {scrapeResult.duplicateCount} duplicates</p>
                        </div>
                    </div>
                    <button onClick={() => setScrapeResult(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
            )}
        </div>

        {/* Search & Bulk Actions */}
        <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="relative flex-1 w-full flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        className="w-full pl-16 pr-6 py-5 glass-premium rounded-[2rem] border-white/20 focus:ring-4 focus:ring-indigo-500/20 transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                        placeholder="Scan active leads database..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={selectAll}
                    className="px-6 py-4 glass-premium rounded-[2rem] border-white/20 hover:bg-white/5 transition-all font-black text-slate-500 hover:text-indigo-500 text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-2 whitespace-nowrap"
                >
                    {selectedIds.length === filteredLeads.length && filteredLeads.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                    Select All
                </button>
            </div>
            
            {selectedIds.length > 0 && (
                <div className="flex items-center gap-4 p-2 glass-premium rounded-[2rem] border-indigo-500/30 bg-indigo-500/5 animate-in slide-in-from-right-8 duration-500 w-full lg:w-auto">
                    <span className="px-6 font-black text-indigo-500 uppercase tracking-widest text-xs border-r border-indigo-500/20">{selectedIds.length} Flagged</span>
                    <button onClick={handleBulkUpdate} className="px-6 py-3 bg-indigo-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
                        Apply Bulk Updates
                    </button>
                    <button 
                        onClick={async () => {
                            if (!confirm(`Are you sure you want to delete ${selectedIds.length} leads?`)) return;
                            setBulkLoading(true);
                            try {
                                await Promise.all(selectedIds.map(id => fetch(`/api/leads?id=${id}`, { method: 'DELETE' })));
                                setSelectedIds([]);
                                fetchStats();
                                fetchLeads();
                            } catch (err) {
                                alert('Bulk delete failed');
                            } finally {
                                setBulkLoading(false);
                            }
                        }}
                        className="px-4 py-3 bg-rose-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                    <button onClick={() => setSelectedIds([])} className="p-3 hover:text-rose-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
            )}
        </div>

        {/* Lead Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredLeads.slice(0, 100).map(lead => (
                <div 
                    key={lead.id} 
                    onClick={() => toggleSelect(lead.id)}
                    className={cn(
                        "bento-card group relative p-8 h-full flex flex-col justify-between cursor-pointer",
                        selectedIds.includes(lead.id) && "ring-2 ring-emerald-500 shadow-2xl shadow-emerald-500/10"
                    )}
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 glass-premium rounded-xl flex items-center justify-center font-black text-emerald-500 text-lg">
                            {lead.companyName[0]}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="badge-indigo">{lead.category}</span>
                            <button onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-emerald-500 transition-colors leading-tight">{lead.companyName}</h3>
                        
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                <Phone size={14} className="text-emerald-500" />
                                <span className="font-mono tracking-widest">{lead.phoneNumber || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                <MapPin size={14} className="text-emerald-500" />
                                <span>{lead.city}, {lead.state} {lead.zipCode}</span>
                            </div>
                            {lead.website && (
                                <a 
                                    href={lead.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    onClick={e => e.stopPropagation()}
                                    className="flex items-center gap-3 text-xs font-black text-indigo-500 hover:underline uppercase tracking-widest mt-2"
                                >
                                    <Globe size={14} />
                                    Access Source
                                    <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Captured {new Date(lead.createdAt).toLocaleDateString()}</p>
                        <div className="flex gap-1">
                             {selectedIds.includes(lead.id) ? <CheckSquare size={20} className="text-emerald-500" /> : <Square size={20} className="text-slate-300 opacity-40" />}
                        </div>
                    </div>
                </div>
            ))}

            {filteredLeads.length > 100 && (
                <div className="col-span-full py-10 flex flex-col items-center text-center space-y-4 glass-premium rounded-3xl border-dashed border-2 border-indigo-500/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Limited Intelligence Display</p>
                    <p className="text-slate-500 font-bold text-sm">Viewing first 100 of {filteredLeads.length} leads. Please use the Navigator or Search to refine results.</p>
                </div>
            )}

            {filteredLeads.length === 0 && !loading && (
                <div className="col-span-full py-32 flex flex-col items-center text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center text-slate-300">
                        <Database size={48} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{hasActiveFilters ? "No Intel Found" : "Awaiting Commands"}</h3>
                        <p className="text-slate-500 font-bold mt-2">
                             {hasActiveFilters 
                                ? "The selected coordinates returned zero matches. Refine your filters or initialize a new scrape." 
                                : "Initialize a new scrape to view active leads, or use the Navigator to browse the database."}
                        </p>
                    </div>
                    {(selectedState || selectedCity || selectedCategories.length > 0 || zipFilter) && (
                        <button 
                            onClick={() => { setSelectedState(null); setSelectedCity(null); setSelectedCategories([]); setZipFilter(''); }}
                            className="px-8 py-3 glass-premium text-indigo-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500/10 transition-all border-indigo-500/20"
                        >
                            Reset System Filters
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default function ProspectorPage() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <Suspense fallback={<div className="flex items-center justify-center p-32"><Loader2 className="animate-spin text-emerald-500" /></div>}>
            <ProspectorContent />
        </Suspense>
    </div>
  );
}
