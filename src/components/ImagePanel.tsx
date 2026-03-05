import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Loader2, Sparkles, Download, RefreshCw } from "lucide-react";

const imageSuggestions = [
  "A cyberpunk city at night with neon lights",
  "A cute robot playing guitar in a garden",
  "An underwater crystal palace with bioluminescent fish",
  "A dragon made of colorful flowers flying over mountains",
];

export function ImagePanel() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [textResponse, setTextResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (text?: string) => {
    const trimmed = (text || prompt).trim();
    if (!trimmed || isLoading) return;
    if (text) setPrompt(text);
    setImageUrl(null);
    setTextResponse(null);
    setError(null);
    setIsLoading(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-gen`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt: trimmed }),
        }
      );

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Image generation failed");
      }

      const data = await resp.json();
      
      if (data.image) {
        setImageUrl(data.image);
      }
      if (data.text) {
        setTextResponse(data.text);
      }
      if (!data.image && !data.text) {
        setTextResponse("Image was generated but the format couldn't be displayed. The AI model returned a response — try a different prompt!");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input */}
      <div className="p-4 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="Describe the image you want to create..."
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
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
              Generate
            </motion.button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto p-4">
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <motion.div
                  className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-10 h-10 text-primary" />
                </motion.div>
                <p className="text-muted-foreground text-sm animate-pulse">Creating your masterpiece...</p>
              </motion.div>
            )}

            {!isLoading && !imageUrl && !textResponse && !error && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Image className="w-8 h-8 text-primary" />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground mb-2 uppercase italic">🍌 NANO BANANA</h3>
                <p className="text-xs font-medium text-primary/70 mb-2">Powered by Gemini Image AI</p>
                <p className="text-muted-foreground text-sm max-w-sm mb-6">
                  Generate stunning AI images from text descriptions. Just describe what you imagine!
                </p>
                <div className="grid gap-2 w-full max-w-md">
                  {imageSuggestions.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      onClick={() => handleGenerate(s)}
                      className="text-left px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-sm text-foreground transition-colors"
                    >
                      🎨 {s}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {!isLoading && (imageUrl || textResponse || error) && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {error && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}
                {imageUrl && (
                  <div className="relative group">
                    <img
                      src={imageUrl}
                      alt={prompt}
                      className="w-full rounded-2xl border border-border shadow-lg"
                    />
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={imageUrl}
                        download="mastermind-ai-image.png"
                        className="w-9 h-9 rounded-lg bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <Download className="w-4 h-4 text-foreground" />
                      </a>
                      <button
                        onClick={() => handleGenerate()}
                        className="w-9 h-9 rounded-lg bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 text-foreground" />
                      </button>
                    </div>
                  </div>
                )}
                {textResponse && (
                  <div className="p-4 rounded-xl bg-secondary border border-border text-sm text-secondary-foreground">
                    {textResponse}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
