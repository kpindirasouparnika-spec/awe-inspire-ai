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
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Nova AI</h1>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">beta</span>
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
                className="w-16 h-16 rounded-2xl bg-primary/10 glow-primary flex items-center justify-center mb-6"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gradient mb-2">Hello, I'm Nova</h2>
              <p className="text-muted-foreground text-center max-w-md mb-8">
                Your AI assistant powered by Gemini. Ask me anything — I'm here to help.
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
