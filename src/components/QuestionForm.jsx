import { useState } from "react";
import { motion } from "motion/react";
import { submitEntry } from "../services/firebase";
import { Send, MessageSquarePlus, User, Tag, HelpCircle, X, Heart, AlertTriangle, Loader2, ShieldAlert } from "lucide-react";

export default function QuestionForm({ 
  onSubmitEntry, 
  isSubmitting: externalIsSubmitting, 
  onClose,
  trainerId = "",
  activeModule = "Module 1"
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Question");
  const [content, setContent] = useState("");
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);

  // FIX 1: Combine boolean flags so internal state works even if parent passes boolean false
  const isSubmitting = Boolean(externalIsSubmitting) || internalIsSubmitting;

  // Check if a trainer session is active
  const isTrainerActive = Boolean(trainerId && trainerId.trim() !== "");

  const categories = [
    {
      id: "Question",
      label: "Question",
      icon: HelpCircle,
      activeColor: "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20",
      iconColor: "text-white",
    },
    {
      id: "Appreciation",
      label: "Appreciation",
      icon: Heart,
      activeColor: "bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/20",
      iconColor: "text-white",
    },
    {
      id: "Concern",
      label: "Concern",
      icon: AlertTriangle,
      activeColor: "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20",
      iconColor: "text-white",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent execution if no message content, currently submitting, OR no trainer logged in
    if (!content.trim() || isSubmitting || !isTrainerActive) return;

    // Immediately trigger local loading state
    setInternalIsSubmitting(true);

    try {
      const formattedName = name.trim() || "Anonymous";
      
      const result = await submitEntry({
        trainerId,
        module: activeModule,
        name: formattedName,
        type,
        content: content.trim(),
        question: content.trim(),
        status: "ACTIVE",
      });

      if (!result.success) {
        throw new Error("Failed to save to Firestore");
      }

      // FIX 2: Add a minimum delay so the loading spinner stays visible
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Local storage history persistence
      const existingThoughts = JSON.parse(localStorage.getItem("mySubmittedThoughts") || "[]");
      if (!existingThoughts.includes(content.trim())) {
        existingThoughts.push(content.trim());
        localStorage.setItem("mySubmittedThoughts", JSON.stringify(existingThoughts));
      }

      if (name.trim()) {
        localStorage.setItem("myParticipantName", name.trim());
      }

      // Optional callback for parent component updates
      if (onSubmitEntry) {
        await onSubmitEntry({ name: formattedName, type, content: content.trim(), id: result.id, trainerId, module: activeModule });
      }

      setName("");
      setContent("");
      if (onClose) onClose();
    } catch (err) {
      console.error("Error submitting entry to Firebase:", err);
    } finally {
      setInternalIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full space-y-2.5 min-h-0 pb-1 pr-1 w-full justify-end">
      <motion.form
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={handleSubmit}
        className="bg-white/95 border border-slate-200/80 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4 text-slate-800 flex flex-col justify-between flex-1 min-h-0 relative z-10 backdrop-blur-md overflow-hidden"
      >
        {/* Top Gradient Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-red-500" />

        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="border-b border-slate-100 pb-3.5 mb-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20 shrink-0">
                <MessageSquarePlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">Submit a Thought</h2>
                <p className="text-xs text-slate-500 font-medium">Ask questions or share reflections</p>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close form"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Warning notice when no trainer is logged in */}
          {!isTrainerActive && (
            <div className="mb-3.5 p-3 bg-red-50/80 border border-red-200/80 rounded-xl flex items-center gap-2.5 text-red-700 shrink-0 shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs font-semibold leading-tight">
                No active trainer session. Submissions are temporarily paused.
              </p>
            </div>
          )}

          {/* Form Fields Container */}
          <div className="space-y-4 flex flex-col flex-1">
            {/* Name Input */}
            <div className="space-y-1.5 shrink-0">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Name <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Juan Dela Cruz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting || !isTrainerActive}
                className="w-full px-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              />
            </div>

            {/* Entry Category Buttons */}
            <div className="space-y-1.5 shrink-0">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" /> Entry Category
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = type === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setType(cat.id)}
                      disabled={isSubmitting || !isTrainerActive}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isSelected
                          ? cat.activeColor
                          : "bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? cat.iconColor : "text-slate-400"}`} />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Input */}
            <div className="space-y-1.5 flex flex-col flex-1 min-h-[120px]">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> Your Message
              </label>
              <textarea
                placeholder={isTrainerActive ? "Write your thought, question, or appreciation..." : "Submissions are disabled until a trainer logs in."}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={isSubmitting || !isTrainerActive}
                className="w-full p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all flex-1 h-full disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={isSubmitting || !isTrainerActive ? {} : { scale: 1.01 }}
          whileTap={isSubmitting || !isTrainerActive ? {} : { scale: 0.98 }}
          type="submit"
          disabled={isSubmitting || !content.trim() || !isTrainerActive}
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed mt-3 text-sm shrink-0"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              Sending...
            </>
          ) : !isTrainerActive ? (
            "Waiting for Trainer Session..."
          ) : (
            <>
              <Send className="w-4 h-4 stroke-[2.5]" />
              Send to Thought Hub
            </>
          )}
        </motion.button>
      </motion.form>
    </div>
  );
}