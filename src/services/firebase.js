import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc,
  writeBatch,
  query, 
  where, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA53TaCIXdhYJ2d0iDReDDcWM-jZjgCA1s",
  authDomain: "thought-hub-dswd.firebaseapp.com",
  projectId: "thought-hub-dswd",
  storageBucket: "thought-hub-dswd.firebasestorage.app",
  messagingSenderId: "651906458635",
  appId: "1:651906458635:web:3cb7d40e5964a8b23b530e",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// DEFAULT FALLBACK MODULE OPTIONS
export const DEFAULT_MODULE_OPTIONS = [
  { tag: "Module 1", title: "Disasters and Emergencies and Their Impact" },
  { tag: "Module 2", title: "Psychological First Aid Principles & Core Actions" },
  { tag: "Module 3", title: "Support Strategies & Active Listening" },
  { tag: "Module 4", title: "Self-Care & Responder Well-being" },
  { tag: "Module 5", title: "Crisis Escalation & Referral Pathways" },
  { tag: "Module 6", title: "Action Planning & Community Integration" },
];

// AUTHENTICATION HELPERS
export const signUpTrainer = (email, password) => 
  createUserWithEmailAndPassword(auth, email, password);

export const loginTrainer = (email, password) => 
  signInWithEmailAndPassword(auth, email, password);

export const logoutTrainer = () => 
  signOut(auth);

export const subscribeToAuthChanges = (callback) => 
  onAuthStateChanged(auth, callback);

const questionsCollection = collection(db, "questions");

// Real-Time Entries, Active Module, & Module Options Listener
export const subscribeToEntries = (activeModule, trainerId, callback) => {
  if (!trainerId) return () => {};

  let rawTrainerEntries = [];
  let currentModule = activeModule;
  let customModuleOptions = null;

  const emit = () => {
    const filteredEntries = rawTrainerEntries.filter(
      (item) => item.module === currentModule
    );
    callback({ 
      entries: filteredEntries, 
      activeModule: currentModule,
      moduleOptions: customModuleOptions
    });
  };

  // 1. Listen to Questions
  const q = query(
    questionsCollection, 
    where("trainerId", "==", trainerId)
  );
  const unsubQuestions = onSnapshot(q, (snapshot) => {
    rawTrainerEntries = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      docId: docSnap.id,
      rowId: docSnap.id,
      ...docSnap.data(),
    }));
    emit();
  }, (err) => console.error("Firestore questions error:", err));

  // 2. Listen to Active Module Setting
  const trainerConfigRef = doc(db, "trainers", trainerId);
  const unsubConfig = onSnapshot(trainerConfigRef, (configSnap) => {
    if (configSnap.exists() && configSnap.data().activeModule) {
      currentModule = configSnap.data().activeModule;
      emit();
    }
  }, (err) => console.error("Firestore trainer config error:", err));

  // 3. Listen to Module Titles / Options Setting (Auto-creates document if missing)
  const modulesRef = doc(db, "trainers", trainerId, "settings", "modules");
  const unsubModules = onSnapshot(modulesRef, async (modulesSnap) => {
    if (modulesSnap.exists() && Array.isArray(modulesSnap.data()?.options)) {
      customModuleOptions = modulesSnap.data().options;
      emit();
    } else {
      // Auto-initialize defaults in Firestore for new trainers
      try {
        await setDoc(modulesRef, { options: DEFAULT_MODULE_OPTIONS }, { merge: true });
      } catch (err) {
        console.error("Failed to seed default module settings:", err);
      }
    }
  }, (err) => console.error("Firestore module options error:", err));

  return () => {
    unsubQuestions();
    unsubConfig();
    unsubModules();
  };
};

// STANDALONE REAL-TIME LISTENER FOR MODULE OPTIONS (WITH AUTO-CREATION)
export const subscribeToModuleOptions = (trainerId, callback) => {
  if (!trainerId) return () => {};

  const modulesRef = doc(db, "trainers", trainerId, "settings", "modules");
  return onSnapshot(
    modulesRef, 
    async (snapshot) => {
      if (snapshot.exists() && Array.isArray(snapshot.data()?.options)) {
        callback(snapshot.data().options);
      } else {
        // Auto-initialize defaults in Firestore if no options exist yet
        try {
          await setDoc(modulesRef, { options: DEFAULT_MODULE_OPTIONS }, { merge: true });
        } catch (err) {
          console.error("Failed to seed default module settings:", err);
        }
      }
    },
    (err) => console.error("Firestore module options subscription error:", err)
  );
};

