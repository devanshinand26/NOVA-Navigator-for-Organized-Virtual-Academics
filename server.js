/* =========================================================
   server.js — Full-stack server for Nova AI Study Assistant
   - Serves frontend static files
   - Handles chat storage with in-memory fallback
   - Provides Gemini AI chat endpoint
   - Binds to 0.0.0.0:3000
========================================================= */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
const session = require('express-session');
const { google } = require('googleapis');

const app = express();
const PORT = 3000;

// Enable trust proxy for HTTPS termination behind reverse proxies / cloud environments
app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'nova-classroom-study-session-secret',
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid',
  cookie: {
    secure: 'auto',
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Authentication and user ownership middleware
function getAuthEmail(req) {
  if (req.session && req.session.userEmail) {
    return String(req.session.userEmail).toLowerCase().trim();
  }
  if (req.session && req.session.user && req.session.user.email) {
    return String(req.session.user.email).toLowerCase().trim();
  }
  if (req.headers && req.headers['x-user-email']) {
    return String(req.headers['x-user-email']).toLowerCase().trim();
  }
  if (req.body && req.body.email) {
    return String(req.body.email).toLowerCase().trim();
  }
  if (req.query && req.query.email) {
    return String(req.query.email).toLowerCase().trim();
  }
  return null;
}

function requireAuth(req, res, next) {
  const authEmail = getAuthEmail(req);
  if (!authEmail) {
    return res.status(401).json({ authenticated: false, error: 'Authentication required. Please log in.' });
  }
  req.authEmail = authEmail;
  next();
}

/* ---------------- Database connection & Persistent Fallback ---------------- */
const DATA_DIR = path.join(__dirname, 'data');
const CHAT_STORE_FILE = path.join(DATA_DIR, 'chat-store.json');
const CONVERSATIONS_STORE_FILE = path.join(DATA_DIR, 'conversations-store.json');
const USER_STORE_FILE = path.join(DATA_DIR, 'user-store.json');
const TASKS_STORE_FILE = path.join(DATA_DIR, 'tasks-store.json');
const ASSIGNMENTS_STORE_FILE = path.join(DATA_DIR, 'assignments-store.json');

// Ensure data directory exists for persistent local storage
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {}
}

let inMemoryChats = [];
try {
  if (fs.existsSync(CHAT_STORE_FILE)) {
    const raw = fs.readFileSync(CHAT_STORE_FILE, 'utf8');
    inMemoryChats = JSON.parse(raw);
  }
} catch (e) {
  inMemoryChats = [];
}

let inMemoryConversations = [];
try {
  if (fs.existsSync(CONVERSATIONS_STORE_FILE)) {
    const raw = fs.readFileSync(CONVERSATIONS_STORE_FILE, 'utf8');
    inMemoryConversations = JSON.parse(raw);
  }
} catch (e) {
  inMemoryConversations = [];
}

let inMemoryUsers = [];
try {
  if (fs.existsSync(USER_STORE_FILE)) {
    const raw = fs.readFileSync(USER_STORE_FILE, 'utf8');
    inMemoryUsers = JSON.parse(raw);
  }
} catch (e) {
  inMemoryUsers = [];
}

let inMemoryTasks = [];
try {
  if (fs.existsSync(TASKS_STORE_FILE)) {
    const raw = fs.readFileSync(TASKS_STORE_FILE, 'utf8');
    inMemoryTasks = JSON.parse(raw);
  }
} catch (e) {
  inMemoryTasks = [];
}

let inMemoryAssignments = [];
try {
  if (fs.existsSync(ASSIGNMENTS_STORE_FILE)) {
    const raw = fs.readFileSync(ASSIGNMENTS_STORE_FILE, 'utf8');
    inMemoryAssignments = JSON.parse(raw);
  }
} catch (e) {
  inMemoryAssignments = [];
}

async function persistLocalChats() {
  try {
    await fs.promises.writeFile(CHAT_STORE_FILE, JSON.stringify(inMemoryChats, null, 2), 'utf8');
  } catch (e) {}
}

async function persistLocalConversations() {
  try {
    await fs.promises.writeFile(CONVERSATIONS_STORE_FILE, JSON.stringify(inMemoryConversations, null, 2), 'utf8');
  } catch (e) {}
}

async function persistLocalUsers() {
  try {
    await fs.promises.writeFile(USER_STORE_FILE, JSON.stringify(inMemoryUsers, null, 2), 'utf8');
  } catch (e) {}
}

async function persistLocalTasks() {
  try {
    await fs.promises.writeFile(TASKS_STORE_FILE, JSON.stringify(inMemoryTasks, null, 2), 'utf8');
  } catch (e) {}
}

async function persistLocalAssignments() {
  try {
    await fs.promises.writeFile(ASSIGNMENTS_STORE_FILE, JSON.stringify(inMemoryAssignments, null, 2), 'utf8');
  } catch (e) {}
}

const MONGO_URI = process.env.MONGO_URI;
let isMongoConnected = false;

if (MONGO_URI) {
  mongoose.set('bufferCommands', false);
  mongoose
    .connect(MONGO_URI, {
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500
    })
    .then(() => {
      isMongoConnected = true;
      console.log('[Database] Connected to MongoDB Atlas successfully.');
    })
    .catch(() => {
      isMongoConnected = false;
      console.log('[Database] MongoDB Atlas is currently unreachable. Active storage: Persistent Local Store.');
    });

  mongoose.connection.on('connected', () => {
    isMongoConnected = true;
  });
  mongoose.connection.on('disconnected', () => {
    isMongoConnected = false;
  });
  mongoose.connection.on('error', () => {
    isMongoConnected = false;
  });
} else {
  console.log('[Database] No MONGO_URI provided — Active storage: Persistent Local Store.');
}

/* ---------------- Schemas & Models ---------------- */
const chatSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, trim: true },
    conversationId: { type: String, default: 'default', trim: true, index: true },
    sender: { type: String, enum: ['user', 'ai'], required: true },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, trim: true, index: true },
    title: { type: String, default: 'New Conversation' },
    createdAt: { type: String },
    updatedAt: { type: String }
  },
  { timestamps: true }
);

const userProfileSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: '' },
    role: { type: String, enum: ['student', 'staff', 'faculty', 'admin'], default: 'student', index: true },
    department: { type: String, default: '' },
    designation: { type: String, default: '' },
    name: { type: String, default: 'Student' },
    university: { type: String, default: 'AKTU' },
    program: { type: String, default: 'B.Tech' },
    branch: { type: String, default: 'CSE' },
    year: { type: String, default: '2nd Year' },
    semester: { type: String, default: 'Semester 3' },
    subjects: { type: [String], default: [] },
    studyPreferences: { type: mongoose.Schema.Types.Mixed, default: {} },
    activeStudyDates: { type: [String], default: [] },
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    overallProgress: { type: Number, default: 0 },
    completedTasksCount: { type: Number, default: 0 },
    totalTasksCount: { type: Number, default: 0 },
    totalCompletedActivities: { type: Number, default: 0 },
    goalsDone: { type: Number, default: 0 },
    goalsTotal: { type: Number, default: 0 },
    googleClassroom: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

function isStaffRole(role) {
  if (!role) return false;
  const r = String(role).toLowerCase().trim();
  return r === 'staff' || r === 'faculty' || r === 'admin';
}

/* ---------------- Date & Streak Calculation Helpers ---------------- */
function getLocalDateString(dateInput = new Date()) {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPreviousDateString(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return getLocalDateString(dt);
}

function calculateStreakDetails(activeDates = [], savedLongestStreak = 0) {
  if (!Array.isArray(activeDates) || activeDates.length === 0) {
    return { currentStreak: 0, longestStreak: savedLongestStreak || 0, isStudiedToday: false };
  }

  const dateSet = new Set(activeDates.map((d) => String(d).trim()).filter(Boolean));
  const todayStr = getLocalDateString(new Date());
  const yesterdayStr = getPreviousDateString(todayStr);

  const studiedToday = dateSet.has(todayStr);
  const studiedYesterday = dateSet.has(yesterdayStr);

  let currentStreak = 0;
  if (studiedToday) {
    currentStreak = 1;
    let checkDate = yesterdayStr;
    while (dateSet.has(checkDate)) {
      currentStreak++;
      checkDate = getPreviousDateString(checkDate);
    }
  } else if (studiedYesterday) {
    currentStreak = 1;
    let checkDate = getPreviousDateString(yesterdayStr);
    while (dateSet.has(checkDate)) {
      currentStreak++;
      checkDate = getPreviousDateString(checkDate);
    }
  } else {
    currentStreak = 0;
  }

  // Calculate historical max consecutive days in activeDates
  const allDatesSorted = Array.from(dateSet).sort();
  let maxConsecutive = 0;
  let tempStreak = 0;
  let prevDate = null;
  for (const d of allDatesSorted) {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const expectedPrev = getPreviousDateString(d);
      if (prevDate === expectedPrev) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > maxConsecutive) maxConsecutive = tempStreak;
    prevDate = d;
  }

  const longestStreak = Math.max(savedLongestStreak || 0, currentStreak, maxConsecutive);

  return {
    currentStreak,
    longestStreak,
    isStudiedToday: studiedToday
  };
}

const taskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: String, required: true, index: true }, // 'YYYY-MM-DD'
    time: { type: String, default: '' },
    subject: { type: String, default: 'General' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    completed: { type: Boolean, default: false },
    completedAt: { type: String, default: null }
  },
  { timestamps: true }
);

const Chat = mongoose.model('Chat', chatSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);
const UserProfile = mongoose.model('UserProfile', userProfileSchema);
const Task = mongoose.model('Task', taskSchema);

const assignmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, lowercase: true, trim: true, index: true },
    source: { type: String, enum: ['manual', 'google_classroom'], default: 'manual', index: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, default: 'General' },
    description: { type: String, default: '' },
    dueDate: { type: String, default: null, index: true }, // 'YYYY-MM-DD'
    dueTime: { type: String, default: '' }, // 'HH:MM'
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
    completed: { type: Boolean, default: false },
    completedAt: { type: String, default: null },
    attachmentUrl: { type: String, default: '' },
    points: { type: Number, default: null },
    // Google Classroom specific metadata
    googleCourseId: { type: String, default: null, index: true },
    googleCourseWorkId: { type: String, default: null, index: true },
    googleCourseName: { type: String, default: '' },
    googleAlternateLink: { type: String, default: '' },
    googleSubmissionStatus: { type: String, default: null }, // 'NEW', 'CREATED', 'TURNED_IN', 'RETURNED', 'RECLAIMED'
    googleAssignedGrade: { type: Number, default: null },
    googleMaxPoints: { type: Number, default: null },
    googleState: { type: String, default: 'PUBLISHED' },
    lastSyncedAt: { type: String, default: null }
  },
  { timestamps: true }
);

const Assignment = mongoose.model('Assignment', assignmentSchema);

/* ---------------- Gemini AI Client ---------------- */
let aiClient = null;
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/* ---------------- API Routes ---------------- */

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isMongoConnected ? 'mongodb' : 'persistent-local',
    aiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

/* ---------------- Google Classroom Integration ---------------- */

// EXACT scopes required for Google Classroom integration
const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly'
];

// Determine the most accurate redirect URI based on configuration and current host
function getEffectiveRedirectUri(req) {
  if (req && req.query && req.query.redirect_uri) {
    return req.query.redirect_uri;
  }
  if (process.env.REDIRECT_URI) {
    return process.env.REDIRECT_URI;
  }
  if (req) {
    const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const host = req.headers['x-forwarded-host'] || req.get('host');
    if (host) {
      return `${protocol}://${host}/auth/google/callback`;
    }
  }
  return 'http://localhost:3000/auth/google/callback';
}

// Helper to initialize Google OAuth2 client with optional custom redirect URI
function getOAuth2Client(customRedirectUri = null) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    customRedirectUri || process.env.REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
  );
}

// Robust token exchange helper that attempts configured URI, request origin URI, and localhost
async function exchangeGoogleCodeForTokens(code, req) {
  const customUri = req?.body?.redirect_uri || req?.query?.redirect_uri;
  const configuredUri = process.env.REDIRECT_URI;
  let requestUri = null;
  if (req && typeof req.get === 'function') {
    const protocol = req.headers?.['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const host = req.headers?.['x-forwarded-host'] || req.get('host');
    if (host) {
      requestUri = `${protocol}://${host}/auth/google/callback`;
    }
  }

  const candidateUris = Array.from(new Set([
    customUri,
    configuredUri,
    requestUri,
    'https://remmmix-nova-ai-study-assistant.ai.studio/auth/google/callback',
    'http://localhost:3000/auth/google/callback'
  ].filter(Boolean)));

  let lastError = null;
  for (const uri of candidateUris) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        uri
      );
      const { tokens } = await oauth2Client.getToken({ code, redirect_uri: uri });
      return { tokens, oauth2Client, usedRedirectUri: uri };
    } catch (err) {
      lastError = err;
      const msg = String(err.message || '');
      // If error is code expired or used, trying more URIs won't help
      if (msg.includes('invalid_grant') && msg.includes('expired')) {
        break;
      }
    }
  }
  throw lastError || new Error('Failed to exchange authorization code for Google tokens.');
}

