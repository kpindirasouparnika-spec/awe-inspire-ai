import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { List, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { streamSearch } from "@/lib/search";

const listSuggestions = [
  "Top 10 programming languages in 2025",
  "Best productivity tools for remote work",
  "Essential sci-fi movies to watch",
  "Healthy meal prep ideas for beginners",
];

export function ListPanel() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [result]);

  const handleGenerate = async (text?: string) => {
    const trimmed = (text || query).trim();
    if (!trimmed || isLoading) return;
    if (text) setQuery(text);
    setResult("");
    setIsLoading(true);

    let buffer = "";
    try {
      await streamSearch({
        query: trimmed,
        mode: "list",
        onDelta: (chunk) => {
          buffer += chunk;
          setResult(buffer);
        },
        onDone: () => setIsLoading(false),
      });
    } catch {
      setIsLoading(false);
      setResult("⚠️ List generation failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input */}
      <div className="p-4 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <List className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="Generate a list about anything..."
                className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleGenerate()}
              disabled={isLoading || !query.trim()}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-30 flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate
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
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <List className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 uppercase italic">AI LISTS</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                Generate comprehensive, curated lists on any topic instantly.
              </p>
              <div className="grid gap-2 w-full max-w-md">
                {listSuggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    onClick={() => handleGenerate(s)}
                    className="text-left px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-sm text-foreground transition-colors"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&_h1]:text-lg [&_h2]:text-base [&_h2]:text-primary [&_h3]:text-sm [&_li]:text-secondary-foreground [&_strong]:text-foreground [&_p]:text-secondary-foreground"
            >
              <ReactMarkdown>{result}</ReactMarkdown>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
