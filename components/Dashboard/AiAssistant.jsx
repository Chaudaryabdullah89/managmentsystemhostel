"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  Copy,
  Trash2,
  Check,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "@/hooks/Authstate";
import ReactMarkdown from "react-markdown";
import AiActionCard from "./AiActionCard";
import { toast } from "sonner";

const AiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    {
      role: "bot",
      content:
        "Hello! I'm **HostelAI** 👋\n\nI can help you check **today's mess menu**, view **pending bills**, check **room details**, or **file a complaint** directly!\n\nHow can I assist you today?",
    },
  ]);
  const [suggestions, setSuggestions] = useState([
    "Today's Mess Menu",
    "My bill status",
    "Report a problem",
    "My room info",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceLang, setVoiceLang] = useState("en-US");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const user = useAuthStore((state) => state.user);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, isLoading]);

  // Fetch existing chat history from DB
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/ai-assistant?userId=${user.id}`);
        const data = await res.json();
        if (data.success && data.messages && data.messages.length > 0) {
          setChat(data.messages);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
    fetchHistory();
  }, [user?.id]);

  // Setup Web Speech API for voice input
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
        // Phase 7: Auto-submit in Voice Mode
        if (voiceMode) {
          setTimeout(() => handleSend(null, transcript), 200);
        }
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [voiceMode]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Voice recognition is not supported in your browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Phase 7: Set language based on voiceLang toggle
      recognitionRef.current.lang = voiceLang;
      recognitionRef.current.start();
      setIsListening(true);
      toast.info(voiceMode ? "Voice Mode ON — Speak, it will auto-send!" : "Listening... Speak now!");
    }
  };

  const toggleVoiceMode = () => {
    setVoiceMode((prev) => {
      const next = !prev;
      toast.info(next ? "🎤 Voice Mode ON — Speak freely, HostelAI will auto-respond!" : "Voice Mode OFF");
      return next;
    });
  };

  const toggleVoiceLang = () => {
    setVoiceLang((prev) => {
      const next = prev === "en-US" ? "ur-PK" : "en-US";
      toast.info(next === "ur-PK" ? "🇵🇰 Roman Urdu mode activated" : "🇺🇸 English mode activated");
      return next;
    });
  };

  const speakMessage = (text) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success("Response copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Phase 3: Poll for unread proactive messages every 60 seconds
  useEffect(() => {
    if (!user?.id) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/ai-assistant?unreadOnly=true`);
        const data = await res.json();
        if (data.success) setUnreadCount(data.unreadCount || 0);
      } catch (_) {}
    };
    poll();
    const interval = setInterval(poll, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleFeedback = async (messageId, rating, idx) => {
    try {
      const msg = chat[idx];
      // find the preceding user message for context
      const prevUserMsg = chat.slice(0, idx).reverse().find(m => m.role === "user");
      setChat((prev) =>
        prev.map((m, i) => (i === idx ? { ...m, feedback: rating } : m)),
      );
      if (rating === "LIKE" || rating === "up") {
        toast.success("Thanks for the positive feedback! 🌟 HostelAI is learning.");
      } else {
        toast.info("Got it! HostelAI will improve this response. Thank you! 🙏");
      }

      if (messageId) {
        const patchRes = await fetch("/api/ai-assistant", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId,
            feedback: rating === "LIKE" ? "up" : "down",
            context: prevUserMsg?.content || null,
            reply: msg?.content || null
          }),
        });
        const patchData = await patchRes.json();
        // Phase 10: If AI improved the response, update it in chat
        if (patchData.improved && patchData.improvedReply) {
          setChat((prev) =>
            prev.map((m, i) => (i === idx ? { ...m, content: patchData.improvedReply } : m))
          );
          toast.success("✨ HostelAI just improved this response based on your feedback!");
        }
      }
    } catch (err) {
      console.error("Failed to record feedback:", err);
    }
  };

  const handleSend = async (e, customMsg = null) => {
    if (e) e.preventDefault();
    const msgToSend = customMsg || message;
    if (!msgToSend.trim() || isLoading) return;

    const userMsg = msgToSend;
    setMessage("");
    setChat((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, userId: user?.id }),
      });
      const data = await res.json();

      if (data.success) {
        const botMsg = {
          id: data.messageId,
          role: "bot",
          content: data.reply,
          cardType: data.cardType,
          cardData: data.cardData,
          isProactive: false,
        };
        setChat((prev) => [...prev, botMsg]);
        if (data.suggestions) setSuggestions(data.suggestions);
        // Phase 7: Auto-read in voice mode
        if (voiceMode && data.reply) speakMessage(data.reply);
      } else {
        setChat((prev) => [
          ...prev,
          {
            role: "bot",
            content:
              "Oops! I'm having trouble connecting to the hostel servers right now. Please try again.",
          },
        ]);
      }
    } catch (err) {
      setChat((prev) => [
        ...prev,
        {
          role: "bot",
          content:
            "Something went wrong. Please check your network connection.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRolePersona = () => {
    if (user?.role === "ADMIN") return "Executive AI Analyst";
    if (user?.role === "WARDEN") return "Warden Copilot";
    return "Resident Concierge";
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-20 right-0 w-[380px] sm:w-[420px] h-[640px] bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] border border-indigo-100 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white relative">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
                    <Bot className="w-5 h-5 text-indigo-200" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black tracking-tight text-white">
                        HostelAI
                      </h3>
                      <span className="px-2 py-0.5 text-[8px] font-extrabold bg-indigo-500/40 text-indigo-100 rounded-full border border-indigo-400/30 uppercase">
                        {getRolePersona()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-200">
                        Agentic Copilot Ready
                      </span>
                    </div>
                  </div>
                </div>

              <div className="flex items-center gap-1">
                  {/* Phase 7: Voice Mode toggle */}
                  <button
                    onClick={toggleVoiceMode}
                    title={voiceMode ? "Voice Mode ON — click to disable" : "Enable Voice Mode"}
                    className={`h-8 w-8 flex items-center justify-center rounded-xl transition-colors ${
                      voiceMode
                        ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/40"
                        : "hover:bg-white/10 text-indigo-300 hover:text-white"
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                  {/* Phase 7: Roman Urdu / English voice lang toggle */}
                  <button
                    onClick={toggleVoiceLang}
                    title={voiceLang === "ur-PK" ? "Urdu Mode — click for English" : "English Mode — click for Urdu"}
                    className="h-8 w-8 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors text-indigo-200 hover:text-white text-[9px] font-black"
                  >
                    {voiceLang === "ur-PK" ? "اُر" : "EN"}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors text-indigo-200 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 scrollbar-thin scrollbar-thumb-indigo-100"
            >
              {chat.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={`flex ${msg.role === "bot" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[90%] flex gap-2.5 ${msg.role === "bot" ? "flex-row" : "flex-row-reverse"}`}
                  >
                    <div
                      className={`p-4 rounded-[1.5rem] text-[12.5px] leading-relaxed shadow-xs ${
                        msg.role === "bot"
                          ? "bg-white text-gray-800 rounded-tl-xs border border-gray-100"
                          : "bg-indigo-600 text-white rounded-tr-xs font-medium"
                      }`}
                    >
                      {/* Phase 3: Proactive message indicator */}
                      {msg.isProactive && (
                        <div className="flex items-center gap-1 mb-2 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5 w-fit">
                          <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse" />
                          Proactive Alert
                        </div>
                      )}
                      <div className="prose prose-sm max-w-none break-words leading-relaxed">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p className="m-0 leading-relaxed">{children}</p>
                            ),
                            strong: ({ children }) => (
                              <span
                                className={`font-bold ${
                                  msg.role === "bot"
                                    ? "text-indigo-700 bg-indigo-50 px-1 rounded"
                                    : "text-white underline"
                                }`}
                              >
                                {children}
                              </span>
                            ),
                            ul: ({ children }) => (
                              <ul className="m-0 mt-2 list-none p-0 space-y-1">
                                {children}
                              </ul>
                            ),
                            li: ({ children }) => (
                              <li className="flex items-start gap-1.5 before:content-['•'] before:text-indigo-500">
                                {children}
                              </li>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {/* Render Interactive Action Card */}
                      {msg.cardType && (
                        <AiActionCard
                          cardType={msg.cardType}
                          cardData={msg.cardData}
                          onAction={(text) => handleSend(null, text)}
                        />
                      )}

                      {/* Card Quick Actions */}
                      {msg.role === "bot" && (
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-50 text-gray-400">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleFeedback(msg.id, "LIKE", i)}
                              title="Helpful"
                              className={`p-1 transition-colors rounded ${msg.feedback === "LIKE" ? "text-emerald-600 bg-emerald-50" : "hover:text-emerald-600"}`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleFeedback(msg.id, "DISLIKE", i)
                              }
                              title="Not helpful — HostelAI will regenerate"
                              className={`p-1 transition-colors rounded ${msg.feedback === "DISLIKE" ? "text-rose-600 bg-rose-50" : "hover:text-rose-600"}`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => speakMessage(msg.content)}
                              title="Read Aloud (TTS)"
                              className={`p-1 transition-colors rounded ${
                                voiceMode ? "text-indigo-600 bg-indigo-50" : "hover:text-indigo-600"
                              }`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => copyToClipboard(msg.content, i)}
                              title="Copy text"
                              className="p-1 hover:text-indigo-600 transition-colors rounded"
                            >
                              {copiedIndex === i ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="p-4 bg-white rounded-2xl rounded-tl-xs border border-indigo-50 flex items-center gap-3 shadow-xs">
                    <div className="flex gap-1.5">
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="h-1.5 w-1.5 bg-indigo-500 rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          delay: 0.2,
                        }}
                        className="h-1.5 w-1.5 bg-indigo-500 rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          delay: 0.4,
                        }}
                        className="h-1.5 w-1.5 bg-indigo-500 rounded-full"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                      Analyzing DB Context...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions Bar */}
            {!isLoading && suggestions.length > 0 && (
              <div className="px-4 py-2 bg-slate-50 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(null, sug)}
                    className="px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-800 text-[10.5px] font-semibold rounded-full border border-indigo-100 whitespace-nowrap transition-colors shadow-2xs"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Input Footer */}
            <form
              onSubmit={(e) => handleSend(e)}
              className="p-4 bg-white border-t border-gray-100"
            >
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-rose-500 text-white animate-pulse shadow-rose-200 shadow-lg"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                  title="Voice Input"
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                <div className="relative flex-1">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      isListening ? "Listening..." : "Ask HostelAI anything..."
                    }
                    className="w-full h-11 pl-4 pr-11 bg-gray-50 border border-gray-200 rounded-2xl text-[12px] font-semibold transition-all focus:bg-white focus:border-indigo-600 outline-none placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className="absolute right-1.5 top-1.5 h-8 w-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setUnreadCount(0);
        }}
        className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-xl transition-all relative overflow-hidden group border ${
          isOpen
            ? "bg-white border-gray-200 text-gray-900 shadow-2xl"
            : "bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 border-indigo-500 text-white shadow-indigo-600/30"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-emerald-400 rounded-full border-2 border-indigo-700 animate-pulse" />
            {/* Phase 3: Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-2 -left-2 h-4 min-w-[16px] px-1 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white shadow">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </motion.button>
    </div>
  );
};

export default AiAssistant;