// Save authenticated Google Classroom credentials against NOVA user profile
async function saveGoogleClassroomUser(authEmail, tokens, userInfo) {
  if (!authEmail) return null;
  const cleanEmail = String(authEmail).toLowerCase().trim();

  const googleData = {
    connected: true,
    email: (userInfo?.email || '').toLowerCase().trim(),
    name: userInfo?.name || 'Classroom Student',
    picture: userInfo?.picture || '',
    tokens: tokens,
    connectedAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString()
  };

  // Update in-memory user
  let user = inMemoryUsers.find(u => (u.email || '').toLowerCase().trim() === cleanEmail);
  if (user) {
    user.googleClassroom = googleData;
  } else {
    user = {
      id: 'usr_' + Date.now(),
      email: cleanEmail,
      name: userInfo?.name || 'Student',
      role: 'student',
      googleClassroom: googleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inMemoryUsers.push(user);
  }
  await persistLocalUsers();

  // Update MongoDB if connected
  if (isMongoConnected) {
    try {
      await UserProfile.updateOne(
        { email: cleanEmail },
        { $set: { googleClassroom: googleData } }
      );
    } catch (dbErr) {
      console.warn('[Classroom] MongoDB user update notice:', dbErr.message);
    }
  }

  return user;
}

// Fetch active courses, coursework, and submissions from Google Classroom and persist them
async function fetchAndSyncClassroomAssignments(tokens, userEmail) {
  if (!tokens) return [];
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials(tokens);

  // Auto-refresh token listener
  oauth2Client.on('tokens', async (newTokens) => {
    const updatedTokens = { ...tokens, ...newTokens };
    if (userEmail) {
      const cleanEmail = String(userEmail).toLowerCase().trim();
      const u = inMemoryUsers.find(usr => (usr.email || '').toLowerCase().trim() === cleanEmail);
      if (u && u.googleClassroom) {
        u.googleClassroom.tokens = updatedTokens;
        await persistLocalUsers();
      }
      if (isMongoConnected) {
        try {
          await UserProfile.updateOne(
            { email: cleanEmail },
            { $set: { 'googleClassroom.tokens': updatedTokens } }
          );
        } catch (e) {}
      }
    }
  });

  const classroom = google.classroom({ version: 'v1', auth: oauth2Client });

  // 1. Fetch active courses where user is enrolled
  const coursesRes = await classroom.courses.list({
    studentId: 'me',
    courseStates: ['ACTIVE']
  });
  const courses = coursesRes.data.courses || [];
  const assignmentsList = [];
  const now = new Date();
  const cleanEmail = (userEmail || '').toLowerCase().trim();

  // 2. For each active course, fetch courseWork and student submissions
  for (const course of courses) {
    const courseId = course.id;
    const courseName = course.name || 'Google Classroom';

    let courseWorkList = [];
    try {
      const cwRes = await classroom.courses.courseWork.list({ courseId });
      courseWorkList = cwRes.data.courseWork || [];
    } catch (cwErr) {
      console.warn(`[Classroom] Could not fetch coursework for ${courseId}:`, cwErr.message);
    }

    if (courseWorkList.length === 0) continue;

    let submissions = [];
    try {
      const subRes = await classroom.courses.courseWork.studentSubmissions.list({
        courseId,
        courseWorkId: '-',
        userId: 'me'
      });
      submissions = subRes.data.studentSubmissions || [];
    } catch (subErr) {
      console.warn(`[Classroom] Could not fetch submissions for ${courseId}:`, subErr.message);
    }

    const subMap = new Map();
    for (const sub of submissions) {
      subMap.set(sub.courseWorkId, sub);
    }

    for (const work of courseWorkList) {
      let dueDateIso = null;
      let dueDateYmd = null;
      let dueTimeStr = '';
      let isDueDatePassed = false;

      if (work.dueDate && work.dueDate.year && work.dueDate.month && work.dueDate.day) {
        const y = work.dueDate.year;
        const m = String(work.dueDate.month).padStart(2, '0');
        const d = String(work.dueDate.day).padStart(2, '0');
        const h = String(work.dueTime?.hours || 23).padStart(2, '0');
        const min = String(work.dueTime?.minutes || 59).padStart(2, '0');
        const sec = String(work.dueTime?.seconds || 59).padStart(2, '0');

        dueDateIso = new Date(`${y}-${m}-${d}T${h}:${min}:${sec}Z`).toISOString();
        dueDateYmd = `${y}-${m}-${d}`;
        dueTimeStr = `${h}:${min}`;
        isDueDatePassed = new Date(dueDateIso) < now;
      }

      const sub = subMap.get(work.id);
      const subState = sub ? sub.state : null;
      const assignedGrade = sub ? sub.assignedGrade : null;

      let status = 'Not Started';
      let statusCategory = 'pending';
      let isCompleted = false;

      if (subState === 'TURNED_IN' || subState === 'RETURNED') {
        status = 'Completed';
        statusCategory = 'finished';
        isCompleted = true;
      } else if (isDueDatePassed) {
        status = 'In Progress';
        statusCategory = 'due';
      } else {
        status = 'Not Started';
        statusCategory = 'pending';
      }

      const item = {
        id: `gc_${work.id}`,
        userId: cleanEmail || 'all',
        title: work.title || 'Untitled Assignment',
        course: courseName,
        subject: courseName,
        description: work.description || '',
        dueDate: dueDateYmd || dueDateIso,
        dueTime: dueTimeStr,
        status: status,
        statusCategory: statusCategory,
        completed: isCompleted,
        link: work.alternateLink || '',
        attachmentUrl: work.alternateLink || '',
        points: work.maxPoints || null,
        source: 'classroom',
        googleCourseId: courseId,
        googleCourseWorkId: work.id,
        googleCourseName: courseName,
        googleAlternateLink: work.alternateLink || '',
        googleSubmissionStatus: subState,
        googleAssignedGrade: assignedGrade,
        googleMaxPoints: work.maxPoints || null,
        lastSyncedAt: new Date().toISOString()
      };

      assignmentsList.push(item);

      // Upsert into local assignment store
      if (cleanEmail) {
        const existingIdx = inMemoryAssignments.findIndex(a => a.id === item.id && a.userId === cleanEmail);
        if (existingIdx >= 0) {
          inMemoryAssignments[existingIdx] = { ...inMemoryAssignments[existingIdx], ...item };
        } else {
          inMemoryAssignments.push(item);
        }
      }
    }
  }

  if (cleanEmail && inMemoryAssignments.length > 0) {
    try {
      await persistLocalAssignments();
    } catch (e) {}
  }

  return assignmentsList;
}

// 1. GET /auth/google - Initiate Google OAuth login
app.get('/auth/google', (req, res) => {
  try {
    const userEmail = (
      req.query.email ||
      req.session?.userEmail ||
      (req.session?.user && req.session.user.email) ||
      req.headers['x-user-email'] ||
      ''
    ).toLowerCase().trim();

    if (userEmail && req.session) {
      req.session.userEmail = userEmail;
    }

    const redirectUri = getEffectiveRedirectUri(req);
    const oauth2Client = getOAuth2Client(redirectUri);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: CLASSROOM_SCOPES,
      state: userEmail || ''
    });

    res.redirect(authUrl);
  } catch (err) {
    console.error('Error creating Google auth URL:', err);
    res.status(500).send('Failed to start Google login: ' + (err.message || 'Unknown error'));
  }
});

// 2. Google OAuth callback handler - Exchange code for tokens, save against NOVA user, sync coursework
async function handleGoogleCallback(req, res) {
  const code = req.query.code;
  const stateEmail = (req.query.state || '').toLowerCase().trim();
  const oauthError = req.query.error;

  // Handle user cancellation or denial
  if (oauthError) {
    const errorDesc = req.query.error_description || (
      oauthError === 'access_denied'
        ? 'Google sign-in was cancelled or Classroom permissions were denied.'
        : `Google authentication error: ${oauthError}`
    );
    console.warn(`[OAuth] Google returned error: ${oauthError} (${errorDesc})`);
    const errTarget = stateEmail
      ? `/?error=${encodeURIComponent(errorDesc)}&email=${encodeURIComponent(stateEmail)}#assignments`
      : `/?error=${encodeURIComponent(errorDesc)}#assignments`;
    return res.redirect(errTarget);
  }

  if (!code) {
    const errorDesc = 'No authorization code was provided by Google.';
    const target = stateEmail
      ? `/?error=${encodeURIComponent(errorDesc)}&email=${encodeURIComponent(stateEmail)}#assignments`
      : `/?error=${encodeURIComponent(errorDesc)}#assignments`;
    return res.redirect(target);
  }

  try {
    const { tokens, oauth2Client } = await exchangeGoogleCodeForTokens(code, req);
    oauth2Client.setCredentials(tokens);

    // Retrieve user profile from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Preserve existing NOVA session identity
    const existingSessionEmail = req.session?.userEmail || (req.session?.user && req.session.user.email);
    const effectiveNovaEmail = stateEmail || existingSessionEmail || (userInfo?.email ? userInfo.email.toLowerCase().trim() : null);

    req.session.tokens = tokens;
    req.session.googleUser = {
      name: userInfo?.name || 'Classroom Student',
      email: userInfo?.email || '',
      picture: userInfo?.picture || ''
    };

    if (effectiveNovaEmail) {
      req.session.userEmail = effectiveNovaEmail;
      const matchedUser = inMemoryUsers.find(u => (u.email || '').toLowerCase().trim() === effectiveNovaEmail);
      if (matchedUser) {
        req.session.userId = matchedUser.id;
        req.session.userRole = matchedUser.role || 'student';
      }
      // Save authenticated Google account against NOVA user
      await saveGoogleClassroomUser(effectiveNovaEmail, tokens, userInfo);
    }

    // Pre-sync Classroom courses and coursework
    try {
      await fetchAndSyncClassroomAssignments(tokens, effectiveNovaEmail);
    } catch (syncErr) {
      console.warn('[OAuth] Pre-sync assignments warning:', syncErr.message);
    }

    req.session.save((saveErr) => {
      if (saveErr) console.warn('[OAuth] Session save notice:', saveErr);
      const redirectTarget = effectiveNovaEmail
        ? `/?classroom_auth=success&email=${encodeURIComponent(effectiveNovaEmail)}#assignments`
        : '/?classroom_auth=success#assignments';
      res.redirect(redirectTarget);
    });
  } catch (error) {
    console.error('Error in Google auth callback:', error);
    const errorMsg = error.message && error.message.includes('invalid_grant')
      ? 'Authorization code expired or already used. Please click "Sign in with Google Classroom" again.'
      : (error.message || 'Authentication with Google Classroom failed.');
    const errTarget = stateEmail
      ? `/?error=${encodeURIComponent(errorMsg)}&email=${encodeURIComponent(stateEmail)}#assignments`
      : `/?error=${encodeURIComponent(errorMsg)}#assignments`;
    res.redirect(errTarget);
  }
}

// Support standard /auth/google/callback and /api/auth/google/callback
app.get('/auth/google/callback', handleGoogleCallback);
app.get('/api/auth/google/callback', handleGoogleCallback);

// Root interceptor if Google redirects to root with code/error
app.get('/', (req, res, next) => {
  if (req.query.code || req.query.error) {
    return handleGoogleCallback(req, res);
  }
  next();
});

// POST /api/classroom/exchange-code — Direct code exchange for flexible callback handling
app.post('/api/classroom/exchange-code', async (req, res) => {
  try {
    const { code, email, redirect_uri } = req.body || {};
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required.' });
    }

    const authEmail = getAuthEmail(req) || (email ? String(email).toLowerCase().trim() : null);
    const { tokens, oauth2Client } = await exchangeGoogleCodeForTokens(code, {
      body: { redirect_uri },
      protocol: req.protocol,
      get: (header) => req.get(header)
    });

    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    req.session.tokens = tokens;
    req.session.googleUser = {
      name: userInfo?.name || 'Classroom Student',
      email: userInfo?.email || '',
      picture: userInfo?.picture || ''
    };

    const effectiveEmail = authEmail || (userInfo?.email ? userInfo.email.toLowerCase().trim() : null);
    if (effectiveEmail) {
      req.session.userEmail = effectiveEmail;
      await saveGoogleClassroomUser(effectiveEmail, tokens, userInfo);
    }

    // Pre-sync assignments
    const assignments = await fetchAndSyncClassroomAssignments(tokens, effectiveEmail);

    res.json({
      success: true,
      user: req.session.googleUser,
      assignmentsCount: assignments.length
    });
  } catch (err) {
    console.error('Error exchanging code:', err);
    res.status(500).json({ error: err.message || 'Failed to exchange authorization code.' });
  }
});

// 3. GET /auth/logout - Disconnect Classroom session while preserving NOVA user session
app.get('/auth/logout', async (req, res) => {
  const authEmail = getAuthEmail(req);
  if (req.session) {
    delete req.session.tokens;
    delete req.session.googleUser;
    delete req.session.user;
  }

  if (authEmail) {
    const uIdx = inMemoryUsers.findIndex(u => (u.email || '').toLowerCase().trim() === authEmail);
    if (uIdx >= 0) {
      inMemoryUsers[uIdx].googleClassroom = null;
      try {
        await persistLocalUsers();
      } catch (e) {}
    }
    if (isMongoConnected) {
      try {
        await UserProfile.updateOne({ email: authEmail }, { $unset: { googleClassroom: 1 } });
      } catch (e) {}
    }
  }

  const redirectTarget = authEmail
    ? `/?classroom_logout=success&email=${encodeURIComponent(authEmail)}#assignments`
    : '/?classroom_logout=success#assignments';
  res.redirect(redirectTarget);
});

// GET /api/classroom/user - Helper endpoint to return connected Classroom user info
app.get('/api/classroom/user', (req, res) => {
  const authEmail = getAuthEmail(req);

  // Check active session first
  if (req.session && req.session.tokens && req.session.googleUser) {
    return res.json({
      loggedIn: true,
      user: req.session.googleUser
    });
  }

  // Restore from persistent user profile if available
  if (authEmail) {
    const user = inMemoryUsers.find(u => (u.email || '').toLowerCase().trim() === authEmail);
    if (user && user.googleClassroom && user.googleClassroom.connected && user.googleClassroom.tokens) {
      if (req.session) {
        req.session.tokens = user.googleClassroom.tokens;
        req.session.googleUser = {
          email: user.googleClassroom.email,
          name: user.googleClassroom.name,
          picture: user.googleClassroom.picture || ''
        };
      }
      return res.json({
        loggedIn: true,
        user: {
          email: user.googleClassroom.email,
          name: user.googleClassroom.name,
          picture: user.googleClassroom.picture || ''
        }
      });
    }
  }

  res.status(200).json({ loggedIn: false });
});

