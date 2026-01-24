import React, { useState, useRef, useEffect } from "react";
import { sendChat } from "../services/api";
import {
    Send,
    Bot,
    User,
    Sparkles,
    Save,
    Download,
    Trash2,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Target,
    HelpCircle,
    X,
    AlertCircle
} from 'lucide-react';

// --- Sub-components for Rich UI ---

const Toast = ({ message, type, onClose }) => (
    <div className={`fixed top-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-top-5 z-50
        ${type === 'error' ? 'bg-red-900/80 border-red-700/50 text-red-100' : 'bg-zinc-800/80 border-zinc-600/50 text-zinc-100'}`}>
        {type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-green-400" />}
        <p className="font-medium text-sm">{message}</p>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
);

const MetricCard = ({ label, value, highlight }) => (
    <div className="bg-zinc-900/50 border border-zinc-700/50 p-3 rounded-xl">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
        <p className={`font-mono font-semibold ${highlight ? 'text-green-400' : 'text-zinc-200'}`}>
            {value ?? "N/A"}
        </p>
    </div>
);

const RecommendationCard = ({ rec }) => {
    const priorityColors = {
        High: "text-red-400 border-red-400/20 bg-red-900/10",
        Medium: "text-amber-400 border-amber-400/20 bg-amber-900/10",
        Low: "text-blue-400 border-blue-400/20 bg-blue-900/10"
    };

    return (
        <div className="bg-zinc-900/40 border border-zinc-700/50 rounded-xl p-4 mb-3 hover:border-zinc-600 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-zinc-200 text-sm">{rec.title}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[rec.priority] || priorityColors.Low}`}>
                    {rec.priority}
                </span>
            </div>
            <p className="text-sm text-zinc-400 mb-3 leading-relaxed">{rec.description}</p>

            <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">
                    Impact: <span className="text-white font-mono">{rec.estimated_monthly_impact ?? "N/A"}</span>
                </span>
            </div>

            <div className="space-y-1.5">
                {rec.actions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-zinc-400">
                        <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                        <span>{action}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function FynixAI() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Auto-dismiss toast
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
    };

    // --- Actions ---

    const saveChat = () => {
        if (messages.length === 0) return showToast("No chat history to save.", 'error');
        try {
            localStorage.setItem('fynix-chat-history', JSON.stringify(messages));
            showToast("Chat history saved locally.");
        } catch (error) {
            showToast("Failed to save chat.", 'error');
        }
    };

    const loadChat = () => {
        try {
            const saved = localStorage.getItem('fynix-chat-history');
            if (!saved) return showToast("No saved history found.", 'error');

            if (messages.length > 0 && !window.confirm("Overwrite current chat?")) return;

            const parsedMessages = JSON.parse(saved);
            setMessages(parsedMessages);
            showToast("History restored successfully.");
        } catch (error) {
            showToast("Failed to load history.", 'error');
        }
    };

    const clearChat = () => {
        if (messages.length > 0 && window.confirm("Clear all messages?")) {
            setMessages([]);
            showToast("Chat cleared.");
        }
    };

    const sendMessage = async (overrideInput = null) => {
        const textToSend = overrideInput || input;
        if (!textToSend.trim() || isLoading) return;

        const userMessage = { role: "user", content: textToSend };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await sendChat(textToSend);
            let jsonResponse;

            if (typeof response.data === "string") {
                jsonResponse = JSON.parse(response.data);
            } else {
                jsonResponse = response.data;
            }

            if (jsonResponse && jsonResponse.error) {
                throw new Error(jsonResponse.error);
            }

            const assistantMessage = { role: "assistant", content: jsonResponse };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("AI Error:", error);
            const errorContent = {
                error: "I encountered an issue processing that request.",
                details: error.message
            };
            setMessages((prev) => [...prev, { role: "assistant", content: errorContent }]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Logic for AI Responses ---

    const renderAIContent = (content) => {
        if (content.error) {
            return (
                <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-xl flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                        <p className="text-red-300 font-medium">{content.error}</p>
                        {content.details && <p className="text-red-400/60 text-xs mt-1">{content.details}</p>}
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Summary Section */}
                {content.summary && (
                    <div className="text-zinc-300 leading-relaxed">
                        {content.summary}
                    </div>
                )}

                {/* Key Metrics Grid */}
                {content.key_metrics && (
                    <div className="grid grid-cols-2 gap-3">
                        <MetricCard label="Monthly Income" value={content.key_metrics.total_monthly_income} />
                        <MetricCard label="Monthly Spend" value={content.key_metrics.total_monthly_spend} />
                        <MetricCard label="Subscriptions" value={content.key_metrics.monthly_subscription_cost} />
                        <MetricCard label="Savings Rate" value={content.key_metrics.savings_rate} highlight />
                    </div>
                )}

                {/* Recommendations */}
                {content.recommendations?.length > 0 && (
                    <div className="space-y-2">
                        <h5 className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            <Sparkles className="w-3 h-3" /> Smart Recommendations
                        </h5>
                        {content.recommendations.map((rec, idx) => (
                            <RecommendationCard key={idx} rec={rec} />
                        ))}
                    </div>
                )}

                {/* Goal Alignment */}
                {content.goal_alignment?.length > 0 && (
                    <div className="space-y-2">
                        <h5 className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            <Target className="w-3 h-3" /> Goal Tracking
                        </h5>
                        {content.goal_alignment.map((goal, idx) => (
                            <div key={idx} className="bg-black/20 p-3 rounded-lg border border-zinc-800 flex items-center justify-between">
                                <span className="text-sm text-zinc-300">{goal.goal_name}</span>
                                <span className={`text-xs px-2 py-1 rounded-full border ${
                                    goal.alignment === "Aligned" ? "bg-green-900/20 border-green-800 text-green-400" :
                                        goal.alignment === "Partially aligned" ? "bg-amber-900/20 border-amber-800 text-amber-400" :
                                            "bg-red-900/20 border-red-800 text-red-400"
                                }`}>
                                    {goal.alignment}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Missing Data Warning */}
                {content.missing_data?.length > 0 && (
                    <div className="bg-amber-950/20 border border-amber-900/30 p-3 rounded-lg text-sm text-amber-400/80">
                        Missing details: {content.missing_data.join(", ")}
                    </div>
                )}

                {/* Quick Follow-ups (Chips) */}
                {content.follow_up_questions?.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                        {content.follow_up_questions.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => sendMessage(q)}
                                className="text-xs text-zinc-400 bg-zinc-800/50 hover:bg-zinc-700 hover:text-white border border-zinc-700 rounded-full px-3 py-1.5 transition-all text-left"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-zinc-950 via-neutral-950 to-stone-950 relative overflow-hidden text-zinc-200 font-sans">

            {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

            {/* Header */}
            <header className="flex-none bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-20 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-600/50 flex items-center justify-center shadow-lg shadow-black/50">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                                Fynix AI
                            </h1>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <p className="text-xs text-zinc-500 font-medium">Online & Ready</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                        <button onClick={saveChat} title="Save Chat" className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-all">
                            <Save className="w-4 h-4" />
                        </button>
                        <button onClick={loadChat} title="Load Chat" className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-all">
                            <Download className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-zinc-700 mx-1" />
                        <button onClick={clearChat} title="Clear History" className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-md transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
                <div className="max-w-3xl mx-auto space-y-8 pb-4">

                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-zinc-500/20 blur-3xl rounded-full" />
                                <Bot className="w-20 h-20 text-zinc-700 relative z-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
                            <p className="text-zinc-500 max-w-md mx-auto mb-8">
                                Analyze your subscriptions, check your spending habits, or ask for savings advice.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {[
                                    "Analyze my monthly spending",
                                    "How can I save more?",
                                    "Review my subscriptions"
                                ].map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(suggestion)}
                                        className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-sm text-zinc-400 hover:text-white transition-all"
                                    >
                                        "{suggestion}"
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                            {msg.role === "assistant" && (
                                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-1">
                                    <Sparkles className="w-4 h-4 text-zinc-400" />
                                </div>
                            )}

                            <div className={`max-w-[85%] lg:max-w-[75%] rounded-2xl p-5 shadow-lg ${
                                msg.role === "user"
                                    ? "bg-white text-zinc-900 rounded-tr-none"
                                    : "bg-zinc-900/80 border border-zinc-800 backdrop-blur-sm text-zinc-200 rounded-tl-none"
                            }`}>
                                {msg.role === "user" ? (
                                    <p className="text-sm md:text-base font-medium">{msg.content}</p>
                                ) : (
                                    renderAIContent(msg.content)
                                )}
                            </div>

                            {msg.role === "user" && (
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-1">
                                    <User className="w-4 h-4 text-black" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-4 justify-start animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="flex-none p-4 sm:p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-20">
                <div className="max-w-3xl mx-auto relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-700 to-zinc-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                    <div className="relative flex items-end gap-2 bg-zinc-900 rounded-2xl p-2 border border-zinc-800 shadow-2xl">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder="Ask Fynix about your finances..."
                            className="flex-1 bg-transparent text-white placeholder-zinc-500 p-3 max-h-32 min-h-[50px] resize-none focus:outline-none text-sm md:text-base scrollbar-hide"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                            className="p-3 bg-white text-black rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:bg-zinc-700 disabled:text-zinc-500 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-center text-xs text-zinc-600 mt-3">
                        Fynix AI can make mistakes. Double-check important financial info.
                    </p>
                </div>
            </div>
        </div>
    );
}