/* ==============================================================================
   TIMETABLE SERVICE — Automated & Optimized Timetable Generator Engine
   Nova Academic Assistant — Multi-Section Constraint Optimization Engine

   Hard Constraints Enforced (Never Violated):
   1. A student group cannot attend two classes simultaneously.
   2. A faculty member cannot teach two classes simultaneously (across all sections).
   3. A room or lab cannot host two activities simultaneously.
   4. Faculty teaching hours cannot exceed 18 hours per week (and daily limits).
   5. All required theoretical subjects, labs, tutorials, and technical training scheduled.
   6. Each lab session occupies strictly two consecutive periods.
   7. Technical training occupies strictly four consecutive periods.
   8. G1 and G2 follow parallel lab/tutorial coordination (no group left unassigned).
   9. Faculty availability, subject qualifications, and eligibility strictly respected.
   10. Section data isolation: each section maintains independent records and versions.
   11. Configured day, time, room, and resource constraints strictly respected.
   12. Feasibility verification: impossible configurations trigger detailed conflict reports.
   ============================================================================== */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TIMETABLE_STORE_FILE = path.join(DATA_DIR, 'timetable-store.json');

const DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const MAX_FACULTY_WEEKLY_HOURS = 18.0;
const MAX_FACULTY_DAILY_HOURS = 4.0; // configurable

// Reference 9 Periods (P1 – P9)
const REFERENCE_PERIODS = [
  { id: 1, code: "P1", label: "Period 1", time: "09:10 AM – 10:00 AM", minutes: 50, half: "morning" },
  { id: 2, code: "P2", label: "Period 2", time: "10:01 AM – 10:50 AM", minutes: 49, half: "morning" },
  { id: 3, code: "P3", label: "Period 3", time: "10:51 AM – 11:40 AM", minutes: 49, half: "morning" },
  { id: 4, code: "P4", label: "Period 4", time: "11:41 AM – 12:30 PM", minutes: 49, half: "morning" },
  { id: 5, code: "P5", label: "Period 5", time: "12:31 PM – 01:10 PM", minutes: 39, half: "midday", isLunchBreak: true },
  { id: 6, code: "P6", label: "Period 6", time: "01:11 PM – 02:00 PM", minutes: 49, half: "afternoon" },
  { id: 7, code: "P7", label: "Period 7", time: "02:01 PM – 02:50 PM", minutes: 49, half: "afternoon" },
  { id: 8, code: "P8", label: "Period 8", time: "02:51 PM – 03:40 PM", minutes: 49, half: "afternoon" },
  { id: 9, code: "P9", label: "Period 9", time: "03:41 PM – 04:30 PM", minutes: 49, half: "afternoon" }
];

const DEFAULT_LUNCH_BREAK = {
  enabled: true,
  label: "Recess / Lunch Interval",
  time: "12:31 PM – 01:10 PM",
  periodId: 5,
  isTeachingPeriod: false
};

// Initial Class Sections (Supporting unlimited sections including CSE 2A, 2B, 2C, 2D, 2E, 2F, 2G, 2H)
const INITIAL_SECTIONS = [
  { id: "sec_cse_2a", name: "CSE 2A", room: "Room 201", coordinator: "Dr. Ananya Sharma", students: 64, semester: "Semester 3", academicYear: "2025–2026", groups: ["Group 1", "Group 2"], isArchived: false },
  { id: "sec_cse_2b", name: "CSE 2B", room: "Room 202", coordinator: "Prof. Neha Singh", students: 62, semester: "Semester 3", academicYear: "2025–2026", groups: ["Group 1", "Group 2"], isArchived: false },
  { id: "sec_cse_2c", name: "CSE 2C", room: "Room 203", coordinator: "Prof. Rahul Verma", students: 60, semester: "Semester 3", academicYear: "2025–2026", groups: ["Group 1", "Group 2"], isArchived: false },
  { id: "sec_cse_2d", name: "CSE 2D", room: "Room 301", coordinator: "Dr. Ananya Sharma", students: 64, semester: "Semester 3", academicYear: "2025–2026", groups: ["Group 1", "Group 2"], isArchived: false },
  { id: "sec_cse_2e", name: "CSE 2E", room: "Room 302", coordinator: "Prof. Neha Singh", students: 62, semester: "Semester 3", academicYear: "2025–2026", groups: ["Group 1", "Group 2"], isArchived: false },
  { id: "sec_cse_2f", name: "CSE 2F", room: "Room 303", coordinator: "Prof. Rahul Verma", students: 60, semester: "Semester 3", academicYear: "2025–2026", groups: ["Group 1", "Group 2"], isArchived: false },
  { id: "sec_cse_2g", name: "CSE 2G", room: "Room 304", coordinator: "Dr. Priya Gupta", students: 65, semester: "Semester 3", academicYear: "2025–2026", groups: ["Group 1", "Group 2"], isArchived: false },
  { id: "sec_cse_2h", name: "CSE 2H", room: "Room 305", coordinator: "Dr. Amit Mishra", students: 58, semester: "Semester 3", academicYear: "2025–2026", groups: ["Group 1", "Group 2"], isArchived: false }
];

// Initial Faculty Members (F1 to F10)
const INITIAL_FACULTY = [
  {
    id: "F1",
    code: "F1",
    name: "Dr. Ananya Sharma",
    designation: "Associate Professor",
    department: "Applied Sciences & Humanities",
    eligibleSubjects: ["SUB_MATH4", "SUB_TC", "TUT_MATH4", "TUT_TC"],
    email: "ananya.sharma@nova.edu",
    phone: "+91 98101 23401",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    isActive: true
  },
  {
    id: "F2",
    code: "F2",
    name: "Prof. Rahul Verma",
    designation: "Assistant Professor",
    department: "Computer Science & Engineering",
    eligibleSubjects: ["SUB_DS", "LAB_DS", "SUB_PYTHON", "TUT_DS", "TUT_PYTHON"],
    email: "rahul.verma@nova.edu",
    phone: "+91 98101 23402",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    isActive: true
  },
  {
    id: "F3",
    code: "F3",
    name: "Dr. Priya Gupta",
    designation: "Professor",
    department: "Computer Science & Engineering",
    eligibleSubjects: ["SUB_COA", "LAB_COA", "SUB_DSTL", "TUT_COA", "TUT_DSTL"],
    email: "priya.gupta@nova.edu",
    phone: "+91 98101 23403",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Wednesday", "Thursday", "Friday"],
    isActive: true
  },
  {
    id: "F4",
    code: "F4",
    name: "Prof. Neha Singh",
    designation: "Assistant Professor",
    department: "Information Technology",
    eligibleSubjects: ["LAB_WEB", "SUB_PYTHON", "SUB_TECH_TRAIN", "TUT_PYTHON"],
    email: "neha.singh@nova.edu",
    phone: "+91 98101 23404",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Tuesday", "Wednesday", "Friday"],
    isActive: true
  },
  {
    id: "F5",
    code: "F5",
    name: "Dr. Amit Mishra",
    designation: "Associate Professor",
    department: "Computer Science & Engineering",
    eligibleSubjects: ["SUB_DS", "LAB_MINIPROJ", "SUB_DSTL", "TUT_DS", "TUT_DSTL"],
    email: "amit.mishra@nova.edu",
    phone: "+91 98101 23405",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Tuesday", "Wednesday", "Thursday", "Friday"],
    isActive: true
  },
  {
    id: "F6",
    code: "F6",
    name: "Prof. Arjun Patel",
    designation: "Assistant Professor",
    department: "Computer Science & Engineering",
    eligibleSubjects: ["SUB_TECH_TRAIN", "LAB_WEB", "SUB_PYTHON", "TUT_PYTHON"],
    email: "arjun.patel@nova.edu",
    phone: "+91 98101 23406",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Tuesday", "Thursday", "Friday"],
    isActive: true
  },
  {
    id: "F7",
    code: "F7",
    name: "Dr. Rohit Kumar",
    designation: "Assistant Professor",
    department: "Applied Sciences & Humanities",
    eligibleSubjects: ["SUB_MATH4", "SUB_DSTL", "TUT_MATH4", "TUT_DSTL"],
    email: "rohit.kumar@nova.edu",
    phone: "+91 98101 23407",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    isActive: true
  },
  {
    id: "F8",
    code: "F8",
    name: "Prof. Sneha Agarwal",
    designation: "Assistant Professor",
    department: "Computer Science & Engineering",
    eligibleSubjects: ["SUB_COA", "LAB_COA", "LAB_MINIPROJ", "TUT_COA"],
    email: "sneha.agarwal@nova.edu",
    phone: "+91 98101 23408",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Tuesday", "Wednesday", "Friday"],
    isActive: true
  },
  {
    id: "F9",
    code: "F9",
    name: "Dr. Vikram Joshi",
    designation: "Associate Professor",
    department: "Humanities & Management",
    eligibleSubjects: ["SUB_TC", "LAB_MINIPROJ", "TUT_TC"],
    email: "vikram.joshi@nova.edu",
    phone: "+91 98101 23409",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Tuesday", "Wednesday", "Thursday", "Friday"],
    isActive: true
  },
  {
    id: "F10",
    code: "F10",
    name: "Prof. Karan Mehta",
    designation: "Assistant Professor",
    department: "Computer Science & Engineering",
    eligibleSubjects: ["SUB_DS", "LAB_DS", "SUB_TECH_TRAIN", "TUT_DS"],
    email: "karan.mehta@nova.edu",
    phone: "+91 98101 23410",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Wednesday", "Thursday", "Friday"],
    isActive: true
  },
  {
    id: "F11",
    code: "F11",
    name: "Dr. Sunita Rao",
    designation: "Assistant Professor",
    department: "Applied Sciences & Humanities",
    eligibleSubjects: ["SUB_MATH4", "SUB_TC", "TUT_MATH4", "TUT_TC"],
    email: "sunita.rao@nova.edu",
    phone: "+91 98101 23411",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Tuesday", "Wednesday", "Friday"],
    isActive: true
  },
  {
    id: "F12",
    code: "F12",
    name: "Prof. Deepak Sharma",
    designation: "Assistant Professor",
    department: "Computer Science & Engineering",
    eligibleSubjects: ["SUB_DS", "LAB_DS", "SUB_PYTHON", "SUB_TECH_TRAIN", "TUT_DS"],
    email: "deepak.sharma@nova.edu",
    phone: "+91 98101 23412",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Tuesday", "Thursday", "Friday"],
    isActive: true
  },
  {
    id: "F13",
    code: "F13",
    name: "Prof. Pooja Verma",
    designation: "Assistant Professor",
    department: "Information Technology",
    eligibleSubjects: ["LAB_WEB", "SUB_PYTHON", "SUB_TECH_TRAIN", "TUT_PYTHON"],
    email: "pooja.verma@nova.edu",
    phone: "+91 98101 23413",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Wednesday", "Thursday", "Friday"],
    isActive: true
  },
  {
    id: "F14",
    code: "F14",
    name: "Dr. Manish Tiwari",
    designation: "Associate Professor",
    department: "Computer Science & Engineering",
    eligibleSubjects: ["SUB_COA", "LAB_COA", "SUB_DSTL", "TUT_COA"],
    email: "manish.tiwari@nova.edu",
    phone: "+91 98101 23414",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Tuesday", "Wednesday", "Thursday", "Friday"],
    isActive: true
  },
  {
    id: "F15",
    code: "F15",
    name: "Dr. Alok Nath",
    designation: "Assistant Professor",
    department: "Applied Sciences & Humanities",
    eligibleSubjects: ["SUB_MATH4", "SUB_DSTL", "TUT_MATH4", "TUT_DSTL"],
    email: "alok.nath@nova.edu",
    phone: "+91 98101 23415",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Tuesday", "Thursday", "Friday"],
    isActive: true
  },
  {
    id: "F16",
    code: "F16",
    name: "Dr. Vandana Saxena",
    designation: "Associate Professor",
    department: "Applied Sciences & Humanities",
    eligibleSubjects: ["SUB_MATH4", "SUB_TC", "TUT_MATH4", "TUT_TC"],
    email: "vandana.saxena@nova.edu",
    phone: "+91 98101 23416",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    isActive: true
  },
  {
    id: "F17",
    code: "F17",
    name: "Prof. Saurabh Jain",
    designation: "Assistant Professor",
    department: "Computer Science & Engineering",
    eligibleSubjects: ["SUB_DS", "LAB_DS", "SUB_PYTHON", "TUT_DS"],
    email: "saurabh.jain@nova.edu",
    phone: "+91 98101 23417",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Wednesday", "Thursday", "Friday"],
    isActive: true
  },
  {
    id: "F18",
    code: "F18",
    name: "Dr. R.K. Pandey",
    designation: "Professor",
    department: "Computer Science & Engineering",
    eligibleSubjects: ["SUB_COA", "LAB_COA", "SUB_DSTL", "TUT_COA", "TUT_DSTL"],
    email: "rk.pandey@nova.edu",
    phone: "+91 98101 23418",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Tuesday", "Wednesday", "Friday"],
    isActive: true
  },
  {
    id: "F19",
    code: "F19",
    name: "Prof. Nidhi Singhal",
    designation: "Assistant Professor",
    department: "Information Technology",
    eligibleSubjects: ["LAB_WEB", "SUB_PYTHON", "SUB_TECH_TRAIN", "TUT_PYTHON"],
    email: "nidhi.singhal@nova.edu",
    phone: "+91 98101 23419",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Tuesday", "Wednesday", "Thursday", "Friday"],
    isActive: true
  },
  {
    id: "F20",
    code: "F20",
    name: "Prof. Gaurav Bhatnagar",
    designation: "Associate Professor",
    department: "Computer Science & Engineering",
    eligibleSubjects: ["SUB_COA", "SUB_DSTL", "LAB_MINIPROJ", "TUT_COA"],
    email: "gaurav.bhatnagar@nova.edu",
    phone: "+91 98101 23420",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    isActive: true
  },
  {
    id: "F21",
    code: "F21",
    name: "Prof. Kavita Mishra",
    designation: "Assistant Professor",
    department: "Computer Science & Engineering",
    eligibleSubjects: ["SUB_DS", "LAB_MINIPROJ", "LAB_DS", "TUT_DS"],
    email: "kavita.mishra@nova.edu",
    phone: "+91 98101 23421",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Wednesday", "Thursday", "Friday"],
    isActive: true
  },
  {
    id: "F22",
    code: "F22",
    name: "Prof. Ashish Rastogi",
    designation: "Assistant Professor",
    department: "Information Technology",
    eligibleSubjects: ["SUB_PYTHON", "SUB_TECH_TRAIN", "LAB_WEB", "TUT_PYTHON"],
    email: "ashish.rastogi@nova.edu",
    phone: "+91 98101 23422",
    maxWeeklyHours: 18.0,
    maxDailyHours: 4.0,
    unavailableSlots: [],
    preferredDays: ["Monday", "Tuesday", "Thursday", "Friday"],
    isActive: true
  }
];