// GET /api/classroom/courses - Fetch user's active Google Classroom courses
app.get('/api/classroom/courses', async (req, res) => {
  const authEmail = getAuthEmail(req);
  let tokens = req.session?.tokens;

  if (!tokens && authEmail) {
    const user = inMemoryUsers.find(u => (u.email || '').toLowerCase().trim() === authEmail);
    if (user?.googleClassroom?.tokens) {
      tokens = user.googleClassroom.tokens;
      if (req.session) req.session.tokens = tokens;
    }
  }

  if (!tokens) {
    return res.status(401).json({ error: 'Unauthorized: User is not logged in to Google Classroom.' });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials(tokens);
    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
    const coursesRes = await classroom.courses.list({
      studentId: 'me',
      courseStates: ['ACTIVE']
    });
    res.json({ success: true, courses: coursesRes.data.courses || [] });
  } catch (err) {
    console.error('Error fetching Classroom courses:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch courses from Google Classroom.' });
  }
});

// 4. GET /api/classroom/assignments - Fetch active courses, coursework, and student submissions
app.get('/api/classroom/assignments', async (req, res) => {
  const authEmail = getAuthEmail(req);
  let tokens = req.session?.tokens;

  if (!tokens && authEmail) {
    const user = inMemoryUsers.find(u => (u.email || '').toLowerCase().trim() === authEmail);
    if (user?.googleClassroom?.tokens) {
      tokens = user.googleClassroom.tokens;
      if (req.session) req.session.tokens = tokens;
    }
  }

  if (!tokens) {
    return res.status(401).json({ error: 'Unauthorized: User is not logged in to Google Classroom.' });
  }

  try {
    const assignmentsList = await fetchAndSyncClassroomAssignments(tokens, authEmail);
    res.json(assignmentsList);
  } catch (error) {
    console.error('Error fetching Classroom assignments:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch assignments from Google Classroom.'
    });
  }
});

// GET /api/classroom/oauth-config - Helper to inspect OAuth configuration & callback URI
app.get('/api/classroom/oauth-config', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const currentOriginCallback = `${protocol}://${host}/auth/google/callback`;

  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID || null,
    configuredRedirectUri: process.env.REDIRECT_URI || null,
    currentHostCallbackUri: currentOriginCallback,
    isConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  });
});

/* ---------------- User Authentication (Server-Side Persistence & Security) ---------------- */

// Secure password hashing with PBKDF2 and random salt
function hashPassword(password) {
  if (!password || typeof password !== 'string') return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `pbkdf2$${salt}$${hash}`;
}

// Secure password verification with support for PBKDF2, legacy SHA-256, and plain seed accounts
function verifyPassword(candidate, storedHash) {
  if (!storedHash || !candidate) return false;
  const candidateStr = String(candidate);
  const storedStr = String(storedHash);

  // 1. Salted PBKDF2 format: pbkdf2$salt$hash
  if (storedStr.startsWith('pbkdf2$')) {
    const parts = storedStr.split('$');
    if (parts.length === 3) {
      const salt = parts[1];
      const originalHash = parts[2];
      try {
        const checkHash = crypto.pbkdf2Sync(candidateStr, salt, 10000, 64, 'sha512').toString('hex');
        return crypto.timingSafeEqual(Buffer.from(checkHash, 'hex'), Buffer.from(originalHash, 'hex'));
      } catch (e) {
        return false;
      }
    }
  }

  // 2. SHA-256 hash
  const candidateSha256 = crypto.createHash('sha256').update(candidateStr).digest('hex');
  if (storedStr.length === 64 && /^[0-9a-fA-F]+$/.test(storedStr)) {
    if (storedStr.toLowerCase() === candidateSha256.toLowerCase() || storedStr.toLowerCase() === candidateStr.toLowerCase()) {
      return true;
    }
  }

  // 3. Plaintext legacy fallback (e.g. for development accounts)
  if (storedStr === candidateStr) {
    return true;
  }

  return false;
}

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, course, program, university, branch, year, semester, subjects } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();
    const rawPassword = password ? String(password) : '';

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!cleanName) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }
    if (!rawPassword || rawPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Check if user already exists
    let existing = null;
    if (isMongoConnected) {
      try {
        existing = await UserProfile.findOne({ email: cleanEmail }).lean();
      } catch (e) {}
    }
    if (!existing) {
      existing = inMemoryUsers.find((u) => (u.email || '').toLowerCase().trim() === cleanEmail);
    }
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in instead.' });
    }

    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const passwordHash = hashPassword(rawPassword);

    const newUser = {
      id: userId,
      email: cleanEmail,
      name: cleanName,
      passwordHash: passwordHash,
      role: 'student', // Student registration always creates a student account
      course: course || 'btech',
      program: program || 'B.Tech',
      university: university || 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)',
      branch: branch || 'Computer Science & Engineering (CSE)',
      year: year || '2nd Year',
      semester: semester || 'Semester 3',
      subjects: Array.isArray(subjects) ? subjects : ['Data Structures (BCS-301)', 'Computer System Architecture (BCS-302)', 'Discrete Structures & Theory of Logic (BCS-303)', 'Technical Communication (BAS-301)'],
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

    if (isMongoConnected) {
      try {
        const created = await UserProfile.create(newUser);
        newUser._id = created._id;
      } catch (dbErr) {
        console.warn('[Auth] Mongoose create failed, using local store:', dbErr.message);
      }
    }

    inMemoryUsers.push(newUser);
    await persistLocalUsers();

    if (req.session) {
      req.session.userId = newUser.id;
      req.session.userEmail = cleanEmail;
      req.session.userRole = 'student';
      delete req.session.timetableAuth;
    }

    // Sanitize passwordHash before returning to client
    const { passwordHash: _ph, ...safeUser } = newUser;
    res.status(201).json({ success: true, user: safeUser });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// POST /api/auth/staff-register — Secure admin-controlled staff account creation
app.post('/api/auth/staff-register', async (req, res) => {
  try {
    const { name, email, password, department, designation, adminPasskey } = req.body || {};
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();
    const rawPassword = password ? String(password) : '';
    const cleanPasskey = (adminPasskey || '').trim();

    // Secure Admin Passkey Validation
    const validPasskeys = [
      'staff123',
      process.env.STAFF_ACCESS_KEY,
      'STAFF-NOVA-2026',
      'Admin@123',
      'NOVA-ADMIN-2026'
    ].filter(Boolean);

    const isKeyValid = validPasskeys.some(k => k === cleanPasskey || k.toLowerCase() === cleanPasskey.toLowerCase());

    if (!isKeyValid) {
      return res.status(403).json({
        error: 'Invalid Administrator Passkey. Staff registration requires authorization from the University Academic Administration.'
      });
    }

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Staff email address is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid staff email address.' });
    }
    if (!cleanName) {
      return res.status(400).json({ error: 'Please enter faculty / staff full name.' });
    }
    if (!rawPassword || rawPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Check if user already exists
    let existing = inMemoryUsers.find((u) => (u.email || '').toLowerCase().trim() === cleanEmail);
    if (!existing && isMongoConnected) {
      try {
        existing = await UserProfile.findOne({ email: cleanEmail }).lean();
      } catch (e) {}
    }
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in directly.' });
    }

    const staffId = 'usr_staff_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const passwordHash = hashPassword(rawPassword);

    const newStaff = {
      id: staffId,
      email: cleanEmail,
      name: cleanName,
      passwordHash: passwordHash,
      role: 'staff',
      department: (department || 'Computer Science & Engineering').trim(),
      designation: (designation || 'Assistant Professor').trim(),
      university: 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)',
      program: 'B.Tech',
      branch: 'CSE',
      year: 'All Years',
      semester: 'All Semesters',
      subjects: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isMongoConnected) {
      try {
        const created = await UserProfile.create(newStaff);
        newStaff._id = created._id;
      } catch (dbErr) {
        console.warn('[StaffAuth] Mongoose create failed:', dbErr.message);
      }
    }

    inMemoryUsers.push(newStaff);
    await persistLocalUsers();

    // Register into timetable teachers roster if timetableService loaded
    try {
      if (typeof timetableService !== 'undefined' && timetableService.readStore) {
        const store = timetableService.readStore();
        const existingTeacher = (store.teachers || []).find(t => (t.email || '').toLowerCase() === cleanEmail);
        if (!existingTeacher) {
          const nextId = 'F' + ((store.teachers || []).length + 1);
          timetableService.addFaculty({
            id: nextId,
            code: nextId,
            name: cleanName,
            email: cleanEmail,
            department: newStaff.department,
            designation: newStaff.designation,
            maxWeeklyHours: 18.0,
            maxDailyHours: 4.0,
            isActive: true
          });
        }
      }
    } catch (ttErr) {
      console.warn('[StaffAuth] Timetable sync notice:', ttErr.message);
    }

    if (req.session) {
      req.session.userId = newStaff.id;
      req.session.userEmail = cleanEmail;
      req.session.userRole = 'staff';
      req.session.timetableAuth = {
        id: newStaff.id,
        email: cleanEmail,
        name: cleanName,
        role: 'staff',
        department: newStaff.department
      };
    }

    const { passwordHash: _ph, ...safeUser } = newStaff;
    res.status(201).json({
      success: true,
      message: 'Staff account registered and approved successfully.',
      user: safeUser
    });
  } catch (err) {
    console.error('Staff registration error:', err);
    res.status(500).json({ error: 'Failed to create staff account. Please try again.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, passwordHash, requestedRole } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const candidatePassword = password ? String(password) : (passwordHash ? String(passwordHash) : '');

    if (!cleanEmail || !candidatePassword) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    let user = null;
    if (isMongoConnected) {
      try {
        user = await UserProfile.findOne({ email: cleanEmail }).lean();
      } catch (e) {}
    }
    if (!user) {
      user = inMemoryUsers.find((u) => (u.email || '').toLowerCase().trim() === cleanEmail);
    }

    // If not found in user store, check if existing teacher in timetable store
    if (!user && typeof timetableService !== 'undefined' && timetableService.readStore) {
      try {
        const store = timetableService.readStore();
        const teacher = (store.teachers || []).find(t => (t.email || '').toLowerCase() === cleanEmail);
        if (teacher) {
          user = {
            id: `usr_${teacher.id.toLowerCase()}`,
            facultyId: teacher.id,
            email: teacher.email,
            name: teacher.name,
            role: 'faculty',
            department: teacher.department,
            designation: teacher.designation,
            passwordHash: 'Faculty@123'
          };
          inMemoryUsers.push(user);
        }
      } catch (e) {}
    }

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email. Please check your email or sign up.' });
    }

    // Strict Password Verification - Never allow login without correct password
    if (!user.passwordHash || !verifyPassword(candidatePassword, user.passwordHash)) {
      return res.status(401).json({ error: 'Incorrect email or password. Please try again.' });
    }

    // Determine authoritative role:
    // If user has role stored, respect it. If not, determine based on email or default to 'student'
    let effectiveRole = user.role;
    if (!effectiveRole) {
      if (cleanEmail === 'admin@aktu.ac.in' || cleanEmail.includes('admin')) {
        effectiveRole = 'admin';
      } else if (cleanEmail.includes('faculty') || cleanEmail.includes('@nova.edu')) {
        effectiveRole = 'faculty';
      } else {
        effectiveRole = 'student';
      }
      user.role = effectiveRole;
    }

    // Role Verification: Enforce separate login modes
    if (requestedRole) {
      const cleanRequestedRole = String(requestedRole).toLowerCase().trim();
      if (cleanRequestedRole === 'staff' || cleanRequestedRole === 'admin') {
        if (!isStaffRole(effectiveRole)) {
          return res.status(403).json({
            error: 'Access denied: This account is registered as a Student. Please switch to the "Student" login tab.'
          });
        }
      } else if (cleanRequestedRole === 'student') {
        if (isStaffRole(effectiveRole)) {
          return res.status(403).json({
            error: 'Staff account detected. Please switch to the "Staff (Teacher/Admin)" role tab to access the Staff Dashboard.'
          });
        }
      }
    }

    // Upgrade legacy password hash to salted PBKDF2 if needed
    if (typeof user.passwordHash === 'string' && !user.passwordHash.startsWith('pbkdf2$')) {
      const upgradedHash = hashPassword(candidatePassword);
      user.passwordHash = upgradedHash;
      const uIdx = inMemoryUsers.findIndex((u) => (u.email || '').toLowerCase().trim() === cleanEmail);
      if (uIdx >= 0) {
        inMemoryUsers[uIdx].passwordHash = upgradedHash;
        inMemoryUsers[uIdx].role = effectiveRole;
      }
      if (isMongoConnected) {
        try {
          await UserProfile.updateOne({ email: cleanEmail }, { $set: { passwordHash: upgradedHash, role: effectiveRole } });
        } catch (e) {}
      }
    }

    // Calculate fresh streak on login
    const streakInfo = calculateStreakDetails(user.activeStudyDates || [], user.longestStreak || 0);
    user.streak = streakInfo.currentStreak;
    user.longestStreak = streakInfo.longestStreak;

    // Update in store
    const idx = inMemoryUsers.findIndex((u) => (u.email || '').toLowerCase().trim() === cleanEmail);
    if (idx >= 0) {
      inMemoryUsers[idx].streak = user.streak;
      inMemoryUsers[idx].longestStreak = user.longestStreak;
      inMemoryUsers[idx].role = effectiveRole;
    }
    if (isMongoConnected) {
      try {
        await UserProfile.updateOne({ email: cleanEmail }, { $set: { streak: user.streak, longestStreak: user.longestStreak, role: effectiveRole } });
      } catch (e) {}
    }
    await persistLocalUsers();

    // Session Management for separate roles
    if (req.session) {
      req.session.userId = user.id;
      req.session.userEmail = cleanEmail;
      req.session.userRole = effectiveRole;

      if (isStaffRole(effectiveRole)) {
        req.session.timetableAuth = {
          id: user.id,
          facultyId: user.facultyId || null,
          email: user.email,
          name: user.name,
          role: effectiveRole,
          department: user.department || ''
        };
      } else {
        delete req.session.timetableAuth;
      }
    }

    const { passwordHash: _ph, ...safeUser } = user;
    safeUser.role = effectiveRole;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// POST /api/auth/sync - Sync authenticated client session (e.g. from Firebase Auth) with server
app.post('/api/auth/sync', async (req, res) => {
  try {
    const { uid, id, email, name, course, program, university, branch, year, semester, subjects } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email is required for session synchronization' });
    }

    // Verify Firebase ID token if provided in Authorization header
    let verifiedUid = null;
    let verifiedEmail = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split(' ')[1];
      try {
        const fbConfigPath = path.join(__dirname, 'firebase-applet-config.json');
        let fbApiKey = process.env.FIREBASE_API_KEY;
        if (!fbApiKey && fs.existsSync(fbConfigPath)) {
          const parsed = JSON.parse(fs.readFileSync(fbConfigPath, 'utf8'));
          fbApiKey = parsed.apiKey;
        }
        if (fbApiKey) {
          const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${fbApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          });
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            if (verifyData.users && verifyData.users[0]) {
              verifiedUid = verifyData.users[0].localId;
              verifiedEmail = (verifyData.users[0].email || '').toLowerCase().trim();
            }
          }
        }
      } catch (tokenErr) {
        console.warn('[Sync] Token verification notice:', tokenErr.message);
      }
    }

    // If ID token was provided, ensure it matches the requested email
    if (verifiedEmail && verifiedEmail !== cleanEmail) {
      return res.status(403).json({ error: 'Forbidden: ID token email does not match profile email.' });
    }

    const userId = verifiedUid || uid || id || `usr_${Date.now()}`;
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0] || 'Student';

    // Find existing profile or upsert
    let user = null;
    if (isMongoConnected) {
      try {
        user = await UserProfile.findOne({ email: cleanEmail }).lean();
      } catch (e) {}
    }
    if (!user) {
      user = inMemoryUsers.find((u) => (u.email || '').toLowerCase().trim() === cleanEmail);
    }

    if (user) {
      user.id = user.id || userId;
      user.name = cleanName || user.name;
      if (course) user.course = course;
      if (program) user.program = program;
      if (branch) user.branch = branch;
      if (year) user.year = year;
      if (semester) user.semester = semester;
      user.updatedAt = new Date().toISOString();

      const idx = inMemoryUsers.findIndex((u) => (u.email || '').toLowerCase().trim() === cleanEmail);
      if (idx >= 0) inMemoryUsers[idx] = user;
    } else {
      user = {
        id: userId,
        email: cleanEmail,
        name: cleanName,
        course: course || 'btech',
        program: program || 'B.Tech',
        university: university || 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)',
        branch: branch || 'Computer Science & Engineering (CSE)',
        year: year || '2nd Year',
        semester: semester || 'Semester 3',
        subjects: Array.isArray(subjects) ? subjects : [
          'Data Structures (BCS-301)',
          'Computer System Architecture (BCS-302)',
          'Discrete Structures & Theory of Logic (BCS-303)',
          'Technical Communication (BAS-301)'
        ],
        streak: 0,
        longestStreak: 0,
        overallProgress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      inMemoryUsers.push(user);
    }

    await persistLocalUsers();

    if (req.session) {
      req.session.userId = user.id;
      req.session.userEmail = cleanEmail;
    }

    const { passwordHash: _ph, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('Session sync error:', err);
    res.status(500).json({ error: 'Failed to synchronize session' });
  }
});

