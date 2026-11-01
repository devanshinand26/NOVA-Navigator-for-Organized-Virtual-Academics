/* =========================================================
   firebase-auth-service.js — Firebase Auth & Firestore Client
   - Modular Firebase SDK v13 bundled for browser
   - Linked Firestore user profiles at /users/{uid}
   - Supported session persistence (local vs session)
   - Real password reset, friendly error mapping
   - Cross-session sync with backend API and token verification
========================================================= */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

// Current provisioned Firebase applet configuration
const CURRENT_FIREBASE_CONFIG = {
  projectId: "northern-verbena-501dl",
  appId: "1:488570165360:web:9df4176300a9780935fcb5",
  apiKey: "AIzaSyABc2LVkJXjmeMZxlG-XnnfkIu1Vqs2HX0",
  authDomain: "northern-verbena-501dl.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-remixremixremixn-8adf8615-173a-4318-b778-d98a601330ba",
  storageBucket: "northern-verbena-501dl.firebasestorage.app",
  messagingSenderId: "488570165360",
  measurementId: "",
  oAuthClientId: "488570165360-311dj1n7r6c9intfmioqvutv6eu0ttvs.apps.googleusercontent.com"
};

let app = null;
let auth = null;
let db = null;
let isInitialized = false;

function initFirebase(customConfig) {
  if (isInitialized && app && auth) return { app, auth, db };

  // Allow runtime override from window.__FIREBASE_CONFIG__ if available
  const config = customConfig || (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__) || CURRENT_FIREBASE_CONFIG;
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    app = initializeApp(config);
  }

  auth = getAuth(app);
  try {
    if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
      db = getFirestore(app, config.firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }
  } catch (dbErr) {
    console.warn('[Firebase] Custom database init fallback:', dbErr.message);
    try {
      db = getFirestore(app);
    } catch (e) {
      console.error('[Firebase] Firestore init failed:', e);
    }
  }

  isInitialized = true;
  return { app, auth, db };
}

// Map Firebase error codes to friendly, actionable messages
function mapFirebaseError(err) {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const code = (err.code || '').toLowerCase().trim();
  const rawMsg = err.message || '';

  // 1. Specific known Firebase Auth & Firestore error codes
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please log in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid student email address (e.g. you@school.edu).';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check your email or sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or use Forgot password.';
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please check your credentials or create an account.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 8 characters with a mix of letters and numbers.';
    case 'auth/missing-password':
      return 'Please enter your password.';
    case 'auth/missing-email':
      return 'Please enter your email address.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed attempts. You can reset your password or try again later.';
    case 'auth/user-disabled':
      return 'This student account has been disabled. Please contact your administrator.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console. Please enable Email/Password provider under Authentication > Sign-in method in Firebase Console.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid':
      return 'Firebase API key configuration issue. Please check your Firebase configuration.';
    case 'permission-denied':
      return 'Database permission denied. Access is restricted to your own profile.';
    case 'unavailable':
      return 'Firebase service is temporarily unavailable. Please try again in a moment.';
    default:
      break;
  }

  // 2. Inspection of raw message text
  if (rawMsg.includes('OPERATION_NOT_ALLOWED') || rawMsg.includes('operation-not-allowed')) {
    return 'Email/Password sign-in is not enabled in Firebase Console. Please enable Email/Password provider under Authentication > Sign-in method in Firebase Console.';
  }
  if (rawMsg.includes('EMAIL_EXISTS') || rawMsg.includes('email-already-in-use')) {
    return 'An account with this email already exists. Please log in instead.';
  }
  if (rawMsg.includes('INVALID_LOGIN_CREDENTIALS') || rawMsg.includes('invalid-credential')) {
    return 'Incorrect email or password. Please verify your credentials or sign up.';
  }
  if (rawMsg.includes('WEAK_PASSWORD') || rawMsg.includes('weak-password')) {
    return 'Password must be at least 8 characters.';
  }
  if (rawMsg.includes('network') || rawMsg.includes('offline')) {
    return 'Network connection issue. Please check your internet connection.';
  }

  // 3. Clean generic Firebase prefixes and NEVER output the bare word "Error"
  const cleaned = rawMsg
    .replace(/^Firebase:\s*/i, '')
    .replace(/^Error\s*\(auth\/[^)]+\):?\s*/i, '')
    .replace(/\(auth\/[^)]+\)\.?/gi, '')
    .replace(/\(firestore\/[^)]+\)\.?/gi, '')
    .trim();

  if (!cleaned || cleaned.toLowerCase() === 'error') {
    return 'Authentication failed. Please verify your details and try again.';
  }

  return cleaned;
}

