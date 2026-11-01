/* ==============================================================================
   TIMETABLE MODULE — Automated & Optimized Timetable Generator
   Nova AI Study Assistant — 11 Modules & Reference Layout Implementation

   Pages / Tabs Implemented:
   1. Dashboard
   2. Section Management
   3. Faculty Management
   4. Subject Configuration
   5. Rooms & Laboratories
   6. Timetable Generator (Visual Grid with Days as Rows, Periods P1-P9 as Columns)
   7. Editable Timetable (Cell Clicks, Swaps, Real-Time Validation, Undo/Redo)
   8. Faculty Workload (Daily & Weekly Workload, 18h Limit, Capacity)
   9. Conflict Detection (12 Hard Constraints Audit & Recommendations)
   10. Reports & Export (PDF, Excel/CSV, Combined, Faculty-Wise, Room Utilization)
   11. Settings (Period Times, Lunch Break, Working Days, Limits)
   ============================================================================== */

(function () {
  "use strict";

  const DEFAULT_SECTIONS = [
    { id: "sec_cse_2a", name: "CSE 2A", room: "Room 201", semester: "Semester 3" },
    { id: "sec_cse_2b", name: "CSE 2B", room: "Room 202", semester: "Semester 3" },
    { id: "sec_cse_2c", name: "CSE 2C", room: "Room 203", semester: "Semester 3" },
    { id: "sec_cse_2d", name: "CSE 2D", room: "Room 301", semester: "Semester 3" },
    { id: "sec_cse_2e", name: "CSE 2E", room: "Room 302", semester: "Semester 3" },
    { id: "sec_cse_2f", name: "CSE 2F", room: "Room 303", semester: "Semester 3" },
    { id: "sec_cse_2g", name: "CSE 2G", room: "Room 304", semester: "Semester 3" },
    { id: "sec_cse_2h", name: "CSE 2H", room: "Room 305", semester: "Semester 3" }
  ];

  // State Management
  const state = {
    activeTab: "dashboard", // 'dashboard' | 'section-mgmt' | 'faculty-mgmt' | 'subject-config' | 'rooms-labs' | 'generator' | 'editable-tt' | 'workload' | 'conflict-detection' | 'reports-export' | 'settings'
    currentSection: "CSE 2D",
    groupFilter: "all", // 'all' (combined) | 'g1' | 'g2'
    subjectFilter: "all",
    facultyFilter: "all",
    data: null,
    sections: DEFAULT_SECTIONS,
    teachers: [],
    subjects: [],
    rooms: [],
    periods: [],
    settings: {},
    audit: null,
    feasibility: null,
    workloads: [],
    subjectWorkloads: [],
    authUser: null,
    role: "student", // default to student; staff/admin credentials verified via session
    isGenerating: false,
    isSaving: false,
    lastError: null,
    selectedCell: null,
    comparisonSections: [],
    reportsFacultyFilter: "all",
    reportsRoomFilter: "all",
    pendingExcelImport: null
  };

  const API_BASE = "/api/timetable";
  const LOCAL_CACHE_KEY = "nova_timetable_master_v6";

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  function isStaffRole(role) {
    if (!role) return false;
    const r = String(role).toLowerCase().trim();
    return r === "staff" || r === "faculty" || r === "admin";
  }

  /* ============================================================================
     1. INITIALIZATION & DATA FETCHING
     ============================================================================ */
  async function checkAuthStatus() {
    // 1. Check window.currentUser first
    if (typeof window !== "undefined" && window.currentUser) {
      const uRole = window.currentUser.role;
      if (isStaffRole(uRole)) {
        state.authUser = window.currentUser;
        state.role = uRole;
        return;
      } else {
        state.authUser = window.currentUser;
        state.role = "student";
        return;
      }
    }

    // 2. Query authoritative backend auth status
    try {
      const res = await fetch(`${API_BASE}/auth/status`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        if (json.authenticated && json.user) {
          state.authUser = json.user;
          state.role = isStaffRole(json.user.role) ? json.user.role : "student";
          return;
        }
      }
    } catch (e) {
      console.warn("[Timetable] Auth check fallback:", e);
    }

    // 3. Strict security default: Student (never default to admin)
    state.role = "student";
    state.authUser = { name: "Student", role: "student", email: "" };
  }

  async function loadData() {
    await checkAuthStatus();

    try {
      const url = `${API_BASE}?section=${encodeURIComponent(state.currentSection)}&role=${encodeURIComponent(state.role)}`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          state.data = json.data;
          state.sections = json.data.sections || [];
          state.teachers = json.data.teachers || [];
          state.subjects = json.data.subjects || [];
          state.rooms = json.data.rooms || [];
          state.periods = json.data.periods || [];
          state.settings = json.data.settings || {};
          state.audit = json.data.audit || null;
          state.feasibility = json.data.feasibility || null;
          state.workloads = json.data.workloads || [];
          state.subjectWorkloads = json.data.subjectWorkloads || [];

          if (state.sections.length > 0 && !state.sections.some(s => (s.name || s) === state.currentSection)) {
            state.currentSection = state.sections[0].name || state.sections[0];
          }

          syncLocalCache();
          render();
          return;
        }
      }
    } catch (err) {
      console.warn("[Timetable] Server fetch failed, reading cache:", err);
    }

    try {
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        state.data = JSON.parse(cached);
        state.sections = state.data.sections || [];
        state.teachers = state.data.teachers || [];
        state.subjects = state.data.subjects || [];
        state.rooms = state.data.rooms || [];
        state.periods = state.data.periods || [];
        state.settings = state.data.settings || {};
        state.audit = state.data.audit || null;
        state.feasibility = state.data.feasibility || null;
        state.workloads = state.data.workloads || [];
        state.subjectWorkloads = state.data.subjectWorkloads || [];
      }
    } catch (e) {}

    render();
  }

  function syncLocalCache() {
    if (state.data) {
      try {
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(state.data));
      } catch (e) {}
    }
  }

  /* ============================================================================
     2. ACTION HANDLERS (GENERATE, REGENERATE, VALIDATE, SAVE, RESET, UNDO)
     ============================================================================ */
  async function generateTimetable(isRegenerate = false) {
    if (state.isGenerating) return;
    state.isGenerating = true;
    state.lastError = null;
    render();

    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          section: state.currentSection,
          randomSeed: isRegenerate ? Math.random() : undefined
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        state.lastError = result.error || "Optimization algorithm could not satisfy all constraints.";
        showToast("⚠️ Generation failed: " + state.lastError);
      } else {
        state.data = { ...state.data, ...result.data };
        state.workloads = result.data.workloads || state.workloads;
        state.subjectWorkloads = result.data.subjectWorkloads || state.subjectWorkloads;
        state.audit = result.data.audit || state.audit;
        syncLocalCache();

        const diff = result.data.variationScore;
        const msg = isRegenerate
          ? `⚡ Timetable regenerated for ${state.currentSection} with ${diff} slot variations! Other sections remain unchanged.`
          : `⚡ Optimized timetable generated successfully for ${state.currentSection}!`;
        showToast(msg);
      }
    } catch (err) {
      state.lastError = "Network error communicating with generator service.";
      showToast("❌ " + state.lastError);
    } finally {
      state.isGenerating = false;
      render();
    }
  }

  async function validateTimetable() {
    try {
      const res = await fetch(`${API_BASE}/audit?section=${encodeURIComponent(state.currentSection)}`, {
        credentials: "include"
      });
      const result = await res.json();
      if (res.ok && result.success) {
        state.audit = result.audit;
        if (result.audit.isCompliant) {
          showToast(`✓ Validation Passed: 0 Conflicts detected for ${state.currentSection}! Score: ${result.audit.score}%`);
        } else {
          showToast(`⚠️ Validation Notice: ${result.audit.totalConflicts} conflict(s) detected. View Conflict Detection tab.`);
        }
        render();
      }
    } catch (e) {
      showToast("❌ Audit service unavailable.");
    }
  }

  async function saveTimetable() {
    if (!state.data || !state.data.classes) return;
    state.isSaving = true;
    render();

    try {
      const sectionClasses = state.data.classes.filter(c => c.section === state.currentSection);
      const res = await fetch(`${API_BASE}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          section: state.currentSection,
          classes: sectionClasses,
          clientVersion: state.data.version
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        showToast(`✓ Timetable for Section ${state.currentSection} saved successfully (v${result.version}).`);
        await loadData();
      } else {
        showToast("⚠️ Save failed: " + (result.error || "Constraint check error"));
      }
    } catch (err) {
      showToast("❌ Network error saving timetable.");
    } finally {
      state.isSaving = false;
      render();
    }
  }

  /* ---------------- Timetable Deletion Handlers (Modal Confirmation & Master Data Protection) ---------------- */
  function openDeleteSectionModal() {
    const targetSpan = document.getElementById("delSecModalTargetName");
    if (targetSpan) targetSpan.textContent = state.currentSection;
    openModal("tt-delete-section-modal");
  }

  async function confirmDeleteSectionTimetable() {
    const btn = document.getElementById("btn-confirm-delete-section");
    if (btn) { btn.disabled = true; btn.textContent = "Deleting…"; }
    try {
      const res = await fetch(`${API_BASE}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ section: state.currentSection, mode: "section" })
      });
      const result = await res.json();
      closeModal("tt-delete-section-modal");
      if (res.ok && result.success) {
        showToast(`🗑️ Timetable for Section ${state.currentSection} deleted. Master records preserved.`);
        await loadData();
      } else {
        showToast("⚠️ Deletion failed: " + (result.error || "Unknown error"));
      }
    } catch (e) {
      showToast("❌ Network error deleting timetable.");
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "Delete Timetable"; }
    }
  }

  function openClearAllModal() {
    openModal("tt-clear-all-modal");
  }

  async function confirmClearAllTimetables() {
    const btn = document.getElementById("btn-confirm-clear-all");
    if (btn) { btn.disabled = true; btn.textContent = "Clearing All…"; }
    try {
      const res = await fetch(`${API_BASE}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode: "all" })
      });
      const result = await res.json();
      closeModal("tt-clear-all-modal");
      if (res.ok && result.success) {
        showToast("⚠️ All section timetables cleared. Master records preserved.");
        await loadData();
      } else {
        showToast("⚠️ Clear failed: " + (result.error || "Unknown error"));
      }
    } catch (e) {
      showToast("❌ Network error clearing timetables.");
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "Clear All Timetables"; }
    }
  }

  const resetSelectedSection = openDeleteSectionModal;

  /* ---------------- Excel Import & Faculty Allocation Engine ---------------- */
  function downloadSampleExcelTemplate() {
    if (typeof XLSX === "undefined") {
      showToast("⚠️ Excel engine is loading, please try again in a moment.");
      return;
    }
    const headers = [
      "Teacher Name",
      "Email",
      "Department",
      "Designation",
      "Eligible Subjects",
      "Max Weekly Hours",
      "Max Daily Hours",
      "Preferred Days"
    ];
    const sampleRows = [
      headers,
      ["Dr. Ananya Sharma", "ananya.sharma@nova.edu", "Applied Sciences & Humanities", "Associate Professor", "BAS-303, BAS-301, BAS-303T", 18, 4, "Monday, Tuesday, Wednesday, Thursday"],
      ["Prof. Rahul Verma", "rahul.verma@nova.edu", "Computer Science & Engineering", "Assistant Professor", "BCS-301, BCS-351, BCC-301, BCS-301T", 18, 4, "Monday, Tuesday, Wednesday, Thursday, Friday"],
      ["Dr. Priya Gupta", "priya.gupta@nova.edu", "Computer Science & Engineering", "Professor", "BCS-302, BCS-352, BCS-303, BCS-302T", 18, 4, "Monday, Wednesday, Thursday, Friday"],
      ["Prof. Neha Singh", "neha.singh@nova.edu", "Information Technology", "Assistant Professor", "BCS-353, BCC-301, BCS-354", 18, 4, "Monday, Tuesday, Wednesday, Friday"],
      ["Dr. Amit Mishra", "amit.mishra@nova.edu", "Computer Science & Engineering", "Associate Professor", "BCS-301, BCS-354, BCS-303, BCS-301T", 18, 4, "Tuesday, Wednesday, Thursday, Friday"],
      ["Prof. Arjun Patel", "arjun.patel@nova.edu", "Computer Science & Engineering", "Assistant Professor", "BCS-354, BCS-353, BCC-301", 18, 4, "Monday, Tuesday, Thursday, Friday"],
      ["Dr. Rohit Kumar", "rohit.kumar@nova.edu", "Applied Sciences & Humanities", "Assistant Professor", "BAS-301, BCS-303, BAS-303T", 18, 4, "Monday, Wednesday, Thursday, Friday"],
      ["Prof. Nidhi Singhal", "nidhi.singhal@nova.edu", "Information Technology", "Assistant Professor", "BCS-354, BCS-353, BCC-301", 18, 4, "Monday, Tuesday, Wednesday, Thursday"]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleRows);
    ws['!cols'] = [
      { wch: 22 }, { wch: 28 }, { wch: 30 }, { wch: 20 },
      { wch: 35 }, { wch: 18 }, { wch: 16 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Faculty_Allocations");
    XLSX.writeFile(wb, "nova_faculty_allocation_template.xlsx");
    showToast("📥 Sample Excel template downloaded with official AKTU BCS curriculum.");
  }

  function handleExcelFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    e.target.value = "";

    if (typeof XLSX === "undefined") {
      showToast("⚠️ Excel library not initialized yet. Please wait a second and retry.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          showToast("❌ Excel workbook contains no sheets.");
          return;
        }
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        if (!rows || rows.length === 0) {
          showToast("⚠️ Excel sheet is empty or contains no header row.");
          return;
        }
        previewAndValidateExcelRows(rows, file.name);
      } catch (err) {
        console.error("[ExcelImport] Parse error:", err);
        showToast("❌ Failed to parse Excel spreadsheet: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function findColVal(row, candidates) {
    const keys = Object.keys(row);
    for (const cand of candidates) {
      const match = keys.find(k => k.trim().toLowerCase().replace(/[^a-z0-9]/g, "") === cand.toLowerCase().replace(/[^a-z0-9]/g, ""));
      if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== "") {
        return String(row[match]).trim();
      }
    }
    return "";
  }

  function previewAndValidateExcelRows(rawRows, fileName) {
    const existingFaculty = (state.data && state.data.teachers) || [];
    const existingSubjects = (state.data && state.data.subjects) || [];

    const parsedRecords = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    const seenNamesInFile = new Set();
    const seenEmailsInFile = new Set();

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const name = findColVal(row, ["Teacher Name", "Faculty Name", "Name", "Teacher", "Faculty", "Professor"]);
      const email = findColVal(row, ["Email", "Teacher Email", "Faculty Email", "Mail", "Email ID"]);
      const dept = findColVal(row, ["Department", "Dept", "Branch", "Discipline"]) || "Computer Science & Engineering";
      const desig = findColVal(row, ["Designation", "Role", "Title", "Position"]) || "Assistant Professor";
      const subStr = findColVal(row, ["Eligible Subjects", "Subjects", "Subject Codes", "Courses", "Subject", "Teaching Subjects"]);
      const weeklyHoursStr = findColVal(row, ["Max Weekly Hours", "Weekly Hours", "Weekly Load", "Max Hours", "Hours Per Week"]);
      const dailyHoursStr = findColVal(row, ["Max Daily Hours", "Daily Hours", "Daily Load", "Hours Per Day"]);
      const daysStr = findColVal(row, ["Preferred Days", "Available Days", "Days", "Teaching Days"]);

      const issues = [];
      let status = "valid";

      if (!name) {
        issues.push("Missing teacher name");
        status = "error";
        errorCount++;
      }

      const cleanName = (name || "").toLowerCase();
      const cleanEmail = email ? email.toLowerCase() : "";
      let isExisting = false;
      let matchedFaculty = null;

      if (cleanName) {
        if (seenNamesInFile.has(cleanName) || (cleanEmail && seenEmailsInFile.has(cleanEmail))) {
          issues.push("Duplicate teacher row in spreadsheet");
          if (status !== "error") status = "warning";
        }
        seenNamesInFile.add(cleanName);
        if (cleanEmail) seenEmailsInFile.add(cleanEmail);

        matchedFaculty = existingFaculty.find(f => 
          (cleanEmail && f.email && f.email.toLowerCase().trim() === cleanEmail) ||
          (f.name && f.name.toLowerCase().trim() === cleanName)
        );
        if (matchedFaculty) {
          isExisting = true;
        }
      }

      const rawSubList = subStr ? subStr.split(/[,;/|]+/).map(s => s.trim()).filter(Boolean) : [];
      const mappedCodes = [];
      const codeUpgrades = {
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

      rawSubList.forEach(rawSub => {
        const upper = rawSub.toUpperCase().replace(/\s+/g, '-');
        const upgraded = codeUpgrades[upper] || upper;
        if (codeUpgrades[upper]) {
          issues.push(`${upper} upgraded to ${upgraded}`);
        }
        const foundSub = existingSubjects.find(s => 
          (s.code && s.code.toUpperCase() === upgraded) || 
          (s.code && s.code.toUpperCase() === upper) ||
          (s.id && s.id.toUpperCase() === upper) ||
          (s.name && s.name.toLowerCase().includes(rawSub.toLowerCase()))
        );
        if (foundSub) {
          mappedCodes.push(foundSub.code || foundSub.name);
        } else if (/^B[A-Z0-9]{1,4}[ -]?[0-9]{3}[A-Z0-9]?$/i.test(upgraded)) {
          mappedCodes.push(upgraded);
        } else {
          issues.push(`Unrecognized subject '${rawSub}'`);
          if (status !== "error") status = "warning";
        }
      });

      if (rawSubList.length === 0) {
        issues.push("No subjects specified");
        if (status !== "error") status = "warning";
      }

      const maxWeeklyHours = weeklyHoursStr ? Number(weeklyHoursStr) : 18;
      const maxDailyHours = dailyHoursStr ? Number(dailyHoursStr) : 4;
      if (isNaN(maxWeeklyHours) || maxWeeklyHours > 18) {
        issues.push(`Weekly hours (${maxWeeklyHours}) exceeds 18h limit`);
        if (status !== "error") status = "warning";
      }
      if (isNaN(maxDailyHours) || maxDailyHours > 6) {
        issues.push(`Daily hours (${maxDailyHours}) exceeds 6h limit`);
        if (status !== "error") status = "warning";
      }

      if (status === "valid") validCount++;
      else if (status === "warning") warningCount++;

      parsedRecords.push({
        rowNum,
        name: name || `Row ${rowNum}`,
        email: email || `${(name || 'faculty').toLowerCase().replace(/[^a-z0-9]/g, '.')}@nova.edu`,
        department: dept,
        designation: desig,
        subjects: rawSubList.join(", "),
        mappedCodes,
        maxWeeklyHours: isNaN(maxWeeklyHours) ? 18 : maxWeeklyHours,
        maxDailyHours: isNaN(maxDailyHours) ? 4 : maxDailyHours,
        preferredDays: daysStr ? daysStr.split(/[,;/]+/).map(d => d.trim()).filter(Boolean) : DAYS,
        status,
        issues,
        isExisting,
        matchedFaculty
      });
    });

    state.pendingExcelImport = {
      fileName,
      records: parsedRecords.filter(r => r.status !== "error"),
      allRecords: parsedRecords,
      validCount,
      warningCount,
      errorCount,
      total: parsedRecords.length
    };

    renderExcelPreviewModal();
    openModal("tt-excel-preview-modal");
  }

  function renderExcelPreviewModal() {
    const data = state.pendingExcelImport;
    if (!data) return;

    const fileLabel = document.getElementById("excelPreviewFileName");
    if (fileLabel) fileLabel.textContent = `${data.fileName} (${data.total} rows detected)`;

    const secLabel = document.getElementById("excelTargetSecLabel");
    if (secLabel) secLabel.textContent = state.currentSection;

    const statsBar = document.getElementById("excelStatsBar");
    if (statsBar) {
      statsBar.innerHTML = `
        <div class="tt-preview-stat-card">
          <div class="tt-preview-stat-val val-blue">${data.total}</div>
          <div class="tt-preview-stat-lbl">Rows Parsed</div>
        </div>
        <div class="tt-preview-stat-card">
          <div class="tt-preview-stat-val val-green">${data.validCount}</div>
          <div class="tt-preview-stat-lbl">Fully Valid</div>
        </div>
        <div class="tt-preview-stat-card">
          <div class="tt-preview-stat-val ${data.warningCount > 0 ? 'val-amber' : ''}">${data.warningCount}</div>
          <div class="tt-preview-stat-lbl">Warnings</div>
        </div>
        <div class="tt-preview-stat-card">
          <div class="tt-preview-stat-val ${data.errorCount > 0 ? 'val-red' : ''}">${data.errorCount}</div>
          <div class="tt-preview-stat-lbl">Errors Blocked</div>
        </div>
      `;
    }

    const tbody = document.getElementById("excelPreviewTableBody");
    if (tbody) {
      tbody.innerHTML = data.allRecords.map(r => {
        let statusBadge = `<span class="tt-tag-valid">✓ Ready</span>`;
        if (r.status === "error") {
          statusBadge = `<span class="tt-tag-err">❌ Error</span>`;
        } else if (r.status === "warning") {
          statusBadge = `<span class="tt-tag-warn">⚠️ Warning</span>`;
        }

        const roleBadge = r.isExisting 
          ? `<span class="tt-tag-info" title="Existing faculty record will be updated without duplication">🔄 Updates ${escapeHtml(r.matchedFaculty?.code || 'F')}</span>`
          : `<span class="tt-tag-valid" title="New faculty member to be added">➕ New</span>`;

        const subBadges = r.mappedCodes.map(c => `<span class="tt-code-pill">${escapeHtml(c)}</span>`).join(" ");

        const notes = r.issues.length > 0 
          ? r.issues.map(i => `<div style="font-size:0.75rem;color:${r.status === 'error' ? '#dc2626' : '#d97706'};">• ${escapeHtml(i)}</div>`).join("")
          : `<span style="color:#16a34a;font-size:0.78rem;">✓ Valid AKTU BCS mapping</span>`;

        return `
          <tr style="${r.status === 'error' ? 'background:#fef2f2;opacity:0.7;' : ''}">
            <td>${statusBadge}<div style="margin-top:2px;">${roleBadge}</div></td>
            <td><strong>${escapeHtml(r.name)}</strong></td>
            <td><small style="color:#64748b;">${escapeHtml(r.email)}</small></td>
            <td><small>${escapeHtml(r.department)}</small></td>
            <td><small>${escapeHtml(r.designation)}</small></td>
            <td>${subBadges || '<span style="color:#94a3b8;font-style:italic;">None</span>'}</td>
            <td><span style="font-family:monospace;font-size:0.8rem;">${r.maxWeeklyHours}h / ${r.maxDailyHours}h</span></td>
            <td>${notes}</td>
          </tr>
        `;
      }).join("");
    }

    const confirmBtn = document.getElementById("btn-confirm-excel-import");
    if (confirmBtn) {
      if (data.records.length === 0) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "No Valid Records to Import";
      } else {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `<span>Import ${data.records.length} Records &amp; Generate</span>`;
      }
    }
  }

  async function submitExcelImport() {
    const data = state.pendingExcelImport;
    if (!data || !data.records || data.records.length === 0) {
      showToast("⚠️ No valid records to import.");
      return;
    }

    const autoGenCheck = document.getElementById("excelAutoGenerateCheck");
    const autoGenerate = autoGenCheck ? autoGenCheck.checked : true;

    const confirmBtn = document.getElementById("btn-confirm-excel-import");
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `<span class="spinner" style="display:inline-block;width:12px;height:12px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin-right:6px;"></span> Processing…`;
    }

    try {
      const res = await fetch(`${API_BASE}/import-excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          records: data.records,
          autoGenerate,
          section: state.currentSection
        })
      });

      const result = await res.json();
      closeModal("tt-excel-preview-modal");

      if (res.ok && result.success) {
        showToast(`✓ Successfully imported ${result.addedCount} new faculty, updated ${result.updatedCount} existing faculty.${result.timetableGenerated ? ` Timetable for ${state.currentSection} generated!` : ''}`);
        await loadData();
      } else {
        showToast("⚠️ Import failed: " + (result.error || "Unknown server error"));
      }
    } catch (err) {
      console.error("[ExcelImport] Submit error:", err);
      showToast("❌ Network error processing Excel import.");
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `<span>Confirm &amp; Generate Timetable</span>`;
      }
    }
  }

  async function undoChanges() {
    try {
      const res = await fetch(`${API_BASE}/undo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ section: state.currentSection })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(`↩️ Changes undone. Restored previous timetable version.`);
        await loadData();
      } else {
        showToast("⚠️ " + (result.error || "Nothing to undo."));
      }
    } catch (e) {
      showToast("❌ Undo action failed.");
    }
  }

  async function publishTimetable(published = true) {
    try {
      const res = await fetch(`${API_BASE}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ section: state.currentSection, published })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(published ? `✓ Timetable for ${state.currentSection} published to students!` : `Draft mode set for ${state.currentSection}.`);
        await loadData();
      }
    } catch (e) {
      showToast("❌ Publish request failed.");
    }
  }

  /* ============================================================================
     3. MANUAL EDIT / SLOT SWAP
     ============================================================================ */
  async function submitSlotEdit(slotData) {
    try {
      const res = await fetch(`${API_BASE}/manual-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          section: state.currentSection,
          editId: slotData.editId,
          classData: slotData,
          action: slotData.action || "save"
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        showToast(`✓ Slot ${slotData.action === 'delete' ? 'deleted' : 'updated and saved'} successfully.`);
        closeModal("tt-slot-edit-modal");
        await loadData();
        return true;
      } else {
        const errBox = document.getElementById("tt-slot-edit-error");
        if (errBox) {
          errBox.textContent = result.error || "Constraint violation.";
          errBox.classList.remove("hidden");
        } else {
          showToast("⚠️ " + (result.error || "Constraint violation"));
        }
        return false;
      }
    } catch (e) {
      showToast("❌ Error saving slot.");
      return false;
    }
  }

  async function submitSlotSwap(editId, targetDay, targetPeriod) {
    try {
      const res = await fetch(`${API_BASE}/manual-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          section: state.currentSection,
          editId,
          action: "swap",
          targetDay,
          targetPeriod
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast("✓ Slots swapped successfully with constraint verification.");
        closeModal("tt-slot-edit-modal");
        await loadData();
      } else {
        showToast("⚠️ Swap rejected: " + (result.error || "Clash detected"));
      }
    } catch (e) {
      showToast("❌ Error swapping slots.");
    }
  }

  /* ============================================================================
     4. EXPORTS (PDF & EXCEL/CSV)
     ============================================================================ */
  function exportExcel() {
    if (!state.data || !state.data.classes) {
      showToast("⚠️ No timetable data available to export.");
      return;
    }
    const sectionClasses = state.data.classes.filter(c => c.section === state.currentSection);
    const headers = ["Section", "Group", "Day", "Period", "Time", "Subject Code", "Subject Name", "Faculty", "Room", "Type"];

    if (typeof XLSX !== "undefined" && XLSX.utils && XLSX.writeFile) {
      try {
        const rows = [headers];
        sectionClasses.forEach(c => {
          rows.push([
            c.section,
            c.group || "Both",
            c.day,
            c.period,
            c.time,
            c.subjectCode || "",
            c.subjectName || "",
            c.teacherName || "",
            c.room || "",
            c.type || ""
          ]);
        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [
          { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 22 },
          { wch: 14 }, { wch: 32 }, { wch: 24 }, { wch: 20 }, { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(wb, ws, `Section_${state.currentSection.replace(/\s+/g, '_')}`);
        XLSX.writeFile(wb, `nova_timetable_${state.currentSection.replace(/\s+/g, "_")}.xlsx`);
        showToast(`✓ Timetable for Section ${state.currentSection} exported to Excel (.xlsx).`);
        return;
      } catch (err) {
        console.warn("[Excel Export] Falling back to CSV:", err);
      }
    }

    const rows = sectionClasses.map(c => [
      `"${c.section}"`,
      `"${c.group || 'Both'}"`,
      `"${c.day}"`,
      c.period,
      `"${c.time}"`,
      `"${c.subjectCode || ""}"`,
      `"${c.subjectName}"`,
      `"${c.teacherName || ""}"`,
      `"${c.room || ""}"`,
      `"${c.type}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timetable_${state.currentSection.replace(/\s+/g, "_")}_schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✓ Timetable for Section ${state.currentSection} exported to Excel/CSV.`);
  }

  function exportPDF() {
    window.print();
  }

  /* ============================================================================
  /* ============================================================================
     5. RENDER MAIN USER INTERFACE (STUDENT VIEW-ONLY VS STAFF ADMIN)
     ============================================================================ */

  // Student-Facing Grid Rows (Read-only, no edit triggers, clean free slot display)
  function renderStudentGridRows(classes) {
    const teachingPeriods = [1, 2, 3, 4, 6, 7, 8, 9];

    return DAYS.map(day => {
      let rowHtml = `<tr><td class="cell-day-label"><strong>${day}</strong></td>`;
      let skipPeriods = 0;

      for (let pIdx = 0; pIdx < teachingPeriods.length; pIdx++) {
        const p = teachingPeriods[pIdx];

        if (p === 6) {
          rowHtml += `<td class="cell-lunch" title="Recess / Lunch Interval: 12:31 PM – 01:10 PM">LUNCH RECESS</td>`;
        }

        if (skipPeriods > 0) {
          skipPeriods--;
          continue;
        }

        // Technical Training (4 periods)
        const techClass = classes.find(c => c.day === day && Number(c.period) === p && c.type === "training");
        if (techClass && (p === 1 || p === 6)) {
          const blockSpan = 4;
          rowHtml += `
            <td colspan="${blockSpan}" class="tt-merged-training-cell">
              <div class="tt-slot-card card-training" style="cursor:default;">
                <div class="tt-slot-top-row">
                  <span class="tt-card-type-badge">TECHNICAL TRAINING (4-PERIOD BLOCK)</span>
                  <span class="tt-card-code">${escapeHtml(techClass.subjectCode || 'BCS-354')}</span>
                </div>
                <div class="tt-card-subject-name" style="font-size:0.95rem;">${escapeHtml(techClass.subjectName)}</div>
                <div class="tt-card-meta">
                  <span class="tt-card-faculty">👨‍🏫 Trainer: ${escapeHtml(techClass.teacherName || 'Faculty')}</span>
                  <span class="tt-card-room">📍 ${escapeHtml(techClass.room || 'Advanced Computing Lab')} • Both Groups (G1 + G2)</span>
                </div>
              </div>
            </td>
          `;
          skipPeriods = blockSpan - 1;
          continue;
        }

        // Practical Lab (2 periods)
        const g1Lab = classes.find(c => c.day === day && Number(c.period) === p && c.type === "lab" && (c.group === "Group 1" || c.group === "Both"));
        const g2Lab = classes.find(c => c.day === day && Number(c.period) === p && c.type === "lab" && (c.group === "Group 2" || c.group === "Both"));

        if ((g1Lab || g2Lab) && (p === 1 || p === 3 || p === 6 || p === 8)) {
          const blockSpan = 2;
          const g1Item = classes.find(c => c.day === day && Number(c.period) === p && (c.group === "Group 1" || c.group === "Both"));
          const g2Item = classes.find(c => c.day === day && Number(c.period) === p && (c.group === "Group 2" || c.group === "Both"));

          rowHtml += `
            <td colspan="${blockSpan}" class="tt-merged-lab-cell">
              <div class="tt-split-parallel-wrap">
                <div class="tt-split-sub-card card-${g1Item?.type || 'lab'}" style="cursor:default;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="tt-split-group-tag">G1 • ${g1Item?.type === 'lab' ? 'LAB' : 'TUTORIAL'}</span>
                    <span style="font-size:0.65rem;font-weight:700;">${escapeHtml(g1Item?.subjectCode || '')}</span>
                  </div>
                  <div style="font-weight:700;font-size:0.78rem;">${escapeHtml(g1Item?.subjectShort || g1Item?.subjectName || 'Unassigned')}</div>
                  <div style="font-size:0.68rem;opacity:0.85;">👨‍🏫 ${escapeHtml(g1Item?.teacherName || '')} | 📍 ${escapeHtml(g1Item?.room || '')}</div>
                </div>

                <div class="tt-split-sub-card card-${g2Item?.type || 'tutorial'}" style="cursor:default;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="tt-split-group-tag">G2 • ${g2Item?.type === 'lab' ? 'LAB' : 'TUTORIAL'}</span>
                    <span style="font-size:0.65rem;font-weight:700;">${escapeHtml(g2Item?.subjectCode || '')}</span>
                  </div>
                  <div style="font-weight:700;font-size:0.78rem;">${escapeHtml(g2Item?.subjectShort || g2Item?.subjectName || 'Unassigned')}</div>
                  <div style="font-size:0.68rem;opacity:0.85;">👨‍🏫 ${escapeHtml(g2Item?.teacherName || '')} | 📍 ${escapeHtml(g2Item?.room || '')}</div>
                </div>
              </div>
            </td>
          `;
          skipPeriods = blockSpan - 1;
          continue;
        }

        // Standard Single Period
        const periodClasses = classes.filter(c => c.day === day && Number(c.period) === p);
        if (periodClasses.length === 0) {
          rowHtml += `
            <td>
              <div style="min-height:55px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:0.75rem;font-style:italic;">
                — Free —
              </div>
            </td>
          `;
        } else if (periodClasses.length === 1 && periodClasses[0].group === "Both") {
          const cls = periodClasses[0];
          rowHtml += `
            <td>
              <div class="tt-slot-card card-${cls.type || 'theory'}" style="cursor:default;">
                <div class="tt-slot-top-row">
                  <span class="tt-card-type-badge">${cls.type.toUpperCase()}</span>
                  <span class="tt-card-code">${escapeHtml(cls.subjectCode || '')}</span>
                </div>
                <div class="tt-card-subject-name">${escapeHtml(cls.subjectShort || cls.subjectName)}</div>
                <div class="tt-card-meta">
                  <span class="tt-card-faculty">👨‍🏫 ${escapeHtml(cls.teacherName || '')}</span>
                  <span class="tt-card-room">📍 ${escapeHtml(cls.room || '')}</span>
                </div>
              </div>
            </td>
          `;
        } else {
          const g1Cls = periodClasses.find(c => c.group === "Group 1");
          const g2Cls = periodClasses.find(c => c.group === "Group 2");
          rowHtml += `
            <td>
              <div class="tt-split-parallel-wrap">
                <div class="tt-split-sub-card card-${g1Cls?.type || 'theory'}" style="cursor:default;">
                  <span class="tt-split-group-tag">G1: ${escapeHtml(g1Cls?.subjectShort || g1Cls?.subjectName || 'Free')}</span>
                  <div style="font-size:0.68rem;opacity:0.85;">${escapeHtml(g1Cls?.teacherName || '')}</div>
                </div>
                <div class="tt-split-sub-card card-${g2Cls?.type || 'theory'}" style="cursor:default;">
                  <span class="tt-split-group-tag">G2: ${escapeHtml(g2Cls?.subjectShort || g2Cls?.subjectName || 'Free')}</span>
                  <div style="font-size:0.68rem;opacity:0.85;">${escapeHtml(g2Cls?.teacherName || '')}</div>
                </div>
              </div>
            </td>
          `;
        }
      }

      rowHtml += `</tr>`;
      return rowHtml;
    }).join("");
  }

  // Student Timetable Markup (Read-Only)
  function renderStudentTimetableMarkup(hasClasses, sectionClasses, version) {
    let filteredClasses = sectionClasses;
    if (state.groupFilter === "Group 1") {
      filteredClasses = sectionClasses.filter(c => !c.group || c.group === "Group 1" || c.group === "Both");
    } else if (state.groupFilter === "Group 2") {
      filteredClasses = sectionClasses.filter(c => !c.group || c.group === "Group 2" || c.group === "Both");
    }

    return `
      <div class="tt-view-wrapper student-timetable-view">
        <!-- Student Header -->
        <div class="tt-page-header">
          <div class="tt-header-left">
            <div class="page-title-badge">
              <span class="badge-dot"></span>
              <span>AKTU B.Tech CSE (Semester 3) • Academic Session ${state.settings.academicYear || "2025–2026"}</span>
            </div>
            <h1 class="tt-main-heading">Class Timetable &amp; Schedule</h1>
            <p style="font-size:0.875rem;color:var(--slate-500,#64748b);margin:4px 0 0 0;">
              Official college schedule for lectures, practical labs, and tutorials.
            </p>
          </div>

          <div class="tt-header-right-tools">
            <div class="tt-auth-status-wrap">
              <div class="tt-auth-badge student">
                <span class="tt-auth-dot"></span>
                <span>Role: <strong>Student</strong> (View-Only)</span>
              </div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="student-tt-btn-excel" title="Download Excel/CSV schedule">
              <span>📥 Export CSV</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="student-tt-btn-pdf" title="Print or save as PDF">
              <span>🖨️ Print Schedule</span>
            </button>
          </div>
        </div>

        <!-- Section Selector Buttons -->
        <div class="tt-sections-horizontal-bar">
          <div class="tt-sections-bar-main">
            <span class="tt-sections-label">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Select Section:
            </span>
            <div class="tt-sec-chips-scroll" role="tablist" aria-label="Section Selector">
              ${((state.sections && state.sections.length > 0) ? state.sections : DEFAULT_SECTIONS).map(sec => {
                const sName = typeof sec === 'string' ? sec : sec.name;
                const isActive = sName === state.currentSection;
                const roomName = sec.room ? sec.room : "";
                return `
                  <button type="button" class="tt-sec-chip ${isActive ? 'active' : ''}" data-student-select-sec="${escapeHtml(sName)}" role="tab" aria-selected="${isActive ? 'true' : 'false'}" title="Switch to Section ${escapeHtml(sName)} Schedule">
                    <span class="tt-sec-chip-indicator"></span>
                    <span class="tt-sec-chip-name">${escapeHtml(sName)}</span>
                    ${roomName ? `<span class="tt-sec-chip-room">${escapeHtml(roomName)}</span>` : ""}
                  </button>
                `;
              }).join("")}
            </div>
          </div>

          <div class="tt-sections-meta-info">
            <span class="tt-sec-version-tag">Verified Timetable • <strong>v${version || 1}</strong></span>
          </div>
        </div>

        <!-- Student Filters Ribbon -->
        <div class="tt-controls-ribbon" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:12px 16px;background:#ffffff;border:1px solid var(--slate-200,#e2e8f0);border-radius:10px;margin-bottom:18px;">
          <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:8px;">
              <label for="student-group-filter-select" style="font-size:0.84rem;font-weight:600;color:var(--slate-700,#334155);">Lab Batch / Group:</label>
              <select id="student-group-filter-select" class="tt-filter-select" style="padding:5px 10px;font-size:0.83rem;border:1px solid var(--slate-300,#cbd5e1);border-radius:6px;background:#f8fafc;color:var(--slate-800,#1e293b);">
                <option value="all" ${state.groupFilter === 'all' ? 'selected' : ''}>Combined (Both Groups)</option>
                <option value="Group 1" ${state.groupFilter === 'Group 1' ? 'selected' : ''}>Group 1 (Batch 1)</option>
                <option value="Group 2" ${state.groupFilter === 'Group 2' ? 'selected' : ''}>Group 2 (Batch 2)</option>
              </select>
            </div>
            <div style="font-size:0.8rem;color:var(--slate-500,#64748b);">
              Showing active schedule for <strong>${escapeHtml(state.currentSection)}</strong>
            </div>
          </div>
          <div style="font-size:0.78rem;color:var(--slate-500,#64748b);">
            🔒 Timetable administration and room allocations are managed by Staff.
          </div>
        </div>

        <!-- Timetable Visual Grid -->
        <div class="tt-grid-outer-scroll student-grid">
          <table class="tt-reference-table student-table">
            <thead>
              <tr>
                <th class="col-day">Day \\ Period</th>
                <th class="col-period"><div class="period-header-name">P1</div><div class="period-header-time">09:10 – 10:00</div></th>
                <th class="col-period"><div class="period-header-name">P2</div><div class="period-header-time">10:01 – 10:50</div></th>
                <th class="col-period"><div class="period-header-name">P3</div><div class="period-header-time">10:51 – 11:40</div></th>
                <th class="col-period"><div class="period-header-name">P4</div><div class="period-header-time">11:41 – 12:30</div></th>
                <th class="col-lunch"><div class="period-header-name">LUNCH</div><div class="period-header-time">12:31 – 01:10</div></th>
                <th class="col-period"><div class="period-header-name">P6</div><div class="period-header-time">01:11 – 02:00</div></th>
                <th class="col-period"><div class="period-header-name">P7</div><div class="period-header-time">02:01 – 02:50</div></th>
                <th class="col-period"><div class="period-header-name">P8</div><div class="period-header-time">02:51 – 03:40</div></th>
                <th class="col-period"><div class="period-header-name">P9</div><div class="period-header-time">03:41 – 04:30</div></th>
              </tr>
            </thead>
            <tbody>
              ${renderStudentGridRows(filteredClasses)}
            </tbody>
          </table>
        </div>

        <!-- Activity Legend -->
        <div class="tt-legend-card" style="margin-top:16px;">
          <span style="font-weight:700;margin-right:8px;">Activity Legend:</span>
          <div class="tt-legend-item"><span class="tt-legend-dot tech"></span><span>Technical Training (4-Period Block)</span></div>
          <div class="tt-legend-item"><span class="tt-legend-dot lab"></span><span>Practical Laboratory (2-Period Block)</span></div>
          <div class="tt-legend-item"><span class="tt-legend-dot theory"></span><span>Theoretical Lecture</span></div>
          <div class="tt-legend-item"><span class="tt-legend-dot tutorial"></span><span>Tutorial Session</span></div>
        </div>
      </div>
    `;
  }

  function getTabMetadata(tabKey) {
    const map = {
      "dashboard": { title: "Academic Overview", sub: "Master scheduling metrics, section generation statuses, and rapid management actions" },
      "generator": { title: "Timetable Generator", sub: "Automated clash-free timetable optimization and hard constraint engine" },
      "editable-tt": { title: "Class & Schedule Editor", sub: "Interactive cell-level lecture, laboratory, and certified faculty assignment" },
      "faculty-mgmt": { title: "Faculty Members", sub: "Manage professors, lecturer profiles, subject certifications, and departments" },
      "section-mgmt": { title: "Section Management", sub: "Configure college batches (A, B, C, D) and assigned default lecture halls" },
      "workload": { title: "Faculty Workload Analytics", sub: "Institutional compliance check: max 18 teaching hours/week and max 4 hours/day" },
      "subject-config": { title: "Subjects & Quotas", sub: "Curriculum requirements, weekly lecture quotas, and laboratory block lengths" },
      "rooms-labs": { title: "Classrooms & Specialized Labs", sub: "Lecture theatres, computer laboratories, and tutorial rooms inventory" },
      "conflict-detection": { title: "Conflict Audit (12 Hard Rules)", sub: "Rigorous verification against overlapping rooms, teachers, and limits" },
      "reports-export": { title: "Reports & Analytics", sub: "Institutional schedule distribution, faculty workload exports, and audit logs" },
      "settings": { title: "Timetable Settings", sub: "Academic calendar sessions, periods per day, and institutional parameters" }
    };
    return map[tabKey] || { title: "Timetable Administration", sub: "Academic scheduling and curriculum management" };
  }

  // Staff Administration Markup (Full 11 Modules with Clean Minimal UI)
  function renderStaffAdminMarkup(hasClasses, sectionClasses, version, lastModifiedBy) {
    const isStaff = isStaffRole(state.role);
    const roleTitle = state.role === "admin" ? "Administrator" : "Staff / Faculty";
    const tabMeta = getTabMetadata(state.activeTab);

    return `
      <div class="tt-view-wrapper">
        <!-- Clean Staff Control Header -->
        <div class="tt-staff-control-header">
          <div class="tt-control-left">
            <div class="tt-view-title-wrap">
              <div class="tt-subnav-kicker">
                <span>AKTU B.Tech CSE · Sem 3</span>
                <span class="tt-kicker-sep">·</span>
                <span>Session ${escapeHtml(state.settings.academicYear || "2025–2026")}</span>
              </div>
              <h1 class="tt-view-title">${tabMeta.title}</h1>
              <p class="tt-view-sub">${tabMeta.sub}</p>
            </div>
          </div>

          <div class="tt-control-right">
            <!-- Compact Section Selector -->
            <div class="tt-compact-sec-picker" title="Switch active academic section">
              <label for="tt-compact-section-select" class="tt-picker-label">Section:</label>
              <select id="tt-compact-section-select" class="tt-compact-select" aria-label="Select section">
                ${(state.sections || []).map(sec => {
                  const sName = typeof sec === 'string' ? sec : sec.name;
                  const isSel = sName === state.currentSection ? 'selected' : '';
                  const roomInfo = sec.room ? ` · ${sec.room}` : '';
                  return `<option value="${escapeHtml(sName)}" ${isSel}>Section ${escapeHtml(sName)}${escapeHtml(roomInfo)}</option>`;
                }).join("")}
              </select>
              <button type="button" class="btn btn-ghost btn-xs tt-picker-add-btn" id="tt-btn-open-add-sec-modal" title="Add New Academic Section">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Add</span>
              </button>
            </div>

            <!-- Version tag -->
            <div class="tt-version-badge" title="Schedule release version">
              <span class="tt-version-num">v${version || 1}</span>
              ${lastModifiedBy ? `<span class="tt-version-author">• ${escapeHtml(lastModifiedBy)}</span>` : ''}
            </div>
          </div>
        </div>

        <!-- Render Tab Body Content -->
        <div class="tt-tab-content-area">
          ${renderActiveTabContent(hasClasses, sectionClasses)}
        </div>
      </div>

      <!-- Modals for CRUD and Interactive Editing -->
      ${renderModals()}
    `;
  }

  function syncStaffSidebarAndBreadcrumb() {
    document.querySelectorAll(".staff-nav-item[data-tt-tab]").forEach(item => {
      const tab = item.getAttribute("data-tt-tab");
      const isActive = tab === state.activeTab;
      item.classList.toggle("active", isActive);
      if (isActive) {
        const parentGroup = item.closest(".sidebar-collapsible-group");
        if (parentGroup) {
          parentGroup.classList.remove("is-collapsed");
          const btn = parentGroup.querySelector(".sidebar-group-header-btn");
          if (btn) btn.setAttribute("aria-expanded", "true");
        }
      }
    });

    const topCrumb = document.getElementById("staffTopCrumb");
    if (topCrumb) {
      const activeLink = document.querySelector(`.staff-nav-item[data-tt-tab="${state.activeTab}"]`);
      if (activeLink) {
        topCrumb.textContent = activeLink.querySelector("span")?.textContent || "Timetable Administration";
      }
    }
  }

  function render() {
    const studentContainer = document.getElementById("timetable-module");
    const staffContainer = document.getElementById("staff-timetable-module");

    if (!studentContainer && !staffContainer) return;

    if (!state.data) {
      const loadingHtml = `
        <div style="padding: 70px 20px; text-align: center; color: var(--slate-500, #64748b);">
          <div class="tt-loading-spinner" style="margin: 0 auto 16px;"></div>
          <h3 style="font-weight: 700; font-size: 1.15rem; color: var(--slate-800, #1e293b);">Loading Timetable Schedule…</h3>
          <p style="font-size: 0.88rem; margin-top: 6px;">Fetching academic curriculum and schedule datasets.</p>
        </div>
      `;
      if (studentContainer) studentContainer.innerHTML = loadingHtml;
      if (staffContainer) staffContainer.innerHTML = loadingHtml;
      return;
    }

    const { version, lastModifiedBy } = state.data;
    const sectionClasses = (state.data.classes || []).filter(c => c.section === state.currentSection);
    const hasClasses = sectionClasses.length > 0;

    // Render for Staff Administration container if present and user has staff privileges
    if (staffContainer && isStaffRole(state.role)) {
      staffContainer.innerHTML = renderStaffAdminMarkup(hasClasses, sectionClasses, version, lastModifiedBy);
      bindStaffAdminEvents();
      syncStaffSidebarAndBreadcrumb();
    }

    // Render for Student View container if present
    if (studentContainer) {
      studentContainer.innerHTML = renderStudentTimetableMarkup(hasClasses, sectionClasses, version);
      bindStudentEvents();
    }
  }

  /* ============================================================================
     6. RENDER SPECIFIC TAB VIEWS
     ============================================================================ */
  function renderActiveTabContent(hasClasses, sectionClasses) {
    switch (state.activeTab) {
      case "dashboard":
        return renderDashboardTab();
      case "section-mgmt":
        return renderSectionManagementTab();
      case "faculty-mgmt":
        return renderFacultyManagementTab();
      case "subject-config":
        return renderSubjectConfigurationTab();
      case "rooms-labs":
        return renderRoomsLaboratoriesTab();
      case "generator":
        return renderGeneratorTab(hasClasses, sectionClasses, false);
      case "editable-tt":
        return renderGeneratorTab(hasClasses, sectionClasses, true);
      case "workload":
        return renderFacultyWorkloadTab();
      case "conflict-detection":
        return renderConflictDetectionTab();
      case "reports-export":
        return renderReportsExportTab();
      case "settings":
        return renderSettingsTab();
      default:
        return renderDashboardTab();
    }
  }

  // TAB 1: DASHBOARD
  function renderDashboardTab() {
    const allClasses = state.data.classes || [];
    const scheduledLectures = allClasses.filter(c => c.type === "theory").length;
    const scheduledLabs = allClasses.filter(c => c.type === "lab").length;
    const workloadWarnings = (state.workloads || []).filter(w => w.hasWeeklyOverload || w.hasDailyOverload).length;
    const auditScore = state.audit ? state.audit.score : 100;

    return `
      <div class="tt-dashboard-view">
        <!-- KPI Summary Cards Grid -->
        <div class="tt-dashboard-grid">
          <div class="tt-kpi-card">
            <div class="tt-kpi-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <div class="tt-kpi-data">
              <span class="tt-kpi-value">${state.sections.length}</span>
              <span class="tt-kpi-label">Active Sections</span>
            </div>
          </div>

          <div class="tt-kpi-card">
            <div class="tt-kpi-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="tt-kpi-data">
              <span class="tt-kpi-value">${state.teachers.length}</span>
              <span class="tt-kpi-label">Faculty Members</span>
            </div>
          </div>

          <div class="tt-kpi-card">
            <div class="tt-kpi-icon purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </div>
            <div class="tt-kpi-data">
              <span class="tt-kpi-value">${state.subjects.length}</span>
              <span class="tt-kpi-label">Subjects &amp; Labs</span>
            </div>
          </div>

          <div class="tt-kpi-card">
            <div class="tt-kpi-icon orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div class="tt-kpi-data">
              <span class="tt-kpi-value">${scheduledLectures + scheduledLabs}</span>
              <span class="tt-kpi-label">Scheduled Slots</span>
            </div>
          </div>

          <div class="tt-kpi-card">
            <div class="tt-kpi-icon ${workloadWarnings > 0 ? 'red' : 'green'}">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="tt-kpi-data">
              <span class="tt-kpi-value">${workloadWarnings}</span>
              <span class="tt-kpi-label">Workload Alerts</span>
            </div>
          </div>

          <div class="tt-kpi-card">
            <div class="tt-kpi-icon ${auditScore === 100 ? 'green' : 'orange'}">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div class="tt-kpi-data">
              <span class="tt-kpi-value">${auditScore}%</span>
              <span class="tt-kpi-label">Validation Status</span>
            </div>
          </div>
        </div>

        <!-- Quick Access Action Center -->
        <div style="background:#ffffff;border:1px solid var(--slate-200,#e2e8f0);border-radius:12px;padding:20px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
            <div>
              <h3 style="font-size:1.15rem;font-weight:800;color:var(--slate-900,#0f172a);margin:0 0 4px 0;">Generation &amp; Management Hub</h3>
              <p style="font-size:0.86rem;color:var(--slate-500,#64748b);margin:0;">Quickly run constraint optimization, review validation audits, or modify sections.</p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button type="button" class="btn btn-tt-generate" id="dash-btn-generate">
                ⚡ Generate ${escapeHtml(state.currentSection)} Timetable
              </button>
              <button type="button" class="btn btn-secondary" id="dash-btn-view-grid">
                📅 View Timetable Grid
              </button>
              <button type="button" class="btn btn-secondary" id="dash-btn-audit">
                🛡️ Audit All Constraints
              </button>
            </div>
          </div>

          <!-- Section Status Cards Grid -->
          <div class="tt-section-overview-grid">
            ${(state.sections || []).map(sec => {
              const sName = typeof sec === 'string' ? sec : sec.name;
              const secClasses = (allClasses || []).filter(c => c.section === sName);
              const isActive = sName === state.currentSection;
              return `
                <div class="tt-sec-overview-card ${isActive ? 'is-active' : ''}">
                  <div class="tt-sec-card-top">
                    <div>
                      <h4 class="tt-sec-card-title">Section ${escapeHtml(sName)}</h4>
                      <div class="tt-sec-card-room">📍 ${escapeHtml(sec.room || 'Lecture Hall')} • ${escapeHtml(sec.coordinator || 'Coordinator')}</div>
                    </div>
                    <span class="tt-auth-badge ${secClasses.length > 0 ? 'faculty' : 'student'}" style="font-size:0.7rem;padding:3px 8px;">
                      ${secClasses.length > 0 ? '✓ Scheduled' : 'Empty'}
                    </span>
                  </div>

                  <div class="tt-sec-card-stats">
                    <div><strong>${secClasses.length}</strong> total slots</div>
                    <div><strong>${secClasses.filter(c => c.type === 'lab').length}</strong> lab periods</div>
                    <div><strong>${sec.students || 60}</strong> students</div>
                    <div><strong>G1 &amp; G2</strong> subdivisions</div>
                  </div>

                  <div class="tt-sec-card-actions">
                    <button type="button" class="btn btn-primary btn-xs dash-switch-sec-btn" data-sec="${escapeHtml(sName)}" style="flex:1;">
                      Switch to Section
                    </button>
                    <button type="button" class="btn btn-secondary btn-xs dash-gen-sec-btn" data-sec="${escapeHtml(sName)}">
                      Generate
                    </button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;
  }

  // TAB 2: SECTION MANAGEMENT
  function renderSectionManagementTab() {
    return `
      <div class="tt-section-mgmt-view">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
          <div>
            <h3 style="font-size:1.25rem;font-weight:800;color:var(--slate-900,#0f172a);margin:0 0 4px 0;">Class Sections Management</h3>
            <p style="font-size:0.86rem;color:var(--slate-500,#64748b);margin:0;">
              Manage unlimited sections (e.g. CSE 2D, 2E, 2F, 2G, 2H, and additional batches). Each section maintains completely independent records and isolated versions.
            </p>
          </div>
          <button type="button" class="btn btn-primary" id="btn-open-create-sec-modal">
            + Add New Section
          </button>
        </div>

        <div class="tt-section-overview-grid">
          ${(state.sections || []).map(sec => {
            const sName = typeof sec === 'string' ? sec : sec.name;
            const secClasses = (state.data.classes || []).filter(c => c.section === sName);
            const isSelected = sName === state.currentSection;
            return `
              <div class="tt-sec-overview-card ${isSelected ? 'is-active' : ''}">
                <div class="tt-sec-card-top">
                  <div>
                    <h4 class="tt-sec-card-title">Section ${escapeHtml(sName)}</h4>
                    <div class="tt-sec-card-room">Classroom: <strong>${escapeHtml(sec.room || 'Unassigned')}</strong></div>
                    <div style="font-size:0.78rem;color:#64748b;margin-top:2px;">Coordinator: ${escapeHtml(sec.coordinator || 'Faculty In-Charge')}</div>
                  </div>
                  <span class="tt-auth-badge ${isSelected ? 'faculty' : 'student'}">
                    ${isSelected ? 'Active Selection' : 'Batch'}
                  </span>
                </div>

                <div class="tt-sec-card-stats">
                  <div>Student Count: <strong>${sec.students || 60}</strong></div>
                  <div>Semester: <strong>${escapeHtml(sec.semester || 'Semester 3')}</strong></div>
                  <div>Subdivisions: <strong>G1 &amp; G2</strong></div>
                  <div>Classes: <strong>${secClasses.length} slots</strong></div>
                </div>

                <div class="tt-sec-card-actions">
                  <button type="button" class="btn btn-secondary btn-xs btn-edit-sec" data-id="${escapeHtml(sec.id || sName)}" data-name="${escapeHtml(sName)}" data-room="${escapeHtml(sec.room || '')}" data-coord="${escapeHtml(sec.coordinator || '')}" data-students="${sec.students || 60}">
                    Edit
                  </button>
                  <button type="button" class="btn btn-secondary btn-xs btn-duplicate-sec" data-name="${escapeHtml(sName)}" title="Duplicate configuration independently">
                    Duplicate
                  </button>
                  <button type="button" class="btn btn-ghost btn-xs btn-delete-sec" data-id="${escapeHtml(sec.id || sName)}" data-name="${escapeHtml(sName)}" style="color:#ef4444;">
                    Delete
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  // TAB 3: FACULTY MANAGEMENT
  function renderFacultyManagementTab() {
    return `
      <div class="tt-faculty-mgmt-view">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
          <div>
            <h3 style="font-size:1.25rem;font-weight:800;color:var(--slate-900,#0f172a);margin:0 0 4px 0;">Faculty Roster &amp; Teaching Capacity</h3>
            <p style="font-size:0.86rem;color:var(--slate-500,#64748b);margin:0;">
              Initial faculty F1 through F10 with certified subjects and workload limits (maximum 18 teaching hours per week).
            </p>
          </div>
          <button type="button" class="btn btn-primary" id="btn-open-create-faculty-modal">
            + Add Faculty Member
          </button>
        </div>

        <div style="background:#ffffff;border:1px solid var(--slate-200,#e2e8f0);border-radius:12px;overflow-x:auto;">
          <table class="tt-report-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Faculty Name</th>
                <th>Designation &amp; Department</th>
                <th>Qualified Subjects</th>
                <th>Assigned Weekly Load</th>
                <th>Max Limit</th>
                <th>Workload Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${(state.teachers || []).map(t => {
                const w = (state.workloads || []).find(wl => wl.teacherId === t.id || wl.code === t.code) || { totalWeeklyHours: 0, maxWeeklyHours: 18 };
                const pct = Math.min(100, Math.round((w.totalWeeklyHours / (t.maxWeeklyHours || 18)) * 100));
                return `
                  <tr>
                    <td><strong><code>${escapeHtml(t.code || t.id)}</code></strong></td>
                    <td>
                      <strong>${escapeHtml(t.name)}</strong>
                      <div style="font-size:0.75rem;color:#64748b;">${escapeHtml(t.email || '')}</div>
                    </td>
                    <td>
                      <div>${escapeHtml(t.designation || 'Faculty')}</div>
                      <small style="color:#64748b;">${escapeHtml(t.department || 'CSE')}</small>
                    </td>
                    <td>
                      <div style="font-size:0.78rem;color:#334155;max-width:240px;line-height:1.4;">
                        ${(t.eligibleSubjects || []).join(', ') || 'General Engineering'}
                      </div>
                    </td>
                    <td>
                      <div class="tt-workload-bar-wrap" style="width:140px;">
                        <div class="tt-workload-bar-track">
                          <div class="tt-workload-bar-fill ${w.totalWeeklyHours > (t.maxWeeklyHours || 18) ? 'overload' : (pct >= 85 ? 'high' : 'normal')}" style="width:${pct}%;"></div>
                        </div>
                        <span style="font-size:0.8rem;font-weight:700;">${w.totalWeeklyHours}h</span>
                      </div>
                    </td>
                    <td><strong>${t.maxWeeklyHours || 18} hrs/wk</strong></td>
                    <td>
                      <span class="tt-auth-badge ${w.totalWeeklyHours > (t.maxWeeklyHours || 18) ? 'admin' : (pct >= 85 ? 'student' : 'faculty')}" style="font-size:0.75rem;">
                        ${w.totalWeeklyHours > (t.maxWeeklyHours || 18) ? '⚠️ Overload' : (pct >= 85 ? 'Near Capacity' : '✓ Compliant')}
                      </span>
                    </td>
                    <td style="text-align:right;">
                      <button type="button" class="btn btn-secondary btn-xs btn-edit-faculty" data-id="${escapeHtml(t.id)}">Edit</button>
                      <button type="button" class="btn btn-ghost btn-xs btn-del-faculty" data-id="${escapeHtml(t.id)}" style="color:#ef4444;">Delete</button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // TAB 4: SUBJECT CONFIGURATION
  function renderSubjectConfigurationTab() {
    const feas = state.feasibility || {};
    return `
      <div class="tt-subject-config-view">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
          <div>
            <h3 style="font-size:1.25rem;font-weight:800;color:var(--slate-900,#0f172a);margin:0 0 4px 0;">Subject &amp; Laboratory Curriculum Configuration</h3>
            <p style="font-size:0.86rem;color:var(--slate-500,#64748b);margin:0;">
              Configure core subjects S1–S6, mandatory 2-period practical labs, 4-period technical training, and subject tutorials.
            </p>
          </div>
          <button type="button" class="btn btn-primary" id="btn-open-create-subject-modal">
            + Add New Subject
          </button>
        </div>

        <!-- Feasibility Check Alert Banner -->
        <div style="background:#ffffff;border:1px solid ${feas.feasible ? '#bbf7d0' : '#fecaca'};border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="tt-auth-badge ${feas.feasible ? 'faculty' : 'admin'}" style="font-weight:800;">
                ${feas.feasible ? '✓ Feasibility Passed' : '⚠️ Over-Subscribed Curriculum Warning'}
              </span>
              <strong style="color:var(--slate-800,#1e293b);">${feas.totalRequiredPeriods || 0} slots required / ${feas.totalSlotsPerWeek || 45} slots available</strong>
            </div>
            <p style="font-size:0.82rem;color:var(--slate-600,#475569);margin:4px 0 0 0;">
              ${feas.feasible
                ? `Current subject quotas fit comfortably within the weekly timetable (Surplus: ${feas.surplusOrDeficit} slots available for enrichment/sports).`
                : `Requirements exceed available periods! Please reduce subject lecture counts or enable Saturday classes in Settings.`}
            </p>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-check-feasibility">
            Re-Verify Feasibility
          </button>
        </div>

        <!-- Subjects List Table -->
        <div style="background:#ffffff;border:1px solid var(--slate-200,#e2e8f0);border-radius:12px;overflow-x:auto;">
          <table class="tt-report-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject Name</th>
                <th>Type</th>
                <th>Weekly Lectures</th>
                <th>Block Length</th>
                <th>Certified Faculty</th>
                <th>Default Facility</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${(state.subjects || []).map(s => `
                <tr>
                  <td><strong><code>${escapeHtml(s.code || s.codeId || s.id)}</code></strong></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span class="tt-legend-dot" style="background:${s.color || '#3b82f6'};"></span>
                      <div>
                        <strong>${escapeHtml(s.name)}</strong>
                        ${s.shortName ? `<small style="display:block;color:#64748b;">Short: ${escapeHtml(s.shortName)}</small>` : ""}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="tt-card-type-badge card-${s.type}" style="border:1px solid rgba(0,0,0,0.1);">
                      ${s.type.toUpperCase()}
                    </span>
                  </td>
                  <td><strong>${s.weeklyLectures} lectures/wk</strong></td>
                  <td>${s.blockLength || 1} period(s) ${s.isContinuousBlock ? '(Continuous)' : ''}</td>
                  <td><div style="font-size:0.78rem;color:#475569;">${(s.eligibleFaculty || []).join(', ') || 'Any'}</div></td>
                  <td>${escapeHtml(s.defaultRoom || 'Lecture Hall')}</td>
                  <td style="text-align:right;">
                    <button type="button" class="btn btn-secondary btn-xs btn-edit-subject" data-id="${escapeHtml(s.id)}">Edit</button>
                    <button type="button" class="btn btn-ghost btn-xs btn-del-subject" data-id="${escapeHtml(s.id)}" style="color:#ef4444;">Delete</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // TAB 5: ROOMS & LABORATORIES
  function renderRoomsLaboratoriesTab() {
    return `
      <div class="tt-rooms-labs-view">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
          <div>
            <h3 style="font-size:1.25rem;font-weight:800;color:var(--slate-900,#0f172a);margin:0 0 4px 0;">Classrooms &amp; Specialized Laboratories</h3>
            <p style="font-size:0.86rem;color:var(--slate-500,#64748b);margin:0;">
              Lecture halls, computer laboratories, hardware labs, and tutorial rooms to prevent physical double-booking.
            </p>
          </div>
          <button type="button" class="btn btn-primary" id="btn-open-create-room-modal">
            + Register Facility
          </button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));gap:16px;">
          ${(state.rooms || []).map(rm => `
            <div style="background:#ffffff;border:1px solid var(--slate-200,#e2e8f0);border-radius:12px;padding:16px;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                  <h4 style="font-size:1.05rem;font-weight:700;margin:0;color:var(--slate-900,#0f172a);">${escapeHtml(rm.name)}</h4>
                  <span class="tt-auth-badge ${rm.isLab ? 'faculty' : 'student'}" style="font-size:0.72rem;">
                    ${rm.isLab ? 'Laboratory' : 'Classroom'}
                  </span>
                </div>
                <div style="font-size:0.8rem;color:#64748b;margin-bottom:12px;">
                  <div>Facility Type: <strong>${escapeHtml(rm.type || 'Lecture Hall')}</strong></div>
                  <div>Building: <strong>${escapeHtml(rm.block || 'Academic Block')}</strong></div>
                  <div>Seating Capacity: <strong>${rm.capacity || 60} students</strong></div>
                </div>
              </div>

              <div style="display:flex;gap:8px;">
                <button type="button" class="btn btn-secondary btn-xs btn-edit-room" data-id="${escapeHtml(rm.id)}" style="flex:1;">Edit</button>
                <button type="button" class="btn btn-ghost btn-xs btn-del-room" data-id="${escapeHtml(rm.id)}" style="color:#ef4444;">Delete</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  // TAB 6 & 7: TIMETABLE GENERATOR & EDITABLE TIMETABLE
  function renderGeneratorTab(hasClasses, sectionClasses, isEditableMode) {
    const periods = (state.data.periods || []).filter(p => !p.isLunchBreak);
    const lunchBreak = state.data.lunchBreak || { periodId: 5, label: "Recess / Lunch Interval", time: "12:31 PM – 01:10 PM" };

    return `
      <div class="tt-generator-view">
        <!-- Unified Clean Professional Toolbar -->
        <div class="tt-unified-toolbar">
          <div class="tt-toolbar-primary-group">
            <button type="button" class="btn btn-tt-generate ${state.isGenerating ? 'loading' : ''}" id="btn-run-generate" title="Generate an optimized clash-free timetable">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>${state.isGenerating ? "Generating…" : "Generate"}</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-import-excel" title="Import Faculty, Subject Mapping & Workload from Excel (.xlsx, .xls) and Generate Timetable">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2m4 0h2m-8 4h8"/><path d="M12 9v8"/></svg>
              <span>Import Excel</span>
            </button>
            <input type="file" id="tt-excel-file-input" accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" style="display:none;" />
            <button type="button" class="btn btn-secondary btn-sm" id="btn-run-regenerate" title="Generate a different valid timetable for this section">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
              <span>Regenerate</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-run-validate" title="Audit timetable against all 12 hard constraints">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Validate</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm ${state.isSaving ? 'loading' : ''}" id="btn-run-save" title="Save timetable changes">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              <span>Save</span>
            </button>
          </div>

          <div class="tt-toolbar-divider"></div>

          <!-- Group Focus Filter Segmented Tabs -->
          <div class="tt-toolbar-filter-group">
            <span class="tt-toolbar-label">Group:</span>
            <div class="tt-filter-pill-group" role="tablist" aria-label="Group Focus Filter">
              <button type="button" class="tt-filter-pill ${state.groupFilter === 'all' ? 'active' : ''}" data-g-filter="all">All (G1+G2)</button>
              <button type="button" class="tt-filter-pill ${state.groupFilter === 'g1' ? 'active' : ''}" data-g-filter="g1">G1</button>
              <button type="button" class="tt-filter-pill ${state.groupFilter === 'g2' ? 'active' : ''}" data-g-filter="g2">G2</button>
            </div>
          </div>

          <div class="tt-toolbar-spacer"></div>

          <div class="tt-toolbar-auxiliary-group">
            <!-- Mode Switcher -->
            <button type="button" class="btn btn-sm ${isEditableMode ? 'btn-primary' : 'btn-secondary'}" data-tt-tab="${isEditableMode ? 'generator' : 'editable-tt'}" title="Toggle interactive cell editing mode">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>${isEditableMode ? 'Editing Active' : 'Edit Mode'}</span>
            </button>

            <!-- Actions Dropdown -->
            <div class="tt-dropdown-wrapper" id="ttActionsDropdownWrap">
              <button type="button" class="btn btn-secondary btn-sm tt-dropdown-btn" id="btn-toggle-actions-dropdown" aria-haspopup="true" aria-expanded="false" title="More timetable actions">
                <span>Actions</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              <div class="tt-dropdown-menu hidden" id="ttActionsDropdownMenu" role="menu">
                <button type="button" class="tt-dropdown-item" id="btn-undo-changes" role="menuitem">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                  <span>Undo Changes</span>
                </button>
                <button type="button" class="tt-dropdown-item" id="btn-publish-tt" role="menuitem">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                  <span>Publish Schedule</span>
                </button>
                <div class="tt-dropdown-divider"></div>
                <button type="button" class="tt-dropdown-item" id="btn-export-pdf" role="menuitem">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span>Export PDF</span>
                </button>
                <button type="button" class="tt-dropdown-item" id="btn-export-excel" role="menuitem">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
                  <span>Export Excel (.xlsx)</span>
                </button>
                <button type="button" class="tt-dropdown-item" id="btn-print-tt" role="menuitem">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  <span>Print Timetable</span>
                </button>
                <div class="tt-dropdown-divider"></div>
                <button type="button" class="tt-dropdown-item tt-dropdown-danger" id="btn-open-delete-sec-modal" role="menuitem">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  <span>Delete Timetable (${escapeHtml(state.currentSection)})</span>
                </button>
                <button type="button" class="tt-dropdown-item tt-dropdown-danger" id="btn-open-clear-all-modal" role="menuitem">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  <span>Clear All Timetables</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        ${!hasClasses ? `
          <div style="background:#ffffff;border:1px solid var(--slate-200,#e2e8f0);border-radius:12px;padding:60px 20px;text-align:center;">
            <div style="width:64px;height:64px;background:#eff6ff;color:#2563eb;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <h3 style="font-size:1.2rem;font-weight:800;color:var(--slate-900,#0f172a);margin:0 0 8px 0;">No Timetable Generated for Section ${escapeHtml(state.currentSection)}</h3>
            <p style="font-size:0.9rem;color:var(--slate-500,#64748b);max-width:540px;margin:0 auto 20px;">
              Generate an optimized clash-free schedule with lab blocks and technical training, or import teacher allocations from an Excel spreadsheet.
            </p>
            <div style="display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;">
              <button type="button" class="btn btn-tt-generate" id="empty-state-generate-btn">
                ⚡ Generate Timetable for ${escapeHtml(state.currentSection)}
              </button>
              <button type="button" class="btn btn-secondary" id="empty-state-import-btn" title="Import from Excel spreadsheet">
                📊 Import Excel &amp; Generate
              </button>
            </div>
          </div>
        ` : `
          <!-- Visual Reference Timetable Grid -->
          <div class="tt-grid-container" id="tt-print-area">
            <table class="tt-reference-table">
              <thead>
                <tr>
                  <th class="col-day">Day \\ Period</th>
                  <th class="col-period">
                    <div class="period-header-name">P1</div>
                    <div class="period-header-time">09:10 – 10:00</div>
                  </th>
                  <th class="col-period">
                    <div class="period-header-name">P2</div>
                    <div class="period-header-time">10:01 – 10:50</div>
                  </th>
                  <th class="col-period">
                    <div class="period-header-name">P3</div>
                    <div class="period-header-time">10:51 – 11:40</div>
                  </th>
                  <th class="col-period">
                    <div class="period-header-name">P4</div>
                    <div class="period-header-time">11:41 – 12:30</div>
                  </th>
                  <th class="col-lunch">
                    <div class="period-header-name">LUNCH</div>
                    <div class="period-header-time">12:31 – 01:10</div>
                  </th>
                  <th class="col-period">
                    <div class="period-header-name">P6</div>
                    <div class="period-header-time">01:11 – 02:00</div>
                  </th>
                  <th class="col-period">
                    <div class="period-header-name">P7</div>
                    <div class="period-header-time">02:01 – 02:50</div>
                  </th>
                  <th class="col-period">
                    <div class="period-header-name">P8</div>
                    <div class="period-header-time">02:51 – 03:40</div>
                  </th>
                  <th class="col-period">
                    <div class="period-header-name">P9</div>
                    <div class="period-header-time">03:41 – 04:30</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                ${renderReferenceGridRows(sectionClasses, isEditableMode)}
              </tbody>
            </table>
          </div>

          <!-- Activity Color Legend -->
          <div class="tt-legend-card">
            <span style="font-weight:700;margin-right:8px;">Activity Legend:</span>
            <div class="tt-legend-item">
              <span class="tt-legend-dot tech"></span>
              <span>Technical Training (4 Consecutive Periods)</span>
            </div>
            <div class="tt-legend-item">
              <span class="tt-legend-dot lab"></span>
              <span>Practical Laboratory (2 Consecutive Periods)</span>
            </div>
            <div class="tt-legend-item">
              <span class="tt-legend-dot theory"></span>
              <span>Theoretical Core (DS, DSTL, TC, COA, Python, M4)</span>
            </div>
            <div class="tt-legend-item">
              <span class="tt-legend-dot tutorial"></span>
              <span>Tutorial Session (Parallel to opposite lab)</span>
            </div>
            <div class="tt-legend-item">
              <span class="tt-legend-dot activity"></span>
              <span>Sports &amp; Library Enrichment</span>
            </div>
          </div>
        `}
      </div>
    `;
  }

  // Helper to render the visual grid rows with merged cells
  function renderReferenceGridRows(classes, isEditableMode) {
    const teachingPeriods = [1, 2, 3, 4, 6, 7, 8, 9];

    return DAYS.map(day => {
      let rowHtml = `<tr><td class="cell-day-label"><strong>${day}</strong></td>`;
      let skipPeriods = 0;

      for (let pIdx = 0; pIdx < teachingPeriods.length; pIdx++) {
        const p = teachingPeriods[pIdx];

        // Insert lunch column after Period 4
        if (p === 6) {
          rowHtml += `<td class="cell-lunch" title="Recess / Lunch Interval: 12:31 PM – 01:10 PM">LUNCH RECESS</td>`;
        }

        if (skipPeriods > 0) {
          skipPeriods--;
          continue;
        }

        // Check for Technical Training spanning 4 periods
        const techClass = classes.find(c => c.day === day && Number(c.period) === p && c.type === "training");
        if (techClass && (p === 1 || p === 6)) {
          // Check if it spans 4 periods
          const blockSpan = 4;
          rowHtml += `
            <td colspan="${blockSpan}" class="tt-merged-training-cell">
              <div class="tt-slot-card card-training" data-cell-edit="${techClass.id}" data-day="${day}" data-period="${p}">
                <div class="tt-slot-top-row">
                  <span class="tt-card-type-badge">TECHNICAL TRAINING (4-PERIOD BLOCK)</span>
                  <span class="tt-card-code">${escapeHtml(techClass.subjectCode || 'BCS-354')}</span>
                </div>
                <div class="tt-card-subject-name" style="font-size:0.95rem;">${escapeHtml(techClass.subjectName)}</div>
                <div class="tt-card-meta">
                  <span class="tt-card-faculty">👨‍🏫 Trainer: ${escapeHtml(techClass.teacherName || 'Faculty')}</span>
                  <span class="tt-card-room">📍 ${escapeHtml(techClass.room || 'Advanced Computing Lab')} • Both Groups (G1 + G2)</span>
                </div>
              </div>
            </td>
          `;
          skipPeriods = blockSpan - 1;
          continue;
        }

        // Check for Practical Lab spanning 2 periods
        const g1Lab = classes.find(c => c.day === day && Number(c.period) === p && c.type === "lab" && (c.group === "Group 1" || c.group === "Both"));
        const g2Lab = classes.find(c => c.day === day && Number(c.period) === p && c.type === "lab" && (c.group === "Group 2" || c.group === "Both"));

        if ((g1Lab || g2Lab) && (p === 1 || p === 3 || p === 6 || p === 8)) {
          const blockSpan = 2;
          const g1Item = classes.find(c => c.day === day && Number(c.period) === p && (c.group === "Group 1" || c.group === "Both"));
          const g2Item = classes.find(c => c.day === day && Number(c.period) === p && (c.group === "Group 2" || c.group === "Both"));

          rowHtml += `
            <td colspan="${blockSpan}" class="tt-merged-lab-cell">
              <div class="tt-split-parallel-wrap">
                <!-- Group 1 Slot -->
                <div class="tt-split-sub-card card-${g1Item?.type || 'lab'}" data-cell-edit="${g1Item?.id || ''}" data-day="${day}" data-period="${p}" data-group="Group 1">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="tt-split-group-tag">G1 • ${g1Item?.type === 'lab' ? 'LAB' : 'TUTORIAL'}</span>
                    <span style="font-size:0.65rem;font-weight:700;">${escapeHtml(g1Item?.subjectCode || '')}</span>
                  </div>
                  <div style="font-weight:700;font-size:0.78rem;">${escapeHtml(g1Item?.subjectShort || g1Item?.subjectName || 'Unassigned')}</div>
                  <div style="font-size:0.68rem;opacity:0.85;">👨‍🏫 ${escapeHtml(g1Item?.teacherName || '')} | 📍 ${escapeHtml(g1Item?.room || '')}</div>
                </div>

                <!-- Group 2 Slot -->
                <div class="tt-split-sub-card card-${g2Item?.type || 'tutorial'}" data-cell-edit="${g2Item?.id || ''}" data-day="${day}" data-period="${p}" data-group="Group 2">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="tt-split-group-tag">G2 • ${g2Item?.type === 'lab' ? 'LAB' : 'TUTORIAL'}</span>
                    <span style="font-size:0.65rem;font-weight:700;">${escapeHtml(g2Item?.subjectCode || '')}</span>
                  </div>
                  <div style="font-weight:700;font-size:0.78rem;">${escapeHtml(g2Item?.subjectShort || g2Item?.subjectName || 'Unassigned')}</div>
                  <div style="font-size:0.68rem;opacity:0.85;">👨‍🏫 ${escapeHtml(g2Item?.teacherName || '')} | 📍 ${escapeHtml(g2Item?.room || '')}</div>
                </div>
              </div>
            </td>
          `;
          skipPeriods = blockSpan - 1;
          continue;
        }

        // Standard single period
        const periodClasses = classes.filter(c => c.day === day && Number(c.period) === p);
        if (periodClasses.length === 0) {
          rowHtml += `
            <td>
              <div class="tt-empty-slot" data-cell-add="true" data-day="${day}" data-period="${p}">
                + Add
              </div>
            </td>
          `;
        } else if (periodClasses.length === 1 && periodClasses[0].group === "Both") {
          const cls = periodClasses[0];
          rowHtml += `
            <td>
              <div class="tt-slot-card card-${cls.type || 'theory'}" data-cell-edit="${cls.id}" data-day="${day}" data-period="${p}">
                <div class="tt-slot-top-row">
                  <span class="tt-card-type-badge">${cls.type.toUpperCase()}</span>
                  <span class="tt-card-code">${escapeHtml(cls.subjectCode || '')}</span>
                </div>
                <div class="tt-card-subject-name">${escapeHtml(cls.subjectShort || cls.subjectName)}</div>
                <div class="tt-card-meta">
                  <span class="tt-card-faculty">👨‍🏫 ${escapeHtml(cls.teacherName || '')}</span>
                  <span class="tt-card-room">📍 ${escapeHtml(cls.room || '')}</span>
                </div>
              </div>
            </td>
          `;
        } else {
          // Parallel items in one period
          const g1Cls = periodClasses.find(c => c.group === "Group 1");
          const g2Cls = periodClasses.find(c => c.group === "Group 2");
          rowHtml += `
            <td>
              <div class="tt-split-parallel-wrap">
                <div class="tt-split-sub-card card-${g1Cls?.type || 'theory'}" data-cell-edit="${g1Cls?.id || ''}" data-day="${day}" data-period="${p}" data-group="Group 1">
                  <span class="tt-split-group-tag">G1: ${escapeHtml(g1Cls?.subjectShort || g1Cls?.subjectName || 'Free')}</span>
                  <div style="font-size:0.68rem;opacity:0.85;">${escapeHtml(g1Cls?.teacherName || '')}</div>
                </div>
                <div class="tt-split-sub-card card-${g2Cls?.type || 'theory'}" data-cell-edit="${g2Cls?.id || ''}" data-day="${day}" data-period="${p}" data-group="Group 2">
                  <span class="tt-split-group-tag">G2: ${escapeHtml(g2Cls?.subjectShort || g2Cls?.subjectName || 'Free')}</span>
                  <div style="font-size:0.68rem;opacity:0.85;">${escapeHtml(g2Cls?.teacherName || '')}</div>
                </div>
              </div>
            </td>
          `;
        }
      }

      rowHtml += `</tr>`;
      return rowHtml;
    }).join("");
  }

  // TAB 8: FACULTY WORKLOAD
  function renderFacultyWorkloadTab() {
    return `
      <div class="tt-workload-view">
        <div style="background:#ffffff;border:1px solid var(--slate-200,#e2e8f0);border-radius:12px;padding:20px;margin-bottom:20px;">
          <h3 style="font-size:1.2rem;font-weight:800;color:var(--slate-900,#0f172a);margin:0 0 6px 0;">Faculty Workload Distribution</h3>
          <p style="font-size:0.86rem;color:var(--slate-500,#64748b);margin:0;">
            Institutional constraint enforcement: <strong>Maximum 18 teaching hours per week</strong> and <strong>maximum 4 hours per day</strong> per faculty member across all college sections.
          </p>
        </div>

        <div style="background:#ffffff;border:1px solid var(--slate-200,#e2e8f0);border-radius:12px;overflow-x:auto;">
          <table class="tt-report-table">
            <thead>
              <tr>
                <th>Faculty Code &amp; Name</th>
                <th>Mon</th>
                <th>Tue</th>
                <th>Wed</th>
                <th>Thu</th>
                <th>Fri</th>
                <th>Weekly Total</th>
                <th>Remaining Capacity</th>
                <th>Cap Limit</th>
                <th>Workload Status</th>
              </tr>
            </thead>
            <tbody>
              ${(state.workloads || []).map(w => {
                const dh = w.dailyHours || {};
                const pct = Math.min(100, Math.round((w.totalWeeklyHours / (w.maxWeeklyHours || 18)) * 100));
                return `
                  <tr>
                    <td>
                      <strong>${escapeHtml(w.name)}</strong>
                      <div style="font-size:0.75rem;color:#64748b;">Code: <strong>${escapeHtml(w.code || w.teacherId)}</strong> | ${escapeHtml(w.department || '')}</div>
                    </td>
                    <td class="${dh.Monday > 4 ? 'text-red' : ''}">${dh.Monday || 0}h</td>
                    <td class="${dh.Tuesday > 4 ? 'text-red' : ''}">${dh.Tuesday || 0}h</td>
                    <td class="${dh.Wednesday > 4 ? 'text-red' : ''}">${dh.Wednesday || 0}h</td>
                    <td class="${dh.Thursday > 4 ? 'text-red' : ''}">${dh.Thursday || 0}h</td>
                    <td class="${dh.Friday > 4 ? 'text-red' : ''}">${dh.Friday || 0}h</td>
                    <td><strong>${w.totalWeeklyHours} hrs</strong></td>
                    <td>
                      <div class="tt-workload-bar-wrap" style="width:130px;">
                        <div class="tt-workload-bar-track">
                          <div class="tt-workload-bar-fill ${w.hasWeeklyOverload ? 'overload' : (pct >= 85 ? 'high' : 'normal')}" style="width:${pct}%;"></div>
                        </div>
                        <span style="font-size:0.76rem;color:#64748b;">${w.remainingWeeklyHours}h left</span>
                      </div>
                    </td>
                    <td>${w.maxWeeklyHours || 18} hrs/wk</td>
                    <td>
                      <span class="tt-auth-badge ${w.hasWeeklyOverload ? 'admin' : (pct >= 85 ? 'student' : 'faculty')}" style="font-size:0.75rem;">
                        ${w.hasWeeklyOverload ? '⚠️ Over Limit' : (pct >= 85 ? 'Heavy Load' : '✓ Compliant')}
                      </span>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // TAB 9: CONFLICT DETECTION
  function renderConflictDetectionTab() {
    const audit = state.audit || { score: 100, isCompliant: true, totalConflicts: 0, totalWarnings: 0, conflicts: [], warnings: [] };
    return `
      <div class="tt-conflict-view">
        <div class="tt-conflict-audit-card">
          <div class="tt-audit-score-row">
            <div>
              <h3 style="font-size:1.25rem;font-weight:800;color:var(--slate-900,#0f172a);margin:0 0 4px 0;">12 Hard Constraints Compliance Auditor</h3>
              <p style="font-size:0.86rem;color:var(--slate-500,#64748b);margin:0;">
                Validating student groups, faculty availability, physical rooms, 18-hour caps, 2-period lab blocks, and 4-period technical training.
              </p>
            </div>
            <div style="display:flex;align-items:center;gap:14px;">
              <div class="tt-score-circle ${audit.totalConflicts > 0 ? 'has-conflicts' : ''}">
                <span>${audit.score}%</span>
                <small style="font-size:0.65rem;font-weight:600;">SCORE</small>
              </div>
              <button type="button" class="btn btn-primary" id="btn-re-audit">
                🛡️ Audit Timetable Now
              </button>
            </div>
          </div>

          ${audit.totalConflicts === 0 && audit.totalWarnings === 0 ? `
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:24px;text-align:center;">
              <div style="width:48px;height:48px;background:#dcfce7;color:#16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h4 style="font-size:1.1rem;font-weight:800;color:#166534;margin:0 0 4px 0;">Zero Clashes Detected</h4>
              <p style="font-size:0.88rem;color:#15803d;margin:0;">
                All 12 hard constraints are 100% satisfied across Section ${escapeHtml(state.currentSection)} and faculty allocations!
              </p>
            </div>
          ` : `
            <div>
              ${(audit.conflicts || []).map(c => `
                <div class="tt-conflict-item">
                  <h5>⛔ ${escapeHtml(c.title)}</h5>
                  <p>${escapeHtml(c.details)}</p>
                  <div class="tt-conflict-rec">💡 Recommendation: ${escapeHtml(c.recommendation)}</div>
                </div>
              `).join("")}

              ${(audit.warnings || []).map(w => `
                <div class="tt-conflict-item warning">
                  <h5>⚠️ ${escapeHtml(w.title)}</h5>
                  <p>${escapeHtml(w.details)}</p>
                  <div class="tt-conflict-rec">💡 Recommendation: ${escapeHtml(w.recommendation)}</div>
                </div>
              `).join("")}
            </div>
          `}
        </div>
      </div>
    `;
  }

  // TAB 10: REPORTS & EXPORT
  function renderReportsExportTab() {
    return `
      <div class="tt-reports-view">
        <div style="background:#ffffff;border:1px solid var(--slate-200,#e2e8f0);border-radius:12px;padding:20px;margin-bottom:20px;">
          <h3 style="font-size:1.25rem;font-weight:800;color:var(--slate-900,#0f172a);margin:0 0 4px 0;">Official Reports &amp; Export Center</h3>
          <p style="font-size:0.86rem;color:var(--slate-500,#64748b);margin:0 0 16px 0;">
            Download formatted timetables for student noticeboards, faculty schedules, or room utilization reports.
          </p>

          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button type="button" class="btn btn-primary" id="rep-btn-pdf">
              📄 Download PDF Timetable (${escapeHtml(state.currentSection)})
            </button>
            <button type="button" class="btn btn-secondary" id="rep-btn-excel">
              📊 Export Excel / CSV (${escapeHtml(state.currentSection)})
            </button>
            <button type="button" class="btn btn-secondary" id="rep-btn-combined-csv">
              📑 Export All Sections Combined CSV
            </button>
            <button type="button" class="btn btn-secondary" id="rep-btn-print">
              🖨️ Print for Noticeboard
            </button>
          </div>
        </div>

        <!-- Room Utilization Card -->
        <div style="background:#ffffff;border:1px solid var(--slate-200,#e2e8f0);border-radius:12px;padding:20px;margin-bottom:20px;">
          <h4 style="font-size:1.1rem;font-weight:800;margin:0 0 12px 0;">Room &amp; Laboratory Utilization Summary</h4>
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:12px;">
            ${(state.rooms || []).map(rm => {
              const booked = (state.data.classes || []).filter(c => c.room && c.room.toLowerCase().trim() === rm.name.toLowerCase().trim()).length;
              const totalSlots = 40; // 5 days * 8 teaching periods
              const pct = Math.min(100, Math.round((booked / totalSlots) * 100));
              return `
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <strong style="font-size:0.88rem;">${escapeHtml(rm.name)}</strong>
                    <span style="font-size:0.75rem;color:#64748b;">${booked} slots</span>
                  </div>
                  <div class="tt-workload-bar-track">
                    <div class="tt-workload-bar-fill normal" style="width:${pct}%;"></div>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:#64748b;margin-top:4px;">
                    <span>${rm.type}</span>
                    <span>${pct}% booked</span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;
  }

  // TAB 11: SETTINGS
  function renderSettingsTab() {
    const s = state.settings || {};
    return `
      <div class="tt-settings-view">
        <div style="background:#ffffff;border:1px solid var(--slate-200,#e2e8f0);border-radius:12px;padding:24px;max-width:760px;">
          <h3 style="font-size:1.25rem;font-weight:800;color:var(--slate-900,#0f172a);margin:0 0 6px 0;">Timetable Generator Settings</h3>
          <p style="font-size:0.86rem;color:var(--slate-500,#64748b);margin:0 0 20px 0;">
            Adjust academic parameters, working days, lunch recess intervals, and default faculty workload caps.
          </p>

          <form id="tt-settings-form">
            <div class="tt-form-row-2">
              <div class="tt-form-group">
                <label for="settAcademicYear">Academic Year</label>
                <input type="text" id="settAcademicYear" class="tt-input" value="${escapeHtml(s.academicYear || '2025–2026')}" required />
              </div>
              <div class="tt-form-group">
                <label for="settMaxFacultyHours">Max Faculty Weekly Teaching Hours</label>
                <input type="number" id="settMaxFacultyHours" class="tt-input" value="${s.maxFacultyWeeklyHours || 18}" min="10" max="30" required />
              </div>
            </div>

            <div class="tt-form-row-2">
              <div class="tt-form-group">
                <label for="settGroup1Name">Student Group 1 Name</label>
                <input type="text" id="settGroup1Name" class="tt-input" value="${escapeHtml(s.group1Name || 'Group 1')}" required />
              </div>
              <div class="tt-form-group">
                <label for="settGroup2Name">Student Group 2 Name</label>
                <input type="text" id="settGroup2Name" class="tt-input" value="${escapeHtml(s.group2Name || 'Group 2')}" required />
              </div>
            </div>

            <div class="tt-form-group">
              <label>Working Days</label>
              <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px;">
                <label style="display:inline-flex;align-items:center;gap:6px;font-size:0.88rem;font-weight:500;">
                  <input type="checkbox" checked disabled /> Monday – Friday (Active Default)
                </label>
                <label style="display:inline-flex;align-items:center;gap:6px;font-size:0.88rem;font-weight:500;">
                  <input type="checkbox" id="settSaturday" ${s.saturdayEnabled ? 'checked' : ''} /> Enable Saturday (Optional)
                </label>
              </div>
            </div>

            <div class="tt-form-group">
              <label for="settLunchTime">Midday Lunch / Recess Interval (Period 5)</label>
              <input type="text" id="settLunchTime" class="tt-input" value="12:31 PM – 01:10 PM" />
            </div>

            <div style="margin-top:24px;">
              <button type="submit" class="btn btn-primary">
                Save Generator Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  /* ============================================================================
     7. MODALS (SLOT EDIT, ADD SECTION, ADD FACULTY, ADD SUBJECT, ADD ROOM)
     ============================================================================ */
  function renderModals() {
    return `
      <!-- Modal 1: Interactive Cell / Slot Edit Modal -->
      <div class="tt-modal-overlay hidden" id="tt-slot-edit-modal">
        <div class="tt-modal-card wide-modal">
          <div class="tt-modal-header">
            <h3 id="tt-slot-edit-title">Edit Timetable Slot</h3>
            <button type="button" class="tt-modal-close" data-close-modal="tt-slot-edit-modal">&times;</button>
          </div>
          <div class="tt-modal-notice">
            📝 <strong>Manual Faculty Adjustment:</strong> Modify slot parameters manually. All changes are validated against simultaneous clashes and faculty workload limits.
          </div>
          <div id="tt-slot-edit-error" class="tt-modal-error-box hidden"></div>
          <form id="tt-slot-edit-form">
            <input type="hidden" id="slotEditId" value="" />

            <div class="tt-form-row-2">
              <div class="tt-form-group">
                <label for="slotEditDay">Day of Week</label>
                <select id="slotEditDay" class="tt-select" required>
                  ${DAYS.map(d => `<option value="${d}">${d}</option>`).join("")}
                </select>
              </div>
              <div class="tt-form-group">
                <label for="slotEditPeriod">Lecture Period</label>
                <select id="slotEditPeriod" class="tt-select" required>
                  ${(state.periods || []).map(p => `<option value="${p.id}">${p.label} (${p.time})</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="tt-form-row-2">
              <div class="tt-form-group">
                <label for="slotEditGroup">Student Group</label>
                <select id="slotEditGroup" class="tt-select" required>
                  <option value="Both">Both Groups (G1 + G2 Common)</option>
                  <option value="Group 1">Group 1 (G1 Only)</option>
                  <option value="Group 2">Group 2 (G2 Only)</option>
                </select>
              </div>
              <div class="tt-form-group">
                <label for="slotEditRoom">Classroom / Facility</label>
                <select id="slotEditRoom" class="tt-select">
                  ${(state.rooms || []).map(r => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)} (${r.type})</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="tt-form-group">
              <label for="slotEditSubject">Subject / Activity</label>
              <select id="slotEditSubject" class="tt-select" required>
                ${(state.subjects || []).map(s => `
                  <option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} (${escapeHtml(s.code || s.shortName)}) [${s.type.toUpperCase()}]</option>
                `).join("")}
              </select>
            </div>

            <div class="tt-form-group">
              <label for="slotEditFaculty">Assigned Faculty Member</label>
              <select id="slotEditFaculty" class="tt-select" required>
                ${(state.teachers || []).map(t => `
                  <option value="${escapeHtml(t.id)}">${escapeHtml(t.name)} (${t.code || t.id}) - ${t.department}</option>
                `).join("")}
              </select>
            </div>

            <!-- Swap With Another Period -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-top:14px;">
              <label style="font-size:0.8rem;font-weight:700;color:#475569;display:block;margin-bottom:6px;">Or Swap With Another Slot:</label>
              <div style="display:flex;gap:8px;">
                <select id="slotSwapDay" class="tt-select" style="flex:1;">
                  <option value="">-- Choose Day --</option>
                  ${DAYS.map(d => `<option value="${d}">${d}</option>`).join("")}
                </select>
                <select id="slotSwapPeriod" class="tt-select" style="flex:1;">
                  <option value="">-- Choose Period --</option>
                  ${(state.periods || []).map(p => `<option value="${p.id}">${p.label}</option>`).join("")}
                </select>
                <button type="button" class="btn btn-secondary btn-sm" id="btn-trigger-swap">Swap</button>
              </div>
            </div>

            <div class="tt-modal-actions">
              <button type="button" class="btn btn-ghost" id="btn-delete-slot" style="color:#ef4444;margin-right:auto;">Delete Slot</button>
              <button type="button" class="btn btn-secondary" data-close-modal="tt-slot-edit-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal 2: Add Section Modal -->
      <div class="tt-modal-overlay hidden" id="tt-add-sec-modal">
        <div class="tt-modal-card">
          <div class="tt-modal-header">
            <h3>Add New Class Section</h3>
            <button type="button" class="tt-modal-close" data-close-modal="tt-add-sec-modal">&times;</button>
          </div>
          <form id="tt-form-add-sec">
            <div class="tt-form-group">
              <label for="addSecName">Section Name</label>
              <input type="text" id="addSecName" class="tt-input" placeholder="e.g. CSE 2I, CSE 2J" required />
            </div>
            <div class="tt-form-row-2">
              <div class="tt-form-group">
                <label for="addSecRoom">Dedicated Room</label>
                <input type="text" id="addSecRoom" class="tt-input" placeholder="e.g. Room 306" required />
              </div>
              <div class="tt-form-group">
                <label for="addSecStudents">Student Count</label>
                <input type="number" id="addSecStudents" class="tt-input" value="60" min="10" max="120" required />
              </div>
            </div>
            <div class="tt-form-group">
              <label for="addSecCoord">Section Coordinator</label>
              <input type="text" id="addSecCoord" class="tt-input" placeholder="e.g. Prof. Assistant In-Charge" />
            </div>
            <div class="tt-modal-actions">
              <button type="button" class="btn btn-secondary" data-close-modal="tt-add-sec-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Section</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal 3: Add Faculty Modal -->
      <div class="tt-modal-overlay hidden" id="tt-add-faculty-modal">
        <div class="tt-modal-card">
          <div class="tt-modal-header">
            <h3>Add New Faculty Member</h3>
            <button type="button" class="tt-modal-close" data-close-modal="tt-add-faculty-modal">&times;</button>
          </div>
          <form id="tt-form-add-faculty">
            <div class="tt-form-row-2">
              <div class="tt-form-group">
                <label for="addFacCode">Faculty Code</label>
                <input type="text" id="addFacCode" class="tt-input" placeholder="e.g. F11" required />
              </div>
              <div class="tt-form-group">
                <label for="addFacName">Full Name</label>
                <input type="text" id="addFacName" class="tt-input" placeholder="e.g. Dr. Rajesh Kumar" required />
              </div>
            </div>
            <div class="tt-form-row-2">
              <div class="tt-form-group">
                <label for="addFacDesig">Designation</label>
                <input type="text" id="addFacDesig" class="tt-input" value="Assistant Professor" required />
              </div>
              <div class="tt-form-group">
                <label for="addFacDept">Department</label>
                <input type="text" id="addFacDept" class="tt-input" value="Computer Science & Engineering" required />
              </div>
            </div>
            <div class="tt-form-group">
              <label for="addFacSubjects">Certified Subjects (Comma-separated IDs)</label>
              <input type="text" id="addFacSubjects" class="tt-input" placeholder="e.g. SUB_DS, LAB_DS, SUB_PYTHON" />
            </div>
            <div class="tt-form-row-2">
              <div class="tt-form-group">
                <label for="addFacWeeklyHours">Max Weekly Hours</label>
                <input type="number" id="addFacWeeklyHours" class="tt-input" value="18" max="24" required />
              </div>
              <div class="tt-form-group">
                <label for="addFacDailyHours">Max Daily Hours</label>
                <input type="number" id="addFacDailyHours" class="tt-input" value="4" max="6" required />
              </div>
            </div>
            <div class="tt-modal-actions">
              <button type="button" class="btn btn-secondary" data-close-modal="tt-add-faculty-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Faculty</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal 4: Add Subject Modal -->
      <div class="tt-modal-overlay hidden" id="tt-add-subject-modal">
        <div class="tt-modal-card">
          <div class="tt-modal-header">
            <h3>Add New Subject or Lab</h3>
            <button type="button" class="tt-modal-close" data-close-modal="tt-add-subject-modal">&times;</button>
          </div>
          <form id="tt-form-add-subject">
            <div class="tt-form-row-2">
              <div class="tt-form-group">
                <label for="addSubName">Subject Name</label>
                <input type="text" id="addSubName" class="tt-input" placeholder="e.g. Operating Systems" required />
              </div>
              <div class="tt-form-group">
                <label for="addSubCode">Course Code</label>
                <input type="text" id="addSubCode" class="tt-input" placeholder="e.g. BCS-304" required />
              </div>
            </div>
            <div class="tt-form-row-2">
              <div class="tt-form-group">
                <label for="addSubType">Type</label>
                <select id="addSubType" class="tt-select" required>
                  <option value="theory">Theoretical Lecture</option>
                  <option value="lab">Practical Laboratory (2-period)</option>
                  <option value="training">Technical Training (4-period)</option>
                  <option value="tutorial">Tutorial Session</option>
                  <option value="activity">Activity / Enrichment</option>
                </select>
              </div>
              <div class="tt-form-group">
                <label for="addSubLectures">Weekly Lectures Required</label>
                <input type="number" id="addSubLectures" class="tt-input" value="4" min="1" max="10" required />
              </div>
            </div>
            <div class="tt-form-group">
              <label for="addSubRoom">Default Facility</label>
              <input type="text" id="addSubRoom" class="tt-input" placeholder="e.g. Lecture Hall B, OS Lab" />
            </div>
            <div class="tt-modal-actions">
              <button type="button" class="btn btn-secondary" data-close-modal="tt-add-subject-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Subject</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal 5: Add Room Modal -->
      <div class="tt-modal-overlay hidden" id="tt-add-room-modal">
        <div class="tt-modal-card">
          <div class="tt-modal-header">
            <h3>Register Facility or Laboratory</h3>
            <button type="button" class="tt-modal-close" data-close-modal="tt-add-room-modal">&times;</button>
          </div>
          <form id="tt-form-add-room">
            <div class="tt-form-group">
              <label for="addRmName">Room / Lab Name</label>
              <input type="text" id="addRmName" class="tt-input" placeholder="e.g. Cloud Computing Lab" required />
            </div>
            <div class="tt-form-row-2">
              <div class="tt-form-group">
                <label for="addRmType">Facility Type</label>
                <select id="addRmType" class="tt-select">
                  <option value="Lecture Hall">Lecture Hall</option>
                  <option value="Computer Lab">Computer Lab</option>
                  <option value="Hardware Lab">Hardware Lab</option>
                  <option value="Tutorial Room">Tutorial Room</option>
                </select>
              </div>
              <div class="tt-form-group">
                <label for="addRmCapacity">Capacity</label>
                <input type="number" id="addRmCapacity" class="tt-input" value="60" required />
              </div>
            </div>
            <div class="tt-modal-actions">
              <button type="button" class="btn btn-secondary" data-close-modal="tt-add-room-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Register Room</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal: Delete Section Timetable Confirmation -->
      <div class="tt-modal-overlay hidden" id="tt-delete-section-modal" role="dialog" aria-labelledby="delSecModalTitle">
        <div class="tt-modal-card" style="max-width:480px;">
          <div class="tt-modal-header">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;border-radius:10px;background:#fef2f2;color:#dc2626;display:flex;align-items:center;justify-content:center;font-size:18px;">🗑️</div>
              <h3 id="delSecModalTitle" style="margin:0;font-size:1.15rem;font-weight:700;">Delete Timetable</h3>
            </div>
            <button type="button" class="tt-modal-close" data-close-modal="tt-delete-section-modal">&times;</button>
          </div>
          <div style="padding:14px 0 18px 0;font-size:0.92rem;color:var(--slate-600, #475569);line-height:1.5;">
            <p style="margin:0 0 12px 0;">
              Are you sure you want to delete the timetable for <strong id="delSecModalTargetName" style="color:var(--slate-900, #0f172a);">${escapeHtml(state.currentSection)}</strong>?
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:12px;">
              <div style="font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#475569;margin-bottom:6px;">Safety Verification</div>
              <ul style="margin:0;padding-left:18px;font-size:0.84rem;color:#64748b;display:flex;flex-direction:column;gap:5px;">
                <li>All class schedule slots for this section will be deleted.</li>
                <li><strong style="color:#0f172a;">Master data is strictly preserved:</strong> Faculty roster, subjects, rooms, and sections remain untouched.</li>
                <li>Changes are immediately saved to the database.</li>
              </ul>
            </div>
          </div>
          <div class="tt-modal-actions">
            <button type="button" class="btn btn-secondary" data-close-modal="tt-delete-section-modal">Cancel</button>
            <button type="button" class="btn btn-danger" id="btn-confirm-delete-section" style="background:#dc2626;border-color:#dc2626;color:#fff;">
              <span>Delete Timetable</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal: Clear All Timetables Confirmation -->
      <div class="tt-modal-overlay hidden" id="tt-clear-all-modal" role="dialog" aria-labelledby="clearAllModalTitle">
        <div class="tt-modal-card" style="max-width:500px;">
          <div class="tt-modal-header">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;border-radius:10px;background:#fef2f2;color:#dc2626;display:flex;align-items:center;justify-content:center;font-size:18px;">⚠️</div>
              <h3 id="clearAllModalTitle" style="margin:0;font-size:1.15rem;font-weight:700;">Clear All Timetables</h3>
            </div>
            <button type="button" class="tt-modal-close" data-close-modal="tt-clear-all-modal">&times;</button>
          </div>
          <div style="padding:14px 0 18px 0;font-size:0.92rem;color:var(--slate-600, #475569);line-height:1.5;">
            <p style="margin:0 0 12px 0;">
              Are you sure you want to clear timetables for <strong style="color:#dc2626;">ALL sections (every class in the institution)</strong>?
            </p>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-bottom:12px;">
              <div style="font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#991b1b;margin-bottom:6px;">All Sections Affected</div>
              <ul style="margin:0;padding-left:18px;font-size:0.84rem;color:#7f1d1d;display:flex;flex-direction:column;gap:5px;">
                <li>All class schedule records across every section will be cleared.</li>
                <li><strong style="color:#7f1d1d;">Master data is strictly preserved:</strong> Faculty profiles, course curriculum, labs, and section configs remain completely safe.</li>
                <li>You can regenerate individual sections or import new Excel allocations at any time.</li>
              </ul>
            </div>
          </div>
          <div class="tt-modal-actions">
            <button type="button" class="btn btn-secondary" data-close-modal="tt-clear-all-modal">Cancel</button>
            <button type="button" class="btn btn-danger" id="btn-confirm-clear-all" style="background:#dc2626;border-color:#dc2626;color:#fff;">
              <span>Clear All Timetables</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal: Excel Import Preview & Validation Modal -->
      <div class="tt-modal-overlay hidden" id="tt-excel-preview-modal" role="dialog" aria-labelledby="excelPreviewModalTitle">
        <div class="tt-modal-card wide-modal" style="max-width:860px;">
          <div class="tt-modal-header">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;border-radius:10px;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:18px;">📊</div>
              <div>
                <h3 id="excelPreviewModalTitle" style="margin:0;font-size:1.15rem;font-weight:700;">Excel Timetable Import Preview</h3>
                <div style="font-size:0.82rem;color:var(--slate-500,#64748b);" id="excelPreviewFileName">Spreadsheet file verified</div>
              </div>
            </div>
            <button type="button" class="tt-modal-close" data-close-modal="tt-excel-preview-modal">&times;</button>
          </div>

          <div id="excelPreviewContent" style="padding:10px 0;">
            <!-- Summary Stats Bar -->
            <div class="tt-preview-stats-bar" id="excelStatsBar">
              <!-- Rendered dynamically -->
            </div>

            <!-- Download Template Banner -->
            <div style="display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
              <div style="font-size:0.85rem;color:#475569;">
                <strong>AKTU Curriculum Standard:</strong> Supports <code style="background:#e0f2fe;color:#0369a1;padding:2px 6px;border-radius:4px;font-weight:600;">BCS</code>, <code style="background:#e0f2fe;color:#0369a1;padding:2px 6px;border-radius:4px;font-weight:600;">BAS</code>, and valid <code style="background:#e0f2fe;color:#0369a1;padding:2px 6px;border-radius:4px;font-weight:600;">B*</code> codes.
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-download-sample-excel" title="Download Excel template (.xlsx)">
                📥 Template (.xlsx)
              </button>
            </div>

            <!-- Interactive Validation Preview Table -->
            <div class="tt-preview-table-container">
              <table class="tt-preview-table" id="excelPreviewTable">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Teacher Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Mapped Subjects</th>
                    <th>Hours (W/D)</th>
                    <th>Validation Notes</th>
                  </tr>
                </thead>
                <tbody id="excelPreviewTableBody">
                  <!-- Rows populated dynamically -->
                </tbody>
              </table>
            </div>

            <!-- Auto-Generate Option -->
            <div style="margin-top:14px;padding:10px 12px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;gap:10px;">
              <input type="checkbox" id="excelAutoGenerateCheck" checked style="width:16px;height:16px;accent-color:#2563eb;cursor:pointer;" />
              <label for="excelAutoGenerateCheck" style="font-size:0.88rem;color:#1e293b;cursor:pointer;font-weight:600;">
                Automatically generate timetable for Section <span id="excelTargetSecLabel">${escapeHtml(state.currentSection)}</span> using imported records
              </label>
            </div>
          </div>

          <div class="tt-modal-actions" style="margin-top:16px;">
            <button type="button" class="btn btn-secondary" data-close-modal="tt-excel-preview-modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="btn-confirm-excel-import">
              <span>Confirm &amp; Generate Timetable</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /* ============================================================================
     8. BIND EVENT LISTENERS (STUDENT VS STAFF ADMIN)
     ============================================================================ */
  function bindStudentEvents() {
    // Section selector buttons for students
    document.querySelectorAll("[data-student-select-sec]").forEach(btn => {
      btn.addEventListener("click", () => {
        const sec = btn.getAttribute("data-student-select-sec");
        if (sec && sec !== state.currentSection) {
          state.currentSection = sec;
          document.querySelectorAll("[data-student-select-sec]").forEach(b => {
            const isMatch = b.getAttribute("data-student-select-sec") === sec;
            b.classList.toggle("active", isMatch);
            b.setAttribute("aria-selected", isMatch ? "true" : "false");
          });
          loadData();
        }
      });
    });

    // Group filter dropdown
    const grpFilter = document.getElementById("student-group-filter-select");
    if (grpFilter) {
      grpFilter.addEventListener("change", (e) => {
        state.groupFilter = e.target.value;
        render();
      });
    }

    // Export Excel / CSV
    const csvBtn = document.getElementById("student-tt-btn-excel");
    if (csvBtn) csvBtn.addEventListener("click", exportExcel);

    // Print / PDF
    const printBtn = document.getElementById("student-tt-btn-pdf");
    if (printBtn) printBtn.addEventListener("click", exportPDF);
  }

  function bindStaffAdminEvents() {
    // 11 Tab Navigation
    document.querySelectorAll("[data-tt-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.activeTab = btn.getAttribute("data-tt-tab");
        render();
      });
    });

    // Compact Section Selector Dropdown
    const compactSecSelect = document.getElementById("tt-compact-section-select");
    if (compactSecSelect) {
      compactSecSelect.addEventListener("change", (e) => {
        state.currentSection = e.target.value;
        loadData();
      });
    }

    // Actions Dropdown Toggle
    const actDropdownTrigger = document.getElementById("btn-toggle-actions-dropdown");
    const actDropdownMenu = document.getElementById("ttActionsDropdownMenu");
    if (actDropdownTrigger && actDropdownMenu) {
      actDropdownTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isHidden = actDropdownMenu.classList.contains("hidden");
        actDropdownMenu.classList.toggle("hidden", !isHidden);
        actDropdownTrigger.setAttribute("aria-expanded", String(isHidden));
      });
    }

    // Section Selector Chips (Fallback & Backward Compatibility)
    document.querySelectorAll("[data-select-sec]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.currentSection = btn.getAttribute("data-select-sec");
        loadData();
      });
    });

    // Dashboard Quick Buttons
    const dashGenBtn = document.getElementById("dash-btn-generate");
    if (dashGenBtn) dashGenBtn.addEventListener("click", () => generateTimetable(false));

    const dashGridBtn = document.getElementById("dash-btn-view-grid");
    if (dashGridBtn) dashGridBtn.addEventListener("click", () => { state.activeTab = "generator"; render(); });

    const dashAuditBtn = document.getElementById("dash-btn-audit");
    if (dashAuditBtn) dashAuditBtn.addEventListener("click", () => { state.activeTab = "conflict-detection"; validateTimetable(); });

    document.querySelectorAll(".dash-switch-sec-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        state.currentSection = btn.getAttribute("data-sec");
        state.activeTab = "generator";
        loadData();
      });
    });

    document.querySelectorAll(".dash-gen-sec-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        state.currentSection = btn.getAttribute("data-sec");
        generateTimetable(false);
      });
    });

    // Generator Toolbar Controls
    const genBtn = document.getElementById("btn-run-generate");
    if (genBtn) genBtn.addEventListener("click", () => generateTimetable(false));

    const regenBtn = document.getElementById("btn-run-regenerate");
    if (regenBtn) regenBtn.addEventListener("click", () => generateTimetable(true));

    const validateBtn = document.getElementById("btn-run-validate");
    if (validateBtn) validateBtn.addEventListener("click", validateTimetable);

    const saveBtn = document.getElementById("btn-run-save");
    if (saveBtn) saveBtn.addEventListener("click", saveTimetable);

    // Timetable Deletion Modal Triggers & Actions
    const openDelSecBtn = document.getElementById("btn-open-delete-sec-modal");
    if (openDelSecBtn) openDelSecBtn.addEventListener("click", openDeleteSectionModal);

    const openClearAllBtn = document.getElementById("btn-open-clear-all-modal");
    if (openClearAllBtn) openClearAllBtn.addEventListener("click", openClearAllModal);

    const confirmDelSecBtn = document.getElementById("btn-confirm-delete-section");
    if (confirmDelSecBtn) confirmDelSecBtn.addEventListener("click", confirmDeleteSectionTimetable);

    const confirmClearAllBtn = document.getElementById("btn-confirm-clear-all");
    if (confirmClearAllBtn) confirmClearAllBtn.addEventListener("click", confirmClearAllTimetables);

    const resetBtn = document.getElementById("btn-run-reset");
    if (resetBtn) resetBtn.addEventListener("click", openDeleteSectionModal);

    // Excel Import File Picker & Handlers
    const importExcelBtn = document.getElementById("btn-import-excel");
    const excelFileInput = document.getElementById("tt-excel-file-input");
    if (importExcelBtn && excelFileInput) {
      importExcelBtn.addEventListener("click", () => excelFileInput.click());
    }
    const emptyImportBtn = document.getElementById("empty-state-import-btn");
    if (emptyImportBtn && excelFileInput) {
      emptyImportBtn.addEventListener("click", () => excelFileInput.click());
    }
    if (excelFileInput) {
      excelFileInput.addEventListener("change", handleExcelFileSelect);
    }

    const downloadSampleBtn = document.getElementById("btn-download-sample-excel");
    if (downloadSampleBtn) downloadSampleBtn.addEventListener("click", downloadSampleExcelTemplate);

    const confirmExcelBtn = document.getElementById("btn-confirm-excel-import");
    if (confirmExcelBtn) confirmExcelBtn.addEventListener("click", submitExcelImport);

    const undoBtn = document.getElementById("btn-undo-changes");
    if (undoBtn) undoBtn.addEventListener("click", undoChanges);

    const publishBtn = document.getElementById("btn-publish-tt");
    if (publishBtn) publishBtn.addEventListener("click", () => publishTimetable(true));

    const pdfBtn = document.getElementById("btn-export-pdf");
    if (pdfBtn) pdfBtn.addEventListener("click", exportPDF);

    const excelBtn = document.getElementById("btn-export-excel");
    if (excelBtn) excelBtn.addEventListener("click", exportExcel);

    const printBtn = document.getElementById("btn-print-tt");
    if (printBtn) printBtn.addEventListener("click", exportPDF);

    const emptyGenBtn = document.getElementById("empty-state-generate-btn");
    if (emptyGenBtn) emptyGenBtn.addEventListener("click", () => generateTimetable(false));

    // Group Filter Pills
    document.querySelectorAll("[data-g-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.groupFilter = btn.getAttribute("data-g-filter");
        render();
      });
    });

    // Interactive Cell Clicks (Staff Only)
    document.querySelectorAll("[data-cell-edit]").forEach(el => {
      el.addEventListener("click", () => {
        if (!isStaffRole(state.role)) return;
        const clsId = el.getAttribute("data-cell-edit");
        const day = el.getAttribute("data-day");
        const period = el.getAttribute("data-period");
        const group = el.getAttribute("data-group") || "Both";
        openSlotEditModal(clsId, day, period, group);
      });
    });

    document.querySelectorAll("[data-cell-add]").forEach(el => {
      el.addEventListener("click", () => {
        if (!isStaffRole(state.role)) return;
        const day = el.getAttribute("data-day");
        const period = el.getAttribute("data-period");
        openSlotEditModal(null, day, period, "Both");
      });
    });

    // Trigger Swap Button
    const triggerSwapBtn = document.getElementById("btn-trigger-swap");
    if (triggerSwapBtn) {
      triggerSwapBtn.addEventListener("click", () => {
        const editId = document.getElementById("slotEditId").value;
        const targetDay = document.getElementById("slotSwapDay").value;
        const targetPeriod = document.getElementById("slotSwapPeriod").value;
        if (!targetDay || !targetPeriod) {
          showToast("⚠️ Please choose both day and period to swap.");
          return;
        }
        submitSlotSwap(editId, targetDay, targetPeriod);
      });
    }

    // Delete Slot Button in Modal
    const deleteSlotBtn = document.getElementById("btn-delete-slot");
    if (deleteSlotBtn) {
      deleteSlotBtn.addEventListener("click", () => {
        const editId = document.getElementById("slotEditId").value;
        if (!editId) return;
        submitSlotEdit({ editId, action: "delete" });
      });
    }

    // Slot Edit Form Submit
    const slotEditForm = document.getElementById("tt-slot-edit-form");
    if (slotEditForm) {
      slotEditForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const editId = document.getElementById("slotEditId").value;
        const day = document.getElementById("slotEditDay").value;
        const period = document.getElementById("slotEditPeriod").value;
        const group = document.getElementById("slotEditGroup").value;
        const room = document.getElementById("slotEditRoom").value;
        const subjectId = document.getElementById("slotEditSubject").value;
        const teacherId = document.getElementById("slotEditFaculty").value;
        submitSlotEdit({ editId, day, period, group, room, subjectId, teacherId, action: "save" });
      });
    }

    // Modal Close Buttons
    document.querySelectorAll("[data-close-modal]").forEach(btn => {
      btn.addEventListener("click", () => {
        const modalId = btn.getAttribute("data-close-modal");
        closeModal(modalId);
      });
    });

    // Add Section Modals
    const openAddSecBtn = document.getElementById("tt-btn-open-add-sec-modal");
    if (openAddSecBtn) openAddSecBtn.addEventListener("click", () => openModal("tt-add-sec-modal"));

    const openAddSecBtn2 = document.getElementById("btn-open-create-sec-modal");
    if (openAddSecBtn2) openAddSecBtn2.addEventListener("click", () => openModal("tt-add-sec-modal"));

    const addSecForm = document.getElementById("tt-form-add-sec");
    if (addSecForm) {
      addSecForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("addSecName").value.trim();
        const room = document.getElementById("addSecRoom").value.trim();
        const students = document.getElementById("addSecStudents").value;
        const coordinator = document.getElementById("addSecCoord").value.trim();
        closeModal("tt-add-sec-modal");

        try {
          const res = await fetch(`${API_BASE}/sections`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name, room, students, coordinator })
          });
          const json = await res.json();
          if (res.ok && json.success) {
            showToast(`✓ Section "${name}" added independently.`);
            state.currentSection = name;
            await loadData();
          } else {
            showToast("⚠️ " + (json.error || "Failed to add section"));
          }
        } catch (err) {
          showToast("❌ Error adding section.");
        }
      });
    }

    // Duplicate Section
    document.querySelectorAll(".btn-duplicate-sec").forEach(btn => {
      btn.addEventListener("click", async () => {
        const source = btn.getAttribute("data-name");
        const newName = prompt(`Enter name for duplicated section:`, `${source} Copy`);
        if (!newName) return;

        try {
          const res = await fetch(`${API_BASE}/sections`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ action: "duplicate", sourceSection: source, newName })
          });
          const json = await res.json();
          if (res.ok && json.success) {
            showToast(`✓ Independent copy "${newName}" created successfully.`);
            state.currentSection = newName;
            await loadData();
          } else {
            showToast("⚠️ " + (json.error || "Duplicate failed"));
          }
        } catch (e) {
          showToast("❌ Error duplicating section.");
        }
      });
    });

    // Delete Section
    document.querySelectorAll(".btn-delete-sec").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const name = btn.getAttribute("data-name");
        if (!confirm(`Are you sure you want to delete Section "${name}"? This will not affect any other section.`)) return;

        try {
          const res = await fetch(`${API_BASE}/sections`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ action: "delete", id })
          });
          const json = await res.json();
          if (res.ok && json.success) {
            showToast(`✓ Section "${name}" removed.`);
            state.currentSection = state.sections[0] ? (state.sections[0].name || state.sections[0]) : "CSE 2D";
            await loadData();
          }
        } catch (e) {
          showToast("❌ Error deleting section.");
        }
      });
    });

    // Add Faculty Modal
    const openAddFacBtn = document.getElementById("btn-open-create-faculty-modal");
    if (openAddFacBtn) openAddFacBtn.addEventListener("click", () => openModal("tt-add-faculty-modal"));

    const addFacForm = document.getElementById("tt-form-add-faculty");
    if (addFacForm) {
      addFacForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const code = document.getElementById("addFacCode").value.trim();
        const name = document.getElementById("addFacName").value.trim();
        const designation = document.getElementById("addFacDesig").value.trim();
        const department = document.getElementById("addFacDept").value.trim();
        const subjects = document.getElementById("addFacSubjects").value.split(",").map(s => s.trim()).filter(Boolean);
        const maxWeeklyHours = Number(document.getElementById("addFacWeeklyHours").value);
        const maxDailyHours = Number(document.getElementById("addFacDailyHours").value);
        closeModal("tt-add-faculty-modal");

        try {
          const res = await fetch(`${API_BASE}/faculty`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ code, name, designation, department, eligibleSubjects: subjects, maxWeeklyHours, maxDailyHours })
          });
          const json = await res.json();
          if (res.ok && json.success) {
            showToast(`✓ Faculty member ${name} (${code}) added.`);
            await loadData();
          } else {
            showToast("⚠️ " + (json.error || "Failed to add faculty"));
          }
        } catch (e) {
          showToast("❌ Error adding faculty.");
        }
      });
    }

    // Add Subject Modal
    const openAddSubBtn = document.getElementById("btn-open-create-subject-modal");
    if (openAddSubBtn) openAddSubBtn.addEventListener("click", () => openModal("tt-add-subject-modal"));

    const addSubForm = document.getElementById("tt-form-add-subject");
    if (addSubForm) {
      addSubForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("addSubName").value.trim();
        const code = document.getElementById("addSubCode").value.trim();
        const type = document.getElementById("addSubType").value;
        const weeklyLectures = Number(document.getElementById("addSubLectures").value);
        const defaultRoom = document.getElementById("addSubRoom").value.trim();
        closeModal("tt-add-subject-modal");

        try {
          const res = await fetch(`${API_BASE}/subjects`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name, code, type, weeklyLectures, defaultRoom })
          });
          const json = await res.json();
          if (res.ok && json.success) {
            showToast(`✓ Subject "${name}" registered.`);
            await loadData();
          } else {
            showToast("⚠️ " + (json.error || "Failed to add subject"));
          }
        } catch (e) {
          showToast("❌ Error adding subject.");
        }
      });
    }

    // Add Room Modal
    const openAddRmBtn = document.getElementById("btn-open-create-room-modal");
    if (openAddRmBtn) openAddRmBtn.addEventListener("click", () => openModal("tt-add-room-modal"));

    const addRmForm = document.getElementById("tt-form-add-room");
    if (addRmForm) {
      addRmForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("addRmName").value.trim();
        const type = document.getElementById("addRmType").value;
        const capacity = Number(document.getElementById("addRmCapacity").value);
        closeModal("tt-add-room-modal");

        try {
          const res = await fetch(`${API_BASE}/rooms`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name, type, capacity, isLab: type.includes("Lab") })
          });
          const json = await res.json();
          if (res.ok && json.success) {
            showToast(`✓ Facility "${name}" registered.`);
            await loadData();
          } else {
            showToast("⚠️ " + (json.error || "Failed to add room"));
          }
        } catch (e) {
          showToast("❌ Error adding room.");
        }
      });
    }

    // Settings Form
    const settForm = document.getElementById("tt-settings-form");
    if (settForm) {
      settForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const academicYear = document.getElementById("settAcademicYear").value.trim();
        const maxFacultyWeeklyHours = Number(document.getElementById("settMaxFacultyHours").value);
        const group1Name = document.getElementById("settGroup1Name").value.trim();
        const group2Name = document.getElementById("settGroup2Name").value.trim();
        const saturdayEnabled = document.getElementById("settSaturday")?.checked || false;

        try {
          const res = await fetch(`${API_BASE}/settings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ academicYear, maxFacultyWeeklyHours, group1Name, group2Name, saturdayEnabled })
          });
          const json = await res.json();
          if (res.ok && json.success) {
            showToast("✓ Timetable settings updated successfully.");
            await loadData();
          }
        } catch (e) {
          showToast("❌ Error saving settings.");
        }
      });
    }

    // Reports Action Buttons
    const repPdf = document.getElementById("rep-btn-pdf");
    if (repPdf) repPdf.addEventListener("click", exportPDF);

    const repExcel = document.getElementById("rep-btn-excel");
    if (repExcel) repExcel.addEventListener("click", exportExcel);

    const repCombinedCsv = document.getElementById("rep-btn-combined-csv");
    if (repCombinedCsv) {
      repCombinedCsv.addEventListener("click", () => {
        const allClasses = state.data.classes || [];
        const headers = ["Section", "Group", "Day", "Period", "Time", "Subject Code", "Subject Name", "Faculty", "Room", "Type"];
        const rows = allClasses.map(c => [
          `"${c.section}"`,
          `"${c.group || 'Both'}"`,
          `"${c.day}"`,
          c.period,
          `"${c.time}"`,
          `"${c.subjectCode || ""}"`,
          `"${c.subjectName}"`,
          `"${c.teacherName || ""}"`,
          `"${c.room || ""}"`,
          `"${c.type}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `timetable_all_sections_combined.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("✓ Combined master timetable exported.");
      });
    }

    const repPrint = document.getElementById("rep-btn-print");
    if (repPrint) repPrint.addEventListener("click", exportPDF);

    // Audit Re-check
    const reAuditBtn = document.getElementById("btn-re-audit");
    if (reAuditBtn) reAuditBtn.addEventListener("click", validateTimetable);

    const feasBtn = document.getElementById("btn-check-feasibility");
    if (feasBtn) {
      feasBtn.addEventListener("click", async () => {
        try {
          const res = await fetch(`${API_BASE}/feasibility?section=${encodeURIComponent(state.currentSection)}`);
          const json = await res.json();
          if (res.ok && json.success) {
            state.feasibility = json.feasibility;
            showToast(json.feasibility.feasible ? "✓ Curriculum configuration verified: Feasible!" : "⚠️ Configuration Warning: Over-subscribed!");
            render();
          }
        } catch (e) {
          showToast("❌ Could not check feasibility.");
        }
      });
    }
  }

  /* ============================================================================
     9. MODAL HELPERS & UTILITIES
     ============================================================================ */
  function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove("hidden");
  }

  function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add("hidden");
  }

  function openSlotEditModal(clsId, day, period, group) {
    const modal = document.getElementById("tt-slot-edit-modal");
    if (!modal) return;

    const errBox = document.getElementById("tt-slot-edit-error");
    if (errBox) { errBox.classList.add("hidden"); errBox.textContent = ""; }

    const idInput = document.getElementById("slotEditId");
    const daySelect = document.getElementById("slotEditDay");
    const periodSelect = document.getElementById("slotEditPeriod");
    const groupSelect = document.getElementById("slotEditGroup");
    const roomSelect = document.getElementById("slotEditRoom");
    const subSelect = document.getElementById("slotEditSubject");
    const facSelect = document.getElementById("slotEditFaculty");
    const delBtn = document.getElementById("btn-delete-slot");

    if (clsId) {
      const cls = (state.data.classes || []).find(c => c.id === clsId);
      if (cls) {
        idInput.value = cls.id;
        daySelect.value = cls.day;
        periodSelect.value = cls.period;
        groupSelect.value = cls.group || "Both";
        if (roomSelect) roomSelect.value = cls.room || "";
        if (subSelect) subSelect.value = cls.subjectId || "";
        if (facSelect) facSelect.value = cls.teacherId || "";
        if (delBtn) delBtn.style.display = "inline-flex";
      }
    } else {
      idInput.value = "";
      daySelect.value = day || "Monday";
      periodSelect.value = period || 1;
      groupSelect.value = group || "Both";
      if (delBtn) delBtn.style.display = "none";
    }

    modal.classList.remove("hidden");
  }

  function showToast(msg) {
    let toast = document.getElementById("tt-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "tt-toast";
      toast.className = "tt-toast-notification";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("visible");
    setTimeout(() => {
      toast.classList.remove("visible");
    }, 4500);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Global listener for closing Actions dropdown on outside click
  document.addEventListener("click", (e) => {
    const wrap = document.getElementById("ttActionsDropdownWrap");
    const menu = document.getElementById("ttActionsDropdownMenu");
    const btn = document.getElementById("btn-toggle-actions-dropdown");
    if (menu && !menu.classList.contains("hidden")) {
      if (!wrap || !wrap.contains(e.target)) {
        menu.classList.add("hidden");
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
    }
  });

  // Global exports for app.js and window
  window.NovaTimetable = {
    loadAndRender: loadData,
    switchSection: (sec) => { state.currentSection = sec; loadData(); },
    setActiveTab: (tab) => { state.activeTab = tab; render(); },
    renderStaffDashboard: () => render(),
    renderStudentDashboard: () => render(),
    getRole: () => state.role,
    setRole: (r) => { state.role = r; render(); }
  };
  window.initTimetableModule = loadData;
  window.bindEvents = bindStaffAdminEvents;

  document.addEventListener("DOMContentLoaded", loadData);
})();
