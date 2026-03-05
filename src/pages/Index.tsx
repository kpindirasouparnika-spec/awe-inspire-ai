import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, MessageSquare, Brain, Globe, List } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { SearchPanel } from "@/components/SearchPanel";
import { ListPanel } from "@/components/ListPanel";
import { streamChat, type Message } from "@/lib/chat";

const suggestions = [
  { icon: Zap, text: "Explain quantum computing", desc: "in simple terms" },
  { icon: MessageSquare, text: "Write a creative story", desc: "about time travel" },
  { icon: Brain, text: "Help me brainstorm", desc: "startup ideas" },
];

type Tab = "chat" | "search" | "lists";

const tabs: { id: Tab; label: string; icon: typeof Zap }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "search", label: "Web Search", icon: Globe },
  { id: "lists", label: "AI Lists", icon: List },
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
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 glow-border flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground tracking-tight uppercase italic">MASTERMIND AI</h1>
          <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-sm uppercase tracking-wider">v1.0</span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col flex-1 overflow-hidden"
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
                      className="w-20 h-20 rounded-2xl bg-primary/10 glow-primary flex items-center justify-center mb-6 relative"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="absolute inset-0 bg-primary/5 rounded-2xl animate-pulse" />
                      <Zap className="w-10 h-10 text-primary relative z-10" />
                    </motion.div>
                    <h2 className="text-3xl font-black text-gradient mb-2 italic uppercase tracking-tighter">MASTERMIND AI ACTIVE</h2>
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
            <ChatInput onSend={send} disabled={isLoading} />
          </motion.div>
        )}

        {activeTab === "search" && (
          <motion.div
            key="search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-hidden"
          >
            <SearchPanel />
          </motion.div>
        )}

        {activeTab === "lists" && (
          <motion.div
            key="lists"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-hidden"
          >
            <ListPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
