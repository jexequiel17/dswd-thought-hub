import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
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
  serverTimestamp,
  getDoc
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

// DEFAULT FALLBACK HEADER TITLE
export const DEFAULT_HEADER_TITLE = "Trainer Dashboard";
export const DEFAULT_CO_TRAINER_PASSCODE = "dswd143";

// AUTHENTICATION HELPERS
export const signUpTrainer = (email, password) => 
  createUserWithEmailAndPassword(auth, email, password);

export const loginTrainer = (email, password) => 
  signInWithEmailAndPassword(auth, email, password);

export const resetTrainerPassword = (email) => 
  sendPasswordResetEmail(auth, email);

export const logoutTrainer = () => 
  signOut(auth);

export const subscribeToAuthChanges = (callback) => 
  onAuthStateChanged(auth, callback);

const questionsCollection = collection(db, "questions");

// REAL-TIME LISTENER UPDATED FOR UNIQUE TRAINING LINK ISOLATION
export const subscribeToEntries = (activeModule, trainerId, trainingId, callback) => {
  if (!trainerId) return () => {};

  let rawTrainerEntries = [];
  let currentModule = activeModule;
  let currentTrainingId = trainingId;

  const emit = () => {
    const filteredEntries = rawTrainerEntries.filter((item) => {
      const matchModule = item.module === currentModule;
      
      const matchTraining = currentTrainingId 
        ? item.trainingId === currentTrainingId 
        : (!item.trainingId || item.trainingId === "");

      return matchModule && matchTraining;
    });

    const rawFiltered = rawTrainerEntries.filter((item) => 
      currentTrainingId 
        ? item.trainingId === currentTrainingId 
        : (!item.trainingId || item.trainingId === "")
    );

    callback({ 
      entries: filteredEntries, 
      rawEntries: rawFiltered,
      activeModule: currentModule,
      activeTrainingId: currentTrainingId
    });
  };

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

  const trainerConfigRef = doc(db, "trainers", trainerId);
  const unsubConfig = onSnapshot(trainerConfigRef, (configSnap) => {
    if (configSnap.exists()) {
      const data = configSnap.data();
      let updated = false;

      if (data.activeModule && data.activeModule !== currentModule) {
        currentModule = data.activeModule;
        updated = true;
      }

      if (updated) emit();
    }
  }, (err) => console.error("Firestore trainer config error:", err));

  return () => {
    unsubQuestions();
    unsubConfig();
  };
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

// Fetch Questions (Filtered by module & trainerId)
export const getQuestionsByModule = async (trainerId, moduleTag) => {
  try {
    if (!trainerId) return { success: false, error: "Missing trainerId" };
    
    let q = query(questionsCollection, where("trainerId", "==", trainerId));
    if (moduleTag && moduleTag !== "ALL") {
      q = query(questionsCollection, where("trainerId", "==", trainerId), where("module", "==", moduleTag));
    }

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

// Update Active Module & Active Training per Trainer ID
export const updateActiveModule = async (trainerId, newModule, activeTrainingId = "") => {
  if (!trainerId) return;
  try {
    const trainerConfigRef = doc(db, "trainers", trainerId);
    await setDoc(trainerConfigRef, { 
      activeModule: newModule,
      activeTrainingId: activeTrainingId || ""
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error updating active module:", error);
    return { success: false, error };
  }
};

// Delete All Entries strictly for a Specific Training Session and Module
export const deleteAllEntriesForModule = async (trainerId, moduleTag, trainingId = "") => {
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
    let count = 0;

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const matchTraining = trainingId 
        ? data.trainingId === trainingId 
        : (!data.trainingId || data.trainingId === "");

      if (matchTraining) {
        batch.delete(docSnap.ref);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }

    return { success: true, count };
  } catch (error) {
    console.error("Error deleting all entries for module:", error);
    return { success: false, error };
  }
};

// STANDALONE REAL-TIME LISTENER FOR HEADER TITLE (WITH ISOLATED TRAINING SUPPORT)
export const subscribeToHeaderTitle = (trainerId, trainingId, callback) => {
  if (!trainerId) return () => {};

  if (trainingId) {
    const trainingRef = doc(db, "trainers", trainerId, "trainings", trainingId);
    return onSnapshot(
      trainingRef,
      (snapshot) => {
        if (snapshot.exists() && snapshot.data()?.title) {
          callback(snapshot.data().title);
        } else {
          callback(DEFAULT_HEADER_TITLE);
        }
      },
      (err) => console.error("Firestore training title subscription error:", err)
    );
  }

  const headerRef = doc(db, "trainers", trainerId, "settings", "header");
  return onSnapshot(
    headerRef,
    async (snapshot) => {
      if (snapshot.exists() && snapshot.data()?.title) {
        callback(snapshot.data().title);
      } else {
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
export const saveHeaderTitle = async (trainerId, newTitle, trainingId = "") => {
  if (!trainerId) return { success: false, error: "Missing trainerId" };
  try {
    const formattedTitle = newTitle.trim() || DEFAULT_HEADER_TITLE;
    if (trainingId) {
      const trainingRef = doc(db, "trainers", trainerId, "trainings", trainingId);
      await setDoc(trainingRef, { title: formattedTitle }, { merge: true });
    }
    const headerRef = doc(db, "trainers", trainerId, "settings", "header");
    await setDoc(headerRef, { title: formattedTitle }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving header title:", error);
    return { success: false, error };
  }
};

// REAL-TIME LISTENER FOR ALL MODULE ENTRIES
export const subscribeToAllEntries = (trainerId, callback) => {
  if (!trainerId) return () => {};

  const q = query(
    questionsCollection, 
    where("trainerId", "==", trainerId)
  );

  return onSnapshot(q, (snapshot) => {
    const allEntries = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      docId: docSnap.id,
      rowId: docSnap.id,
      ...docSnap.data(),
    }));
    callback(allEntries);
  }, (err) => console.error("Firestore error fetching all entries:", err));
};

// VERIFY CO-TRAINER PASSCODE WITH "dswd143" DEFAULT FALLBACK
export const verifyCoTrainerPasscode = async (trainerId, trainingId, inputPasscode) => {
  if (!trainerId) return false;
  try {
    const cleanInput = inputPasscode.toString().trim();

    if (trainingId) {
      const trainingRef = doc(db, "trainers", trainerId, "trainings", trainingId);
      const snap = await getDoc(trainingRef);
      if (snap.exists() && snap.data()?.coTrainerPin) {
        return snap.data().coTrainerPin.toString().trim() === cleanInput;
      }
    }
    
    const trainerRef = doc(db, "trainers", trainerId);
    const trainerSnap = await getDoc(trainerRef);
    if (trainerSnap.exists() && trainerSnap.data()?.coTrainerPin) {
      return trainerSnap.data().coTrainerPin.toString().trim() === cleanInput;
    }

    // Default fallback passcode check
    return cleanInput === DEFAULT_CO_TRAINER_PASSCODE;
  } catch (error) {
    console.error("Error verifying co-trainer passcode:", error);
    return inputPasscode.toString().trim() === DEFAULT_CO_TRAINER_PASSCODE;
  }
};

// SET CO-TRAINER PASSCODE FOR A TRAINING
export const setCoTrainerPasscode = async (trainerId, trainingId, newPin) => {
  if (!trainerId) return { success: false };
  try {
    const pinToSet = newPin || DEFAULT_CO_TRAINER_PASSCODE;
    if (trainingId) {
      const trainingRef = doc(db, "trainers", trainerId, "trainings", trainingId);
      await setDoc(trainingRef, { coTrainerPin: pinToSet }, { merge: true });
    } else {
      const trainerRef = doc(db, "trainers", trainerId);
      await setDoc(trainerRef, { coTrainerPin: pinToSet }, { merge: true });
    }
    return { success: true };
  } catch (error) {
    console.error("Error setting co-trainer passcode:", error);
    return { success: false, error };
  }
};

// Delete Training Document and All Associated Questions/Entries
export const deleteTrainingSession = async (trainerId, trainingId) => {
  if (!trainerId || !trainingId) {
    return { success: false, error: "Missing trainer ID or training ID" };
  }

  try {
    const batch = writeBatch(db);

    const q = query(
      questionsCollection,
      where("trainerId", "==", trainerId),
      where("trainingId", "==", trainingId)
    );
    const snapshot = await getDocs(q);

    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    const trainingDocRef = doc(db, "trainers", trainerId, "trainings", trainingId);
    batch.delete(trainingDocRef);

    const trainerRef = doc(db, "trainers", trainerId);
    batch.set(trainerRef, { activeTrainingId: "" }, { merge: true });

    const headerRef = doc(db, "trainers", trainerId, "settings", "header");
    batch.set(headerRef, { title: DEFAULT_HEADER_TITLE }, { merge: true });

    await batch.commit();

    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error("Error deleting training session and associated entries:", error);
    return { success: false, error };
  }
};