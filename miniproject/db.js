

const NOVA_DB_NAME = 'StudyAssistantDB';
const NOVA_DB_VERSION = 5;
let _dbInstance = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (_dbInstance) return resolve(_dbInstance);

    const req = indexedDB.open(NOVA_DB_NAME, NOVA_DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // Users store — signup/login data and academic profile
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'email' });
      }

      // Conversations store — multiple chat threads per student
      if (!db.objectStoreNames.contains('conversations')) {
        const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
        convStore.createIndex('by_user', 'userEmail', { unique: false });
      }

      // Chat history — one row per message
      if (!db.objectStoreNames.contains('chats')) {
        const chatStore = db.createObjectStore('chats', { keyPath: 'id', autoIncrement: true });
        chatStore.createIndex('by_user', 'userEmail', { unique: false });
        chatStore.createIndex('by_conv', 'conversationId', { unique: false });
      } else {
        const tx = e.target.transaction;
        const chatStore = tx.objectStore('chats');
        if (!chatStore.indexNames.contains('by_conv')) {
          chatStore.createIndex('by_conv', 'conversationId', { unique: false });
        }
      }

      // Flashcard progress — tracks which cards a user has marked "known"
      if (!db.objectStoreNames.contains('flashcardProgress')) {
        const fcStore = db.createObjectStore('flashcardProgress', { keyPath: 'id' });
        fcStore.createIndex('by_user', 'userEmail', { unique: false });
      }

      // Tasks store — student personal study tasks
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by_user', 'userEmail', { unique: false });
        taskStore.createIndex('by_date', 'date', { unique: false });
      } else {
        const tx = e.target.transaction;
        const taskStore = tx.objectStore('tasks');
        if (!taskStore.indexNames.contains('by_user')) {
          taskStore.createIndex('by_user', 'userEmail', { unique: false });
        }
        if (!taskStore.indexNames.contains('by_date')) {
          taskStore.createIndex('by_date', 'date', { unique: false });
        }
      }

      // Assignments store — coursework assignments
      if (!db.objectStoreNames.contains('assignments')) {
        const asgStore = db.createObjectStore('assignments', { keyPath: 'id' });
        asgStore.createIndex('by_user', 'userId', { unique: false });
        asgStore.createIndex('by_source', 'source', { unique: false });
        asgStore.createIndex('by_duedate', 'dueDate', { unique: false });
      }
    };

    req.onsuccess = (e) => {
      _dbInstance = e.target.result;
      resolve(_dbInstance);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

/* ---------- helper: hash password (SHA-256, built into browser with safe fallback) ---------- */
async function hashPassword(plainText) {
  try {
    if (typeof crypto !== 'undefined' && crypto && crypto.subtle && crypto.subtle.digest) {
      const enc = new TextEncoder().encode(plainText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  let h = 0;
  for (let i = 0; i < plainText.length; i++) {
    h = ((h << 5) - h) + plainText.charCodeAt(i);
    h |= 0;
  }
  return 'pw_' + Math.abs(h).toString(16);
}

/* ---------- generic promise wrapper for IDB requests ---------- */
function reqToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/* =========================================================
   Public DB API — app.js sirf inhi functions ko call karta hai
========================================================= */
const DB = {

  /* ---------- AUTH & PROFILE (Firebase Authentication & Cloud Firestore) ---------- */
  async signup({ name, email, password, course, program, university, branch, year, semester, subjects }) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();
    if (!cleanName) throw new Error('Please enter your full name.');
    if (!cleanEmail) throw new Error('Email address is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('Please enter a valid email address (e.g. you@school.edu).');
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    let user = null;
    let firebaseError = null;

    // 1. Primary: Firebase Authentication & Cloud Firestore (keyed by UID)
    if (typeof window !== 'undefined' && window.FirebaseAuthService) {
      try {
        user = await window.FirebaseAuthService.signUp({
          name: cleanName,
          email: cleanEmail,
          password: password,
          course: course || 'btech',
          program: program || 'B.Tech',
          university: university || 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)',
          branch: branch || 'Computer Science & Engineering (CSE)',
          year: year || '2nd Year',
          semester: semester || 'Semester 3',
          subjects: subjects
        });
      } catch (fbErr) {
        firebaseError = fbErr;
        const msg = (fbErr.message || '').toLowerCase();
        // If account already exists or password too weak or invalid email, rethrow immediately
        if (msg.includes('already exists') || msg.includes('weak') || msg.includes('valid email')) {
          throw fbErr;
        }
        console.warn('[DB] Firebase Auth notice:', fbErr.message);
      }
    }

    // 2. Resilient fallback: server-side registration with PBKDF2 hashed storage
    if (!user) {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: password,
          course: course || 'btech',
          program: program || 'B.Tech',
          university: university || 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)',
          branch: branch || 'Computer Science & Engineering (CSE)',
          year: year || '2nd Year',
          semester: semester || 'Semester 3',
          subjects: subjects || ['Data Structures (BCS-301)', 'Computer System Architecture (BCS-302)', 'Discrete Structures & Theory of Logic (BCS-303)', 'Technical Communication (BAS-301)']
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || firebaseError?.message || 'Failed to create account. Please try again.');
      }

      const data = await res.json();
      user = data.user;
    }

    // 3. Cache to IndexedDB for offline persistence
    try {
      const db = await openDB();
      const tx = db.transaction('users', 'readwrite');
      tx.objectStore('users').put(user);
    } catch (e) {}

    return user;
  },

  async login({ email, password, rememberMe = true, requestedRole = 'student' }) {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) throw new Error('Please enter your email address.');
    if (!password) throw new Error('Please enter your password.');

    let user = null;
    let firebaseError = null;

    // 1. Primary: Authenticate against server store (with role enforcement & session creation)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: cleanEmail, password: password, requestedRole })
      });
      if (res.ok) {
        const data = await res.json();
        const serverUser = data.user;
        try {
          const db = await openDB();
          const tx = db.transaction('users', 'readwrite');
          tx.objectStore('users').put(serverUser);
        } catch (e) {}
        return serverUser;
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403) {
          throw new Error(errData.error || 'Access denied: Role mismatch.');
        }
        if (res.status === 401) {
          throw new Error('Incorrect email or password. Please try again or use Forgot password.');
        }
        if (errData.error && res.status !== 404) {
          throw new Error(errData.error);
        }
      }
    } catch (netErr) {
      if (netErr.message && !netErr.message.includes('fetch')) {
        throw netErr;
      }
    }

    // 2. Secondary fallback: Firebase Authentication (for client Firebase accounts)
    if (typeof window !== 'undefined' && window.FirebaseAuthService) {
      try {
        user = await window.FirebaseAuthService.login({
          email: cleanEmail,
          password,
          rememberMe
        });
        if (user) {
          user.role = user.role || 'student';
          if (requestedRole === 'staff' && user.role !== 'staff' && user.role !== 'admin' && user.role !== 'faculty') {
            throw new Error('Access denied: This account is registered as a Student. Please switch to the Student login tab.');
          }
          try {
            const db = await openDB();
            const tx = db.transaction('users', 'readwrite');
            tx.objectStore('users').put(user);
          } catch (e) {}
          return user;
        }
      } catch (fbErr) {
        firebaseError = fbErr;
        console.warn('[DB] Firebase login notice:', fbErr.message);
      }
    }

    // 3. Report clear error if authentication fails
    if (firebaseError) {
      throw firebaseError;
    }
    throw new Error('Incorrect email or password. Please try again.');
  },

  async staffRegister({ name, email, password, department, designation, adminPasskey }) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();
    if (!cleanName) throw new Error('Please enter staff full name.');
    if (!cleanEmail) throw new Error('Staff email address is required.');
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }
    if (!adminPasskey) {
      throw new Error('Administrator passkey is required for staff account registration.');
    }

    const res = await fetch('/api/auth/staff-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        password,
        department,
        designation,
        adminPasskey
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to register staff account. Please verify your admin passkey.');
    }

    const staffUser = data.user;
    try {
      const db = await openDB();
      const tx = db.transaction('users', 'readwrite');
      tx.objectStore('users').put(staffUser);
    } catch (e) {}

    return staffUser;
  },

  async sendPasswordReset(email) {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) throw new Error('Please enter your email address.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }
    if (typeof window !== 'undefined' && window.FirebaseAuthService) {
      return await window.FirebaseAuthService.sendPasswordReset(cleanEmail);
    }
    throw new Error('Password reset service is currently unavailable.');
  },

  async getUser(identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).toLowerCase().trim();

    // Check Firebase profile first if UID or current user
    if (typeof window !== 'undefined' && window.FirebaseAuthService) {
      try {
        const fbProfile = await window.FirebaseAuthService.getProfile(identifier);
        if (fbProfile) return fbProfile;
      } catch (e) {}
    }

    // Check server first for freshest data
    try {
      const res = await fetch(`/api/user/profile/${encodeURIComponent(cleanId)}`, {
        headers: { 'X-User-Email': cleanId },
        credentials: 'include'
      });
      if (res.ok) {
        const profile = await res.json();
        if (profile && profile.email) {
          try {
            const db = await openDB();
            const tx = db.transaction('users', 'readwrite');
            tx.objectStore('users').put(profile);
          } catch (e) {}
          return profile;
        }
      }
    } catch (e) {}

    try {
      const db = await openDB();
      const tx = db.transaction('users', 'readonly');
      const result = await reqToPromise(tx.objectStore('users').get(cleanId));
      return result || null;
    } catch (e) {
      return null;
    }
  },

  async updateUser(identifier, patch) {
    if (!identifier) return null;
    if (typeof window !== 'undefined' && window.FirebaseAuthService) {
      try {
        await window.FirebaseAuthService.updateProfile(identifier, patch);
      } catch (e) {}
    }
    try {
      const db = await openDB();
      const user = await this.getUser(identifier);
      if (user) {
        const updated = { ...user, ...patch, updatedAt: new Date().toISOString() };
        const tx = db.transaction('users', 'readwrite');
        tx.objectStore('users').put(updated);
        return updated;
      }
    } catch (e) {}
    return patch;
  },

  /* ---------- CONVERSATIONS (MULTIPLE CHATS) ---------- */
  async saveConversation(userEmail, conv) {
    const db = await openDB();
    const tx = db.transaction('conversations', 'readwrite');
    const record = {
      id: conv.id || 'conv_' + Date.now(),
      userEmail: userEmail.toLowerCase().trim(),
      title: conv.title || 'New Conversation',
      createdAt: conv.createdAt || new Date().toISOString(),
      updatedAt: conv.updatedAt || new Date().toISOString()
    };
    tx.objectStore('conversations').put(record);
    return record;
  },

  async getConversations(userEmail) {
    const db = await openDB();
    const tx = db.transaction('conversations', 'readonly');
    const index = tx.objectStore('conversations').index('by_user');
    const all = await reqToPromise(index.getAll(IDBKeyRange.only(userEmail.toLowerCase().trim())));
    return all.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  },

  async deleteConversation(userEmail, conversationId) {
    const db = await openDB();
    const tx = db.transaction(['conversations', 'chats'], 'readwrite');
    tx.objectStore('conversations').delete(conversationId);
    
    // Also delete associated messages
    const chatStore = tx.objectStore('chats');
    const index = chatStore.index('by_user');
    const all = await reqToPromise(index.getAll(IDBKeyRange.only(userEmail.toLowerCase().trim())));
    all.forEach(row => {
      if (row.conversationId === conversationId) {
        chatStore.delete(row.id);
      }
    });
  },

  async clearConversations(userEmail) {
    const db = await openDB();
    const tx = db.transaction(['conversations', 'chats'], 'readwrite');
    const convStore = tx.objectStore('conversations');
    const convIndex = convStore.index('by_user');
    const allConvs = await reqToPromise(convIndex.getAll(IDBKeyRange.only(userEmail.toLowerCase().trim())));
    allConvs.forEach(c => convStore.delete(c.id));

    const chatStore = tx.objectStore('chats');
    const chatIndex = chatStore.index('by_user');
    const allChats = await reqToPromise(chatIndex.getAll(IDBKeyRange.only(userEmail.toLowerCase().trim())));
    allChats.forEach(m => chatStore.delete(m.id));
  },

  /* ---------- CHAT HISTORY ---------- */
  async saveChatMessage(userEmail, sender, text, conversationId = 'default') {
    const db = await openDB();
    const tx = db.transaction(['chats', 'conversations'], 'readwrite');
    const msg = {
      userEmail: userEmail.toLowerCase().trim(),
      conversationId,
      sender,
      text,
      timestamp: new Date().toISOString()
    };
    tx.objectStore('chats').add(msg);

    // Update conversation timestamp if it exists
    if (conversationId && conversationId !== 'default') {
      const convStore = tx.objectStore('conversations');
      const conv = await reqToPromise(convStore.get(conversationId));
      if (conv) {
        conv.updatedAt = new Date().toISOString();
        convStore.put(conv);
      }
    }
  },

  async getChatHistory(userEmail, conversationId = null) {
    const db = await openDB();
    const tx = db.transaction('chats', 'readonly');
    const index = tx.objectStore('chats').index('by_user');
    const all = await reqToPromise(index.getAll(IDBKeyRange.only(userEmail.toLowerCase().trim())));
    
    const filtered = conversationId
      ? all.filter(c => c.conversationId === conversationId || (!c.conversationId && conversationId === 'default'))
      : all;
    return filtered.sort((a, b) => (a.id || 0) - (b.id || 0));
  },

  async clearChatHistory(userEmail, conversationId = null) {
    const db = await openDB();
    const tx = db.transaction('chats', 'readwrite');
    const index = tx.objectStore('chats').index('by_user');
    const all = await reqToPromise(index.getAll(IDBKeyRange.only(userEmail.toLowerCase().trim())));
    const store = tx.objectStore('chats');
    all.forEach(row => {
      if (!conversationId || row.conversationId === conversationId) {
        store.delete(row.id);
      }
    });
  },

  /* ---------- FLASHCARD PROGRESS ---------- */
  async markCardKnown(userEmail, course, subject, cardIndex, known) {
    const db = await openDB();
    const id = `${userEmail}_${course}_${subject}_${cardIndex}`;
    const tx = db.transaction('flashcardProgress', 'readwrite');
    tx.objectStore('flashcardProgress').put({
      id,
      userEmail: userEmail.toLowerCase().trim(),
      course,
      subject,
      cardIndex,
      known,
      updatedAt: new Date().toISOString()
    });
  },

  async getProgress(userEmail, course, subject) {
    const db = await openDB();
    const tx = db.transaction('flashcardProgress', 'readonly');
    const index = tx.objectStore('flashcardProgress').index('by_user');
    const all = await reqToPromise(index.getAll(IDBKeyRange.only(userEmail.toLowerCase().trim())));
    return all.filter(row => row.course === course && row.subject === subject);
  },

  /* ---------- TASKS & DAY-WISE PLANNING ---------- */
  async getTasks(userEmail) {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (!cleanEmail) return [];

    let localTasks = [];
    try {
      const db = await openDB();
      if (db.objectStoreNames.contains('tasks')) {
        const tx = db.transaction('tasks', 'readonly');
        const index = tx.objectStore('tasks').index('by_user');
        localTasks = await reqToPromise(index.getAll(IDBKeyRange.only(cleanEmail)));
      }
    } catch (e) {
      localTasks = [];
    }

    // Attempt sync with server
    try {
      const resp = await fetch(`/api/tasks/${encodeURIComponent(cleanEmail)}`);
      if (resp.ok) {
        const serverTasks = await resp.json();
        if (Array.isArray(serverTasks)) {
          // Cache server tasks in IndexedDB in background
          try {
            const db = await openDB();
            if (db.objectStoreNames.contains('tasks')) {
              const tx = db.transaction('tasks', 'readwrite');
              const store = tx.objectStore('tasks');
              const index = store.index('by_user');
              const oldKeys = await reqToPromise(index.getAllKeys(IDBKeyRange.only(cleanEmail)));
              if (Array.isArray(oldKeys)) {
                oldKeys.forEach((k) => store.delete(k));
              }
              serverTasks.forEach((st) => {
                store.put({ ...st, userEmail: cleanEmail });
              });
            }
          } catch (idbErr) {}

          return serverTasks.map((t) => ({ ...t, userEmail: cleanEmail }));
        }
      }
    } catch (netErr) {}

    return (localTasks || []).map((t) => ({ ...t, userEmail: cleanEmail }));
  },

  async saveTask(arg1, arg2) {
    let task = arg1;
    let emailHint = '';
    if (typeof arg1 === 'string' && arg2 && typeof arg2 === 'object') {
      emailHint = arg1;
      task = { ...arg2, userEmail: arg1, userId: arg1 };
    }
    const cleanEmail = (task.userEmail || task.userId || emailHint || '').toLowerCase().trim();
    if (!cleanEmail) throw new Error('userEmail is required');

    const cleanTask = {
      id: task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userEmail: cleanEmail,
      userId: cleanEmail,
      title: (task.title || '').trim(),
      description: (task.description || '').trim(),
      date: (task.date || '').trim(),
      time: (task.time || '').trim(),
      subject: (task.subject || 'General').trim(),
      priority: ['Low', 'Medium', 'High'].includes(task.priority) ? task.priority : 'Medium',
      completed: Boolean(task.completed),
      completedAt: task.completed ? (task.completedAt || new Date().toISOString()) : null,
      updatedAt: new Date().toISOString()
    };

    // Save to IndexedDB
    try {
      const db = await openDB();
      const tx = db.transaction('tasks', 'readwrite');
      tx.objectStore('tasks').put(cleanTask);
    } catch (e) {}

    // Sync to Server
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanTask)
      });
    } catch (e) {}

    return cleanTask;
  },

  async deleteTask(userEmail, taskId) {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (!cleanEmail || !taskId) return;

    // Delete from IndexedDB
    try {
      const db = await openDB();
      const tx = db.transaction('tasks', 'readwrite');
      tx.objectStore('tasks').delete(taskId);
    } catch (e) {}

    // Delete from Server
    try {
      await fetch(`/api/tasks/${encodeURIComponent(taskId)}?userId=${encodeURIComponent(cleanEmail)}`, {
        method: 'DELETE'
      });
    } catch (e) {}
  },

  /* ---------- USER STATS & STREAK ---------- */
  async getUserStats(userEmail) {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (!cleanEmail) return { activeStudyDates: [], streak: 0, longestStreak: 0, overallProgress: 0, goalsDone: 0, goalsTotal: 0 };

    try {
      const res = await fetch(`/api/user/stats/${encodeURIComponent(cleanEmail)}`);
      if (res.ok) {
        const stats = await res.json();
        return stats;
      }
    } catch (e) {}

    // Fallback to local user record
    const user = await this.getUser(cleanEmail);
    return {
      activeStudyDates: user?.activeStudyDates || [],
      streak: user?.streak || 0,
      longestStreak: user?.longestStreak || 0,
      overallProgress: user?.overallProgress || 0,
      goalsDone: user?.goalsDone || 0,
      goalsTotal: user?.goalsTotal || 0,
      totalCompletedActivities: user?.totalCompletedActivities || 0
    };
  },

  async updateUserStats(userEmail, stats) {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (!cleanEmail) return;

    // Save to local user record
    try {
      const db = await openDB();
      const tx = db.transaction('users', 'readwrite');
      const store = tx.objectStore('users');
      const u = await reqToPromise(store.get(cleanEmail));
      if (u) {
        Object.assign(u, stats);
        store.put(u);
      }
    } catch (e) {}

    // Save to server
    try {
      await fetch(`/api/user/stats/${encodeURIComponent(cleanEmail)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats)
      });
    } catch (e) {}
  },

  async recordActivity(userEmail, activityType, dateStr = null) {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (!cleanEmail) return null;

    try {
      const res = await fetch(`/api/user/activity/${encodeURIComponent(cleanEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityType, date: dateStr })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return null;
  },

  /* ---------------- Assignment Tracker ---------------- */

  async getAssignments(userEmail, queryParams = {}) {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (!cleanEmail) return [];

    let serverAssignments = null;
    try {
      const q = new URLSearchParams();
      if (queryParams.source) q.set('source', queryParams.source);
      if (queryParams.status) q.set('status', queryParams.status);
      if (queryParams.search) q.set('search', queryParams.search);
      if (queryParams.sort) q.set('sort', queryParams.sort);

      const url = `/api/assignments/${encodeURIComponent(cleanEmail)}${q.toString() ? `?${q.toString()}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        serverAssignments = await res.json();
        if (Array.isArray(serverAssignments)) {
          // Sync with IndexedDB
          try {
            const db = await openDB();
            const tx = db.transaction('assignments', 'readwrite');
            const store = tx.objectStore('assignments');
            for (const asg of serverAssignments) {
              store.put(asg);
            }
          } catch (e) {}
          return serverAssignments;
        }
      }
    } catch (e) {}

    // Fallback to IndexedDB
    try {
      const db = await openDB();
      const tx = db.transaction('assignments', 'readonly');
      const store = tx.objectStore('assignments');
      const idx = store.index('by_user');
      return await new Promise((resolve) => {
        const req = idx.getAll(cleanEmail);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  },

  async saveAssignment(assignment) {
    const cleanEmail = (assignment.userId || assignment.userEmail || '').toLowerCase().trim();
    if (!cleanEmail) throw new Error('User email/id required');

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...assignment, userId: cleanEmail })
      });
      if (res.ok) {
        const saved = await res.json();
        try {
          const db = await openDB();
          const tx = db.transaction('assignments', 'readwrite');
          tx.objectStore('assignments').put(saved);
        } catch (e) {}
        return saved;
      }
    } catch (e) {}

    // Offline / Local save fallback
    const localDoc = {
      ...assignment,
      id: assignment.id || `asg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: cleanEmail,
      source: assignment.source || 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      const db = await openDB();
      const tx = db.transaction('assignments', 'readwrite');
      tx.objectStore('assignments').put(localDoc);
    } catch (e) {}
    return localDoc;
  },

  async updateAssignment(id, userEmail, updates) {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (!id || !cleanEmail) throw new Error('Assignment ID and user email required');

    try {
      const res = await fetch(`/api/assignments/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, userId: cleanEmail })
      });
      if (res.ok) {
        const updated = await res.json();
        try {
          const db = await openDB();
          const tx = db.transaction('assignments', 'readwrite');
          tx.objectStore('assignments').put(updated);
        } catch (e) {}
        return updated;
      }
    } catch (e) {}

    // Offline fallback
    try {
      const db = await openDB();
      const tx = db.transaction('assignments', 'readwrite');
      const store = tx.objectStore('assignments');
      const existing = await new Promise((res) => {
        const r = store.get(id);
        r.onsuccess = () => res(r.result);
        r.onerror = () => res(null);
      });
      if (existing) {
        const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        store.put(merged);
        return merged;
      }
    } catch (e) {}
    return null;
  },

  async deleteAssignment(id, userEmail) {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    if (!id || !cleanEmail) throw new Error('Assignment ID and user email required');

    try {
      await fetch(`/api/assignments/${encodeURIComponent(id)}?userId=${encodeURIComponent(cleanEmail)}`, {
        method: 'DELETE'
      });
    } catch (e) {}

    try {
      const db = await openDB();
      const tx = db.transaction('assignments', 'readwrite');
      tx.objectStore('assignments').delete(id);
    } catch (e) {}

    return true;
  }
};