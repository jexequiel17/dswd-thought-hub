import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send } from "lucide-react";

export default function AnswerModal({
  isOpen,
  item,
  answerText,
  setAnswerText,
  onClose,
  onSave
}) {
  // Extract text safely using the same fallbacks as ModuleTable
  const displayContent = item?.question || item?.content || item?.message || item?.text || "";

  return (
    <AnimatePresence>
      {isOpen && item && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#FAF6F0] border-3 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] cursor-default flex flex-col gap-5"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-black/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#E38B80]/20 rounded-xl border-2 border-black/30">
                  <MessageSquare className="w-5 h-5 text-[#B35A53]" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-black uppercase tracking-tight">
                    Resource Person Response
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 font-semibold">
                    Asked by: <span className="font-extrabold text-black">{item.name || "Anonymous"}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-200 text-black rounded-xl border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                <X className="w-5 h-5 stroke-[3]" />
              </button>
            </div>

            {/* Question Context */}
            <div className="bg-white p-4 rounded-xl border-2 border-black/30 space-y-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
              <span className="text-xs font-black uppercase text-gray-500 tracking-wider block">
                Question / Reflection:
              </span>
              <p className="text-sm sm:text-base font-bold text-gray-900 leading-relaxed">
                "{displayContent}"
              </p>
            </div>

            {/* Textarea */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-black text-black uppercase tracking-wide">
                Your Answer / Response:
              </label>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type official response from resource persons here..."
                rows={5}
                className="w-full text-sm sm:text-base font-semibold p-4 border-2 border-black rounded-xl outline-none focus:border-black resize-none bg-white text-black shadow-[inset_0px_2px_4px_rgba(0,0,0,0.05)]"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-[#E2E8F0] hover:bg-gray-300 text-black border-2 border-black rounded-xl font-black text-sm flex items-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                <X className="w-4 h-4 stroke-[3]" />
                Cancel
              </button>

              <button
                type="button"
                onClick={onSave}
                className="px-5 py-2.5 bg-[#00D68F] hover:bg-[#00c281] text-black border-2 border-black rounded-xl font-black text-sm flex items-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                <Send className="w-4 h-4 stroke-[3]" />
                Save Response
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}