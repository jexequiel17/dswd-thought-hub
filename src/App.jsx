import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Sparkles, X } from "lucide-react"; 
import Header from "./components/Header";
import QuestionForm from "./components/QuestionForm";
import ModuleTable from "./components/ModuleTable";
import { 
  subscribeToEntries, // Replaced fetchEntries with real-time listener
  submitEntry, 
  updateActiveModule, 
  toggleHideEntry,
  saveAnswerEntry 
} from "./services/sheetApi";
import "./App.css";

const MODULE_TITLES = {
  "Module 1": "Disasters and Emergencies and Their Impact",
  "Module 2": "Psychological First Aid Principles & Core Actions",
  "Module 3": "Support Strategies & Active Listening",
  "Module 4": "Self-Care & Responder Well-being",
  "Module 5": "Crisis Escalation & Referral Pathways",
  "Module 6": "Action Planning & Community Integration",
};

export default function App() {
  const isModerator = new URLSearchParams(window.location.search).has("admin");
  
  // Initialize state cleanly from localStorage or default to Module 1
  const [activeModule, setActiveModule] = useState(() => {
    if (isModerator) {
      return localStorage.getItem("adminActiveModule") || "Module 1";
    }
    return "Module 1";
  });

  const [entries, setEntries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  
  // Track if this is the very first load to sync server active module once
  const hasInitialized = useRef(false);

  // REAL-TIME LISTENER: Replaces the old setInterval polling loop
  useEffect(() => {
    const unsubscribe = subscribeToEntries(activeModule, (data) => {
      if (data) {
        // On the very first load, if the server specifies an active module, sync to it instantly
        if (!hasInitialized.current) {
          hasInitialized.current = true;
          if (!isModerator && data.activeModule && data.activeModule !== activeModule) {
            setActiveModule(data.activeModule);
            return; 
          }
        }
        setEntries(data.entries || []);
      }
    });

    // Cleanup subscription channel when module changes or component unmounts
    return () => unsubscribe();
  }, [activeModule, isModerator]);

  const handleModuleChange = async (newModule) => {
    setActiveModule(newModule);
    if (isModerator) {
      localStorage.setItem("adminActiveModule", newModule);
      await updateActiveModule(newModule); 
    }
    // Note: No need to manually call fetchEntries here anymore because 
    // changing `activeModule` automatically triggers the useEffect listener above!
  };

  const handleSaveAnswer = async (item, newAnswerText) => {
    const targetRowId = item.id || item.rowId;
    if (!targetRowId) return;
    setEntries((prevEntries) => prevEntries.map((entry) => (entry.id === targetRowId || entry.rowId === targetRowId) ? { ...entry, answer: newAnswerText, response: newAnswerText } : entry));
    await saveAnswerEntry({ sheet: activeModule, rowId: targetRowId, answer: newAnswerText });
  };

  const handleToggleHideEntry = async (item, shouldHide) => {
    const targetRowId = item.id || item.rowId;
    if (!targetRowId) return;
    setEntries((prevEntries) => prevEntries.map((entry) => (entry.id === targetRowId || entry.rowId === targetRowId) ? { ...entry, hidden: shouldHide, status: shouldHide ? "HIDDEN" : "ACTIVE" } : entry));
    await toggleHideEntry({ sheet: activeModule, rowId: targetRowId, shouldHide });
  };

  const handleAddEntry = async (entryData) => {
    setIsSubmitting(true);
    await submitEntry({ ...entryData, sheet: activeModule });
    // No need to manually fetch entries here; the real-time stream will update the screen instantly!
    setIsSubmitting(false);
    setIsMobileFormOpen(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-cover bg-center bg-fixed relative p-3 sm:p-5 pb-6 pr-6 text-black flex flex-col font-sans" style={{ backgroundImage: `url('https://academy.dswd.gov.ph/wp-content/uploads/2025/03/A1-1024x538.jpg')` }}>
      <div className="absolute inset-0 bg-[#FFFDF9]/85 backdrop-blur-[2px] pointer-events-none" />

      <div className="relative z-10 max-w-[1500px] w-full mx-auto flex flex-col h-full space-y-3">
        <Header onOpenGuidelines={() => setShowGuidelines(true)} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 min-h-0">
          <aside className="hidden lg:flex lg:col-span-4 flex-col gap-3 h-full">
            <QuestionForm onSubmitEntry={handleAddEntry} isSubmitting={isSubmitting} />
          </aside>

          <main className="col-span-1 lg:col-span-8 h-full min-h-0">
            <ModuleTable 
              entries={entries} activeModule={activeModule} moduleTitle={MODULE_TITLES[activeModule]}
              isModerator={isModerator} onModuleChange={handleModuleChange}
              onToggleHideEntry={handleToggleHideEntry} onSaveAnswer={handleSaveAnswer}
            />
          </main>
        </div>
      </div>

      {/* GUIDELINES MODAL */}
      <AnimatePresence>
        {showGuidelines && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowGuidelines(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FFFDF9] border-2 border-black rounded-3xl p-6 max-w-md w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4 border-b-2 border-black/10 pb-3">
                <h3 className="font-black text-base uppercase flex items-center gap-2 text-black tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-[#F7C948] border border-black flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    <ShieldCheck className="w-4 h-4 text-[#2563EB] stroke-[2.5]" />
                  </div>
                  Safe Space Guidelines
                </h3>
                <button 
                  onClick={() => setShowGuidelines(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 border border-black flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-black" />
                </button>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-gray-800">
                <li className="flex items-start gap-2 bg-[#F7C948]/20 p-2.5 rounded-xl border border-black/10">
                  <span className="select-none text-[#2563EB] font-black">•</span>
                  <span>Submissions are optional and can be anonymous or named.</span>
                </li>
                <li className="flex items-start gap-2 bg-[#F7C948]/20 p-2.5 rounded-xl border border-black/10">
                  <span className="select-none text-[#2563EB] font-black">•</span>
                  <span>Resource persons review entries during session breaks.</span>
                </li>
              </ul>

              <div className="text-[11px] font-bold text-gray-500 text-center italic mt-4 pt-3 border-t border-black/10">
                Let's keep this space safe and supportive.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE FLOATING ACTION BUTTON */} 
      {!isModerator && (
        <motion.button
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          onClick={() => setIsMobileFormOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 bg-[#F7C948] hover:bg-[#417dc1] text-white font-black px-4 py-3 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 z-40 cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 6, ease: "linear" }}>
            <Sparkles className="w-5 h-5 text-[#ffff]" />
          </motion.div>
          <span className="text-xs uppercase tracking-wider font-extrabold pr-0.5">Ask Question</span>
        </motion.button>
      )}

      {/* Mobile Modal Form Overlay */}
      <AnimatePresence>
        {isMobileFormOpen && (
          <div onClick={() => setIsMobileFormOpen(false)} className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 cursor-pointer">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar cursor-default"
            >
              <QuestionForm onSubmitEntry={handleAddEntry} isSubmitting={isSubmitting} onClose={() => setIsMobileFormOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}