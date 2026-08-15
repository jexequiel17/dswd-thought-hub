import { motion } from "motion/react";
import { Sparkles, HeartHandshake, Radio, Info } from "lucide-react";

export default function Header({ onOpenGuidelines }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#FFF8F0] border-2 border-black rounded-2xl p-3.5 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] space-y-2.5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black/10 pb-3">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="p-1.5 sm:p-2 bg-[#F7C948] border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0"
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
          </motion.div>
          <div>
            <h1 className="text-base sm:text-2xl font-black text-black tracking-tight leading-tight">
              Psychological First Aid Training
            </h1>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-600">
              Interactive Thought Hub & Participant Safe Space
            </p>
          </div>
        </div>

        {/* Badges and Guidelines Button Group */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* Guidelines Button */}
          <button
            onClick={onOpenGuidelines}
            className="inline-flex items-center gap-1.5 bg-[#FFFDF9] hover:bg-[#F7C948] border-2 border-black px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            title="View Safe Space Guidelines"
          >
            <Info className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Guidelines</span>
          </button>

          {/* Live Indicator Badge */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 border-2 border-black px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] font-bold text-emerald-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            Live Sync Active
          </div>
        </div>
      </div>

      {/* Sub-description */}
      <div className="flex items-start gap-2 text-xs text-gray-700 font-medium">
        <HeartHandshake className="w-4 h-4 text-[#B35A53] shrink-0 mt-0.5" />
        <span>
          Submit questions, reflections, or concerns to our Resource Persons in real time.
        </span>
      </div>
    </motion.header>
  );
}