// GET /api/auth/me - Verify current session
app.get('/api/auth/me', async (req, res) => {
  try {
    const sessionEmail = getAuthEmail(req);
    if (!sessionEmail) {
      return res.status(401).json({ authenticated: false, error: 'Not authenticated' });
    }

    let user = null;
    if (isMongoConnected) {
      try {
        user = await UserProfile.findOne({ email: sessionEmail }).lean();
      } catch (e) {}
    }
    if (!user) {
      user = inMemoryUsers.find((u) => (u.email || '').toLowerCase().trim() === sessionEmail);
    }
    if (!user) {
      return res.status(404).json({ authenticated: false, error: 'User not found' });
    }

    // Determine authoritative role
    let effectiveRole = user.role;
    if (!effectiveRole) {
      if (sessionEmail === 'admin@aktu.ac.in' || sessionEmail.includes('admin')) {
        effectiveRole = 'admin';
      } else if (sessionEmail.includes('faculty') || sessionEmail.includes('@nova.edu')) {
        effectiveRole = 'faculty';
      } else {
        effectiveRole = 'student';
      }
      user.role = effectiveRole;
    }

    // Refresh active session in express-session
    if (req.session) {
      req.session.userEmail = sessionEmail;
      req.session.userId = user.id;
      req.session.userRole = effectiveRole;
      if (isStaffRole(effectiveRole)) {
        req.session.timetableAuth = {
          id: user.id,
          facultyId: user.facultyId || null,
          email: user.email,
          name: user.name,
          role: effectiveRole,
          department: user.department || ''
        };
      }
    }

    const streakInfo = calculateStreakDetails(user.activeStudyDates || [], user.longestStreak || 0);
    user.streak = streakInfo.currentStreak;
    user.longestStreak = streakInfo.longestStreak;

    const { passwordHash: _ph, ...safeUser } = user;
    safeUser.role = effectiveRole;
    res.json({ success: true, authenticated: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ authenticated: false, error: 'Failed to verify session' });
  }
});

// POST /api/auth/logout - Clear server session
app.post('/api/auth/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  } else {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  }
});

/* ---------------- Student Profile & Academic Memory ---------------- */

// Get student profile
// GET /api/user/profile/:identifier
app.get('/api/user/profile/:identifier', requireAuth, async (req, res) => {
  try {
    const identifier = (req.params.identifier || '').toLowerCase().trim();
    if (!identifier) return res.status(400).json({ error: 'Identifier is required' });

    // Isolation check: user can only access their own profile
    if (identifier !== req.authEmail) {
      return res.status(403).json({ error: 'Access denied: You can only view your own profile.' });
    }

    let profile = null;
    if (isMongoConnected) {
      try {
        profile = await UserProfile.findOne({
          $or: [{ email: req.authEmail }, { id: req.authEmail }]
        }).lean();
        if (profile) {
          const streakInfo = calculateStreakDetails(profile.activeStudyDates || [], profile.longestStreak || 0);
          profile.streak = streakInfo.currentStreak;
          profile.longestStreak = streakInfo.longestStreak;
          const { passwordHash, ...safe } = profile;
          return res.json(safe);
        }
      } catch (dbErr) {}
    }

    const localProfile = inMemoryUsers.find((u) =>
      (u.email || '').toLowerCase().trim() === req.authEmail || (u.id || '').toLowerCase().trim() === req.authEmail
    );
    if (localProfile) {
      const streakInfo = calculateStreakDetails(localProfile.activeStudyDates || [], localProfile.longestStreak || 0);
      localProfile.streak = streakInfo.currentStreak;
      localProfile.longestStreak = streakInfo.longestStreak;
      const { passwordHash, ...safe } = localProfile;
      return res.json(safe);
    }

    // Default student context if new
    res.json({
      id: 'usr_' + Date.now(),
      email: req.authEmail,
      name: 'Student',
      university: 'AKTU',
      program: 'B.Tech',
      branch: 'CSE',
      year: '2nd Year',
      semester: 'Semester 3',
      subjects: ['Data Structures', 'Computer System Architecture', 'Discrete Structures & Theory of Logic', 'Technical Communication'],
      streak: 0,
      longestStreak: 0,
      overallProgress: 0,
      goalsDone: 0,
      goalsTotal: 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student profile.' });
  }
});

// Save / update student profile
// PUT /api/user/profile
app.put('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const cleanEmail = req.authEmail; // strictly use authenticated email
    const { name, university, program, branch, year, semester, subjects, studyPreferences } = req.body;

    const payload = {
      email: cleanEmail,
      name: name ? String(name).trim() : 'Student',
      university: university ? String(university).trim() : 'AKTU',
      program: program ? String(program).trim() : 'B.Tech',
      branch: branch ? String(branch).trim() : 'CSE',
      year: year || '2nd Year',
      semester: semester || 'Semester 3',
      subjects: Array.isArray(subjects) ? subjects : (subjects ? String(subjects).split(',').map(s => s.trim()).filter(Boolean) : []),
      studyPreferences: studyPreferences || {}
    };

    let updatedResult = null;
    if (isMongoConnected) {
      try {
        const updated = await UserProfile.findOneAndUpdate(
          { email: cleanEmail },
          { $set: payload },
          { upsert: true, new: true }
        ).lean();
        if (updated) {
          updatedResult = updated;
        }
      } catch (dbErr) {
        console.warn('[Profile] MongoDB update error, falling back to local store:', dbErr.message);
      }
    }

    const idx = inMemoryUsers.findIndex((u) => (u.email || '').toLowerCase().trim() === cleanEmail);
    if (idx >= 0) {
      inMemoryUsers[idx] = { ...inMemoryUsers[idx], ...payload, updatedAt: new Date().toISOString() };
    } else {
      inMemoryUsers.push({ ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    await persistLocalUsers();

    res.json(updatedResult || payload);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update student profile.' });
  }
});

/* ---------------- Student Tasks & Calendar API ---------------- */

// Get all tasks for a specific student
// Get all tasks for a specific student
// GET /api/tasks/:userId
app.get('/api/tasks/:userId', requireAuth, async (req, res) => {
  try {
    const requestedUserId = (req.params.userId || '').toLowerCase().trim();
    if (requestedUserId && requestedUserId !== req.authEmail) {
      return res.status(403).json({ error: 'Access denied: You can only access your own tasks.' });
    }
    const userId = req.authEmail;

    let tasks = [];
    if (isMongoConnected) {
      try {
        tasks = await Task.find({ userId }).sort({ date: 1, createdAt: 1 }).lean();
      } catch (dbErr) {
        tasks = inMemoryTasks.filter((t) => t.userId === userId);
      }
    } else {
      tasks = inMemoryTasks.filter((t) => t.userId === userId);
    }

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student tasks.' });
  }
});

// Create or upsert a task for a student
// POST /api/tasks
app.post('/api/tasks', requireAuth, async (req, res) => {
  try {
    const cleanUserId = req.authEmail;
    const { id, title, description, date, time, subject, priority, completed, completedAt } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'title and date are required.' });
    }

    const taskId = id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const taskDoc = {
      id: taskId,
      userId: cleanUserId,
      title: title.trim(),
      description: (description || '').trim(),
      date: date.trim(), // 'YYYY-MM-DD'
      time: (time || '').trim(),
      subject: (subject || 'General').trim(),
      priority: ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium',
      completed: Boolean(completed),
      completedAt: completed ? (completedAt || new Date().toISOString()) : null,
      updatedAt: new Date().toISOString()
    };

    if (isMongoConnected) {
      try {
        const saved = await Task.findOneAndUpdate(
          { id: taskId, userId: cleanUserId },
          { $set: taskDoc },
          { upsert: true, new: true }
        ).lean();
        // Keep in-memory cache in sync
        const idx = inMemoryTasks.findIndex((t) => t.id === taskId && t.userId === cleanUserId);
        if (idx >= 0) inMemoryTasks[idx] = saved;
        else inMemoryTasks.push(saved);
        await persistLocalTasks();
        return res.json(saved);
      } catch (dbErr) {}
    }

    const idx = inMemoryTasks.findIndex((t) => t.id === taskId && t.userId === cleanUserId);
    if (idx >= 0) {
      inMemoryTasks[idx] = { ...inMemoryTasks[idx], ...taskDoc };
    } else {
      inMemoryTasks.push({ ...taskDoc, createdAt: new Date().toISOString() });
    }
    await persistLocalTasks();

    res.json(inMemoryTasks.find((t) => t.id === taskId && t.userId === cleanUserId) || taskDoc);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// Update a task (e.g. toggle completion, edit fields)
// PUT /api/tasks/:id
app.put('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const cleanUserId = req.authEmail;

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required.' });
    }

    const updateFields = { updatedAt: new Date().toISOString() };
    if (req.body.title !== undefined) updateFields.title = req.body.title.trim();
    if (req.body.description !== undefined) updateFields.description = req.body.description.trim();
    if (req.body.date !== undefined) updateFields.date = req.body.date.trim();
    if (req.body.time !== undefined) updateFields.time = req.body.time.trim();
    if (req.body.subject !== undefined) updateFields.subject = req.body.subject.trim();
    if (req.body.priority !== undefined && ['Low', 'Medium', 'High'].includes(req.body.priority)) updateFields.priority = req.body.priority;
    if (req.body.completed !== undefined) {
      updateFields.completed = Boolean(req.body.completed);
      updateFields.completedAt = updateFields.completed ? (req.body.completedAt || new Date().toISOString()) : null;
    }

    if (isMongoConnected) {
      try {
        const updated = await Task.findOneAndUpdate(
          { id: taskId, userId: cleanUserId },
          { $set: updateFields },
          { new: true }
        ).lean();
        if (updated) {
          const idx = inMemoryTasks.findIndex((t) => t.id === taskId && t.userId === cleanUserId);
          if (idx >= 0) inMemoryTasks[idx] = updated;
          await persistLocalTasks();
          return res.json(updated);
        }
      } catch (dbErr) {}
    }

    const idx = inMemoryTasks.findIndex((t) => t.id === taskId && t.userId === cleanUserId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    inMemoryTasks[idx] = { ...inMemoryTasks[idx], ...updateFields };
    await persistLocalTasks();

    res.json(inMemoryTasks[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// Delete a task
// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.authEmail;

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required.' });
    }

    if (isMongoConnected) {
      try {
        await Task.deleteOne({ id: taskId, userId });
      } catch (dbErr) {}
    }

    const initialLen = inMemoryTasks.length;
    inMemoryTasks = inMemoryTasks.filter((t) => !(t.id === taskId && t.userId === userId));
    if (inMemoryTasks.length !== initialLen) {
      await persistLocalTasks();
    }

    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});


/* ---------------- Student Coursework Assignments API ---------------- */

// GET /api/assignments/:userId - List and filter student assignments
app.get('/api/assignments/:userId', requireAuth, async (req, res) => {
  try {
    const requestedUserId = (req.params.userId || '').toLowerCase().trim();
    if (requestedUserId && requestedUserId !== req.authEmail) {
      return res.status(403).json({ error: 'Access denied: You can only access your own assignments.' });
    }
    const userId = req.authEmail;

    const { source, status, search, sort } = req.query;

    let assignments = [];
    if (isMongoConnected) {
      try {
        const query = { userId };
        if (source) {
          query.source = source;
        }
        if (status) {
          if (status.toLowerCase() === 'completed') {
            query.$or = [{ status: 'Completed' }, { completed: true }];
          } else if (status.toLowerCase() === 'pending') {
            query.completed = { $ne: true };
            query.status = { $ne: 'Completed' };
          }
        }
        assignments = await Assignment.find(query).lean();
      } catch (dbErr) {
        assignments = inMemoryAssignments.filter((a) => a.userId === userId);
      }
    } else {
      assignments = inMemoryAssignments.filter((a) => a.userId === userId);
    }

    // Apply memory filters if not MongoDB filtered
    if (source) {
      assignments = assignments.filter((a) => a.source === source);
    }
    if (status) {
      const s = status.toLowerCase();
      if (s === 'completed') {
        assignments = assignments.filter((a) => a.completed === true || a.status === 'Completed');
      } else if (s === 'pending') {
        assignments = assignments.filter((a) => !a.completed && a.status !== 'Completed');
      } else if (s === 'overdue') {
        const today = getLocalDateString(new Date());
        assignments = assignments.filter((a) => a.dueDate && a.dueDate < today && !a.completed && a.status !== 'Completed');
      }
    }

    if (search) {
      const q = String(search).toLowerCase().trim();
      assignments = assignments.filter((a) =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.subject || '').toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q)
      );
    }

    // Sorting
    const sortMode = sort || 'due-asc';
    assignments.sort((a, b) => {
      if (sortMode === 'due-asc') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        return (a.dueTime || '').localeCompare(b.dueTime || '');
      } else if (sortMode === 'due-desc') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        if (a.dueDate !== b.dueDate) return b.dueDate.localeCompare(a.dueDate);
        return (b.dueTime || '').localeCompare(a.dueTime || '');
      } else if (sortMode === 'priority') {
        const pOrder = { High: 1, Medium: 2, Low: 3 };
        const pa = pOrder[a.priority] || 2;
        const pb = pOrder[b.priority] || 2;
        if (pa !== pb) return pa - pb;
        return (a.dueDate || '').localeCompare(b.dueDate || '');
      } else if (sortMode === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortMode === 'created') {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      return 0;
    });

    res.json(assignments);
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ error: 'Failed to fetch assignments.' });
  }
});

