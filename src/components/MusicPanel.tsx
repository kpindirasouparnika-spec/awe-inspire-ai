import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Loader2, Play, Pause, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { streamSearch } from "@/lib/search";

const musicSuggestions = [
  "Write lyrics for an upbeat pop song about summer love",
  "Create a rap verse about coding at midnight",
  "Compose a ballad about chasing dreams",
  "Write a rock anthem about freedom and rebellion",
];

export function MusicPanel() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (text?: string) => {
    const trimmed = (text || prompt).trim();
    if (!trimmed || isLoading) return;
    if (text) setPrompt(text);
    setResult("");
    setIsLoading(true);

    let buffer = "";
    try {
      await streamSearch({
        query: `Write song lyrics, music composition details, and creative musical content for: ${trimmed}. Include verse structure, chorus, tempo suggestions, key signature, mood, and instrument recommendations.`,
        mode: "list",
        onDelta: (chunk) => {
          buffer += chunk;
          setResult(buffer);
        },
        onDone: () => setIsLoading(false),
      });
    } catch {
      setIsLoading(false);
      setResult("⚠️ Song generation failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input */}
      <div className="p-4 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="Describe the song or music you want to create..."
                className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/50"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleGenerate()}
              disabled={isLoading || !prompt.trim()}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-30 flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
              Compose
            </motion.button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto p-4">
          {!result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-4"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Music className="w-8 h-8 text-accent" />
              </motion.div>
              <h3 className="text-xl font-bold text-foreground mb-2 uppercase italic">🎵 SONG COMPOSER</h3>
              <p className="text-xs font-medium text-accent/70 mb-2">AI-Powered Music Creation</p>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                Generate song lyrics, compositions, and musical ideas powered by AI. Describe your vision and let the AI compose!
              </p>
              <div className="grid gap-2 w-full max-w-md">
                {musicSuggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    onClick={() => handleGenerate(s)}
                    className="text-left px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-sm text-foreground transition-colors"
                  >
                    🎶 {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&_h1]:text-lg [&_h2]:text-base [&_h2]:text-accent [&_h3]:text-sm [&_li]:text-secondary-foreground [&_strong]:text-foreground [&_p]:text-secondary-foreground"
            >
              <ReactMarkdown>{result}</ReactMarkdown>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
