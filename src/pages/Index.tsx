import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, MessageSquare, Brain, Globe, List, Image, Music } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { SearchPanel } from "@/components/SearchPanel";
import { ListPanel } from "@/components/ListPanel";
import { ImagePanel } from "@/components/ImagePanel";
import { MusicPanel } from "@/components/MusicPanel";
import { streamChat, type Message } from "@/lib/chat";

const suggestions = [
  { icon: Zap, text: "Explain quantum computing", desc: "in simple terms" },
  { icon: MessageSquare, text: "Write a creative story", desc: "about time travel" },
  { icon: Brain, text: "Help me brainstorm", desc: "startup ideas" },
];

type Tab = "chat" | "search" | "lists" | "image" | "music";

const tabs: { id: Tab; label: string; icon: typeof Zap; emoji?: string }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare, emoji: "💬" },
  { id: "search", label: "Search", icon: Globe, emoji: "🔍" },
  { id: "lists", label: "Lists", icon: List, emoji: "📋" },
  { id: "image", label: "Nano 🍌", icon: Image, emoji: "🍌" },
  { id: "music", label: "Music", icon: Music, emoji: "🎵" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
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
    <div className="flex flex-col h-screen bg-background overflow-hidden relative">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]"
          animate={{ x: [0, 100, -50, 0], y: [0, -80, 60, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: "10%", left: "20%" }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]"
          animate={{ x: [0, -70, 80, 0], y: [0, 50, -40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: "10%", right: "15%" }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-border backdrop-blur-sm bg-background/80">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 glow-border flex items-center justify-center"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Zap className="w-5 h-5 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-base font-bold text-gradient tracking-tight uppercase italic leading-tight">MASTERMIND AI</h1>
            <p className="text-[9px] text-muted-foreground font-medium leading-none">by Aagney Lineesh</p>
          </div>
          <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-sm uppercase tracking-wider ml-1">v2.0</span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 bg-secondary/60 backdrop-blur-sm rounded-xl p-1 border border-border/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <span className="text-xs">{tab.emoji}</span>
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 flex flex-col flex-1 overflow-hidden"
          >
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
                      className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/15 to-accent/15 glow-primary flex items-center justify-center mb-6 relative"
                      animate={{ scale: [1, 1.06, 1], rotate: [0, 2, -2, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="absolute inset-0 bg-primary/5 rounded-3xl animate-pulse" />
                      <Zap className="w-12 h-12 text-primary relative z-10" />
                    </motion.div>
                    <h2 className="text-4xl font-black text-gradient mb-1 italic uppercase tracking-tighter">MASTERMIND AI</h2>
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Created by Aagney Lineesh</p>
                    <p className="text-muted-foreground text-center max-w-md mb-8 font-medium text-sm">
                      Your all-in-one AI powerhouse — Chat, Search, Lists, Image Gen & Music 🚀
                    </p>
                    <div className="grid gap-3 w-full max-w-md">
                      {suggestions.map((s, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          onClick={() => send(`${s.text} ${s.desc}`)}
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-secondary/80 hover:bg-secondary border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all text-left group"
                        >
                          <s.icon className="w-4 h-4 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
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
            <ChatInput onSend={send} disabled={isLoading} />
          </motion.div>
        )}

        {activeTab === "search" && (
          <motion.div key="search" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="relative z-10 flex-1 overflow-hidden">
            <SearchPanel />
          </motion.div>
        )}

        {activeTab === "lists" && (
          <motion.div key="lists" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="relative z-10 flex-1 overflow-hidden">
            <ListPanel />
          </motion.div>
        )}

        {activeTab === "image" && (
          <motion.div key="image" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="relative z-10 flex-1 overflow-hidden">
            <ImagePanel />
          </motion.div>
        )}

        {activeTab === "music" && (
          <motion.div key="music" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="relative z-10 flex-1 overflow-hidden">
            <MusicPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
