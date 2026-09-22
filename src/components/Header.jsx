import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, HeartHandshake, Radio, Info, Pencil, Check, X } from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, auth } from "../services/firebase";

const DEFAULT_HEADER_TITLE = "<<NO TITLE>>";

export default function Header({ 
  onOpenGuidelines, 
  isModerator = false, 
  trainerId = "",
  entries = [] 
}) {
  // Check auth state directly as a fallback to ensure trainers always see the button
  const isTrainerAuthenticated = Boolean(auth?.currentUser?.uid) || isModerator;

  // 1. Resolve trainer ID dynamically across Trainer and Participant views
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

  // 2. State for title & inline editing
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

  // 3. Real-time listener for Header Title from Firestore
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

  // 4. Save handler for Trainer updates
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

  const handleStartEditing = () => {
    setTitleInput(headerTitle);
    setIsEditing(true);
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden bg-white/95 border border-slate-200/80 rounded-xl p-2.5 sm:p-4 shadow-xs space-y-2 backdrop-blur-md"
    >
      {/* Top Red & Blue Accent Bar */}
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
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="text-sm sm:text-2xl font-extrabold text-blue-950 tracking-tight leading-tight truncate">
                  {headerTitle}
                </h1>
                {isTrainerAuthenticated && (
                  <button
                    onClick={handleStartEditing}
                    className="p-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-md transition-all cursor-pointer shrink-0 inline-flex items-center justify-center active:scale-95"
                    title="Edit Header Title"
                  >
                    <Pencil className="w-3 h-3 stroke-[2.5]" />
                  </button>
                )}
              </div>
            )}
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 leading-tight">
              Interactive Thought Hub & Participant Safe Space
            </p>
          </div>
        </div>

        {/* Badges and Guidelines Button Group - Aligned to the Right */}
        <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-center ml-auto">
          <button
            onClick={onOpenGuidelines}
            className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-blue-600 border border-slate-200 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
            title="View Safe Space Guidelines"
          >
            <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
            <span>Guidelines</span>
          </button>

          <div className="inline-flex items-center gap-1 bg-red-50 border border-red-200/80 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold text-red-600 shadow-xs shrink-0">
            <Radio className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500 animate-pulse" />
            <span>Live Sync Active</span>
          </div>
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
  );
}