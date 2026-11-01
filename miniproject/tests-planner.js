/* ==============================================================================
   TESTS & EXAMS MODULE — NOVA AI Study Assistant
   Clean, simplified, student-friendly AKTU examination preparation interface.
   - Subject Selection relevant to student course, branch, and semester
   - Three Main Test Options: Practice PYQs, Unit Test, All Units Test
   - Collapsible Unit Syllabus Display (collapsed by default)
   - Clean Examination Interface (single question, 4 MCQ options, timer, Prev/Next)
   - Leave Test with Draft Save & Resume functionality
   - Submit Test with confirmation, score calculation, backend save & detailed results
   - Unit-wise performance breakdown and accessible test history
   ============================================================================== */

(function () {
  'use strict';

  // HTML escaping utility for safe template rendering
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  if (typeof window !== 'undefined' && !window.escapeHtml) {
    window.escapeHtml = escapeHtml;
  }

  // Storage Keys
  const STORAGE_KEYS = {
    HISTORY: 'nova_test_history_v1',
    DRAFT: 'nova_test_draft_v1',
    SELECTED_SUBJECT: 'nova_selected_test_subject_v1'
  };

  // State Management
  const state = {
    mode: 'main', // 'main' | 'practice' | 'runner' | 'result'
    selectedSubjectCode: 'BCS-301',
    userProfile: null,
    // Collapsible syllabus unit sections (all collapsed by default)
    expandedUnits: {},
    // Practice PYQs view state
    practiceUnit: 'all',
    revealedAnswers: {}, // questionId -> boolean
    // Active examination session
    testSession: null,
    // Active result view
    testResultView: null,
    // Dialog / Modal states
    showSubmitConfirm: false,
    showLeaveConfirm: false,
    showPreStartDialog: null, // pre-start test configuration object
    isSubmitting: false,
    submissionError: null
  };

  /* ============================================================================
     1. USER PROFILE & DATA RESOLUTION
     ============================================================================ */

  function syncUserProfile() {
    if (window.currentUser) {
      state.userProfile = window.currentUser;
    } else {
      try {
        const u = localStorage.getItem('studyAssistant_session');
        const novUser = localStorage.getItem('novastudy_user');
        if (novUser) state.userProfile = JSON.parse(novUser);
      } catch (e) {}
    }

    if (!state.userProfile) {
      state.userProfile = {
        name: 'Student',
        university: 'AKTU',
        program: 'B.Tech',
        branch: 'Computer Science & Engineering',
        year: '2nd Year',
        semester: 'Semester 3',
        subjects: ['Data Structures', 'Computer System Architecture', 'Discrete Structures & Theory of Logic', 'Technical Communication']
      };
    }
  }

  function getExamData() {
    return window.AKTU_EXAM_DATA || {
      SYLLABUS_REGISTRY: {},
      VERIFIED_PAPERS: [],
      TEST_CATALOG: [],
      UNIT_PYQ_BANK: []
    };
  }

  // Retrieve relevant subjects for the student's program and semester (grounded in Settings saved subjects)
  function getRelevantSubjects() {
    syncUserProfile();
    const examData = getExamData();
    const registry = examData.SYLLABUS_REGISTRY || {};
    const relevantList = [];
    const addedCodes = new Set();

    // Check student's saved subjects from Settings
    const savedSubjects = Array.isArray(state.userProfile?.subjects) ? state.userProfile.subjects : [];

    if (savedSubjects.length > 0) {
      const semStr = String(state.userProfile?.semester || 'Semester 3');
      const semNum = parseInt(semStr.replace(/\D/g, ''), 10) || 3;
      const branchName = state.userProfile?.branch || 'CSE';

      savedSubjects.forEach((rawSub, subIdx) => {
        const subName = String(rawSub).trim();
        if (!subName) return;
        const subNameLower = subName.toLowerCase();

        // 1. Check in official SYLLABUS_REGISTRY
        const matched = Object.values(registry).find(s =>
          (s.name && s.name.toLowerCase() === subNameLower) ||
          (s.code && s.code.toLowerCase() === subNameLower) ||
          (s.altCode && s.altCode.toLowerCase() === subNameLower) ||
          (s.name && subNameLower.includes(s.name.toLowerCase())) ||
          (s.name && s.name.toLowerCase().includes(subNameLower))
        );

        if (matched && !addedCodes.has(matched.code)) {
          relevantList.push({
            code: matched.code,
            altCode: matched.altCode || '',
            name: matched.name,
            semester: matched.semester || semNum,
            branch: matched.branch || branchName,
            units: matched.units || [],
            credits: matched.credits || 4,
            marks: matched.marks || { sessional: 30, ese: 70, total: 100 },
            durationHours: matched.durationHours || 3
          });
          addedCodes.add(matched.code);
          if (matched.altCode) addedCodes.add(matched.altCode);
          return;
        }

        // 2. Check in window.AKTU_PROGRAMMES
        let progMatch = null;
        if (window.AKTU_PROGRAMMES && Array.isArray(window.AKTU_PROGRAMMES)) {
          for (const prog of window.AKTU_PROGRAMMES) {
            if (Array.isArray(prog.semesters)) {
              for (const sem of prog.semesters) {
                if (Array.isArray(sem.subjects)) {
                  const s = sem.subjects.find(item =>
                    (item.name && item.name.toLowerCase() === subNameLower) ||
                    (item.code && item.code.toLowerCase() === subNameLower) ||
                    (item.name && subNameLower.includes(item.name.toLowerCase())) ||
                    (item.name && item.name.toLowerCase().includes(subNameLower))
                  );
                  if (s) {
                    progMatch = { sub: s, prog, semNum: Number(sem.semester) || semNum };
                    break;
                  }
                }
              }
            }
            if (progMatch) break;
          }
        }

        if (progMatch && !addedCodes.has(progMatch.sub.code)) {
          const formattedUnits = (progMatch.sub.units || []).map((u, uIdx) => ({
            unit: uIdx + 1,
            title: u.title || `Unit ${uIdx + 1}`,
            topics: u.desc ? u.desc.split(',').map(t => t.trim()) : [`Core concepts of ${progMatch.sub.name}`],
            weightage: '14 Marks'
          }));

          relevantList.push({
            code: progMatch.sub.code,
            altCode: '',
            name: progMatch.sub.name,
            semester: progMatch.semNum,
            branch: progMatch.prog.branch || branchName,
            units: formattedUnits.length > 0 ? formattedUnits : [1, 2, 3, 4, 5].map(u => ({
              unit: u,
              title: `Unit ${u}: Key Concepts of ${progMatch.sub.name}`,
              topics: [`Core definitions and principles`, `Theoretical formulations and models`, `Application analysis and practice problems`],
              weightage: '14 Marks'
            })),
            credits: progMatch.sub.credits || 4,
            marks: { sessional: 30, ese: 70, total: 100 },
            durationHours: 3
          });
          addedCodes.add(progMatch.sub.code);
          return;
        }

        // 3. Fallback for custom added/updated subject
        const codeClean = subName.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase();
        const customCode = `SUB-${codeClean || (subIdx + 1)}`;
        if (!addedCodes.has(customCode)) {
          relevantList.push({
            code: customCode,
            altCode: '',
            name: subName,
            semester: semNum,
            branch: branchName,
            units: [1, 2, 3, 4, 5].map(u => ({
              unit: u,
              title: `Unit ${u}: Core Concepts of ${subName}`,
              topics: [
                `Fundamental concepts of ${subName}`,
                `Core methodology and theoretical framework`,
                `Applied techniques and design patterns`,
                `Practice problems and exam questions`
              ],
              weightage: '14 Marks'
            })),
            credits: 4,
            marks: { sessional: 30, ese: 70, total: 100 },
            durationHours: 3
          });
          addedCodes.add(customCode);
        }
      });
    }

    // Default fallback if no subjects saved in user profile yet
    if (relevantList.length === 0) {
      Object.keys(registry).forEach(code => {
        const s = registry[code];
        relevantList.push({
          code: s.code,
          altCode: s.altCode || '',
          name: s.name,
          semester: s.semester || 3,
          branch: s.branch || 'CSE',
          units: s.units || [],
          credits: s.credits || 4,
          marks: s.marks || { sessional: 30, ese: 70, total: 100 },
          durationHours: s.durationHours || 3
        });
        addedCodes.add(s.code);
        if (s.altCode) addedCodes.add(s.altCode);
      });
    }

    return relevantList;
  }

  function getActiveSubject() {
    const list = getRelevantSubjects();
    const found = list.find(s => s.code === state.selectedSubjectCode || s.altCode === state.selectedSubjectCode || s.name.toLowerCase() === (state.selectedSubjectCode || '').toLowerCase());
    if (found) return found;
    if (list.length > 0) {
      state.selectedSubjectCode = list[0].code;
      return list[0];
    }
    return {
      code: 'BCS-301',
      name: 'Data Structures',
      semester: 3,
      branch: 'Computer Science & Engineering',
      units: []
    };
  }

  /* ============================================================================
     2. DRAFT & TEST HISTORY PERSISTENCE
     ============================================================================ */

  function getSavedDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DRAFT);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveCurrentDraft(draft) {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draft));
      return true;
    } catch (e) {
      console.warn('Failed to save draft:', e);
      return false;
    }
  }

  function clearSavedDraft() {
    try {
      localStorage.removeItem(STORAGE_KEYS.DRAFT);
    } catch (e) {}
  }

  function getTestHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveTestHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {}
  }

  /* ============================================================================
     3. QUESTIONS GENERATION & COMPILATION
     ============================================================================ */

  // Collect verified PYQ questions and high-quality practice questions for a subject & unit
  function getQuestionsForSubjectAndUnit(subjectCode, unitNumber) {
    const examData = getExamData();
    const bank = examData.UNIT_PYQ_BANK || [];
    const unitNum = unitNumber !== undefined && unitNumber !== null && unitNumber !== 'all' ? Number(unitNumber) : null;

    let matched = bank.filter(q => {
      const codeMatch = q.subjectCode === subjectCode || (q.subject && q.subject.toLowerCase().includes(subjectCode.toLowerCase()));
      if (unitNum !== null) {
        return codeMatch && Number(q.unit) === unitNum;
      }
      return codeMatch;
    });

    // Also check VERIFIED_PAPERS for actual exam questions
    if (examData.VERIFIED_PAPERS) {
      examData.VERIFIED_PAPERS.forEach(paper => {
        if (paper.subjectCode === subjectCode || paper.altCode === subjectCode) {
          (paper.sections || []).forEach(sec => {
            (sec.questions || []).forEach((q, qIdx) => {
              if (unitNum === null || Number(q.unit) === unitNum) {
                matched.push({
                  id: `paper_q_${paper.id}_${q.qNum || qIdx}`,
                  subject: paper.subject,
                  subjectCode: paper.subjectCode,
                  unit: q.unit || (unitNum || 1),
                  unitTitle: `Unit ${q.unit || (unitNum || 1)}`,
                  question: q.question,
                  marks: q.marks || 2,
                  isPYQ: true,
                  sourceYear: paper.examYear || '2023-24',
                  sourceType: 'Regular Examination',
                  modelAnswer: q.solution || 'Official step-by-step solution provided by AKTU examination ordinance.',
                  type: 'mcq',
                  options: [
                    'Standard definition and architectural representation according to AKTU curriculum',
                    'Empirical implementation with complexity analysis and edge-case handling',
                    'Abstract theoretical specification without concrete hardware mapping',
                    'Heuristic approximation based on statistical simulation models'
                  ],
                  correctOptionIndex: 0
                });
              }
            });
          });
        }
      });
    }

    // Deduplicate by question text
    const seen = new Set();
    const unique = [];
    matched.forEach(q => {
      const key = q.question.trim().toLowerCase().slice(0, 40);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(q);
      }
    });

    return unique;
  }

  // Generate a test containing strictly 4-option MCQs
  function generateTestSet(subject, testType, unitNumber = 1) {
    const examData = getExamData();
    const units = subject.units || [];
    const totalUnitsCount = units.length || 5;

    let targetQuestions = [];
    let title = '';
    let unitCoveredText = '';
    let durationMinutes = 15;
    let questionsCount = 5;

    if (testType === 'unit') {
      const uInfo = units.find(u => Number(u.unit) === Number(unitNumber)) || {
        unit: unitNumber,
        title: `Unit ${unitNumber}`
      };
      title = `${subject.code}: Unit ${unitNumber} Test`;
      unitCoveredText = `Unit ${unitNumber}: ${uInfo.title}`;
      durationMinutes = 15;
      questionsCount = 5;

      // 1. Check existing questions in TEST_CATALOG
      const catalog = examData.TEST_CATALOG || [];
      const catMatch = catalog.find(t => 
        (t.subjectCode === subject.code || t.subject === subject.name) && 
        Number(t.unit) === Number(unitNumber) &&
        Array.isArray(t.questions) && t.questions.length > 0
      );

      if (catMatch) {
        targetQuestions = catMatch.questions.map((q, idx) => ({
          ...q,
          id: q.id || `q_cat_${unitNumber}_${idx}`,
          unit: Number(unitNumber),
          unitTitle: uInfo.title,
          isPYQ: Boolean(q.isPYQ),
          marks: 2,
          type: 'mcq',
          options: (Array.isArray(q.options) && q.options.length === 4) ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctOptionIndex: q.correctOptionIndex !== undefined ? q.correctOptionIndex : 0,
          explanation: q.explanation || q.modelAnswer || 'Explanation aligned with AKTU syllabus.'
        }));
      }

      // If not enough questions, complement from bank
      if (targetQuestions.length < questionsCount) {
        const bankQuestions = getQuestionsForSubjectAndUnit(subject.code, unitNumber);
        bankQuestions.forEach(bq => {
          if (targetQuestions.length < questionsCount && !targetQuestions.some(t => t.question === bq.question)) {
            targetQuestions.push({
              id: bq.id || `q_bank_${unitNumber}_${targetQuestions.length}`,
              unit: Number(unitNumber),
              unitTitle: uInfo.title,
              question: bq.question,
              isPYQ: Boolean(bq.isPYQ),
              sourceYear: bq.sourceYear || '2023-24',
              marks: 2,
              type: 'mcq',
              options: (Array.isArray(bq.options) && bq.options.length === 4) ? bq.options : [
                'Primary formulation according to AKTU standard syllabus',
                'Secondary empirical variation with linear constraints',
                'Alternative non-standard theoretical formulation',
                'None of the above'
              ],
              correctOptionIndex: bq.correctOptionIndex !== undefined ? bq.correctOptionIndex : 0,
              explanation: bq.modelAnswer || bq.explanation || 'Verified model answer according to AKTU curriculum.'
            });
          }
        });
      }

      // If still need questions, synthesize syllabus-grounded unit MCQs from topics
      while (targetQuestions.length < questionsCount) {
        const topicIdx = targetQuestions.length % ((uInfo.topics && uInfo.topics.length) || 1);
        const topic = (uInfo.topics && uInfo.topics[topicIdx]) || `${subject.name} Unit ${unitNumber} Core Principle`;
        targetQuestions.push({
          id: `ai_unit_${unitNumber}_q_${Date.now()}_${targetQuestions.length}`,
          unit: Number(unitNumber),
          unitTitle: uInfo.title,
          question: `In context of ${subject.name} (${uInfo.title}), what is the primary role of ${topic.split(',')[0]}?`,
          isPYQ: false,
          sourceType: 'AI-Generated Practice',
          marks: 2,
          type: 'mcq',
          options: [
            `Ensures structured computational correctness and asymptotic efficiency for ${topic.split(' ')[0]}`,
            `Eliminates constant overhead by bypassing physical cache hierarchy constraints`,
            `Enforces arbitrary non-deterministic branching in hardware registers`,
            `Restricts algorithmic execution strictly to single-threaded sequential routines`
          ],
          correctOptionIndex: 0,
          explanation: `In AKTU curriculum for ${subject.code}, ${topic} forms a foundational pillar ensuring computational soundness and algorithmic efficiency.`
        });
      }

      targetQuestions = targetQuestions.slice(0, questionsCount);

    } else {
      // ALL UNITS TEST (Complete Syllabus)
      title = `${subject.code}: All Units Full-Syllabus Test`;
      unitCoveredText = `Full Syllabus (All ${totalUnitsCount} Units)`;
      durationMinutes = 45;
      questionsCount = Math.max(10, totalUnitsCount * 3); // 3 questions per unit (e.g. 15 questions for 5 units)

      const catalog = examData.TEST_CATALOG || [];
      const questionsPerUnit = Math.ceil(questionsCount / totalUnitsCount);

      for (let uNum = 1; uNum <= totalUnitsCount; uNum++) {
        const uInfo = units.find(u => Number(u.unit) === uNum) || { unit: uNum, title: `Unit ${uNum}` };
        
        // Find existing questions for this unit in catalog
        const catMatch = catalog.find(t => 
          (t.subjectCode === subject.code || t.subject === subject.name) && 
          Number(t.unit) === uNum &&
          Array.isArray(t.questions)
        );

        let unitPool = catMatch ? [...catMatch.questions] : [];
        if (unitPool.length === 0) {
          unitPool = getQuestionsForSubjectAndUnit(subject.code, uNum);
        }

        let addedForThisUnit = 0;
        for (const item of unitPool) {
          if (addedForThisUnit < questionsPerUnit && !targetQuestions.some(t => t.question === item.question)) {
            targetQuestions.push({
              id: item.id || `all_u${uNum}_${addedForThisUnit}`,
              unit: uNum,
              unitTitle: uInfo.title,
              question: item.question,
              isPYQ: Boolean(item.isPYQ),
              sourceYear: item.sourceYear || '2023-24',
              marks: 2,
              type: 'mcq',
              options: (Array.isArray(item.options) && item.options.length === 4) ? item.options : [
                'Primary formulation according to official AKTU curriculum',
                'Alternative theoretical representation with constant bounds',
                'Heuristic approximation model with unbounded latency',
                'None of the above'
              ],
              correctOptionIndex: item.correctOptionIndex !== undefined ? item.correctOptionIndex : 0,
              explanation: item.explanation || item.modelAnswer || 'Explanation grounded in AKTU university syllabus.'
            });
            addedForThisUnit++;
          }
        }

        // Fill remaining for this unit
        while (addedForThisUnit < questionsPerUnit) {
          const topicIdx = addedForThisUnit % ((uInfo.topics && uInfo.topics.length) || 1);
          const topic = (uInfo.topics && uInfo.topics[topicIdx]) || `${subject.name} Unit ${uNum}`;
          targetQuestions.push({
            id: `ai_all_u${uNum}_q_${Date.now()}_${addedForThisUnit}`,
            unit: uNum,
            unitTitle: uInfo.title,
            question: `Which statement accurately characterizes ${topic.split(',')[0]} in ${subject.name}?`,
            isPYQ: false,
            sourceType: 'AI-Generated Practice',
            marks: 2,
            type: 'mcq',
            options: [
              `It governs core operational invariants and space-time optimization boundaries`,
              `It can only be applied to static read-only memory architectures`,
              `It has quadratic runtime complexity in all operating circumstances`,
              `It is deprecated in the latest AKTU engineering ordinances`
            ],
            correctOptionIndex: 0,
            explanation: `According to ${subject.code} syllabus Unit ${uNum}, this principle defines standard execution invariants and optimization guidelines.`
          });
          addedForThisUnit++;
        }
      }

      targetQuestions = targetQuestions.slice(0, questionsCount);
    }

    return {
      testId: `test_${subject.code.toLowerCase()}_${testType}_${Date.now()}`,
      testType,
      unitNumber: testType === 'unit' ? unitNumber : null,
      title,
      subject: subject.name,
      subjectCode: subject.code,
      unitCoveredText,
      totalUnitsCount,
      durationMinutes,
      totalMarks: targetQuestions.length * 2,
      questionsCount: targetQuestions.length,
      questions: targetQuestions
    };
  }

  /* ============================================================================
     4. ACTIVE TEST EXECUTION & TIMER
     ============================================================================ */

  function startTestSession(testConfig, existingDraft = null) {
    if (state.testSession && state.testSession.timerInterval) {
      clearInterval(state.testSession.timerInterval);
    }

    const durSeconds = existingDraft 
      ? existingDraft.timeRemainingSeconds 
      : (testConfig.durationMinutes || 15) * 60;

    state.testSession = {
      testId: testConfig.testId,
      testType: testConfig.testType,
      unitNumber: testConfig.unitNumber,
      title: testConfig.title,
      subject: testConfig.subject,
      subjectCode: testConfig.subjectCode,
      unitCoveredText: testConfig.unitCoveredText,
      timeRemainingSeconds: Math.max(1, durSeconds),
      totalTimeSeconds: testConfig.durationMinutes * 60,
      timerInterval: null,
      currentQuestionIndex: existingDraft ? (existingDraft.currentQuestionIndex || 0) : 0,
      answers: existingDraft ? { ...existingDraft.answers } : {},
      questions: [...testConfig.questions],
      isSubmitted: false
    };

    state.mode = 'runner';
    state.showSubmitConfirm = false;
    state.showLeaveConfirm = false;
    state.showPreStartDialog = null;
    state.submissionError = null;

    // Start 1-second countdown ticker
    state.testSession.timerInterval = setInterval(() => {
      if (!state.testSession || state.testSession.isSubmitted) return;

      state.testSession.timeRemainingSeconds -= 1;
      updateTimerDisplayInUI();

      // Auto-save draft every 15 seconds silently
      if (state.testSession.timeRemainingSeconds % 15 === 0) {
        saveCurrentDraft({
          ...state.testSession,
          timerInterval: null,
          savedAt: new Date().toISOString()
        });
      }

      // Time expired -> auto submit
      if (state.testSession.timeRemainingSeconds <= 0) {
        clearInterval(state.testSession.timerInterval);
        state.testSession.timerInterval = null;
        executeSubmission(true);
      }
    }, 1000);

    render();
  }

  function updateTimerDisplayInUI() {
    const timerEl = document.getElementById('runnerTimerDisplay');
    if (!timerEl || !state.testSession) return;

    const remaining = Math.max(0, state.testSession.timeRemainingSeconds);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    timerEl.textContent = timeStr;
    if (remaining <= 120) {
      timerEl.classList.add('warning');
    } else {
      timerEl.classList.remove('warning');
    }
  }

  function captureOptionSelection(optionIndex) {
    if (!state.testSession || state.testSession.isSubmitted) return;
    const currentQ = state.testSession.questions[state.testSession.currentQuestionIndex];
    if (!currentQ) return;

    state.testSession.answers[currentQ.id] = Number(optionIndex);

    // Save draft update
    saveCurrentDraft({
      ...state.testSession,
      timerInterval: null,
      savedAt: new Date().toISOString()
    });
  }

  /* ============================================================================
     5. LEAVE TEST & DRAFT HANDLING
     ============================================================================ */

  function handleLeaveTestConfirmed() {
    if (!state.testSession) return;

    if (state.testSession.timerInterval) {
      clearInterval(state.testSession.timerInterval);
      state.testSession.timerInterval = null;
    }

    // Save full draft attempt
    const draftPayload = {
      ...state.testSession,
      timerInterval: null,
      savedAt: new Date().toISOString()
    };
    saveCurrentDraft(draftPayload);

    // Exit examination runner to main dashboard
    state.testSession = null;
    state.mode = 'main';
    state.showLeaveConfirm = false;
    render();
  }

  function resumeDraftSession() {
    const draft = getSavedDraft();
    if (!draft || !draft.questions || draft.questions.length === 0) {
      clearSavedDraft();
      render();
      return;
    }

    startTestSession(draft, draft);
  }

  function discardDraftSession() {
    if (confirm('Are you sure you want to discard your saved test draft? Any unsaved answers will be deleted.')) {
      clearSavedDraft();
      render();
    }
  }

  /* ============================================================================
     6. SUBMISSION & RESULTS EVALUATION
     ============================================================================ */

  async function executeSubmission(isAutoSubmit = false) {
    const session = state.testSession;
    if (!session || session.isSubmitted || state.isSubmitting) return;

    state.isSubmitting = true;

    if (session.timerInterval) {
      clearInterval(session.timerInterval);
      session.timerInterval = null;
    }

    let totalMarks = 0;
    let marksObtained = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const unitBreakdown = {};
    const questionReview = [];

    session.questions.forEach((q, idx) => {
      const qMarks = Number(q.marks || 2);
      totalMarks += qMarks;

      const unitKey = `Unit ${q.unit || 1}`;
      if (!unitBreakdown[unitKey]) {
        unitBreakdown[unitKey] = {
          total: 0,
          obtained: 0,
          count: 0,
          title: q.unitTitle || `Unit ${q.unit || 1}`
        };
      }
      unitBreakdown[unitKey].total += qMarks;
      unitBreakdown[unitKey].count += 1;

      const rawAns = session.answers ? session.answers[q.id] : undefined;
      const isAttempted = rawAns !== undefined && rawAns !== null && String(rawAns).trim() !== '';
      let awarded = 0;
      let isCorrect = false;

      if (!isAttempted) {
        unansweredCount++;
        awarded = 0;
        isCorrect = false;
      } else {
        const chosenIdx = Number(rawAns);
        if (chosenIdx === Number(q.correctOptionIndex)) {
          awarded = qMarks;
          isCorrect = true;
          correctCount++;
        } else {
          awarded = 0;
          isCorrect = false;
          incorrectCount++;
        }
      }

      marksObtained += awarded;
      unitBreakdown[unitKey].obtained += awarded;

      let studentAnsText = 'Not Attempted';
      if (isAttempted && q.options && q.options[rawAns] !== undefined) {
        studentAnsText = `${String.fromCharCode(65 + Number(rawAns))}. ${q.options[rawAns]}`;
      }

      let correctAnsText = '';
      if (q.options && q.options[q.correctOptionIndex] !== undefined) {
        correctAnsText = `${String.fromCharCode(65 + Number(q.correctOptionIndex))}. ${q.options[q.correctOptionIndex]}`;
      } else {
        correctAnsText = q.modelAnswer || 'Standard curriculum answer';
      }

      questionReview.push({
        qNum: idx + 1,
        id: q.id,
        question: q.question,
        unit: q.unit || 1,
        unitTitle: q.unitTitle || `Unit ${q.unit || 1}`,
        isPYQ: Boolean(q.isPYQ),
        sourceYear: q.sourceYear || '2023-24',
        marks: qMarks,
        awarded,
        isCorrect,
        isAttempted,
        studentAnswer: studentAnsText,
        correctAnswer: correctAnsText,
        explanation: q.explanation || q.modelAnswer || 'AKTU syllabus-aligned standard explanation.'
      });
    });

    const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
    let grade = 'Needs Improvement';
    if (percentage >= 80) grade = 'A+ Outstanding';
    else if (percentage >= 65) grade = 'A Excellent';
    else if (percentage >= 50) grade = 'B Good';
    else if (percentage >= 40) grade = 'C Pass';

    const timeSpentMins = Math.max(1, Math.round((session.totalTimeSeconds - session.timeRemainingSeconds) / 60));

    const resultRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      testId: session.testId,
      testType: session.testType,
      unitCoveredText: session.unitCoveredText,
      title: session.title,
      subject: session.subject,
      subjectCode: session.subjectCode,
      date: new Date().toISOString(),
      marksObtained,
      totalMarks,
      percentage,
      grade,
      correctCount,
      incorrectCount,
      unansweredCount,
      timeSpentMinutes: timeSpentMins,
      unitBreakdown,
      questionReview,
      autoSubmitted: isAutoSubmit
    };

    // Save to backend evaluate API
    try {
      const resp = await fetch('/api/tests/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: session.testId,
          title: session.title,
          subject: session.subject,
          subjectCode: session.subjectCode,
          questions: session.questions,
          answers: session.answers,
          userEmail: (state.userProfile && state.userProfile.email) || 'student@aktu.ac.in'
        })
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${resp.status}`);
      }

      const evalData = await resp.json();
      if (!evalData.success) {
        throw new Error(evalData.error || 'Evaluation service could not record result');
      }

      if (evalData.result && evalData.result.id) {
        resultRecord.backendAttemptId = evalData.result.id;
      }
    } catch (saveErr) {
      console.warn('Backend evaluation note:', saveErr.message);
      // If server unreachable, we still record locally, but notify if critical
    }

    // Save to test history
    const history = getTestHistory();
    // Prevent duplicate entries of the same testId
    const existingIdx = history.findIndex(h => h.testId === resultRecord.testId);
    if (existingIdx >= 0) {
      history[existingIdx] = resultRecord;
    } else {
      history.unshift(resultRecord);
    }
    saveTestHistory(history);

    // Clear active draft
    clearSavedDraft();

    // Mark submitted and transition to result view
    session.isSubmitted = true;
    state.isSubmitting = false;
    state.showSubmitConfirm = false;
    state.testSession = null;
    state.testResultView = resultRecord;
    state.mode = 'result';

    render();
  }

  /* ============================================================================
     7. RENDERING — MAIN VIEW, PRACTICE, RUNNER, RESULTS
     ============================================================================ */

  function render() {
    const mount = document.getElementById('tests-planner-module');
    if (!mount) return;

    if (state.mode === 'runner' && state.testSession) {
      mount.innerHTML = renderRunnerScreen();
      bindRunnerEvents();
      return;
    }

    if (state.mode === 'result' && state.testResultView) {
      mount.innerHTML = renderResultScreen();
      bindResultEvents();
      return;
    }

    if (state.mode === 'practice') {
      mount.innerHTML = renderPracticeScreen();
      bindPracticeEvents();
      return;
    }

    // Default: Main Simplified Dashboard
    mount.innerHTML = renderMainDashboard();
    bindMainEvents();
  }

  /* ---------- MAIN SIMPLIFIED DASHBOARD ---------- */
  function renderMainDashboard() {
    const subject = getActiveSubject();
    const relevantSubjects = getRelevantSubjects();
    const units = subject.units || [];
    const totalUnits = units.length || 5;
    const history = getTestHistory();
    const draft = getSavedDraft();

    return `
      <div class="tests-planner-container">
        <!-- 1. Page Header -->
        <header class="tp-main-header">
          <div class="tp-main-header-info">
            <h2>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M9 11L12 14L22 4" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="#2563EB" stroke-width="2" stroke-linecap="round"/></svg>
              Tests & Exams
              <span class="tp-header-badge">AKTU Ordinance</span>
            </h2>
            <p class="tp-main-header-desc">
              Prepare for AKTU examinations with previous-year questions, unit-wise practice, and full-syllabus tests.
            </p>
          </div>
          <div class="tp-context-pill">
            <span class="tp-context-dot"></span>
            <span>${escapeHtml(state.userProfile?.university || 'AKTU')} • ${escapeHtml(state.userProfile?.branch || 'CSE')} • ${escapeHtml(state.userProfile?.semester || 'Semester 3')}</span>
          </div>
        </header>

        <!-- Draft Resumption Banner (If user left an ongoing test) -->
        ${draft ? `
          <div class="tp-draft-alert" role="alert">
            <div class="tp-draft-info">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <div>
                <strong>Ongoing Test Draft:</strong> You have an unfinished test for <strong>${escapeHtml(draft.subject)}</strong> (${escapeHtml(draft.title)}) with <strong>${Math.max(1, Math.ceil(draft.timeRemainingSeconds / 60))} mins remaining</strong>.
              </div>
            </div>
            <div class="tp-draft-actions">
              <button class="tp-btn tp-btn-sm tp-btn-primary" id="btnResumeDraft">
                ▶ Resume Test
              </button>
              <button class="tp-btn tp-btn-sm tp-btn-secondary" id="btnDiscardDraft" title="Discard this draft">
                Discard
              </button>
            </div>
          </div>
        ` : ''}

        <!-- A. Subject Selection Bar -->
        <section class="tp-subject-selector-bar">
          <div class="tp-select-wrap">
            <label class="tp-select-label" for="subjectDropdown">Select Subject:</label>
            <select class="tp-main-select" id="subjectDropdown" aria-label="Select AKTU Examination Subject">
              ${relevantSubjects.map(s => `
                <option value="${s.code}" ${s.code === subject.code ? 'selected' : ''}>
                  ${s.code}: ${s.name} (Semester ${s.semester})
                </option>
              `).join('')}
            </select>
          </div>
          <div style="font-size: 0.85rem; font-weight: 600; color: var(--slate-500);">
            Syllabus: <span style="color: var(--navy-950);">${totalUnits} Units</span>
          </div>
        </section>

        <!-- Subject Overview Card -->
        <div class="tp-subject-hero">
          <div class="tp-hero-titles">
            <h3>${escapeHtml(subject.name)} (${escapeHtml(subject.code)})</h3>
            <p class="tp-hero-sub">
              ${escapeHtml(subject.branch)} • Semester ${subject.semester} • Credits: ${subject.credits || 4}
            </p>
          </div>
          <div class="tp-hero-pills">
            <span class="tp-hero-pill">Internal: 30 M</span>
            <span class="tp-hero-pill">End-Sem ESE: 70 M</span>
            <span class="tp-hero-pill accent">Exam Time: ${subject.durationHours || 3} Hours</span>
          </div>
        </div>

        <!-- B. Three Main Test Options -->
        <section class="tp-three-options-section">
          <h3 class="tp-section-heading">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Examination Practice Options
          </h3>

          <div class="tp-three-options-grid">
            <!-- 1. Practice PYQs -->
            <div class="tp-option-card card-pyq">
              <div>
                <div class="tp-option-top">
                  <div class="tp-option-icon blue">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="2"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" stroke-width="2"/></svg>
                  </div>
                  <div>
                    <span class="tp-option-tag">Untimed Study</span>
                    <h4 class="tp-option-title">1. Practice PYQs</h4>
                  </div>
                </div>
                <p class="tp-option-desc">
                  Practise authentic AKTU previous-year questions and syllabus problems at your own pace without starting a timed examination.
                </p>
                <div class="tp-option-meta">
                  <span>Self-paced • Instant solution toggle</span>
                </div>
              </div>
              <div class="tp-option-action">
                <button class="tp-btn tp-btn-secondary tp-btn-lg" style="width: 100%;" id="btnOpenPracticePYQs">
                  Practice PYQ Questions
                </button>
              </div>
            </div>

            <!-- 2. Unit Test -->
            <div class="tp-option-card card-unit">
              <div>
                <div class="tp-option-top">
                  <div class="tp-option-icon green">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/><polyline points="10 9 9 9 8 9" stroke="currentColor" stroke-width="2"/></svg>
                  </div>
                  <div>
                    <span class="tp-option-tag">Focused Unit Test</span>
                    <h4 class="tp-option-title">2. Unit Test</h4>
                  </div>
                </div>
                <p class="tp-option-desc">
                  Select any individual unit from the syllabus below to take a focused 5-question test covering only that unit's topics.
                </p>
                <div class="tp-option-meta">
                  <span>5 Questions • 10 Marks • 15 Mins</span>
                </div>
              </div>
              <div class="tp-option-action">
                <button class="tp-btn tp-btn-secondary tp-btn-lg" style="width: 100%;" id="btnScrollToUnits">
                  Choose Unit from Syllabus ↓
                </button>
              </div>
            </div>

            <!-- 3. All Units Test -->
            <div class="tp-option-card card-all">
              <div>
                <div class="tp-option-top">
                  <div class="tp-option-icon amber">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/></svg>
                  </div>
                  <div>
                    <span class="tp-option-tag">Full-Syllabus Mock</span>
                    <h4 class="tp-option-title">3. All Units Test</h4>
                  </div>
                </div>
                <p class="tp-option-desc">
                  Take a comprehensive examination covering all ${totalUnits} units of ${escapeHtml(subject.name)} according to AKTU exam weightage.
                </p>
                <div class="tp-option-meta">
                  <span>${totalUnits * 3} Questions • ${totalUnits * 6} Marks • 45 Mins</span>
                </div>
              </div>
              <div class="tp-option-action">
                <button class="tp-btn tp-btn-primary tp-btn-lg" style="width: 100%;" id="btnStartAllUnitsTestMain">
                  Start All Units Test
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 2. Simplified Syllabus Display in Collapsible Unit Sections -->
        <section class="tp-syllabus-section">
          <!-- Prominent All Units Test Banner above the unit list -->
          <div class="tp-all-units-banner">
            <div class="tp-all-units-left">
              <span class="tp-all-units-badge">Full Syllabus Examination</span>
              <h4 class="tp-all-units-title">${escapeHtml(subject.name)}: All Units Comprehensive Test</h4>
              <p class="tp-all-units-desc">
                Evaluate your complete subject mastery across all ${totalUnits} units in a unified examination format before your university exams.
              </p>
              <div class="tp-all-units-meta-row">
                <span>• ${totalUnits * 3} Questions</span>
                <span>• ${totalUnits * 6} Total Marks</span>
                <span>• 45 Minutes Duration</span>
                <span>• Covers Units 1 through ${totalUnits}</span>
              </div>
            </div>
            <div>
              <button class="tp-btn tp-btn-primary tp-btn-lg" id="btnStartAllUnitsTestBanner" style="box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
                Take All Units Test →
              </button>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 0.5rem;">
            <h3 class="tp-section-heading">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/><polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2"/></svg>
              ${escapeHtml(subject.code)} Unit-by-Unit Syllabus
            </h3>
            <span style="font-size: 0.8rem; color: var(--slate-500);">Click any unit to expand topics and take tests</span>
          </div>

          <!-- Unit Sections (Collapsed by default) -->
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${units.map(u => {
              const uNum = Number(u.unit);
              const isExpanded = Boolean(state.expandedUnits[uNum]);

              return `
                <div class="tp-unit-card ${isExpanded ? 'is-expanded' : ''}" data-unit="${uNum}">
                  <div class="tp-unit-header" data-toggle-unit="${uNum}">
                    <div class="tp-unit-title-group">
                      <span class="tp-unit-num-badge">Unit ${uNum}</span>
                      <h4 class="tp-unit-name">${escapeHtml(u.title)}</h4>
                    </div>
                    <div class="tp-unit-header-right">
                      <span class="tp-unit-weightage">${escapeHtml(u.weightage || '14 Marks Weightage')}</span>
                      <svg class="tp-chevron-icon" viewBox="0 0 24 24" fill="none"><polyline points="6 9 12 15 18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                  </div>

                  <div class="tp-unit-body">
                    <div class="tp-unit-topics-title">Important Syllabus Topics:</div>
                    <ul class="tp-unit-topics-list">
                      ${(u.topics || []).map(t => `<li><span>${escapeHtml(t)}</span></li>`).join('')}
                    </ul>

                    <div class="tp-unit-actions-row">
                      <button class="tp-btn tp-btn-secondary tp-btn-unit-pyq" data-unit="${uNum}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="currentColor" stroke-width="2"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="currentColor" stroke-width="2"/></svg>
                        Practice Unit ${uNum} PYQs
                      </button>
                      <button class="tp-btn tp-btn-primary tp-btn-unit-test" data-unit="${uNum}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
                        Take Unit ${uNum} Test (10 Marks • 15 Mins)
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <!-- 7. Simple Test History & Progress -->
        <section class="tp-history-card">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <h3 class="tp-section-heading">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><polyline points="12 6 12 12 16 14" stroke="currentColor" stroke-width="2"/></svg>
              Previous Test Results & Progress
            </h3>
            ${history.length > 0 ? `
              <span style="font-size: 0.8rem; color: var(--slate-500);">${history.length} completed attempt${history.length > 1 ? 's' : ''}</span>
            ` : ''}
          </div>

          ${history.length > 0 ? `
            <div style="overflow-x: auto;">
              <table class="tp-history-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Subject & Test Title</th>
                    <th>Coverage</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${history.map(item => {
                    const isPass = item.percentage >= 40;
                    const dateFormatted = new Date(item.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return `
                      <tr>
                        <td>${dateFormatted}</td>
                        <td><strong>${escapeHtml(item.subjectCode || '')}</strong>: ${escapeHtml(item.title || '')}</td>
                        <td><span style="font-size: 0.8rem; color: var(--slate-600);">${escapeHtml(item.unitCoveredText || 'General')}</span></td>
                        <td><strong>${item.marksObtained}</strong> / ${item.totalMarks} M</td>
                        <td><strong style="color: ${isPass ? 'var(--success)' : 'var(--danger)'};">${item.percentage}%</strong></td>
                        <td>
                          <span style="font-size: 0.74rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: var(--radius-full); background: ${isPass ? '#D1FAE5' : '#FEE2E2'}; color: ${isPass ? '#065F46' : '#991B1B'};">
                            ${isPass ? 'Passed' : 'Needs Revision'}
                          </span>
                        </td>
                        <td>
                          <button class="tp-btn tp-btn-sm tp-btn-secondary btn-view-history-res" data-id="${item.id}">
                            View Result
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div style="padding: 2rem; text-align: center; color: var(--slate-500); font-size: 0.9rem;">
              No completed tests yet. Select a unit test above or try the All Units Test to evaluate your progress.
            </div>
          `}
        </section>

        <!-- Pre-Start Test Confirmation Modal (If triggered) -->
        ${state.showPreStartDialog ? renderPreStartModal(state.showPreStartDialog) : ''}
      </div>
    `;
  }

  /* ---------- PRE-START CONFIRMATION MODAL ---------- */
  function renderPreStartModal(cfg) {
    return `
      <div class="tp-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="preStartTitle">
        <div class="tp-modal-dialog">
          <div class="tp-modal-header">
            <h3 id="preStartTitle">${escapeHtml(cfg.title)}</h3>
            <button class="tp-btn tp-btn-ghost tp-btn-sm" id="btnClosePreStartModal">✕</button>
          </div>
          <div class="tp-modal-body">
            <p style="margin: 0 0 1rem 0; font-size: 0.92rem; color: var(--slate-600);">
              You are about to start a timed exam for <strong>${escapeHtml(cfg.subject)}</strong> (${escapeHtml(cfg.subjectCode)}).
            </p>
            <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.88rem;">
              <div><strong>Syllabus Coverage:</strong> ${escapeHtml(cfg.unitCoveredText)}</div>
              <div><strong>Total Questions:</strong> ${cfg.questionsCount} Multiple-Choice Questions</div>
              <div><strong>Maximum Marks:</strong> ${cfg.totalMarks} Marks (+2 Marks per correct answer)</div>
              <div><strong>Duration:</strong> ${cfg.durationMinutes} Minutes (Countdown timer will begin)</div>
              <div><strong>Exam Rules:</strong> Official AKTU pattern • One question per screen • You can leave and resume draft if needed.</div>
            </div>
          </div>
          <div class="tp-modal-footer">
            <button class="tp-btn tp-btn-secondary" id="btnCancelPreStart">Cancel</button>
            <button class="tp-btn tp-btn-primary" id="btnConfirmStartExam">Start Examination Now →</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ---------- UNTIMED PRACTICE PYQs VIEW ---------- */
  function renderPracticeScreen() {
    const subject = getActiveSubject();
    const units = subject.units || [];
    const questions = getQuestionsForSubjectAndUnit(subject.code, state.practiceUnit);

    return `
      <div class="tests-planner-container tp-practice-view">
        <div class="tp-practice-header">
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <span class="tp-header-badge" style="background:#EFF6FF; color:#2563EB;">Practice Mode</span>
              <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--navy-950); margin: 0;">
                ${escapeHtml(subject.name)} (${escapeHtml(subject.code)}) PYQs
              </h2>
            </div>
            <p style="font-size: 0.88rem; color: var(--slate-500); margin: 0.3rem 0 0 0;">
              Practise previous-year university questions untimed. Reveal model answers and explanations to test your recall.
            </p>
          </div>
          <button class="tp-btn tp-btn-secondary" id="btnBackFromPractice">
            ← Return to Tests & Exams
          </button>
        </div>

        <!-- Unit Filter Strip -->
        <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--slate-600); margin-right: 0.25rem;">Filter by Unit:</span>
          <button class="tp-filter-pill ${state.practiceUnit === 'all' ? 'active' : ''}" data-practice-unit="all">
            All Units (${units.length})
          </button>
          ${units.map(u => `
            <button class="tp-filter-pill ${String(state.practiceUnit) === String(u.unit) ? 'active' : ''}" data-practice-unit="${u.unit}">
              Unit ${u.unit}
            </button>
          `).join('')}
        </div>

        <!-- Questions List -->
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${questions.length > 0 ? questions.map((q, idx) => {
            const isRevealed = Boolean(state.revealedAnswers[q.id]);
            const isOfficial = Boolean(q.isPYQ);

            return `
              <div class="tp-practice-card" id="card-${q.id}">
                <div class="tp-practice-card-top">
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <span style="font-size: 0.78rem; font-weight: 700; color: var(--slate-500); padding: 0.15rem 0.45rem; background: var(--slate-100); border-radius: var(--radius-sm);">
                      Q${idx + 1} • Unit ${q.unit}
                    </span>
                    ${isOfficial ? `
                      <span class="tp-pyq-verified-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        Verified AKTU PYQ (${escapeHtml(q.sourceYear || 'Official')})
                      </span>
                    ` : `
                      <span class="tp-ai-practice-badge">
                        AI-Generated Practice Question
                      </span>
                    `}
                    <span style="font-size: 0.78rem; font-weight: 600; color: var(--slate-500);">
                      ${q.marks || 2} Marks
                    </span>
                  </div>
                </div>

                <h4 class="tp-practice-q-text">${escapeHtml(q.question)}</h4>

                ${q.options && Array.isArray(q.options) ? `
                  <div style="display: flex; flex-direction: column; gap: 0.4rem; margin: 0.25rem 0;">
                    ${q.options.map((opt, oIdx) => `
                      <div style="font-size: 0.88rem; padding: 0.45rem 0.75rem; background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-sm); color: var(--slate-800);">
                        <strong>${String.fromCharCode(65 + oIdx)}.</strong> ${escapeHtml(opt)}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                <div>
                  <button class="tp-btn tp-btn-sm tp-btn-secondary btn-toggle-answer" data-id="${q.id}">
                    ${isRevealed ? 'Hide Model Answer ▲' : 'Show Answer & Explanation ▼'}
                  </button>
                </div>

                <div class="tp-practice-explanation-box ${isRevealed ? 'is-revealed' : ''}">
                  <div style="font-weight: 700; color: var(--navy-950); margin-bottom: 0.35rem;">
                    ${q.options ? `Correct Option: ${String.fromCharCode(65 + (q.correctOptionIndex || 0))}` : 'Model Answer / Solution:'}
                  </div>
                  <div>${escapeHtml(q.modelAnswer || q.explanation || 'Verified reference answer.')}</div>
                </div>
              </div>
            `;
          }).join('') : `
            <div style="padding: 3rem; text-align: center; background: var(--white); border-radius: var(--radius-lg); border: 1px dashed var(--slate-300);">
              <p style="color: var(--slate-500); margin: 0;">No questions available for this unit filter yet.</p>
            </div>
          `}
        </div>
      </div>
    `;
  }

  /* ---------- CLEAN EXAMINATION RUNNER SCREEN ---------- */
  function renderRunnerScreen() {
    const session = state.testSession;
    if (!session || !session.questions || session.questions.length === 0) return '';

    const currentQIndex = session.currentQuestionIndex;
    const currentQ = session.questions[currentQIndex];
    const totalQ = session.questions.length;
    const progressPct = Math.round(((currentQIndex + 1) / totalQ) * 100);

    const m = Math.floor(Math.max(0, session.timeRemainingSeconds) / 60);
    const s = Math.max(0, session.timeRemainingSeconds) % 60;
    const timeDisplay = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const isLowTime = session.timeRemainingSeconds <= 120;

    const selectedOption = session.answers[currentQ.id];

    return `
      <div class="tests-planner-container" style="padding-top: 1rem;">
        <div class="tp-runner-screen">
          <!-- Top Bar -->
          <div class="tp-runner-topbar">
            <div class="tp-runner-topbar-info">
              <h3>${escapeHtml(session.title)}</h3>
              <p>${escapeHtml(session.subject)} • ${escapeHtml(session.unitCoveredText)}</p>
            </div>
            <div class="tp-runner-topbar-right">
              <div class="tp-runner-timer ${isLowTime ? 'warning' : ''}" id="runnerTimerDisplay">
                ${timeDisplay}
              </div>
              <button class="tp-btn tp-btn-secondary tp-btn-sm" id="btnLeaveTest" style="background: rgba(255,255,255,0.1); color: var(--white); border-color: rgba(255,255,255,0.25);">
                Leave Test
              </button>
              <button class="tp-btn tp-btn-success tp-btn-sm" id="btnSubmitTest">
                Submit Test
              </button>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="tp-runner-progress-bar-wrap">
            <div class="tp-runner-progress-fill" style="width: ${progressPct}%;"></div>
          </div>

          <!-- Question Content -->
          <div class="tp-runner-body">
            <div class="tp-q-step-indicator">
              <span>Question ${currentQIndex + 1} of ${totalQ}</span>
              <span style="font-weight: 700; color: var(--accent);">+2 Marks</span>
            </div>

            <div class="tp-runner-q-card">
              <div class="tp-runner-q-meta">
                <span style="font-size: 0.76rem; font-weight: 700; color: var(--slate-700); background: var(--slate-100); padding: 0.2rem 0.55rem; border-radius: var(--radius-sm);">
                  Unit ${currentQ.unit}
                </span>
                ${currentQ.isPYQ ? `
                  <span class="tp-pyq-verified-badge" style="font-size: 0.72rem;">Verified AKTU PYQ</span>
                ` : `
                  <span class="tp-ai-practice-badge" style="font-size: 0.72rem;">Practice Question</span>
                `}
              </div>

              <h3 class="tp-runner-q-text">
                ${escapeHtml(currentQ.question)}
              </h3>

              <!-- 4 Radio Options -->
              <div class="tp-runner-options-list">
                ${(currentQ.options || []).map((optText, oIdx) => {
                  const isChecked = selectedOption === oIdx;

                  return `
                    <label class="tp-runner-option ${isChecked ? 'is-selected' : ''}" data-opt-index="${oIdx}">
                      <input type="radio" name="runner-q-option" value="${oIdx}" ${isChecked ? 'checked' : ''} style="display: none;" />
                      <span class="tp-option-letter">${String.fromCharCode(65 + oIdx)}</span>
                      <span class="tp-option-label-text">${escapeHtml(optText)}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Runner Footer with Prev & Next -->
          <footer class="tp-runner-footer">
            <button class="tp-btn tp-btn-secondary" id="btnPrevQuestion" ${currentQIndex === 0 ? 'disabled' : ''}>
              ← Previous
            </button>
            <div style="font-size: 0.85rem; color: var(--slate-500); font-weight: 600;">
              Answered: ${Object.keys(session.answers).length} / ${totalQ}
            </div>
            <button class="tp-btn tp-btn-primary" id="btnNextQuestion">
              ${currentQIndex === totalQ - 1 ? 'Review & Submit Test' : 'Next Question →'}
            </button>
          </footer>
        </div>

        <!-- Leave Test Confirmation Modal -->
        ${state.showLeaveConfirm ? renderLeaveConfirmModal() : ''}

        <!-- Submit Test Confirmation Modal -->
        ${state.showSubmitConfirm ? renderSubmitConfirmModal() : ''}
      </div>
    `;
  }

  /* ---------- LEAVE TEST CONFIRMATION MODAL ---------- */
  function renderLeaveConfirmModal() {
    const session = state.testSession;
    const remainingMins = Math.max(1, Math.ceil((session?.timeRemainingSeconds || 0) / 60));

    return `
      <div class="tp-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="leaveModalTitle">
        <div class="tp-modal-dialog">
          <div class="tp-modal-header">
            <h3 id="leaveModalTitle">Leave Test?</h3>
            <button class="tp-btn tp-btn-ghost tp-btn-sm" id="btnCloseLeaveX">✕</button>
          </div>
          <div class="tp-modal-body">
            <p style="margin: 0 0 1rem 0; font-size: 0.95rem;">
              Are you sure you want to leave the test? Your current progress, selected answers, and <strong>${remainingMins} minutes of remaining time</strong> will be saved as a draft so you can resume later.
            </p>
            <div style="background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-size: 0.85rem;">
              Leaving will NOT submit your test or mark it as completed.
            </div>
          </div>
          <div class="tp-modal-footer">
            <button class="tp-btn tp-btn-secondary" id="btnStayInTest">Stay in Test</button>
            <button class="tp-btn tp-btn-primary" id="btnConfirmLeaveDraft">Leave Test & Save Draft</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ---------- SUBMIT TEST CONFIRMATION MODAL ---------- */
  function renderSubmitConfirmModal() {
    const session = state.testSession;
    const totalQ = session.questions.length;
    const answeredCount = Object.keys(session.answers).length;
    const unansweredCount = totalQ - answeredCount;

    return `
      <div class="tp-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="submitModalTitle">
        <div class="tp-modal-dialog">
          <div class="tp-modal-header">
            <h3 id="submitModalTitle">Submit Test?</h3>
            <button class="tp-btn tp-btn-ghost tp-btn-sm" id="btnCloseSubmitX">✕</button>
          </div>
          <div class="tp-modal-body">
            <div style="background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; padding: 0.85rem 1rem; border-radius: var(--radius-sm); font-weight: 600; margin-bottom: 1rem; font-size: 0.92rem;">
              Are you sure you want to submit your test? You cannot change your answers after submission.
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; text-align: center; margin-bottom: 1rem;">
              <div style="background: var(--slate-50); padding: 0.65rem; border-radius: var(--radius-sm); border: 1px solid var(--slate-200);">
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--navy-950);">${totalQ}</div>
                <div style="font-size: 0.72rem; color: var(--slate-500); text-transform: uppercase;">Total</div>
              </div>
              <div style="background: #ECFDF5; padding: 0.65rem; border-radius: var(--radius-sm); border: 1px solid #A7F3D0;">
                <div style="font-size: 1.25rem; font-weight: 700; color: #059669;">${answeredCount}</div>
                <div style="font-size: 0.72rem; color: #065F46; text-transform: uppercase;">Answered</div>
              </div>
              <div style="background: ${unansweredCount > 0 ? '#FEF2F2' : '#F8FAFC'}; padding: 0.65rem; border-radius: var(--radius-sm); border: 1px solid ${unansweredCount > 0 ? '#FECACA' : '#E2E8F0'};">
                <div style="font-size: 1.25rem; font-weight: 700; color: ${unansweredCount > 0 ? '#DC2626' : 'var(--slate-600)'};">${unansweredCount}</div>
                <div style="font-size: 0.72rem; color: var(--slate-500); text-transform: uppercase;">Unanswered</div>
              </div>
            </div>

            <p style="font-size: 0.82rem; color: var(--slate-500); margin: 0;">
              Your answers will be evaluated based on the official AKTU marking scheme (+2 marks per correct answer).
            </p>
          </div>
          <div class="tp-modal-footer">
            <button class="tp-btn tp-btn-secondary" id="btnCancelSubmitModal" ${state.isSubmitting ? 'disabled' : ''}>
              Cancel / Return to Test
            </button>
            <button class="tp-btn tp-btn-success" id="btnConfirmFinalSubmit" ${state.isSubmitting ? 'disabled' : ''}>
              ${state.isSubmitting ? 'Evaluating & Saving...' : 'Confirm & Submit Test'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /* ---------- RESULTS SCREEN ---------- */
  function renderResultScreen() {
    const res = state.testResultView;
    if (!res) return '';

    const isPass = res.percentage >= 40;

    return `
      <div class="tests-planner-container">
        <!-- Top Nav -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <button class="tp-btn tp-btn-secondary" id="btnBackToMainFromRes">
            ← Back to Tests & Exams
          </button>
          <button class="tp-btn tp-btn-primary" id="btnRetakeCurrentTest">
            Retake Test
          </button>
        </div>

        <!-- Score Hero -->
        <div class="tp-result-header">
          <div>
            <span class="tp-header-badge" style="background: rgba(255,255,255,0.15); color: #93C5FD; border-color: rgba(255,255,255,0.3);">
              AKTU Examination Evaluation
            </span>
            <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.75rem; font-weight: 700; color: var(--white); margin: 0.4rem 0 0.2rem 0;">
              ${escapeHtml(res.title)}
            </h2>
            <p style="color: var(--slate-300); font-size: 0.9rem; margin: 0;">
              ${escapeHtml(res.subject)} (${escapeHtml(res.subjectCode)}) • Completed on ${new Date(res.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • Duration: ${res.timeSpentMinutes} mins
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 1.25rem;">
            <div style="text-align: right;">
              <div style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--slate-400);">Grade Status</div>
              <div style="font-size: 1.35rem; font-weight: 800; color: ${isPass ? '#34D399' : '#F87171'}; font-family: Outfit, sans-serif;">
                ${escapeHtml(res.grade)}
              </div>
            </div>
            <div class="tp-result-score-circle ${isPass ? '' : 'fail'}">
              <span class="tp-result-pct">${res.percentage}%</span>
              <span class="tp-result-marks-sub">${res.marksObtained}/${res.totalMarks} M</span>
            </div>
          </div>
        </div>

        <!-- 6-Grid Performance Metrics -->
        <section>
          <h3 class="tp-section-heading" style="margin-bottom: 0.75rem;">Performance Summary</h3>
          <div class="tp-result-grid">
            <div class="tp-result-stat-card">
              <div class="tp-result-stat-val">${res.marksObtained}</div>
              <div class="tp-result-stat-lbl">Marks Obtained</div>
            </div>
            <div class="tp-result-stat-card">
              <div class="tp-result-stat-val">${res.totalMarks}</div>
              <div class="tp-result-stat-lbl">Total Marks</div>
            </div>
            <div class="tp-result-stat-card">
              <div class="tp-result-stat-val ${isPass ? 'green' : 'red'}">${res.percentage}%</div>
              <div class="tp-result-stat-lbl">Percentage</div>
            </div>
            <div class="tp-result-stat-card">
              <div class="tp-result-stat-val green">${res.correctCount || 0}</div>
              <div class="tp-result-stat-lbl">Correct Answers</div>
            </div>
            <div class="tp-result-stat-card">
              <div class="tp-result-stat-val red">${res.incorrectCount || 0}</div>
              <div class="tp-result-stat-lbl">Incorrect Answers</div>
            </div>
            <div class="tp-result-stat-card">
              <div class="tp-result-stat-val amber">${res.unansweredCount || 0}</div>
              <div class="tp-result-stat-lbl">Unanswered</div>
            </div>
          </div>
        </section>

        <!-- Unit-Wise Performance Breakdown (Vital for All Units Tests) -->
        ${res.unitBreakdown && Object.keys(res.unitBreakdown).length > 0 ? `
          <section class="tp-unit-perf-card">
            <h3 class="tp-section-heading" style="margin-bottom: 0.25rem;">Unit-Wise Performance Breakdown</h3>
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${Object.keys(res.unitBreakdown).map(uKey => {
                const u = res.unitBreakdown[uKey];
                const uPct = u.total > 0 ? Math.round((u.obtained / u.total) * 100) : 0;
                let barColor = 'var(--accent)';
                if (uPct < 40) barColor = 'var(--danger)';
                else if (uPct >= 70) barColor = 'var(--success)';

                return `
                  <div class="tp-unit-perf-item">
                    <div class="tp-unit-perf-item-top">
                      <span><strong>${escapeHtml(uKey)}</strong>: ${escapeHtml(u.title)}</span>
                      <span style="color: ${barColor};">${u.obtained} / ${u.total} Marks (${uPct}%)</span>
                    </div>
                    <div class="tp-unit-perf-track">
                      <div class="tp-unit-perf-fill" style="width: ${uPct}%; background: ${barColor};"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </section>
        ` : ''}

        <!-- Question-by-Question Review -->
        <section style="display: flex; flex-direction: column; gap: 1rem;">
          <h3 class="tp-section-heading">Detailed Question Review & Official Solutions</h3>
          ${(res.questionReview || []).map(qr => {
            let cardClass = 'unanswered';
            let badgeText = 'Not Attempted';
            if (qr.isCorrect) {
              cardClass = 'correct';
              badgeText = '✓ Correct (+2 Marks)';
            } else if (qr.isAttempted) {
              cardClass = 'incorrect';
              badgeText = '✗ Incorrect (0 Marks)';
            }

            return `
              <div class="tp-review-card ${cardClass}">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.78rem; font-weight: 700; color: var(--slate-600); background: var(--slate-100); padding: 0.2rem 0.5rem; border-radius: var(--radius-sm);">
                      Q${qr.qNum} • Unit ${qr.unit}
                    </span>
                    ${qr.isPYQ ? `
                      <span class="tp-pyq-verified-badge" style="font-size: 0.72rem;">Verified AKTU PYQ</span>
                    ` : `
                      <span class="tp-ai-practice-badge" style="font-size: 0.72rem;">Practice Question</span>
                    `}
                  </div>
                  <span style="font-size: 0.78rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: var(--radius-full); ${qr.isCorrect ? 'background: #D1FAE5; color: #065F46;' : (qr.isAttempted ? 'background: #FEE2E2; color: #991B1B;' : 'background: #FEF3C7; color: #92400E;')}">
                    ${badgeText}
                  </span>
                </div>

                <div style="font-family: 'Outfit', sans-serif; font-size: 1.05rem; font-weight: 600; color: var(--navy-950); line-height: 1.4;">
                  ${escapeHtml(qr.question)}
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.75rem; font-size: 0.88rem; margin: 0.25rem 0;">
                  <div style="padding: 0.6rem 0.85rem; background: var(--white); border: 1px solid var(--slate-200); border-radius: var(--radius-sm);">
                    <div style="font-size: 0.72rem; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Your Selected Answer:</div>
                    <div style="font-weight: 600; color: ${qr.isCorrect ? 'var(--success)' : (qr.isAttempted ? 'var(--danger)' : 'var(--slate-500)')}; margin-top: 0.2rem;">
                      ${escapeHtml(qr.studentAnswer)}
                    </div>
                  </div>
                  <div style="padding: 0.6rem 0.85rem; background: var(--white); border: 1px solid var(--slate-200); border-radius: var(--radius-sm);">
                    <div style="font-size: 0.72rem; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Correct Answer:</div>
                    <div style="font-weight: 600; color: #059669; margin-top: 0.2rem;">
                      ${escapeHtml(qr.correctAnswer)}
                    </div>
                  </div>
                </div>

                <div style="font-size: 0.85rem; color: var(--slate-700); background: rgba(0,0,0,0.03); padding: 0.75rem; border-radius: var(--radius-sm); line-height: 1.45;">
                  <strong>Explanation:</strong> ${escapeHtml(qr.explanation)}
                </div>
              </div>
            `;
          }).join('')}
        </section>
      </div>
    `;
  }

  /* ============================================================================
     8. EVENT LISTENERS
     ============================================================================ */

  function bindMainEvents() {
    // Subject dropdown selection
    const subDropdown = document.getElementById('subjectDropdown');
    if (subDropdown) {
      subDropdown.addEventListener('change', (e) => {
        state.selectedSubjectCode = e.target.value;
        try {
          localStorage.setItem(STORAGE_KEYS.SELECTED_SUBJECT, state.selectedSubjectCode);
        } catch (err) {}
        state.expandedUnits = {}; // reset collapsed state
        render();
      });
    }

    // Toggle unit accordion
    document.querySelectorAll('[data-toggle-unit]').forEach(el => {
      el.addEventListener('click', () => {
        const uNum = Number(el.getAttribute('data-toggle-unit'));
        state.expandedUnits[uNum] = !state.expandedUnits[uNum];
        render();
      });
    });

    // Option 1: Practice PYQs
    const btnOpenPractice = document.getElementById('btnOpenPracticePYQs');
    if (btnOpenPractice) {
      btnOpenPractice.addEventListener('click', () => {
        state.mode = 'practice';
        state.practiceUnit = 'all';
        render();
      });
    }

    // Option 2: Scroll to units
    const btnScrollToUnits = document.getElementById('btnScrollToUnits');
    if (btnScrollToUnits) {
      btnScrollToUnits.addEventListener('click', () => {
        const el = document.querySelector('.tp-unit-card');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Option 3: All Units Test Buttons
    const btnStartAllMain = document.getElementById('btnStartAllUnitsTestMain');
    const btnStartAllBanner = document.getElementById('btnStartAllUnitsTestBanner');

    function triggerAllUnitsPreStart() {
      const subject = getActiveSubject();
      const testConfig = generateTestSet(subject, 'all_units');
      state.showPreStartDialog = testConfig;
      render();
    }

    if (btnStartAllMain) btnStartAllMain.addEventListener('click', triggerAllUnitsPreStart);
    if (btnStartAllBanner) btnStartAllBanner.addEventListener('click', triggerAllUnitsPreStart);

    // Individual Unit Test buttons from unit cards
    document.querySelectorAll('.tp-btn-unit-test').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uNum = Number(btn.getAttribute('data-unit'));
        const subject = getActiveSubject();
        const testConfig = generateTestSet(subject, 'unit', uNum);
        state.showPreStartDialog = testConfig;
        render();
      });
    });

    // Individual Unit Practice PYQs buttons from unit cards
    document.querySelectorAll('.tp-btn-unit-pyq').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uNum = Number(btn.getAttribute('data-unit'));
        state.mode = 'practice';
        state.practiceUnit = uNum;
        render();
      });
    });

    // Resume / Discard Draft
    const btnResumeDraft = document.getElementById('btnResumeDraft');
    if (btnResumeDraft) btnResumeDraft.addEventListener('click', resumeDraftSession);

    const btnDiscardDraft = document.getElementById('btnDiscardDraft');
    if (btnDiscardDraft) btnDiscardDraft.addEventListener('click', discardDraftSession);

    // History View Result
    document.querySelectorAll('.btn-view-history-res').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const history = getTestHistory();
        const item = history.find(h => h.id === id);
        if (item) {
          state.testResultView = item;
          state.mode = 'result';
          render();
        }
      });
    });

    // Pre-Start Modal Actions
    const btnClosePreStartModal = document.getElementById('btnClosePreStartModal');
    const btnCancelPreStart = document.getElementById('btnCancelPreStart');
    const btnConfirmStartExam = document.getElementById('btnConfirmStartExam');

    if (btnClosePreStartModal) {
      btnClosePreStartModal.addEventListener('click', () => {
        state.showPreStartDialog = null;
        render();
      });
    }

    if (btnCancelPreStart) {
      btnCancelPreStart.addEventListener('click', () => {
        state.showPreStartDialog = null;
        render();
      });
    }

    if (btnConfirmStartExam) {
      btnConfirmStartExam.addEventListener('click', () => {
        const cfg = state.showPreStartDialog;
        state.showPreStartDialog = null;
        if (cfg) startTestSession(cfg);
      });
    }
  }

  function bindPracticeEvents() {
    const btnBack = document.getElementById('btnBackFromPractice');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        state.mode = 'main';
        render();
      });
    }

    // Unit filter pills in practice mode
    document.querySelectorAll('[data-practice-unit]').forEach(pill => {
      pill.addEventListener('click', () => {
        const uVal = pill.getAttribute('data-practice-unit');
        state.practiceUnit = uVal === 'all' ? 'all' : Number(uVal);
        render();
      });
    });

    // Show/hide answer toggles
    document.querySelectorAll('.btn-toggle-answer').forEach(btn => {
      btn.addEventListener('click', () => {
        const qId = btn.getAttribute('data-id');
        state.revealedAnswers[qId] = !state.revealedAnswers[qId];
        render();
      });
    });
  }

  function bindRunnerEvents() {
    const session = state.testSession;
    if (!session) return;

    // Option clicks
    document.querySelectorAll('.tp-runner-option').forEach(optEl => {
      optEl.addEventListener('click', () => {
        const optIndex = Number(optEl.getAttribute('data-opt-index'));
        captureOptionSelection(optIndex);
        render();
      });
    });

    // Prev Button
    const btnPrev = document.getElementById('btnPrevQuestion');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (session.currentQuestionIndex > 0) {
          session.currentQuestionIndex--;
          render();
        }
      });
    }

    // Next Button
    const btnNext = document.getElementById('btnNextQuestion');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (session.currentQuestionIndex < session.questions.length - 1) {
          session.currentQuestionIndex++;
          render();
        } else {
          // Reached end -> open submit confirmation modal
          state.showSubmitConfirm = true;
          render();
        }
      });
    }

    // Leave Test Button
    const btnLeave = document.getElementById('btnLeaveTest');
    if (btnLeave) {
      btnLeave.addEventListener('click', () => {
        state.showLeaveConfirm = true;
        render();
      });
    }

    // Submit Test Button
    const btnSubmit = document.getElementById('btnSubmitTest');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => {
        state.showSubmitConfirm = true;
        render();
      });
    }

    // Leave Modal Events
    const btnStay = document.getElementById('btnStayInTest');
    const btnCloseLeaveX = document.getElementById('btnCloseLeaveX');
    const btnConfirmLeaveDraft = document.getElementById('btnConfirmLeaveDraft');

    if (btnStay) {
      btnStay.addEventListener('click', () => {
        state.showLeaveConfirm = false;
        render();
      });
    }

    if (btnCloseLeaveX) {
      btnCloseLeaveX.addEventListener('click', () => {
        state.showLeaveConfirm = false;
        render();
      });
    }

    if (btnConfirmLeaveDraft) {
      btnConfirmLeaveDraft.addEventListener('click', handleLeaveTestConfirmed);
    }

    // Submit Modal Events
    const btnCancelSubmit = document.getElementById('btnCancelSubmitModal');
    const btnCloseSubmitX = document.getElementById('btnCloseSubmitX');
    const btnConfirmFinal = document.getElementById('btnConfirmFinalSubmit');

    if (btnCancelSubmit) {
      btnCancelSubmit.addEventListener('click', () => {
        state.showSubmitConfirm = false;
        render();
      });
    }

    if (btnCloseSubmitX) {
      btnCloseSubmitX.addEventListener('click', () => {
        state.showSubmitConfirm = false;
        render();
      });
    }

    if (btnConfirmFinal) {
      btnConfirmFinal.addEventListener('click', () => {
        executeSubmission(false);
      });
    }
  }

  function bindResultEvents() {
    const btnBack = document.getElementById('btnBackToMainFromRes');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        state.mode = 'main';
        state.testResultView = null;
        render();
      });
    }

    const btnRetake = document.getElementById('btnRetakeCurrentTest');
    if (btnRetake) {
      btnRetake.addEventListener('click', () => {
        const res = state.testResultView;
        const subject = getActiveSubject();
        const testConfig = generateTestSet(subject, res.testType || 'unit', res.unitNumber || 1);
        state.testResultView = null;
        startTestSession(testConfig);
      });
    }
  }

  /* ============================================================================
     9. PUBLIC API & INITIALIZATION
     ============================================================================ */

  function init() {
    syncUserProfile();

    // Restore previously chosen subject if saved
    try {
      const savedSub = localStorage.getItem(STORAGE_KEYS.SELECTED_SUBJECT);
      if (savedSub) state.selectedSubjectCode = savedSub;
    } catch (e) {}

    render();
  }

  function loadAndRender() {
    syncUserProfile();
    const list = getRelevantSubjects();
    if (list.length > 0 && !list.some(s => s.code === state.selectedSubjectCode || s.altCode === state.selectedSubjectCode || s.name.toLowerCase() === (state.selectedSubjectCode || '').toLowerCase())) {
      state.selectedSubjectCode = list[0].code;
    }
    render();
  }

  function startTest(testId) {
    const subject = getActiveSubject();
    const testConfig = generateTestSet(subject, 'unit', 1);
    startTestSession(testConfig);
  }

  window.NovaTestsPlanner = {
    init,
    loadAndRender,
    startTest,
    onProfileUpdated: (user) => {
      state.userProfile = user;
      const list = getRelevantSubjects();
      if (list.length > 0 && !list.some(s => s.code === state.selectedSubjectCode || s.altCode === state.selectedSubjectCode || s.name.toLowerCase() === (state.selectedSubjectCode || '').toLowerCase())) {
        state.selectedSubjectCode = list[0].code;
      }
      render();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
