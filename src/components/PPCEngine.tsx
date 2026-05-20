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
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm text-neutral-200">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <h2 className="text-sm font-mono text-neutral-300 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-500" />
          PPC Intelligence Engine
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={handleInit}
            className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-400 px-3 py-1 rounded transition-colors"
          >
            Run DB Migrations
          </button>
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            Sync Network Data
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {status && (
          <div className="p-3 bg-neutral-950 border border-neutral-800 text-xs font-mono text-emerald-300 rounded break-words">
            {'>'} {status}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg">
            <h4 className="text-xs font-mono text-neutral-500 mb-2 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" /> Total Spend
            </h4>
            <p className="text-2xl font-sans font-medium text-white">
              ${metrics?.total_spend?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg">
            <h4 className="text-xs font-mono text-neutral-500 mb-2 flex items-center gap-2">
              <ShoppingCart className="w-3 h-3" /> Total Sales
            </h4>
            <p className="text-2xl font-sans font-medium text-emerald-400">
              ${metrics?.total_sales?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg">
            <h4 className="text-xs font-mono text-neutral-500 mb-2 flex items-center gap-2">
              <AlertCircle className="w-3 h-3" /> Overall ROAS
            </h4>
            <p className="text-2xl font-sans font-medium text-indigo-400">
              {metrics?.overall_roas?.toFixed(2) || '0.00'}x
            </p>
          </div>
        </div>

        {campaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 text-xs font-mono text-neutral-500">
                  <th className="pb-3 font-medium">Campaign</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Spend</th>
                  <th className="pb-3 font-medium text-right">Sales</th>
                  <th className="pb-3 font-medium text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="text-sm font-sans text-neutral-300">
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/10 transition-colors">
                    <td className="py-3">{c.name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                        c.status === 'ENABLED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">${parseFloat(c.spend).toFixed(2)}</td>
                    <td className="py-3 text-right text-emerald-400">${parseFloat(c.sales).toFixed(2)}</td>
                    <td className="py-3 text-right font-mono text-indigo-400">{parseFloat(c.roas).toFixed(2)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500 text-sm font-mono border border-dashed border-neutral-800 rounded bg-neutral-950/50">
            No campaigns synced. Click "Sync Network Data" to pull data.
          </div>
        )}
      </div>
    </div>
  );
}
