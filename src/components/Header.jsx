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
      className="bg-[#FFF8F0] border-2 border-black rounded-2xl p-3.5 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] space-y-2.5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black/10 pb-3">
        {/* Title Section */}
        <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="p-1.5 sm:p-2 bg-[#F7C948] border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 mt-0.5 sm:mt-0"
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
          </motion.div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-1.5 w-full">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTitle(e)}
                  className="w-full px-2.5 py-1 text-sm sm:text-lg font-black bg-white text-black border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1.5 bg-emerald-400 hover:bg-emerald-500 text-black border-2 border-black rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer shrink-0"
                  title="Save Title"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 bg-gray-200 hover:bg-gray-300 text-black border-2 border-black rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer shrink-0"
                  title="Cancel"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h1 className="text-base sm:text-2xl font-black text-black tracking-tight leading-tight">
                  {headerTitle}
                </h1>
                {isTrainerAuthenticated && (
                  <button
                    onClick={handleStartEditing}
                    className="p-1.5 bg-[#F7C948] hover:bg-amber-400 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer shrink-0 inline-flex items-center justify-center active:translate-x-[1px] active:translate-y-[1px]"
                    title="Edit Header Title"
                  >
                    <Pencil className="w-4 h-4 text-black stroke-[2.5]" />
                  </button>
                )}
              </div>
            )}
            <p className="text-[11px] sm:text-xs font-semibold text-gray-600 mt-0.5">
              Interactive Thought Hub & Participant Safe Space
            </p>
          </div>
        </div>

        {/* Badges and Guidelines Button Group */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            onClick={onOpenGuidelines}
            className="inline-flex items-center gap-1.5 bg-[#FFFDF9] hover:bg-[#F7C948] border-2 border-black px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            title="View Safe Space Guidelines"
          >
            <Info className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Guidelines</span>
          </button>

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