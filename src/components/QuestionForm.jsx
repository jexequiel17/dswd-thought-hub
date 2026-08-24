import { useState } from "react";
import { motion } from "motion/react";
import { submitEntry } from "../services/firebase";
import { Send, MessageSquarePlus, User, Tag, HelpCircle, X, Heart, AlertTriangle } from "lucide-react";

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

  const isSubmitting = externalIsSubmitting !== undefined ? externalIsSubmitting : internalIsSubmitting;

  const categories = [
    {
      id: "Question",
      label: "Question",
      icon: HelpCircle,
      activeColor: "bg-indigo-100 text-indigo-900 border-indigo-600 ring-2 ring-indigo-500",
      iconColor: "text-indigo-600",
    },
    {
      id: "Appreciation",
      label: "Appreciation",
      icon: Heart,
      activeColor: "bg-pink-100 text-pink-900 border-pink-600 ring-2 ring-pink-500",
      iconColor: "text-pink-600",
    },
    {
      id: "Concern",
      label: "Concern",
      icon: AlertTriangle,
      activeColor: "bg-amber-100 text-amber-900 border-amber-600 ring-2 ring-amber-500",
      iconColor: "text-amber-600",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setInternalIsSubmitting(true);

    try {
      const formattedName = name.trim() || "Anonymous";
      
      // Save directly to Firestore using submitEntry including trainerId & module
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
        await onSubmitEntry({ name: formattedName, type, content, id: result.id, trainerId, module: activeModule });
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
        className="bg-white border-2 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] space-y-4 text-black flex flex-col justify-between flex-1 min-h-0 relative z-10"
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="border-b-2 border-black/10 pb-3 mb-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#417dc1] border border-black rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <MessageSquarePlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-black leading-tight">Submit a Thought</h2>
                <p className="text-xs text-gray-600 font-bold">Ask questions or share reflections</p>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 border border-black cursor-pointer"
                aria-label="Close form"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Form Fields Container */}
          <div className="space-y-3.5 flex flex-col flex-1">
            {/* Name Input */}
            <div className="space-y-1.5 shrink-0">
              <label className="text-sm font-black text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#417dc1]" /> Name <span className="text-gray-500 font-bold text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Juan Dela Cruz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#FFFDF9] border-2 border-black/80 rounded-xl text-sm sm:text-base font-bold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6DA0DC] transition-all"
              />
            </div>

            {/* Entry Category Buttons */}
            <div className="space-y-1.5 shrink-0">
              <label className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#417dc1]" /> Entry Category
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
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border-2 font-black text-xs sm:text-sm transition-all cursor-pointer ${
                        isSelected
                          ? `${cat.activeColor} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px]`
                          : "bg-[#FFFDF9] border-black/30 text-gray-700 hover:border-black/60 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? cat.iconColor : "text-gray-500"}`} />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Input */}
            <div className="space-y-1.5 flex flex-col flex-1 min-h-[120px]">
              <label className="text-sm font-black text-gray-900 flex items-center gap-2 shrink-0">
                <HelpCircle className="w-4 h-4 text-[#417dc1]" /> Your Message
              </label>
              <textarea
                placeholder="Write your thought, question, or appreciation..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full p-3 bg-[#FFFDF9] border-2 border-black/80 rounded-xl text-sm sm:text-base font-bold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6DA0DC] resize-none transition-all flex-1 h-full"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#417dc1] hover:bg-[#6DA0DC] text-white font-black py-3 px-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer disabled:opacity-50 mt-3 text-sm sm:text-base shrink-0"
        >
          <Send className="w-4 h-4 stroke-[2.5]" />
          {isSubmitting ? "Sending..." : "Send to Thought Hub"}
        </motion.button>
      </motion.form>
    </div>
  );
}