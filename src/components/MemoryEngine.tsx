import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Database, Upload, Search, FileText, Trash2, Edit2, Copy, Check, BarChart2, CheckCircle2 } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

export function MemoryEngine() {
  const { user } = useUser();
  const [status, setStatus] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [customUserId, setCustomUserId] = useState('anonymous');
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [textInput, setTextInput] = useState('');
  const [activeView, setActiveView] = useState<'core' | 'manage' | 'visualize'>('core');
  
  // Management state
  const [chunks, setChunks] = useState<any[]>([]);
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editChunkContent, setEditChunkContent] = useState('');
  
  // Visualization state
  const [visualPoints, setVisualPoints] = useState<any[]>([]);
  
  // Context selection state
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedContext, setSelectedContext] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (activeView === 'manage') {
      fetchChunks();
    } else if (activeView === 'visualize') {
      fetchVisualPoints();
    }
  }, [activeView, customUserId]);

  useEffect(() => {
    fetch('/api/ppc/campaigns')
      .then(res => res.json())
      .then(data => { if (data.campaigns) setCampaigns(data.campaigns); })
      .catch(console.error);
  }, []);

  const fetchChunks = async () => {
    try {
      const res = await fetch(`/api/memory/chunks?userId=${customUserId}`);
      const data = await res.json();
      if (res.ok) setChunks(data.chunks || []);
    } catch (e) { console.error(e); }
  };

  const fetchVisualPoints = async () => {
    try {
      const res = await fetch(`/api/memory/visualize?userId=${customUserId}`);
      const data = await res.json();
      if (res.ok) setVisualPoints(data.points || []);
    } catch (e) { console.error(e); }
  };

  const deleteChunk = async (id: string) => {
    try {
      const res = await fetch(`/api/memory/chunks/${id}`, { method: 'DELETE' });
      if (res.ok) fetchChunks();
    } catch (e) { console.error(e); }
  };

  const saveChunkEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/memory/chunks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editChunkContent })
      });
      if (res.ok) {
        setEditingChunkId(null);
        fetchChunks();
      }
    } catch (e) { console.error(e); }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInit = async () => {
    setStatus('Initializing database...');
    try {
      const res = await fetch('/api/memory/init', { method: 'POST' });
      const data = await res.json();
      if (res.ok) setStatus(`Success: ${data.message}`);
      else setStatus(`Error: ${data.error}`);
    } catch (err: any) {
      setStatus(`Failed to initialize: ${err.message}`);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadMode === 'file' && !file) return;
    if (uploadMode === 'text' && !textInput.trim()) return;
    
    setUploading(true);
    setStatus('Starting chunking and embedding process...');

    const formData = new FormData();
    if (uploadMode === 'file') {
      formData.append('file', file as Blob);
    } else {
      const textBlob = new Blob([textInput], { type: 'text/plain' });
      formData.append('file', textBlob, 'manual-input.txt');
    }
    formData.append('userId', customUserId || 'anonymous');

    try {
      setStatus('Uploading and vectorizing chunks... (this may take a moment)');
      const res = await fetch('/api/memory/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`Success: Embedded ${data.inserted} cognitive chunks.`);
        setFile(null);
        setTextInput('');
      } else {
        setStatus(`Upload Error: ${data.error}`);
      }
    } catch (err: any) {
      setStatus(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setSearching(true);
    
    try {
      const finalQuery = selectedContext ? `Context: ${selectedContext}\n\nQuery: ${searchQuery}` : searchQuery;
      const res = await fetch('/api/memory/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: finalQuery, userId: customUserId || 'anonymous' })
      });
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.results || []);
        if (data.results.length === 0) setStatus('No relevant context found in Memory Engine.');
        else setStatus(`Found ${data.results.length} relevant chunks.`);
      } else {
        setStatus(`Search Error: ${data.error}`);
      }
    } catch (err: any) {
      setStatus(`Search failed: ${err.message}`);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-xl shadow-sm text-neutral-800 dark:text-neutral-200 h-full flex flex-col transition-all overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] border-b border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 relative">
        <div>
          <h2 className="text-[clamp(0.875rem,1.2vw,1rem)] font-mono text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#007AFF]" />
            Memory Engine
          </h2>
          <p className="text-[clamp(0.7rem,1vw,0.75rem)] font-sans text-neutral-500 dark:text-neutral-500 mt-1 max-w-xl">
             Upload brand guidelines, successful ad copy, or past strategies. AEME vectorizes learning to align future autonomous decisions with your unique enterprise voice.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleInit}
            className="flex-1 sm:flex-none text-[clamp(0.7rem,1vw,0.75rem)] bg-black/5 dark:bg-white/10 hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm border border-neutral-300 dark:border-neutral-700 hover:border-neutral-600 active:scale-95"
            title="Setup local database tables and pgvector limits"
          >
             Run DB Migrations
          </button>
        </div>
      </div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] flex-1 overflow-auto custom-scrollbar z-10 relative">
        
        <div className="flex gap-4 border-b border-black/5 dark:border-white/10 mb-[clamp(1rem,1.5vw,1.5rem)] pb-2 overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveView('core')} className={`text-xs font-mono tracking-widest uppercase transition-colors px-2 py-1 border-b-2 ${activeView === 'core' ? 'border-[#007AFF] text-[#007AFF]' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>Core Engine</button>
          <button onClick={() => setActiveView('manage')} className={`text-xs font-mono tracking-widest uppercase transition-colors px-2 py-1 border-b-2 ${activeView === 'manage' ? 'border-[#007AFF] text-[#007AFF]' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>Manage</button>
          <button onClick={() => setActiveView('visualize')} className={`text-xs font-mono tracking-widest uppercase transition-colors px-2 py-1 border-b-2 ${activeView === 'visualize' ? 'border-[#007AFF] text-[#007AFF]' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>Visualize</button>
        </div>

        <div className="mb-[clamp(1rem,1.5vw,1.5rem)] bg-white/30 dark:bg-black/30 backdrop-blur-3xl/50 p-3 rounded-lg border border-black/5 dark:border-white/10">
          <label className="block text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-widest mb-2">
            Target Context User ID
          </label>
          <input 
            type="text" 
            value={customUserId}
            onChange={(e) => setCustomUserId(e.target.value)}
            placeholder="e.g. 'anonymous', 'user_123'"
            className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/10 text-sm p-2 rounded-md focus:ring-1 focus:ring-[#007AFF] outline-none text-neutral-800 dark:text-neutral-200 transition-colors focus:bg-white/30 dark:bg-black/30 backdrop-blur-3xl"
          />
          <p className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-sans text-neutral-600 mt-2">
            Data ingestion and retrieval will be scoped to this ID.
          </p>
        </div>

        {status && (
          <div className="mb-[clamp(1rem,1.5vw,1.5rem)] p-3 bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 text-[11px] sm:text-xs font-mono text-indigo-300 rounded-lg break-words shadow-inner flex items-start gap-2">
            <span className="text-[#007AFF]">{'>'}</span> 
            <span>{status}</span>
          </div>
        )}

        {activeView === 'core' && (
          <div className="grid grid-cols-1 @lg:grid-cols-2 gap-[clamp(1rem,2vw,2rem)] container-type-inline-size">
            <div className="space-y-[clamp(0.75rem,1.5vw,1.5rem)]">
              <h3 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-2">
                <Upload className="w-3.5 h-3.5" /> Ingest Knowledge
              </h3>
              
              <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-lg border border-black/5 dark:border-white/10 mb-2">
                <button onClick={() => setUploadMode('file')} className={`flex-1 rounded-md text-xs font-mono py-1.5 transition-all ${uploadMode === 'file' ? 'bg-white dark:bg-black/50 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>File Upload</button>
                <button onClick={() => setUploadMode('text')} className={`flex-1 rounded-md text-xs font-mono py-1.5 transition-all ${uploadMode === 'text' ? 'bg-white dark:bg-black/50 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>Text Input</button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                {uploadMode === 'file' ? (
                  <label className="block bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-dashed border-black/5 dark:border-white/10 rounded-xl p-[clamp(1.5rem,2vw,2rem)] cursor-pointer hover:bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-3xl transition-colors shadow-sm w-full group/upload">
                    <input 
                      type="file" 
                      accept=".txt,.csv,.md"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center text-center gap-3">
                      <div className="p-3 bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-3xl rounded-full group-hover/upload:bg-black/5 dark:bg-white/10 transition-colors border border-black/5 dark:border-white/10 group-hover/upload:border-neutral-300 dark:border-neutral-700">
                        <FileText className="w-6 h-6 text-neutral-600 dark:text-neutral-400 group-hover/upload:text-[#007AFF] transition-colors" />
                      </div>
                      <span className="text-[13px] font-sans text-neutral-600 dark:text-neutral-400 group-hover/upload:text-neutral-700 dark:text-neutral-300 transition-colors">
                        {file ? <span className="text-[#007AFF] font-medium">{file.name}</span> : 'Select structured data file (.txt, .md)'}
                      </span>
                    </div>
                  </label>
                ) : (
                  <textarea 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste brand guidelines, personas, or context here..."
                    className="w-full bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 text-[13px] p-3 rounded-xl focus:ring-1 focus:ring-[#007AFF] outline-none text-neutral-800 dark:text-neutral-200 font-sans transition-colors focus:bg-white/50 dark:bg-[#1e1e1e]/50 min-h-[150px] resize-y custom-scrollbar"
                  />
                )}
                <button 
                  type="submit" 
                  disabled={uploading || (uploadMode === 'file' ? !file : !textInput.trim())}
                  className="w-full bg-[#007AFF] hover:bg-[#005bb5] disabled:opacity-50 text-white text-[clamp(0.7rem,1vw,0.75rem)] font-mono py-2.5 rounded-lg transition-all active:scale-95 shadow-sm uppercase tracking-wide"
                >
                  {uploading ? 'Processing & Vectorizing...' : 'Commit to Memory'}
                </button>
              </form>
            </div>

            <div className="space-y-[clamp(0.75rem,1.5vw,1.5rem)] flex flex-col h-full">
              <h3 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-2">
                <Search className="w-3.5 h-3.5" /> Retrieve Strategy
              </h3>
              <form onSubmit={handleSearch} className="flex flex-col gap-2">
                <select 
                  value={selectedContext}
                  onChange={(e) => setSelectedContext(e.target.value)}
                  className="w-full bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 text-[13px] p-2 rounded-lg focus:ring-1 focus:ring-[#007AFF] outline-none text-neutral-800 dark:text-neutral-200 font-sans cursor-pointer"
                >
                  <option value="">No specific context filter (Search Global Memory)</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={`Campaign ${c.name}`}>Restrict to Campaign: {c.name}</option>
                  ))}
                  {chunks.slice(0,5).map(c => (
                    <option key={c.id} value={`Chunk ${c.content.substring(0, 20)}`}>Reference Memory: {c.content.substring(0,25)}...</option>
                  ))}
                </select>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-neutral-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. 'Brand guidelines'"
                      className="w-full bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 text-[13px] p-2 pl-9 rounded-lg focus:ring-1 focus:ring-[#007AFF] outline-none text-neutral-800 dark:text-neutral-200 transition-colors focus:bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-3xl"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={searching || !searchQuery}
                    className="w-full sm:w-auto bg-black/5 dark:bg-white/10 hover:bg-neutral-700 px-4 py-2 rounded-lg text-[clamp(0.7rem,1vw,0.75rem)] font-mono transition-all border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 active:scale-95 disabled:opacity-50 uppercase tracking-wide shadow-sm min-w-[80px]"
                  >
                    {searching ? '...' : 'Query'}
                  </button>
                </div>
              </form>
              
              {searchResults.length > 0 && (
                <div className="space-y-3 mt-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {searchResults.map((res, i) => (
                    <div key={i} className="text-[13px] font-sans bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 p-4 rounded-xl hover:border-neutral-300 dark:border-neutral-700 transition-colors shadow-sm relative group/result">
                      <div className="text-[#007AFF] font-mono text-[11px] uppercase tracking-widest mb-3 flex justify-between items-center border-b border-black/5 dark:border-white/10 pb-2">
                        <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]"></span> Vector Match {i + 1}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => copyToClipboard(res.content, res.id)} className="text-neutral-500 hover:text-[#007AFF] transition-colors p-1" title="Copy to clipboard">
                             {copiedId === res.id ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <span className="bg-[#007AFF]/10 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/20">{(res.similarity * 100).toFixed(1)}% Match</span>
                        </div>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap pr-8">{res.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'manage' && (
          <div className="space-y-4">
            <h3 className="text-sm font-mono text-neutral-500 dark:text-neutral-300 uppercase tracking-widest flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-2">
               Manage Chunks ({chunks.length})
            </h3>
            {chunks.length === 0 ? (
               <p className="text-sm text-neutral-500">No memory chunks found for this user.</p>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {chunks.map(c => (
                   <div key={c.id} className="bg-white/30 dark:bg-black/30 backdrop-blur-sm border border-black/5 dark:border-white/10 p-3 rounded-xl shadow-sm flex flex-col gap-2">
                     <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 border-b border-black/5 dark:border-white/10 pb-1">
                       <span>{new Date(c.created_at).toLocaleString()}</span>
                       <div className="flex gap-2">
                         <button onClick={() => { setEditingChunkId(c.id); setEditChunkContent(c.content); }} className="text-neutral-500 hover:text-indigo-500"><Edit2 className="w-3.5 h-3.5" /></button>
                         <button onClick={() => deleteChunk(c.id)} className="text-neutral-500 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                       </div>
                     </div>
                     {editingChunkId === c.id ? (
                        <div className="flex flex-col gap-2">
                           <textarea value={editChunkContent} onChange={e => setEditChunkContent(e.target.value)} className="w-full bg-white/50 dark:bg-black/50 text-xs p-2 rounded-lg border border-[#007AFF] outline-none min-h-[100px]" />
                           <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditingChunkId(null)} className="text-xs px-2 py-1 bg-neutral-200 dark:bg-neutral-800 rounded">Cancel</button>
                              <button onClick={() => saveChunkEdit(c.id)} className="text-xs px-2 py-1 bg-[#007AFF] text-white rounded flex items-center gap-1"><Check className="w-3 h-3" /> Save</button>
                           </div>
                        </div>
                     ) : (
                        <p className="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap overflow-hidden max-h-[100px] text-ellipsis">{c.content}</p>
                     )}
                   </div>
                 ))}
               </div>
            )}
          </div>
        )}

        {activeView === 'visualize' && (
          <div className="space-y-4 h-[400px] flex flex-col">
            <h3 className="text-sm font-mono text-neutral-500 dark:text-neutral-300 uppercase tracking-widest flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-2 shrink-0">
               <BarChart2 className="w-4 h-4" /> Embeddings Topology (Experimental)
            </h3>
            <p className="text-xs text-neutral-500">2D projection of embedding vectors via deterministic dimensionality reduction. Concepts grouped closely have similar semantic meanings.</p>
            {visualPoints.length === 0 ? (
               <div className="flex-1 flex items-center justify-center text-sm text-neutral-500 font-mono">No data to visualize.</div>
            ) : (
               <div className="flex-1 bg-white/30 dark:bg-black/30 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-xl p-4">
                 <ResponsiveContainer width="100%" height="100%">
                   <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" />
                     <XAxis type="number" dataKey="x" name="Dimension 1" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                     <YAxis type="number" dataKey="y" name="Dimension 2" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                     <ZAxis type="number" range={[50, 50]} />
                     <Tooltip 
                       cursor={{ strokeDasharray: '3 3' }} 
                       content={({ active, payload }) => {
                         if (active && payload && payload.length) {
                           const data = payload[0].payload;
                           return (
                             <div className="bg-black/80 text-white text-xs p-2 rounded-lg max-w-[200px]">
                               <p className="font-semibold">{data.name}</p>
                             </div>
                           )
                         }
                         return null;
                       }}
                     />
                     <Scatter name="Memory Chunks" data={visualPoints} fill="#007AFF" />
                   </ScatterChart>
                 </ResponsiveContainer>
               </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