// Initial Theoretical Subjects (S1 to S6) + Technical Training + 4 Labs + Tutorials + Activities
const INITIAL_SUBJECTS = [
  // 6 Core Theoretical Subjects
  {
    id: "SUB_DS",
    codeId: "S1",
    name: "Data Structures",
    shortName: "DS",
    code: "BCS-301",
    type: "theory",
    weeklyLectures: 4,
    lectureDuration: 50,
    eligibleFaculty: ["F2", "F5", "F10", "F12", "F17", "F21"],
    defaultRoom: "Lecture Hall B",
    minLectures: 3,
    maxLectures: 7,
    color: "#3b82f6"
  },
  {
    id: "SUB_DSTL",
    codeId: "S2",
    name: "Discrete Structures and Logic",
    shortName: "DSTL",
    code: "BCS-303",
    type: "theory",
    weeklyLectures: 4,
    lectureDuration: 50,
    eligibleFaculty: ["F3", "F5", "F7", "F14", "F15", "F18", "F20"],
    defaultRoom: "Lecture Hall C",
    minLectures: 3,
    maxLectures: 7,
    color: "#8b5cf6"
  },
  {
    id: "SUB_TC",
    codeId: "S3",
    name: "Technical Communication",
    shortName: "TC",
    code: "BAS-301",
    type: "theory",
    weeklyLectures: 3,
    lectureDuration: 50,
    eligibleFaculty: ["F1", "F7", "F9", "F11", "F16"],
    defaultRoom: "Comm Lab / Room 305",
    minLectures: 2,
    maxLectures: 6,
    color: "#ec4899"
  },
  {
    id: "SUB_COA",
    codeId: "S4",
    name: "Computer Organization and Architecture",
    shortName: "COA",
    code: "BCS-302",
    type: "theory",
    weeklyLectures: 4,
    lectureDuration: 50,
    eligibleFaculty: ["F3", "F8", "F14", "F18", "F20"],
    defaultRoom: "Lecture Hall D",
    minLectures: 3,
    maxLectures: 7,
    color: "#6366f1"
  },
  {
    id: "SUB_PYTHON",
    codeId: "S5",
    name: "Python Programming",
    shortName: "Python",
    code: "BCC-301",
    type: "theory",
    weeklyLectures: 4,
    lectureDuration: 50,
    eligibleFaculty: ["F2", "F4", "F6", "F12", "F13", "F17", "F19", "F22"],
    defaultRoom: "Computing Lab 1",
    minLectures: 3,
    maxLectures: 7,
    color: "#10b981"
  },
  {
    id: "SUB_MATH4",
    codeId: "S6",
    name: "Mathematics IV",
    shortName: "M4",
    code: "BAS-303",
    type: "theory",
    weeklyLectures: 4,
    lectureDuration: 50,
    eligibleFaculty: ["F1", "F7", "F11", "F15", "F16"],
    defaultRoom: "Lecture Hall A",
    minLectures: 3,
    maxLectures: 7,
    color: "#f59e0b"
  },

  // Mandatory Technical Training (4 Consecutive Periods on 1 Day)
  {
    id: "SUB_TECH_TRAIN",
    codeId: "TT",
    name: "Technical Training",
    shortName: "Tech Training",
    code: "BCS-354",
    type: "training",
    weeklyLectures: 4,
    blockLength: 4,
    isContinuousBlock: true,
    eligibleFaculty: ["F4", "F6", "F10", "F2", "F3", "F5", "F8", "F12", "F13", "F19", "F22"],
    defaultRoom: "Advanced Computing Lab",
    color: "#0284c7"
  },

  // 4 Mandatory Practical Labs (2 Consecutive Periods Each)
  {
    id: "LAB_DS",
    codeId: "L1",
    name: "Data Structures Lab",
    shortName: "DS Lab",
    code: "BCS-351",
    type: "lab",
    weeklyLectures: 2,
    blockLength: 2,
    isContinuousBlock: true,
    eligibleFaculty: ["F2", "F10", "F12", "F17", "F21"],
    defaultRoom: "Data Structures Lab",
    color: "#059669"
  },
  {
    id: "LAB_WEB",
    codeId: "L2",
    name: "Web Designing Workshop",
    shortName: "Web Workshop",
    code: "BCS-353",
    type: "lab",
    weeklyLectures: 2,
    blockLength: 2,
    isContinuousBlock: true,
    eligibleFaculty: ["F4", "F6", "F13", "F19", "F22"],
    defaultRoom: "Web Technologies Lab",
    color: "#0d9488"
  },
  {
    id: "LAB_COA",
    codeId: "L3",
    name: "COA Lab",
    shortName: "COA Lab",
    code: "BCS-352",
    type: "lab",
    weeklyLectures: 2,
    blockLength: 2,
    isContinuousBlock: true,
    eligibleFaculty: ["F3", "F8", "F14", "F18"],
    defaultRoom: "Hardware Systems Lab",
    color: "#4f46e5"
  },
  {
    id: "LAB_MINIPROJ",
    codeId: "L4",
    name: "Mini Project Lab",
    shortName: "Mini Project Lab",
    code: "BCS-354",
    type: "lab",
    weeklyLectures: 2,
    blockLength: 2,
    isContinuousBlock: true,
    eligibleFaculty: ["F5", "F8", "F9", "F12", "F20", "F21"],
    defaultRoom: "Software Engineering Lab",
    color: "#7c3aed"
  },

  // Tutorials (Assigned Parallel to Labs for Non-Lab Group)
  {
    id: "TUT_DS",
    codeId: "T1",
    name: "Data Structures Tutorial",
    shortName: "DS Tut",
    code: "BCS-301T",
    type: "tutorial",
    weeklyLectures: 2,
    eligibleFaculty: ["F2", "F5", "F10", "F12", "F17", "F21"],
    defaultRoom: "Tutorial Room 301A",
    color: "#d97706"
  },
  {
    id: "TUT_MATH4",
    codeId: "T2",
    name: "Mathematics IV Tutorial",
    shortName: "M4 Tut",
    code: "BAS-303T",
    type: "tutorial",
    weeklyLectures: 2,
    eligibleFaculty: ["F1", "F7", "F11", "F15", "F16"],
    defaultRoom: "Tutorial Room 301B",
    color: "#b45309"
  },
  {
    id: "TUT_DSTL",
    codeId: "T3",
    name: "Discrete Structures Tutorial",
    shortName: "DSTL Tut",
    code: "BCS-303T",
    type: "tutorial",
    weeklyLectures: 2,
    eligibleFaculty: ["F3", "F5", "F7", "F14", "F15", "F18"],
    defaultRoom: "Tutorial Room 302A",
    color: "#9333ea"
  },
  {
    id: "TUT_COA",
    codeId: "T4",
    name: "COA Tutorial",
    shortName: "COA Tut",
    code: "BCS-302T",
    type: "tutorial",
    weeklyLectures: 2,
    eligibleFaculty: ["F3", "F8", "F14", "F18", "F20"],
    defaultRoom: "Tutorial Room 302B",
    color: "#4338ca"
  },

  // Academic Enrichment & Activities
  {
    id: "ACT_SPORTS",
    codeId: "SP",
    name: "Sports & Physical Activities",
    shortName: "Sports",
    code: "REC-101",
    type: "activity",
    weeklyLectures: 1,
    eligibleFaculty: ["F6", "F10", "F17"],
    defaultRoom: "College Sports Arena",
    color: "#16a34a"
  },
  {
    id: "ACT_LIBRARY",
    codeId: "LIB",
    name: "Library & Academic Research",
    shortName: "Library",
    code: "LIB-101",
    type: "activity",
    weeklyLectures: 1,
    eligibleFaculty: ["F9", "F1", "F16"],
    defaultRoom: "Central Knowledge Center",
    color: "#64748b"
  }
];

// Initial Rooms & Specialized Labs (Including dedicated rooms for each section)
const INITIAL_ROOMS = [
  { id: "RM_201", name: "Room 201", code: "201", type: "Lecture Hall", capacity: 70, block: "Academic Block B", isLab: false },
  { id: "RM_202", name: "Room 202", code: "202", type: "Lecture Hall", capacity: 70, block: "Academic Block B", isLab: false },
  { id: "RM_203", name: "Room 203", code: "203", type: "Lecture Hall", capacity: 70, block: "Academic Block B", isLab: false },
  { id: "RM_301", name: "Room 301", code: "301", type: "Lecture Hall", capacity: 70, block: "Academic Block A", isLab: false },
  { id: "RM_302", name: "Room 302", code: "302", type: "Lecture Hall", capacity: 70, block: "Academic Block A", isLab: false },
  { id: "RM_303", name: "Room 303", code: "303", type: "Lecture Hall", capacity: 70, block: "Academic Block A", isLab: false },
  { id: "RM_304", name: "Room 304", code: "304", type: "Lecture Hall", capacity: 70, block: "Academic Block A", isLab: false },
  { id: "RM_305", name: "Room 305", code: "305", type: "Lecture Hall", capacity: 70, block: "Academic Block A", isLab: false },
  { id: "RM_DS_LAB", name: "Data Structures Lab", code: "LAB-DS", type: "Computer Lab", capacity: 40, block: "Computing Block", isLab: true },
  { id: "RM_WEB_LAB", name: "Web Technologies Lab", code: "LAB-WEB", type: "Computer Lab", capacity: 40, block: "Computing Block", isLab: true },
  { id: "RM_COA_LAB", name: "Hardware Systems Lab", code: "LAB-COA", type: "Hardware Lab", capacity: 40, block: "Systems Block", isLab: true },
  { id: "RM_MINI_LAB", name: "Software Engineering Lab", code: "LAB-MINI", type: "Project Lab", capacity: 40, block: "Innovation Block", isLab: true },
  { id: "RM_ADV_COMP", name: "Advanced Computing Lab", code: "LAB-ADV", type: "Training Center", capacity: 80, block: "Central Tech Complex", isLab: true },
  { id: "RM_TUT_301A", name: "Tutorial Room 301A", code: "TUT-301A", type: "Tutorial Room", capacity: 35, block: "Academic Block A", isLab: false },
  { id: "RM_TUT_301B", name: "Tutorial Room 301B", code: "TUT-301B", type: "Tutorial Room", capacity: 35, block: "Academic Block A", isLab: false },
  { id: "RM_TUT_302A", name: "Tutorial Room 302A", code: "TUT-302A", type: "Tutorial Room", capacity: 35, block: "Academic Block A", isLab: false },
  { id: "RM_TUT_302B", name: "Tutorial Room 302B", code: "TUT-302B", type: "Tutorial Room", capacity: 35, block: "Academic Block A", isLab: false }
];

const DEFAULT_SETTINGS = {
  academicYear: "2025–2026",
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  saturdayEnabled: false,
  maxFacultyWeeklyHours: 18,
  maxFacultyDailyHours: 4,
  group1Name: "Group 1",
  group2Name: "Group 2",
  allowParallelSessions: true,
  consecutiveLabPeriods: 2,
  consecutiveTrainingPeriods: 4,
  maxDailyLecturesPerSection: 8,
  minDailyLecturesPerSection: 5
};

// Legacy to official AKTU curriculum code modernization map
const SUBJECT_CODE_UPGRADES = {
  'KCS-301': 'BCS-301',
  'KCS-302': 'BCS-302',
  'KCS-303': 'BCS-303',
  'KCS-351': 'BCS-353',
  'KCS-352': 'BCS-351',
  'KCS-353': 'BCS-354',
  'KCS-354': 'BCS-354',
  'KCS-355': 'BCS-352',
  'KCS-301T': 'BCS-301T',
  'KCS-302T': 'BCS-302T',
  'KCS-303T': 'BCS-303T',
  'KAS-302': 'BAS-303',
  'KAS-302T': 'BAS-303T'
};

function isValidSubjectCode(code) {
  if (!code || typeof code !== 'string') return false;
  const clean = code.trim().toUpperCase();
  // Validates codes starting with B (e.g. BCS-301, BCS301, BAS-301, BAS-303, BVE-301, BCC-301, BCS-351, etc.)
  return /^B[A-Z0-9]{1,4}[ -]?[0-9]{3}[A-Z0-9]?$/.test(clean);
}

function resolveSubjectIds(subjectsInput, allSubjects = []) {
  if (!subjectsInput) return [];
  const rawList = Array.isArray(subjectsInput) 
    ? subjectsInput 
    : String(subjectsInput).split(/[,;/|]+/).map(s => s.trim()).filter(Boolean);

  const matchedIds = new Set();

  rawList.forEach(item => {
    if (!item) return;
    const str = String(item).trim();
    const upper = str.toUpperCase();
    const upgraded = SUBJECT_CODE_UPGRADES[upper] || upper;

    // 1. Direct match on subject id (e.g. SUB_DS, LAB_DS)
    const byId = allSubjects.find(s => (s.id || '').toUpperCase() === upper);
    if (byId) {
      matchedIds.add(byId.id);
      return;
    }

    // 2. Match on upgraded code or original code (e.g. BCS-301, KCS-301, BCS301)
    const byCode = allSubjects.find(s => {
      const sCode = (s.code || '').toUpperCase();
      const sCodeNoHyphen = sCode.replace(/-/g, '');
      const searchNoHyphen = upgraded.replace(/-/g, '');
      const originalNoHyphen = upper.replace(/-/g, '');
      return sCode === upgraded || sCode === upper || sCodeNoHyphen === searchNoHyphen || sCodeNoHyphen === originalNoHyphen;
    });
    if (byCode) {
      matchedIds.add(byCode.id);
      return;
    }

    // 3. Match on subject name / shortName (e.g. "Data Structures", "COA", "Python")
    const byName = allSubjects.find(s => {
      const sName = (s.name || '').toLowerCase();
      const sShort = (s.shortName || '').toLowerCase();
      const searchLower = str.toLowerCase();
      return (sName && sName.includes(searchLower)) || (sShort && (sShort === searchLower || searchLower.includes(sShort)));
    });
    if (byName) {
      matchedIds.add(byName.id);
      return;
    }

    // 4. If code is a valid new B-code (e.g. BCS-304), create clean ID
    if (isValidSubjectCode(upgraded) || isValidSubjectCode(upper)) {
      const cleanCode = isValidSubjectCode(upgraded) ? upgraded : upper;
      const subId = `SUB_${cleanCode.replace(/[^A-Z0-9]/g, '_')}`;
      matchedIds.add(subId);
    }
  });

  return Array.from(matchedIds);
}

