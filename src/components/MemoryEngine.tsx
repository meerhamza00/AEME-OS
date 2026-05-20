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
    if (user) formData.append('userId', user.id);

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
        body: JSON.stringify({ query: searchQuery, userId: user?.id })
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
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm text-neutral-200">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <h2 className="text-sm font-mono text-neutral-300 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          Memory Engine
        </h2>
        <button 
          onClick={handleInit}
          className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-400 px-3 py-1 rounded transition-colors flex items-center gap-1"
        >
           Run DB Migrations
        </button>
      </div>

      <div className="p-6">
        {status && (
          <div className="mb-6 p-3 bg-neutral-950 border border-neutral-800 text-xs font-mono text-indigo-300 rounded break-words">
            {'>'} {status}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Upload className="w-3 h-3" /> Ingest Knowledge
            </h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <label className="block bg-neutral-950 border border-dashed border-neutral-800 rounded-lg p-4 cursor-pointer hover:bg-neutral-900/50 transition-colors">
                <input 
                  type="file" 
                  accept=".txt,.csv,.md"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <FileText className="w-6 h-6 text-neutral-500" />
                  <span className="text-sm font-sans text-neutral-400">
                    {file ? file.name : 'Select structured data file (.txt, .md)'}
                  </span>
                </div>
              </label>
              <button 
                type="submit" 
                disabled={uploading || !file}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-mono py-2.5 rounded transition-colors"
              >
                {uploading ? 'Processing & Vectorizing...' : 'Commit to Memory'}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Search className="w-3 h-3" /> Retrieve Strategy
            </h3>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. 'Customer acquisition guidelines'"
                className="flex-1 bg-neutral-950 border border-neutral-800 text-sm p-2 rounded focus:ring-1 focus:ring-indigo-500 outline-none text-neutral-200"
              />
              <button 
                type="submit"
                disabled={searching || !searchQuery}
                className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded text-xs font-mono transition-colors border border-neutral-700 text-neutral-200"
              >
                {searching ? '...' : 'Query'}
              </button>
            </form>
            
            {searchResults.length > 0 && (
              <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {searchResults.map((res, i) => (
                  <div key={i} className="text-xs font-sans bg-neutral-950 border border-neutral-800 p-3 rounded">
                    <div className="text-indigo-400 font-mono mb-2 flex justify-between border-b border-neutral-800 pb-1">
                      <span>Vector Match {i + 1}</span>
                      <span>{(res.similarity * 100).toFixed(1)}% Match</span>
                    </div>
                    <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">{res.content}</p>
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
