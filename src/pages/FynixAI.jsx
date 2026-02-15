import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendChat, getChatHistory, getConversation } from "../services/api"; // Updated imports

import {
    Send,
    Bot,
    User,
    Sparkles,
    X,
    AlertCircle,
    CheckCircle2,
    PanelLeftClose,
    MessageSquare,
    Loader2,
    Menu
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* HELPER FUNCTIONS                                                           */
/* -------------------------------------------------------------------------- */

const extractMessage = (data) => {
    if (!data) return "";
    if (typeof data === "string") {
        try {
            const parsed = JSON.parse(data);
            return extractMessage(parsed);
        } catch {
            return data;
        }
    }
    if (typeof data === "object") {
        return data.answer || data.query || data.message || data.text || JSON.stringify(data);
    }
    return String(data);
};

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS                                                             */
/* -------------------------------------------------------------------------- */

const FormattedText = ({ content }) => {
    return (
        <div className="text-sm md:text-base text-zinc-300 leading-7 font-light break-words">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h3: ({ children }) => (
                        <h3 className="text-lg font-semibold text-white mt-6 mb-3 flex items-center gap-2 border-l-2 border-emerald-500 pl-3">
                            {children}
                        </h3>
                    ),
                    strong: ({ children }) => (
                        <span className="font-bold text-emerald-400">{children}</span>
                    ),
                    ul: ({ children }) => <ul className="space-y-2 mb-4 mt-2 list-none">{children}</ul>,
                    li: ({ children }) => (
                        <li className="flex gap-2 items-start">
                            <span className="mt-2.5 w-1.5 h-1.5 bg-zinc-500 rounded-full flex-shrink-0" />
                            <span>{children}</span>
                        </li>
                    ),
                    p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                    code: ({ inline, children }) =>
                        inline ? (
                            <code className="bg-zinc-800 text-emerald-300 px-1 py-0.5 rounded text-xs">{children}</code>
                        ) : (
                            <code className="block bg-zinc-900 p-3 rounded-lg text-xs overflow-x-auto my-2">{children}</code>
                        )
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

const Toast = ({ message, type, onClose }) => (
    <div className={`fixed top-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl border shadow-2xl backdrop-blur-xl z-[60] animate-in slide-in-from-right-10 duration-300 max-w-[90vw] ${
        type === "error" ? "bg-red-950/90 border-red-800 text-red-100" : "bg-zinc-900/90 border-zinc-700 text-zinc-100"
    }`}>
        {type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} className="text-emerald-400" />}
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
);

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function FynixAI({ onClose }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [conversationId, setConversationId] = useState(null); // NEW: Track active conversation
    const bottomRef = useRef(null);

    // Sidebar State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historySessions, setHistorySessions] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsHistoryOpen(true);
            } else {
                setIsHistoryOpen(false);
            }
        };
        handleResize();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    const showToast = (m, t = "success") => setToast({ message: m, type: t });

    /* --- API History Logic --- */

    const loadApiHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await getChatHistory();
            const allHistory = res.data || [];

            // Group raw history into unique sessions based on conversationId
            const uniqueSessions = [];
            const seenIds = new Set();

            // Reversing assumes the backend returns older messages first. Adjust if needed.
            [...allHistory].reverse().forEach(item => {
                if (item.conversationId && !seenIds.has(item.conversationId)) {
                    seenIds.add(item.conversationId);
                    uniqueSessions.push({
                        conversationId: item.conversationId,
                        title: item.query || "Chat Session"
                    });
                }
            });

            setHistorySessions(uniqueSessions);
        } catch (err) {
            console.error(err);
            showToast("Failed to load history", "error");
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (isHistoryOpen && historySessions.length === 0) {
            loadApiHistory();
        }
    }, [isHistoryOpen]);

    const selectHistorySession = async (session) => {
        setLoadingHistory(true);
        try {
            const res = await getConversation(session.conversationId);
            const conversationData = res.data || [];

            // 🔍 LOG THIS: Look in your browser console to see exactly what Spring Boot sends!
            console.log("Raw Backend History Data:", conversationData);

            const formattedMessages = [];

            conversationData.forEach((item) => {
                // 1. Get the User's question
                const userText = item.query || item.message || item.prompt;
                if (userText) {
                    formattedMessages.push({ role: "user", content: userText });
                }

                // 2. Get the AI's answer (Checking every possible Jackson/JSON naming variation)
                const botText = item.aiAnswer || item.aIAnswer || item.ai_answer || item.answer || item.response || item.botResponse || item.content;

                if (botText) {
                    formattedMessages.push({ role: "assistant", content: botText });
                }
            });

            setMessages(formattedMessages);
            setConversationId(session.conversationId);

            if (window.innerWidth < 768) {
                setIsHistoryOpen(false);
            }
        } catch (error) {
            console.error("Error loading chat:", error);
            showToast("Error loading conversation", "error");
        } finally {
            setLoadingHistory(false);
        }
    };
    /* --- Send Logic --- */
    const sendMessage = async (overrideText = null) => {
        const textToSend = (typeof overrideText === 'string' ? overrideText : input).trim();
        if (!textToSend || loading) return;

        setMessages((prev) => [...prev, { role: "user", content: textToSend }]);
        setInput("");
        setLoading(true);

        try {
            // Pass the current conversationId, if any
            const res = await sendChat({ message: textToSend, conversationId });

            const cleanAnswer = extractMessage(res.data.answer || res.data);
            const returnedConversationId = res.data.conversationId;

            // If this was a new chat, update the state and refresh the sidebar
            if (!conversationId && returnedConversationId) {
                setConversationId(returnedConversationId);
                loadApiHistory();
            }

            setMessages((prev) => [...prev, { role: "assistant", content: cleanAnswer }]);
        } catch (err) {
            console.error(err);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "⚠️ System Error: Unable to fetch financial data." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setConversationId(null); // Reset the ID for a fresh chat
        if (window.innerWidth < 768) {
            setIsHistoryOpen(false);
        }
    };

    const handleCloseApp = () => {
        if (onClose && typeof onClose === 'function') {
            onClose();
        } else {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                showToast("Close action triggered (No parent handler)", "info");
            }
        }
    };

    return (
        <div className="flex h-screen w-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-emerald-500/30 overflow-hidden relative">

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            {/* --- MOBILE OVERLAY BACKDROP --- */}
            {isHistoryOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsHistoryOpen(false)}
                />
            )}

            {/* --- SIDEBAR --- */}
            <aside
                className={`
                    fixed md:relative inset-y-0 left-0 z-50
                    flex flex-col bg-zinc-950/95 md:bg-zinc-950/80 border-r border-zinc-800 
                    transition-all duration-300 ease-in-out
                    ${isHistoryOpen ? 'w-72 translate-x-0' : '-translate-x-full w-0 md:translate-x-0 md:w-0 md:overflow-hidden'}
                `}
            >
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center h-[73px] min-w-[288px]">
                    <h2 className="text-sm font-semibold text-zinc-300">Chat History</h2>
                    <button
                        onClick={() => setIsHistoryOpen(false)}
                        className="text-zinc-500 hover:text-white p-2 rounded-md hover:bg-zinc-800 transition-colors"
                    >
                        <PanelLeftClose size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1 min-w-[288px] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    <button
                        onClick={clearChat}
                        className="w-full text-left p-3 rounded-lg border border-zinc-700/50 hover:bg-zinc-800 text-white text-sm flex items-center gap-3 transition-colors mb-4"
                    >
                        <Bot size={16} className="text-emerald-500" />
                        <span className="font-medium">New Chat</span>
                    </button>

                    {loadingHistory ? (
                        <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
                            <Loader2 size={20} className="animate-spin mb-2" />
                            <span className="text-xs">Loading history...</span>
                        </div>
                    ) : historySessions.length === 0 ? (
                        <div className="text-center py-10 text-zinc-600 text-xs">
                            No recent chats.
                        </div>
                    ) : (
                        historySessions.map((session, i) => (
                            <button
                                key={session.conversationId || i}
                                onClick={() => selectHistorySession(session)}
                                className={`w-full text-left p-3 rounded-lg hover:bg-zinc-800/60 text-sm flex items-center gap-3 transition-colors group ${
                                    conversationId === session.conversationId
                                        ? "bg-zinc-800/80 text-zinc-200 border border-zinc-700/50"
                                        : "text-zinc-400 hover:text-zinc-200"
                                }`}
                            >
                                <MessageSquare size={14} className={`flex-shrink-0 transition-colors ${
                                    conversationId === session.conversationId ? "text-emerald-500" : "text-zinc-600 group-hover:text-emerald-500"
                                }`} />
                                <span className="truncate">{session.title}</span>
                            </button>
                        ))
                    )}
                </div>
            </aside>

            {/* --- MAIN CHAT AREA --- */}
            <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative h-full">
                <header className="flex-none border-b border-zinc-800 z-30 h-[73px] flex items-center bg-zinc-950/80 backdrop-blur-md">
                    <div className="w-full px-4 md:px-6 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                className={`p-2 rounded-lg transition-colors mr-1 text-zinc-400 hover:text-white hover:bg-zinc-800 ${isHistoryOpen ? 'md:hidden' : 'block'}`}
                                aria-label="Toggle Menu"
                            >
                                <Menu size={20} />
                            </button>

                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-900/10">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h1 className="text-base md:text-lg font-bold text-white tracking-tight">Fynix AI</h1>
                                <div className="hidden md:flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Financial Advisor</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto scroll-smooth pb-4 px-2 md:px-0">
                    <div className="max-w-3xl mx-auto px-2 md:px-4 py-6 md:py-8 space-y-8 md:space-y-10">
                        {!messages.length && (
                            <div className="flex flex-col items-center justify-center py-10 md:py-20 text-center animate-in fade-in zoom-in-95 duration-500 mt-5 md:mt-10">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl">
                                    <Bot size={32} className="text-emerald-500 md:w-10 md:h-10" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-white mb-3">How can I help you today?</h2>
                                <p className="text-sm md:text-base text-zinc-500 max-w-xs md:max-w-sm mb-8 leading-relaxed">
                                    Ask me to analyze your spending, build a debt strategy, or plan for your savings goals.
                                </p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {["Analyze spending", "Plan a Trip", "Debt strategy"].map((q) => (
                                        <button key={q} onClick={() => sendMessage(q)} className="px-3 py-2 md:px-4 md:py-2 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800 rounded-full text-xs md:text-sm text-zinc-400 hover:text-emerald-400 transition-all">
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((m, i) => (
                            <div key={i} className={`flex gap-3 md:gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border mt-1 ${
                                    m.role === "assistant" ? "bg-zinc-900 border-zinc-700 text-emerald-400" : "bg-zinc-100 border-white text-zinc-900"
                                }`}>
                                    {m.role === "assistant" ? <Sparkles size={14} /> : <User size={14} />}
                                </div>

                                <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-3 md:px-5 md:py-4 shadow-sm ${
                                    m.role === "user"
                                        ? "bg-zinc-100 text-zinc-900 font-medium text-sm md:text-base"
                                        : "bg-transparent text-zinc-300"
                                }`}>
                                    {m.role === "user" ? (
                                        <p>{m.content}</p>
                                    ) : (
                                        <FormattedText content={m.content} />
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center mt-1">
                                    <Bot size={14} className="animate-pulse text-emerald-500" />
                                </div>
                                <div className="flex gap-1 items-center h-8 px-5 py-4">
                                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-zinc-600 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-zinc-600 rounded-full animate-bounce delay-100" />
                                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-zinc-600 rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>
                </main>

                <footer className="p-3 md:p-4 border-t border-zinc-800 bg-zinc-950 pb-safe md:pb-6">
                    <div className="max-w-3xl mx-auto relative flex items-end gap-2 bg-zinc-900 border border-zinc-700 rounded-2xl p-2 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all shadow-lg">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                            placeholder="Message Fynix..."
                            className="flex-1 bg-transparent text-white placeholder-zinc-500 p-2 md:p-3 resize-none focus:outline-none text-sm md:text-[15px] min-h-[44px] max-h-32"
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                            className="p-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors mb-0.5 mr-0.5"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <div className="text-center mt-2 md:mt-3 hidden md:block">
                        <p className="text-[10px] md:text-[11px] text-zinc-600">AI can make mistakes. Verify important financial info.</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}