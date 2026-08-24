import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Sparkles, X, Key, Shield, LogOut, LogIn, Copy, Check } from "lucide-react"; 
import Header from "./components/Header";
import QuestionForm from "./components/QuestionForm";
import ModuleTable from "./components/ModuleTable";
import { 
  subscribeToEntries, 
  updateActiveModule, 
  toggleHideEntry,
  saveAnswerEntry,
  loginTrainer,
  logoutTrainer,
  subscribeToAuthChanges
} from "./services/firebase";
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
  // Extract target trainer ID from URL (for participants)
  const urlParams = new URLSearchParams(window.location.search);
  const urlTrainerId = urlParams.get("trainer");

  const [user, setUser] = useState(null);
  const isModerator = Boolean(user);

  // Effective trainer ID: active logged-in trainer OR URL parameter
  const activeTrainerId = user ? user.uid : urlTrainerId;

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize activeModule from localStorage if available
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
    });
    return () => unsubscribe();
  }, []);

  // Sync entries and module isolated by activeTrainerId
  useEffect(() => {
    if (!activeTrainerId) return;

    const unsubscribe = subscribeToEntries(activeModule, activeTrainerId, (data) => {
      if (data) {
        if (data.entries) {
          // Normalize answer and response properties so refreshed states persist
          const normalizedEntries = data.entries.map((item) => ({
            ...item,
            answer: item.answer || item.response || "",
            response: item.response || item.answer || "",
          }));
          setEntries(normalizedEntries);
        }

        // Auto-switch participant view when trainer switches active module, and update storage
        if (!isModerator && data.activeModule && data.activeModule !== activeModule) {
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

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      await loginTrainer(email, password);
      setShowAuthModal(false);
      setEmail("");
      setPassword("");
    } catch (err) {
      setAuthError(err.message.replace("Firebase: ", ""));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutTrainer();
  };

  const handleModuleChange = async (newModule) => {
    setActiveModule(newModule);
    localStorage.setItem("trainer_active_module", newModule);
    if (isModerator && activeTrainerId) {
      await updateActiveModule(activeTrainerId, newModule); 
    }
  };

  // Save answer to Firestore and update local state
  const handleSaveAnswer = async (item, newAnswerText) => {
    const targetRowId = item.id || item.rowId || item.docId;
    if (!targetRowId) {
      console.error("No valid document ID found for item:", item);
      return;
    }

    // Optimistic UI Update
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

  // Toggle hide state in Firestore and update local state
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

  // Called after QuestionForm completes its submission
  const handleAddEntry = async () => {
    setIsMobileFormOpen(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-cover bg-center bg-fixed relative p-3 sm:p-5 pb-6 text-black flex flex-col font-sans" style={{ backgroundImage: `url('https://academy.dswd.gov.ph/wp-content/uploads/2025/03/A1-1024x538.jpg')` }}>
      <div className="absolute inset-0 bg-[#FFFDF9]/85 backdrop-blur-[2px] pointer-events-none" />

      <div className="relative z-10 max-w-[1500px] w-full mx-auto flex flex-col h-full space-y-3">
        {/* Full-Width Header Component */}
        <Header onOpenGuidelines={() => setShowGuidelines(true)} />

        {/* Trainer Auth & Admin Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-l from-[#FEEA9A] to-[#F7C948] border-2 border-black p-2 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
          <div className="text-xs font-black uppercase tracking-wide px-2 text-gray-700">
            {isModerator ? "Trainer Control Panel" : "Participant View"}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {isModerator ? (
              <>
                <button
                  onClick={handleCopyParticipantLink}
                  className="bg-[#A0C4EC] hover:bg-[#417dc1] border border-black font-extrabold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? "Link Copied!" : "Copy Participant Link"}
                </button>

                <span className="bg-emerald-100 text-emerald-900 border border-emerald-600 font-extrabold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> {user.email.split("@")[0]}
                </span>

                <button 
                  onClick={handleLogout} 
                  className="bg-rose-100 hover:bg-rose-200 text-rose-900 border border-black font-extrabold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </>
            ) : !urlTrainerId ? (
              <button 
                onClick={() => { setAuthError(""); setShowAuthModal(true); }} 
                className="bg-[#F7C948] hover:bg-amber-400 text-black border-2 border-black font-extrabold text-xs px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" /> Trainer Login
              </button>
            ) : null}
          </div>
        </div>

        {/* Main Content Layout */}
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
              entries={entries} activeModule={activeModule} moduleTitle={MODULE_TITLES[activeModule]}
              isModerator={isModerator} onModuleChange={handleModuleChange}
              onToggleHideEntry={handleToggleHideEntry} onSaveAnswer={handleSaveAnswer}
            />
          </main>
        </div>
      </div>

      {/* TRAINER AUTHENTICATION MODAL */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FFFDF9] border-2 border-black rounded-3xl p-6 max-w-sm w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4 border-b-2 border-black/10 pb-3">
                <h3 className="font-black text-base uppercase flex items-center gap-2 text-black tracking-wider">
                  <Shield className="w-5 h-5 text-amber-600" /> Trainer Login
                </h3>
                <button onClick={() => setShowAuthModal(false)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-100 border border-black flex items-center justify-center transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-black" />
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1 text-black">Trainer Email</label>
                  <input 
                    type="email" 
                    required
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trainer@dswd.gov.ph"
                    className="w-full p-2.5 border-2 border-black rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase mb-1 text-black">Password</label>
                  <input 
                    type="password" 
                    required
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 border-2 border-black rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  />
                </div>

                {authError && <p className="text-xs font-bold text-rose-600">{authError}</p>}

                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full py-2.5 bg-[#F7C948] hover:bg-amber-400 disabled:opacity-50 border-2 border-black font-extrabold text-sm rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer mt-2 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  {authLoading ? "Logging in..." : "Log In"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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