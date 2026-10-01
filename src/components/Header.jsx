import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, HeartHandshake, Info, Pencil, Check, X, FileText } from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, auth } from "../services/firebase";

const DEFAULT_HEADER_TITLE = "<<NO TITLE>>";

export default function Header({ 
  onOpenGuidelines, 
  isModerator = false, 
  trainerId = "",
  entries = [] 
}) {
  const isTrainerAuthenticated = Boolean(auth?.currentUser?.uid) || isModerator;

  const getTrainerId = () => {
    if (auth?.currentUser?.uid) return auth.currentUser.uid;
    if (trainerId) return trainerId;
    if (typeof window !== "undefined") {
      const urlTrainer = new URLSearchParams(window.location.search).get("trainer");
      if (urlTrainer) return urlTrainer;
    }
    const foundInEntries = entries.find((e) => e.trainerId)?.trainerId;
    if (foundInEntries) return foundInEntries;
    return "";
  };

  const effectiveTrainerId = getTrainerId();
  const storageKey = effectiveTrainerId ? `headerTitle_${effectiveTrainerId}` : "headerTitle_default";

  const [headerTitle, setHeaderTitle] = useState(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      return cached || DEFAULT_HEADER_TITLE;
    } catch {
      return DEFAULT_HEADER_TITLE;
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(headerTitle);
  const [showFullTitleModal, setShowFullTitleModal] = useState(false);

  useEffect(() => {
    if (!effectiveTrainerId) {
      setHeaderTitle(DEFAULT_HEADER_TITLE);
      return;
    }

    const docRef = doc(db, "trainers", effectiveTrainerId, "settings", "header");
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists() && snapshot.data()?.title) {
          const remoteTitle = snapshot.data().title;
          setHeaderTitle(remoteTitle);
          localStorage.setItem(storageKey, remoteTitle);
        } else {
          setHeaderTitle(DEFAULT_HEADER_TITLE);
        }
      },
      (error) => {
        console.error("Firestore header listener error:", error);
      }
    );

    return () => unsubscribe();
  }, [effectiveTrainerId, storageKey]);

  const handleSaveTitle = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (!effectiveTrainerId) {
      alert("Error: Trainer session not verified.");
      return;
    }

    const trimmed = titleInput.trim() || DEFAULT_HEADER_TITLE;
    setHeaderTitle(trimmed);
    localStorage.setItem(storageKey, trimmed);
    setIsEditing(false);

    try {
      const docRef = doc(db, "trainers", effectiveTrainerId, "settings", "header");
      await setDoc(docRef, { title: trimmed }, { merge: true });
    } catch (err) {
      console.error("Failed to update header title in Firestore:", err);
    }
  };

  const handleTitleClick = () => {
    if (isTrainerAuthenticated) {
      setTitleInput(headerTitle);
      setIsEditing(true);
    } else {
      setShowFullTitleModal(true);
    }
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden bg-white/95 border border-slate-200/80 rounded-xl p-2.5 sm:p-4 shadow-xs space-y-2 backdrop-blur-md"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-red-500" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          {/* Title Section */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="p-1.5 sm:p-2.5 bg-blue-600 text-white rounded-lg sm:rounded-xl shadow-xs shrink-0"
            >
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </motion.div>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-1.5 w-full">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveTitle(e)}
                    className="w-full px-2 py-0.5 text-sm sm:text-lg font-bold bg-slate-50 text-slate-900 border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md shadow-xs cursor-pointer shrink-0 transition-colors"
                    title="Save Title"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md shadow-xs cursor-pointer shrink-0 transition-colors"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 min-w-0 group">
                  <h1 
                    onClick={handleTitleClick}
                    className="text-base sm:text-2xl font-extrabold text-blue-950 tracking-tight leading-tight cursor-pointer hover:text-blue-600 transition-colors line-clamp-2 sm:line-clamp-none break-words max-w-full"
                    title={isTrainerAuthenticated ? "Click to edit title" : "Click to view full title"}
                  >
                    {headerTitle}
                  </h1>
                  {isTrainerAuthenticated && (
                    <button
                      onClick={handleTitleClick}
                      className="p-1 bg-blue-50 group-hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-md transition-all cursor-pointer shrink-0 inline-flex items-center justify-center active:scale-95"
                      title="Edit Header Title"
                    >
                      <Pencil className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-[10px] sm:text-xs font-semibold text-slate-400 leading-tight mt-0.5">
                Interactive Thought Hub & Participant Safe Space
              </p>
            </div>
          </div>

          {/* Guidelines Button */}
          <div className="flex items-center justify-end shrink-0 self-end sm:self-center ml-auto">
            <button
              onClick={onOpenGuidelines}
              className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-blue-600 border border-slate-200 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
              title="View Safe Space Guidelines"
            >
              <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
              <span>Guidelines</span>
            </button>
          </div>
        </div>

        {/* Sub-description */}
        <div className="flex items-start sm:items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 font-medium pt-0.5 leading-snug">
          <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            Submit questions, reflections, or concerns to our Resource Persons in real time.
          </span>
        </div>
      </motion.header>

      {/* Full Title View Modal for Participants */}
      <AnimatePresence>
        {showFullTitleModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md" 
            onClick={() => setShowFullTitleModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white border border-slate-100 rounded-3xl p-5 max-w-md w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-red-500" />

              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 mt-1">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm tracking-wider uppercase">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Session Title</span>
                </div>
                <button 
                  onClick={() => setShowFullTitleModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/60 flex items-center justify-center transition-colors cursor-pointer text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <h2 className="text-base sm:text-xl font-extrabold text-blue-950 leading-relaxed break-words">
                  {headerTitle}
                </h2>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowFullTitleModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}