// Sync student session with backend server passing optional ID token
async function syncSessionWithBackend(profile, idToken = null) {
  if (!profile || !profile.email) return;
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }
    await fetch('/api/auth/sync', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(profile)
    });
  } catch (e) {
    console.warn('[Firebase] Backend session sync note:', e.message);
  }
}

// Core authentication service
const FirebaseAuthService = {
  init(config) {
    return initFirebase(config);
  },

  getAuth() {
    if (!auth) initFirebase();
    return auth;
  },

  getDb() {
    if (!db) initFirebase();
    return db;
  },

  async signUp({ name, email, password, course, program, university, branch, year, semester, subjects }) {
    initFirebase();
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();

    if (!cleanEmail) throw new Error('Email address is required.');
    if (!cleanName) throw new Error('Please enter your full name.');
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    try {
      // 1. Create real authentication account in Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const firebaseUser = cred.user;

      // 2. Set user display name in Firebase Auth profile
      try {
        await updateProfile(firebaseUser, { displayName: cleanName });
      } catch (profileErr) {
        console.warn('[Firebase] DisplayName update notice:', profileErr.message);
      }

      // 3. Construct student profile document linked to UID
      const studentProfile = {
        uid: firebaseUser.uid,
        id: firebaseUser.uid,
        email: cleanEmail,
        name: cleanName,
        course: course || 'btech',
        program: program || 'B.Tech',
        university: university || 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)',
        branch: branch || 'Computer Science & Engineering (CSE)',
        year: year || '2nd Year',
        semester: semester || 'Semester 3',
        subjects: Array.isArray(subjects) ? subjects : [
          'Data Structures (KCS-301)',
          'Computer System Architecture (KCS-302)',
          'Discrete Structures & Theory of Logic (KCS-303)',
          'Technical Communication (BAS-301)'
        ],
        studyPreferences: {},
        activeStudyDates: [],
        streak: 0,
        longestStreak: 0,
        overallProgress: 0,
        completedTasksCount: 0,
        totalTasksCount: 0,
        totalCompletedActivities: 0,
        goalsDone: 0,
        goalsTotal: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 4. Save profile in Cloud Firestore under /users/{uid}
      if (db) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(userDocRef, studentProfile, { merge: true });
        } catch (fsErr) {
          console.warn('[Firebase] Firestore profile write warning:', fsErr.message);
        }
      }

      // 5. Sync with backend server using Firebase Auth ID token
      let idToken = null;
      try {
        idToken = await firebaseUser.getIdToken();
      } catch (tokErr) {}
      await syncSessionWithBackend(studentProfile, idToken);

      return studentProfile;
    } catch (err) {
      throw new Error(mapFirebaseError(err));
    }
  },

  async login({ email, password, rememberMe = true }) {
    initFirebase();
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) throw new Error('Please enter your email address.');
    if (!password) throw new Error('Please enter your password.');

    try {
      // 1. Configure session persistence based on "Remember me" option
      try {
        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistence);
      } catch (pErr) {
        console.warn('[Firebase] Persistence set warning:', pErr.message);
      }

      // 2. Authenticate against Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const firebaseUser = cred.user;

      // 3. Fetch linked profile from Cloud Firestore by UID
      let profile = null;
      if (db) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            profile = snap.data();
          }
        } catch (fsErr) {
          console.warn('[Firebase] Firestore profile read warning:', fsErr.message);
        }
      }

      // If profile does not exist in Firestore yet, build and persist it
      if (!profile) {
        profile = {
          uid: firebaseUser.uid,
          id: firebaseUser.uid,
          email: cleanEmail,
          name: firebaseUser.displayName || cleanEmail.split('@')[0] || 'Student',
          course: 'btech',
          program: 'B.Tech',
          university: 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)',
          branch: 'Computer Science & Engineering (CSE)',
          year: '2nd Year',
          semester: 'Semester 3',
          subjects: [
            'Data Structures (KCS-301)',
            'Computer System Architecture (KCS-302)',
            'Discrete Structures & Theory of Logic (KCS-303)',
            'Technical Communication (BAS-301)'
          ],
          studyPreferences: {},
          activeStudyDates: [],
          streak: 0,
          longestStreak: 0,
          overallProgress: 0,
          goalsDone: 0,
          goalsTotal: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (db) {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            await setDoc(userDocRef, profile, { merge: true });
          } catch (e) {}
        }
      }

      // 4. Sync session with backend server using Firebase Auth ID token
      let idToken = null;
      try {
        idToken = await firebaseUser.getIdToken();
      } catch (tokErr) {}
      await syncSessionWithBackend(profile, idToken);

      return profile;
    } catch (err) {
      throw new Error(mapFirebaseError(err));
    }
  },

  async logout() {
    initFirebase();
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('[Firebase] SignOut warning:', e.message);
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
  },

  async sendPasswordReset(email) {
    initFirebase();
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) throw new Error('Please enter your email address to receive password reset instructions.');

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true, message: `Password reset instructions sent to ${cleanEmail}. Please check your inbox.` };
    } catch (err) {
      throw new Error(mapFirebaseError(err));
    }
  },

  async getProfile(uid) {
    if (!uid) return null;
    initFirebase();
    if (db) {
      try {
        const userDocRef = doc(db, 'users', uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) return snap.data();
      } catch (e) {}
    }
    return null;
  },

  async updateProfile(uid, patch) {
    if (!uid || !patch) return null;
    initFirebase();
    const updatedPatch = { ...patch, updatedAt: new Date().toISOString() };
    if (db) {
      try {
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, updatedPatch);
      } catch (e) {
        try {
          await setDoc(doc(db, 'users', uid), updatedPatch, { merge: true });
        } catch (e2) {}
      }
    }
    return updatedPatch;
  },

  onAuthStateChanged(callback) {
    initFirebase();
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback(null, null);
        return;
      }

      let profile = null;
      if (db) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            profile = snap.data();
          }
        } catch (e) {}
      }

      if (!profile) {
        profile = {
          uid: firebaseUser.uid,
          id: firebaseUser.uid,
          email: (firebaseUser.email || '').toLowerCase().trim(),
          name: firebaseUser.displayName || 'Student',
          course: 'btech',
          program: 'B.Tech',
          university: 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)',
          branch: 'Computer Science & Engineering (CSE)',
          year: '2nd Year',
          semester: 'Semester 3',
          subjects: [
            'Data Structures (KCS-301)',
            'Computer System Architecture (KCS-302)',
            'Discrete Structures & Theory of Logic (KCS-303)',
            'Technical Communication (BAS-301)'
          ],
          streak: 0,
          longestStreak: 0,
          overallProgress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      let idToken = null;
      try {
        idToken = await firebaseUser.getIdToken();
      } catch (tokErr) {}
      syncSessionWithBackend(profile, idToken);
      callback(profile, firebaseUser);
    });
  }
};

// Expose globally for vanilla scripts
if (typeof window !== 'undefined') {
  window.FirebaseAuthService = FirebaseAuthService;
  // Auto-init immediately on load
  initFirebase();
}

export default FirebaseAuthService;
