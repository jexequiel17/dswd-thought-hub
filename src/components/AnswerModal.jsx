import { useState } from "react";
import { Loader2, Send, X, MessageSquareQuote, Check } from "lucide-react";

export default function AnswerModal({
  isOpen,
  item,
  answerText,
  setAnswerText,
  onClose,
  onSave,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Execute the save function passed from parent
      await onSave();
    } catch (error) {
      console.error("Error saving answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 border border-slate-200/80 rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-xl relative space-y-4 text-slate-800 backdrop-blur-md overflow-hidden">
        
        {/* Top Gradient Stripe Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-red-500" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 border border-blue-200/60 rounded-xl shrink-0">
              <MessageSquareQuote className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                {item.answer || item.response ? "Edit Response" : "Answer Question"}
              </h3>
              <p className="text-xs lg:text-sm text-slate-500 font-medium">
                Provide feedback or clarify the entry
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 lg:w-5 lg:h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Question Preview */}
        <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-xl space-y-1">
          <p className="text-[11px] lg:text-xs font-bold uppercase tracking-wider text-blue-600">
            From: {item.name || "Anonymous"}
          </p>
          <p className="text-xs sm:text-sm lg:text-base font-medium text-slate-800 leading-relaxed break-words">
            {item.question || item.content || item.message || item.text}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs lg:text-sm font-bold uppercase tracking-wider text-slate-700 block">
              Your Answer / Response:
            </label>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your response here..."
              disabled={isSubmitting}
              required
              rows={4}
              className="w-full p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm lg:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs lg:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5 lg:w-4 lg:h-4 stroke-[2.5]" /> Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !answerText.trim()}
              className="px-4 py-2 text-xs lg:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 lg:w-4 lg:h-4 stroke-[3]" />
                  Save Response
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}