# Nova AI Study Assistant — Technical Architecture & Tech Stack Manual

**Version:** 1.0.0 (Production Edition)  
**Target Platform:** AKTU CBCS Curriculum & Modern Web (Node.js LTS)  
**Binary PDF File:** [Download nova_tech_stack_architecture.pdf](nova_tech_stack_architecture.pdf)  
**Live Endpoint:** `/tech-stack.pdf` | **Web Viewer:** `/tech-stack.html`

---

## 1. Executive Summary

Nova AI Study Assistant is an enterprise-grade academic learning companion designed for university students (featuring official AKTU CBCS curriculums for B.Tech CSE). The system integrates intelligent generative AI tutoring, syllabus unit tracking, interactive countdown tests, active recall flashcards, and timetable management into an ultra-fast, offline-resilient full-stack web application with zero third-party framework dependencies in the presentation layer.

---

## 2. Core System Specifications

| Layer / Component | Technology | Description & Responsibility |
| :--- | :--- | :--- |
| **Runtime Platform** | Node.js (LTS) & Express.js 4.19 | Non-blocking asynchronous REST API server handling student sessions, AI proxying, and grading. |
| **Frontend Architecture** | Modern Vanilla ES6+, Semantic HTML5, CSS3 | Zero-framework presentation layer. Instant loading, zero build latency, and accessible semantic DOM. |
| **AI Engine** | Google Gemini 2.5 Flash via `@google/genai` (v2.21) | Context-grounded study tutoring, syllabus question generation, lecture notes PDF summarization. |
| **Primary Cloud Database** | MongoDB Atlas (Mongoose v8.5) | Cloud document persistence for user credentials, conversation history, and coursework tasks. |
| **Local Zero-Config Fallback** | Filesystem JSON Store (`/data/*.json`) | Thread-safe server-side persistence ensuring data continuity even when disconnected from MongoDB. |
| **Client Storage** | Browser IndexedDB (`db.js`) + LocalStorage | Offline task ledger, flashcard revision states, session tokens, and active test countdowns. |
| **Cloud Services** | Firebase (v13.0.0 & `firebase-applet-config.json`) | Firestore and user identity synchronization. |
| **Port & Protocol** | Port 3000 (0.0.0.0) | HTTP REST API with CORS enablement and 25MB payload parsing. |

---

## 3. High-Level Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
|                         USER / CLIENT BROWSER (PORT 3000)                         |
|   +---------------------------------------------------------------------------+   |
|   |  index.html (Semantic SPA)                                                |   |
|   |  +-------------+  +-------------+  +---------------+  +----------------+  |   |
|   |  | Dashboard   |  | AI Chat     |  | Flashcards    |  | Tests & Exams  |  |   |
|   |  | & Progress  |  | & Summarizer|  | & Pomodoro    |  | Unit Practice  |  |   |
|   |  +-------------+  +-------------+  +---------------+  +----------------+  |   |
|   |  +-------------+  +-------------+  +---------------+  +----------------+  |   |
|   |  | Timetable   |  | Assignment  |  | AKTU Courses  |  | Floating Nova  |  |   |
|   |  | Section CSE |  | Tracker     |  | Syllabus Hub  |  | Chat Widget    |  |   |
|   |  +-------------+  +-------------+  +---------------+  +----------------+  |   |
|   |  Client DB: IndexedDB (Users, Tasks, Deck Progress) + LocalStorage Cache   |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------+-----------------------------------------+
                                          | HTTP REST (JSON / Multipart)
                                          v
+-----------------------------------------------------------------------------------+
|                         NODE.JS / EXPRESS BACKEND (server.js)                     |
|   +------------------------------------+ +------------------------------------+   |
|   |  Routing & Middleware              | |  Specialized Modules               |   |
|   |  - CORS & 25MB Body Parser         | |  - backend/tests-exam-service.js   |   |
|   |  - /api/chat & /api/conversations  | |  - backend/timetable-service.js    |   |
|   |  - /api/auth & /api/tasks          | |  - miniproject/Progress-api.js     |   |
|   +------------------+-----------------+ +------------------+-----------------+   |
+----------------------|--------------------------------------|---------------------+|
                       |                                      |
                       v                                      v
