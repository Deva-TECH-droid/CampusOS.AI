import { useState, useEffect, useRef } from "react";
import {
  Bot,
  X,
  Send,
  Loader2,
  Sparkles,
  Star,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  Minimize2,
  Maximize2,
  RotateCcw,
} from "lucide-react";
import { sendChatMessage, getChatHistory, submitFeedback } from "../../api/chatbot.api";

const QUICK_PROMPTS = [
  "What events are happening today?",
  "What subject does Mr. Rohit teach?",
  "Which classes does Mr. Devansh teach?",
  "Does the Sports Club have any activity today?",
  "Is there any placement drive today?",
  "Is there an alumni talk today?",
  "Are there any important campus announcements?",
  "Has a new teacher joined the campus?",
];

export default function CampusChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Feedback form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Load history
      getChatHistory()
        .then(({ data }) => {
          const fetched = data?.data?.messages || [];
          if (fetched.length > 0) {
            setMessages(fetched);
          } else if (messages.length === 0) {
            setMessages([
              {
                role: "assistant",
                content:
                  "Hello! I am your CampusOS AI Assistant. I can answer questions regarding classes, timetable, clubs, upcoming events, placement drives, alumni talks, and teacher assignments. How can I help you today?",
              },
            ]);
          }
        })
        .catch(() => {
          if (messages.length === 0) {
            setMessages([
              {
                role: "assistant",
                content:
                  "Hello! I am your CampusOS AI Assistant. Ask me about events, teachers, clubs, schedules, or announcements!",
              },
            ]);
          }
        });
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg = { role: "user", content: query, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await sendChatMessage(query);
      const reply = data?.data?.reply || "The information is currently unavailable.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, createdAt: new Date() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err?.response?.data?.message ||
            "Unable to connect to campus services right now. Please try again in a moment.",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      setFeedbackError("Please share a short review.");
      return;
    }
    setSubmittingFeedback(true);
    setFeedbackError("");

    try {
      await submitFeedback({
        rating,
        message: feedbackText.trim(),
        category: "Campus Assistant",
      });
      setFeedbackSuccess(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSuccess(false);
        setFeedbackText("");
      }, 2500);
    } catch (err) {
      setFeedbackError(err?.response?.data?.message || "Couldn't submit feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-gray-900 to-indigo-950 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 group border border-white/10"
          aria-label="Open Campus AI Assistant"
        >
          <div className="relative">
            <Bot size={20} className="text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse border-2 border-gray-900" />
          </div>
          <span className="text-xs font-semibold tracking-wide">Campus AI</span>
          <Sparkles size={14} className="text-amber-400 opacity-80" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden ${
            isExpanded
              ? "inset-4 sm:inset-10"
              : "bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-slate-900 px-4 py-3.5 text-white flex items-center justify-between shrink-0 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  CampusOS AI Assistant
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                    Live
                  </span>
                </h3>
                <p className="text-[11px] text-gray-400">Connected to Campus Database</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowFeedback((v) => !v)}
                className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                  showFeedback ? "text-amber-400" : "text-gray-400"
                }`}
                title="Rate CampusOS"
              >
                <Star size={16} />
              </button>
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors hidden sm:block"
                title={isExpanded ? "Restore size" : "Expand window"}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Feedback Form Modal / Drawer */}
          {showFeedback && (
            <div className="bg-gradient-to-b from-amber-50/90 to-white p-4 border-b border-amber-100 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  How was your CampusOS experience?
                </span>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                >
                  Close
                </button>
              </div>

              {feedbackSuccess ? (
                <div className="py-3 flex items-center justify-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                  <CheckCircle2 size={16} />
                  <span>Thank you! Feedback recorded for Admin review.</span>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-2">
                  {/* Star selection */}
                  <div className="flex items-center gap-1 justify-center py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-gray-300 transition-colors"
                      >
                        <Star
                          size={22}
                          className={`${
                            (hoverRating || rating) >= star
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-200"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-gray-600 ml-2">
                      {rating} / 5
                    </span>
                  </div>

                  <textarea
                    rows={2}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us what you like or how we can improve CampusOS..."
                    className="w-full text-xs rounded-lg border border-gray-200 p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                  />

                  {feedbackError && (
                    <p className="text-[11px] text-red-600">{feedbackError}</p>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      disabled={submittingFeedback}
                      className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                    >
                      {submittingFeedback ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : null}
                      Submit Feedback
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-gray-900 text-emerald-400 flex items-center justify-center shrink-0 text-xs mt-0.5">
                    <Bot size={13} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-gray-900 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-none font-normal"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 pl-2">
                <Loader2 size={14} className="animate-spin text-emerald-600" />
                <span>Searching CampusOS database…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips Carousel */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 shrink-0">
            <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-1.5">
              Suggested questions
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="whitespace-nowrap shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors border border-gray-200/50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about classes, teachers, events, clubs…"
              className="flex-1 text-xs rounded-xl border border-gray-200 px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50/50 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-40 transition-colors shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