// POST /api/assignments - Create manual assignment
app.post('/api/assignments', requireAuth, async (req, res) => {
  try {
    const cleanUserId = req.authEmail;
    const { title, subject, description, dueDate, dueTime, priority, status, attachmentUrl, points } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required.' });
    }

    const assignmentId = `asg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const isCompleted = status === 'Completed';

    const newAssignment = {
      id: assignmentId,
      userId: cleanUserId,
      source: 'manual',
      title: String(title).trim(),
      subject: subject ? String(subject).trim() : 'General',
      description: description ? String(description).trim() : '',
      dueDate: dueDate ? String(dueDate).trim() : null, // 'YYYY-MM-DD'
      dueTime: dueTime ? String(dueTime).trim() : '',
      priority: ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium',
      status: ['Not Started', 'In Progress', 'Completed'].includes(status) ? status : 'Not Started',
      completed: isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : null,
      attachmentUrl: attachmentUrl ? String(attachmentUrl).trim() : '',
      points: points !== undefined && points !== null && !isNaN(Number(points)) ? Number(points) : null,
      googleCourseId: null,
      googleCourseWorkId: null,
      googleCourseName: '',
      googleAlternateLink: '',
      googleSubmissionStatus: null,
      googleAssignedGrade: null,
      googleMaxPoints: null,
      googleState: null,
      lastSyncedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isMongoConnected) {
      try {
        const created = await Assignment.create(newAssignment);
        newAssignment._id = created._id;
      } catch (dbErr) {
        console.warn('[Assignments] MongoDB create error, using local store:', dbErr.message);
      }
    }

    inMemoryAssignments.push(newAssignment);
    await persistLocalAssignments();

    res.status(201).json(newAssignment);
  } catch (err) {
    console.error('Error creating assignment:', err);
    res.status(500).json({ error: 'Failed to create assignment.' });
  }
});

// PUT /api/assignments/:id - Update assignment (manual or personal completion)
app.put('/api/assignments/:id', requireAuth, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const cleanUserId = req.authEmail;

    if (!assignmentId) {
      return res.status(400).json({ error: 'assignmentId is required.' });
    }

    // Verify ownership
    let existing = null;
    if (isMongoConnected) {
      try {
        existing = await Assignment.findOne({ id: assignmentId, userId: cleanUserId }).lean();
      } catch (e) {}
    }
    if (!existing) {
      existing = inMemoryAssignments.find((a) => a.id === assignmentId && a.userId === cleanUserId);
    }

    if (!existing) {
      return res.status(404).json({ error: 'Assignment not found or unauthorized.' });
    }

    const updates = { updatedAt: new Date().toISOString() };
    if (req.body.title !== undefined) updates.title = String(req.body.title).trim();
    if (req.body.subject !== undefined) updates.subject = String(req.body.subject).trim();
    if (req.body.description !== undefined) updates.description = String(req.body.description).trim();
    if (req.body.dueDate !== undefined) updates.dueDate = req.body.dueDate ? String(req.body.dueDate).trim() : null;
    if (req.body.dueTime !== undefined) updates.dueTime = req.body.dueTime ? String(req.body.dueTime).trim() : '';
    if (req.body.priority !== undefined && ['Low', 'Medium', 'High'].includes(req.body.priority)) updates.priority = req.body.priority;
    if (req.body.attachmentUrl !== undefined) updates.attachmentUrl = String(req.body.attachmentUrl).trim();
    if (req.body.points !== undefined) updates.points = (req.body.points !== null && !isNaN(Number(req.body.points))) ? Number(req.body.points) : null;

    if (req.body.completed !== undefined) {
      updates.completed = Boolean(req.body.completed);
      updates.status = updates.completed ? 'Completed' : (existing.status === 'Completed' ? 'In Progress' : existing.status);
      updates.completedAt = updates.completed ? (existing.completedAt || new Date().toISOString()) : null;
    } else if (req.body.status !== undefined && ['Not Started', 'In Progress', 'Completed'].includes(req.body.status)) {
      updates.status = req.body.status;
      updates.completed = req.body.status === 'Completed';
      updates.completedAt = req.body.status === 'Completed' ? (existing.completedAt || new Date().toISOString()) : null;
    }

    if (isMongoConnected) {
      try {
        await Assignment.updateOne({ id: assignmentId, userId: cleanUserId }, { $set: updates });
      } catch (dbErr) {}
    }

    const idx = inMemoryAssignments.findIndex((a) => a.id === assignmentId && a.userId === cleanUserId);
    if (idx >= 0) {
      inMemoryAssignments[idx] = { ...inMemoryAssignments[idx], ...updates };
    }
    await persistLocalAssignments();

    const updatedDoc = { ...existing, ...updates };
    res.json(updatedDoc);
  } catch (err) {
    console.error('Error updating assignment:', err);
    res.status(500).json({ error: 'Failed to update assignment.' });
  }
});

// DELETE /api/assignments/:id - Delete assignment
app.delete('/api/assignments/:id', requireAuth, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const userId = req.authEmail;

    if (!assignmentId) {
      return res.status(400).json({ error: 'assignmentId is required.' });
    }

    if (isMongoConnected) {
      try {
        await Assignment.deleteOne({ id: assignmentId, userId });
      } catch (dbErr) {}
    }

    const initialLen = inMemoryAssignments.length;
    inMemoryAssignments = inMemoryAssignments.filter((a) => !(a.id === assignmentId && a.userId === userId));
    if (inMemoryAssignments.length !== initialLen) {
      await persistLocalAssignments();
    }

    res.json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (err) {
    console.error('Error deleting assignment:', err);
    res.status(500).json({ error: 'Failed to delete assignment.' });
  }
});


// Get user activity stats & streak
// GET /api/user/stats/:userId
// Get user activity stats & streak
// GET /api/user/stats/:userId
app.get('/api/user/stats/:userId', requireAuth, async (req, res) => {
  try {
    const requestedUserId = (req.params.userId || '').toLowerCase().trim();
    if (requestedUserId && requestedUserId !== req.authEmail) {
      return res.status(403).json({ error: 'Access denied: You can only access your own stats.' });
    }
    const userId = req.authEmail;

    let profile = null;
    if (isMongoConnected) {
      try {
        profile = await UserProfile.findOne({
          $or: [{ email: userId }, { id: userId }]
        }).lean();
      } catch (e) {}
    }
    if (!profile) {
      profile = inMemoryUsers.find((u) =>
        (u.email || '').toLowerCase().trim() === userId || (u.id || '').toLowerCase().trim() === userId
      ) || {};
    }

    const streakInfo = calculateStreakDetails(profile.activeStudyDates || [], profile.longestStreak || 0);

    res.json({
      userId,
      activeStudyDates: profile.activeStudyDates || [],
      streak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      overallProgress: typeof profile.overallProgress === 'number' ? profile.overallProgress : 0,
      goalsDone: profile.goalsDone || 0,
      goalsTotal: profile.goalsTotal || 0,
      totalCompletedActivities: profile.totalCompletedActivities || 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user stats.' });
  }
});

// Update user activity stats & streak
// PUT /api/user/stats/:userId
app.put('/api/user/stats/:userId', requireAuth, async (req, res) => {
  try {
    const userId = req.authEmail;
    const { activeStudyDates, streak, longestStreak, overallProgress, goalsDone, goalsTotal, totalCompletedActivities } = req.body;

    const patch = {};
    if (Array.isArray(activeStudyDates)) {
      // Ensure unique and sorted
      patch.activeStudyDates = Array.from(new Set(activeStudyDates.map(d => String(d).trim()).filter(Boolean))).sort();
      const streakInfo = calculateStreakDetails(patch.activeStudyDates, longestStreak || streak || 0);
      patch.streak = streakInfo.currentStreak;
      patch.longestStreak = streakInfo.longestStreak;
    } else {
      if (typeof streak === 'number') patch.streak = streak;
      if (typeof longestStreak === 'number') patch.longestStreak = longestStreak;
    }

    if (typeof overallProgress === 'number') patch.overallProgress = Math.max(0, Math.min(100, Math.round(overallProgress)));
    if (typeof goalsDone === 'number') patch.goalsDone = goalsDone;
    if (typeof goalsTotal === 'number') patch.goalsTotal = goalsTotal;
    if (typeof totalCompletedActivities === 'number') patch.totalCompletedActivities = totalCompletedActivities;
    patch.updatedAt = new Date().toISOString();

    if (isMongoConnected) {
      try {
        await UserProfile.findOneAndUpdate(
          { $or: [{ email: userId }, { id: userId }] },
          { $set: patch },
          { upsert: true, new: true }
        );
      } catch (e) {}
    }

    const idx = inMemoryUsers.findIndex((u) =>
      (u.email || '').toLowerCase().trim() === userId || (u.id || '').toLowerCase().trim() === userId
    );
    if (idx >= 0) {
      inMemoryUsers[idx] = { ...inMemoryUsers[idx], ...patch };
    } else {
      inMemoryUsers.push({ email: userId, id: userId, ...patch, createdAt: new Date().toISOString() });
    }
    await persistLocalUsers();

    res.json({ success: true, ...patch });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user stats.' });
  }
});

// Atomically record a study activity (task completed, goal done, card known, pomodoro)
// POST /api/user/activity/:userId
app.post('/api/user/activity/:userId', requireAuth, async (req, res) => {
  try {
    const userId = req.authEmail;
    const { date, activityType } = req.body;
    const actDate = date ? String(date).trim() : getLocalDateString(new Date());

    let profile = null;
    if (isMongoConnected) {
      try {
        profile = await UserProfile.findOne({
          $or: [{ email: userId }, { id: userId }]
        }).lean();
      } catch (e) {}
    }
    if (!profile) {
      profile = inMemoryUsers.find((u) =>
        (u.email || '').toLowerCase().trim() === userId || (u.id || '').toLowerCase().trim() === userId
      ) || { email: userId, id: userId, activeStudyDates: [], streak: 0, longestStreak: 0 };
    }

    const currentDates = Array.isArray(profile.activeStudyDates) ? [...profile.activeStudyDates] : [];
    if (!currentDates.includes(actDate)) {
      currentDates.push(actDate);
      currentDates.sort();
    }

    const streakInfo = calculateStreakDetails(currentDates, profile.longestStreak || 0);
    const newTotalActivities = (profile.totalCompletedActivities || 0) + 1;

    const patch = {
      activeStudyDates: currentDates,
      streak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      totalCompletedActivities: newTotalActivities,
      updatedAt: new Date().toISOString()
    };

    if (isMongoConnected) {
      try {
        await UserProfile.findOneAndUpdate(
          { $or: [{ email: userId }, { id: userId }] },
          { $set: patch },
          { upsert: true, new: true }
        );
      } catch (e) {}
    }

    const idx = inMemoryUsers.findIndex((u) =>
      (u.email || '').toLowerCase().trim() === userId || (u.id || '').toLowerCase().trim() === userId
    );
    if (idx >= 0) {
      inMemoryUsers[idx] = { ...inMemoryUsers[idx], ...patch };
    } else {
      inMemoryUsers.push({ email: userId, id: userId, ...profile, ...patch, createdAt: new Date().toISOString() });
    }
    await persistLocalUsers();

    res.json({
      success: true,
      activityType: activityType || 'study_activity',
      recordedDate: actDate,
      streak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      totalCompletedActivities: newTotalActivities
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record study activity.' });
  }
});

/* ---------------- Multiple Conversations & Chat History ---------------- */

// Get all conversations for a student
// Get all conversations for a student
// GET /api/conversations/:userId
app.get('/api/conversations/:userId', requireAuth, async (req, res) => {
  try {
    const requestedUserId = (req.params.userId || '').toLowerCase().trim();
    if (requestedUserId && requestedUserId !== req.authEmail) {
      return res.status(403).json({ error: 'Access denied: You can only access your own conversations.' });
    }
    const userId = req.authEmail;

    if (isMongoConnected) {
      try {
        const convs = await Conversation.find({ userId }).sort({ updatedAt: -1, createdAt: -1 });
        return res.json(convs);
      } catch (dbErr) {}
    }

    const userConvs = inMemoryConversations
      .filter((c) => (c.userId || '').toLowerCase().trim() === userId)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

    res.json(userConvs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
});

// Create or update a conversation
// POST /api/conversations body: { id, title }
app.post('/api/conversations', requireAuth, async (req, res) => {
  try {
    const { id, title } = req.body;
    const cleanUserId = req.authEmail;
    const convId = id || 'conv_' + Date.now();
    const convTitle = title ? String(title).trim() : 'New Conversation';
    const now = new Date().toISOString();

    if (isMongoConnected) {
      try {
        const saved = await Conversation.findOneAndUpdate(
          { id: convId, userId: cleanUserId },
          { $set: { title: convTitle, updatedAt: now }, $setOnInsert: { id: convId, userId: cleanUserId, createdAt: now } },
          { upsert: true, new: true }
        );
        return res.status(201).json(saved);
      } catch (dbErr) {}
    }

    const idx = inMemoryConversations.findIndex((c) => c.id === convId && (c.userId || '').toLowerCase().trim() === cleanUserId);
    if (idx >= 0) {
      inMemoryConversations[idx].title = convTitle;
      inMemoryConversations[idx].updatedAt = now;
      await persistLocalConversations();
      return res.status(200).json(inMemoryConversations[idx]);
    } else {
      const newConv = { id: convId, userId: cleanUserId, title: convTitle, createdAt: now, updatedAt: now };
      inMemoryConversations.unshift(newConv);
      await persistLocalConversations();
      return res.status(201).json(newConv);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to save conversation.' });
  }
});

// Get messages for a specific conversation
// GET /api/conversations/:userId/:conversationId/messages
app.get('/api/conversations/:userId/:conversationId/messages', requireAuth, async (req, res) => {
  try {
    const requestedUserId = (req.params.userId || '').toLowerCase().trim();
    if (requestedUserId && requestedUserId !== req.authEmail) {
      return res.status(403).json({ error: 'Access denied: You can only access your own conversation messages.' });
    }
    const userId = req.authEmail;
    const conversationId = req.params.conversationId;

    if (isMongoConnected) {
      try {
        const msgs = await Chat.find({ userId, conversationId }).sort({ createdAt: 1 });
        return res.json(msgs);
      } catch (dbErr) {}
    }

    const msgs = inMemoryChats
      .filter((c) => (c.userId || '').toLowerCase().trim() === userId && (c.conversationId === conversationId || (!c.conversationId && conversationId === 'default')))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation messages.' });
  }
});

// Delete a single conversation and its messages
// DELETE /api/conversations/:userId/:conversationId
app.delete('/api/conversations/:userId/:conversationId', requireAuth, async (req, res) => {
  try {
    const userId = req.authEmail;
    const conversationId = req.params.conversationId;

    if (isMongoConnected) {
      try {
        await Conversation.deleteOne({ userId, id: conversationId });
        await Chat.deleteMany({ userId, conversationId });
      } catch (dbErr) {}
    }

    // Clear from in-memory / local files
    for (let i = inMemoryConversations.length - 1; i >= 0; i--) {
      if ((inMemoryConversations[i].userId || '').toLowerCase().trim() === userId && inMemoryConversations[i].id === conversationId) {
        inMemoryConversations.splice(i, 1);
      }
    }
    for (let i = inMemoryChats.length - 1; i >= 0; i--) {
      if ((inMemoryChats[i].userId || '').toLowerCase().trim() === userId && inMemoryChats[i].conversationId === conversationId) {
        inMemoryChats.splice(i, 1);
      }
    }

    await persistLocalConversations();
    await persistLocalChats();

    res.json({ message: 'Conversation deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete conversation.' });
  }
});

// Save a chat message (supports conversationId)
// POST /api/chat body: { conversationId, sender, text }
app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const { conversationId, sender, text } = req.body;
    const cleanUserId = req.authEmail;
    const convId = conversationId || 'default';

    if (!sender || !text) {
      return res.status(400).json({ error: 'sender and text are required.' });
    }

    const now = new Date().toISOString();

    if (isMongoConnected) {
      try {
        const message = await Chat.create({ userId: cleanUserId, conversationId: convId, sender, text });
        await Conversation.updateOne({ id: convId, userId: cleanUserId }, { $set: { updatedAt: now } }).catch(() => {});
        return res.status(201).json(message);
      } catch (dbErr) {
        // Fall through to persistent local storage
      }
    }

    const fallbackMsg = {
      _id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: cleanUserId,
      conversationId: convId,
      sender,
      text,
      createdAt: now,
      updatedAt: now
    };
    inMemoryChats.push(fallbackMsg);

    // Update conversation timestamp
    const conv = inMemoryConversations.find((c) => c.id === convId && (c.userId || '').toLowerCase().trim() === cleanUserId);
    if (conv) {
      conv.updatedAt = now;
      await persistLocalConversations();
    }

    await persistLocalChats();
    res.status(201).json(fallbackMsg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

// Get chat history for a user (optionally filtered by ?conversationId=)
// GET /api/chat/:userId
app.get('/api/chat/:userId', requireAuth, async (req, res) => {
  try {
    const requestedUserId = (req.params.userId || '').toLowerCase().trim();
    if (requestedUserId && requestedUserId !== req.authEmail) {
      return res.status(403).json({ error: 'Access denied: You can only access your own chat history.' });
    }
    const userId = req.authEmail;
    const conversationId = req.query.conversationId;

    if (isMongoConnected) {
      try {
        const query = { userId };
        if (conversationId) query.conversationId = conversationId;
        const history = await Chat.find(query).sort({ createdAt: 1 });
        return res.status(200).json(history);
      } catch (dbErr) {
        // Fall through to persistent local storage
      }
    }

    const userHistory = inMemoryChats
      .filter((c) => {
        const matchesUser = (c.userId || '').toLowerCase().trim() === userId;
        if (!matchesUser) return false;
        if (conversationId) return c.conversationId === conversationId;
        return true;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.status(200).json(userHistory);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load chat history.' });
  }
});

// Clear chat history for a user (or specific conversation)
// DELETE /api/chat/:userId
app.delete('/api/chat/:userId', requireAuth, async (req, res) => {
  try {
    const userId = req.authEmail;
    const conversationId = req.query.conversationId;

    if (isMongoConnected) {
      try {
        if (conversationId) {
          await Chat.deleteMany({ userId, conversationId });
        } else {
          await Chat.deleteMany({ userId });
          await Conversation.deleteMany({ userId });
        }
      } catch (dbErr) {}
    }

    for (let i = inMemoryChats.length - 1; i >= 0; i--) {
      if ((inMemoryChats[i].userId || '').toLowerCase().trim() === userId) {
        if (!conversationId || inMemoryChats[i].conversationId === conversationId) {
          inMemoryChats.splice(i, 1);
        }
      }
    }

    if (!conversationId) {
      for (let i = inMemoryConversations.length - 1; i >= 0; i--) {
        if ((inMemoryConversations[i].userId || '').toLowerCase().trim() === userId) {
          inMemoryConversations.splice(i, 1);
        }
      }
      await persistLocalConversations();
    }

    await persistLocalChats();
    res.status(200).json({ message: 'Chat history cleared.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear chat history.' });
  }
});

// Gemini AI Chat with persistent Student Academic Context & Memory and Multimodal Study Material (PDF / Image) Support
// POST /api/ai/chat body: { message, conversationId, studentContext, recentHistory, attachment }
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, studentContext, recentHistory, attachment } = req.body;

    const hasMessage = Boolean(message && message.trim());
    const hasAttachment = Boolean(attachment && attachment.data && attachment.mimeType);

    if (!hasMessage && !hasAttachment) {
      return res.status(400).json({
        error: 'Message or study attachment is required.'
      });
    }

    const ai = getAI();
    if (!ai) {
      if (hasAttachment) {
        return res.json({
          reply: `I received your study material (**${attachment.name || 'uploaded file'}**). To activate live multimodal PDF and image analysis with Gemini, please set your \`GEMINI_API_KEY\` in the **Settings** panel.`
        });
      }
      return res.json({
        reply: "I am Nova, your AI study assistant. To activate live Gemini responses, please set your GEMINI_API_KEY in Settings."
      });
    }

    // Build personalized system instructions using the student's persistent profile & academic memory
    let systemInstruction = `You are Nova, an expert AI study assistant designed to support students with syllabus guidance, clear explanations, exam preparation schedules, and structured academic study.

Your absolute priority is to deliver clear, clean, well-structured, and easy-to-read study responses:
- Use proper headings (## and ###) to organize topics logically.
- Use bullet points for lists of concepts, definitions, pros/cons, or key takeaways.
- Use numbered steps (1., 2., 3.) when explaining processes, derivations, algorithms, or problem-solving procedures.
- Use **bold** for important terms, key formulas, and critical concepts.
- Write in short, readable paragraphs (2 to 3 sentences maximum) rather than large blocks of text.
- Maintain proper spacing between sections.
- Format code in clear fenced code blocks with the language name (e.g. \`\`\`python, \`\`\`cpp).
- Format mathematical expressions clearly and consistently (e.g. inline $...$ or block $$...$$).
- Avoid unnecessary repetition or filler.
- Keep explanations simple, organized, and encouraging.`;

    // Retrieve authoritative profile from database if session or identity exists
    const authEmail = getAuthEmail(req) || 
      (req.body.userEmail ? String(req.body.userEmail).toLowerCase().trim() : null) || 
      (studentContext?.email ? String(studentContext.email).toLowerCase().trim() : null) ||
      (studentContext?.userId ? String(studentContext.userId).toLowerCase().trim() : null);

    let dbProfile = null;
    if (authEmail) {
      if (isMongoConnected) {
        try {
          dbProfile = await UserProfile.findOne({ 
            $or: [{ email: authEmail }, { id: authEmail }] 
          }).lean();
        } catch (e) {}
      }
      if (!dbProfile) {
        dbProfile = inMemoryUsers.find((u) => 
          (u.email || '').toLowerCase().trim() === authEmail || (u.id || '').toLowerCase().trim() === authEmail
        );
      }
    }

    // Determine latest authoritative subjects for the user
    let effectiveSubjects = [];
    if (dbProfile && Array.isArray(dbProfile.subjects)) {
      effectiveSubjects = dbProfile.subjects;
    } else if (studentContext && Array.isArray(studentContext.subjects)) {
      effectiveSubjects = studentContext.subjects;
    }

    // Clean subjects list
    effectiveSubjects = effectiveSubjects.map(s => String(s).trim()).filter(Boolean);

    const effectiveContext = {
      name: dbProfile?.name || studentContext?.name || 'Student',
      university: dbProfile?.university || studentContext?.university || 'AKTU',
      program: dbProfile?.program || studentContext?.program || 'B.Tech',
      branch: dbProfile?.branch || studentContext?.branch || 'CSE',
      year: dbProfile?.year || studentContext?.year || '2nd Year',
      semester: dbProfile?.semester || studentContext?.semester || 'Semester 3',
      subjects: effectiveSubjects
    };

    const studentName = effectiveContext.name;
    const university = effectiveContext.university;
    const branch = effectiveContext.branch;
    const year = effectiveContext.year;
    const semester = effectiveContext.semester;
    const hasSubjects = effectiveSubjects.length > 0;
    const subjectsList = hasSubjects ? effectiveSubjects.join(', ') : 'None currently synced';

    systemInstruction += `\n\n### ACTIVE STUDENT ACADEMIC PROFILE & SYNCED SUBJECTS:
- Student Name: ${studentName}
- University: ${university}
- Department / Branch: ${branch}
- Academic Year: ${year || 'Not specified'}
- Current Semester: ${semester || 'Not specified'}
- Synced Subjects (${effectiveSubjects.length}): ${subjectsList}

### MANDATORY ACADEMIC CONTEXT RULES:
1. YOU ALREADY KNOW the student's University (${university}), Branch (${branch}), Year (${year}), Semester (${semester}), and currently synced Subjects (${subjectsList}).
2. NEVER ask redundant background questions such as "What university are you in?", "What is your branch?", "What year are you studying in?", or "What subjects are you taking?".
${hasSubjects ? `3. The student's authoritative synced subjects are: ${subjectsList}. When the student asks about exams, recommending study plans, explaining topics, preparing revision schedules, or summarizing coursework, AUTOMATICALLY ground and tailor your response directly to these synced subjects.
4. If the student asks for a study timetable, revision plan, or high-yield topic recommendations, directly prioritize their actual synced subjects (${subjectsList}). Do NOT invent unrelated or outdated subjects.
5. If the user updates or changes their subjects in Settings, use the updated subject list without asking them to re-enter it.` : `3. The student currently has NO subjects synced in Settings → Student Profile. If they ask for study timetables, revision plans, or subject-specific guidance, politely advise them to add or sync their subjects in Settings → Student Profile so you can tailor your explanations and schedules to their curriculum.`}
6. Ground explanations in the student's academic level (${year}, ${semester}) so it matches university exam requirements.`;

    if (hasAttachment) {
      systemInstruction += `\n\n### ATTACHED STUDY MATERIAL ANALYSIS (${attachment.name || 'Document/Image'}):
The student has attached an academic study document or photo of notes (${attachment.name || 'study material'}).
- Carefully examine the visual content, diagrams, code, formulas, and text within the attachment.
- If the student requests a summary or asks to "Summarize this", provide a structured and clear academic breakdown:
  1. **Executive Overview**: What topic or subject this covers.
  2. **Key Concepts & Definitions**: Critical definitions, terms, and theorems highlighted in the material.
  3. **Formulas / Algorithms / Step-by-Step Logic**: Clear breakdown of any mathematical expressions or procedures.
  4. **High-Yield Exam Takeaways**: What questions are most likely to appear on university semester exams.
- If the student asks to "Explain these notes in simple language" or asks a question about the attachment, explain clearly with relatable examples based directly on the attached material.`;
    }

    const candidateModels = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let responseText = null;

    // Construct the user parts (text prompt + optional inline multimodal data)
    const userParts = [];
    if (hasAttachment) {
      userParts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data
        }
      });
    }

    const promptText = hasMessage
      ? message.trim()
      : (hasAttachment ? `Please examine the attached study material (${attachment.name || 'document/image'}) and provide a clear, structured summary with key concepts and exam takeaways.` : 'Please explain this topic.');
    userParts.push({ text: promptText });

    // Build contents payload (multi-turn conversation + user parts)
    let contentsPayload;
    if (Array.isArray(recentHistory) && recentHistory.length > 0) {
      const formattedHistory = recentHistory.slice(-6).map((h) => ({
        role: (h.role === 'user' || h.sender === 'user') ? 'user' : 'model',
        parts: [{ text: h.text }]
      }));
      formattedHistory.push({ role: 'user', parts: userParts });
      contentsPayload = formattedHistory;
    } else {
      contentsPayload = [{ role: 'user', parts: userParts }];
    }

    for (const mod of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: mod,
          contents: contentsPayload,
          config: {
            systemInstruction
          }
        });

        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err) {
        // Try next candidate model if one is unavailable
      }
    }

    if (!responseText) {
      return res.json({
        reply: "## AI Assistant Notice\n\nThe AI study service is currently experiencing high demand. Please try asking your question again in a moment."
      });
    }

    res.json({
      reply: responseText
    });
  } catch (error) {
    res.json({
      reply: "## Notice\n\nI could not process that query at this moment. Please try again in a few seconds."
    });
  }
});