+------------------------------------+ +--------------------------------------------+
|   TIERED DATA STORAGE              | |   GOOGLE GEMINI AI PLATFORM                |
|   1. MongoDB Atlas (Mongoose v8.5) | |   SDK: @google/genai (v2.21.0)             |
|   2. Local JSON Storage (/data/*)  | |   Model: gemini-2.5-flash                  |
|   3. Firebase (Firestore / Auth)   | |   Functions: Chat, Summarize, Gen Questions|
+------------------------------------+ +--------------------------------------------+
```

---

## 4. Key Subsystems

1. **AI Study Chat & Multimodal Summarization**:
   - Built on `@google/genai` (v2.21.0) using `gemini-2.5-flash`.
   - Pedagogical system instructions primed with university computer science concepts.
   - Multi-conversation persistence allowing students to maintain subject-specific chat sessions without losing context.
   - Upload & summarize lecture notes (PDF/text).

2. **Official AKTU CBCS Courseware Registry**:
   - Covers core subjects: `BCS-301` (Data Structures), `BCS-302` (COA), `BAS-303` (Maths IV), `BAS-301` (Environment), `BCS-303` (Discrete Maths), and `BCC-302` (Python).
   - Unit-by-unit syllabus outlines, marks weightage (14 Marks/unit), and prescribed textbooks.

3. **Interactive Tests & Examination Engine**:
   - Timed mock exam simulation with real-time countdown timer.
   - Question palette with navigation and answer review flags.
   - Automatic grading with a 6-metric scorecard and unit-by-unit mastery analysis bars.

4. **Section-Wise Timetable Service**:
   - Complete lecture schedules for sections CSE 2A through CSE 2D.
   - Real-time indicator for active class, upcoming class, lab schedules, and assigned professors.

5. **Spaced Repetition Flashcards & Pomodoro Timer**:
   - Subject-specific flashcards with active recall ratings (*Again, Hard, Good, Easy*).
   - Integrated 25-minute Pomodoro study focus timer with sound and milestone tracking.

6. **Assignments & Coursework Manager**:
   - Due date tracker with priority sorting (High/Medium/Low).
   - Milestone badges: *Overdue*, *Due Soon (within 72h)*, and *Completed*.

---

## 5. REST API Reference

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/chat` | Send message to Gemini AI, returns answer and persists conversation |
| `GET` | `/api/conversations` | Retrieve all saved conversation threads for authenticated student |
| `POST` | `/api/conversations` | Create a new independent conversational thread with academic context |
| `POST` | `/api/login` / `/api/signup` | Authenticate user against MongoDB or persistent local credential store |
| `GET` / `POST` | `/api/tasks` | Query or append daily study tasks and goal milestones |
| `GET` / `POST` | `/api/assignments` | CRUD endpoints for tracking course assignments, due dates, and links |
| `GET` | `/api/timetable/:section` | Fetch weekly lecture and lab timetable for chosen CSE section |
| `POST` | `/api/tests/evaluate` | Evaluate submitted mock or unit test; computes score & unit breakdowns |
| `GET` | `/api/tests/analytics/:email` | Calculate aggregate statistics, average percentage, and mastery rates |
| `GET` | `/tech-stack.pdf` | Download or stream the generated binary technical manual PDF |

---

## 6. PDF Availability

The complete 4-page PDF document is generated and available at:
- **Server URL:** [`/tech-stack.pdf`](/tech-stack.pdf)
- **Direct File:** `miniproject/assets/nova-tech-stack-documentation.pdf`
- **Artifact File:** `.aistudio/artifacts/brain/b5178215-83e0-451e-a121-5676a82d6c57/nova_tech_stack_architecture.pdf`