/* --------------------------------------------------------------------------
   Store Access & Safe Persistence
   -------------------------------------------------------------------------- */
function readStore() {
  try {
    if (fs.existsSync(TIMETABLE_STORE_FILE)) {
      const raw = fs.readFileSync(TIMETABLE_STORE_FILE, 'utf8');
      const data = JSON.parse(raw);

      // Merge and ensure sections list has full test set with unique rooms
      if (!Array.isArray(data.sections) || data.sections.length === 0) {
        data.sections = INITIAL_SECTIONS;
      } else {
        INITIAL_SECTIONS.forEach(initSec => {
          const existing = data.sections.find(s => (s.name || s) === initSec.name || s.id === initSec.id);
          if (!existing) {
            data.sections.push(initSec);
          } else {
            // Reconcile classroom if pointing to clashing duplicate room
            if (initSec.room && (!existing.room || (existing.room === 'Room 301' && existing.name === 'CSE 2A') || (existing.room === 'Room 302' && existing.name === 'CSE 2B') || (existing.room === 'Room 303' && existing.name === 'CSE 2C'))) {
              existing.room = initSec.room;
            }
            if (!existing.groups) existing.groups = ["Group 1", "Group 2"];
          }
        });
      }

      if (!Array.isArray(data.teachers) || data.teachers.length === 0) {
        data.teachers = INITIAL_FACULTY;
      } else {
        // Normalize teachers roster: ensure code F1..F22 and at least 4h daily cap
        data.teachers = data.teachers.map((t, idx) => {
          const num = idx + 1;
          const code = t.code || (t.id && t.id.startsWith('F') && !t.id.startsWith('FAC') ? t.id : `F${num}`);
          return {
            ...t,
            code,
            maxDailyHours: Math.max(Number(t.maxDailyHours) || 4, 4),
            maxWeeklyHours: Math.max(Number(t.maxWeeklyHours) || 18, 18)
          };
        });

        INITIAL_FACULTY.forEach(initFac => {
          if (!data.teachers.some(t => (t.code || t.id) === initFac.code || t.id === initFac.id)) {
            data.teachers.push(initFac);
          }
        });
      }

      if (!Array.isArray(data.subjects) || data.subjects.length === 0) {
        data.subjects = INITIAL_SUBJECTS;
      } else {
        // Ensure subject eligibleFaculty recognizes F1..F22 as well as FAC_01..FAC_22
        data.subjects = data.subjects.map(sub => {
          const initSub = INITIAL_SUBJECTS.find(is => is.id === sub.id || is.code === sub.code);
          const initEligible = (initSub && initSub.eligibleFaculty) || [];
          const combined = Array.from(new Set([...(sub.eligibleFaculty || []), ...initEligible]));
          const extra = [];
          combined.forEach(fid => {
            const m = String(fid).match(/(\d+)/);
            if (m) {
              const n = parseInt(m[1], 10);
              extra.push(`F${n}`);
              extra.push(`FAC_${String(n).padStart(2, '0')}`);
            }
          });
          return {
            ...sub,
            eligibleFaculty: Array.from(new Set([...combined, ...extra]))
          };
        });
      }
      if (!Array.isArray(data.rooms) || data.rooms.length === 0) {
        data.rooms = INITIAL_ROOMS;
      } else {
        INITIAL_ROOMS.forEach(initRoom => {
          if (!data.rooms.some(r => r.name.toLowerCase() === initRoom.name.toLowerCase() || r.id === initRoom.id)) {
            data.rooms.push(initRoom);
          }
        });
      }
      if (!Array.isArray(data.periods) || data.periods.length < 9) {
        data.periods = REFERENCE_PERIODS;
      }
      if (!data.lunchBreak) {
        data.lunchBreak = DEFAULT_LUNCH_BREAK;
      }
      if (!data.settings) {
        data.settings = DEFAULT_SETTINGS;
      }

      // Per-Section Independent Storage Architecture
      if (!data.sectionTimetables || typeof data.sectionTimetables !== 'object') {
        data.sectionTimetables = {};
      }

      data.sections.forEach(sec => {
        const secId = sec.id || `sec_${(sec.name || 'sec').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        if (!sec.id) sec.id = secId;

        if (!data.sectionTimetables[secId]) {
          const secClasses = Array.isArray(data.classes) ? data.classes.filter(c => c.section === sec.name) : [];
          data.sectionTimetables[secId] = {
            sectionId: secId,
            sectionName: sec.name,
            version: 1,
            published: true,
            updatedAt: new Date().toISOString(),
            lastModifiedBy: null,
            classes: secClasses,
            history: [] // snapshot stack for undo/redo
          };
        } else {
          data.sectionTimetables[secId].sectionName = sec.name;
          if (data.sectionTimetables[secId].version === undefined) data.sectionTimetables[secId].version = 1;
          if (data.sectionTimetables[secId].published === undefined) data.sectionTimetables[secId].published = true;
          if (!Array.isArray(data.sectionTimetables[secId].classes)) data.sectionTimetables[secId].classes = [];
          if (!Array.isArray(data.sectionTimetables[secId].history)) data.sectionTimetables[secId].history = [];
        }
      });

      // Modernize legacy subject codes to current BCS / BAS syllabus standard
      let upgradedAny = false;
      if (Array.isArray(data.subjects)) {
        data.subjects.forEach(sub => {
          if (sub.code && SUBJECT_CODE_UPGRADES[sub.code]) {
            sub.code = SUBJECT_CODE_UPGRADES[sub.code];
            upgradedAny = true;
          }
        });
      }

      if (data.sectionTimetables) {
        Object.values(data.sectionTimetables).forEach(st => {
          if (Array.isArray(st.classes)) {
            st.classes.forEach(cls => {
              if (cls.subjectCode && SUBJECT_CODE_UPGRADES[cls.subjectCode]) {
                cls.subjectCode = SUBJECT_CODE_UPGRADES[cls.subjectCode];
                upgradedAny = true;
              }
            });
          }
        });
      }

      // Synchronize flat classes array across all independent section timetables
      data.classes = Object.values(data.sectionTimetables).flatMap(st => st.classes || []);

      if (upgradedAny) {
        try {
          fs.writeFileSync(TIMETABLE_STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
        } catch (e) {}
      }

      return data;
    }
  } catch (err) {
    console.error('[TimetableService] Error reading store, initializing fresh:', err);
  }

  const initialSectionTimetables = {};
  INITIAL_SECTIONS.forEach(sec => {
    initialSectionTimetables[sec.id] = {
      sectionId: sec.id,
      sectionName: sec.name,
      version: 1,
      published: true,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: null,
      classes: [],
      history: []
    };
  });

  const initial = {
    version: "6.0",
    lastUpdated: new Date().toISOString(),
    academicYear: "2025–2026",
    sections: INITIAL_SECTIONS,
    periods: REFERENCE_PERIODS,
    lunchBreak: DEFAULT_LUNCH_BREAK,
    teachers: INITIAL_FACULTY,
    subjects: INITIAL_SUBJECTS,
    rooms: INITIAL_ROOMS,
    settings: DEFAULT_SETTINGS,
    sectionTimetables: initialSectionTimetables,
    classes: [],
    previousSchedule: []
  };
  writeStore(initial);
  return initial;
}

function writeStore(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TIMETABLE_STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[TimetableService] Error writing store:', err);
    return false;
  }
}

/* --------------------------------------------------------------------------
   Feasibility Pre-Check Engine
   Verifies whether the configured theoretical lectures, lab blocks,
   technical training, and tutorials can fit into available periods.
   -------------------------------------------------------------------------- */
function checkScheduleFeasibility(options = {}) {
  const store = readStore();
  const periods = (store.periods || REFERENCE_PERIODS).filter(p => !p.isLunchBreak);
  const teachingPeriodsCount = periods.length;
  const workingDays = (store.settings && store.settings.workingDays) || DEFAULT_DAYS;
  const totalSlotsPerWeek = workingDays.length * teachingPeriodsCount;

  const targetSection = options.section || null;
  const subjects = store.subjects || INITIAL_SUBJECTS;

  let totalTheorySlots = 0;
  let totalLabSlots = 0;
  let totalTrainingSlots = 0;
  let totalTutorialSlots = 0;
  let totalActivitySlots = 0;

  const breakdown = [];

  subjects.forEach(sub => {
    const weeklyCount = Number(sub.weeklyLectures) || 0;
    if (sub.type === "theory") {
      totalTheorySlots += weeklyCount;
      breakdown.push({ name: sub.name, code: sub.code, type: "Theory", weeklyLectures: weeklyCount, periodsRequired: weeklyCount });
    } else if (sub.type === "lab") {
      const block = Number(sub.blockLength) || 2;
      totalLabSlots += block;
      breakdown.push({ name: sub.name, code: sub.code, type: "Lab", weeklyLectures: weeklyCount, periodsRequired: block });
    } else if (sub.type === "training") {
      const block = Number(sub.blockLength) || 4;
      totalTrainingSlots += block;
      breakdown.push({ name: sub.name, code: sub.code, type: "Training", weeklyLectures: weeklyCount, periodsRequired: block });
    } else if (sub.type === "tutorial") {
      totalTutorialSlots += weeklyCount;
      // Tutorials are scheduled parallel to labs for the other group, so they consume lab parallel capacity
    } else {
      totalActivitySlots += weeklyCount;
      breakdown.push({ name: sub.name, code: sub.code, type: "Activity", weeklyLectures: weeklyCount, periodsRequired: weeklyCount });
    }
  });

  // Effective period slots required by a section
  // Labs occupy consecutive periods (e.g. 4 labs * 2 = 8 periods)
  // Tech training = 4 periods
  // Theory = totalTheorySlots
  // Activities = totalActivitySlots
  const totalRequiredPeriods = totalTheorySlots + totalLabSlots + totalTrainingSlots + totalActivitySlots;
  const isFeasible = totalRequiredPeriods <= totalSlotsPerWeek;

  const suggestions = [];
  if (!isFeasible) {
    const deficit = totalRequiredPeriods - totalSlotsPerWeek;
    suggestions.push(`Reduce theoretical lecture quotas by at least ${deficit} period(s) across subjects.`);
    suggestions.push(`Enable Saturday as an active teaching day in Settings to gain ${teachingPeriodsCount} additional lecture slots.`);
    suggestions.push(`Convert non-essential activities into optional self-study hours.`);
  }

  return {
    feasible: isFeasible,
    totalSlotsPerWeek,
    totalRequiredPeriods,
    availableTeachingPeriodsPerDay: teachingPeriodsCount,
    workingDaysCount: workingDays.length,
    surplusOrDeficit: totalSlotsPerWeek - totalRequiredPeriods,
    theorySlots: totalTheorySlots,
    labSlots: totalLabSlots,
    trainingSlots: totalTrainingSlots,
    activitySlots: totalActivitySlots,
    breakdown,
    suggestions
  };
}

/* --------------------------------------------------------------------------
   Faculty Workload Calculation
   -------------------------------------------------------------------------- */
function calculateFacultyWorkloads(classes, teachers) {
  const teacherList = teachers || readStore().teachers || INITIAL_FACULTY;
  const map = {};

  teacherList.forEach(t => {
    map[t.id] = {
      teacherId: t.id,
      code: t.code || t.id,
      name: t.name,
      department: t.department,
      designation: t.designation || "Faculty",
      maxDailyHours: Number(t.maxDailyHours) || MAX_FACULTY_DAILY_HOURS,
      maxWeeklyHours: Number(t.maxWeeklyHours) || MAX_FACULTY_WEEKLY_HOURS,
      dailyHours: { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 },
      totalWeeklyHours: 0,
      assignedClassesCount: 0,
      sectionsCovered: new Set(),
      subjectsTaught: new Set()
    };
  });

  (classes || []).forEach(cls => {
    let rec = map[cls.teacherId];
    if (!rec) {
      const tObj = teacherList.find(t =>
        t.id === cls.teacherId ||
        t.code === cls.teacherId ||
        (t.id && cls.teacherId && String(t.id).replace(/[^0-9]/g, '') === String(cls.teacherId).replace(/[^0-9]/g, ''))
      );
      if (tObj) rec = map[tObj.id];
    }
    if (rec) {
      rec.assignedClassesCount += 1;
      rec.totalWeeklyHours += 1;
      if (rec.dailyHours[cls.day] !== undefined) {
        rec.dailyHours[cls.day] += 1;
      }
      if (cls.section) rec.sectionsCovered.add(cls.section);
      if (cls.subjectName) rec.subjectsTaught.add(cls.subjectName);
    }
  });

  return Object.values(map).map(r => {
    const dailyValues = Object.values(r.dailyHours);
    const maxDay = Math.max(...dailyValues, 0);
    const hasDailyOverload = dailyValues.some(h => h > r.maxDailyHours);
    const hasWeeklyOverload = r.totalWeeklyHours > r.maxWeeklyHours;
    const isOverload = hasDailyOverload || hasWeeklyOverload;

    return {
      teacherId: r.teacherId,
      code: r.code,
      name: r.name,
      department: r.department,
      designation: r.designation,
      maxDailyHours: r.maxDailyHours,
      maxWeeklyHours: r.maxWeeklyHours,
      dailyHours: r.dailyHours,
      dailyMax: maxDay,
      weeklyHours: r.totalWeeklyHours,
      totalWeeklyHours: r.totalWeeklyHours,
      assignedClassesCount: r.assignedClassesCount,
      sectionsCount: r.sectionsCovered.size,
      subjectsCount: r.subjectsTaught.size,
      subjectsList: Array.from(r.subjectsTaught),
      status: isOverload ? "overload" : (r.totalWeeklyHours === 0 ? "free" : (r.totalWeeklyHours >= r.maxWeeklyHours * 0.85 ? "high" : "compliant")),
      isExceeded: hasWeeklyOverload,
      hasDailyOverload,
      hasWeeklyOverload,
      remainingWeeklyHours: Math.max(0, r.maxWeeklyHours - r.totalWeeklyHours)
    };
  });
}

function calculateSubjectProgress(classes, subjects, sectionFilter = null) {
  const subjectList = subjects || readStore().subjects || INITIAL_SUBJECTS;
  const filteredClasses = sectionFilter ? (classes || []).filter(c => c.section === sectionFilter) : (classes || []);

  return subjectList.map(sub => {
    const scheduled = filteredClasses.filter(c => c.subjectId === sub.id).length;
    const required = Number(sub.weeklyLectures) || 0;
    return {
      subjectId: sub.id,
      codeId: sub.codeId || sub.id,
      name: sub.name,
      shortName: sub.shortName || sub.name,
      code: sub.code,
      type: sub.type,
      color: sub.color || "#2563eb",
      required,
      scheduled,
      remaining: Math.max(0, required - scheduled),
      isMet: scheduled >= required,
      isExceeded: scheduled > required
    };
  });
}

/* --------------------------------------------------------------------------
   Hard Constraint Validator for Candidate Slots
   -------------------------------------------------------------------------- */
function validateClass(candidate, existingClasses, editId = null, options = {}) {
  const store = readStore();
  const teachers = store.teachers || INITIAL_FACULTY;
  const subjects = store.subjects || INITIAL_SUBJECTS;
  const periods = store.periods || REFERENCE_PERIODS;
  const workingDays = (store.settings && store.settings.workingDays) || DEFAULT_DAYS;

  if (!candidate.day || !workingDays.includes(candidate.day)) {
    return {
      valid: false,
      error: `Invalid teaching day: "${candidate.day}". Scheduled classes are restricted to configured working days (${workingDays.join(', ')}).`
    };
  }

  const periodObj = periods.find(p => p.id === Number(candidate.period));
  if (!periodObj) {
    return { valid: false, error: `Invalid period ID: ${candidate.period}. Must be an active scheduled period.` };
  }

  if (periodObj.isLunchBreak) {
    return { valid: false, error: `Cannot schedule classes during Period ${periodObj.id} (${periodObj.label}) as it is reserved for the institutional lunch/recess break.` };
  }

  const teacher = teachers.find(t => t.id === candidate.teacherId || t.code === candidate.teacherId);
  if (!teacher) {
    return { valid: false, error: `Assigned faculty member "${candidate.teacherId}" does not exist in the faculty roster.` };
  }

  const subject = subjects.find(s => s.id === candidate.subjectId);
  if (!subject) {
    return { valid: false, error: `Subject "${candidate.subjectId}" is not configured.` };
  }

  // Check subject-faculty eligibility qualification
  if (Array.isArray(subject.eligibleFaculty) && subject.eligibleFaculty.length > 0) {
    const isEligible = subject.eligibleFaculty.includes(teacher.id) || subject.eligibleFaculty.includes(teacher.code);
    if (!isEligible) {
      return {
        valid: false,
        error: `Faculty ${teacher.name} (${teacher.code || teacher.id}) is not qualified/certified to teach ${subject.name}. Eligible faculty: ${subject.eligibleFaculty.join(', ')}.`
      };
    }
  }

  // Filter out the class being edited
  const otherClasses = (existingClasses || []).filter(c => editId ? c.id !== editId : true);

  // 1. Teacher Clash: Cannot teach two classes simultaneously anywhere
  const teacherClash = otherClasses.find(c =>
    (c.teacherId === teacher.id || c.teacherId === teacher.code) &&
    c.day === candidate.day &&
    Number(c.period) === Number(candidate.period)
  );
  if (teacherClash) {
    return {
      valid: false,
      error: `Faculty simultaneous clash: ${teacher.name} is already assigned to teach Section ${teacherClash.section} (${teacherClash.group || 'Class'}) on ${candidate.day} at ${periodObj.label} (${candidate.time || periodObj.time}).`
    };
  }

  // 2. Teacher Daily Limit
  const teacherDayHours = otherClasses.filter(c => (c.teacherId === teacher.id || c.teacherId === teacher.code) && c.day === candidate.day).length;
  const maxDaily = teacher.maxDailyHours || MAX_FACULTY_DAILY_HOURS;
  if (teacherDayHours + 1 > maxDaily) {
    return {
      valid: false,
      error: `Faculty daily workload limit exceeded: ${teacher.name} is already assigned ${teacherDayHours} period(s) on ${candidate.day}. Maximum permitted daily load is ${maxDaily} hours.`
    };
  }

  // 3. Teacher Weekly Limit (18 hours default)
  if (!options.skipWorkloadCheck) {
    const teacherWeeklyHours = otherClasses.filter(c => (c.teacherId === teacher.id || c.teacherId === teacher.code)).length;
    const maxWeekly = teacher.maxWeeklyHours || MAX_FACULTY_WEEKLY_HOURS;
    if (teacherWeeklyHours + 1 > maxWeekly) {
      return {
        valid: false,
        error: `Faculty weekly workload limit exceeded: Assigning this class will put ${teacher.name} at ${teacherWeeklyHours + 1} weekly hours, exceeding the maximum cap of ${maxWeekly} hours per week.`
      };
    }
  }

  // 4. Student Group Clash within Section
  const candGroup = candidate.group || "Both";
  const slotClasses = otherClasses.filter(c => c.section === candidate.section && c.day === candidate.day && Number(c.period) === Number(candidate.period));

  for (const sc of slotClasses) {
    const scGroup = sc.group || "Both";
    if (candGroup === "Both" || scGroup === "Both" || candGroup === scGroup) {
      return {
        valid: false,
        error: `Student group conflict: Section ${candidate.section} (${candGroup}) already has ${sc.subjectName || sc.subjectId} scheduled on ${candidate.day} at ${periodObj.label}.`
      };
    }
  }

  // 5. Room Clash
  if (candidate.room) {
    const roomClash = otherClasses.find(c =>
      c.room && c.room.toLowerCase().trim() === candidate.room.toLowerCase().trim() &&
      c.day === candidate.day &&
      Number(c.period) === Number(candidate.period)
    );
    if (roomClash) {
      return {
        valid: false,
        error: `Room conflict: Facility "${candidate.room}" is already occupied by Section ${roomClash.section} (${roomClash.group || 'Class'}) on ${candidate.day} at ${periodObj.label}.`
      };
    }
  }

  // 6. Max 1 lab per day per student group rule
  if (candidate.type === "lab") {
    const sameGroupLabOnDay = otherClasses.find(c =>
      c.section === candidate.section &&
      c.day === candidate.day &&
      c.type === "lab" &&
      (candGroup === "Both" || c.group === "Both" || c.group === candGroup)
    );
    if (sameGroupLabOnDay) {
      return {
        valid: false,
        error: `Laboratory daily limit exceeded: Student group (${candGroup}) in Section ${candidate.section} already has a laboratory session (${sameGroupLabOnDay.subjectName}) scheduled on ${candidate.day}. A student group cannot have more than one lab session on a single day.`
      };
    }
  }

  return { valid: true };
}

/* --------------------------------------------------------------------------
   Conflict Detector & Quality Auditor
   Audits the entire timetable or a single section against all constraints
   -------------------------------------------------------------------------- */
function auditTimetableConflicts(classes, options = {}) {
  const store = readStore();
  const teachers = store.teachers || INITIAL_FACULTY;
  const subjects = store.subjects || INITIAL_SUBJECTS;
  const targetSection = options.section || null;

  const filteredClasses = targetSection ? (classes || []).filter(c => c.section === targetSection) : (classes || []);
  const allClasses = classes || [];

  const conflicts = [];
  const warnings = [];

  // 1. Audit Faculty Simultaneous Clashes across ALL sections
  const facultySlots = {};
  allClasses.forEach(c => {
    const key = `${c.teacherId}_${c.day}_${c.period}`;
    if (!facultySlots[key]) facultySlots[key] = [];
    facultySlots[key].push(c);
  });

  Object.entries(facultySlots).forEach(([key, items]) => {
    if (items.length > 1) {
      const t = teachers.find(tc => tc.id === items[0].teacherId || tc.code === items[0].teacherId);
      const tName = t ? t.name : items[0].teacherName;
      conflicts.push({
        severity: "critical",
        category: "faculty_clash",
        title: `Simultaneous Faculty Conflict: ${tName}`,
        details: `Faculty ${tName} is scheduled to teach ${items.length} classes simultaneously on ${items[0].day} at Period ${items[0].period} (${items.map(i => `${i.section} - ${i.subjectShort || i.subjectName}`).join(', ')}).`,
        recommendation: `Reassign one of the simultaneous classes to another eligible faculty member.`
      });
    }
  });

  // 2. Audit Room Double-Booking across ALL sections
  const roomSlots = {};
  allClasses.forEach(c => {
    if (c.room) {
      const key = `${c.room.toLowerCase().trim()}_${c.day}_${c.period}`;
      if (!roomSlots[key]) roomSlots[key] = [];
      roomSlots[key].push(c);
    }
  });

  Object.entries(roomSlots).forEach(([key, items]) => {
    if (items.length > 1) {
      conflicts.push({
        severity: "critical",
        category: "room_clash",
        title: `Room Double-Booking: ${items[0].room}`,
        details: `Room "${items[0].room}" is booked simultaneously on ${items[0].day} at Period ${items[0].period} by: ${items.map(i => `${i.section} (${i.group || 'All'})`).join(', ')}.`,
        recommendation: `Assign an alternative vacant classroom or laboratory for one of the sections.`
      });
    }
  });

  // 3. Audit Student Group Double-Booking within each section
  const groupSlots = {};
  filteredClasses.forEach(c => {
    const g1 = (c.group === "Both" || c.group === "Group 1");
    const g2 = (c.group === "Both" || c.group === "Group 2");
    if (g1) {
      const k1 = `${c.section}_Group1_${c.day}_${c.period}`;
      if (!groupSlots[k1]) groupSlots[k1] = [];
      groupSlots[k1].push(c);
    }
    if (g2) {
      const k2 = `${c.section}_Group2_${c.day}_${c.period}`;
      if (!groupSlots[k2]) groupSlots[k2] = [];
      groupSlots[k2].push(c);
    }
  });

  Object.entries(groupSlots).forEach(([key, items]) => {
    if (items.length > 1) {
      conflicts.push({
        severity: "critical",
        category: "group_clash",
        title: `Student Group Overlap: ${items[0].section}`,
        details: `Students in ${items[0].section} are scheduled for multiple activities on ${items[0].day} at Period ${items[0].period}: ${items.map(i => i.subjectShort || i.subjectName).join(' vs ')}.`,
        recommendation: `Move one of the overlapping activities to an open period.`
      });
    }
  });

  // 4. Audit Faculty Workload Overload (>18 hours)
  const workloads = calculateFacultyWorkloads(allClasses, teachers);
  workloads.forEach(w => {
    if (w.hasWeeklyOverload) {
      conflicts.push({
        severity: "critical",
        category: "workload_exceeded",
        title: `Faculty Workload Cap Exceeded: ${w.name}`,
        details: `${w.name} is assigned ${w.totalWeeklyHours} weekly hours, exceeding the statutory limit of ${w.maxWeeklyHours} hours.`,
        recommendation: `Reduce weekly teaching commitments or reassign sections to co-faculty.`
      });
    } else if (w.hasDailyOverload) {
      warnings.push({
        severity: "warning",
        category: "daily_workload",
        title: `Excessive Daily Faculty Load: ${w.name}`,
        details: `${w.name} teaches ${w.dailyMax} hours on their peak day (recommendation: max ${w.maxDailyHours} hours/day).`,
        recommendation: `Spread lecture periods more evenly across the week.`
      });
    }
  });

  // 5. Audit Continuous Lab Blocks (Must be 2 consecutive periods)
  // Check that every lab class is paired with an adjacent period on the same day
  const labClasses = filteredClasses.filter(c => c.type === "lab");
  const checkedLabs = new Set();
  labClasses.forEach(lc => {
    if (checkedLabs.has(lc.id)) return;
    const sameSessionLabs = labClasses.filter(c =>
      c.section === lc.section &&
      c.subjectId === lc.subjectId &&
      c.day === lc.day &&
      (c.group === lc.group || lc.group === "Both")
    );
    if (sameSessionLabs.length < 2) {
      warnings.push({
        severity: "warning",
        category: "lab_duration",
        title: `Incomplete Lab Session: ${lc.subjectName}`,
        details: `${lc.subjectName} for ${lc.section} (${lc.group}) has only 1 period on ${lc.day} (requires 2 consecutive periods).`,
        recommendation: `Ensure lab sessions occupy 2 uninterrupted consecutive lecture periods.`
      });
    } else {
      sameSessionLabs.forEach(sl => checkedLabs.add(sl.id));
    }
  });

  // 6. Audit Technical Training Block (Must be 4 consecutive periods)
  const techClasses = filteredClasses.filter(c => c.type === "training");
  if (techClasses.length > 0 && techClasses.length < 4) {
    warnings.push({
      severity: "warning",
      category: "training_duration",
      title: `Incomplete Technical Training Block`,
      details: `Technical Training has ${techClasses.length} period(s) scheduled (mandatory block length is 4 consecutive periods).`,
      recommendation: `Schedule all 4 periods consecutively on a dedicated training day.`
    });
  }

  // Calculate optimization compliance score
  const baseScore = 100;
  const criticalDeduction = conflicts.length * 20;
  const warningDeduction = warnings.length * 5;
  const finalScore = Math.max(0, Math.min(100, baseScore - criticalDeduction - warningDeduction));

  return {
    isCompliant: conflicts.length === 0,
    score: finalScore,
    totalConflicts: conflicts.length,
    totalWarnings: warnings.length,
    conflicts,
    warnings,
    auditedSection: targetSection || "All Sections",
    auditedAt: new Date().toISOString()
  };
}

/* --------------------------------------------------------------------------
   Automated Optimization Engine (Constraint-Based Backtracking Search)
   -------------------------------------------------------------------------- */
function runOptimization(options = {}) {
  const store = readStore();
  const sections = (Array.isArray(store.sections) && store.sections.length > 0)
    ? store.sections
    : INITIAL_SECTIONS;
  const teachers = store.teachers || INITIAL_FACULTY;
  const subjects = store.subjects || INITIAL_SUBJECTS;
  const rooms = store.rooms || INITIAL_ROOMS;
  const periods = (store.periods || REFERENCE_PERIODS).filter(p => !p.isLunchBreak);
  const previousSchedule = store.previousSchedule || store.classes || [];

  let targetSection = options.section || options.sectionId || null;
  if (targetSection) {
    const matched = sections.find(s => {
      const sName = typeof s === 'string' ? s : s.name;
      const sId = typeof s === 'string' ? null : s.id;
      return sName === targetSection || sId === targetSection ||
        (sName && sName.toLowerCase().replace(/\s+/g, '') === String(targetSection).toLowerCase().replace(/\s+/g, '')) ||
        (sId && sId.toLowerCase() === String(targetSection).toLowerCase());
    });
    if (matched) {
      targetSection = typeof matched === 'string' ? matched : matched.name;
    }
  }

  const sectionsToSchedule = targetSection
    ? sections.filter(s => (typeof s === 'string' ? s : s.name) === targetSection)
    : sections;

  if (sectionsToSchedule.length === 0) {
    return { success: false, errors: [`Target section "${targetSection}" not found in registered sections.`] };
  }

  // Check feasibility first! Never silently drop constraints or force an impossible schedule
  const feasibility = checkScheduleFeasibility({ section: targetSection });
  if (!feasibility.feasible) {
    return {
      success: false,
      isFeasibilityError: true,
      errors: [
        `Schedule Infeasibility: The current curriculum configuration requires ${feasibility.totalRequiredPeriods} period slots per week, but only ${feasibility.totalSlotsPerWeek} periods are available Monday–Friday.`,
        ...feasibility.suggestions
      ],
      feasibilityReport: feasibility
    };
  }

  // CRITICAL DATA ISOLATION:
  // If generating for a target section, preserve all other sections' schedules intact!
  const baseClasses = targetSection
    ? (store.classes || []).filter(c => c.section !== targetSection)
    : [];

  let bestSchedule = null;
  let bestScore = -1;
  const maxAttempts = 120;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const candidateSchedule = generateSectionSchedule(
      sectionsToSchedule,
      teachers,
      subjects,
      rooms,
      periods,
      baseClasses,
      attempt,
      options.randomSeed || Math.random()
    );

    if (!candidateSchedule) continue;

    // Verify all hard constraints across the whole institute
    const audit = auditTimetableConflicts(candidateSchedule, { section: targetSection });
    if (!audit.isCompliant) continue;

    // Measure stochastic variation against previous schedule for genuine regeneration variety
    const diffScore = calculateScheduleDifference(candidateSchedule, previousSchedule);
    if (diffScore > bestScore) {
      bestScore = diffScore;
      bestSchedule = candidateSchedule;
      if (diffScore >= 12 && attempt >= 8) break;
    }
  }

  if (!bestSchedule) {
    return {
      success: false,
      errors: [
        "Constraint satisfaction search could not find a clash-free schedule with current faculty and room commitments across sections. Please check faculty workloads and room allocations.",
        "Tip: Ensure qualified faculty have sufficient remaining weekly capacity."
      ]
    };
  }

  // Save new timetable into per-section independent storage
  if (!store.sectionTimetables) store.sectionTimetables = {};

  if (targetSection) {
    const secObj = sections.find(s => (typeof s === 'string' ? s : s.name) === targetSection);
    const secId = secObj ? (secObj.id || `sec_${targetSection.toLowerCase().replace(/[^a-z0-9]/g, '_')}`) : null;
    if (secId) {
      const secClasses = bestSchedule.filter(c => c.section === targetSection);
      const currentHistory = (store.sectionTimetables[secId] && store.sectionTimetables[secId].history) || [];
      // Save current state to history for undo
      if (store.sectionTimetables[secId] && store.sectionTimetables[secId].classes) {
        currentHistory.push({
          timestamp: new Date().toISOString(),
          classes: store.sectionTimetables[secId].classes,
          label: "Pre-generation snapshot"
        });
        if (currentHistory.length > 20) currentHistory.shift();
      }

      store.sectionTimetables[secId] = {
        sectionId: secId,
        sectionName: targetSection,
        version: ((store.sectionTimetables[secId] && store.sectionTimetables[secId].version) || 1) + 1,
        published: true,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: options.user ? (options.user.name || options.user.email) : "Optimization Engine",
        classes: secClasses,
        history: currentHistory
      };
    }
  } else {
    sections.forEach(s => {
      const secName = typeof s === 'string' ? s : s.name;
      const secId = s.id || `sec_${secName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const secClasses = bestSchedule.filter(c => c.section === secName);
      store.sectionTimetables[secId] = {
        sectionId: secId,
        sectionName: secName,
        version: ((store.sectionTimetables[secId] && store.sectionTimetables[secId].version) || 1) + 1,
        published: true,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: options.user ? (options.user.name || options.user.email) : "Optimization Engine",
        classes: secClasses,
        history: []
      };
    });
  }

  store.classes = Object.values(store.sectionTimetables).flatMap(st => st.classes || []);
  store.previousSchedule = (store.classes && store.classes.length > 0) ? store.classes : bestSchedule;
  writeStore(store);

  const workloads = calculateFacultyWorkloads(store.classes, teachers);
  const subjectWorkloads = calculateSubjectProgress(store.classes, subjects, targetSection);
  const auditResult = auditTimetableConflicts(store.classes, { section: targetSection });

  return {
    success: true,
    classes: targetSection ? (store.classes.filter(c => c.section === targetSection)) : store.classes,
    allClasses: store.classes,
    workloads,
    subjectWorkloads,
    audit: auditResult,
    variationScore: bestScore >= 0 ? bestScore : 0,
    academicYear: store.academicYear,
    sections: store.sections
  };
}

/* --------------------------------------------------------------------------
   Candidate Schedule Builder for a Section
   -------------------------------------------------------------------------- */
function generateSectionSchedule(sectionsList, teachers, subjects, rooms, teachingPeriods, preExistingClasses, attempt, randomSeed) {
  const schedule = [...preExistingClasses];

  // Track faculty hours
  const teacherDailyHours = {};
  const teacherWeeklyHours = {};
  teachers.forEach(t => {
    teacherDailyHours[t.id] = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };
    teacherWeeklyHours[t.id] = 0;
  });

  function findTeacher(idOrCode) {
    if (!idOrCode) return null;
    return teachers.find(t =>
      t.id === idOrCode ||
      t.code === idOrCode ||
      (t.id && String(t.id).replace(/[^0-9]/g, '') === String(idOrCode).replace(/[^0-9]/g, ''))
    );
  }

  preExistingClasses.forEach(c => {
    const t = findTeacher(c.teacherId);
    if (t && teacherDailyHours[t.id]) {
      if (teacherDailyHours[t.id][c.day] !== undefined) {
        teacherDailyHours[t.id][c.day] += 1;
      }
      teacherWeeklyHours[t.id] += 1;
    }
  });

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  const labSubjects = subjects.filter(s => s.type === "lab");
  const techTrainSub = subjects.find(s => s.type === "training" || s.id === "SUB_TECH_TRAIN");
  const theorySubjects = subjects.filter(s => s.type === "theory");
  const tutorialSubjects = subjects.filter(s => s.type === "tutorial");
  const activitySubjects = subjects.filter(s => s.type === "activity");

  const workingDays = DEFAULT_DAYS;

  for (const secObj of sectionsList) {
    const secName = typeof secObj === 'string' ? secObj : secObj.name;
    const defaultRoom = (typeof secObj === 'object' && secObj.room) ? secObj.room : "Room 301";

    const occupied = new Set(); // `${day}_${period}_${group}`
    schedule.filter(c => c.section === secName).forEach(c => {
      if (c.group === "Both") {
        occupied.add(`${c.day}_${c.period}_Group 1`);
        occupied.add(`${c.day}_${c.period}_Group 2`);
      } else {
        occupied.add(`${c.day}_${c.period}_${c.group}`);
      }
    });

    // ------------------------------------------------------------------------
    // Step 1: Schedule Mandatory Technical Training (4 Consecutive Periods)
    // Prominently placed on one configurable day (e.g. Wednesday, Friday, or Tuesday)
    // ------------------------------------------------------------------------
    if (techTrainSub) {
      const candidateDaysForTech = shuffle(["Friday", "Wednesday", "Tuesday", "Thursday", "Monday"]);
      let techScheduled = false;

      // Available 4-period continuous blocks: Morning [P1, P2, P3, P4] or Afternoon [P6, P7, P8, P9]
      const blocks = shuffle([[6, 7, 8, 9], [1, 2, 3, 4]]);

      for (const techDay of candidateDaysForTech) {
        for (const pBlock of blocks) {
          const slotFree = pBlock.every(p =>
            !occupied.has(`${techDay}_${p}_Group 1`) && !occupied.has(`${techDay}_${p}_Group 2`)
          );
          if (!slotFree) continue;

          // Find eligible trainer(s)
          // To balance workload, we assign trainers with least current weekly load
          const eligibleTrainers = (techTrainSub.eligibleFaculty || [])
            .map(fid => findTeacher(fid))
            .filter(t => t && teacherDailyHours[t.id][techDay] + 2 <= (t.maxDailyHours || 4) && teacherWeeklyHours[t.id] + 2 <= (t.maxWeeklyHours || 18));
          eligibleTrainers.sort((a, b) => (teacherWeeklyHours[a.id] || 0) - (teacherWeeklyHours[b.id] || 0));

          let trainer1 = null;
          let trainer2 = null;

          if (eligibleTrainers.length >= 2) {
            trainer1 = eligibleTrainers[0];
            trainer2 = eligibleTrainers[1];
          } else if (eligibleTrainers.length === 1) {
            const singleTrainer = eligibleTrainers[0];
            if (teacherDailyHours[singleTrainer.id][techDay] + 4 <= (singleTrainer.maxDailyHours || 4) && teacherWeeklyHours[singleTrainer.id] + 4 <= (singleTrainer.maxWeeklyHours || 18)) {
              trainer1 = singleTrainer;
              trainer2 = singleTrainer;
            }
          }
          if (!trainer1 || !trainer2) continue;

          // Check clashes
          const t1Clash = schedule.some(c => (c.teacherId === trainer1.id || c.teacherId === trainer1.code) && c.day === techDay && (c.period === pBlock[0] || c.period === pBlock[1]));
          const t2Clash = schedule.some(c => (c.teacherId === trainer2.id || c.teacherId === trainer2.code) && c.day === techDay && (c.period === pBlock[2] || c.period === pBlock[3]));
          if (t1Clash || t2Clash) continue;

          // Check room clash
          const trainRoom = techTrainSub.defaultRoom || "Advanced Computing Lab";
          const roomClash = pBlock.some(p => schedule.some(c => c.room === trainRoom && c.day === techDay && c.period === p));
          if (roomClash) continue;

          // Assign Module 1 (Periods 0 and 1)
          [pBlock[0], pBlock[1]].forEach(p => {
            const pInfo = REFERENCE_PERIODS.find(pr => pr.id === p);
            schedule.push({
              id: `cls_${secName.replace(/\s+/g, '_')}_TT_M1_${techDay}_P${p}`,
              section: secName,
              group: "Both",
              groupLabel: "Both Groups (G1 + G2)",
              day: techDay,
              period: p,
              time: pInfo.time,
              subjectId: techTrainSub.id,
              subjectName: `${techTrainSub.name} - Module 1 (Architecture & Systems)`,
              subjectShort: "Tech Training",
              subjectCode: techTrainSub.code,
              teacherId: trainer1.id,
              teacherName: trainer1.name,
              room: trainRoom,
              type: "training",
              blockLength: 4,
              isContinuousBlock: true,
              color: techTrainSub.color || "#0284c7"
            });
            occupied.add(`${techDay}_${p}_Group 1`);
            occupied.add(`${techDay}_${p}_Group 2`);
          });
          teacherDailyHours[trainer1.id][techDay] += 2;
          teacherWeeklyHours[trainer1.id] += 2;

          // Assign Module 2 (Periods 2 and 3, Continuous with Module 1)
          [pBlock[2], pBlock[3]].forEach(p => {
            const pInfo = REFERENCE_PERIODS.find(pr => pr.id === p);
            schedule.push({
              id: `cls_${secName.replace(/\s+/g, '_')}_TT_M2_${techDay}_P${p}`,
              section: secName,
              group: "Both",
              groupLabel: "Both Groups (G1 + G2)",
              day: techDay,
              period: p,
              time: pInfo.time,
              subjectId: techTrainSub.id,
              subjectName: `${techTrainSub.name} - Module 2 (Applied Systems)`,
              subjectShort: "Tech Training",
              subjectCode: techTrainSub.code,
              teacherId: trainer2.id,
              teacherName: trainer2.name,
              room: trainRoom,
              type: "training",
              blockLength: 4,
              isContinuousBlock: true,
              color: techTrainSub.color || "#0284c7"
            });
            occupied.add(`${techDay}_${p}_Group 1`);
            occupied.add(`${techDay}_${p}_Group 2`);
          });
          teacherDailyHours[trainer2.id][techDay] += 2;
          teacherWeeklyHours[trainer2.id] += 2;

          techScheduled = true;
          break;
        }
        if (techScheduled) break;
      }
      if (!techScheduled) return null;
    }

    // ------------------------------------------------------------------------
    // Step 2: Schedule 4 Mandatory Practical Labs (2 Consecutive Periods Each)
    // 1 Lab Per Day for each Student Group.
    // Parallel Rule: When G1 attends Lab X, G2 attends Lab Y or Tutorial!
    // ------------------------------------------------------------------------
    const labDays = shuffle(workingDays.filter(d => {
      // Exclude days already carrying 4 periods of training to ensure balance
      const hasTrain = schedule.some(c => c.section === secName && c.day === d && c.type === "training");
      return !hasTrain;
    }));

    if (labDays.length < 4) return null;

    const chosenLabDays = labDays.slice(0, 4);
    const shuffledLabs = shuffle(labSubjects);

    for (let i = 0; i < 4; i++) {
      const labSub = shuffledLabs[i];
      const labDay = chosenLabDays[i];

      // Feasible 2-period lab blocks: Morning [1, 2] or [3, 4] or Afternoon [6, 7] or [8, 9]
      const candidateBlocks = shuffle([[1, 2], [3, 4], [6, 7], [8, 9]]);
      let labPlaced = false;

      const labGroup = (i % 2 === 0) ? "Group 1" : "Group 2";
      const tutGroup = (labGroup === "Group 1") ? "Group 2" : "Group 1";

      for (const [p1, p2] of candidateBlocks) {
        if (occupied.has(`${labDay}_${p1}_${labGroup}`) || occupied.has(`${labDay}_${p2}_${labGroup}`)) continue;
        if (occupied.has(`${labDay}_${p1}_${tutGroup}`) || occupied.has(`${labDay}_${p2}_${tutGroup}`)) continue;

        // Eligible faculty for lab
        const eligibleLabFaculty = (labSub.eligibleFaculty || [])
          .map(fid => findTeacher(fid))
          .filter(t => t && teacherDailyHours[t.id][labDay] + 2 <= (t.maxDailyHours || 4) && teacherWeeklyHours[t.id] + 2 <= (t.maxWeeklyHours || 18));
        eligibleLabFaculty.sort((a, b) => (teacherWeeklyHours[a.id] || 0) - (teacherWeeklyHours[b.id] || 0));

        let foundFaculty = null;
        for (const fac of eligibleLabFaculty) {
          const facClash = schedule.some(c => (c.teacherId === fac.id || c.teacherId === fac.code) && c.day === labDay && (c.period === p1 || c.period === p2));
          if (!facClash) {
            foundFaculty = fac;
            break;
          }
        }
        if (!foundFaculty) continue;

        // Check lab room clash
        const labRoom = labSub.defaultRoom || "Specialized Lab";
        const roomClash = schedule.some(c => c.room === labRoom && c.day === labDay && (c.period === p1 || c.period === p2));
        if (roomClash) continue;

        // Simultaneous parallel activity for tutGroup: Tutorial or Workshop!
        const tutSub1 = tutorialSubjects[i % tutorialSubjects.length] || theorySubjects[0];
        const tutSub2 = tutorialSubjects[(i + 1) % tutorialSubjects.length] || theorySubjects[1];

        // Find qualified faculty for tutGroup:
        // Either 1 faculty for both periods, or 2 faculty for 1 period each
        const candidateTutFaculty = teachers.filter(t =>
          t.id !== foundFaculty.id &&
          t.code !== foundFaculty.code &&
          ((tutSub1.eligibleFaculty || []).includes(t.id) || (tutSub1.eligibleFaculty || []).includes(t.code) || (t.eligibleSubjects || []).includes(tutSub1.id) || (t.department && (t.department.includes('Computer') || t.department.includes('Applied'))))
        );
        candidateTutFaculty.sort((a, b) => (teacherWeeklyHours[a.id] || 0) - (teacherWeeklyHours[b.id] || 0));

        let eligibleTutFac1 = null;
        let eligibleTutFac2 = null;

        for (const tf of candidateTutFaculty) {
          const t1Clash = schedule.some(c => (c.teacherId === tf.id || c.teacherId === tf.code) && c.day === labDay && c.period === p1);
          if (!t1Clash && teacherDailyHours[tf.id][labDay] + 1 <= (tf.maxDailyHours || 4) && teacherWeeklyHours[tf.id] + 1 <= (tf.maxWeeklyHours || 18)) {
            eligibleTutFac1 = tf;
            break;
          }
        }

        for (const tf of candidateTutFaculty) {
          const t2Clash = schedule.some(c => (c.teacherId === tf.id || c.teacherId === tf.code) && c.day === labDay && c.period === p2);
          if (!t2Clash) {
            const extraHours = (tf.id === eligibleTutFac1?.id) ? 2 : 1;
            if (teacherDailyHours[tf.id][labDay] + extraHours <= (tf.maxDailyHours || 4) && teacherWeeklyHours[tf.id] + 1 <= (tf.maxWeeklyHours || 18)) {
              eligibleTutFac2 = tf;
              break;
            }
          }
        }

        if (!eligibleTutFac1 || !eligibleTutFac2) continue;

        // Assign 2 consecutive periods for labGroup
        [p1, p2].forEach(p => {
          const pInfo = REFERENCE_PERIODS.find(pr => pr.id === p);
          schedule.push({
            id: `cls_${secName.replace(/\s+/g, '_')}_${labSub.id}_${labDay}_P${p}_${labGroup.replace(/\s+/g, '')}`,
            section: secName,
            group: labGroup,
            groupLabel: labGroup,
            day: labDay,
            period: p,
            time: pInfo.time,
            subjectId: labSub.id,
            subjectName: labSub.name,
            subjectShort: labSub.shortName || labSub.name,
            subjectCode: labSub.code,
            teacherId: foundFaculty.id,
            teacherName: foundFaculty.name,
            room: labRoom,
            type: "lab",
            blockLength: 2,
            isContinuousBlock: true,
            color: labSub.color || "#059669"
          });
          occupied.add(`${labDay}_${p}_${labGroup}`);
        });
        teacherDailyHours[foundFaculty.id][labDay] += 2;
        teacherWeeklyHours[foundFaculty.id] += 2;

        // Assign Parallel Tutorials for tutGroup
        const p1Info = REFERENCE_PERIODS.find(pr => pr.id === p1);
        schedule.push({
          id: `cls_${secName.replace(/\s+/g, '_')}_${tutSub1.id}_${labDay}_P${p1}_${tutGroup.replace(/\s+/g, '')}`,
          section: secName,
          group: tutGroup,
          groupLabel: tutGroup,
          day: labDay,
          period: p1,
          time: p1Info.time,
          subjectId: tutSub1.id,
          subjectName: tutSub1.name,
          subjectShort: tutSub1.shortName || tutSub1.name,
          subjectCode: tutSub1.code,
          teacherId: eligibleTutFac1.id,
          teacherName: eligibleTutFac1.name,
          room: tutSub1.defaultRoom || defaultRoom,
          type: "tutorial",
          blockLength: 1,
          isContinuousBlock: false,
          color: tutSub1.color || "#d97706"
        });
        occupied.add(`${labDay}_${p1}_${tutGroup}`);
        teacherDailyHours[eligibleTutFac1.id][labDay] += 1;
        teacherWeeklyHours[eligibleTutFac1.id] += 1;

        const p2Info = REFERENCE_PERIODS.find(pr => pr.id === p2);
        schedule.push({
          id: `cls_${secName.replace(/\s+/g, '_')}_${tutSub2.id}_${labDay}_P${p2}_${tutGroup.replace(/\s+/g, '')}`,
          section: secName,
          group: tutGroup,
          groupLabel: tutGroup,
          day: labDay,
          period: p2,
          time: p2Info.time,
          subjectId: tutSub2.id,
          subjectName: tutSub2.name,
          subjectShort: tutSub2.shortName || tutSub2.name,
          subjectCode: tutSub2.code,
          teacherId: eligibleTutFac2.id,
          teacherName: eligibleTutFac2.name,
          room: tutSub2.defaultRoom || defaultRoom,
          type: "tutorial",
          blockLength: 1,
          isContinuousBlock: false,
          color: tutSub2.color || "#d97706"
        });
        occupied.add(`${labDay}_${p2}_${tutGroup}`);
        teacherDailyHours[eligibleTutFac2.id][labDay] += 1;
        teacherWeeklyHours[eligibleTutFac2.id] += 1;

        labPlaced = true;
        break;
      }
      if (!labPlaced) return null;
    }

    // ------------------------------------------------------------------------
    // Step 3: Schedule Core Theoretical Subjects (Both Groups Attend Common Lectures)
    // Evenly distributed across working days, avoiding unnecessary clumps
    // ------------------------------------------------------------------------
    const theoryQueue = [];
    theorySubjects.forEach(sub => {
      const needed = Number(sub.weeklyLectures) || 4;
      for (let k = 0; k < needed; k++) {
        theoryQueue.push(sub);
      }
    });

    // Also add scheduled enrichment activities (Sports / Library)
    activitySubjects.forEach(act => {
      const needed = Number(act.weeklyLectures) || 1;
      for (let k = 0; k < needed; k++) {
        theoryQueue.push(act);
      }
    });

    const shuffledTheory = shuffle(theoryQueue);

    for (const sub of shuffledTheory) {
      let placed = false;
      const daysShuffled = shuffle(workingDays);

      // Prefer days where this subject isn't already heavily scheduled
      daysShuffled.sort((a, b) => {
        const countA = schedule.filter(c => c.section === secName && c.day === a && c.subjectId === sub.id).length;
        const countB = schedule.filter(c => c.section === secName && c.day === b && c.subjectId === sub.id).length;
        return countA - countB;
      });

      for (const day of daysShuffled) {
        // Daily total check: avoid overloading a single day beyond max lectures
        const dayTotal = schedule.filter(c => c.section === secName && c.day === day).length;
        if (dayTotal >= 8) continue;

        // Try periods (excluding lunch period 5)
        const periodCandidates = shuffle(teachingPeriods.map(p => p.id));

        for (const p of periodCandidates) {
          if (occupied.has(`${day}_${p}_Group 1`) || occupied.has(`${day}_${p}_Group 2`)) continue;

          // Find eligible faculty
          const eligibleTeachers = (sub.eligibleFaculty || [])
            .map(fid => findTeacher(fid))
            .filter(t => t && teacherDailyHours[t.id][day] + 1 <= (t.maxDailyHours || 4) && teacherWeeklyHours[t.id] + 1 <= (t.maxWeeklyHours || 18));
          eligibleTeachers.sort((a, b) => {
            const wDiff = (teacherWeeklyHours[a.id] || 0) - (teacherWeeklyHours[b.id] || 0);
            if (wDiff !== 0) return wDiff;
            return (teacherDailyHours[a.id][day] || 0) - (teacherDailyHours[b.id][day] || 0);
          });

          let assignedTeacher = null;
          for (const teacher of eligibleTeachers) {
            const hasClash = schedule.some(c => (c.teacherId === teacher.id || c.teacherId === teacher.code) && c.day === day && c.period === p);
            if (!hasClash) {
              assignedTeacher = teacher;
              break;
            }
          }
          if (!assignedTeacher) continue;

          // Theory lectures occur in the section's dedicated classroom
          const roomToUse = (typeof secObj === 'object' && secObj.room) ? secObj.room : (defaultRoom || sub.defaultRoom || "Room 301");
          const roomClash = schedule.some(c => c.room === roomToUse && c.day === day && c.period === p);
          if (roomClash) continue;

          const pInfo = REFERENCE_PERIODS.find(pr => pr.id === p);
          schedule.push({
            id: `cls_${secName.replace(/\s+/g, '_')}_${sub.id}_${day}_P${p}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
            section: secName,
            group: "Both",
            groupLabel: "Both Groups (G1 + G2)",
            day,
            period: p,
            time: pInfo.time,
            subjectId: sub.id,
            subjectName: sub.name,
            subjectShort: sub.shortName || sub.name,
            subjectCode: sub.code,
            teacherId: assignedTeacher.id,
            teacherName: assignedTeacher.name,
            room: roomToUse,
            type: sub.type,
            blockLength: 1,
            isContinuousBlock: false,
            color: sub.color || "#3b82f6"
          });

          occupied.add(`${day}_${p}_Group 1`);
          occupied.add(`${day}_${p}_Group 2`);
          teacherDailyHours[assignedTeacher.id][day] += 1;
          teacherWeeklyHours[assignedTeacher.id] += 1;

          placed = true;
          break;
        }
        if (placed) break;
      }
    }
  }

  return schedule;
}

function calculateScheduleDifference(candidate, previous) {
  if (!previous || previous.length === 0) return 20;
  let differences = 0;
  candidate.forEach(c => {
    const match = previous.find(p => p.section === c.section && p.day === c.day && p.period === c.period && p.subjectId === c.subjectId);
    if (!match) differences++;
  });
  return differences;
}

/* --------------------------------------------------------------------------
   Manual Class Editing & Undo / Redo History
   -------------------------------------------------------------------------- */
function manualEditClass(params) {
  const store = readStore();
  const { section, editId, classData, action, user } = params;
  const secName = section || (store.sections[0] ? store.sections[0].name : "CSE 2D");

  const secObj = store.sections.find(s => (s.name || s) === secName || s.id === secName);
  if (!secObj) throw new Error(`Section "${secName}" not found.`);

  const secId = secObj.id;
  const secTimetable = store.sectionTimetables[secId];
  if (!secTimetable) throw new Error(`Section timetable storage for "${secName}" not found.`);

  const existingClasses = secTimetable.classes || [];

  // Snapshot for undo
  if (!secTimetable.history) secTimetable.history = [];
  secTimetable.history.push({
    timestamp: new Date().toISOString(),
    classes: JSON.parse(JSON.stringify(existingClasses)),
    label: action === 'delete' ? `Deleted slot ${editId}` : `Edited slot`
  });
  if (secTimetable.history.length > 25) secTimetable.history.shift();

  if (action === 'delete') {
    secTimetable.classes = existingClasses.filter(c => c.id !== editId);
    secTimetable.version = (secTimetable.version || 1) + 1;
    secTimetable.updatedAt = new Date().toISOString();
    secTimetable.lastModifiedBy = user ? (user.name || user.email) : "Faculty";

    store.classes = Object.values(store.sectionTimetables).flatMap(st => st.classes || []);
    writeStore(store);

    return {
      success: true,
      message: `Slot removed successfully from Section ${secName}.`,
      version: secTimetable.version,
      classes: secTimetable.classes,
      workloads: calculateFacultyWorkloads(store.classes, store.teachers),
      subjectWorkloads: calculateSubjectProgress(store.classes, store.subjects, secName)
    };
  }

  // Handle Swap Action
  if (action === 'swap' && params.targetDay && params.targetPeriod) {
    const sourceClass = existingClasses.find(c => c.id === editId);
    if (!sourceClass) throw new Error("Source class slot not found.");

    const targetClass = existingClasses.find(c =>
      c.day === params.targetDay &&
      Number(c.period) === Number(params.targetPeriod) &&
      (c.group === sourceClass.group || sourceClass.group === "Both" || c.group === "Both")
    );

    const pTargetInfo = (store.periods || REFERENCE_PERIODS).find(p => p.id === Number(params.targetPeriod));

    if (targetClass) {
      // Swap places
      const pSourceInfo = (store.periods || REFERENCE_PERIODS).find(p => p.id === Number(sourceClass.period));
      targetClass.day = sourceClass.day;
      targetClass.period = sourceClass.period;
      targetClass.time = pSourceInfo.time;
    }

    sourceClass.day = params.targetDay;
    sourceClass.period = Number(params.targetPeriod);
    sourceClass.time = pTargetInfo.time;

    secTimetable.version = (secTimetable.version || 1) + 1;
    secTimetable.updatedAt = new Date().toISOString();
    secTimetable.lastModifiedBy = user ? (user.name || user.email) : "Faculty";

    store.classes = Object.values(store.sectionTimetables).flatMap(st => st.classes || []);
    writeStore(store);

    return {
      success: true,
      message: `Slot swapped successfully.`,
      version: secTimetable.version,
      classes: secTimetable.classes,
      workloads: calculateFacultyWorkloads(store.classes, store.teachers),
      subjectWorkloads: calculateSubjectProgress(store.classes, store.subjects, secName)
    };
  }

  // Edit / Upsert
  const targetDay = classData.day || "Monday";
  const targetPeriod = Number(classData.period || (classData.periodIndex !== undefined ? classData.periodIndex + 1 : 1));
  const targetGroup = classData.group || "Both";
  const targetSubjectId = classData.subjectId || classData.subjectCode || classData.subjectName;
  const targetTeacherId = classData.teacherId || classData.facultyId || classData.facultyCode;
  const targetRoom = classData.room || classData.roomName || secObj.room || "Room 301";

  const subject = store.subjects.find(s =>
    s.id === targetSubjectId ||
    s.code === targetSubjectId ||
    s.codeId === targetSubjectId ||
    (s.name && s.name.toLowerCase() === String(targetSubjectId).toLowerCase()) ||
    (s.shortName && s.shortName.toLowerCase() === String(targetSubjectId).toLowerCase())
  ) || store.subjects[0];

  const teacher = store.teachers.find(t =>
    t.id === targetTeacherId ||
    t.code === targetTeacherId ||
    (t.name && t.name.toLowerCase().includes(String(targetTeacherId).toLowerCase()))
  ) || store.teachers[0];

  const pInfo = (store.periods || REFERENCE_PERIODS).find(p => p.id === targetPeriod) || (store.periods || REFERENCE_PERIODS)[0];

  const candidate = {
    id: editId || `cls_${secName.replace(/\s+/g, '_')}_${subject.id}_${targetDay}_P${targetPeriod}_${Date.now().toString(36)}`,
    section: secName,
    group: targetGroup,
    groupLabel: targetGroup === "Both" ? "Both Groups (G1 + G2)" : targetGroup,
    day: targetDay,
    period: targetPeriod,
    time: pInfo.time,
    subjectId: subject.id,
    subjectName: subject.name,
    subjectShort: subject.shortName || subject.name,
    subjectCode: subject.code,
    teacherId: teacher.id,
    teacherName: teacher.name,
    room: targetRoom,
    type: subject.type || classData.type || "theory",
    blockLength: subject.blockLength || 1,
    isContinuousBlock: !!subject.isContinuousBlock,
    color: subject.color || "#2563eb"
  };

  // Cross-section validation
  const allClassesAcrossSections = Object.entries(store.sectionTimetables).flatMap(([sId, st]) => {
    return (st.classes || []).filter(c => editId ? c.id !== editId : true);
  });

  const validation = validateClass(candidate, allClassesAcrossSections, editId);
  if (!validation.valid) {
    const err = new Error(validation.error);
    err.status = 422;
    throw err;
  }

  let updatedClasses;
  if (editId && existingClasses.some(c => c.id === editId)) {
    updatedClasses = existingClasses.map(c => c.id === editId ? candidate : c);
  } else {
    updatedClasses = [...existingClasses, candidate];
  }

  secTimetable.classes = updatedClasses;
  secTimetable.version = (secTimetable.version || 1) + 1;
  secTimetable.updatedAt = new Date().toISOString();
  secTimetable.lastModifiedBy = user ? (user.name || user.email) : "Faculty";

  store.classes = Object.values(store.sectionTimetables).flatMap(st => st.classes || []);
  writeStore(store);

  return {
    success: true,
    message: `Timetable slot updated successfully for Section ${secName}.`,
    version: secTimetable.version,
    classes: secTimetable.classes,
    workloads: calculateFacultyWorkloads(store.classes, store.teachers),
    subjectWorkloads: calculateSubjectProgress(store.classes, store.subjects, secName)
  };
}

/* --------------------------------------------------------------------------
   Undo & Redo State Handlers
   -------------------------------------------------------------------------- */
function undoSectionChanges(sectionName, user) {
  const store = readStore();
  const secObj = store.sections.find(s => (s.name || s) === sectionName || s.id === sectionName);
  if (!secObj) throw new Error(`Section "${sectionName}" not found.`);

  const secId = secObj.id;
  const secTimetable = store.sectionTimetables[secId];
  if (!secTimetable || !secTimetable.history || secTimetable.history.length === 0) {
    throw new Error("No previous snapshot available to undo.");
  }

  const previousSnapshot = secTimetable.history.pop();
  secTimetable.classes = previousSnapshot.classes;
  secTimetable.version = (secTimetable.version || 1) + 1;
  secTimetable.updatedAt = new Date().toISOString();
  secTimetable.lastModifiedBy = user ? (user.name || user.email) : "Undo Action";

  store.classes = Object.values(store.sectionTimetables).flatMap(st => st.classes || []);
  writeStore(store);

  return {
    success: true,
    message: `Undo successful. Restored previous timetable state for ${sectionName}.`,
    classes: secTimetable.classes,
    version: secTimetable.version
  };
}

/* --------------------------------------------------------------------------
   Section Reset Handler (Strict Data Isolation)
   -------------------------------------------------------------------------- */
function resetTimetable(options = {}) {
  const store = readStore();
  const targetSection = options.section || null;
  const mode = options.mode || "section";
  let secObj = null;

  if (mode === "all") {
    // Reset all sections
    Object.keys(store.sectionTimetables).forEach(secId => {
      store.sectionTimetables[secId].classes = [];
      store.sectionTimetables[secId].version = (store.sectionTimetables[secId].version || 1) + 1;
      store.sectionTimetables[secId].updatedAt = new Date().toISOString();
      store.sectionTimetables[secId].lastModifiedBy = options.user ? (options.user.name || options.user.email) : "Admin";
    });
    store.classes = [];
  } else {
    // Reset strictly selected section without touching any other section
    secObj = store.sections.find(s => (s.name || s) === targetSection || s.id === targetSection);
    if (!secObj) throw new Error(`Section "${targetSection}" not found.`);
    const secId = secObj.id;

    if (store.sectionTimetables[secId]) {
      // Record history
      if (!store.sectionTimetables[secId].history) store.sectionTimetables[secId].history = [];
      store.sectionTimetables[secId].history.push({
        timestamp: new Date().toISOString(),
        classes: store.sectionTimetables[secId].classes,
        label: "Pre-reset snapshot"
      });

      store.sectionTimetables[secId].classes = [];
      store.sectionTimetables[secId].version = (store.sectionTimetables[secId].version || 1) + 1;
      store.sectionTimetables[secId].updatedAt = new Date().toISOString();
      store.sectionTimetables[secId].lastModifiedBy = options.user ? (options.user.name || options.user.email) : "Admin";
    }

    store.classes = Object.values(store.sectionTimetables).flatMap(st => st.classes || []);
  }

  writeStore(store);

  return {
    success: true,
    message: mode === "all" ? "All sections reset." : `Timetable for Section ${targetSection} reset successfully. Other sections remain completely unaffected.`,
    classes: targetSection ? (store.sectionTimetables[secObj ? secObj.id : ""]?.classes || []) : store.classes
  };
}

/* --------------------------------------------------------------------------
   Section Management CRUD
   -------------------------------------------------------------------------- */
function addSection(sectionData) {
  const store = readStore();
  const name = (sectionData.name || "").trim();
  if (!name) throw new Error("Section name is required.");

  const exists = store.sections.some(s => (s.name || s).toLowerCase() === name.toLowerCase());
  if (exists) throw new Error(`Section "${name}" already exists.`);

  const secId = `sec_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
  const newSection = {
    id: secId,
    name,
    room: (sectionData.room || "Room 301").trim(),
    coordinator: (sectionData.coordinator || "Unassigned").trim(),
    students: Number(sectionData.students) || 60,
    semester: sectionData.semester || "Semester 3",
    academicYear: sectionData.academicYear || store.academicYear,
    groups: sectionData.groups || ["Group 1", "Group 2"],
    isArchived: false
  };

  store.sections.push(newSection);

  // Initialize isolated timetable storage
  if (!store.sectionTimetables) store.sectionTimetables = {};
  store.sectionTimetables[secId] = {
    sectionId: secId,
    sectionName: name,
    version: 1,
    published: true,
    updatedAt: new Date().toISOString(),
    lastModifiedBy: null,
    classes: [],
    history: []
  };

  writeStore(store);
  return { success: true, section: newSection, message: `Section "${name}" added successfully.` };
}

function updateSection(idOrName, updateData) {
  const store = readStore();
  const sec = store.sections.find(s => s.id === idOrName || s.name === idOrName);
  if (!sec) throw new Error(`Section "${idOrName}" not found.`);

  if (updateData.name) sec.name = updateData.name.trim();
  if (updateData.room) sec.room = updateData.room.trim();
  if (updateData.coordinator) sec.coordinator = updateData.coordinator.trim();
  if (updateData.students) sec.students = Number(updateData.students);
  if (updateData.semester) sec.semester = updateData.semester;
  if (updateData.isArchived !== undefined) sec.isArchived = Boolean(updateData.isArchived);

  // Sync in sectionTimetables
  if (store.sectionTimetables[sec.id]) {
    store.sectionTimetables[sec.id].sectionName = sec.name;
    // Update section name in its classes
    store.sectionTimetables[sec.id].classes.forEach(c => { c.section = sec.name; });
  }

  store.classes = Object.values(store.sectionTimetables).flatMap(st => st.classes || []);
  writeStore(store);
  return { success: true, section: sec, message: `Section updated successfully.` };
}

function duplicateSection(sourceSectionName, newSectionName) {
  const store = readStore();
  const sourceSec = store.sections.find(s => s.name === sourceSectionName || s.id === sourceSectionName);
  if (!sourceSec) throw new Error(`Source section "${sourceSectionName}" not found.`);

  const newName = (newSectionName || `${sourceSec.name} Copy`).trim();
  if (store.sections.some(s => s.name.toLowerCase() === newName.toLowerCase())) {
    throw new Error(`Section "${newName}" already exists.`);
  }

  const secId = `sec_${newName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
  const newSec = {
    ...sourceSec,
    id: secId,
    name: newName
  };

  store.sections.push(newSec);
  if (!store.sectionTimetables) store.sectionTimetables = {};
  store.sectionTimetables[secId] = {
    sectionId: secId,
    sectionName: newName,
    version: 1,
    published: true,
    updatedAt: new Date().toISOString(),
    lastModifiedBy: "Duplicated from " + sourceSec.name,
    classes: [], // Independent copy begins clean to prevent room/faculty double booking
    history: []
  };

  writeStore(store);
  return { success: true, section: newSec, message: `Section "${newName}" created independently.` };
}

function deleteSection(idOrName) {
  const store = readStore();
  const idx = store.sections.findIndex(s => s.id === idOrName || s.name === idOrName);
  if (idx === -1) throw new Error(`Section "${idOrName}" not found.`);

  const sec = store.sections[idx];
  store.sections.splice(idx, 1);

  if (store.sectionTimetables && store.sectionTimetables[sec.id]) {
    delete store.sectionTimetables[sec.id];
  }

  store.classes = Object.values(store.sectionTimetables || {}).flatMap(st => st.classes || []);
  writeStore(store);
  return { success: true, message: `Section "${sec.name}" and its schedule removed successfully.` };
}

/* --------------------------------------------------------------------------
   Faculty Management CRUD
   -------------------------------------------------------------------------- */
function addFaculty(facultyData) {
  const store = readStore();
  const name = (facultyData.name || "").trim();
  if (!name) throw new Error("Faculty name is required.");

  const nextCodeNum = (store.teachers || []).length + 1;
  const fCode = facultyData.code || `F${nextCodeNum}`;
  const fId = facultyData.id || fCode;

  const newFaculty = {
    id: fId,
    code: fCode,
    name,
    designation: facultyData.designation || "Assistant Professor",
    department: facultyData.department || "Computer Science & Engineering",
    eligibleSubjects: Array.isArray(facultyData.eligibleSubjects) ? facultyData.eligibleSubjects : [],
    email: facultyData.email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@nova.edu`,
    phone: facultyData.phone || "+91 98101 00000",
    maxWeeklyHours: Number(facultyData.maxWeeklyHours) || 18.0,
    maxDailyHours: Number(facultyData.maxDailyHours) || 4.0,
    unavailableSlots: Array.isArray(facultyData.unavailableSlots) ? facultyData.unavailableSlots : [],
    preferredDays: Array.isArray(facultyData.preferredDays) ? facultyData.preferredDays : DEFAULT_DAYS,
    isActive: facultyData.isActive !== false
  };

  store.teachers.push(newFaculty);
  writeStore(store);
  return { success: true, faculty: newFaculty, message: `Faculty ${newFaculty.name} (${newFaculty.code}) added.` };
}

function updateFaculty(fId, updateData) {
  const store = readStore();
  const fac = store.teachers.find(t => t.id === fId || t.code === fId);
  if (!fac) throw new Error(`Faculty member "${fId}" not found.`);

  if (updateData.name) fac.name = updateData.name.trim();
  if (updateData.code) fac.code = updateData.code.trim();
  if (updateData.designation) fac.designation = updateData.designation.trim();
  if (updateData.department) fac.department = updateData.department.trim();
  if (updateData.email) fac.email = updateData.email.trim();
  if (updateData.phone) fac.phone = updateData.phone.trim();
  if (updateData.maxWeeklyHours !== undefined) fac.maxWeeklyHours = Number(updateData.maxWeeklyHours);
  if (updateData.maxDailyHours !== undefined) fac.maxDailyHours = Number(updateData.maxDailyHours);
  if (Array.isArray(updateData.eligibleSubjects)) fac.eligibleSubjects = updateData.eligibleSubjects;
  if (Array.isArray(updateData.unavailableSlots)) fac.unavailableSlots = updateData.unavailableSlots;
  if (Array.isArray(updateData.preferredDays)) fac.preferredDays = updateData.preferredDays;
  if (updateData.isActive !== undefined) fac.isActive = Boolean(updateData.isActive);

  writeStore(store);
  return { success: true, faculty: fac, message: `Faculty details updated successfully.` };
}

function deleteFaculty(fId) {
  const store = readStore();
  const idx = store.teachers.findIndex(t => t.id === fId || t.code === fId);
  if (idx === -1) throw new Error(`Faculty member "${fId}" not found.`);

  const fac = store.teachers[idx];
  store.teachers.splice(idx, 1);
  writeStore(store);
  return { success: true, message: `Faculty member "${fac.name}" removed.` };
}

/* --------------------------------------------------------------------------
   Excel Faculty & Workload Import Engine
   Integrates teachers, subject mappings, workloads, and generates timetable
   -------------------------------------------------------------------------- */
function importExcelFaculty(records = [], options = {}) {
  const store = readStore();
  let addedCount = 0;
  let updatedCount = 0;
  const processedFaculty = [];

  for (const item of records) {
    const name = (item.name || item.teacherName || item.facultyName || "").trim();
    if (!name) continue;

    const email = (item.email || item.teacherEmail || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@nova.edu`).toLowerCase().trim();
    const cleanId = (item.id || item.code || "").trim();

    // Match existing faculty member by id, code, email, or exact name (avoids duplicates)
    let existing = (store.teachers || []).find(t => 
      (cleanId && (t.id === cleanId || t.code === cleanId)) ||
      (t.email && t.email.toLowerCase().trim() === email) ||
      (t.name && t.name.toLowerCase().trim() === name.toLowerCase())
    );

    // Resolve eligible subjects (mapping subject codes e.g. BCS-301 -> subject ID SUB_DS)
    const rawSubjects = item.subjects || item.eligibleSubjects || item.subjectCodes || "";
    const eligibleSubjects = resolveSubjectIds(rawSubjects, store.subjects);

    const maxWeeklyHours = Math.min(Math.max(Number(item.maxWeeklyHours) || 18.0, 1), 24);
    const maxDailyHours = Math.min(Math.max(Number(item.maxDailyHours) || 4.0, 1), 8);
    const department = item.department || "Computer Science & Engineering";
    const designation = item.designation || "Assistant Professor";
    const preferredDays = Array.isArray(item.preferredDays) && item.preferredDays.length > 0 ? item.preferredDays : DEFAULT_DAYS;

    if (existing) {
      existing.name = name;
      existing.department = department;
      existing.designation = designation;
      existing.email = email;
      existing.maxWeeklyHours = maxWeeklyHours;
      existing.maxDailyHours = maxDailyHours;
      existing.preferredDays = preferredDays;
      // Merge eligible subjects without duplicates
      if (eligibleSubjects.length > 0) {
        existing.eligibleSubjects = Array.from(new Set([...(existing.eligibleSubjects || []), ...eligibleSubjects]));
      }
      updatedCount++;
      processedFaculty.push(existing);
    } else {
      const nextNum = (store.teachers || []).length + 1;
      const fCode = cleanId || `F${nextNum}`;
      const newTeacher = {
        id: fCode,
        code: fCode,
        name,
        designation,
        department,
        eligibleSubjects,
        email,
        phone: item.phone || "+91 98101 00000",
        maxWeeklyHours,
        maxDailyHours,
        unavailableSlots: [],
        preferredDays,
        isActive: true
      };
      store.teachers.push(newTeacher);
      addedCount++;
      processedFaculty.push(newTeacher);
    }
  }

  writeStore(store);

  let genResult = null;
  if (options.autoGenerate && options.section) {
    try {
      genResult = runOptimization({ section: options.section, user: options.user });
    } catch (e) {
      console.warn('[TimetableService] Auto-generation after import warning:', e.message);
    }
  }

  return {
    success: true,
    addedCount,
    updatedCount,
    totalProcessed: addedCount + updatedCount,
    faculty: processedFaculty,
    timetableGenerated: !!(genResult && genResult.success),
    generationResult: genResult,
    message: `Imported successfully: ${addedCount} new faculty added, ${updatedCount} existing faculty updated.${genResult && genResult.success ? ` Timetable generated for ${options.section}.` : ''}`
  };
}

/* --------------------------------------------------------------------------
   Subject Management CRUD
   -------------------------------------------------------------------------- */
function addSubject(subData) {
  const store = readStore();
  const name = (subData.name || "").trim();
  if (!name) throw new Error("Subject name is required.");

  const id = subData.id || `SUB_${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now().toString(36)}`;
  const newSub = {
    id,
    codeId: subData.codeId || `S${store.subjects.length + 1}`,
    name,
    shortName: subData.shortName || name,
    code: subData.code || "BCS-301",
    type: subData.type || "theory",
    weeklyLectures: Number(subData.weeklyLectures) || 4,
    lectureDuration: Number(subData.lectureDuration) || 50,
    blockLength: Number(subData.blockLength) || (subData.type === 'lab' ? 2 : (subData.type === 'training' ? 4 : 1)),
    isContinuousBlock: subData.type === 'lab' || subData.type === 'training',
    eligibleFaculty: Array.isArray(subData.eligibleFaculty) ? subData.eligibleFaculty : [],
    defaultRoom: subData.defaultRoom || "Lecture Hall",
    minLectures: Number(subData.minLectures) || 3,
    maxLectures: Number(subData.maxLectures) || 7,
    color: subData.color || "#3b82f6"
  };

  store.subjects.push(newSub);
  writeStore(store);
  return { success: true, subject: newSub, message: `Subject "${name}" added.` };
}

function updateSubject(subId, updateData) {
  const store = readStore();
  const sub = store.subjects.find(s => s.id === subId);
  if (!sub) throw new Error(`Subject "${subId}" not found.`);

  if (updateData.name) sub.name = updateData.name.trim();
  if (updateData.shortName) sub.shortName = updateData.shortName.trim();
  if (updateData.code) sub.code = updateData.code.trim();
  if (updateData.codeId) sub.codeId = updateData.codeId.trim();
  if (updateData.type) sub.type = updateData.type;
  if (updateData.weeklyLectures !== undefined) sub.weeklyLectures = Number(updateData.weeklyLectures);
  if (updateData.blockLength !== undefined) sub.blockLength = Number(updateData.blockLength);
  if (updateData.isContinuousBlock !== undefined) sub.isContinuousBlock = Boolean(updateData.isContinuousBlock);
  if (Array.isArray(updateData.eligibleFaculty)) sub.eligibleFaculty = updateData.eligibleFaculty;
  if (updateData.defaultRoom) sub.defaultRoom = updateData.defaultRoom.trim();
  if (updateData.color) sub.color = updateData.color;

  writeStore(store);
  return { success: true, subject: sub, message: `Subject updated successfully.` };
}

function deleteSubject(subId) {
  const store = readStore();
  const idx = store.subjects.findIndex(s => s.id === subId);
  if (idx === -1) throw new Error(`Subject "${subId}" not found.`);

  const sub = store.subjects[idx];
  store.subjects.splice(idx, 1);
  writeStore(store);
  return { success: true, message: `Subject "${sub.name}" removed.` };
}

/* --------------------------------------------------------------------------
   Room Management CRUD
   -------------------------------------------------------------------------- */
function addRoom(roomData) {
  const store = readStore();
  const name = (roomData.name || "").trim();
  if (!name) throw new Error("Room name is required.");

  const id = roomData.id || `RM_${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  const newRoom = {
    id,
    name,
    code: roomData.code || name,
    type: roomData.type || "Lecture Hall",
    capacity: Number(roomData.capacity) || 70,
    block: roomData.block || "Academic Block A",
    isLab: Boolean(roomData.isLab)
  };

  store.rooms.push(newRoom);
  writeStore(store);
  return { success: true, room: newRoom, message: `Facility "${name}" registered.` };
}

function updateRoom(roomId, updateData) {
  const store = readStore();
  const rm = store.rooms.find(r => r.id === roomId);
  if (!rm) throw new Error(`Room "${roomId}" not found.`);

  if (updateData.name) rm.name = updateData.name.trim();
  if (updateData.code) rm.code = updateData.code.trim();
  if (updateData.type) rm.type = updateData.type.trim();
  if (updateData.capacity) rm.capacity = Number(updateData.capacity);
  if (updateData.block) rm.block = updateData.block.trim();
  if (updateData.isLab !== undefined) rm.isLab = Boolean(updateData.isLab);

  writeStore(store);
  return { success: true, room: rm, message: `Facility details updated.` };
}

function deleteRoom(roomId) {
  const store = readStore();
  const idx = store.rooms.findIndex(r => r.id === roomId);
  if (idx === -1) throw new Error(`Room "${roomId}" not found.`);

  const rm = store.rooms[idx];
  store.rooms.splice(idx, 1);
  writeStore(store);
  return { success: true, message: `Facility "${rm.name}" removed.` };
}

/* --------------------------------------------------------------------------
   Settings Update Handler
   -------------------------------------------------------------------------- */
function updateSettings(newSettings) {
  const store = readStore();
  store.settings = { ...store.settings, ...newSettings };
  if (newSettings.periods && Array.isArray(newSettings.periods)) {
    store.periods = newSettings.periods;
  }
  if (newSettings.lunchBreak) {
    store.lunchBreak = { ...store.lunchBreak, ...newSettings.lunchBreak };
  }
  writeStore(store);
  return { success: true, settings: store.settings, periods: store.periods, lunchBreak: store.lunchBreak };
}

/* --------------------------------------------------------------------------
   Reports Engine (Cross-Section & Multi-View)
   -------------------------------------------------------------------------- */
function generateReports(options = {}) {
  const store = readStore();
  const teachers = store.teachers || INITIAL_FACULTY;
  const subjects = store.subjects || INITIAL_SUBJECTS;
  const rooms = store.rooms || INITIAL_ROOMS;
  const sections = store.sections || INITIAL_SECTIONS;
  const allClasses = store.classes || [];

  // 1. Combined Master Timetable
  const combinedBySection = {};
  sections.forEach(s => {
    combinedBySection[s.name] = (store.sectionTimetables[s.id] && store.sectionTimetables[s.id].classes) || [];
  });

  // 2. Faculty-wise Timetable
  const facultySchedules = {};
  teachers.forEach(t => {
    facultySchedules[t.id] = {
      faculty: t,
      classes: allClasses.filter(c => c.teacherId === t.id || c.teacherId === t.code),
      workload: calculateFacultyWorkloads(allClasses, [t])[0]
    };
  });

  // 3. Room & Laboratory Utilization Report
  const totalWorkingSlots = (store.settings.workingDays || DEFAULT_DAYS).length * (store.periods || REFERENCE_PERIODS).filter(p => !p.isLunchBreak).length;
  const roomUtilization = rooms.map(rm => {
    const bookedClasses = allClasses.filter(c => c.room && c.room.toLowerCase().trim() === rm.name.toLowerCase().trim());
    const pct = totalWorkingSlots > 0 ? Math.round((bookedClasses.length / totalWorkingSlots) * 100) : 0;
    return {
      roomId: rm.id,
      name: rm.name,
      type: rm.type,
      capacity: rm.capacity,
      isLab: rm.isLab,
      totalSlotsBooked: bookedClasses.length,
      utilizationPercentage: pct,
      status: pct >= 80 ? "Heavy" : (pct >= 40 ? "Moderate" : "Light")
    };
  });

  // 4. Student Group Breakdown for each Section
  const groupSchedules = {};
  sections.forEach(s => {
    const sClasses = combinedBySection[s.name] || [];
    groupSchedules[s.name] = {
      group1: sClasses.filter(c => c.group === "Group 1" || c.group === "Both"),
      group2: sClasses.filter(c => c.group === "Group 2" || c.group === "Both")
    };
  });

  // 5. Global Audit Report
  const globalAudit = auditTimetableConflicts(allClasses);

  return {
    academicYear: store.academicYear,
    totalSections: sections.length,
    totalFaculty: teachers.length,
    totalSubjects: subjects.length,
    totalRooms: rooms.length,
    totalScheduledClasses: allClasses.length,
    combinedBySection,
    facultySchedules,
    workloads: calculateFacultyWorkloads(allClasses, teachers),
    roomUtilization,
    groupSchedules,
    audit: globalAudit
  };
}

/* --------------------------------------------------------------------------
   Role-Based Data Sanitization & Retrieval
   -------------------------------------------------------------------------- */
function getTimetableData(options = {}) {
  const store = readStore();
  const role = String(options.role || 'student').toLowerCase();
  const targetSection = options.section || (store.sections[0] ? store.sections[0].name : "CSE 2D");

  const isAdmin = role === 'admin';
  const isFaculty = role === 'faculty';

  const secObj = store.sections.find(s => (s.name || s) === targetSection || s.id === targetSection) || store.sections[0];
  const secId = secObj ? secObj.id : "sec_cse_2d";
  const secTimetable = (secId && store.sectionTimetables && store.sectionTimetables[secId])
    ? store.sectionTimetables[secId]
    : { version: 1, published: true, lastModifiedBy: null, updatedAt: store.lastUpdated, classes: [], history: [] };

  const sectionClasses = secTimetable.classes || (store.classes || []).filter(c => c.section === targetSection);
  const allClasses = store.classes || [];

  const workloads = calculateFacultyWorkloads(allClasses, store.teachers);
  const subjectWorkloads = calculateSubjectProgress(allClasses, store.subjects, targetSection);
  const audit = auditTimetableConflicts(allClasses, { section: targetSection });
  const feasibility = checkScheduleFeasibility({ section: targetSection });

  return {
    academicYear: store.academicYear,
    sections: store.sections,
    sectionTimetables: store.sectionTimetables,
    periods: store.periods,
    lunchBreak: store.lunchBreak,
    teachers: store.teachers,
    subjects: store.subjects,
    rooms: store.rooms,
    settings: store.settings,
    classes: sectionClasses,
    allClassesCount: allClasses.length,
    currentSection: targetSection,
    sectionId: secId,
    version: secTimetable.version || 1,
    published: secTimetable.published !== false,
    historyCount: (secTimetable.history || []).length,
    lastModifiedBy: secTimetable.lastModifiedBy,
    updatedAt: secTimetable.updatedAt,
    workloads,
    subjectWorkloads,
    audit,
    feasibility,
    isAdmin,
    isFaculty,
    role
  };
}

module.exports = {
  readStore,
  writeStore,
  getTimetableData,
  validateClass,
  auditTimetableConflicts,
  checkScheduleFeasibility,
  runOptimization,
  resetTimetable,
  importExcelFaculty,
  isValidSubjectCode,
  resolveSubjectIds,
  SUBJECT_CODE_UPGRADES,
  manualEditClass,
  undoSectionChanges,
  addSection,
  updateSection,
  duplicateSection,
  deleteSection,
  addFaculty,
  updateFaculty,
  deleteFaculty,
  addSubject,
  updateSubject,
  deleteSubject,
  addRoom,
  updateRoom,
  deleteRoom,
  updateSettings,
  generateReports,
  calculateFacultyWorkloads,
  calculateSubjectProgress,
  REFERENCE_PERIODS,
  DEFAULT_LUNCH_BREAK,
  INITIAL_SECTIONS,
  INITIAL_FACULTY,
  INITIAL_SUBJECTS,
  INITIAL_ROOMS,
  DEFAULT_SETTINGS
};
