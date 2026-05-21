import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Database, Upload, Search, FileText } from 'lucide-react';

export function MemoryEngine() {
  const { user } = useUser();
  const [status, setStatus] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [customUserId, setCustomUserId] = useState('anonymous');

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
    if (!file) return;
    setUploading(true);
    setStatus('Processing document (chunking & embedding)...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', customUserId || 'anonymous');

    try {
      const res = await fetch('/api/memory/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`Success: Embedded ${data.inserted} cognitive chunks.`);
        setFile(null);
      } else {
        setStatus(`Error: ${data.error}`);
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
      const res = await fetch('/api/memory/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, userId: customUserId || 'anonymous' })
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
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm text-neutral-200 h-full flex flex-col transition-all overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] border-b border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 relative">
        <div>
          <h2 className="text-[clamp(0.875rem,1.2vw,1rem)] font-mono text-neutral-300 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            Memory Engine
          </h2>
          <p className="text-[clamp(0.7rem,1vw,0.75rem)] font-sans text-neutral-500 mt-1 max-w-xl">
             Upload brand guidelines, successful ad copy, or past strategies. AEME vectorizes learning to align future autonomous decisions with your unique enterprise voice.
          </p>
        </div>
        <button 
          onClick={handleInit}
          className="w-full sm:w-auto text-[clamp(0.7rem,1vw,0.75rem)] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm border border-neutral-700 hover:border-neutral-600 active:scale-95"
          title="Setup local database tables and pgvector limits"
        >
           Run DB Migrations
        </button>
      </div>

      <div className="p-[clamp(1rem,1.5vw,1.5rem)] flex-1 overflow-auto custom-scrollbar z-10 relative">
        <div className="mb-[clamp(1rem,1.5vw,1.5rem)] bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50">
          <label className="block text-[clamp(0.65rem,0.8vw,0.7rem)] font-mono text-neutral-500 uppercase tracking-widest mb-2">
            Target Context User ID
          </label>
          <input 
            type="text" 
            value={customUserId}
            onChange={(e) => setCustomUserId(e.target.value)}
            placeholder="e.g. 'anonymous', 'user_123'"
            className="w-full bg-neutral-900 border border-neutral-800 text-sm p-2 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none text-neutral-200 transition-colors focus:bg-neutral-950"
          />
          <p className="text-[clamp(0.65rem,0.8vw,0.7rem)] font-sans text-neutral-600 mt-2">
            Data ingestion and retrieval will be scoped to this ID.
          </p>
        </div>

        {status && (
          <div className="mb-[clamp(1rem,1.5vw,1.5rem)] p-3 bg-neutral-950 border border-neutral-800 text-[11px] sm:text-xs font-mono text-indigo-300 rounded-lg break-words shadow-inner flex items-start gap-2">
            <span className="text-indigo-500">{'>'}</span> 
            <span>{status}</span>
          </div>
        )}

        <div className="grid grid-cols-1 @lg:grid-cols-2 gap-[clamp(1rem,2vw,2rem)] container-type-inline-size">
          <div className="space-y-[clamp(0.75rem,1.5vw,1.5rem)]">
            <h3 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Upload className="w-3.5 h-3.5" /> Ingest Knowledge
            </h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <label className="block bg-neutral-950 border border-dashed border-neutral-800 rounded-xl p-[clamp(1.5rem,2vw,2rem)] cursor-pointer hover:bg-neutral-900 transition-colors shadow-sm w-full group/upload">
                <input 
                  type="file" 
                  accept=".txt,.csv,.md"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center text-center gap-3">
                  <div className="p-3 bg-neutral-900 rounded-full group-hover/upload:bg-neutral-800 transition-colors border border-neutral-800 group-hover/upload:border-neutral-700">
                    <FileText className="w-6 h-6 text-neutral-400 group-hover/upload:text-indigo-400 transition-colors" />
                  </div>
                  <span className="text-[13px] font-sans text-neutral-400 group-hover/upload:text-neutral-300 transition-colors">
                    {file ? <span className="text-indigo-400 font-medium">{file.name}</span> : 'Select structured data file (.txt, .md)'}
                  </span>
                </div>
              </label>
              <button 
                type="submit" 
                disabled={uploading || !file}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[clamp(0.7rem,1vw,0.75rem)] font-mono py-2.5 rounded-lg transition-all active:scale-95 shadow-sm uppercase tracking-wide"
              >
                {uploading ? 'Processing & Vectorizing...' : 'Commit to Memory'}
              </button>
            </form>
          </div>

          <div className="space-y-[clamp(0.75rem,1.5vw,1.5rem)] flex flex-col h-full">
            <h3 className="text-[clamp(0.7rem,1vw,0.75rem)] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Search className="w-3.5 h-3.5" /> Retrieve Strategy
            </h3>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. 'Brand guidelines'"
                  className="w-full bg-neutral-950 border border-neutral-800 text-[13px] p-2 pl-9 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-neutral-200 transition-colors focus:bg-neutral-900"
                />
              </div>
              <button 
                type="submit"
                disabled={searching || !searchQuery}
                className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg text-[clamp(0.7rem,1vw,0.75rem)] font-mono transition-all border border-neutral-700 text-neutral-200 active:scale-95 disabled:opacity-50 uppercase tracking-wide shadow-sm min-w-[80px]"
              >
                {searching ? '...' : 'Query'}
              </button>
            </form>
            
            {searchResults.length > 0 && (
              <div className="space-y-3 mt-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                {searchResults.map((res, i) => (
                  <div key={i} className="text-[13px] font-sans bg-neutral-950 border border-neutral-800 p-4 rounded-xl hover:border-neutral-700 transition-colors shadow-sm">
                    <div className="text-indigo-400 font-mono text-[11px] uppercase tracking-widest mb-3 flex justify-between items-center border-b border-neutral-800/80 pb-2">
                      <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Vector Match {i + 1}</span>
                      <span className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/20">{(res.similarity * 100).toFixed(1)}% Match</span>
                    </div>
                    <p className="text-neutral-400 leading-relaxed whitespace-pre-wrap">{res.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