// SAVE MODULE OPTIONS / EDITED TITLES TO FIRESTORE
export const saveModuleOptions = async (trainerId, optionsArray) => {
  if (!trainerId) return { success: false, error: "Missing trainerId" };
  try {
    const docRef = doc(db, "trainers", trainerId, "settings", "modules");
    await setDoc(docRef, { options: optionsArray }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving module options:", error);
    return { success: false, error };
  }
};

// Add / Submit Question
export const addQuestion = async (questionData) => {
  try {
    const docRef = await addDoc(questionsCollection, {
      ...questionData,
      answer: questionData.answer || "",
      response: questionData.response || "",
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding document: ", error);
    return { success: false, error };
  }
};
export const submitEntry = addQuestion;

// Fetch Questions (Filtered by module)
export const getQuestionsByModule = async (moduleTag) => {
  try {
    const q = moduleTag 
      ? query(questionsCollection, where("module", "==", moduleTag))
      : questionsCollection;
      
    const querySnapshot = await getDocs(q);
    const questions = querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    return { success: true, data: questions };
  } catch (error) {
    console.error("Error fetching documents: ", error);
    return { success: false, error };
  }
};

// Update Response / Answer by Document ID
export const updateQuestionAnswer = async (id, answerText) => {
  try {
    if (!id) {
      console.error("updateQuestionAnswer failed: Missing document ID");
      return { success: false, error: "Missing document ID" };
    }
    const docRef = doc(db, "questions", id);
    await updateDoc(docRef, { 
      answer: answerText, 
      response: answerText,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating answer: ", error);
    return { success: false, error };
  }
};
export const saveAnswerEntry = async ({ rowId, answer }) => updateQuestionAnswer(rowId, answer);

// Toggle Hide Status
export const toggleHideQuestion = async (id, isHidden) => {
  try {
    if (!id) return { success: false, error: "Missing ID" };
    const docRef = doc(db, "questions", id);
    await updateDoc(docRef, { hidden: isHidden, status: isHidden ? "HIDDEN" : "ACTIVE" });
    return { success: true };
  } catch (error) {
    console.error("Error toggling hide status: ", error);
    return { success: false, error };
  }
};
export const toggleHideEntry = async ({ rowId, shouldHide }) => toggleHideQuestion(rowId, shouldHide);

// Update Active Module per Trainer ID
export const updateActiveModule = async (trainerId, newModule) => {
  if (!trainerId) return;
  try {
    const trainerConfigRef = doc(db, "trainers", trainerId);
    await setDoc(trainerConfigRef, { activeModule: newModule }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error updating active module:", error);
    return { success: false, error };
  }
};

// Delete All Entries for a Specific Module and Trainer ID
export const deleteAllEntriesForModule = async (trainerId, moduleTag) => {
  if (!trainerId || !moduleTag) return { success: false, error: "Missing trainer ID or module tag" };
  try {
    const q = query(
      questionsCollection,
      where("trainerId", "==", trainerId),
      where("module", "==", moduleTag)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return { success: true, count: 0 };

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();

    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error("Error deleting all entries for module:", error);
    return { success: false, error };
  }
};

// DEFAULT FALLBACK HEADER TITLE
export const DEFAULT_HEADER_TITLE = "Trauma Informed - Psychological First Aid Training";

// STANDALONE REAL-TIME LISTENER FOR HEADER TITLE (WITH AUTO-CREATION)
export const subscribeToHeaderTitle = (trainerId, callback) => {
  if (!trainerId) return () => {};

  const headerRef = doc(db, "trainers", trainerId, "settings", "header");
  return onSnapshot(
    headerRef,
    async (snapshot) => {
      if (snapshot.exists() && snapshot.data()?.title) {
        callback(snapshot.data().title);
      } else {
        // Auto-initialize default title in Firestore if none exists yet
        try {
          await setDoc(headerRef, { title: DEFAULT_HEADER_TITLE }, { merge: true });
        } catch (err) {
          console.error("Failed to seed default header title settings:", err);
        }
      }
    },
    (err) => console.error("Firestore header title subscription error:", err)
  );
};

// SAVE HEADER TITLE TO FIRESTORE
export const saveHeaderTitle = async (trainerId, newTitle) => {
  if (!trainerId) return { success: false, error: "Missing trainerId" };
  try {
    const docRef = doc(db, "trainers", trainerId, "settings", "header");
    await setDoc(docRef, { title: newTitle.trim() || DEFAULT_HEADER_TITLE }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving header title:", error);
    return { success: false, error };
  }
};