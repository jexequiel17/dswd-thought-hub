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
  Download 
} from "lucide-react";
import AnswerModal from "./AnswerModal";

const MODULE_OPTIONS = [
  { tag: "Module 1", title: "Disasters and Emergencies and Their Impact" },
  { tag: "Module 2", title: "Psychological First Aid Principles & Core Actions" },
  { tag: "Module 3", title: "Support Strategies & Active Listening" },
  { tag: "Module 4", title: "Self-Care & Responder Well-being" },
  { tag: "Module 5", title: "Crisis Escalation & Referral Pathways" },
  { tag: "Module 6", title: "Action Planning & Community Integration" },
];

const TYPE_CONFIG = {
  question: { label: "Question", bg: "bg-blue-100 text-blue-800 border-blue-300", icon: HelpCircle },
  concern: { label: "Concern", bg: "bg-amber-100 text-amber-800 border-amber-300", icon: AlertCircle },
  appreciation: { label: "Appreciation", bg: "bg-rose-100 text-rose-800 border-rose-300", icon: Heart },
};

export default function ModuleTable({ 
  entries = [], 
  activeModule = "Module 1", 
  moduleTitle = "", 
  trainerId = "",
  isModerator = false, 
  onModuleChange,
  onToggleHideEntry,
  onSaveAnswer
}) {
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [selectedModule, setSelectedModule] = useState(activeModule);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [activeAnswerItem, setActiveAnswerItem] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const dropdownRef = useRef(null);

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

  // Pure JavaScript Native Spreadsheet Exporter (No XLSX library needed)
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
      await onSaveAnswer(activeAnswerItem, answerText, trainerId || activeAnswerItem.trainerId, activeModule);
    }
    handleCloseAnswerModal();
  };

  const handleToggleHide = (item, shouldHide) => {
    if (onToggleHideEntry) {
      onToggleHideEntry(item, shouldHide, trainerId || item.trainerId, activeModule);
    }
  };

  const currentOption = MODULE_OPTIONS.find((m) => m.tag === selectedModule) || MODULE_OPTIONS[0];

  // 1. Filter out hidden entries for non-moderators
  const rawDisplayedEntries = isModerator ? entries : entries.filter((e) => !e.hidden && e.status !== "HIDDEN");

  // 2. Sort entries so the newest timestamp/createdAt appears at the top
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
                      {MODULE_OPTIONS.map((mod) => (
                        <button key={mod.tag} type="button" onClick={() => { setSelectedModule(mod.tag); setIsDropdownOpen(false); }} className={`w-full text-left px-3 py-2 text-sm font-bold border-b border-black/10 last:border-0 flex items-center justify-between gap-2 transition-colors cursor-pointer ${selectedModule === mod.tag ? "bg-[#E38B80]/30 text-black font-black" : "hover:bg-[#E38B80]/15 text-gray-800"}`}>
                          <span className="truncate"><span className={`inline-block px-2 py-0.5 rounded mr-2 text-xs font-black uppercase border border-black/20 ${selectedModule === mod.tag ? "bg-black text-white" : "bg-black/10 text-black"}`}>{mod.tag}</span>{mod.title}</span>
                          {selectedModule === mod.tag && <Check className="w-4 h-4 text-emerald-700 shrink-0 stroke-[3]" />}
                        </button>
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
          <div className="flex flex-wrap items-center justify-between gap-2 w-full min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-white bg-black/40 px-2 py-0.5 rounded border border-black/20 shrink-0">{activeModule}</span>
              <h2 className="text-xs sm:text-sm font-black text-black tracking-tight truncate">{moduleTitle}</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <span className="text-xs font-bold text-black/90 bg-white/50 px-2 py-0.5 rounded border border-black/10">{displayedEntries.length} Entries</span>
              {isModerator && (
                <button onClick={() => { setSelectedModule(activeModule); setIsEditingModule(true); }} className="p-1.5 bg-white hover:bg-gray-100 border border-black/40 rounded cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-x-[1px] active:translate-y-[1px]" title="Change module"><Pencil className="w-3.5 h-3.5 text-black" /></button>
              )}
              {isModerator && (
                <button onClick={handleExportNativeSpreadsheet} className="p-1.5 bg-white hover:bg-gray-100 border border-black/40 rounded cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 text-xs font-bold text-black px-2" title="Export Spreadsheet">
                  <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Export</span>
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
      <AnswerModal isOpen={Boolean(activeAnswerItem)} item={activeAnswerItem} answerText={answerText} setAnswerText={setAnswerText} onClose={handleCloseAnswerModal} onSave={handleSaveAnswerSubmit} />
    </div>
  );
}