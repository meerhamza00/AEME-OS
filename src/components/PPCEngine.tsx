import React, { useState, useEffect } from 'react';
import { Sparkles, BarChart3, RefreshCw, FileJson, Columns, Calendar, Edit3, TrendingUp, TrendingDown, Zap, AlertCircle, ShoppingCart, Activity, Plus, MessageSquare, LineChart as LineChartIcon, X, Trash2, Download, ChevronDown, ChevronRight, BarChart as BarChartIcon, BrainCircuit, CheckSquare, Square, Bell } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line, BarChart, Bar, ScatterChart, Scatter, ZAxis } from 'recharts';

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
  impressions?: string;
  clicks?: string;
  notes?: string;
  display_order?: number;
  auto_optimize?: boolean;
}

export function PPCEngine() {
  const [status, setStatus] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ENABLED' | 'PAUSED'>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Campaign | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showForecast, setShowForecast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roasThreshold, setRoasThreshold] = useState<number>(2.0);
  const [roasCriticalThreshold, setRoasCriticalThreshold] = useState<number>(1.0);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({ bid_strategy: true, budget: true, spend: true, sales: true, roas: true, acos: true, recommended_budget: true, cpc: false, impressions: false, clicks: false, notes: true, actions: true });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [bulkNoteValue, setBulkNoteValue] = useState('');
  const [showBulkNoteInput, setShowBulkNoteInput] = useState(false);
  
  const [showBulkBudgetInput, setShowBulkBudgetInput] = useState(false);
  const [bulkBudgetValue, setBulkBudgetValue] = useState('');
  const [bulkBudgetAction, setBulkBudgetAction] = useState<'increase' | 'decrease' | 'set'>('increase');
  
  // Saved Views
  const [savedViews, setSavedViews] = useState<{name: string, config: any}[]>([{ name: 'Default', config: { visibleColumns: { bid_strategy: true, budget: true, spend: true, sales: true, roas: true, acos: true, recommended_budget: true, cpc: false, impressions: false, clicks: false, notes: true, actions: true }, filterStatus: 'ALL' } }]);
  const [currentView, setCurrentView] = useState('Default');
  const [showSavedViewsMenu, setShowSavedViewsMenu] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  // Bulk Action History
  const [bulkActionHistory, setBulkActionHistory] = useState<{ id: string, type: string, timestamp: Date, description: string, rollbackData: any }[]>([]);
  const [showBulkHistory, setShowBulkHistory] = useState(false);

  // Threshold Alerts History
  const [thresholdAlerts, setThresholdAlerts] = useState<{id: string, date: string, message: string, campaign: string, roas: string, severity?: string}[]>([]);
  
  // Resizable Cols
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  
  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteValue, setEditNoteValue] = useState<string>('');
  
  // Budget editing state
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editBudgetValue, setEditBudgetValue] = useState<string>('');

  // New campaign modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', status: 'ENABLED', budget: '', target_roas: '' });
  
  // Expandable rows state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

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

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete campaign "${name}"?`)) {
      try {
        const res = await fetch(`/api/ppc/campaigns/${id}`, { method: 'DELETE' });
        if (res.ok) {
          await fetchPPCData();
          setStatus(`Successfully deleted campaign "${name}"`);
        } else {
          setStatus(`Failed to delete campaign "${name}"`);
        }
      } catch (err) {
        console.error(err);
        setStatus(`Error deleting campaign`);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['Campaign', 'Status', 'Budget', 'Spend', 'Sales', 'ROAS', 'Impressions', 'Clicks'];
    const csvRows = [
      headers.join(','),
      ...filteredCampaigns.map(c => 
        `"${c.name}",${c.status},${c.budget},${c.spend},${c.sales},${c.roas},${c.impressions || 0},${c.clicks || 0}`
      )
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaigns_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const jsonString = JSON.stringify(filteredCampaigns, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaigns_export.json';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    setStatus(`Updating ${selectedIds.length} campaigns...`);
    // capture rollback state
    const previousState = campaigns.filter(c => selectedIds.includes(c.id)).map(c => ({ id: c.id, status: c.status }));
    try {
      const res = await fetch('/api/ppc/campaigns/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, status: newStatus })
      });
      if (res.ok) {
        setStatus(`Successfully updated ${selectedIds.length} campaigns to ${newStatus}`);
        setBulkActionHistory(prev => [{ id: Math.random().toString(36).substring(7), type: 'STATUS', description: `Changed status to ${newStatus} for ${selectedIds.length} campaigns`, timestamp: new Date(), rollbackData: previousState }, ...prev].slice(0, 20));
        setSelectedIds([]);
        await fetchPPCData();
      } else {
        const err = await res.json();
        setStatus(`Bulk update failed: ${err.error}`);
      }
    } catch (err: any) {
      setStatus(`Bulk update failed: ${err.message}`);
    }
  };

  const handleBulkNoteUpdate = async () => {
    if (selectedIds.length === 0 || !bulkNoteValue.trim()) return;
    setStatus(`Updating notes for ${selectedIds.length} campaigns...`);
    try {
      const res = await fetch('/api/ppc/campaigns/notes/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, notes: bulkNoteValue })
      });
      if (res.ok) {
        setStatus(`Successfully updated notes for ${selectedIds.length} campaigns`);
        setSelectedIds([]);
        setBulkNoteValue('');
        setShowBulkNoteInput(false);
        await fetchPPCData();
      } else {
        const err = await res.json();
        setStatus(`Bulk update failed: ${err.error}`);
      }
    } catch (err: any) {
      setStatus(`Bulk update failed: ${err.message}`);
    }
  };

  const handleBulkBudgetUpdate = async () => {
    if (selectedIds.length === 0 || !bulkBudgetValue) return;
    setStatus(`Updating budgets for ${selectedIds.length} campaigns...`);
    // capture rollback state
    const previousState = campaigns.filter(c => selectedIds.includes(c.id)).map(c => ({ id: c.id, budget: c.budget }));
    try {
      const res = await fetch('/api/ppc/campaigns/budget/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action: bulkBudgetAction, value: bulkBudgetValue })
      });
      if (res.ok) {
        setStatus(`Successfully updated budgets for ${selectedIds.length} campaigns`);
        setBulkActionHistory(prev => [{ id: Math.random().toString(36).substring(7), type: 'BUDGET', description: `Bulk budget update (${bulkBudgetAction}) for ${selectedIds.length} campaigns`, timestamp: new Date(), rollbackData: previousState }, ...prev].slice(0, 20));
        setSelectedIds([]);
        setBulkBudgetValue('');
        setShowBulkBudgetInput(false);
        await fetchPPCData();
      } else {
        const err = await res.json();
        setStatus(`Bulk budget update failed: ${err.error}`);
      }
    } catch (err: any) {
      setStatus(`Bulk budget update failed: ${err.message}`);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    fetchPPCData();
  }, []);

  useEffect(() => {
    // Generate threshold alerts history automatically if they fall below the ROAS threshold
    const generatedAlerts: {id: string, date: string, message: string, campaign: string, roas: string, severity?: string}[] = [];
    campaigns.forEach(c => {
      const roasVal = parseFloat(c.roas);
      if (roasVal < roasCriticalThreshold) {
        generatedAlerts.push({
          id: c.id + currentView + 'crit',
          date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          campaign: c.name,
          message: `CRITICAL: ROAS at ${roasVal.toFixed(2)}x (below ${roasCriticalThreshold}x)`,
          roas: c.roas,
          severity: 'critical'
        });
      } else if (roasVal < roasThreshold) {
        generatedAlerts.push({
          id: c.id + currentView + 'warn',
          date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          campaign: c.name,
          message: `WARNING: ROAS at ${roasVal.toFixed(2)}x (below ${roasThreshold}x)`,
          roas: c.roas,
          severity: 'warning'
        });
      }
    });
    setThresholdAlerts(generatedAlerts);
  }, [campaigns, roasThreshold, roasCriticalThreshold, currentView]);

  const applySavedView = (view: {name: string, config: any}) => {
    setCurrentView(view.name);
    setVisibleColumns(view.config.visibleColumns);
    setFilterStatus(view.config.filterStatus);
    setShowSavedViewsMenu(false);
  };
  
  const saveNewView = () => {
    if (!newViewName) return;
    const newView = {
      name: newViewName,
      config: { visibleColumns, filterStatus }
    };
    setSavedViews(prev => [...prev, newView]);
    setCurrentView(newViewName);
    setNewViewName('');
  };

  const handleResizeStart = (e: React.MouseEvent, colKey: string) => {
    e.stopPropagation();
    setResizingCol(colKey);
    setStartX(e.clientX);
    const thElement = (e.target as HTMLElement).closest('th');
    if (thElement) {
       setStartWidth(thElement.getBoundingClientRect().width);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingCol) return;
      const diff = e.clientX - startX;
      setColWidths(prev => ({
        ...prev,
        [resizingCol]: Math.max(50, startWidth + diff) // Min width 50px
      }));
    };

    const handleMouseUp = () => {
      setResizingCol(null);
    };

    if (resizingCol) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [resizingCol, startX, startWidth]);

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

  const saveNote = async (id: string) => {
    try {
      const res = await fetch(`/api/ppc/campaigns/${id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editNoteValue })
      });
      if (res.ok) {
        await fetchPPCData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditingNoteId(null);
    }
  };

  const undoBulkAction = async (historyItem: any) => {
    try {
      setStatus('Rolling back bulk action...');
      const res = await fetch('/api/ppc/campaigns/bulk/rollback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: historyItem.type, data: historyItem.rollbackData })
      });
      if (res.ok) {
        setStatus(`Successfully rolled back action: ${historyItem.description}`);
        setBulkActionHistory(prev => prev.filter(h => h.id !== historyItem.id));
        await fetchPPCData();
      } else {
        const err = await res.json();
        setStatus(`Rollback failed: ${err.error}`);
      }
    } catch (err: any) {
      setStatus(`Rollback error: ${err.message}`);
    }
  };

  const toggleAutoOptimize = async (id: string, current: boolean) => {
    try {
      // Optimistic upate
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, auto_optimize: !current } : c));
      await fetch(`/api/ppc/campaigns/${id}/auto_optimize`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_optimize: !current })
      });
      if (!current) {
        setStatus(`Auto-optimize enabled for campaign. AI will now suggest daily budget adjustments.`);
      }
    } catch (err) {
      console.error(err);
      await fetchPPCData();
    }
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    
    const newCampaigns = [...campaigns];
    const draggedIndex = newCampaigns.findIndex(c => c.id === draggedId);
    const targetIndex = newCampaigns.findIndex(c => c.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const [draggedItem] = newCampaigns.splice(draggedIndex, 1);
    newCampaigns.splice(targetIndex, 0, draggedItem);
    
    // Update local state temporarily
    setCampaigns(newCampaigns);
    setDraggedId(null);
    
    // Compute new display orders
    const updates = newCampaigns.map((c, i) => ({ id: c.id, display_order: i }));
    try {
      await fetch('/api/ppc/campaigns/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // necessary to allow dropping
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

  const handleSort = (key: keyof Campaign) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  let filteredCampaigns = campaigns.filter(c => filterStatus === 'ALL' || c.status === filterStatus);
  
  if (searchQuery) {
    filteredCampaigns = filteredCampaigns.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  if (sortConfig.key) {
    filteredCampaigns.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof Campaign] || '';
      const bVal = b[sortConfig.key as keyof Campaign] || '';
      if (sortConfig.key === 'name' || sortConfig.key === 'status') {
        return sortConfig.direction === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      } else {
        return sortConfig.direction === 'asc' ? parseFloat(String(aVal)) - parseFloat(String(bVal)) : parseFloat(String(bVal)) - parseFloat(String(aVal));
      }
    });
  } else {
    filteredCampaigns.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  const chartData = filteredCampaigns.map(c => ({
    ...c,
    spend: showForecast ? (parseFloat(c.spend) * (1 + (Math.random() * 0.4 - 0.1))).toString() : c.spend,
    sales: showForecast ? (parseFloat(c.sales) * (1 + (Math.random() * 0.5 - 0.1))).toString() : c.sales,
  }));
  
  const forecastTrajectory = React.useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const day = new Date();
      day.setDate(day.getDate() + i);
      let totalSpend = 0;
      let totalBudget = 0;
      let totalSales = 0;
      filteredCampaigns.forEach(c => {
         const trend = 1 + (i * 0.01) + (Math.sin(i) * 0.05);
         totalSpend += (parseFloat(c.spend) / 7) * trend;
         totalBudget += parseFloat(c.budget);
         totalSales += (parseFloat(c.sales) / 7) * trend * (1 + (Math.random() * 0.1 - 0.05));
      });
      return {
        date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        spend: parseFloat(totalSpend.toFixed(2)),
        budget: parseFloat(totalBudget.toFixed(2)),
        sales: parseFloat(totalSales.toFixed(2))
      };
    });
  }, [filteredCampaigns]);

  // Generate generic correlation data for the heatmap
  const correlationData = filteredCampaigns.map((c1, i) => {
    return filteredCampaigns.map((c2, j) => {
      // Fake correlation value: 1.0 for same, random for others based on index difference
      const distance = Math.abs(i - j);
      const corr = i === j ? 1 : Math.max(-1, 1 - (distance * 0.3) + (Math.random() * 0.4 - 0.2));
      return { x: i, y: j, z: corr, c1: c1.name, c2: c2.name };
    });
  }).flat();

  const criticalCount = campaigns.filter(c => parseFloat(c.spend) > 500 && parseFloat(c.sales) === 0).length;

  return (
    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-xl shadow-sm text-neutral-800 dark:text-neutral-200 h-full flex flex-col transition-all overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] border-b border-black/5 dark:border-white/10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 z-10 relative">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[clamp(0.875rem,1.2vw,1rem)] font-mono text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              PPC Intelligence Engine
            </h2>
            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-mono animate-in zoom-in spin-in-1 cursor-help" title="Campaigns with >$500 spend and 0 sales">
                <Bell className="w-3 h-3 animate-bounce" />
                <span>{criticalCount} Critical</span>
              </div>
            )}
          </div>
          <p className="text-[clamp(0.7rem,1vw,0.75rem)] font-sans text-neutral-500 dark:text-neutral-500 mt-1 max-w-xl">
            Ingest and sync live Amazon Ads and Shopify performance data. AEME uses this to identify bleeding campaigns and high-growth opportunities.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 w-full xl:w-auto">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
              {syncing ? 'Syncing...' : 'Sync Network Data'}
            </button>
          </div>
          {status && (
            <div className="w-full text-right text-[10px] sm:text-xs font-mono text-emerald-500 dark:text-emerald-400">
              {status}
            </div>
          )}
        </div>
      </div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] space-y-[clamp(1rem,1.5vw,1.5rem)] flex-1 overflow-auto custom-scrollbar z-10 relative">
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
             <div className="flex justify-between items-center mb-4">
               <h4 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-neutral-700 dark:text-neutral-300 uppercase tracking-widest flex items-center gap-2">
                 <Activity className="w-3.5 h-3.5 text-[#007AFF]" /> Campaign Performance (Spend vs Sales)
               </h4>
               <button 
                 onClick={() => setShowForecast(!showForecast)} 
                 className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors border flex items-center gap-1.5 ${showForecast ? 'bg-indigo-500 text-white border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-transparent text-neutral-500 border-black/5 dark:border-white/10 hover:bg-black/5'}`}>
                 <BrainCircuit className="w-3.5 h-3.5" />
                 {showForecast ? 'AI Forecast Active' : 'Enable AI Forecast'}
               </button>
             </div>
             <ResponsiveContainer width="100%" height="80%">
               <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
            
            {(bulkActionHistory.length > 0 || showBulkHistory) && (
              <div className="bg-[#007AFF]/5 border border-[#007AFF]/20 rounded-xl p-3 flex flex-col gap-2 shadow-sm">
                 <div className="flex justify-between items-center">
                   <h4 className="text-[11px] font-mono text-[#007AFF] uppercase tracking-widest flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Bulk Action History</h4>
                 </div>
                 {bulkActionHistory.length === 0 ? (
                   <div className="text-xs text-neutral-500 font-mono italic">No recent bulk actions.</div>
                 ) : (
                   <div className="max-h-32 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-2">
                     {bulkActionHistory.map((action, i) => (
                       <div key={action.id} className="flex items-center gap-3 text-xs bg-white/50 dark:bg-black/20 p-2 rounded border border-[#007AFF]/10">
                          <span className="text-neutral-500 font-mono w-16 shrink-0">{action.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate flex-1">{action.description}</span>
                          <button onClick={() => undoBulkAction(action)} className="px-2 py-1 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded font-mono text-[10px] hover:text-rose-500 hover:border-rose-500 transition-colors">Undo</button>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            )}

            {thresholdAlerts.length > 0 && (
              <div className="bg-neutral-500/5 border border-neutral-500/20 rounded-xl p-3 flex flex-col gap-2 shadow-sm">
                 <h4 className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Threshold Alerts History</h4>
                 <div className="max-h-24 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-2">
                   {thresholdAlerts.map((alert, i) => (
                     <div key={i} className={`flex items-center gap-3 text-xs bg-white/50 dark:bg-black/20 p-2 rounded border ${alert.severity === 'critical' ? 'border-rose-500/30 border-l-2 border-l-rose-500' : 'border-amber-500/30 border-l-2 border-l-amber-500'}`}>
                        <span className="text-neutral-500 font-mono w-16 shrink-0">{alert.date}</span>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate w-32 shrink-0">{alert.campaign}</span>
                        <span className={`${alert.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'} font-mono shrink-0`}>{alert.message}</span>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            <div className="flex justify-between items-center bg-white/30 dark:bg-black/30 p-2 rounded-xl border border-black/5 dark:border-white/10 shadow-sm flex-wrap gap-3">
              <div className="flex items-center gap-2 relative">
                 <button onClick={() => setShowSavedViewsMenu(!showSavedViewsMenu)} className="px-3 py-1 text-xs font-mono rounded-lg transition-colors border bg-white/80 dark:bg-[#252525] text-neutral-700 dark:text-neutral-300 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1.5">
                    Saved View: {currentView} <ChevronDown className="w-3.5 h-3.5" />
                 </button>
                 {showSavedViewsMenu && (
                   <div className="absolute top-10 left-0 w-64 bg-white dark:bg-[#252525] border border-black/10 dark:border-white/10 rounded-lg shadow-xl z-50 p-2 flex flex-col gap-1">
                      <div className="text-[10px] font-mono text-neutral-500 mb-1 tracking-wider uppercase px-2">Load View</div>
                      {savedViews.map((v, i) => (
                        <button key={i} onClick={() => applySavedView(v)} className={`text-left px-2 py-1.5 text-xs font-mono rounded-md hover:bg-black/5 dark:hover:bg-white/5 ${currentView === v.name ? 'text-[#007AFF] bg-[#007AFF]/10' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {v.name}
                        </button>
                      ))}
                      <div className="border-t border-black/10 dark:border-white/10 mt-2 pt-2 flex items-center gap-2">
                        <input type="text" placeholder="New view name..." value={newViewName} onChange={e => setNewViewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveNewView()} className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded px-2 py-1 text-xs outline-none focus:border-[#007AFF]" />
                        <button onClick={saveNewView} className="px-2 py-1 bg-[#007AFF] text-white rounded text-xs">Save</button>
                      </div>
                   </div>
                 )}
              </div>
            </div>

            <div className="flex justify-between items-center sm:flex-row flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Search campaigns..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full sm:w-48 bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-lg px-3 py-1 text-xs font-mono text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-[#007AFF] transition-colors"
                  />
                  <button onClick={() => setFilterStatus('ALL')} className={`flex-1 sm:flex-none px-3 py-1 text-xs font-mono rounded-lg transition-colors border ${filterStatus === 'ALL' ? 'bg-[#007AFF] text-white border-[#007AFF]' : 'bg-transparent text-neutral-500 border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'}`}>ALL</button>
                  <button onClick={() => setFilterStatus('ENABLED')} className={`flex-1 sm:flex-none px-3 py-1 text-xs font-mono rounded-lg transition-colors border ${filterStatus === 'ENABLED' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-transparent text-neutral-500 border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'}`}>ENABLED</button>
                  <button onClick={() => setFilterStatus('PAUSED')} className={`flex-1 sm:flex-none px-3 py-1 text-xs font-mono rounded-lg transition-colors border ${filterStatus === 'PAUSED' ? 'bg-neutral-500 text-white border-neutral-500' : 'bg-transparent text-neutral-500 border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'}`}>PAUSED</button>
                </div>
                
                {selectedIds.length > 0 && (
                  <div className="flex gap-2 items-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-[10px] uppercase font-mono text-neutral-400 px-2">{selectedIds.length} Selected</div>
                    {!showBulkNoteInput && !showBulkBudgetInput ? (
                        <>
                          <button onClick={() => handleBulkStatusUpdate('ENABLED')} className="px-3 py-1 text-xs font-mono rounded-lg transition-colors bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20">Enable Selected</button>
                          <button onClick={() => handleBulkStatusUpdate('PAUSED')} className="px-3 py-1 text-xs font-mono rounded-lg transition-colors bg-neutral-500/10 text-neutral-500 hover:bg-neutral-500/20 border border-neutral-500/20">Pause Selected</button>
                          <button onClick={() => setShowBulkNoteInput(true)} className="px-3 py-1 text-xs font-mono rounded-lg transition-colors bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center gap-1"><Edit3 className="w-3.5 h-3.5" /> Note</button>
                          <button onClick={() => setShowBulkBudgetInput(true)} className="px-3 py-1 text-xs font-mono rounded-lg transition-colors bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20 border border-[#007AFF]/20 flex items-center gap-1">Budget</button>
                        </>
                    ) : showBulkNoteInput ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            autoFocus
                            placeholder="Type note for selected..."
                            value={bulkNoteValue}
                            onChange={e => setBulkNoteValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleBulkNoteUpdate(); else if (e.key === 'Escape') setShowBulkNoteInput(false); }}
                            className="bg-white/50 dark:bg-black/50 border border-indigo-500 rounded px-2 py-1 text-xs text-neutral-900 dark:text-white outline-none w-48"
                          />
                          <button onClick={handleBulkNoteUpdate} className="px-2 py-1 text-xs font-mono rounded bg-indigo-500 text-white">Save</button>
                          <button onClick={() => setShowBulkNoteInput(false)} className="px-2 py-1 text-xs font-mono rounded bg-neutral-500 text-white">Cancel</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                          <select 
                            value={bulkBudgetAction} 
                            onChange={e => setBulkBudgetAction(e.target.value as any)} 
                            className="bg-white/50 dark:bg-black/50 border border-[#007AFF] rounded px-2 py-1 text-xs text-neutral-900 dark:text-white outline-none"
                          >
                            <option value="increase">Increase by %</option>
                            <option value="decrease">Decrease by %</option>
                            <option value="set">Set to $</option>
                          </select>
                          <input 
                            type="number" 
                            autoFocus
                            placeholder="Value..."
                            value={bulkBudgetValue}
                            onChange={e => setBulkBudgetValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleBulkBudgetUpdate(); else if (e.key === 'Escape') setShowBulkBudgetInput(false); }}
                            className="bg-white/50 dark:bg-black/50 border border-[#007AFF] rounded px-2 py-1 text-xs text-neutral-900 dark:text-white outline-none w-24"
                          />
                          <button onClick={handleBulkBudgetUpdate} className="px-2 py-1 text-xs font-mono rounded bg-[#007AFF] text-white">Apply</button>
                          <button onClick={() => setShowBulkBudgetInput(false)} className="px-2 py-1 text-xs font-mono rounded bg-neutral-500 text-white">Cancel</button>
                        </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent text-[10px] font-mono text-neutral-800 dark:text-neutral-200 outline-none w-[100px]" />
                  <span className="text-[10px] text-neutral-500">-</span>
                  <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent text-[10px] font-mono text-neutral-800 dark:text-neutral-200 outline-none w-[100px]" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-xs font-mono text-neutral-500">Alert ROAS &lt;</span>
                  <input
                    type="number"
                    step="0.1"
                    className="w-12 bg-transparent text-xs font-mono text-neutral-800 dark:text-neutral-200 outline-none text-right"
                    value={roasThreshold}
                    onChange={e => setRoasThreshold(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="relative">
                  <button onClick={() => alert('Rule Engine builder is available in the Pro version.')} className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-mono rounded-lg transition-colors border bg-white/50 dark:bg-black/20 text-neutral-700 dark:text-neutral-300 border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Automations
                  </button>
                </div>
                <div className="relative">
                  <button onClick={() => setShowColumnDropdown(!showColumnDropdown)} className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-mono rounded-lg transition-colors border bg-white/50 dark:bg-black/20 text-neutral-700 dark:text-neutral-300 border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
                    <Columns className="w-3.5 h-3.5" /> Columns
                  </button>
                  {showColumnDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#252525] border border-black/5 dark:border-white/10 rounded-lg shadow-xl z-50 p-2 flex flex-col gap-1">
                      {Object.keys(visibleColumns).map(key => (
                        <label key={key} className="flex items-center gap-2 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer">
                          <input type="checkbox" checked={visibleColumns[key as keyof typeof visibleColumns]} onChange={e => setVisibleColumns(prev => ({...prev, [key]: e.target.checked}))} className="rounded" />
                          <span className="text-xs font-mono capitalize text-neutral-700 dark:text-neutral-300">{key}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={handleExportCSV} className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-mono rounded-lg transition-colors border bg-white/50 dark:bg-black/20 text-neutral-700 dark:text-neutral-300 border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
                <button onClick={handleExportJSON} className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-mono rounded-lg transition-colors border bg-white/50 dark:bg-black/20 text-neutral-700 dark:text-neutral-300 border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
                  <FileJson className="w-3.5 h-3.5" /> Export JSON
                </button>
              </div>
            </div>
            
            <div className="bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-black/5 dark:bg-white/5 backdrop-blur-md">
                    <tr className="border-b border-black/5 dark:border-white/10 text-[11px] font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
                      <th className="px-4 py-3 font-medium sticky left-0 z-20 w-10 bg-[#f8fafc] dark:bg-[#1e1e1e]">
                         <div 
                           className="cursor-pointer text-neutral-400 hover:text-[#007AFF]"
                           onClick={() => setSelectedIds(selectedIds.length === filteredCampaigns.length ? [] : filteredCampaigns.map(c => c.id))}
                         >
                           {selectedIds.length === filteredCampaigns.length && filteredCampaigns.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                         </div>
                      </th>
                      <th className="px-4 py-3 font-medium w-10 sticky left-[52px] z-20 bg-[#f8fafc] dark:bg-[#1e1e1e]"></th>
                      <th className="px-4 py-3 font-medium cursor-pointer group select-none sticky left-[92px] z-20 bg-[#f8fafc] dark:bg-[#1e1e1e] shadow-[4px_0_12px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.5)]" onClick={() => handleSort('name')}>
                        Campaign <span className="opacity-0 group-hover:opacity-100">{sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                      </th>
                      <th className="px-4 py-3 font-medium text-center">Status</th>
                      {visibleColumns.bid_strategy && <th style={{ width: colWidths['bid_strategy'] || 'auto' }} className="px-4 py-3 font-medium text-center relative group/th">
                        Bid Strategy
                        <div onMouseDown={(e) => handleResizeStart(e, 'bid_strategy')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#007AFF] opacity-0 group-hover/th:opacity-100 z-10" />
                      </th>}
                      {visibleColumns.budget && <th style={{ width: colWidths['budget'] || 'auto' }} className="px-4 py-3 font-medium text-right relative group/th">
                        Budget
                        <div onMouseDown={(e) => handleResizeStart(e, 'budget')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#007AFF] opacity-0 group-hover/th:opacity-100 z-10" />
                      </th>}
                      {visibleColumns.recommended_budget && <th style={{ width: colWidths['recommended_budget'] || 'auto' }} className="px-4 py-3 font-medium text-right relative group/th">
                        Rec. Budget
                        <div onMouseDown={(e) => handleResizeStart(e, 'recommended_budget')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#007AFF] opacity-0 group-hover/th:opacity-100 z-10" />
                      </th>}
                      {visibleColumns.spend && <th style={{ width: colWidths['spend'] || 'auto' }} className="px-4 py-3 font-medium text-right cursor-pointer group select-none relative group/th" onClick={() => handleSort('spend')}>
                        Spend <span className="opacity-0 group-hover:opacity-100">{sortConfig.key === 'spend' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                        <div onMouseDown={(e) => handleResizeStart(e, 'spend')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#007AFF] opacity-0 group-hover/th:opacity-100 z-10" onClick={e => e.stopPropagation()} />
                      </th>}
                      {visibleColumns.sales && <th style={{ width: colWidths['sales'] || 'auto' }} className="px-4 py-3 font-medium text-right cursor-pointer group select-none relative group/th" onClick={() => handleSort('sales')}>
                        Sales <span className="opacity-0 group-hover:opacity-100">{sortConfig.key === 'sales' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                        <div onMouseDown={(e) => handleResizeStart(e, 'sales')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#007AFF] opacity-0 group-hover/th:opacity-100 z-10" onClick={e => e.stopPropagation()} />
                      </th>}
                      {visibleColumns.roas && <th style={{ width: colWidths['roas'] || 'auto' }} className="px-4 py-3 font-medium text-right cursor-pointer group select-none relative group/th" onClick={() => handleSort('roas')}>
                        ROAS <span className="opacity-0 group-hover:opacity-100">{sortConfig.key === 'roas' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                        <div onMouseDown={(e) => handleResizeStart(e, 'roas')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#007AFF] opacity-0 group-hover/th:opacity-100 z-10" onClick={e => e.stopPropagation()} />
                      </th>}
                      {visibleColumns.acos && <th style={{ width: colWidths['acos'] || 'auto' }} className="px-4 py-3 font-medium text-right relative group/th">
                        ACoS
                        <div onMouseDown={(e) => handleResizeStart(e, 'acos')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#007AFF] opacity-0 group-hover/th:opacity-100 z-10" onClick={e => e.stopPropagation()} />
                      </th>}
                      {visibleColumns.cpc && <th style={{ width: colWidths['cpc'] || 'auto' }} className="px-4 py-3 font-medium text-right relative group/th">
                        CPC
                        <div onMouseDown={(e) => handleResizeStart(e, 'cpc')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#007AFF] opacity-0 group-hover/th:opacity-100 z-10" onClick={e => e.stopPropagation()} />
                      </th>}
                      {visibleColumns.impressions && <th style={{ width: colWidths['impressions'] || 'auto' }} className="px-4 py-3 font-medium text-right relative group/th">
                        Impressions
                        <div onMouseDown={(e) => handleResizeStart(e, 'impressions')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#007AFF] opacity-0 group-hover/th:opacity-100 z-10" />
                      </th>}
                      {visibleColumns.clicks && <th style={{ width: colWidths['clicks'] || 'auto' }} className="px-4 py-3 font-medium text-right relative group/th">
                        Clicks
                        <div onMouseDown={(e) => handleResizeStart(e, 'clicks')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#007AFF] opacity-0 group-hover/th:opacity-100 z-10" />
                      </th>}
                      {visibleColumns.notes && <th style={{ width: colWidths['notes'] || 'auto' }} className="px-4 py-3 font-medium relative group/th">
                        Notes
                        <div onMouseDown={(e) => handleResizeStart(e, 'notes')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#007AFF] opacity-0 group-hover/th:opacity-100 z-10" />
                      </th>}
                      {visibleColumns.actions && <th style={{ width: colWidths['actions'] || 'auto' }} className="px-4 py-3 font-medium text-center relative group/th">
                        Actions
                      </th>}
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-sans text-neutral-700 dark:text-neutral-300">
                    {filteredCampaigns.map((c) => (
                      <React.Fragment key={c.id}>
                        <tr 
                          draggable={true} 
                          onDragStart={() => setDraggedId(c.id)}
                          onDragOver={onDragOver}
                          onDrop={(e) => handleDrop(e, c.id)}
                          className={`border-b border-black/5 dark:border-white/10 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer ${draggedId === c.id ? 'opacity-50' : ''}`} 
                          onClick={() => toggleRow(c.id)}
                        >
                          <td className="px-4 py-3 sticky left-0 z-10 w-10 bg-[#f8fafc] dark:bg-[#1e1e1e]" onClick={e => e.stopPropagation()}>
                             <div 
                               className="cursor-pointer text-neutral-400 hover:text-[#007AFF]"
                               onClick={() => setSelectedIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                             >
                               {selectedIds.includes(c.id) ? <CheckSquare className="w-4 h-4 text-[#007AFF]" /> : <Square className="w-4 h-4" />}
                             </div>
                          </td>
                          <td className="px-4 py-3 sticky left-[52px] z-10 font-medium w-10 text-neutral-400 bg-[#f8fafc] dark:bg-[#1e1e1e]">
                            {expandedRows[c.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </td>
                          <td className="px-4 py-3 font-medium max-w-[200px] truncate sticky left-[92px] z-10 bg-[#f8fafc] dark:bg-[#1e1e1e] shadow-[4px_0_12px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.5)]" title={c.name}>{c.name}</td>
                          <td className="px-4 py-3 text-center">
                            <span 
                              title={c.status === 'ENABLED' ? 'Campaign is active and spending budget' : 'Campaign is paused and not spending'}
                              className={`px-2 py-1 flex-1 sm:flex-none sm:px-2 rounded-md text-[10px] font-mono tracking-wide cursor-help ${
                              c.status === 'ENABLED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          {visibleColumns.bid_strategy && (
                            <td className="px-4 py-3 text-center">
                              {(() => {
                                const roas = parseFloat(c.roas);
                                const util = parseFloat(c.spend) / (parseFloat(c.budget) || 1);
                                let label = 'Conservative';
                                let color = 'text-[#007AFF] bg-[#007AFF]/10 border border-[#007AFF]/20';
                                if (roas < roasCriticalThreshold) {
                                  label = 'Aggressive (Bleeding)';
                                  color = 'text-rose-500 bg-rose-500/10 border border-rose-500/20';
                                } else if (util > 0.8 && roas >= roasThreshold) {
                                  label = 'Aggressive (Scaling)';
                                  color = 'text-purple-500 bg-purple-500/10 border border-purple-500/20';
                                } else if (util < 0.3) {
                                  label = 'Stagnant';
                                  color = 'text-neutral-500 bg-neutral-500/10 border border-neutral-500/20';
                                }
                                return (
                                  <span className={`px-2 py-1 flex-1 sm:flex-none sm:px-2 rounded-md text-[9px] font-mono tracking-wide ${color}`}>
                                    {label}
                                  </span>
                                );
                              })()}
                            </td>
                          )}
                          {visibleColumns.budget && <td className="px-4 py-3 text-right font-mono" onClick={(e) => { e.stopPropagation(); setEditingBudgetId(c.id); setEditBudgetValue(c.budget); }}>
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
                              <div className="flex flex-col items-end gap-1">
                                <span className="cursor-pointer hover:text-[#007AFF] underline decoration-dashed underline-offset-4 decoration-black/20 dark:decoration-white/20 transition-colors">${parseFloat(c.budget).toFixed(2)}</span>
                                <div className="w-16 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden" title={`Budget utilization: ${Math.round((parseFloat(c.spend) / (parseFloat(c.budget) || 1)) * 100)}%`}>
                                  <div className={`h-full ${Math.round((parseFloat(c.spend) / (parseFloat(c.budget) || 1)) * 100) > 90 ? 'bg-rose-500' : 'bg-[#007AFF]'}`} style={{ width: `${Math.min(100, Math.round((parseFloat(c.spend) / (parseFloat(c.budget) || 1)) * 100))}%` }} />
                                </div>
                              </div>
                            )}
                          </td>}
                          {visibleColumns.recommended_budget && <td className="px-4 py-3 text-right font-mono">
                             <div className="flex items-center justify-end gap-1 text-xs">
                               <Sparkles className="w-3 h-3 text-purple-500" /> 
                               ${(parseFloat(c.budget) * (parseFloat(c.roas) > 3 ? 1.2 : parseFloat(c.roas) < roasThreshold ? 0.8 : 1.0)).toFixed(2)}
                             </div>
                          </td>}
                          {visibleColumns.spend && <td className="px-4 py-3 text-right font-mono">${parseFloat(c.spend).toFixed(2)}</td>}
                          {visibleColumns.sales && <td className="px-4 py-3 text-right font-mono text-emerald-400">${parseFloat(c.sales).toFixed(2)}</td>}
                          {visibleColumns.roas && <td className={`px-4 py-3 text-right font-mono transition-colors ${parseFloat(c.roas) < roasThreshold ? 'text-rose-500 font-bold bg-rose-500/10' : 'text-[#007AFF]'}`}>
                            <div className="flex items-center justify-end gap-1">
                               {c.id.charCodeAt(c.id.length - 1) % 2 === 0 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
                               {parseFloat(c.roas).toFixed(2)}x
                            </div>
                          </td>}
                          {visibleColumns.acos && <td className="px-4 py-3 text-right font-mono">
                             {(parseFloat(c.sales) > 0 ? (parseFloat(c.spend) / parseFloat(c.sales)) * 100 : 0).toFixed(1)}%
                          </td>}
                          {visibleColumns.cpc && <td className="px-4 py-3 text-right font-mono">
                             ${(parseInt(c.clicks || '0') > 0 ? parseFloat(c.spend) / parseInt(c.clicks || '0') : 0).toFixed(2)}
                          </td>}
                          {visibleColumns.impressions && <td className="px-4 py-3 text-right font-mono">{c.impressions?.toLocaleString() || 0}</td>}
                          {visibleColumns.clicks && <td className="px-4 py-3 text-right font-mono">{c.clicks?.toLocaleString() || 0}</td>}
                          {visibleColumns.notes && <td className="px-4 py-3 max-w-[150px]" onClick={(e) => { e.stopPropagation(); setEditingNoteId(c.id); setEditNoteValue(c.notes || ''); }}>
                            {editingNoteId === c.id ? (
                              <input 
                                type="text" 
                                autoFocus
                                className="w-full bg-white/50 dark:bg-black/50 border border-[#007AFF] rounded px-2 py-1 text-xs text-neutral-900 dark:text-white outline-none"
                                value={editNoteValue}
                                onChange={e => setEditNoteValue(e.target.value)}
                                onBlur={() => saveNote(c.id)}
                                onKeyDown={e => { if (e.key === 'Enter') saveNote(c.id); }}
                              />
                            ) : (
                              <span className="cursor-pointer text-xs text-neutral-500 dark:text-neutral-400 truncate block hover:text-[#007AFF] transition-colors">{c.notes || 'Add note...'}</span>
                            )}
                          </td>}
                          {visibleColumns.actions && <td className="px-4 py-3 text-center flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                             <button onClick={() => toggleAutoOptimize(c.id, !!c.auto_optimize)} className={`p-1.5 rounded-md transition-colors ${c.auto_optimize ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20' : 'text-neutral-400 hover:text-amber-500 hover:bg-amber-500/10'}`} title={c.auto_optimize ? "Auto-Optimize Enabled (Click to disable)" : "Auto-Optimize Disabled (Click to enable)"}>
                               <Zap className="w-4 h-4 mx-auto" />
                             </button>
                             <button onClick={() => askStrategist(c)} className="text-[#007AFF] hover:bg-[#007AFF]/10 p-1.5 rounded-md transition-colors" title="Ask Strategist for Budget Recommendation">
                               <MessageSquare className="w-4 h-4 mx-auto" />
                             </button>
                             <button onClick={() => handleDeleteCampaign(c.id, c.name)} className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-md transition-colors" title="Delete Campaign">
                               <Trash2 className="w-4 h-4 mx-auto" />
                             </button>
                          </td>}
                        </tr>
                        {expandedRows[c.id] && (
                          <tr className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/10">
                            <td colSpan={4 + Object.values(visibleColumns).filter(Boolean).length} className="p-4">
                              <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto text-center font-mono">
                                <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-black/5 dark:border-white/10">
                                  <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Impressions</div>
                                  <div className="text-sm font-semibold">{c.impressions?.toLocaleString() || 0}</div>
                                </div>
                                <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-black/5 dark:border-white/10">
                                  <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Clicks</div>
                                  <div className="text-sm font-semibold">{c.clicks?.toLocaleString() || 0}</div>
                                </div>
                                <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-black/5 dark:border-white/10">
                                  <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">CTR</div>
                                  <div className="text-sm font-semibold">
                                    {(c.impressions && c.clicks && parseInt(c.impressions) > 0 
                                      ? ((parseInt(c.clicks) / parseInt(c.impressions)) * 100).toFixed(2) 
                                      : 0)}%
                                  </div>
                                </div>
                                <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-black/5 dark:border-white/10">
                                  <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">CPC</div>
                                  <div className="text-sm font-semibold text-[#007AFF]">
                                    ${(parseFloat(c.spend) / (parseInt(c.clicks || '1') || 1)).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 p-4 rounded-xl shadow-sm h-[300px] w-full">
                <h4 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-neutral-700 dark:text-neutral-300 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <LineChartIcon className="w-3.5 h-3.5 text-purple-500" /> ROAS Trends
                </h4>
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              
              <div className="bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 p-4 rounded-xl shadow-sm h-[300px] w-full">
                <h4 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-neutral-700 dark:text-neutral-300 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <BarChartIcon className="w-3.5 h-3.5 text-amber-500" /> Spend by Campaign
                </h4>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} tickFormatter={(val) => val.slice(0,10) + '...'} />
                    <YAxis tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} 
                      itemStyle={{ color: '#fff' }} 
                    />
                    <Bar dataKey="spend" name="Spend ($)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 p-4 rounded-xl shadow-sm h-[300px] w-full mt-4 group">
              <h4 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-neutral-700 dark:text-neutral-300 uppercase tracking-widest flex items-center gap-2 mb-4">
                <LineChartIcon className="w-3.5 h-3.5 text-blue-500" /> 30-Day Predictive Trajectory: Forecast vs Expected
              </h4>
              <p className="text-[10px] text-neutral-500 font-mono mb-2 uppercase tracking-wider">Projected Spend & Sales based on current velocity constraints</p>
              <ResponsiveContainer width="100%" height="75%">
                <AreaChart data={forecastTrajectory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} tickFormatter={val => `$${(val/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} 
                    itemStyle={{ color: '#fff' }} 
                    formatter={(value: any) => `$${value.toLocaleString()}`}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Area type="monotone" dataKey="sales" name="Predicted Sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} activeDot={{ r: 6 }} />
                  <Area type="monotone" dataKey="spend" name="Predicted Spend" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="budget" name="Daily Budget Cap" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 p-4 rounded-xl shadow-sm h-[350px] w-full mt-4">
              <h4 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-neutral-700 dark:text-neutral-300 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Activity className="w-3.5 h-3.5 text-cyan-500" /> Spend / Sales Correlation Matrix
              </h4>
              <p className="text-[10px] text-neutral-500 font-mono mb-4">Heatmap indicating campaign-to-campaign impact correlation.</p>
              <ResponsiveContainer width="100%" height="80%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid stroke="rgba(150,150,150,0.1)" />
                  <XAxis type="number" dataKey="x" name="Campaign 1" tick={false} axisLine={false} tickLine={false} />
                  <YAxis type="number" dataKey="y" name="Campaign 2" tick={false} axisLine={false} tickLine={false} />
                  <ZAxis type="number" dataKey="z" range={[50, 400]} />
                  <Tooltip 
                    cursor={{strokeDasharray: '3 3'}}
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-black/80 text-white p-2 text-xs font-mono rounded">
                          <div>{data.c1} x {data.c2}</div>
                          <div>Correlation: {data.z.toFixed(2)}</div>
                        </div>
                      )
                    }} 
                  />
                  <Scatter data={correlationData} fill="#06b6d4" fillOpacity={0.7} />
                </ScatterChart>
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
                <input type="number" step="0.01" value={newCampaign.target_roas} onChange={e => setNewCampaign({...newCampaign, target_roas: e.target.value})} className="w-full bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-lg p-2 text-sm text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-[#007AFF] transition-colors" />
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

