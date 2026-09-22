import { useState, useRef, useEffect } from "react";
import { User, HelpCircle, AlertCircle, Heart, BookmarkCheck, ChevronDown, Check, Layers, Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { subscribeToAllEntries } from "../services/firebase";

const TYPE_CONFIG = {
  question: { label: "Question", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: HelpCircle },
  concern: { label: "Concern", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircle },
  appreciation: { label: "Appreciation", bg: "bg-red-50 text-red-700 border-red-200", icon: Heart },
};

const MODULE_LIST = Array.from({ length: 12 }, (_, i) => `Module ${i + 1}`);

export default function ShowAllEntries({ 
  trainerId = null, 
  isModerator = false,
  selectedModule: externalSelectedModule,
  setSelectedModule: externalSetSelectedModule
}) {
  const [fetchedEntries, setFetchedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [internalSelectedModule, setInternalSelectedModule] = useState("ALL");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sync state between parent control and local state
  const selectedModule = externalSelectedModule !== undefined ? externalSelectedModule : internalSelectedModule;
  const setSelectedModule = (mod) => {
    if (externalSetSelectedModule) externalSetSelectedModule(mod);
    setInternalSelectedModule(mod);
  };

  // 1. DIRECT FIREBASE REAL-TIME SUBSCRIPTION
  useEffect(() => {
    if (!trainerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToAllEntries(trainerId, (data) => {
      setFetchedEntries(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [trainerId]);

  const [myMarkedIds, setMyMarkedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("myMarkedEntryIds") || "[]");
    } catch {
      return [];
    }
  });

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMyEntryPin = (itemId) => {
    if (!itemId) return;
    const updated = myMarkedIds.includes(itemId)
      ? myMarkedIds.filter((id) => id !== itemId)
      : [...myMarkedIds, itemId];
    setMyMarkedIds(updated);
    localStorage.setItem("myMarkedEntryIds", JSON.stringify(updated));
  };

  // Helper to extract numeric module digits safely
  const parseModuleNum = (val) => {
    if (val === null || val === undefined) return null;
    const match = String(val).match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  };

  // 2. Filter out hidden entries for non-moderators
  const visibleEntries = isModerator
    ? fetchedEntries
    : fetchedEntries.filter((e) => !e.hidden && e.status !== "HIDDEN");

  // 3. Functional Module Filtering for Single or ALL Modules (1-12)
  const filteredEntries = visibleEntries.filter((e) => {
    if (!selectedModule || selectedModule === "ALL") return true;

    const entryVal = 
      e.module ?? 
      e.moduleTag ?? 
      e.moduleId ?? 
      e.activeModule ?? 
      e.module_id ?? 
      e.data?.module ?? 
      e.data?.activeModule;
    
    const entryModNum = parseModuleNum(entryVal);
    const selectedModNum = parseModuleNum(selectedModule);

    if (entryModNum !== null && selectedModNum !== null) {
      return entryModNum === selectedModNum;
    }

    const rawModule = String(entryVal || "").trim().toLowerCase();
    const targetModule = String(selectedModule).trim().toLowerCase();

    return rawModule === targetModule || rawModule === targetModule.replace("module ", "");
  });

  // Sort entries by date (newest first)
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const timeA = a.createdAt?.toMillis
      ? a.createdAt.toMillis()
      : a.createdAt?.seconds
      ? a.createdAt.seconds * 1000
      : new Date(a.createdAt || 0).getTime();
    const timeB = b.createdAt?.toMillis
      ? b.createdAt.toMillis()
      : b.createdAt?.seconds
      ? b.createdAt.seconds * 1000
      : new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  return (
    <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white/95 shadow-sm flex flex-col flex-1 min-h-0 relative z-10 backdrop-blur-md">
      {/* Compact Header for Mobile */}
      <div className="p-1.5 sm:p-3 border-b border-slate-200/80 bg-slate-50/90 flex flex-col gap-1.5 shrink-0 z-30">
        <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600">
          <Filter className="w-3 h-3 text-blue-600 shrink-0" />
          <span>Filter Entries:</span>
        </div>

        {/* Compact Button Bar */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedModule("ALL")}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              selectedModule === "ALL"
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-3 h-3 shrink-0" />
            <span className="truncate">All Modules (1-12)</span>
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full flex items-center justify-between gap-1 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                selectedModule !== "ALL"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="truncate">
                {selectedModule === "ALL" ? "Select Module" : selectedModule}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  className="absolute right-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 max-h-48 overflow-y-auto custom-scrollbar"
                >
                  <div
                    onClick={() => {
                      setSelectedModule("ALL");
                      setIsDropdownOpen(false);
                    }}
                    className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold border-b border-slate-100 cursor-pointer flex items-center justify-between transition-colors ${
                      selectedModule === "ALL" ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-blue-600" />
                      <span>All Modules</span>
                    </span>
                    {selectedModule === "ALL" && <Check className="w-3 h-3 text-blue-600 stroke-[3]" />}
                  </div>

                  {MODULE_LIST.map((modTag) => (
                    <div
                      key={modTag}
                      onClick={() => {
                        setSelectedModule(modTag);
                        setIsDropdownOpen(false);
                      }}
                      className={`px-2.5 py-1 text-[10px] sm:text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                        selectedModule === modTag ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span>{modTag}</span>
                      {selectedModule === modTag && <Check className="w-3 h-3 text-blue-600 stroke-[3]" />}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar">
        {loading ? (
          <div className="p-4 text-center text-slate-400 font-medium text-xs">
            Fetching entries from all modules...
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="p-4 text-center text-slate-400 font-medium text-xs">
            No entries found for {selectedModule === "ALL" ? "any module" : selectedModule}.
          </div>
        ) : (
          <div className="w-full">
            <div className="shrink-0 border-b border-slate-200/80 bg-slate-900 text-white sticky top-0 z-20">
              <div className="grid grid-cols-[28%_36%_36%] w-full uppercase text-[10px] sm:text-xs font-bold tracking-wider text-center">
                <div className="p-2 border-r border-slate-800">Name</div>
                <div className="p-2 border-r border-slate-800">Question / Reflection</div>
                <div className="p-2">Response</div>
              </div>
            </div>

            <table className="w-full border-collapse text-left table-fixed">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[36%]" />
                <col className="w-[36%]" />
              </colgroup>
              <tbody className="divide-y divide-slate-100">
                {sortedEntries.map((item, index) => {
                  const isHidden = item.hidden || item.status === "HIDDEN";
                  const itemId = item.id || item.rowId || item.docId || `${item.name}-${index}`;
                  const currentResponse = item.answer || item.response || "";
                  const typeInfo = TYPE_CONFIG[(item.type || "question").toLowerCase()] || TYPE_CONFIG.question;
                  const TypeIcon = typeInfo.icon;
                  const isMyEntry = !isModerator && myMarkedIds.includes(itemId);
                  const displayContent = item.question || item.content || item.message || item.text || "";
                  
                  const rawMod = 
                    item.module ?? 
                    item.moduleTag ?? 
                    item.module_id ?? 
                    item.activeModule ?? 
                    item.data?.module;
                  const modNum = parseModuleNum(rawMod);
                  const itemModuleTag = modNum ? `MODULE ${modNum}` : String(rawMod || "").toUpperCase();

                  return (
                    <tr
                      key={itemId}
                      className={`text-[11px] sm:text-xs text-slate-800 transition-colors ${
                        isHidden
                          ? "bg-slate-100/80 text-slate-400"
                          : isMyEntry
                          ? "bg-amber-50/80 border-l-2 border-l-amber-500"
                          : index % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50/50"
                      }`}
                    >
                      {/* Name Column */}
                      <td className="p-2 font-semibold border-r border-slate-100 align-top">
                        <div className="flex flex-col gap-1 items-start w-full min-w-0">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-blue-50 border border-blue-200/60 flex items-center justify-center shrink-0">
                            <User className="w-3 h-3 text-blue-600" />
                          </div>
                          <div className="flex flex-col min-w-0 w-full">
                            <span className={`break-words leading-tight ${isHidden ? "line-through opacity-60" : "text-slate-800"}`}>
                              {item.name || "Anonymous"}
                            </span>
                            {itemModuleTag && (
                              <span className="text-[8px] font-extrabold text-blue-600 uppercase tracking-tight mt-0.5 break-all">
                                {itemModuleTag}
                              </span>
                            )}
                          </div>
                          {!isModerator && (
                            <button
                              type="button"
                              onClick={() => toggleMyEntryPin(itemId)}
                              title="Highlight this entry"
                              className={`p-0.5 rounded border text-[10px] transition-all shrink-0 mt-0.5 ${
                                isMyEntry
                                  ? "bg-amber-500 text-white border-amber-500"
                                  : "bg-white text-slate-400 border-slate-200 hover:text-amber-500"
                              }`}
                            >
                              <BookmarkCheck className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Question Column */}
                      <td className="p-2 border-r border-slate-100 align-top">
                        <div className="flex items-start gap-1">
                          <span className={`inline-flex items-center justify-center w-4 h-4 rounded border shrink-0 mt-0.5 ${typeInfo.bg}`}>
                            <TypeIcon className="w-2.5 h-2.5 stroke-[2.5]" />
                          </span>
                          <p className={`font-normal leading-tight flex-1 break-words ${isHidden ? "line-through text-slate-400 opacity-60" : "text-slate-800"}`}>
                            {displayContent}
                          </p>
                        </div>
                      </td>

                      {/* Response Column */}
                      <td className="p-2 align-top">
                        {currentResponse ? (
                          <p className={`font-medium border-l-2 border-blue-600 pl-1.5 leading-tight break-words ${isHidden ? "text-slate-400 line-through opacity-60" : "text-slate-900"}`}>
                            {currentResponse}
                          </p>
                        ) : (
                          <span className="text-slate-400 text-[10px] block italic font-medium leading-tight">
                            Awaiting response...
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}