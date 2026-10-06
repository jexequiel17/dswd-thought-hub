import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, LogOut, Copy, Check, MessageSquarePlus, X, HeartHandshake, Info } from "lucide-react"; 
import Home from "./components/Home";
import Header from "./components/Header";
import QuestionForm from "./components/QuestionForm";
import ModuleTable from "./components/ModuleTable";
import IconSpinner from "./components/IconSpinner";
import dswdBg from "./assets/DSWDBG.webp";
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
  const urlTrainingId = urlParams.get("training");

  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState(false);
  const [, setAllTrainerEntries] = useState([]);
  const isModerator = Boolean(user);

  const activeTrainerId = user ? user.uid : urlTrainerId;
  const [activeTrainingId, setActiveTrainingId] = useState(urlTrainingId || "");

  const [copiedLink, setCopiedLink] = useState(false);

  const [activeModule, setActiveModule] = useState("Module 1");

  const [entries, setEntries] = useState([]);
  const [isSubmitting] = useState(false);
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
  
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Guarantee spinner plays for at least 2 seconds on initial page load/refresh
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTimePassed(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeTrainerId) return;

    const unsubscribe = subscribeToEntries(activeModule, activeTrainerId, activeTrainingId, (data) => {
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

        if (data.activeTrainingId !== undefined && data.activeTrainingId !== activeTrainingId) {
          setActiveTrainingId(data.activeTrainingId);
        }

        if (data.activeModule && data.activeModule !== activeModule) {
          setActiveModule(data.activeModule);
        }
      }
    });

    return () => unsubscribe();
  }, [activeModule, activeTrainerId, activeTrainingId, isModerator]);

  const handleCopyParticipantLink = () => {
    if (!user) return;
    const trainingParam = activeTrainingId ? `&training=${activeTrainingId}` : "";
    const shareUrl = `${window.location.origin}${window.location.pathname}?trainer=${user.uid}${trainingParam}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLogout = async () => {
    try {
      await logoutTrainer();
      if (typeof window !== "undefined") {
        window.location.href = window.location.origin + window.location.pathname;
      }
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = window.location.origin + window.location.pathname;
    }
  };

  const handleModuleChange = async (newModule) => {
    setActiveModule(newModule);
    if (isModerator && activeTrainerId) {
      await updateActiveModule(activeTrainerId, newModule, activeTrainingId); 
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

  // Loading Screen with DSWDBG.webp background
  if (authChecking || !minLoadingTimePassed) {
    return (
      <div 
        className="h-screen w-screen relative flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${dswdBg})` }}
      >
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
        <div className="relative z-10 flex flex-col items-center justify-center gap-3">
          <IconSpinner className="w-10 h-10" />
        </div>
      </div>
    );
  }

  if (!user && !urlTrainerId) {
    return <Home />;
  }

  return (
    <div 
      className="min-h-screen lg:h-screen w-screen overflow-y-auto lg:overflow-hidden bg-cover bg-center bg-fixed relative p-3 sm:p-5 pb-20 lg:pb-6 text-slate-800 flex flex-col font-sans" 
      style={{ backgroundImage: `url(${dswdBg})` }}
    >
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950/80 via-blue-950/70 to-slate-900/80 backdrop-blur-md pointer-events-none" />

      <div className="relative z-10 max-w-[1500px] w-full mx-auto flex flex-col h-full space-y-3">
        <Header 
          onOpenGuidelines={() => setShowGuidelines(true)}
          isModerator={isModerator}
          trainerId={activeTrainerId}
          entries={entries}
          activeTrainingId={activeTrainingId}
          onSelectTraining={(id) => setActiveTrainingId(id)}
        />

        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-3 bg-white/90 backdrop-blur-xl border border-white/40 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-xl shadow-blue-950/10 shrink-0 transition-all">
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-rose-600"></span>
            </span>
            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-700 uppercase">
              {isModerator ? "Trainer Control Panel" : "Participant View"}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
            {isModerator && (
              <>
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
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 min-h-0">
          <aside className="hidden lg:flex lg:col-span-4 flex-col gap-3 h-full">
            <QuestionForm 
              onSubmitEntry={handleAddEntry} 
              isSubmitting={isSubmitting} 
              trainerId={activeTrainerId}
              trainingId={activeTrainingId}
              activeModule={activeModule}
            />
          </aside>

          <main className="col-span-1 lg:col-span-8 h-full min-h-0">
            <ModuleTable 
              entries={entries}
              activeModule={activeModule} 
              activeTrainingId={activeTrainingId}
              moduleTitle={MODULE_TITLES[activeModule]}
              isModerator={isModerator} 
              onModuleChange={handleModuleChange}
              onToggleHideEntry={handleToggleHideEntry} 
              onSaveAnswer={handleSaveAnswer}
            />
          </main>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsMobileFormOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
        >
          <MessageSquarePlus className="w-5 h-5 stroke-[2.5]" />
          <span>Ask Question</span>
        </button>
      </div>

      <AnimatePresence>
        {isMobileFormOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-md p-0 sm:p-4"
            onClick={() => setIsMobileFormOpen(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl max-h-[85vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-3 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Submit Question / Reflection
                </span>
                <button
                  onClick={() => setIsMobileFormOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <QuestionForm 
                onSubmitEntry={handleAddEntry} 
                isSubmitting={isSubmitting} 
                trainerId={activeTrainerId}
                trainingId={activeTrainingId}
                activeModule={activeModule}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGuidelines && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
            onClick={() => setShowGuidelines(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500" />

              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 mt-1">
                <div className="flex items-center gap-2.5 text-slate-800 font-bold text-base tracking-tight">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Info className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Safe Space Guidelines</span>
                </div>
                <button 
                  onClick={() => setShowGuidelines(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/60 flex items-center justify-center transition-colors cursor-pointer text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-start gap-3">
                  <HeartHandshake className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-blue-950 font-medium">
                    This platform is designed to provide a supportive, inclusive, and respectful environment for all training participants.
                  </p>
                </div>

                <ul className="space-y-2.5 list-disc pl-4 font-medium text-slate-700">
                  <li>
                    <strong className="text-slate-900">Respect & Kindness:</strong> Treat every reflection, question, and opinion with consideration and empathy.
                  </li>
                  <li>
                    <strong className="text-slate-900">Constructive Engagement:</strong> Share meaningful thoughts or questions relevant to the training topic.
                  </li>
                  <li>
                    <strong className="text-slate-900">Confidentiality:</strong> Respect participant anonymity and keep sensitive discussions within this hub.
                  </li>
                  <li>
                    <strong className="text-slate-900">Real-time Facilitation:</strong> Resource persons will address your queries sequentially during dedicated Q&A slots.
                  </li>
                </ul>
              </div>

              <div className="mt-5 flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowGuidelines(false)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}