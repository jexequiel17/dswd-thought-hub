import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
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
  Layers
} from "lucide-react";
import AnswerModal from "./AnswerModal";
import { deleteAllEntriesForModule, db, auth } from "../services/firebase";
import { signOut } from "firebase/auth";

const BATCH_SIZE = 5;

const TYPE_CONFIG = {
  question: { label: "Question", bg: "bg-blue-100 text-blue-700 border-blue-200", icon: HelpCircle },
  concern: { label: "Concern", bg: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle },
  appreciation: { label: "Appreciation", bg: "bg-red-100 text-red-700 border-red-200", icon: Heart },
};

export const handleTrainerLogout = async () => {
  try {
    await signOut(auth);
    window.location.href = window.location.origin + window.location.pathname;
    window.location.reload();
  } catch (error) {
    console.error("Logout failed:", error);
    window.location.href = window.location.origin + window.location.pathname;
    window.location.reload();
  }
};

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, isDeleting }) {
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
          className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-5 relative overflow-hidden"
        >
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
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="underline decoration-red-500 font-bold text-slate-800">ALL</span> entries? This action cannot be undone.
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
  activeModule = "Module 1", 
  activeTrainingId = "",
  trainerId = "",
  isModerator = false, 
  onToggleHideEntry,
  onSaveAnswer,
  onDeleteAllEntries
}) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeAnswerItem, setActiveAnswerItem] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const scrollContainerRef = useRef(null);

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

  const [myMarkedIds, setMyMarkedIds] = useState([]);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [activeModule, entries.length]);

  const toggleMyEntryPin = (itemId) => {
    if (!itemId) return;
    if (myMarkedIds.includes(itemId)) {
      setMyMarkedIds(myMarkedIds.filter(id => id !== itemId));
    } else {
      setMyMarkedIds([...myMarkedIds, itemId]);
    }
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

    const headers = ["Name", "Type", "Question / Content", "Response", "Status"];

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
        <Worksheet ss:Name="All_Entries">
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
    link.setAttribute("download", `all_entries.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const filteredByTraining = activeTrainingId
    ? entries.filter((e) => e.trainingId === activeTrainingId)
    : entries;

  const rawDisplayedEntries = isModerator 
    ? filteredByTraining 
    : filteredByTraining.filter((e) => !e.hidden && e.status !== "HIDDEN");

  const displayedEntries = [...rawDisplayedEntries].sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime());
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime());
    return timeB - timeA;
  });

  const visibleEntries = displayedEntries.slice(0, visibleCount);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (visibleCount < displayedEntries.length) {
        setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, displayedEntries.length));
      }
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full space-y-3 min-h-0 bg-slate-50/50 p-2 sm:p-4 rounded-3xl">
      <style>{`
        .custom-scrollbar {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.6);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #2563eb, #ef4444);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #1d4ed8, #dc2626);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #2563eb rgba(241, 245, 249, 0.6);
        }
      `}</style>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs shrink-0 relative z-30">
        <div className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0 w-full sm:w-auto flex-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg shrink-0 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate min-w-0 leading-tight">
                Submitted Questions & Reflections
              </h2>
            </div>

            <span className="text-[10px] sm:text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 whitespace-nowrap shrink-0 ml-auto">
              {visibleEntries.length} of {displayedEntries.length} <span className="hidden sm:inline">Entries</span>
            </span>
          </div>

          {isModerator && (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pt-1 sm:pt-0 border-t border-slate-100 sm:border-t-0 justify-end w-full sm:w-auto">
              <button 
                onClick={handleExportNativeSpreadsheet} 
                className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-all shadow-2xs flex items-center gap-1 text-xs font-semibold text-slate-700 px-2 sm:px-2.5" 
                title="Export Spreadsheet"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Export</span>
              </button>

              <button 
                disabled={isDeleting} 
                onClick={handleOpenDeleteModal} 
                className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl cursor-pointer transition-all flex items-center gap-1 text-xs font-semibold text-red-600 px-2 sm:px-2.5 disabled:opacity-50" 
                title="Delete All Entries"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : "Delete All"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <motion.div 
        layoutScroll
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="overflow-y-auto flex-1 min-h-0 space-y-3 custom-scrollbar pb-20 lg:pb-0 pr-1"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {visibleEntries.length > 0 ? visibleEntries.map((item, index) => {
            const isHidden = item.hidden || item.status === "HIDDEN";
            const itemId = item.id || item.rowId || item.docId || `${item.name}-${index}`;
            const currentResponse = item.answer || item.response || "";
            const typeInfo = TYPE_CONFIG[(item.type || "question").toLowerCase()] || TYPE_CONFIG.question;
            const TypeIcon = typeInfo.icon;
            const isMyEntry = !isModerator && myMarkedIds.includes(itemId);
            const displayContent = item.question || item.content || item.message || item.text || "";

            return (
              <motion.div 
                key={itemId}
                layout="position"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.15, root: scrollContainerRef }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 24,
                  mass: 0.8
                }}
                className={`w-full rounded-2xl sm:rounded-3xl border-2 p-3.5 sm:p-5 transition-all shadow-sm hover:shadow-md ${
                  isMyEntry 
                    ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/30" 
                    : isHidden 
                    ? "bg-slate-100/80 text-slate-400 border-slate-200" 
                    : index % 2 === 0 
                    ? "bg-white border-blue-200 hover:border-blue-300" 
                    : "bg-slate-50 border-slate-200/90 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isMyEntry 
                        ? "bg-amber-200 text-amber-800" 
                        : "bg-blue-100 text-blue-700 border border-blue-200"
                    }`}>
                      <User className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <span className={`text-xs sm:text-sm font-extrabold truncate block ${
                        isHidden ? "line-through opacity-60" : "text-slate-900"
                      }`} title={item.name || "Anonymous"}>
                        {item.name || "Anonymous"}
                      </span>
                      
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${typeInfo.bg}`}>
                        <TypeIcon className="w-3 h-3" />
                        {typeInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isModerator && (
                      <button 
                        type="button" 
                        onClick={() => toggleMyEntryPin(itemId)} 
                        title="Highlight entry"
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isMyEntry 
                            ? "bg-amber-500 text-white border-amber-500 shadow-xs" 
                            : "bg-white text-slate-400 border-slate-200 hover:text-amber-500 hover:bg-slate-50"
                        }`}
                      >
                        <BookmarkCheck className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    )}

                    {isModerator && (
                      <>
                        <button 
                          type="button" 
                          onClick={() => handleToggleHide(item, !isHidden)} 
                          title={isHidden ? "Restore entry" : "Hide entry"}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isHidden 
                              ? "bg-emerald-500 text-white border-emerald-500" 
                              : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {isHidden ? <Eye className="w-4 h-4 stroke-[2.5]" /> : <EyeOff className="w-4 h-4 stroke-[2.5]" />}
                        </button>

                        <button 
                          type="button" 
                          onClick={() => handleOpenAnswerModal(item)} 
                          title={currentResponse ? "Edit Answer" : "Answer"}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-xl cursor-pointer transition-all shadow-xs"
                        >
                          <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <div>
                    <p className={`text-xs sm:text-sm font-semibold leading-relaxed break-words ${
                      isHidden ? "line-through opacity-60" : "text-slate-800"
                    }`}>
                      {displayContent}
                    </p>
                  </div>

                  {currentResponse ? (
                    <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 mt-2">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 mb-0.5">
                        Response:
                      </p>
                      <p className={`text-xs sm:text-sm font-medium text-slate-700 leading-snug break-words ${
                        isHidden ? "line-through opacity-60" : ""
                      }`}>
                        {currentResponse}
                      </p>
                    </div>
                  ) : (
                    <span className="text-[11px] italic text-slate-400 block pt-1">
                      Awaiting response...
                    </span>
                  )}
                </div>
              </motion.div>
            );
          }) : (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center text-slate-400 font-medium text-xs sm:text-sm bg-white rounded-3xl border-2 border-slate-200 shadow-xs">
              No entries submitted yet.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnswerModal 
        isOpen={Boolean(activeAnswerItem)} 
        item={activeAnswerItem} 
        answerText={answerText} 
        setAnswerText={setAnswerText} 
        onClose={handleCloseAnswerModal} 
        onSave={handleSaveAnswerSubmit} 
      />
      
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleConfirmDeleteAll} 
        isDeleting={isDeleting} 
      />
    </div>
  );
}