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
  BookOpen
} from "lucide-react";
import AnswerModal from "./AnswerModal";
import { deleteAllEntriesForModule, db, saveModuleOptions, auth } from "../services/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";

const DEFAULT_MODULE_OPTIONS = [
  { tag: "Module 1", title: "<no title>" },
  { tag: "Module 2", title: "<no title>" },
  { tag: "Module 3", title: "<no title>" },
  { tag: "Module 4", title: "<no title>" },
  { tag: "Module 5", title: "<no title>" },
  { tag: "Module 6", title: "<no title>" },
];

const TYPE_CONFIG = {
  question: { label: "Question", bg: "bg-blue-100 text-blue-800 border-blue-300", icon: HelpCircle },
  concern: { label: "Concern", bg: "bg-amber-100 text-amber-800 border-amber-300", icon: AlertCircle },
  appreciation: { label: "Appreciation", bg: "bg-rose-100 text-rose-800 border-rose-300", icon: Heart },
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
  } catch (error) {
    console.error("Logout failed:", error);
    localStorage.clear();
    window.location.href = window.location.origin + window.location.pathname;
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-[#FFFDF9] border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 relative overflow-hidden"
        >
          <div className="flex items-center justify-between gap-3 border-b-2 border-black/10 pb-3 mb-4">
            <div className="flex items-center gap-2 font-black text-lg text-black">
              <BookOpen className="w-5 h-5 text-[#B35A53]" />
              <span className="bg-black/10 px-2 py-0.5 rounded text-xs uppercase">{moduleTag}</span>
              <span>Module Overview</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-black hover:bg-black/10 rounded-lg border-2 border-black cursor-pointer transition-colors"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {isModerator ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-gray-700">
                  Module Title
                </label>
                <textarea
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  rows={3}
                  className="w-full p-3 text-sm font-extrabold bg-white text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  placeholder="Enter module title..."
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-black bg-gray-200 hover:bg-gray-300 text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black bg-emerald-400 hover:bg-emerald-500 text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border-2 border-black/20 rounded-xl">
                <h3 className="text-base font-black text-black leading-snug">{title}</h3>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-black bg-black text-white rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-[#FFFDF9] border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3 border-b-2 border-black/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-rose-600 font-black text-lg">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              <span>Confirm Deletion</span>
            </div>
            <button 
              onClick={onClose}
              disabled={isDeleting}
              className="p-1 text-black hover:bg-black/10 rounded-lg border-2 border-black cursor-pointer transition-colors"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm font-bold text-gray-800 leading-relaxed">
              Are you sure you want to delete <span className="underline decoration-rose-500 decoration-2">ALL</span> entries for <strong className="text-black bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">{moduleTag}</strong>? This action cannot be undone.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase text-gray-700">
                Type <span className="text-rose-600 font-extrabold">&quot;delete&quot;</span> below to confirm:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="delete"
                disabled={isDeleting}
                autoFocus
                className="w-full px-3 py-2 text-sm font-extrabold bg-white text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder:text-gray-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-black bg-gray-200 hover:bg-gray-300 text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isMatched || isDeleting}
                className="px-4 py-2 text-xs font-black bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 disabled:cursor-not-allowed text-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5"
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
      return moduleOptionsProp;
    }
    try {
      const cached = localStorage.getItem(storageKey);
      return cached ? JSON.parse(cached) : DEFAULT_MODULE_OPTIONS;
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
      setModuleOptions(moduleOptionsProp);
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
          setModuleOptions(remoteOptions);
          localStorage.setItem(storageKey, JSON.stringify(remoteOptions));
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

    // UPDATED: Trim the input, and default to "<no title>" if left empty
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
    <div className="flex flex-col h-full max-h-full space-y-2 min-h-0">
      <div className="bg-[#E38B80] border-2 border-black p-2.5 sm:px-4 sm:py-2.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.9)] flex flex-col justify-between gap-2.5 shrink-0 relative z-30">
        {isEditingModule ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs font-black uppercase text-black bg-white/60 px-2.5 py-1.5 rounded-lg border-2 border-black shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">Select:</span>
              <div className="relative flex-1 min-w-0" ref={dropdownRef}>
                <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm font-extrabold bg-white text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-50 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer">
                  <span className="truncate"><strong className="text-black bg-black/10 px-2 py-0.5 rounded mr-2 text-xs uppercase font-black">{currentOption.tag}</strong>{currentOption.title}</span>
                  <ChevronDown className={`w-4 h-4 text-black shrink-0 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div initial={{ opacity: 0, y: -5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5, scale: 0.98 }} className="absolute top-full left-0 mt-1.5 w-full bg-[#FFFDF9] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 overflow-hidden py-1 max-h-52 overflow-y-auto custom-scrollbar">
                      {moduleOptions.map((mod) => (
                        <div key={mod.tag} className={`w-full px-3 py-2 text-sm font-bold border-b border-black/10 last:border-0 flex items-center justify-between gap-2 transition-colors ${selectedModule === mod.tag ? "bg-[#E38B80]/30 text-black font-black" : "hover:bg-[#E38B80]/15 text-gray-800"}`}>
                          <div 
                            onClick={() => { 
                              if (editingTag !== mod.tag) {
                                setSelectedModule(mod.tag); 
                                setIsDropdownOpen(false); 
                              }
                            }} 
                            className="flex-1 flex items-center gap-2 truncate cursor-pointer"
                          >
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-black uppercase border border-black/20 shrink-0 ${selectedModule === mod.tag ? "bg-black text-white" : "bg-black/10 text-black"}`}>{mod.tag}</span>
                            
                            {editingTag === mod.tag ? (
                              <input
                                type="text"
                                value={editingTitleInput}
                                onChange={(e) => setEditingTitleInput(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveTitle(mod.tag, e);
                                }}
                                className="px-2 py-0.5 border border-black rounded bg-white text-black font-extrabold text-xs w-full focus:outline-none"
                                autoFocus
                              />
                            ) : (
                              <span className="truncate">{mod.title}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {isModerator && (
                              editingTag === mod.tag ? (
                                <button type="button" onClick={(e) => handleSaveTitle(mod.tag, e)} className="p-1 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-500">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              ) : (
                                <button type="button" onClick={(e) => handleStartEditingTitle(mod, e)} className="p-1 text-black/60 hover:text-black hover:bg-black/10 rounded">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                            {selectedModule === mod.tag && <Check className="w-4 h-4 text-emerald-700 shrink-0 stroke-[3]" />}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-black/10">
              <button onClick={handleSaveModule} className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-400 hover:bg-emerald-500 text-black rounded-lg border-2 border-black font-black text-sm cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] transition-all"><Check className="w-4 h-4 text-black stroke-[3]" /><span className="sm:hidden">Save</span></button>
              <button onClick={() => { setSelectedModule(activeModule); setIsEditingModule(false); }} className="p-1.5 bg-gray-200 hover:bg-gray-300 text-black rounded-lg border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 active:translate-x-[1px] active:translate-y-[1px] transition-all"><X className="w-4 h-4 text-black stroke-[2.5]" /></button>
            </div>
          </div>
        ) : (
          <div className="flex flex-nowrap items-center justify-between gap-2.5 w-full min-w-0">
            <button
              type="button"
              onClick={() => setIsTitleModalOpen(true)}
              className="flex items-center min-w-0 flex-1 cursor-pointer group select-none gap-2 text-left hover:opacity-90 transition-opacity"
              title="Click to view/edit module title"
            >
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-white bg-black/40 px-2 py-1 rounded border border-black/20 shrink-0 self-center">{activeModule}</span>
              <h2 className="text-xs sm:text-sm font-black text-black tracking-tight truncate min-w-0">{displayTitle}</h2>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="text-xs font-bold text-black/90 bg-white/50 px-2 py-1 rounded border border-black/10 whitespace-nowrap">{displayedEntries.length} Entries</span>
              {isModerator && (
                <button onClick={() => { setSelectedModule(activeModule); setIsEditingModule(true); }} className="p-1.5 bg-white hover:bg-gray-100 border border-black/40 rounded cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-x-[1px] active:translate-y-[1px]" title="Change module"><Pencil className="w-3.5 h-3.5 text-black" /></button>
              )}
              {isModerator && (
                <button onClick={handleExportNativeSpreadsheet} className="p-1.5 bg-white hover:bg-gray-100 border border-black/40 rounded cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 text-xs font-bold text-black px-2" title="Export Spreadsheet">
                  <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Export</span>
                </button>
              )}
              {isModerator && (
                <button disabled={isDeleting} onClick={handleOpenDeleteModal} className="p-1.5 bg-rose-500 hover:bg-rose-600 border border-black/40 rounded cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 text-xs font-bold text-white px-2 disabled:opacity-50" title="Delete All Entries">
                  <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{isDeleting ? "Deleting..." : "Delete All"}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-2 border-black rounded-2xl overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] flex flex-col flex-1 min-h-0 relative z-10">
        <div className="shrink-0 border-b-2 border-black z-20 bg-white">
          <div className="grid grid-cols-[25%_35%_40%] w-full uppercase text-sm font-extrabold text-white">
            <div className="p-2.5 text-center bg-[#417dc1] border-r-2 border-black flex items-center justify-center">Name</div>
            <div className="p-2.5 text-center bg-[#6DA0DC] text-black border-r-2 border-black flex items-center justify-center">Question / Reflection</div>
            <div className="p-2.5 text-center bg-[#A0C4EC] text-black flex items-center justify-center">Response</div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          <table className="w-full border-collapse text-left table-fixed">
            <colgroup><col className="w-[25%]" /><col className="w-[35%]" /><col className="w-[40%]" /></colgroup>
            <tbody className="divide-y-2 divide-black/10">
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
                    <tr key={itemId} className={`text-sm sm:text-base text-black transition-colors ${isHidden ? "bg-gray-200/80 text-gray-400" : isMyEntry ? "bg-amber-100/90 border-l-4 border-l-amber-600 font-medium" : index % 2 === 0 ? "bg-[#FFFDF9]" : "bg-[#FDF6ED]"}`}>
                      <td className="p-3 font-bold border-r-2 border-black/10 align-middle">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-[#E38B80]/20 border border-black/30 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5 text-[#B35A53]" />
                            </div>
                            <span className={`truncate ${isHidden ? "line-through opacity-60" : ""}`}>{item.name || "Anonymous"}</span>
                          </div>
                          {!isModerator && (
                            <button type="button" onClick={() => toggleMyEntryPin(itemId)} className={`p-1 rounded-lg border-2 border-black text-xs font-extrabold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${isMyEntry ? "bg-amber-500 text-white" : "bg-white text-black"}`}>
                              <BookmarkCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3 border-r-2 border-black/10 align-middle">
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md border border-black/60 shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.8)] mt-0.5 ${typeInfo.bg}`}>
                              <TypeIcon className="w-3 h-3 stroke-[2.5]" />
                            </span>
                            <p className={`font-medium leading-snug flex-1 break-words ${isHidden ? "line-through text-gray-500 opacity-60" : "text-gray-900"}`}>{displayContent}</p>
                          </div>
                          {isModerator && (
                            <div className="pt-1 flex items-center gap-2 pl-7 flex-wrap">
                              {isHidden && <span className="inline-flex items-center gap-1 text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-400 px-2 py-0.5 rounded-md"><EyeOff className="w-3 h-3" /> Hidden</span>}
                              <button type="button" onClick={() => handleToggleHide(item, !isHidden)} className={`text-[11px] font-black px-2 py-0.5 rounded-lg border border-black flex items-center gap-1 cursor-pointer ${isHidden ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>
                                {isHidden ? <><Eye className="w-3 h-3" /><span className="hidden sm:inline">Restore</span></> : <><Trash2 className="w-3 h-3" /><span className="hidden sm:inline">Hide</span></>}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 align-middle">
                        <div className="space-y-1.5">
                          {currentResponse ? <p className={`font-semibold border-l-2 border-emerald-600 pl-2.5 leading-snug break-words ${isHidden ? "text-gray-400 line-through opacity-60" : "text-gray-900"}`}>{currentResponse}</p> : <span className="text-amber-800 text-xs sm:text-sm block italic font-medium">Awaiting response...</span>}
                          {isModerator && (
                            <button type="button" onClick={() => handleOpenAnswerModal(item)} className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-extrabold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-black px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
                              <MessageSquare className="w-3 h-3" /><span className="hidden sm:inline">{currentResponse ? "Edit Answer" : "Answer"}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan="3" className="p-8 text-center text-gray-500 font-semibold text-sm">No entries for {activeModule} yet.</td></tr>}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

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