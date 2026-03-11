import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  lastAssistantMessage?: string;
  isLoading?: boolean;
}

export function ChatInput({ onSend, disabled, lastAssistantMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastSpokenRef = useRef<string>("");
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  // Auto-speak when loading finishes (response complete) in hands-free mode
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading && handsFree && lastAssistantMessage && lastAssistantMessage !== lastSpokenRef.current) {
      lastSpokenRef.current = lastAssistantMessage;
      speakText(lastAssistantMessage);
    }
    wasLoadingRef.current = !!isLoading;
  }, [isLoading, handsFree, lastAssistantMessage]);

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[#*`_~\[\]()>!|-]/g, "").replace(/\n+/g, ". ");
    const utterance = new SpeechSynthesisUtterance(clean);
    const hasMalayalam = /[\u0D00-\u0D7F]/.test(clean);
    utterance.lang = hasMalayalam ? "ml-IN" : "en-US";
    utterance.rate = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // In hands-free mode, auto-start listening again after speaking
      if (handsFree) {
        setTimeout(() => startListening(), 500);
      }
    };
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [handsFree]);

  const toggleHandsFree = () => {
    if (handsFree) {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
      setIsSpeaking(false);
      setIsListening(false);
    }
    setHandsFree(!handsFree);
  };

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Speech recognition not supported in this browser. Try Chrome.");
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "ml-IN";
    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript = transcript;
        }
      }
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      // In hands-free mode, auto-send when speech ends
      if (handsFree && finalTranscript.trim()) {
        onSend(finalTranscript.trim());
        setInput("");
        finalTranscript = "";
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [handsFree, onSend]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="p-4 border-t border-border">
      <div className="max-w-3xl mx-auto relative">
        <div className="glass glow-border rounded-2xl overflow-hidden">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={isListening ? "🎤 Listening... speak now" : handsFree ? "🎙️ Hands-free mode ON" : "Enter command for MASTERMIND AI..."}
            rows={1}
            disabled={disabled}
            className="w-full bg-transparent resize-none px-4 pt-4 pb-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              <Sparkles className="w-3 h-3 inline mr-1" />Mastermind AI
            </span>

            {/* Hands-free Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleHandsFree}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                handsFree
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
              title={handsFree ? "Hands-free ON (speak & hear)" : "Turn on hands-free mode"}
            >
              <AnimatePresence mode="wait">
                {handsFree ? (
                  <motion.div key="on" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Volume2 className={`w-4 h-4 ${isSpeaking ? "animate-pulse" : ""}`} />
                  </motion.div>
                ) : (
                  <motion.div key="off" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <VolumeX className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mic Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isListening ? stopListening : startListening}
              disabled={disabled}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isListening
                  ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </motion.button>

            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={disabled || !input.trim()}
              className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
