"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Bot,
  User,
  Sparkles,
  Search,
  RefreshCw,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Copy,
  Check,
  Zap,
  ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import AiActionCard from "@/components/Dashboard/AiActionCard";
import { format } from "date-fns";
import { toast } from "sonner";
import { useUserAiHistory } from "@/hooks/useusers";

export default function UserAiChatHistory({ userId, userName }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [filterRole, setFilterRole] = useState("ALL"); // ALL | USER | BOT
  const chatScrollRef = useRef(null);

  const { data: messages = [], isLoading, isRefetching, refetch, error } = useUserAiHistory(userId);

  // Scroll to bottom on load or message update
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopy = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Message text copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    return messages.filter((m) => {
      const matchesSearch =
        !searchQuery.trim() ||
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.cardType && m.cardType.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole =
        filterRole === "ALL" ||
        (filterRole === "USER" && m.role === "user") ||
        (filterRole === "BOT" && (m.role === "bot" || m.role === "AI"));

      return matchesSearch && matchesRole;
    });
  }, [messages, searchQuery, filterRole]);

  const stats = useMemo(() => {
    if (!messages) return { total: 0, userPrompts: 0, aiReplies: 0, lastActive: null };
    const total = messages.length;
    const userPrompts = messages.filter((m) => m.role === "user").length;
    const aiReplies = messages.filter((m) => m.role === "bot" || m.role === "AI").length;
    const lastMsg = messages[messages.length - 1];
    return {
      total,
      userPrompts,
      aiReplies,
      lastActive: lastMsg ? lastMsg.createdAt : null,
    };
  }, [messages]);

  return (
    <div className="space-y-5">
      {/* Light Clean Executive Header Banner */}
      <div className="rounded-3xl bg-white dark:bg-card border border-slate-200 dark:border-border p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-foreground tracking-tight">
                  AI Chat History
                </h2>
                <Badge className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-[10px] font-bold uppercase tracking-wider">
                  {userName || "User"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                Complete record of prompts, HostelAI copilot responses, and logged tickets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              variant="outline"
              className="h-10 px-4 rounded-xl border-slate-200 dark:border-border text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-muted gap-2 text-xs font-semibold"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isRefetching ? "animate-spin text-indigo-600" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid — Clean Light Theme */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-border/60">
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-muted/30 border border-slate-100 dark:border-border/50">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
              <span>Total Messages</span>
            </div>
            <div className="mt-1 text-2xl font-black text-slate-900 dark:text-foreground">{stats.total}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-muted/30 border border-slate-100 dark:border-border/50">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <User className="h-3.5 w-3.5 text-blue-600" />
              <span>User Queries</span>
            </div>
            <div className="mt-1 text-2xl font-black text-slate-900 dark:text-foreground">{stats.userPrompts}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-muted/30 border border-slate-100 dark:border-border/50">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Bot className="h-3.5 w-3.5 text-purple-600" />
              <span>AI Replies</span>
            </div>
            <div className="mt-1 text-2xl font-black text-slate-900 dark:text-foreground">{stats.aiReplies}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-muted/30 border border-slate-100 dark:border-border/50">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              <span>Last Active</span>
            </div>
            <div className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {stats.lastActive ? format(new Date(stats.lastActive), "MMM dd, h:mm a") : "No Activity"}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-border shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search message text, complaint tags..."
            className="pl-10 h-9.5 rounded-xl bg-slate-50 dark:bg-muted/40 border-slate-200 dark:border-border text-xs focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {["ALL", "USER", "BOT"].map((r) => (
            <Button
              key={r}
              onClick={() => setFilterRole(r)}
              variant={filterRole === r ? "default" : "outline"}
              className={`h-8 px-3 rounded-lg text-xs font-semibold ${
                filterRole === r
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs"
                  : "bg-slate-50 dark:bg-muted/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-border hover:bg-slate-100"
              }`}
            >
              {r === "ALL" ? "All" : r === "USER" ? "User Only" : "HostelAI Only"}
            </Button>
          ))}
        </div>
      </div>

      {/* Scrollable Container Box for Chat Messages */}
      <div className="rounded-3xl bg-white dark:bg-card border border-slate-200 dark:border-border shadow-xs overflow-hidden">
        {/* Box Header Bar */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-muted/40 border-b border-slate-200 dark:border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-black text-slate-800 dark:text-foreground uppercase tracking-wider">
              Message History Feed ({filteredMessages.length})
            </h3>
          </div>

          {filteredMessages.length > 0 && (
            <button
              onClick={scrollToBottom}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Scroll to bottom</span>
              <ArrowDown className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Scrollable Thread Box */}
        <div
          ref={chatScrollRef}
          className="h-[520px] overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-indigo-200 dark:scrollbar-thumb-slate-700 bg-slate-50/40 dark:bg-background/20"
        >
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Loading conversation transcript...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs text-center">
              Failed to load chat history: {error.message}
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center p-8">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-muted flex items-center justify-center text-slate-400">
                <Bot className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                No Messages Found
              </h4>
              <p className="text-xs text-slate-500 max-w-sm">
                {searchQuery
                  ? "No messages match your search term."
                  : "This user has not started any conversation with HostelAI yet."}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const isBot = msg.role === "bot" || msg.role === "AI";
              return (
                <div
                  key={msg.id || idx}
                  className={`rounded-2xl p-4.5 border transition-all ${
                    isBot
                      ? "bg-white dark:bg-card border-slate-200 dark:border-border shadow-2xs"
                      : "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40 border-l-4 border-l-indigo-600"
                  }`}
                >
                  {/* Header info inside message item */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-border/40">
                    <div className="flex items-center gap-2">
                      {isBot ? (
                        <div className="h-7 w-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Bot className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <User className="h-4 w-4" />
                        </div>
                      )}

                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {isBot ? "HostelAI Copilot" : userName || "User"}
                      </span>

                      <Badge
                        className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                          isBot
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200"
                            : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200"
                        }`}
                      >
                        {isBot ? "AI RESPONSE" : "USER PROMPT"}
                      </Badge>

                      {msg.cardType && (
                        <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 text-[9px] font-mono">
                          ⚡ {msg.cardType}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {msg.createdAt ? format(new Date(msg.createdAt), "MMM dd, h:mm a") : ""}
                      </span>

                      {msg.feedback && (
                        <Badge
                          className={`text-[9px] gap-1 px-1.5 py-0.5 rounded font-bold ${
                            msg.feedback === "UP" || msg.feedback === "LIKE"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {msg.feedback === "UP" || msg.feedback === "LIKE" ? (
                            <>
                              <ThumbsUp className="h-2.5 w-2.5" /> Helpful
                            </>
                          ) : (
                            <>
                              <ThumbsDown className="h-2.5 w-2.5" /> Unhelpful
                            </>
                          )}
                        </Badge>
                      )}

                      <Button
                        onClick={() => handleCopy(msg.id || idx, msg.content)}
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Copy text"
                      >
                        {copiedId === (msg.id || idx) ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Action Card Preview if present */}
                  {msg.cardType && msg.cardData && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-border/40">
                      <AiActionCard cardType={msg.cardType} cardData={msg.cardData} />
                    </div>
                  )}

                  {/* Suggestions list */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Options:</span>
                      {msg.suggestions.map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-muted text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-border font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
