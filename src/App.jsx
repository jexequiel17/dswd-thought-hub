import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Sparkles, X, Shield, LogOut, Copy, Check } from "lucide-react"; 
import Home from "./components/Home";
import Header from "./components/Header";
import QuestionForm from "./components/QuestionForm";
import ModuleTable from "./components/ModuleTable";
import { 
  subscribeToEntries, 
  updateActiveModule, 
  toggleHideEntry,
  saveAnswerEntry,
  logoutTrainer,
  subscribeToAuthChanges
} from "./services/firebase";
import "./App.css";

const MODULE_TITLES = {
  "Module 1": "<<NO TITLE>>",
  "Module 2": "<<NO TITLE>>",
  "Module 3": "<<NO TITLE>>",
  "Module 4": "<<NO TITLE>>",
  "Module 5": "<<NO TITLE>>",
  "Module 6": "<<NO TITLE>>",
  "Module 7": "<<NO TITLE>>",
  "Module 8": "<<NO TITLE>>",
  "Module 9": "<<NO TITLE>>",
  "Module 10": "<<NO TITLE>>",
  "Module 11": "<<NO TITLE>>",
  "Module 12": "<<NO TITLE>>",
};

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlTrainerId = urlParams.get("trainer");

  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [allTrainerEntries, setAllTrainerEntries] = useState([]);
  const isModerator = Boolean(user);

  const activeTrainerId = user ? user.uid : urlTrainerId;

  const [copiedLink, setCopiedLink] = useState(false);

  const [activeModule, setActiveModule] = useState(() => {
    return localStorage.getItem("trainer_active_module") || "Module 1";
  });

  const [entries, setEntries] = useState([]);
  const [isSubmitting] = useState(false);
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeTrainerId) return;

    const unsubscribe = subscribeToEntries(activeModule, activeTrainerId, (data) => {
      if (data) {
        if (data.entries) {
          const normalizedEntries = data.entries.map((item) => ({
            ...item,
            answer: item.answer || item.response || "",
            response: item.response || item.answer || "",
          }));
          setEntries(normalizedEntries);
        }

        if (data.rawEntries) {
          const normalizedRawEntries = data.rawEntries.map((item) => ({
            ...item,
            answer: item.answer || item.response || "",
            response: item.response || item.answer || "",
          }));
          setAllTrainerEntries(normalizedRawEntries);
        }

        if (data.activeModule && data.activeModule !== activeModule) {
          setActiveModule(data.activeModule);
          localStorage.setItem("trainer_active_module", data.activeModule);
        }
      }
    });

    return () => unsubscribe();
  }, [activeModule, activeTrainerId, isModerator]);

  const handleCopyParticipantLink = () => {
    if (!user) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?trainer=${user.uid}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLogout = async () => {
    try {
      await logoutTrainer();
      if (typeof window !== "undefined") {
        localStorage.clear();
        window.location.href = window.location.origin + window.location.pathname;
      }
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.clear();
      window.location.href = window.location.origin + window.location.pathname;
    }
  };

  const handleModuleChange = async (newModule) => {
    setActiveModule(newModule);
    localStorage.setItem("trainer_active_module", newModule);
    if (isModerator && activeTrainerId) {
      await updateActiveModule(activeTrainerId, newModule); 
    }
  };

  const handleSaveAnswer = async (item, newAnswerText) => {
    const targetRowId = item.id || item.rowId || item.docId;
    if (!targetRowId) return;

    setEntries((prev) =>
      prev.map((entry) =>
        (entry.id === targetRowId || entry.rowId === targetRowId)
          ? { ...entry, answer: newAnswerText, response: newAnswerText }
          : entry
      )
    );

    await saveAnswerEntry({ 
      rowId: targetRowId, 
      answer: newAnswerText, 
      trainerId: activeTrainerId 
    });
  };

  const handleToggleHideEntry = async (item, shouldHide) => {
    const targetRowId = item.id || item.rowId || item.docId;
    if (!targetRowId) return;

    setEntries((prevEntries) =>
      prevEntries.map((entry) =>
        (entry.id === targetRowId || entry.rowId === targetRowId)
          ? { ...entry, hidden: shouldHide, status: shouldHide ? "HIDDEN" : "ACTIVE" }
          : entry
      )
    );

    await toggleHideEntry({ 
      rowId: targetRowId, 
      shouldHide, 
      trainerId: activeTrainerId 
    });
  };

  const handleAddEntry = async () => {
    setIsMobileFormOpen(false);
  };

  if (authChecking) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !urlTrainerId) {
    return <Home />;
  }

  return (
    <div 
      className="h-screen w-screen overflow-hidden bg-cover bg-center bg-fixed relative p-3 sm:p-5 pb-6 text-slate-800 flex flex-col font-sans" 
      style={{ backgroundImage: `url('https://academy.dswd.gov.ph/wp-content/uploads/2025/03/A1-1024x538.jpg')` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-blue-950/70 to-slate-900/80 backdrop-blur-md pointer-events-none" />

      <div className="relative z-10 max-w-[1500px] w-full mx-auto flex flex-col h-full space-y-3">
        <Header onOpenGuidelines={() => setShowGuidelines(true)} />

        {/* Trainer Control Panel (Only visible when user/trainer is logged in) */}
        {isModerator && (
          <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-3 bg-white/90 backdrop-blur-xl border border-white/40 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-xl shadow-blue-950/10 shrink-0 transition-all">
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-rose-600"></span>
              </span>
              <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-700 uppercase">
                Trainer Control Panel
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
              <button
                onClick={handleCopyParticipantLink}
                className="inline-flex items-center gap-1 sm:gap-1.5 bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200/80 font-semibold text-[10px] sm:text-xs px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-xs"
              >
                {copiedLink ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 shrink-0" />}
                <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                <span className="hidden sm:inline">{!copiedLink && " Participant"}</span>
              </button>

              <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-slate-100 text-slate-800 border border-slate-200/80 font-semibold text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl whitespace-nowrap max-w-[100px] sm:max-w-none truncate">
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{user.email.split("@")[0]}</span>
              </span>

              <button 
                onClick={handleLogout} 
                className="inline-flex items-center gap-1 sm:gap-1.5 bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200/80 font-semibold text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-xs"
              >
                <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 min-h-0">
          <aside className="hidden lg:flex lg:col-span-4 flex-col gap-3 h-full">
            <QuestionForm 
              onSubmitEntry={handleAddEntry} 
              isSubmitting={isSubmitting} 
              trainerId={activeTrainerId}
              activeModule={activeModule}
            />
          </aside>

          <main className="col-span-1 lg:col-span-8 h-full min-h-0">
            <ModuleTable 
              entries={allTrainerEntries}
              activeModule={activeModule} 
              moduleTitle={MODULE_TITLES[activeModule]}
              isModerator={isModerator} 
              onModuleChange={handleModuleChange}
              onToggleHideEntry={handleToggleHideEntry} 
              onSaveAnswer={handleSaveAnswer}
            />
          </main>
        </div>
      </div>

      {/* GUIDELINES MODAL */}
      <AnimatePresence>
        {showGuidelines && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowGuidelines(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-slate-950/20 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-rose-500 to-rose-600" />

              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3 mt-1">
                <h3 className="font-bold text-base uppercase flex items-center gap-2 text-slate-800 tracking-wider">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  Safe Space Guidelines
                </h3>
                <button 
                  onClick={() => setShowGuidelines(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/60 flex items-center justify-center transition-colors cursor-pointer text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm font-medium text-slate-600">
                <li className="flex items-start gap-3 bg-blue-50/60 p-3 rounded-2xl border border-blue-100/60">
                  <span className="select-none text-blue-600 font-bold">•</span>
                  <span>Submissions are optional and can be anonymous or named.</span>
                </li>
                <li className="flex items-start gap-3 bg-blue-50/60 p-3 rounded-2xl border border-blue-100/60">
                  <span className="select-none text-blue-600 font-bold">•</span>
                  <span>Resource persons review entries during session breaks.</span>
                </li>
              </ul>

              <div className="text-xs font-medium text-slate-400 text-center italic mt-5 pt-3 border-t border-slate-100">
                Let's keep this space safe and supportive.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE FLOATING ACTION BUTTON */} 
      <motion.button
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        onClick={() => setIsMobileFormOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-rose-600 hover:from-blue-700 hover:to-rose-700 text-white font-bold px-5 py-3.5 rounded-full border border-white/20 shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2 z-40 cursor-pointer active:scale-95 transition-all"
      >
        <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }}>
          <Sparkles className="w-5 h-5 text-white" />
        </motion.div>
        <span className="text-xs uppercase tracking-wider font-extrabold pr-0.5">Question</span>
      </motion.button>

      {/* Mobile Modal Form Overlay */}
      <AnimatePresence>
        {isMobileFormOpen && (
          <div onClick={() => setIsMobileFormOpen(false)} className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 cursor-pointer">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar cursor-default"
            >
              <QuestionForm 
                onSubmitEntry={handleAddEntry} 
                isSubmitting={isSubmitting} 
                onClose={() => setIsMobileFormOpen(false)} 
                trainerId={activeTrainerId}
                activeModule={activeModule}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}