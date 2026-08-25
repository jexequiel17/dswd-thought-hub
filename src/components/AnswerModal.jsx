import { useState } from "react";
import { Loader2, Send, X } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FFFDF9] border-2 border-black rounded-2xl p-5 w-full max-w-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
          <h3 className="text-lg font-black text-black">
            {item.answer || item.response ? "Edit Answer" : "Answer Question"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg border border-black hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Question Preview */}
        <div className="bg-amber-50 border border-black/20 p-3 rounded-xl space-y-1">
          <p className="text-xs font-black uppercase text-amber-800">
            From: {item.name || "Anonymous"}
          </p>
          <p className="text-sm font-medium text-gray-900">
            {item.question || item.content || item.message || item.text}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-black block">
              Your Answer / Response:
            </label>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your response here..."
              disabled={isSubmitting}
              required
              rows={4}
              className="w-full p-3 bg-white border-2 border-black rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#6DA0DC] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black font-black text-sm rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <X className="w-4 h-4" /> Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !answerText.trim()}
              className="px-4 py-2 bg-emerald-400 hover:bg-emerald-500 text-black font-black text-sm rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 stroke-[2.5]" />
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