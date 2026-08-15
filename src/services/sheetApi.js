import { db } from "./firebase";
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc, 
  query, 
  where, 
  setDoc, 
  getDoc,
  runTransaction 
} from "firebase/firestore";

// 1. Real-time listener for entries and active module
// This replaces periodic fetching with automatic live updates from Firebase
export function subscribeToEntries(currentModule, onUpdate) {
  try {
    // Listen to global active module setting in real-time
    const settingRef = doc(db, "settings", "global");
    
    // We can set up a combined or separate listener. Let's listen to entries first:
    const entriesRef = collection(db, "entries");
    const q = query(entriesRef, where("module", "==", currentModule));

    // onSnapshot listens continuously and triggers automatically on any change
    const unsubscribeEntries = onSnapshot(q, async (querySnapshot) => {
      let entries = [];
      querySnapshot.forEach((document) => {
        const data = document.data();
        entries.push({
          id: document.id,
          timestamp: data.timestamp || "",
          name: data.name || "Anonymous",
          type: data.type || "Question",
          content: data.content || "",
          answer: data.answer || "",
          response: data.answer || "",
          status: data.status || "ACTIVE",
          hidden: data.status === "HIDDEN"
        });
      });

      // Sort newest entries on top
      entries.sort((a, b) => Number(b.id) - Number(a.id));

      // Get current active module as well
      const settingSnap = await getDoc(settingRef);
      let activeModule = "Module 1";
      if (settingSnap.exists()) {
        activeModule = settingSnap.data().activeModule || "Module 1";
      }

      // Send the live data back to your React component
      onUpdate({
        activeModule: activeModule,
        entries: entries
      });
    }, (err) => {
      console.error("Error with Firebase real-time listener:", err);
    });

    // Return the unsubscribe function so you can clean it up when components unmount
    return unsubscribeEntries;
  } catch (err) {
    console.error("Error setting up snapshot listener:", err);
    return () => {};
  }
}

// 2. Submit a new participant entry with a sequential number ID
export async function submitEntry(entryData) {
  try {
    const now = new Date();
    const dateStr = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear() + " " + now.toLocaleTimeString();

    const counterRef = doc(db, "settings", "counter");
    
    const newId = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterRef);
      let nextId = 1;
      
      if (counterSnap.exists()) {
        nextId = (counterSnap.data().lastId || 0) + 1;
      }
      
      transaction.set(counterRef, { lastId: nextId });
      return nextId.toString();
    });

    const customDocRef = doc(db, "entries", newId);
    await setDoc(customDocRef, {
      module: entryData.sheet || "Module 1",
      timestamp: dateStr,
      name: entryData.name || "Anonymous",
      type: entryData.type || "Question",
      content: entryData.content || "",
      answer: "",
      status: "ACTIVE",
      createdAt: Date.now()
    });

    return { status: "success" };
  } catch (err) {
    console.error("Error submitting entry:", err);
    return { status: "error", message: err.toString() };
  }
}

// 3. Update the global active module (Admin only)
export async function updateActiveModule(newModule) {
  try {
    const settingRef = doc(db, "settings", "global");
    await setDoc(settingRef, { activeModule: newModule }, { merge: true });
    return { status: "success", activeModule: newModule };
  } catch (err) {
    console.error("Error updating active module:", err);
    return { status: "error" };
  }
}

// 4. Toggle hide/show status for an entry (Admin only)
export async function toggleHideEntry({ rowId, shouldHide }) {
  try {
    const entryRef = doc(db, "entries", rowId);
    const newStatus = shouldHide ? "HIDDEN" : "ACTIVE";
    await updateDoc(entryRef, { status: newStatus });
    return { status: "success" };
  } catch (err) {
    console.error("Error toggling hide:", err);
    return { status: "error" };
  }
}

// 5. Save or update a moderator response/answer (Admin only)
export async function saveAnswerEntry({ rowId, answer }) {
  try {
    const entryRef = doc(db, "entries", rowId);
    await updateDoc(entryRef, { answer: answer || "" });
    return { status: "success" };
  } catch (err) {
    console.error("Error saving answer:", err);
    return { status: "error" };
  }
}