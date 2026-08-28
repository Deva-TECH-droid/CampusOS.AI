import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  Calendar,
  Briefcase,
  MessageSquare,
  X,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { globalSearchApi } from "../../api/dashboard.api";

// ─── Config ───────────────────────────────────────────────────
const TYPE_CONFIG = {
  club: {
    label: "Clubs",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-50",
    pill: "bg-blue-50 text-blue-600",
  },
  event: {
    label: "Events",
    icon: Calendar,
    color: "text-violet-500",
    bg: "bg-violet-50",
    pill: "bg-violet-50 text-violet-600",
  },
  drive: {
    label: "Placement Drives",
    icon: Briefcase,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    pill: "bg-emerald-50 text-emerald-600",
  },
  discussion: {
    label: "Discussions",
    icon: MessageSquare,
    color: "text-amber-500",
    bg: "bg-amber-50",
    pill: "bg-amber-50 text-amber-600",
  },
};

const TYPE_ORDER = ["club", "event", "drive", "discussion"];

// ─── Result Row ───────────────────────────────────────────────
const ResultRow = ({ result, isFocused, onNavigate, onHover }) => {
  const conf = TYPE_CONFIG[result.type];
  const Icon = conf.icon;

  return (
    <button
      onClick={() => onNavigate(result.url)}
      onMouseEnter={onHover}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 group
        ${isFocused ? "bg-gray-50" : "hover:bg-gray-50/70"}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center ${conf.bg}`}
      >
        {result.image ? (
          <img
            src={result.image}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <Icon size={14} className={conf.color} />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 truncate leading-snug">
          {result.title}
        </p>
        <p className="text-[10px] text-gray-400 truncate mt-0.5">
          {result.subtitle}
        </p>
      </div>

      {/* Arrow on focus */}
      <ArrowRight
        size={12}
        className={`text-gray-300 flex-shrink-0 transition-opacity ${isFocused ? "opacity-100" : "opacity-0"}`}
      />
    </button>
  );
};

// ─── GlobalSearch ─────────────────────────────────────────────
const GlobalSearch = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  // ── Click outside ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Escape key ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Debounced search ───────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      if (query.length === 0) setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      try {
        const res = await globalSearchApi(
          query.trim(),
          abortRef.current.signal,
        );
        setResults(res.data.data || []);
        setFocusedIndex(-1);
      } catch (err) {
        if (err.code !== "ERR_CANCELED") setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // ── Group + flatten ────────────────────────────────────────
  const grouped = TYPE_ORDER.reduce((acc, t) => {
    const items = results.filter((r) => r.type === t);
    if (items.length) acc[t] = items;
    return acc;
  }, {});

  const flatResults = TYPE_ORDER.flatMap((t) =>
    results.filter((r) => r.type === t),
  );

  // ── Navigation ─────────────────────────────────────────────
  const handleNavigate = (url) => {
    navigate(url);
    setIsOpen(false);
    setQuery("");
    setResults([]);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // ── Keyboard navigation ────────────────────────────────────
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      handleNavigate(flatResults[focusedIndex].url);
    }
  };

  const showDropdown = isOpen && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative">
      {/* ── Input ── */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl transition-all duration-200 w-56
        ${
          isOpen && query
            ? "bg-white border-gray-300 shadow-sm w-72"
            : "bg-gray-50 border-gray-200 hover:border-gray-300"
        }`}
      >
        <Search size={13} className="text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search everything..."
          className="text-xs text-gray-700 placeholder:text-gray-400 outline-none bg-transparent w-full"
        />
        {loading && (
          <Loader2
            size={12}
            className="text-gray-400 animate-spin flex-shrink-0"
          />
        )}
        {!loading && query && (
          <button onClick={handleClear} className="flex-shrink-0">
            <X
              size={12}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            />
          </button>
        )}
      </div>

      {/* ── Dropdown ── */}
      {showDropdown && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col max-h-[520px]">
          {loading ? (
            // Loading skeleton
            <div className="p-4 space-y-3">
              {[72, 56, 64].map((w, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div
                      className={`h-2.5 bg-gray-100 rounded`}
                      style={{ width: `${w}%` }}
                    />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : flatResults.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-10 gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                <Search size={16} className="text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">
                  No results found
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Try searching for clubs, events, drives, or discussions
                </p>
              </div>
            </div>
          ) : (
            // Results
            <>
              <div className="overflow-y-auto flex-1">
                {TYPE_ORDER.map((type) => {
                  if (!grouped[type]) return null;
                  const conf = TYPE_CONFIG[type];
                  const Icon = conf.icon;
                  const items = grouped[type];

                  return (
                    <div key={type}>
                      {/* Category header */}
                      <div className="sticky top-0 flex items-center gap-1.5 px-4 py-1.5 bg-gray-50/90 backdrop-blur-sm border-b border-gray-100">
                        <Icon size={10} className={conf.color} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {conf.label}
                        </span>
                        <span className="text-[9px] text-gray-300 ml-auto">
                          {items.length}
                        </span>
                      </div>

                      {/* Items */}
                      {items.map((result) => {
                        const flatIdx = flatResults.findIndex(
                          (r) => String(r._id) === String(result._id),
                        );
                        return (
                          <ResultRow
                            key={String(result._id)}
                            result={result}
                            isFocused={flatIdx === focusedIndex}
                            onNavigate={handleNavigate}
                            onHover={() => setFocusedIndex(flatIdx)}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-50 flex-shrink-0">
                <span className="text-[10px] text-gray-400">
                  {flatResults.length} result
                  {flatResults.length !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-3">
                  {[
                    { key: "↑↓", label: "navigate" },
                    { key: "↵", label: "open" },
                    { key: "Esc", label: "close" },
                  ].map(({ key, label }) => (
                    <span
                      key={key}
                      className="flex items-center gap-1 text-[9px] text-gray-400"
                    >
                      <kbd className="px-1 py-px bg-gray-100 rounded text-[9px] font-mono">
                        {key}
                      </kbd>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
