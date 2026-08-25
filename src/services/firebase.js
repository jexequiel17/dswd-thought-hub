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

// Real-Time Entries & Active Module Listener (Scoped strictly by trainerId)
export const subscribeToEntries = (activeModule, trainerId, callback) => {
  if (!trainerId) return () => {};

  let rawTrainerEntries = [];
  let currentModule = activeModule;

  const emit = () => {
    // Filter questions so only entries for the current active module and trainerId are shown
    const filteredEntries = rawTrainerEntries.filter(
      (item) => item.module === currentModule
    );
    callback({ entries: filteredEntries, activeModule: currentModule });
  };

  // 1. Listen for all questions matching this specific trainerId
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

  // 2. Listen for active module changes controlled by this trainer
  const trainerConfigRef = doc(db, "trainers", trainerId);
  const unsubConfig = onSnapshot(trainerConfigRef, (configSnap) => {
    if (configSnap.exists() && configSnap.data().activeModule) {
      currentModule = configSnap.data().activeModule;
      emit();
    }
  }, (err) => console.error("Firestore trainer config error:", err));

  return () => {
    unsubQuestions();
    unsubConfig();
  };
};

// Add / Submit Question (Attaches trainerId to bind participant to trainer)
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