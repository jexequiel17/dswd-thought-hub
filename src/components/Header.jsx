import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, HeartHandshake, Info, Pencil, Check, X, FileText, Plus, FolderSync, ChevronDown } from "lucide-react";
import { doc, onSnapshot, setDoc, collection, addDoc } from "firebase/firestore";
import { db, auth } from "../services/firebase";

const DEFAULT_HEADER_TITLE = "Trainer Dashboard";

export default function Header({ 
  onOpenGuidelines, 
  isModerator = false, 
  trainerId = "",
  entries = [],
  activeTrainingId,
  onSelectTraining
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

  const [headerTitle, setHeaderTitle] = useState(DEFAULT_HEADER_TITLE);
  const [trainingsList, setTrainingsList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [showFullTitleModal, setShowFullTitleModal] = useState(false);

  // Dropdown Open State & Click Outside Listener
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // New Training Modal State
  const [showAddTrainingModal, setShowAddTrainingModal] = useState(false);
  const [newTrainingTitle, setNewTrainingTitle] = useState("");
  const [isCreatingTraining, setIsCreatingTraining] = useState(false);

  // Handle clicking outside the custom dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch list of trainings for the trainer
  useEffect(() => {
    if (!effectiveTrainerId) return;

    const trainingsRef = collection(db, "trainers", effectiveTrainerId, "trainings");
    const unsubscribe = onSnapshot(trainingsRef, (snapshot) => {
      const loaded = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setTrainingsList(loaded);
    });

    return () => unsubscribe();
  }, [effectiveTrainerId]);

  // Sync Header Title with Active Training or Setting in Firestore
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
        } else {
          setHeaderTitle(DEFAULT_HEADER_TITLE);
        }
      },
      (error) => {
        console.error("Firestore header listener error:", error);
      }
    );

    return () => unsubscribe();
  }, [effectiveTrainerId]);

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
    setIsEditing(false);

    try {
      const headerDocRef = doc(db, "trainers", effectiveTrainerId, "settings", "header");
      await setDoc(headerDocRef, { title: trimmed }, { merge: true });

      if (activeTrainingId) {
        const trainingDocRef = doc(db, "trainers", effectiveTrainerId, "trainings", activeTrainingId);
        await setDoc(trainingDocRef, { title: trimmed }, { merge: true });
      }
    } catch (err) {
      console.error("Failed to update header title in Firestore:", err);
    }
  };

  const handleSelectTrainingOption = async (id, title) => {
    const selectedTitle = title || DEFAULT_HEADER_TITLE;
    setHeaderTitle(selectedTitle);

    try {
      await setDoc(
        doc(db, "trainers", effectiveTrainerId, "settings", "header"), 
        { title: selectedTitle }, 
        { merge: true }
      );
      await setDoc(
        doc(db, "trainers", effectiveTrainerId), 
        { activeTrainingId: id || "" }, 
        { merge: true }
      );
    } catch (err) {
      console.error("Failed to update selected training in Firestore:", err);
    }

    if (onSelectTraining) onSelectTraining(id);
    setIsDropdownOpen(false);
  };

  const handleCreateNewTraining = async (e) => {
    e.preventDefault();
    if (!newTrainingTitle.trim() || !effectiveTrainerId) return;

    setIsCreatingTraining(true);
    try {
      const title = newTrainingTitle.trim();
      const newDocRef = await addDoc(collection(db, "trainers", effectiveTrainerId, "trainings"), {
        title,
        createdAt: new Date().toISOString()
      });

      setHeaderTitle(title);
      await setDoc(
        doc(db, "trainers", effectiveTrainerId, "settings", "header"), 
        { title }, 
        { merge: true }
      );
      await setDoc(
        doc(db, "trainers", effectiveTrainerId), 
        { activeTrainingId: newDocRef.id }, 
        { merge: true }
      );

      if (onSelectTraining) {
        onSelectTraining(newDocRef.id);
      }

      setNewTrainingTitle("");
      setShowAddTrainingModal(false);
    } catch (err) {
      console.error("Error creating new training:", err);
    } finally {
      setIsCreatingTraining(false);
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

  const selectedTrainingObj = trainingsList.find((t) => t.id === activeTrainingId);
  const currentDropdownLabel = selectedTrainingObj ? selectedTrainingObj.title : "Default Training Session";

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-40 bg-white/95 border border-slate-200/80 rounded-2xl p-2.5 sm:p-4 shadow-xs space-y-2 backdrop-blur-md"
      >
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="p-1.5 sm:p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md shrink-0"
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
                    className="w-full px-2 py-0.5 text-sm sm:text-lg font-bold bg-slate-50 text-slate-900 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-xs cursor-pointer shrink-0 transition-colors"
                    title="Save Title"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg shadow-xs cursor-pointer shrink-0 transition-colors"
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
                      className="p-1 bg-blue-50 group-hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg transition-all cursor-pointer shrink-0 inline-flex items-center justify-center active:scale-95"
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

          <div className="flex items-center gap-2 justify-end shrink-0 self-end sm:self-center ml-auto">
            {isTrainerAuthenticated && (
              <>
                <div className="relative inline-block text-left" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200/80 hover:border-blue-300 rounded-full text-xs font-bold text-slate-800 shadow-xs hover:shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.98]"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <FolderSync className="w-3 h-3 text-blue-600 stroke-[2.5]" />
                    </div>
                    <span className="truncate max-w-[130px] sm:max-w-[180px] font-semibold text-slate-700">{currentDropdownLabel}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 stroke-[2.5] transition-transform duration-200 shrink-0 ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 z-50 mt-2 w-60 max-h-60 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-1.5 space-y-1"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectTrainingOption("", "")}
                          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            !activeTrainingId 
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs" 
                              : "text-slate-700 hover:bg-blue-50/80 hover:text-blue-600"
                          }`}
                        >
                          <span className="truncate">Default Training Session</span>
                          {!activeTrainingId && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-2" />}
                        </button>

                        {trainingsList.map((t) => {
                          const isSelected = activeTrainingId === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleSelectTrainingOption(t.id, t.title)}
                              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                isSelected 
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs" 
                                  : "text-slate-700 hover:bg-blue-50/80 hover:text-blue-600"
                              }`}
                            >
                              <span className="truncate">{t.title}</span>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => setShowAddTrainingModal(true)}
                  className="w-8 h-8 inline-flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
                  title="Add New Training Title"
                >
                  <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                </button>
              </>
            )}

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

        <div className="relative flex items-start sm:items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 font-medium pt-0.5 leading-snug">
          <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            Submit questions, reflections, or concerns to our Resource Persons in real time.
          </span>
        </div>
      </motion.header>

      {/* Modals keep original implementations */}
      <AnimatePresence>
        {showAddTrainingModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md" 
            onClick={() => setShowAddTrainingModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white border border-slate-100 rounded-3xl p-5 max-w-md w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500" />

              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 mt-1">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm tracking-wider uppercase">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Add New Training</span>
                </div>
                <button 
                  onClick={() => setShowAddTrainingModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/60 flex items-center justify-center transition-colors cursor-pointer text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewTraining} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Training Title
                  </label>
                  <input
                    type="text"
                    value={newTrainingTitle}
                    onChange={(e) => setNewTrainingTitle(e.target.value)}
                    placeholder="e.g., Training PFA"
                    required
                    className="w-full px-3.5 py-2 text-sm font-medium bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTrainingModal(false)}
                    className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTraining || !newTrainingTitle.trim()}
                    className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    {isCreatingTraining ? "Creating..." : "Create Training"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500" />

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