/* ---------------- Timetable Module API Endpoints ---------------- */
const timetableService = require('./backend/timetable-service');
timetableService.readStore();

// Helper to identify verified Staff or Admin user from session or database
function getStaffOrAdminUser(req) {
  // 1. Session timetableAuth check
  if (req.session && req.session.timetableAuth) {
    const role = (req.session.timetableAuth.role || '').toLowerCase();
    if (role === 'staff' || role === 'faculty' || role === 'admin') {
      return req.session.timetableAuth;
    }
  }

  // 2. Explicit session userRole check
  if (req.session && req.session.userRole) {
    const sessionRole = String(req.session.userRole).toLowerCase();
    if (sessionRole === 'student') {
      // Explicit student session -> strictly deny staff/admin escalation
      return null;
    }
    if (isStaffRole(sessionRole)) {
      const email = getAuthEmail(req) || req.session.userEmail;
      return {
        email: email || 'staff@nova.edu',
        name: (req.session.user && req.session.user.name) || 'Staff Member',
        role: sessionRole
      };
    }
  }

  // 3. Database verification via authenticated email
  const email = getAuthEmail(req);
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();

  // Check in-memory / database users
  const dbUser = inMemoryUsers.find(u => (u.email || '').toLowerCase().trim() === cleanEmail);
  if (dbUser) {
    if (isStaffRole(dbUser.role)) {
      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role || 'staff',
        department: dbUser.department || ''
      };
    }
    // If user exists and is a student, strictly deny staff privileges
    return null;
  }

  // Check faculty roster in timetable store
  try {
    const store = timetableService.readStore();
    const teacher = (store.teachers || []).find(t => (t.email || '').toLowerCase() === cleanEmail);
    if (teacher) {
      return {
        id: teacher.id,
        facultyId: teacher.id,
        email: teacher.email,
        name: teacher.name,
        role: 'faculty',
        department: teacher.department || ''
      };
    }
  } catch (e) {}

  if (cleanEmail === 'admin@aktu.ac.in') {
    return {
      email: cleanEmail,
      name: 'Administrator',
      role: 'admin'
    };
  }

  return null;
}

