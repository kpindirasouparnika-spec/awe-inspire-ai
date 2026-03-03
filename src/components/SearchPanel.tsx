import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Globe, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { streamSearch } from "@/lib/search";

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [result]);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;
    setResult("");
    setIsLoading(true);

    let buffer = "";
    try {
      await streamSearch({
        query: trimmed,
        mode: "search",
        onDelta: (chunk) => {
          buffer += chunk;
          setResult(buffer);
        },
        onDone: () => setIsLoading(false),
      });
    } catch {
      setIsLoading(false);
      setResult("⚠️ Search failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search the web with ROBOMASTER..."
                className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-30 flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </motion.button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto p-4">
          {!result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 glow-primary flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 uppercase italic">ROBOMASTER SEARCH</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                AI-powered search intelligence. Enter a query to get comprehensive results.
              </p>
            </motion.div>
          )}
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&_h2]:text-primary [&_h2]:text-base [&_a]:text-primary [&_a]:no-underline [&_hr]:border-border [&_strong]:text-foreground [&_p]:text-secondary-foreground"
            >
              <ReactMarkdown>{result}</ReactMarkdown>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
