import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, MessageSquare, Brain } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { streamChat, type Message } from "@/lib/chat";

const suggestions = [
  { icon: Zap, text: "Explain quantum computing", desc: "in simple terms" },
  { icon: MessageSquare, text: "Write a creative story", desc: "about time travel" },
  { icon: Brain, text: "Help me brainstorm", desc: "startup ideas" },
];

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let buffer = "";
    const upsert = (chunk: string) => {
      buffer += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: buffer } : m));
        }
        return [...prev, { role: "assistant", content: buffer }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => setIsLoading(false),
      });
    } catch {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-center py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 glow-border flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground tracking-tight uppercase italic">ROBOMASTER</h1>
          <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-sm uppercase tracking-wider">v1.0</span>
        </div>
      </header>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center h-full px-4"
            >
              <motion.div
                className="w-20 h-20 rounded-2xl bg-primary/10 glow-primary flex items-center justify-center mb-6 relative"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="absolute inset-0 bg-primary/5 rounded-2xl animate-pulse" />
                <Zap className="w-10 h-10 text-primary relative z-10" />
              </motion.div>
              <h2 className="text-3xl font-black text-gradient mb-2 italic uppercase tracking-tighter">ROBOMASTER ACTIVE</h2>
              <p className="text-muted-foreground text-center max-w-md mb-8 font-medium">
                Strategic AI intelligence initialized. Awaiting commands.
              </p>
              <div className="grid gap-3 w-full max-w-md">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    onClick={() => send(`${s.text} ${s.desc}`)}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border hover:glow-border transition-all text-left group"
                  >
                    <s.icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-foreground">{s.text}</span>
                      <span className="text-sm text-muted-foreground ml-1">{s.desc}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="max-w-3xl mx-auto py-4">
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <ChatInput onSend={send} disabled={isLoading} />
    </div>
  );
};

export default Index;