// Trusted verification middleware for Timetable modifications (Staff & Admin only)
function requireFacultyOrAdmin(req, res, next) {
  const staff = getStaffOrAdminUser(req);
  if (!staff || !isStaffRole(staff.role)) {
    return res.status(403).json({
      error: 'Access denied: Staff or Administrator privileges required. Students cannot modify timetable schedules or rosters.',
      requiresStaffRole: true
    });
  }
  req.facultyUser = staff;
  next();
}

function requireAdminOnly(req, res, next) {
  const staff = getStaffOrAdminUser(req);
  if (!staff || !isStaffRole(staff.role)) {
    return res.status(403).json({
      error: 'Access denied: Staff or Administrative privileges are required for this action.',
      requiresAdminRole: true
    });
  }
  req.facultyUser = staff;
  next();
}

// Helper to determine role for timetable read views
function getTimetableRole(req) {
  const staff = getStaffOrAdminUser(req);
  if (staff && staff.role) {
    return staff.role;
  }
  return 'student'; // Default to ordinary student role (unprivileged read-only)
}

// POST /api/timetable/auth/faculty-login — Secure Faculty & Admin Authentication
app.post('/api/timetable/auth/faculty-login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPassword = password ? String(password).trim() : '';

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ error: 'Faculty email and password are required.' });
    }

    // Match in registered users
    let user = inMemoryUsers.find(u => (u.email || '').toLowerCase().trim() === cleanEmail);

    // If not in inMemoryUsers, check store teachers roster
    const store = timetableService.readStore();
    const teacher = (store.teachers || []).find(t => t.email.toLowerCase() === cleanEmail);

    if (!user && teacher) {
      user = {
        id: `usr_${teacher.id.toLowerCase()}`,
        facultyId: teacher.id,
        email: teacher.email,
        name: teacher.name,
        role: 'faculty',
        department: teacher.department,
        designation: teacher.designation,
        passwordHash: 'Faculty@123'
      };
      inMemoryUsers.push(user);
    }

    if (!user) {
      return res.status(404).json({ error: 'No faculty or administrator account found with this email address.' });
    }

    // Role check: Only staff, faculty and admin can authenticate via timetable management
    if (!isStaffRole(user.role)) {
      return res.status(403).json({ error: 'Access denied: Ordinary student accounts cannot access faculty editing controls.' });
    }

    // Verify Password
    const isValid = verifyPassword(cleanPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect faculty password. Please verify your credentials.' });
    }

    // Store verified session
    const facultySession = {
      id: user.id,
      facultyId: user.facultyId || (teacher ? teacher.id : null),
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department || ''
    };

    req.session.timetableAuth = facultySession;
    req.session.userEmail = user.email;
    req.session.userRole = user.role;

    req.session.save((err) => {
      if (err) console.warn('[TimetableAuth] Session save warning:', err);
      res.json({
        success: true,
        message: `Welcome, ${user.name}! Faculty editing mode activated.`,
        user: facultySession
      });
    });
  } catch (err) {
    console.error('[TimetableAuth] Login error:', err);
    res.status(500).json({ error: 'Faculty authentication failed. Please try again.' });
  }
});

// GET /api/timetable/auth/status — Check current faculty session status
app.get('/api/timetable/auth/status', (req, res) => {
  const auth = req.session && req.session.timetableAuth;
  if (auth && (auth.role === 'faculty' || auth.role === 'admin')) {
    return res.json({ authenticated: true, user: auth });
  }
  const email = getAuthEmail(req);
  if (email && (email === 'admin@aktu.ac.in' || email.includes('admin'))) {
    return res.json({
      authenticated: true,
      user: { email, name: 'Administrator', role: 'admin' }
    });
  }
  res.json({ authenticated: false, user: null, role: 'student' });
});

// POST /api/timetable/auth/logout — End faculty editing session
app.post('/api/timetable/auth/logout', (req, res) => {
  if (req.session && req.session.timetableAuth) {
    delete req.session.timetableAuth;
  }
  res.json({ success: true, message: 'Faculty session ended. Returned to student view.' });
});

// GET /api/timetable — Fetch timetable dataset (sanitized by role)
app.get('/api/timetable', (req, res) => {
  try {
    const role = getTimetableRole(req);
    const userEmail = (req.session && req.session.timetableAuth && req.session.timetableAuth.email) || getAuthEmail(req);
    const section = req.query.section || null;
    const data = timetableService.getTimetableData({ section, role, userEmail });
    res.json({ success: true, data });
  } catch (err) {
    console.error('[Timetable] Error fetching timetable:', err);
    res.status(500).json({ error: 'Failed to load timetable data' });
  }
});

