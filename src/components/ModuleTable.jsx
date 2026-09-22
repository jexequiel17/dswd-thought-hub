import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Pencil, 
  Check, 
  X, 
  ChevronDown, 
  Trash2, 
  Eye, 
  EyeOff, 
  MessageSquare, 
  HelpCircle, 
  AlertCircle, 
  Heart, 
  BookmarkCheck, 
  Download,
  AlertTriangle,
  BookOpen,
  Layers
} from "lucide-react";
import AnswerModal from "./AnswerModal";
import { deleteAllEntriesForModule, db, saveModuleOptions, auth } from "../services/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import ShowAllEntries from "./ShowAllEntries";

const DEFAULT_MODULE_OPTIONS = [
  { tag: "Module 1", title: "<no title>" },
  { tag: "Module 2", title: "<no title>" },
  { tag: "Module 3", title: "<no title>" },
  { tag: "Module 4", title: "<no title>" },
  { tag: "Module 5", title: "<no title>" },
  { tag: "Module 6", title: "<no title>" },
  { tag: "Module 7", title: "<no title>" },
  { tag: "Module 8", title: "<no title>" },
  { tag: "Module 9", title: "<no title>" },
  { tag: "Module 10", title: "<no title>" },
  { tag: "Module 11", title: "<no title>" },
  { tag: "Module 12", title: "<no title>" },
];

const mergeModuleOptions = (incoming) => {
  if (!Array.isArray(incoming)) return DEFAULT_MODULE_OPTIONS;
  const mergedMap = new Map();
  DEFAULT_MODULE_OPTIONS.forEach((item) => mergedMap.set(item.tag, item));
  incoming.forEach((item) => {
    if (item && item.tag) {
      mergedMap.set(item.tag, item);
    }
  });
  return Array.from(mergedMap.values());
};

const TYPE_CONFIG = {
  question: { label: "Question", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: HelpCircle },
  concern: { label: "Concern", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircle },
  appreciation: { label: "Appreciation", bg: "bg-red-50 text-red-700 border-red-200", icon: Heart },
};

export const handleTrainerLogout = async () => {
  try {
    const currentUid = auth?.currentUser?.uid || localStorage.getItem("currentTrainerId");

    if (currentUid) {
      await saveModuleOptions(currentUid, DEFAULT_MODULE_OPTIONS);
    }

    if (typeof window !== "undefined") {
      localStorage.clear();
    }

    await signOut(auth);
    window.location.href = window.location.origin + window.location.pathname;
    window.location.reload();
  } catch (error) {
    console.error("Logout failed:", error);
    localStorage.clear();
    window.location.href = window.location.origin + window.location.pathname;
    window.location.reload();
  }
};

