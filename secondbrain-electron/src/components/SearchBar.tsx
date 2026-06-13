import { useState, useRef, useEffect } from 'react';
import type { SearchResult } from '../types';

interface SearchBarProps {
  onSearch: (query: string) => Promise<SearchResult[]>;
  onSelect: (name: string) => void;
}

export default function SearchBar({ onSearch, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await onSearch(query);
      setResults(res);
      setLoading(false);
      setShowResults(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // Close results on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keyboard shortcut Ctrl+P to focus search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleSelect = (name: string) => {
    setShowResults(false);
    setQuery('');
    onSelect(name);
  };

  return (
    <div className="search-bar" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder="Search notes... (Ctrl+P)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim() && setShowResults(true)}
      />
      {loading && <span className="search-loading">...</span>}
      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((r) => (
            <div
              key={r.name}
              className="search-result-item"
              onClick={() => handleSelect(r.name)}
            >
              <div className="search-result-title">{r.title}</div>
              <div className="search-result-snippet">{r.snippet}</div>
            </div>
          ))}
        </div>
      )}
      {showResults && query.trim() && results.length === 0 && !loading && (
        <div className="search-results">
          <div className="search-result-empty">No results found</div>
        </div>
      )}
    </div>
  );
}