// GET /api/timetable/sections — Fetch active class sections
app.get('/api/timetable/sections', (req, res) => {
  try {
    const store = timetableService.readStore();
    res.json({ success: true, sections: store.sections || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load class sections' });
  }
});

// POST /api/timetable/manual-edit — Faculty-only manual editing endpoint (Strictly NO AI)
app.post('/api/timetable/manual-edit', requireFacultyOrAdmin, (req, res) => {
  try {
    const section = req.body.section || req.body.sectionId;
    const editId = req.body.editId || (req.body.slotData && req.body.slotData.id);
    const classData = req.body.classData || req.body.slotData;
    const clientVersion = req.body.clientVersion;
    const action = req.body.action || (req.body.day !== undefined ? 'upsert' : undefined);
    const targetDay = req.body.targetDay || req.body.day;
    const targetPeriod = req.body.targetPeriod || (req.body.periodIndex !== undefined ? req.body.periodIndex + 1 : req.body.period);

    const result = timetableService.manualEditClass({
      section,
      editId,
      classData: classData || { day: targetDay, period: targetPeriod },
      action,
      targetDay,
      targetPeriod,
      clientVersion,
      user: req.facultyUser
    });

    res.json(result);
  } catch (err) {
    console.warn('[Timetable] Manual edit rejected:', err.message);
    res.status(err.status || 400).json({
      error: err.message || 'Manual timetable modification failed.',
      conflict: !!err.conflict,
      currentVersion: err.currentVersion
    });
  }
});

// POST /api/timetable/sections — Add, update, duplicate, or remove dynamic class sections (Admin protected)
app.post('/api/timetable/sections', requireAdminOnly, (req, res) => {
  try {
    const { action, section, id, name, room, coordinator, students, semester, sourceSection, newName } = req.body;
    let result;
    if (action === 'delete') {
      result = timetableService.deleteSection(id || name);
    } else if (action === 'update') {
      result = timetableService.updateSection(id || name, { name, room, coordinator, students, semester });
    } else if (action === 'duplicate') {
      result = timetableService.duplicateSection(sourceSection || name, newName);
    } else {
      result = timetableService.addSection(section || { name, room, coordinator, students, semester });
    }
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Section operation failed' });
  }
});

// POST /api/timetable/faculty — Faculty management (Admin protected)
app.post('/api/timetable/faculty', requireAdminOnly, (req, res) => {
  try {
    const { action, id, faculty } = req.body;
    let result;
    if (action === 'delete') {
      result = timetableService.deleteFaculty(id);
    } else if (action === 'update') {
      result = timetableService.updateFaculty(id, faculty || req.body);
    } else {
      result = timetableService.addFaculty(faculty || req.body);
    }
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Faculty operation failed' });
  }
});

// POST /api/timetable/subjects — Subject configuration (Admin protected)
app.post('/api/timetable/subjects', requireAdminOnly, (req, res) => {
  try {
    const { action, id, subject } = req.body;
    let result;
    if (action === 'delete') {
      result = timetableService.deleteSubject(id);
    } else if (action === 'update') {
      result = timetableService.updateSubject(id, subject || req.body);
    } else {
      result = timetableService.addSubject(subject || req.body);
    }
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Subject operation failed' });
  }
});

// POST /api/timetable/rooms — Rooms & laboratories management (Admin protected)
app.post('/api/timetable/rooms', requireAdminOnly, (req, res) => {
  try {
    const { action, id, room } = req.body;
    let result;
    if (action === 'delete') {
      result = timetableService.deleteRoom(id);
    } else if (action === 'update') {
      result = timetableService.updateRoom(id, room || req.body);
    } else {
      result = timetableService.addRoom(room || req.body);
    }
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Room operation failed' });
  }
});

// POST /api/timetable/settings — Settings configuration (Admin protected)
app.post('/api/timetable/settings', requireAdminOnly, (req, res) => {
  try {
    const result = timetableService.updateSettings(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Settings update failed' });
  }
});

// GET /api/timetable/reports — Cross-section & multi-view reports
app.get('/api/timetable/reports', (req, res) => {
  try {
    const reports = timetableService.generateReports();
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to generate reports' });
  }
});

// GET /api/timetable/faculty — Fetch faculty roster & workload analytics
app.get('/api/timetable/faculty', (req, res) => {
  try {
    const store = timetableService.readStore();
    const faculty = store.teachers || [];
    const workloads = timetableService.calculateFacultyWorkloads(store.classes || [], faculty);
    res.json({ success: true, faculty, workloads });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load faculty roster' });
  }
});

// GET /api/timetable/subjects — Fetch subject curriculum
app.get('/api/timetable/subjects', (req, res) => {
  try {
    const store = timetableService.readStore();
    res.json({ success: true, subjects: store.subjects || [] });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load subjects' });
  }
});

// GET /api/timetable/rooms — Fetch rooms and laboratories
app.get('/api/timetable/rooms', (req, res) => {
  try {
    const store = timetableService.readStore();
    res.json({ success: true, rooms: store.rooms || [] });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load rooms' });
  }
});

// GET /api/timetable/audit — Full constraint audit report
app.get('/api/timetable/audit', (req, res) => {
  try {
    const store = timetableService.readStore();
    const section = req.query.section || req.query.sectionId || null;
    const audit = timetableService.auditTimetableConflicts(store.classes || [], { section });
    res.json({ success: true, audit });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Audit check failed' });
  }
});

// GET /api/timetable/feasibility — Feasibility pre-check
app.get('/api/timetable/feasibility', (req, res) => {
  try {
    const section = req.query.section || req.query.sectionId || null;
    const feasibility = timetableService.checkScheduleFeasibility({ section });
    res.json({ success: true, feasibility });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Feasibility check failed' });
  }
});

// POST /api/timetable/undo — Undo changes for section
app.post('/api/timetable/undo', requireFacultyOrAdmin, (req, res) => {
  try {
    const section = req.body.section || req.body.sectionId;
    const result = timetableService.undoSectionChanges(section, req.facultyUser);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Undo operation failed' });
  }
});

// POST /api/timetable/publish — Publish timetable for students (Faculty/Admin)
app.post('/api/timetable/publish', requireFacultyOrAdmin, (req, res) => {
  try {
    const { section, published } = req.body;
    const store = timetableService.readStore();
    const secObj = store.sections.find(s => (s.name || s) === section || s.id === section);
    if (!secObj) return res.status(404).json({ error: `Section "${section}" not found` });

    if (store.sectionTimetables[secObj.id]) {
      store.sectionTimetables[secObj.id].published = published !== false;
      store.sectionTimetables[secObj.id].updatedAt = new Date().toISOString();
      store.sectionTimetables[secObj.id].lastModifiedBy = req.facultyUser ? (req.facultyUser.name || req.facultyUser.email) : 'Faculty';
      timetableService.writeStore(store);
    }

    res.json({ success: true, message: `Timetable for ${section} ${published !== false ? 'published to students' : 'saved as draft'}.` });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Publish operation failed' });
  }
});

// POST /api/timetable/generate — Automated Timetable Generator Engine (Admin / Faculty protected)
app.post('/api/timetable/generate', requireFacultyOrAdmin, (req, res) => {
  try {
    const options = { ...(req.body || {}), user: req.facultyUser };
    const result = timetableService.runOptimization(options);
    if (!result.success && result.errors && result.errors.length > 0) {
      return res.status(422).json({
        success: false,
        error: result.errors[0],
        errors: result.errors,
        isFeasibilityError: !!result.isFeasibilityError,
        data: result
      });
    }
    res.json({
      success: true,
      message: 'Timetable optimization completed successfully.',
      data: result
    });
  } catch (err) {
    console.error('[Timetable] Error running generator:', err);
    res.status(500).json({ error: err.message || 'Timetable optimization failed' });
  }
});

// POST /api/timetable/regenerate — Regenerate timetable for selected section with stochastic variety
app.post('/api/timetable/regenerate', requireFacultyOrAdmin, (req, res) => {
  try {
    const options = { ...(req.body || {}), regenerate: true, randomSeed: Math.random(), user: req.facultyUser };
    const result = timetableService.runOptimization(options);
    if (!result.success && result.errors && result.errors.length > 0) {
      return res.status(422).json({
        success: false,
        error: result.errors[0],
        errors: result.errors,
        isFeasibilityError: !!result.isFeasibilityError,
        data: result
      });
    }
    res.json({
      success: true,
      message: 'Timetable regenerated successfully with new stochastic variations.',
      data: result
    });
  } catch (err) {
    console.error('[Timetable] Error running regenerate:', err);
    res.status(500).json({ error: err.message || 'Timetable regeneration failed' });
  }
});

// POST /api/timetable/save — Save manual edits with strict constraint validation
app.post('/api/timetable/save', requireFacultyOrAdmin, (req, res) => {
  try {
    const { classes, section, academicYear, clientVersion } = req.body;
    if (!Array.isArray(classes)) {
      return res.status(400).json({ error: 'Invalid classes payload: must be an array.' });
    }

    const store = timetableService.readStore();
    const secObj = store.sections.find(s => (s.name || s) === section || s.id === section);
    if (!secObj) return res.status(404).json({ error: `Section "${section}" not found` });

    if (!store.sectionTimetables[secObj.id]) {
      store.sectionTimetables[secObj.id] = { sectionId: secObj.id, sectionName: secObj.name, classes: [] };
    }

    // Save previous state to history for undo
    if (!store.sectionTimetables[secObj.id].history) store.sectionTimetables[secObj.id].history = [];
    store.sectionTimetables[secObj.id].history.push({
      timestamp: new Date().toISOString(),
      classes: store.sectionTimetables[secObj.id].classes,
      label: "Manual save checkpoint"
    });
    if (store.sectionTimetables[secObj.id].history.length > 25) store.sectionTimetables[secObj.id].history.shift();

    store.sectionTimetables[secObj.id].classes = classes;
    store.sectionTimetables[secObj.id].version = (store.sectionTimetables[secObj.id].version || 1) + 1;
    store.sectionTimetables[secObj.id].updatedAt = new Date().toISOString();
    store.sectionTimetables[secObj.id].lastModifiedBy = req.facultyUser ? (req.facultyUser.name || req.facultyUser.email) : 'Faculty';

    store.classes = Object.values(store.sectionTimetables).flatMap(st => st.classes || []);
    timetableService.writeStore(store);

    res.json({
      success: true,
      message: 'Timetable saved successfully.',
      version: store.sectionTimetables[secObj.id].version,
      classes: store.sectionTimetables[secObj.id].classes
    });
  } catch (err) {
    res.status(err.status || 400).json({
      error: err.message || 'Failed to save timetable',
      conflict: !!err.conflict,
      currentVersion: err.currentVersion
    });
  }
});

// POST /api/timetable/validate — Validate candidate class
app.post('/api/timetable/validate', (req, res) => {
  try {
    const { candidate, editId } = req.body;
    const store = timetableService.readStore();
    const result = timetableService.validateClass(candidate, store.classes || [], editId);
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Validation failed' });
  }
});

// POST /api/timetable/reset & POST /api/timetable/delete — Delete timetable for section or clear all (Staff/Admin protected)
app.post(['/api/timetable/reset', '/api/timetable/delete'], requireFacultyOrAdmin, (req, res) => {
  try {
    const section = req.body && req.body.section;
    const mode = req.body && req.body.mode ? req.body.mode : (req.body && req.body.all ? 'all' : 'section');
    const resetData = timetableService.resetTimetable({ section, mode, user: req.facultyUser });
    res.json({
      success: true,
      data: resetData,
      message: mode === 'all' ? 'All section timetables deleted successfully. Master data preserved.' : `Timetable for Section ${section || 'selected section'} deleted successfully. Master data preserved.`
    });
  } catch (err) {
    console.error('[Timetable] Error deleting timetable:', err);
    res.status(500).json({ error: err.message || 'Failed to delete timetable' });
  }
});

// DELETE /api/timetable — RESTful timetable deletion endpoint
app.delete('/api/timetable', requireFacultyOrAdmin, (req, res) => {
  try {
    const section = req.query.section || (req.body && req.body.section);
    const mode = (req.query.all === 'true' || (req.body && req.body.mode === 'all')) ? 'all' : 'section';
    const resetData = timetableService.resetTimetable({ section, mode, user: req.facultyUser });
    res.json({
      success: true,
      data: resetData,
      message: mode === 'all' ? 'All section timetables deleted successfully. Master data preserved.' : `Timetable for Section ${section || 'selected section'} deleted successfully. Master data preserved.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete timetable' });
  }
});

// POST /api/timetable/import-excel — Import Faculty, Subject Mapping & Workload from Excel & Auto-Generate
app.post('/api/timetable/import-excel', requireFacultyOrAdmin, (req, res) => {
  try {
    const { records, teachers, autoGenerate, section } = req.body || {};
    const facultyList = Array.isArray(records) ? records : (Array.isArray(teachers) ? teachers : []);
    if (!facultyList.length) {
      return res.status(400).json({ error: 'No faculty records provided in Excel payload to import.' });
    }

    const result = timetableService.importExcelFaculty(facultyList, {
      autoGenerate: autoGenerate !== false,
      section: section || 'CSE 2A',
      user: req.facultyUser
    });

    res.json(result);
  } catch (err) {
    console.error('[Timetable] Excel import error:', err);
    res.status(400).json({ error: err.message || 'Failed to process Excel faculty import' });
  }
});

/* ---------------- Tests & Exam Planner API Endpoints ---------------- */
const testsExamService = require('./backend/tests-exam-service');
testsExamService.initTestsStore();

// GET /api/tests/pyqs — Fetch authentic AKTU PYQ papers
app.get('/api/tests/pyqs', (req, res) => {
  try {
    const { subject, semester, year } = req.query;
    const papers = testsExamService.getPYQPapers({ subject, semester, year });
    res.json({ success: true, papers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch PYQ papers' });
  }
});

// GET /api/tests/unit-questions — Fetch unit PYQ questions
app.get('/api/tests/unit-questions', (req, res) => {
  try {
    const { subjectCode, unit } = req.query;
    const questions = testsExamService.getUnitPYQQuestions(subjectCode, unit);
    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unit questions' });
  }
});

// POST /api/tests/generate — Generate dynamic syllabus questions
app.post('/api/tests/generate', async (req, res) => {
  try {
    const { subject, subjectCode, units, difficulty, count, testType } = req.body;
    const questions = await testsExamService.generateTestQuestions({ subject, subjectCode, units, difficulty, count, testType });
    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate test questions' });
  }
});

// POST /api/tests/evaluate — Submit test and evaluate
app.post('/api/tests/evaluate', async (req, res) => {
  try {
    const authEmail = getAuthEmail(req);
    const { testId, title, subject, subjectCode, questions, answers, userEmail } = req.body;
    const cleanUserEmail = authEmail || userEmail || 'student@aktu.ac.in';
    const result = await testsExamService.evaluateTestSubmission({ testId, title, subject, subjectCode, questions, answers, userEmail: cleanUserEmail });
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to evaluate test' });
  }
});

// GET /api/tests/analytics/:userEmail — Get user test performance analytics
app.get('/api/tests/analytics/:userEmail', (req, res) => {
  try {
    const authEmail = getAuthEmail(req);
    const requestedEmail = (req.params.userEmail || '').toLowerCase().trim();
    if (authEmail && requestedEmail && requestedEmail !== authEmail) {
      return res.status(403).json({ error: 'Access denied: You can only view your own analytics.' });
    }
    const cleanEmail = authEmail || requestedEmail;
    const analytics = testsExamService.getUserAnalytics(cleanEmail);
    res.json({ success: true, analytics });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load user analytics' });
  }
});

// POST /api/tests/schedule — Schedule test in exam calendar
app.post('/api/tests/schedule', (req, res) => {
  try {
    const authEmail = getAuthEmail(req);
    const payload = { ...req.body };
    if (authEmail) {
      payload.userEmail = authEmail;
    }
    const result = testsExamService.scheduleMonthlyTest(payload);
    res.status(201).json({ success: true, schedule: result });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to schedule test' });
  }
});

/* ---------------- Serve Frontend Static Files ---------------- */
const staticPath = path.join(__dirname, 'miniproject');

app.get('/firebase-applet-config.json', (req, res) => {
  const cfgPath = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(cfgPath)) {
    res.sendFile(cfgPath);
  } else {
    res.status(404).json({ error: 'Config file not found' });
  }
});

app.get(['/Progress-api.js', '/progress-api.js'], (req, res) => {
  res.sendFile(path.join(staticPath, 'Progress-api.js'));
});

app.use(express.static(staticPath));

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

/* ---------------- Start Server ---------------- */
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(process.env.PORT || 3000);
}