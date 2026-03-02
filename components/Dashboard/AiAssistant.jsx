"use client"
import React, { useState, useRef, useEffect } from 'react';
import {
    MessageSquare,
    X,
    Send,
    Bot,
    User,
    Loader2,
    Sparkles,
    Command,
    Utensils,
    CreditCard,
    Bed,
    AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "@/hooks/Authstate";
import ReactMarkdown from 'react-markdown';

const AiAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([
        { role: 'bot', content: "Hello! I'm your **Hostel AI**. \n\nI can help you check the **mess menu**, view **pending bills**, or check your **room details**. \n\nHow can I assist you today?" }
    ]);
    const [suggestions, setSuggestions] = useState(["Mess menu", "My bill status", "Report a problem"]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chat]);

    // Fetch chat history from DB on load
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

    const handleSend = async (e, customMsg = null) => {
        if (e) e.preventDefault();
        const msgToSend = customMsg || message;
        if (!msgToSend.trim() || isLoading) return;

        const userMsg = msgToSend;
        setMessage('');
        setChat(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/ai-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, userId: user?.id })
            });
            const data = await res.json();

            if (data.success) {
                setChat(prev => [...prev, { role: 'bot', content: data.reply }]);
                if (data.suggestions) {
                    setSuggestions(data.suggestions);
                }
            } else {
                setChat(prev => [...prev, { role: 'bot', content: "Oops! I'm having trouble connecting to the hostel servers. Please try again later." }]);
            }
        } catch (err) {
            setChat(prev => [...prev, { role: 'bot', content: "Something went wrong. Please check your connection." }]);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute bottom-20 right-0 w-[340px] h-[580px] bg-white rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden flex flex-col"
                    >
                        {/* Slim Header */}
                        <div className="px-6 py-5 bg-white border-b border-gray-50 relative">
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-[13px] font-black tracking-tight uppercase leading-none text-gray-900">Hostel AI</h3>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <div className="h-1 w-1 bg-emerald-500 rounded-full" />
                                            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-gray-400">System Online</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="h-8 w-8 flex items-center justify-center hover:bg-gray-50 rounded-lg transition-colors text-gray-400"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>



                        {/* Chat area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide"
                        >
                            {chat.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={i}
                                    className={`flex ${msg.role === 'bot' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`max-w-[85%] flex gap-2.5 ${msg.role === 'bot' ? 'flex-row' : 'flex-row-reverse'}`}>
                                        <div className={`p-3.5 rounded-[1.25rem] text-[12px] leading-relaxed font-semibold shadow-sm overflow-hidden ${msg.role === 'bot'
                                            ? 'bg-gray-50 text-gray-700 rounded-tl-none border border-gray-100/50'
                                            : 'bg-indigo-600 text-white rounded-tr-none'
                                            }`}>
                                            <div className="prose prose-sm max-w-none break-words leading-relaxed">
                                                <ReactMarkdown
                                                    components={{
                                                        p: ({ children }) => <p className="m-0 break-words leading-relaxed">{children}</p>,
                                                        strong: ({ children }) => <span className={`font-black ${msg.role === 'bot' ? 'text-indigo-600 bg-indigo-50/50 px-1 rounded' : 'text-white underline decoration-indigo-300'}`}>{children}</span>,
                                                        ul: ({ children }) => <ul className="m-0 mt-2 list-none p-0 space-y-1">{children}</ul>,
                                                        li: ({ children }) => <li className="flex items-start gap-1.5 before:content-['•'] before:text-indigo-400">{children}</li>
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="p-3.5 bg-gray-50 rounded-2xl rounded-tl-none border border-gray-100/50 flex items-center gap-3">
                                        <div className="flex gap-1">
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="h-1 w-1 bg-indigo-400 rounded-full" />
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1 w-1 bg-indigo-400 rounded-full" />
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1 w-1 bg-indigo-400 rounded-full" />
                                        </div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">AI is typing</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Message Suggestions */}
                        {!isLoading && suggestions.length > 0 && (
                            <div className="px-5 py-2 flex flex-wrap gap-2">
                                {suggestions.map((suggestion, idx) => (
                                    <motion.button
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleSend(null, suggestion)}
                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors"
                                    >
                                        {suggestion}
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Input - Slimmer */}
                        <form onSubmit={(e) => handleSend(e)} className="p-5 bg-white">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full h-11 pl-4 pr-12 bg-gray-50 border border-gray-100 rounded-xl text-[12px] font-bold transition-all focus:bg-white focus:border-indigo-600 outline-none placeholder:text-gray-300"
                                />
                                <button
                                    type="submit"
                                    disabled={!message.trim() || isLoading}
                                    className="absolute right-1.5 top-1.5 h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-300 transition-all"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden group border ${isOpen ? 'bg-white border-gray-100 text-gray-900 shadow-xl' : 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/20'
                    }`}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <div className="relative">
                        <MessageSquare className="w-6 h-6" />
                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-rose-500 rounded-full border-2 border-indigo-600 animate-pulse" />
                    </div>
                )}
            </motion.button>
        </div>
    );
};

export default AiAssistant;
