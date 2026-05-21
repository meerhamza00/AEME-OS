import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, TrendingUp, AlertCircle, ShoppingCart } from 'lucide-react';

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
  budget: string; // postgres numeric comes as string sometimes, we parse it
  spend: string;
  sales: string;
  roas: string;
}

export function PPCEngine() {
  const [status, setStatus] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

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

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm text-neutral-200 h-full flex flex-col transition-all overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] border-b border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 relative">
        <div>
          <h2 className="text-[clamp(0.875rem,1.2vw,1rem)] font-mono text-neutral-300 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            PPC Intelligence Engine
          </h2>
          <p className="text-[clamp(0.7rem,1vw,0.75rem)] font-sans text-neutral-500 mt-1 max-w-xl">
            Ingest and sync live Amazon Ads and Shopify performance data. AEME uses this to identify bleeding campaigns and high-growth opportunities.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleInit}
            className="flex-1 sm:flex-none text-[clamp(0.7rem,1vw,0.75rem)] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-2 rounded-lg transition-all shadow-sm border border-neutral-700 active:scale-95 text-center"
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
          <div className="p-3 bg-neutral-950 border border-neutral-800 text-[11px] sm:text-xs font-mono text-emerald-300 rounded-lg break-words shadow-inner flex items-start gap-2">
            <span className="text-emerald-500">{'>'}</span>
            <span>{status}</span>
          </div>
        )}

        <div className="grid grid-cols-1 @sm:grid-cols-3 gap-[clamp(0.75rem,2vw,1rem)] container-type-inline-size">
          <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl hover:border-neutral-700 transition-colors shadow-sm">
            <h4 className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-neutral-500 mb-2 flex items-center gap-2 uppercase tracking-widest">
              <TrendingUp className="w-3.5 h-3.5" /> Total Spend
            </h4>
            <p className="text-[clamp(1.5rem,2.5vw,2rem)] font-sans font-medium text-white tracking-tight">
              ${metrics?.total_spend?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl hover:border-neutral-700 transition-colors shadow-sm">
            <h4 className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-neutral-500 mb-2 flex items-center gap-2 uppercase tracking-widest">
              <ShoppingCart className="w-3.5 h-3.5" /> Total Sales
            </h4>
            <p className="text-[clamp(1.5rem,2.5vw,2rem)] font-sans font-medium text-emerald-400 tracking-tight">
              ${metrics?.total_sales?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl hover:border-neutral-700 transition-colors shadow-sm">
            <h4 className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-neutral-500 mb-2 flex items-center gap-2 uppercase tracking-widest">
              <AlertCircle className="w-3.5 h-3.5" /> Overall ROAS
            </h4>
            <p className="text-[clamp(1.5rem,2.5vw,2rem)] font-sans font-medium text-indigo-400 tracking-tight">
              {metrics?.overall_roas?.toFixed(2) || '0.00'}x
            </p>
          </div>
        </div>

        {campaigns.length > 0 ? (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="bg-neutral-900/50">
                  <tr className="border-b border-neutral-800 text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                    <th className="px-4 py-3 font-medium sticky left-0 bg-neutral-900/95 backdrop-blur-sm z-20 shadow-[1px_0_0_0_rgb(38,38,38)]">Campaign</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Spend</th>
                    <th className="px-4 py-3 font-medium text-right">Sales</th>
                    <th className="px-4 py-3 font-medium text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] font-sans text-neutral-300">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/30 transition-colors group">
                      <td className="px-4 py-3 sticky left-0 bg-neutral-950 group-hover:bg-neutral-900 z-10 shadow-[1px_0_0_0_rgb(38,38,38)] font-medium max-w-[200px] truncate" title={c.name}>{c.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-mono tracking-wide ${
                          c.status === 'ENABLED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">${parseFloat(c.spend).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-400">${parseFloat(c.sales).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-indigo-400">{parseFloat(c.roas).toFixed(2)}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500 text-[clamp(0.75rem,1vw,0.875rem)] border-2 border-dashed border-neutral-800/50 rounded-xl bg-neutral-950/20 flex flex-col items-center justify-center gap-3">
            <ShoppingCart className="w-8 h-8 text-neutral-700" />
            <span className="font-mono">No campaigns synced. Click "Sync Network Data" to pull data.</span>
          </div>
        )}
      </div>
    </div>
  );
}