function ModuleTitleModal({ isOpen, moduleTag, title, onClose, onSave, isModerator }) {
  const [editedTitle, setEditedTitle] = useState(title || "");

  useEffect(() => {
    setEditedTitle(title || "");
  }, [title, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (onSave && editedTitle.trim()) {
      onSave(editedTitle.trim());
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white/95 border border-slate-200 rounded-2xl shadow-xl p-5 relative overflow-hidden backdrop-blur-md"
        >
          {/* Top Gradient Stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-red-500" />

          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5 mb-4">
            <div className="flex items-center gap-2 font-bold text-base text-slate-900">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg text-xs uppercase font-extrabold">{moduleTag}</span>
              <span>Module Overview</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {isModerator ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Module Title
                </label>
                <textarea
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  rows={3}
                  className="w-full p-3 text-sm font-medium bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  placeholder="Enter module title..."
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function DeleteConfirmationModal({ isOpen, moduleTag, onClose, onConfirm, isDeleting }) {
  const [confirmInput, setConfirmInput] = useState("");

  useEffect(() => {
    if (isOpen) setConfirmInput("");
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatched = confirmInput.trim().toLowerCase() === "delete";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isMatched && !isDeleting) {
      onConfirm();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-white/95 border border-slate-200 rounded-2xl shadow-xl p-5 relative overflow-hidden backdrop-blur-md"
        >
          {/* Top Danger Line Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />

          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
              <span>Confirm Deletion</span>
            </div>
            <button 
              onClick={onClose}
              disabled={isDeleting}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="underline decoration-red-500 font-bold text-slate-800">ALL</span> entries for <strong className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-bold">{moduleTag}</strong>? This action cannot be undone.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Type <span className="text-red-600 font-bold">&quot;delete&quot;</span> below to confirm:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="delete"
                disabled={isDeleting}
                autoFocus
                className="w-full px-3.5 py-2 text-sm font-medium bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isMatched || isDeleting}
                className="px-4 py-2 text-xs font-bold bg-red-500 hover:bg-red-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : "Confirm Delete"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function ModuleTable({ 
  entries = [], 
  allEntries = null, // Accepts un-filtered master list when available
  activeModule = "Module 1", 
  moduleTitle = "", 
  trainerId = "",
  isModerator = false, 
  moduleOptionsProp = [],
  onModuleChange,
  onToggleHideEntry,
  onSaveAnswer,
  onDeleteAllEntries
}) {
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [selectedModule, setSelectedModule] = useState(activeModule);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [isShowAllModalOpen, setIsShowAllModalOpen] = useState(false);
  const [showAllSelectedModule, setShowAllSelectedModule] = useState("ALL");

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
  const storageKey = effectiveTrainerId ? `customModuleOptions_${effectiveTrainerId}` : "customModuleOptions_default";

  const [moduleOptions, setModuleOptions] = useState(() => {
    if (Array.isArray(moduleOptionsProp) && moduleOptionsProp.length > 0) {
      return mergeModuleOptions(moduleOptionsProp);
    }
    try {
      const cached = localStorage.getItem(storageKey);
      return cached ? mergeModuleOptions(JSON.parse(cached)) : DEFAULT_MODULE_OPTIONS;
    } catch {
      return DEFAULT_MODULE_OPTIONS;
    }
  });

  const [editingTag, setEditingTag] = useState(null);
  const [editingTitleInput, setEditingTitleInput] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [activeAnswerItem, setActiveAnswerItem] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (effectiveTrainerId && typeof window !== "undefined" && isModerator) {
      localStorage.setItem("currentTrainerId", effectiveTrainerId);
    }
  }, [effectiveTrainerId, isModerator]);

  useEffect(() => {
    setSelectedModule(activeModule);
  }, [activeModule]);

  useEffect(() => {
    if (Array.isArray(moduleOptionsProp) && moduleOptionsProp.length > 0) {
      setModuleOptions(mergeModuleOptions(moduleOptionsProp));
    }
  }, [moduleOptionsProp]);

  useEffect(() => {
    if (!effectiveTrainerId) {
      setModuleOptions(DEFAULT_MODULE_OPTIONS);
      return;
    }

    const docRef = doc(db, "trainers", effectiveTrainerId, "settings", "modules");
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists() && Array.isArray(snapshot.data()?.options)) {
          const remoteOptions = snapshot.data().options;
          const merged = mergeModuleOptions(remoteOptions);
          setModuleOptions(merged);
          localStorage.setItem(storageKey, JSON.stringify(merged));
        } else {
          setModuleOptions(DEFAULT_MODULE_OPTIONS);
        }
      },
      (error) => {
        console.error("Firestore module titles listener error:", error);
        setModuleOptions(DEFAULT_MODULE_OPTIONS);
      }
    );

    return () => unsubscribe();
  }, [effectiveTrainerId, storageKey]);

  const handleSaveModalTitle = async (newTitle) => {
    const targetTrainerId = effectiveTrainerId;
    if (!targetTrainerId) {
      alert("Error: Trainer session not verified. Title not saved.");
      return;
    }

    const updatedOptions = moduleOptions.map((mod) => 
      mod.tag === activeModule ? { ...mod, title: newTitle.trim() || "<no title>" } : mod
    );

    setModuleOptions(updatedOptions);
    localStorage.setItem(`customModuleOptions_${targetTrainerId}`, JSON.stringify(updatedOptions));
    setIsTitleModalOpen(false);

    try {
      await saveModuleOptions(targetTrainerId, updatedOptions);
    } catch (err) {
      console.error("Failed to write module titles to Firestore:", err);
    }
  };

  const handleSaveTitle = async (tag, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    const targetTrainerId = effectiveTrainerId;

    if (!targetTrainerId) {
      alert("Error: Trainer session not verified. Title not saved.");
      return;
    }

    const updatedOptions = moduleOptions.map((mod) => 
      mod.tag === tag ? { ...mod, title: editingTitleInput.trim() || mod.title } : mod
    );

    setModuleOptions(updatedOptions);
    localStorage.setItem(`customModuleOptions_${targetTrainerId}`, JSON.stringify(updatedOptions));
    setEditingTag(null);

    try {
      await saveModuleOptions(targetTrainerId, updatedOptions);
    } catch (err) {
      console.error("Failed to write module titles to Firestore:", err);
    }
  };

  const handleStartEditingTitle = (mod, e) => {
    if (e) e.stopPropagation();
    setEditingTag(mod.tag);
    setEditingTitleInput(mod.title);
  };

  const [myMarkedIds, setMyMarkedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("myMarkedEntryIds") || "[]");
    } catch (e) {
      return [];
    }
  });

  const toggleMyEntryPin = (itemId) => {
    if (!itemId) return;
    let updated;
    if (myMarkedIds.includes(itemId)) {
      updated = myMarkedIds.filter(id => id !== itemId);
    } else {
      updated = [...myMarkedIds, itemId];
    }
    setMyMarkedIds(updated);
    localStorage.setItem("myMarkedEntryIds", JSON.stringify(updated));
  };

  const handleOpenDeleteModal = () => {
    if (!effectiveTrainerId) {
      alert("No active trainer ID found to delete entries for.");
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeleting(true);
    try {
      if (onDeleteAllEntries) {
        await onDeleteAllEntries(effectiveTrainerId, activeModule);
      } else {
        await deleteAllEntriesForModule(effectiveTrainerId, activeModule);
      }
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete entries:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportNativeSpreadsheet = () => {
    if (!entries || entries.length === 0) return;

    const escapeXml = (str = "") =>
      String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const headers = ["Name", "Type", "Module", "Question / Content", "Response", "Status"];

    const rowsXml = displayedEntries.map((item) => {
      const isHidden = item.hidden || item.status === "HIDDEN";
      const response = item.answer || item.response || "";
      const rawType = item.type || "question";
      const formattedType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
      const contentText = item.question || item.content || item.message || item.text || "";

      return `
        <Row>
          <Cell><Data ss:Type="String">${escapeXml(item.name || "Anonymous")}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(formattedType)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(activeModule)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(contentText)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(response)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(isHidden ? "Hidden" : "Visible")}</Data></Cell>
        </Row>`;
    }).join("");

    const headerXml = `
        <Row>
          ${headers.map(h => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join("")}
        </Row>`;

    const xmlTemplate = `<?xml version="1.0" encoding="UTF-8"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
        <Worksheet ss:Name="${escapeXml(activeModule)}">
          <Table>
            ${headerXml}
            ${rowsXml}
          </Table>
        </Worksheet>
      </Workbook>`;

    const blob = new Blob([xmlTemplate], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeModule.toLowerCase().replace(/\s+/g, "_")}_entries.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveModule = () => {
    if (onModuleChange) onModuleChange(selectedModule);
    setIsEditingModule(false);
    setIsDropdownOpen(false);
  };

  const handleOpenAnswerModal = (item) => {
    setActiveAnswerItem(item);
    setAnswerText(item.answer || item.response || "");
  };

  const handleCloseAnswerModal = () => {
    setActiveAnswerItem(null);
    setAnswerText("");
  };

  const handleSaveAnswerSubmit = async () => {
    if (onSaveAnswer && activeAnswerItem) {
      await onSaveAnswer(activeAnswerItem, answerText, effectiveTrainerId, activeModule);
    }
    handleCloseAnswerModal();
  };

  const handleToggleHide = (item, shouldHide) => {
    if (onToggleHideEntry) {
      onToggleHideEntry(item, shouldHide, effectiveTrainerId, activeModule);
    }
  };

  const currentOption = moduleOptions.find((m) => m.tag === selectedModule) || moduleOptions[0];
  const currentActiveOption = moduleOptions.find((m) => m.tag === activeModule) || moduleOptions[0];

  const displayTitle = currentActiveOption?.title || moduleTitle;

  const rawDisplayedEntries = isModerator ? entries : entries.filter((e) => !e.hidden && e.status !== "HIDDEN");

  const displayedEntries = [...rawDisplayedEntries].sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime());
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime());
    return timeB - timeA;
  });

  return (
    <div className="flex flex-col h-full max-h-full space-y-2.5 min-h-0">
      {/* Module Navigation / Control Header Bar */}
      <div className="bg-white/95 border border-slate-200/80 rounded-2xl shadow-sm shrink-0 relative z-30 backdrop-blur-md">
        
        {/* Accent Bar Container - Strictly clips the accent bar to rounded corners without affecting dropdowns */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-red-500" />
        </div>

        {/* Content Area */}
        <div className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 min-w-0">
          {isEditingModule ? (
            <div className="flex items-center gap-2 w-full min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 shrink-0">Select:</span>
              <div className="relative flex-1 min-w-0" ref={dropdownRef}>
                <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between gap-2 px-3.5 py-1.5 text-sm font-semibold bg-slate-50 text-slate-900 border border-slate-200 rounded-xl hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer">
                  <span className="truncate"><strong className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded mr-2 text-xs uppercase font-extrabold border border-blue-200">{currentOption.tag}</strong>{currentOption.title}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div initial={{ opacity: 0, y: -5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5, scale: 0.98 }} className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1 max-h-80 overflow-y-auto custom-scrollbar">
                      {moduleOptions.map((mod) => (
                        <div key={mod.tag} className={`w-full px-3.5 py-2 text-sm font-medium border-b border-slate-100 last:border-0 flex items-center justify-between gap-2 transition-colors ${selectedModule === mod.tag ? "bg-blue-50/70 text-blue-900 font-bold" : "hover:bg-slate-50 text-slate-700"}`}>
                          <div 
                            onClick={() => { 
                              if (editingTag !== mod.tag) {
                                setSelectedModule(mod.tag); 
                                setIsDropdownOpen(false); 
                              }
                            }} 
                            className="flex-1 flex items-center gap-2 truncate cursor-pointer"
                          >
                            <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold uppercase border shrink-0 ${selectedModule === mod.tag ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 text-slate-600 border-slate-200"}`}>{mod.tag}</span>
                            
                            {editingTag === mod.tag ? (
                              <input
                                type="text"
                                value={editingTitleInput}
                                onChange={(e) => setEditingTitleInput(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveTitle(mod.tag, e);
                                }}
                                className="px-2 py-0.5 border border-slate-300 rounded-lg bg-white text-slate-900 font-semibold text-xs w-full focus:outline-none focus:border-blue-500"
                                autoFocus
                              />
                            ) : (
                              <span className="truncate">{mod.title}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {isModerator && (
                              editingTag === mod.tag ? (
                                <button type="button" onClick={(e) => handleSaveTitle(mod.tag, e)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              ) : (
                                <button type="button" onClick={(e) => handleStartEditingTitle(mod, e)} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                            {selectedModule === mod.tag && <Check className="w-4 h-4 text-blue-600 shrink-0 stroke-[3]" />}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={handleSaveModule} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm shadow-blue-600/20 flex items-center justify-center shrink-0 transition-all" title="Save"><Check className="w-4 h-4 stroke-[3]" /></button>
                <button onClick={() => { setSelectedModule(activeModule); setIsEditingModule(false); }} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 cursor-pointer flex items-center justify-center shrink-0 transition-all" title="Cancel"><X className="w-4 h-4 stroke-[2.5]" /></button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 w-full min-w-0">
              {/* Title & Tag Block */}
              <button
                type="button"
                onClick={() => setIsTitleModalOpen(true)}
                className="flex items-center min-w-0 flex-1 cursor-pointer group select-none gap-2 text-left hover:opacity-85 transition-opacity"
                title="Click to view/edit module title"
              >
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg shrink-0">
                  {activeModule}
                </span>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate min-w-0 leading-tight">
                  {displayTitle}
                </h2>
              </button>

              {/* Control Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 whitespace-nowrap">
                  {displayedEntries.length} <span className="hidden sm:inline">Entries</span>
                </span>
                {isModerator && (
                  <button onClick={() => { setSelectedModule(activeModule); setIsEditingModule(true); }} className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-all shadow-2xs" title="Change module"><Pencil className="w-3.5 h-3.5 text-slate-600" /></button>
                )}
                <button 
                  onClick={() => setIsShowAllModalOpen(true)} 
                  className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl cursor-pointer transition-all shadow-2xs flex items-center gap-1 text-xs font-bold text-blue-700 px-2 sm:px-2.5" 
                  title="Show All Entries"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Show All</span>
                </button>
                {isModerator && (
                  <button onClick={handleExportNativeSpreadsheet} className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-all shadow-2xs flex items-center gap-1 text-xs font-semibold text-slate-700 px-2 sm:px-2.5" title="Export Spreadsheet">
                    <Download className="w-3.5 h-3.5 text-blue-600" /> <span className="hidden sm:inline">Export</span>
                  </button>
                )}
                {isModerator && (
                  <button disabled={isDeleting} onClick={handleOpenDeleteModal} className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl cursor-pointer transition-all flex items-center gap-1 text-xs font-semibold text-red-600 px-2 sm:px-2.5 disabled:opacity-50" title="Delete All Entries">
                    <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{isDeleting ? "Deleting..." : "Delete All"}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white/95 shadow-sm flex flex-col flex-1 min-h-0 relative z-10 backdrop-blur-md">
        {/* Table Header */}
        <div className="shrink-0 border-b border-slate-200/80 z-20 bg-slate-900 text-white">
          <div className="grid grid-cols-[25%_35%_40%] w-full uppercase text-xs font-bold tracking-wider">
            <div className="p-3 text-center border-r border-slate-800 flex items-center justify-center">Name</div>
            <div className="p-3 text-center border-r border-slate-800 flex items-center justify-center">Question / Reflection</div>
            <div className="p-3 text-center flex items-center justify-center">Response</div>
          </div>
        </div>

        {/* Table Content Body */}
        <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar pb-20 lg:pb-0">
          <table className="w-full border-collapse text-left table-fixed">
            <colgroup><col className="w-[25%]" /><col className="w-[35%]" /><col className="w-[40%]" /></colgroup>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {displayedEntries.length > 0 ? displayedEntries.map((item, index) => {
                  const isHidden = item.hidden || item.status === "HIDDEN";
                  const itemId = item.id || item.rowId || item.docId || `${item.name}-${index}`;
                  const currentResponse = item.answer || item.response || "";
                  const typeInfo = TYPE_CONFIG[(item.type || "question").toLowerCase()] || TYPE_CONFIG.question;
                  const TypeIcon = typeInfo.icon;
                  const isMyEntry = !isModerator && myMarkedIds.includes(itemId);
                  const displayContent = item.question || item.content || item.message || item.text || "";

                  return (
                    <tr key={itemId} className={`text-xs sm:text-sm text-slate-800 transition-colors ${isHidden ? "bg-slate-100/80 text-slate-400" : isMyEntry ? "bg-amber-50/80 border-l-4 border-l-amber-500" : index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                      {/* Name Column */}
                      <td className="p-2 sm:p-3.5 font-semibold border-r border-slate-100 align-top">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 w-full min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0 w-full">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center shrink-0">
                              <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
                            </div>
                            <span className={`break-words text-[11px] sm:text-xs font-semibold leading-tight w-full min-w-0 ${isHidden ? "line-through opacity-60" : "text-slate-800"}`} title={item.name || "Anonymous"}>
                              {item.name || "Anonymous"}
                            </span>
                          </div>
                          {!isModerator && (
                            <button 
                              type="button" 
                              onClick={() => toggleMyEntryPin(itemId)} 
                              title="Highlight this entry"
                              className={`p-1 rounded-lg border text-xs font-bold transition-all shrink-0 self-start sm:self-auto ${isMyEntry ? "bg-amber-500 text-white border-amber-500 shadow-2xs" : "bg-white text-slate-400 border-slate-200 hover:text-amber-500"}`}
                            >
                              <BookmarkCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Question / Reflection Column */}
                      <td className="p-2 sm:p-3.5 border-r border-slate-100 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md border shrink-0 mt-0.5 ${typeInfo.bg}`}>
                              <TypeIcon className="w-3 h-3 stroke-[2.5]" />
                            </span>
                            <p className={`font-normal leading-snug flex-1 break-words ${isHidden ? "line-through text-slate-400 opacity-60" : "text-slate-800"}`}>{displayContent}</p>
                          </div>
                          {isModerator && (
                            <div className="pt-1 flex items-center gap-2 pl-7 flex-wrap">
                              {isHidden && <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md"><EyeOff className="w-3 h-3" /> Hidden</span>}
                              <button type="button" onClick={() => handleToggleHide(item, !isHidden)} className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 cursor-pointer transition-colors ${isHidden ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"}`}>
                                {isHidden ? <><Eye className="w-3 h-3" /><span className="hidden sm:inline">Restore</span></> : <><Trash2 className="w-3 h-3" /><span className="hidden sm:inline">Hide</span></>}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Response Column */}
                      <td className="p-2 sm:p-3.5 align-top">
                        <div className="space-y-1.5">
                          {currentResponse ? <p className={`font-medium border-l-2 border-blue-600 pl-2.5 leading-snug break-words ${isHidden ? "text-slate-400 line-through opacity-60" : "text-slate-900"}`}>{currentResponse}</p> : <span className="text-slate-400 text-xs block italic font-medium">Awaiting response...</span>}
                          {isModerator && (
                            <button type="button" onClick={() => handleOpenAnswerModal(item)} className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors">
                              <MessageSquare className="w-3 h-3 text-blue-600" /><span className="hidden sm:inline">{currentResponse ? "Edit Answer" : "Answer"}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan="3" className="p-8 text-center text-slate-400 font-medium text-xs sm:text-sm">No entries for {activeModule} yet.</td></tr>}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Show All Entries Modal */}
      <AnimatePresence>
        {isShowAllModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
            >
              <div>
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>All Entries Overview</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsShowAllModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
                
                {/* Gradient Bar (Blue to Red) */}
                <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 via-purple-500 to-rose-500 shrink-0" />
              </div>
              
              <div className="flex-1 p-4 min-h-0 overflow-hidden flex flex-col">
                <ShowAllEntries 
                  entries={allEntries || entries}
                  trainerId={effectiveTrainerId}
                  isModerator={isModerator}
                  selectedModule={showAllSelectedModule}
                  setSelectedModule={setShowAllSelectedModule}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ModuleTitleModal
        isOpen={isTitleModalOpen}
        moduleTag={activeModule}
        title={displayTitle}
        onClose={() => setIsTitleModalOpen(false)}
        onSave={handleSaveModalTitle}
        isModerator={isModerator}
      />

      <AnswerModal isOpen={Boolean(activeAnswerItem)} item={activeAnswerItem} answerText={answerText} setAnswerText={setAnswerText} onClose={handleCloseAnswerModal} onSave={handleSaveAnswerSubmit} />
      
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen} 
        moduleTag={activeModule} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleConfirmDeleteAll} 
        isDeleting={isDeleting} 
      />
    </div>
  );
}