import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, TrendingUp, AlertCircle, ShoppingCart, Activity, Plus, MessageSquare, LineChart as LineChartIcon, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line } from 'recharts';

interface Metrics {
  total_spend: number;
  total_sales: number;
  overall_roas: number;
  total_impressions: number;
  total_clicks: number;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  budget: string;
  spend: string;
  sales: string;
  roas: string;
}

export function PPCEngine() {
  const [status, setStatus] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ENABLED' | 'PAUSED'>('ALL');
  
  // Budget editing state
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editBudgetValue, setEditBudgetValue] = useState<string>('');

  // New campaign modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', status: 'ENABLED', budget: '', target_roas: '' });

  const fetchPPCData = async () => {
    try {
      const [metRes, camRes] = await Promise.all([
        fetch('/api/ppc/metrics'),
        fetch('/api/ppc/campaigns')
      ]);
      if (metRes.ok && camRes.ok) {
        const metData = await metRes.json();
        const camData = await camRes.json();
        setMetrics(metData.metrics);
        setCampaigns(camData.campaigns || []);
      }
    } catch (err: any) {
      console.error("Failed to fetch PPC Data:", err);
    }
  };

  useEffect(() => {
    fetchPPCData();
  }, []);

  const handleInit = async () => {
    setStatus('Initializing PPC DB...');
    try {
      const res = await fetch('/api/ppc/init', { method: 'POST' });
      const data = await res.json();
      if (res.ok) setStatus(`Success: ${data.message}`);
      else setStatus(`Error: ${data.error}`);
    } catch (err: any) {
      setStatus(`Failed to initialize: ${err.message}`);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setStatus('Querying Amazon Ads API...');
    try {
      const res = await fetch('/api/ppc/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setStatus(`Success: ${data.message}`);
        await fetchPPCData();
      } else {
        setStatus(`Sync Error: ${data.error}`);
      }
    } catch (err: any) {
      setStatus(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ppc/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampaign.name,
          status: newCampaign.status,
          budget: parseFloat(newCampaign.budget) || 0,
          target_roas: parseFloat(newCampaign.target_roas) || 0
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewCampaign({ name: '', status: 'ENABLED', budget: '', target_roas: '' });
        await fetchPPCData();
        setStatus('Campaign created successfully.');
      } else {
        const data = await res.json();
        setStatus(`Error creating campaign: ${data.error}`);
      }
    } catch (err: any) {
      setStatus(`Failed to create campaign: ${err.message}`);
    }
  };

  const saveBudget = async (id: string) => {
    try {
      const res = await fetch(`/api/ppc/campaigns/${id}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: parseFloat(editBudgetValue) || 0 })
      });
      if (res.ok) {
        await fetchPPCData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditingBudgetId(null);
    }
  };

  const askStrategist = (c: Campaign) => {
    const prompt = `Please provide a budget adjustment recommendation for campaign "${c.name}". Current performance: Spend $${c.spend}, Sales $${c.sales}, ROAS ${c.roas}x. Consider our overall strategy and suggest if we should scale, hold, or pause.`;
    window.dispatchEvent(new CustomEvent('OPEN_CHAT_TAB', { 
      detail: { 
        message: prompt,
        context: `Limit context to campaign: ${c.name}`
      } 
    }));
  };

  const filteredCampaigns = campaigns.filter(c => filterStatus === 'ALL' || c.status === filterStatus);

  return (
    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-xl shadow-sm text-neutral-800 dark:text-neutral-200 h-full flex flex-col transition-all overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] border-b border-black/5 dark:border-white/10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 z-10 relative">
        <div>
          <h2 className="text-[clamp(0.875rem,1.2vw,1rem)] font-mono text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            PPC Intelligence Engine
          </h2>
          <p className="text-[clamp(0.7rem,1vw,0.75rem)] font-sans text-neutral-500 dark:text-neutral-500 mt-1 max-w-xl">
            Ingest and sync live Amazon Ads and Shopify performance data. AEME uses this to identify bleeding campaigns and high-growth opportunities.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none text-[clamp(0.7rem,1vw,0.75rem)] bg-[#007AFF] hover:bg-[#005bb5] text-white px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            New Campaign
          </button>
          <button 
            onClick={handleInit}
            className="flex-1 sm:flex-none text-[clamp(0.7rem,1vw,0.75rem)] bg-black/5 dark:bg-white/10 hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-2 rounded-lg transition-all shadow-sm border border-neutral-300 dark:border-neutral-700 active:scale-95 text-center"
          >
            Run DB Migrations
          </button>
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex-1 sm:flex-none text-[clamp(0.7rem,1vw,0.75rem)] bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Sync Network Data
          </button>
        </div>
      </div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] space-y-[clamp(1rem,1.5vw,1.5rem)] flex-1 overflow-auto custom-scrollbar z-10 relative">
        {status && (
          <div className="p-3 bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 text-[11px] sm:text-xs font-mono text-emerald-300 rounded-lg break-words shadow-inner flex items-start gap-2">
            <span className="text-emerald-500">{'>'}</span>
            <span>{status}</span>
          </div>
        )}

        <div className="grid grid-cols-1 @sm:grid-cols-3 gap-[clamp(0.75rem,2vw,1rem)] container-type-inline-size">
          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 p-4 rounded-xl hover:border-neutral-300 dark:border-neutral-700 transition-colors shadow-sm">
            <h4 className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-neutral-500 dark:text-neutral-500 mb-2 flex items-center gap-2 uppercase tracking-widest">
              <TrendingUp className="w-3.5 h-3.5" /> Total Spend
            </h4>
            <p className="text-[clamp(1.5rem,2.5vw,2rem)] font-sans font-medium text-neutral-900 dark:text-white tracking-tight">
              ${metrics?.total_spend?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 p-4 rounded-xl hover:border-neutral-300 dark:border-neutral-700 transition-colors shadow-sm">
            <h4 className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-neutral-500 dark:text-neutral-500 mb-2 flex items-center gap-2 uppercase tracking-widest">
              <ShoppingCart className="w-3.5 h-3.5" /> Total Sales
            </h4>
            <p className="text-[clamp(1.5rem,2.5vw,2rem)] font-sans font-medium text-emerald-400 tracking-tight">
              ${metrics?.total_sales?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 p-4 rounded-xl hover:border-neutral-300 dark:border-neutral-700 transition-colors shadow-sm">
            <h4 className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-neutral-500 dark:text-neutral-500 mb-2 flex items-center gap-2 uppercase tracking-widest">
              <AlertCircle className="w-3.5 h-3.5" /> Overall ROAS
            </h4>
            <p className="text-[clamp(1.5rem,2.5vw,2rem)] font-sans font-medium text-[#007AFF] tracking-tight">
              {metrics?.overall_roas?.toFixed(2) || '0.00'}x
            </p>
          </div>
        </div>

        {campaigns.length > 0 && (
          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 p-4 rounded-xl shadow-sm h-[300px] w-full mt-4">
             <h4 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-neutral-700 dark:text-neutral-300 uppercase tracking-widest flex items-center gap-2 mb-4">
               <Activity className="w-3.5 h-3.5 text-[#007AFF]" /> Campaign Performance (Spend vs Sales)
             </h4>
             <ResponsiveContainer width="100%" height="80%">
               <AreaChart data={filteredCampaigns} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#a8a29e" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#a8a29e" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} tickFormatter={(val) => val.slice(0,10) + '...'} />
                 <YAxis tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} 
                   itemStyle={{ color: '#fff' }} 
                 />
                 <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                 <Area type="monotone" dataKey="sales" name="Sales ($)" stroke="#34d399" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                 <Area type="monotone" dataKey="spend" name="Spend ($)" stroke="#a8a29e" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        )}

        {campaigns.length > 0 ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setFilterStatus('ALL')} className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors border ${filterStatus === 'ALL' ? 'bg-[#007AFF] text-white border-[#007AFF]' : 'bg-transparent text-neutral-500 border-black/5 dark:border-white/10 hover:bg-black/5'}`}>ALL</button>
              <button onClick={() => setFilterStatus('ENABLED')} className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors border ${filterStatus === 'ENABLED' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-transparent text-neutral-500 border-black/5 dark:border-white/10 hover:bg-black/5'}`}>ENABLED</button>
              <button onClick={() => setFilterStatus('PAUSED')} className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors border ${filterStatus === 'PAUSED' ? 'bg-neutral-500 text-white border-neutral-500' : 'bg-transparent text-neutral-500 border-black/5 dark:border-white/10 hover:bg-black/5'}`}>PAUSED</button>
            </div>
            <div className="bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead className="bg-black/5 dark:bg-white/5 backdrop-blur-md">
                    <tr className="border-b border-black/5 dark:border-white/10 text-[11px] font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
                      <th className="px-4 py-3 font-medium sticky left-0 z-20">Campaign</th>
                      <th className="px-4 py-3 font-medium text-center">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Budget (Click to Edit)</th>
                      <th className="px-4 py-3 font-medium text-right">Spend</th>
                      <th className="px-4 py-3 font-medium text-right">Sales</th>
                      <th className="px-4 py-3 font-medium text-right">ROAS</th>
                      <th className="px-4 py-3 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-sans text-neutral-700 dark:text-neutral-300">
                    {filteredCampaigns.map((c) => (
                      <tr key={c.id} className="border-b border-black/5 dark:border-white/10 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <td className="px-4 py-3 sticky left-0 font-medium max-w-[200px] truncate" title={c.name}>{c.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-mono tracking-wide ${
                            c.status === 'ENABLED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono" onClick={() => { setEditingBudgetId(c.id); setEditBudgetValue(c.budget); }}>
                          {editingBudgetId === c.id ? (
                            <input 
                              type="number" 
                              autoFocus
                              className="w-20 bg-white/50 dark:bg-black/50 border border-[#007AFF] rounded px-2 py-1 text-right text-neutral-900 dark:text-white outline-none"
                              value={editBudgetValue}
                              onChange={e => setEditBudgetValue(e.target.value)}
                              onBlur={() => saveBudget(c.id)}
                              onKeyDown={e => { if (e.key === 'Enter') saveBudget(c.id); }}
                            />
                          ) : (
                            <span className="cursor-pointer hover:text-[#007AFF] underline decoration-dashed underline-offset-4 decoration-black/20 dark:decoration-white/20 transition-colors">${parseFloat(c.budget).toFixed(2)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">${parseFloat(c.spend).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-400">${parseFloat(c.sales).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#007AFF]">{parseFloat(c.roas).toFixed(2)}x</td>
                        <td className="px-4 py-3 text-center">
                           <button onClick={() => askStrategist(c)} className="text-[#007AFF] hover:bg-[#007AFF]/10 p-1.5 rounded-md transition-colors" title="Ask Strategist for Budget Recommendation">
                             <MessageSquare className="w-4 h-4 mx-auto" />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 p-4 rounded-xl shadow-sm h-[300px] w-full mt-4">
              <h4 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-neutral-700 dark:text-neutral-300 uppercase tracking-widest flex items-center gap-2 mb-4">
                <LineChartIcon className="w-3.5 h-3.5 text-purple-500" /> ROAS Trends
              </h4>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={filteredCampaigns} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} tickFormatter={(val) => val.slice(0,10) + '...'} />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} 
                    itemStyle={{ color: '#fff' }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="roas" name="ROAS (x)" stroke="#a855f7" strokeWidth={2} dot={{ r: 4, fill: '#a855f7' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500 dark:text-neutral-500 text-[clamp(0.75rem,1vw,0.875rem)] border-2 border-dashed border-black/5 dark:border-white/10 rounded-xl bg-white/30 dark:bg-black/30 backdrop-blur-3xl/20 flex flex-col items-center justify-center gap-3">
            <ShoppingCart className="w-8 h-8 text-neutral-700" />
            <span className="font-mono">No campaigns synced. Click "Sync Network Data" to pull data.</span>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-sans font-medium text-neutral-900 dark:text-white mb-4 tracking-tight">Create New Campaign</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-1">Campaign Name</label>
                <input required type="text" value={newCampaign.name} onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} className="w-full bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-lg p-2 text-sm text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-[#007AFF] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-1">Status</label>
                <select value={newCampaign.status} onChange={e => setNewCampaign({...newCampaign, status: e.target.value})} className="w-full bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-lg p-2 text-sm text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-[#007AFF] transition-colors">
                  <option value="ENABLED">ENABLED</option>
                  <option value="PAUSED">PAUSED</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-1">Budget ($)</label>
                <input required type="number" step="0.01" value={newCampaign.budget} onChange={e => setNewCampaign({...newCampaign, budget: e.target.value})} className="w-full bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-lg p-2 text-sm text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-[#007AFF] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-1">Target ROAS (x)</label>
                <input required type="number" step="0.01" value={newCampaign.target_roas} onChange={e => setNewCampaign({...newCampaign, target_roas: e.target.value})} className="w-full bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-lg p-2 text-sm text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-[#007AFF] transition-colors" />
              </div>
              <button type="submit" className="w-full bg-[#007AFF] hover:bg-[#005bb5] text-white py-2 rounded-lg text-sm font-mono tracking-wide transition-colors mt-2 shadow-sm">
                Create Campaign
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

