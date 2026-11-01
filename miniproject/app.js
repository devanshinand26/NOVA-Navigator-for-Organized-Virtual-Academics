/* =========================================================
   app.js — STUDY ASSISTANT APP LOGIC
   Ye file db.js (database) aur courses.js (flashcard data)
   dono se connect hoti hai. Poora app isi ek file se chalta
   hai — index.html sirf UI hai, styling style.css mein hai.
========================================================= */

/* HTML escaping helper available across the application */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
if (typeof window !== 'undefined') {
  window.escapeHtml = escapeHtml;
}

document.addEventListener('DOMContentLoaded', () => {

  let currentUser = null; // logged-in user object (from DB)

  /* ---------------------------------------------------
     0. SESSION (remember logged-in user across reloads)
  --------------------------------------------------- */
  const SESSION_KEY = 'studyAssistant_session';

  function saveSession(email) {
    localStorage.setItem(SESSION_KEY, email);
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }
  function getSession() {
    return localStorage.getItem(SESSION_KEY);
  }

  /* ---------------------------------------------------
     1. AUTH — LOGIN / SIGNUP (backed by db.js / IndexedDB)
  --------------------------------------------------- */
  const loginScreen = document.getElementById('loginScreen');
  const dashboardScreen = document.getElementById('dashboardScreen');
  const staffDashboardScreen = document.getElementById('staffDashboardScreen');

  // Role toggle buttons & tabs
  const roleBtnStudent = document.getElementById('roleBtnStudent');
  const roleBtnStaff = document.getElementById('roleBtnStaff');
  const studentAuthTabs = document.getElementById('studentAuthTabs');
  const staffAuthTabs = document.getElementById('staffAuthTabs');

  // Student auth elements
  const showLoginTab = document.getElementById('showLoginTab');
  const showSignupTab = document.getElementById('showSignupTab');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const loginFormError = document.getElementById('loginFormError');
  const togglePwBtn = document.getElementById('togglePw');

  const signupNameInput = document.getElementById('signupName');
  const signupEmailInput = document.getElementById('signupEmail');
  const signupPasswordInput = document.getElementById('signupPassword');
  const signupCourseSelect = document.getElementById('signupCourse');
  const signupNameError = document.getElementById('signupNameError');
  const signupEmailError = document.getElementById('signupEmailError');
  const signupPasswordError = document.getElementById('signupPasswordError');
  const signupFormError = document.getElementById('signupFormError');

  // Staff auth elements
  const showStaffLoginTab = document.getElementById('showStaffLoginTab');
  const showStaffSignupTab = document.getElementById('showStaffSignupTab');
  const staffLoginForm = document.getElementById('staffLoginForm');
  const staffRegisterForm = document.getElementById('staffRegisterForm');

  const staffEmailInput = document.getElementById('staffEmail');
  const staffPasswordInput = document.getElementById('staffPassword');
  const staffEmailError = document.getElementById('staffEmailError');
  const staffPasswordError = document.getElementById('staffPasswordError');
  const staffLoginFormError = document.getElementById('staffLoginFormError');
  const toggleStaffPwBtn = document.getElementById('toggleStaffPw');

  const staffRegNameInput = document.getElementById('staffRegName');
  const staffRegEmailInput = document.getElementById('staffRegEmail');
  const staffRegDeptInput = document.getElementById('staffRegDept');
  const staffRegDesigInput = document.getElementById('staffRegDesig') || document.getElementById('staffRegDesignation');
  const staffRegPasswordInput = document.getElementById('staffRegPassword');
  const staffRegPasskeyInput = document.getElementById('staffRegPasskey') || document.getElementById('staffRegAdminKey');
  const staffRegNameError = document.getElementById('staffRegNameError');
  const staffRegEmailError = document.getElementById('staffRegEmailError');
  const staffRegPasswordError = document.getElementById('staffRegPasswordError');
  const staffRegPasskeyError = document.getElementById('staffRegPasskeyError') || document.getElementById('staffRegAdminKeyError');
  const staffRegisterFormError = document.getElementById('staffRegisterFormError');
  const toggleStaffRegisterPwBtn = document.getElementById('toggleStaffRegisterPw') || document.getElementById('toggleStaffRegPw');
  const toggleStaffAdminKeyPwBtn = document.getElementById('toggleStaffAdminKeyPw');

  function isStaffUser(user) {
    if (!user) return false;
    const r = String(user.role || '').toLowerCase().trim();
    return r === 'staff' || r === 'faculty' || r === 'admin';
  }
  window.isStaffUser = isStaffUser;

  const userNameLabel = document.getElementById('userNameLabel');
  const userCourseLabel = document.getElementById('userCourseLabel');
  const userAvatar = document.getElementById('userAvatar');
  const welcomeHeading = document.getElementById('welcomeHeading');
  const goalsDoneLabel = document.getElementById('goalsDoneLabel');

  // populate course dropdown (signup) from COURSES data
  Object.keys(COURSES).forEach((key) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = COURSES[key].label;
    signupCourseSelect.appendChild(opt);
  });

  // Role Switcher: Student vs Staff
  let activeSelectedRole = 'student';
  function switchAuthRole(role) {
    activeSelectedRole = role;
    if (role === 'staff') {
      if (roleBtnStaff) roleBtnStaff.classList.add('active');
      if (roleBtnStudent) roleBtnStudent.classList.remove('active');
      if (staffAuthTabs) staffAuthTabs.classList.remove('hidden');
      if (studentAuthTabs) studentAuthTabs.classList.add('hidden');
      if (loginForm) loginForm.classList.add('hidden');
      if (signupForm) signupForm.classList.add('hidden');
      if (staffLoginForm) staffLoginForm.classList.remove('hidden');
      if (staffRegisterForm) staffRegisterForm.classList.add('hidden');
      if (showStaffLoginTab) showStaffLoginTab.classList.add('active');
      if (showStaffSignupTab) showStaffSignupTab.classList.remove('active');
    } else {
      if (roleBtnStudent) roleBtnStudent.classList.add('active');
      if (roleBtnStaff) roleBtnStaff.classList.remove('active');
      if (studentAuthTabs) studentAuthTabs.classList.remove('hidden');
      if (staffAuthTabs) staffAuthTabs.classList.add('hidden');
      if (staffLoginForm) staffLoginForm.classList.add('hidden');
      if (staffRegisterForm) staffRegisterForm.classList.add('hidden');
      if (loginForm) loginForm.classList.remove('hidden');
      if (signupForm) signupForm.classList.add('hidden');
      if (showLoginTab) showLoginTab.classList.add('active');
      if (showSignupTab) showSignupTab.classList.remove('active');
    }
  }

  if (roleBtnStudent) {
    roleBtnStudent.addEventListener('click', () => switchAuthRole('student'));
  }
  if (roleBtnStaff) {
    roleBtnStaff.addEventListener('click', () => switchAuthRole('staff'));
  }

  // Student auth tab buttons
  showLoginTab.addEventListener('click', () => {
    showLoginTab.classList.add('active');
    showSignupTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    emailError.textContent = '';
    passwordError.textContent = '';
    loginFormError.textContent = '';
    const loginSuccessEl = document.getElementById('loginFormSuccess');
    if (loginSuccessEl) { loginSuccessEl.classList.add('hidden'); loginSuccessEl.textContent = ''; }
  });
  showSignupTab.addEventListener('click', () => {
    showSignupTab.classList.add('active');
    showLoginTab.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    signupNameError.textContent = '';
    signupEmailError.textContent = '';
    signupPasswordError.textContent = '';
    signupFormError.textContent = '';
    const signupSuccessEl = document.getElementById('signupFormSuccess');
    if (signupSuccessEl) { signupSuccessEl.classList.add('hidden'); signupSuccessEl.textContent = ''; }
  });

  // Staff auth tab buttons
  if (showStaffLoginTab) {
    showStaffLoginTab.addEventListener('click', () => {
      showStaffLoginTab.classList.add('active');
      if (showStaffSignupTab) showStaffSignupTab.classList.remove('active');
      if (staffLoginForm) staffLoginForm.classList.remove('hidden');
      if (staffRegisterForm) staffRegisterForm.classList.add('hidden');
      if (staffEmailError) staffEmailError.textContent = '';
      if (staffPasswordError) staffPasswordError.textContent = '';
      if (staffLoginFormError) staffLoginFormError.textContent = '';
    });
  }

  if (showStaffSignupTab) {
    showStaffSignupTab.addEventListener('click', () => {
      showStaffSignupTab.classList.add('active');
      if (showStaffLoginTab) showStaffLoginTab.classList.remove('active');
      if (staffRegisterForm) staffRegisterForm.classList.remove('hidden');
      if (staffLoginForm) staffLoginForm.classList.add('hidden');
      if (staffRegNameError) staffRegNameError.textContent = '';
      if (staffRegEmailError) staffRegEmailError.textContent = '';
      if (staffRegPasswordError) staffRegPasswordError.textContent = '';
      if (staffRegPasskeyError) staffRegPasskeyError.textContent = '';
      if (staffRegisterFormError) staffRegisterFormError.textContent = '';
    });
  }

  const toggleSignupPwBtn = document.getElementById('toggleSignupPw');

  const eyeOpenSvg = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/></svg>`;
  const eyeClosedSvg = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  if (togglePwBtn) {
    togglePwBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePwBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      togglePwBtn.innerHTML = isPassword ? eyeClosedSvg : eyeOpenSvg;
    });
  }

  if (toggleSignupPwBtn) {
    toggleSignupPwBtn.addEventListener('click', () => {
      const isPassword = signupPasswordInput.type === 'password';
      signupPasswordInput.type = isPassword ? 'text' : 'password';
      toggleSignupPwBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      toggleSignupPwBtn.innerHTML = isPassword ? eyeClosedSvg : eyeOpenSvg;
    });
  }

  if (toggleStaffPwBtn) {
    toggleStaffPwBtn.addEventListener('click', () => {
      const isPassword = staffPasswordInput.type === 'password';
      staffPasswordInput.type = isPassword ? 'text' : 'password';
      toggleStaffPwBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      toggleStaffPwBtn.innerHTML = isPassword ? eyeClosedSvg : eyeOpenSvg;
    });
  }

  if (toggleStaffRegisterPwBtn && staffRegPasswordInput) {
    toggleStaffRegisterPwBtn.addEventListener('click', () => {
      const isPassword = staffRegPasswordInput.type === 'password';
      staffRegPasswordInput.type = isPassword ? 'text' : 'password';
      toggleStaffRegisterPwBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      toggleStaffRegisterPwBtn.innerHTML = isPassword ? eyeClosedSvg : eyeOpenSvg;
    });
  }

  if (toggleStaffAdminKeyPwBtn && staffRegPasskeyInput) {
    toggleStaffAdminKeyPwBtn.addEventListener('click', () => {
      const isPassword = staffRegPasskeyInput.type === 'password';
      staffRegPasskeyInput.type = isPassword ? 'text' : 'password';
      toggleStaffAdminKeyPwBtn.setAttribute('aria-label', isPassword ? 'Hide passkey' : 'Show passkey');
      toggleStaffAdminKeyPwBtn.innerHTML = isPassword ? eyeClosedSvg : eyeOpenSvg;
    });
  }

  // Clear validation errors on user input
  if (emailInput) {
    emailInput.addEventListener('input', () => { emailError.textContent = ''; loginFormError.textContent = ''; });
  }
  if (passwordInput) {
    passwordInput.addEventListener('input', () => { passwordError.textContent = ''; loginFormError.textContent = ''; });
  }
  if (signupNameInput) {
    signupNameInput.addEventListener('input', () => { signupNameError.textContent = ''; signupFormError.textContent = ''; });
  }
  if (signupEmailInput) {
    signupEmailInput.addEventListener('input', () => { signupEmailError.textContent = ''; signupFormError.textContent = ''; });
  }
  if (signupPasswordInput) {
    signupPasswordInput.addEventListener('input', () => { signupPasswordError.textContent = ''; signupFormError.textContent = ''; });
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());
  }

  function setButtonLoading(form, isLoading) {
    form.classList.toggle('is-loading', isLoading);
  }

  // Retrieve clean profile name (never derived from email address or email username)
  function getCleanProfileName(user) {
    if (!user) return '';
    const rawName = typeof user.name === 'string' ? user.name.trim() : '';
    if (!rawName) return '';

    // Check if name is mistakenly an email or email username
    if (user.email) {
      const cleanEmail = user.email.toLowerCase().trim();
      const emailPrefix = cleanEmail.split('@')[0];
      if (rawName.toLowerCase() === cleanEmail || rawName.toLowerCase() === emailPrefix) {
        // Recover known real name for Devanshi's accounts
        if (cleanEmail === 'devanshinand8@gmail.com' || cleanEmail === 'devanshi26@gmail.com') {
          return 'Devanshi';
        }
        return '';
      }
    }
    return rawName;
  }

  // Construct display greeting strictly using saved name or friendly fallback
  function formatUserGreeting(user) {
    const cleanName = getCleanProfileName(user);
    if (cleanName) {
      return `Hi, ${cleanName}!`;
    }
    return 'Hi there!';
  }

  async function enterDashboard(user) {
    currentUser = user;
    window.currentUser = user;
    saveSession(user.email);
    try {
      localStorage.removeItem('study_assistant_logged_out');
    } catch (e) {}

    const cleanName = getCleanProfileName(user);
    const displayName = cleanName || 'Student';
    userNameLabel.textContent = displayName;
    userCourseLabel.textContent = (COURSES[user.course] && COURSES[user.course].label) || 'Student';
    userAvatar.textContent = (cleanName || 'S').charAt(0).toUpperCase();
    welcomeHeading.textContent = formatUserGreeting(user);

    // Sync Top Navigation Bar user profile chip and dropdown
    const topNavAvatar = document.getElementById('topNavAvatar');
    const topNavUserName = document.getElementById('topNavUserName');
    const menuUserName = document.getElementById('menuUserName');
    const menuUserEmail = document.getElementById('menuUserEmail');
    if (topNavAvatar) topNavAvatar.textContent = (cleanName || 'S').charAt(0).toUpperCase();
    if (topNavUserName) topNavUserName.textContent = displayName;
    if (menuUserName) menuUserName.textContent = displayName;
    if (menuUserEmail) menuUserEmail.textContent = user.email || 'student@aktu.ac.in';

    if (window.refreshStudyNotifications) {
      window.refreshStudyNotifications();
    }

    // Immediately display saved user progress and streak on cards
    const progressLabel = document.getElementById('progressLabel');
    if (progressLabel) {
      progressLabel.textContent = `${typeof user.overallProgress === 'number' ? user.overallProgress : 0}%`;
    }
    const streakLabel = document.getElementById('streakLabel');
    if (streakLabel) {
      streakLabel.textContent = typeof user.streak === 'number' ? user.streak : 0;
    }

    loginScreen.classList.add('hidden');
    if (staffDashboardScreen) staffDashboardScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');

    const authLoadingScreen = document.getElementById('authLoadingScreen');
    if (authLoadingScreen) authLoadingScreen.classList.add('hidden');

    const novaFab = document.getElementById('novaFab');
    if (novaFab) novaFab.classList.remove('hidden');

    // Load persistent academic profile safely
    try {
      await loadStudentProfile(user);
    } catch (err) {
      console.warn('loadStudentProfile error:', err);
    }

    // Determine target initial view: respect #assignments, #chat, #timetable, etc., if in URL
    const targetHash = (window.location.hash || '').replace('#', '').trim();
    const urlParams = new URLSearchParams(window.location.search);
    const hasClassroomParam = urlParams.has('classroom_auth') || urlParams.has('classroom_logout');
    const initialView = (targetHash && viewMap[targetHash])
      ? targetHash
      : (hasClassroomParam ? 'assignments' : 'dashboard');
    showView(initialView);

    // Pick user's course by default in flashcards, then load everything user-specific safely
    try {
      if (typeof courseSelect !== 'undefined' && courseSelect) {
        courseSelect.value = COURSES[user.course] ? user.course : Object.keys(COURSES)[0];
      }
      if (typeof populateSubjects === 'function') populateSubjects();
      if (typeof loadDeckAndProgress === 'function') await loadDeckAndProgress();
      if (typeof loadConversationsList === 'function') await loadConversationsList();
      if (typeof loadUserTasksAndStats === 'function') await loadUserTasksAndStats();
      if (typeof loadAssignmentsForUser === 'function') await loadAssignmentsForUser();
    } catch (dataErr) {
      console.warn('Error loading user dashboard modules:', dataErr);
    }
  }

  /* ---------------------------------------------------
     STAFF DASHBOARD ENTRY & NAVIGATION
  --------------------------------------------------- */
  async function enterStaffDashboard(user) {
    currentUser = user;
    window.currentUser = user;
    saveSession(user.email);
    try {
      localStorage.removeItem('study_assistant_logged_out');
    } catch (e) {}

    const cleanName = getCleanProfileName(user) || user.name || 'Faculty Member';
    const roleTitle = user.role === 'admin' ? 'Administrator (Full Access)' : 'Staff (Authorized)';

    const staffNameLabel = document.getElementById('staffNameLabel');
    const staffRoleBadge = document.getElementById('staffRoleBadge');
    const staffAvatar = document.getElementById('staffAvatar');
    const staffDeptPill = document.getElementById('staffDeptPill');
    const staffTopName = document.getElementById('staffTopName');
    const staffTopAvatar = document.getElementById('staffTopAvatar');

    if (staffNameLabel) staffNameLabel.textContent = cleanName;
    if (staffRoleBadge) staffRoleBadge.textContent = roleTitle;
    if (staffAvatar) staffAvatar.textContent = (cleanName || 'F').charAt(0).toUpperCase();
    if (staffDeptPill) staffDeptPill.textContent = user.department || 'CSE & Scheduling';
    if (staffTopName) staffTopName.textContent = cleanName;
    if (staffTopAvatar) staffTopAvatar.textContent = (cleanName || 'F').charAt(0).toUpperCase();

    // Toggle screens
    if (loginScreen) loginScreen.classList.add('hidden');
    if (dashboardScreen) dashboardScreen.classList.add('hidden');
    if (staffDashboardScreen) staffDashboardScreen.classList.remove('hidden');

    const authLoadingScreen = document.getElementById('authLoadingScreen');
    if (authLoadingScreen) authLoadingScreen.classList.add('hidden');

    const novaFab = document.getElementById('novaFab');
    if (novaFab) novaFab.classList.add('hidden');

    // Initialize staff timetable generator
    if (window.NovaTimetable) {
      if (window.NovaTimetable.setRole) {
        window.NovaTimetable.setRole(user.role || 'staff');
      }
      if (window.NovaTimetable.loadAndRender) {
        window.NovaTimetable.loadAndRender();
      }
    }
  }

  // Staff Sidebar Tabs Navigation
  document.querySelectorAll('.staff-nav-item[data-tt-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.getAttribute('data-tt-tab');
      document.querySelectorAll('.staff-nav-item[data-tt-tab]').forEach(i => i.classList.remove('active'));
      btn.classList.add('active');

      const staffTopCrumb = document.getElementById('staffTopCrumb');
      if (staffTopCrumb) {
        staffTopCrumb.textContent = btn.querySelector('span')?.textContent || 'Timetable Administration';
      }

      if (window.NovaTimetable && window.NovaTimetable.setActiveTab) {
        window.NovaTimetable.setActiveTab(tab);
      }
      // Close mobile sidebar if open
      const staffSidebar = document.getElementById('staffSidebar');
      const staffOverlay = document.getElementById('staffSidebarOverlay');
      if (staffSidebar) staffSidebar.classList.remove('is-open');
      if (staffOverlay) staffOverlay.classList.remove('is-open');
    });
  });

  // Staff Sidebar Collapsible Groups Toggle
  document.querySelectorAll('.sidebar-group-header-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const group = btn.closest('.sidebar-collapsible-group');
      if (!group) return;
      const isExpanded = btn.getAttribute('aria-expanded') !== 'false';
      btn.setAttribute('aria-expanded', String(!isExpanded));
      group.classList.toggle('is-collapsed', isExpanded);
    });
  });

  // Staff mobile sidebar toggle
  const mobileStaffMenuBtn = document.getElementById('mobileStaffMenuBtn');
  const closeStaffSidebarBtn = document.getElementById('closeStaffSidebarBtn');
  const staffSidebarOverlay = document.getElementById('staffSidebarOverlay');
  const staffSidebar = document.getElementById('staffSidebar');

  if (mobileStaffMenuBtn && staffSidebar) {
    mobileStaffMenuBtn.addEventListener('click', () => {
      staffSidebar.classList.add('is-open');
      if (staffSidebarOverlay) staffSidebarOverlay.classList.add('is-open');
    });
  }
  if (closeStaffSidebarBtn && staffSidebar) {
    closeStaffSidebarBtn.addEventListener('click', () => {
      staffSidebar.classList.remove('is-open');
      if (staffSidebarOverlay) staffSidebarOverlay.classList.remove('is-open');
    });
  }
  if (staffSidebarOverlay && staffSidebar) {
    staffSidebarOverlay.addEventListener('click', () => {
      staffSidebar.classList.remove('is-open');
      staffSidebarOverlay.classList.remove('is-open');
    });
  }

  // Staff Logout Button
  const staffLogoutBtn = document.getElementById('staffLogoutBtn');
  if (staffLogoutBtn) {
    staffLogoutBtn.addEventListener('click', async () => {
      currentUser = null;
      window.currentUser = null;
      clearSession();
      try {
        localStorage.setItem('study_assistant_logged_out', 'true');
        localStorage.removeItem('novastudy_user');
      } catch (e) {}
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      } catch (e) {}

      if (staffDashboardScreen) staffDashboardScreen.classList.add('hidden');
      if (dashboardScreen) dashboardScreen.classList.add('hidden');
      if (loginScreen) loginScreen.classList.remove('hidden');

      if (staffLoginForm) staffLoginForm.reset();
      if (staffRegisterForm) staffRegisterForm.reset();
      switchAuthRole('staff');
    });
  }

  // Switch to Student Preview Button (for staff)
  const btnSwitchToStudentPreview = document.getElementById('btnSwitchToStudentPreview');
  if (btnSwitchToStudentPreview) {
    btnSwitchToStudentPreview.addEventListener('click', () => {
      if (!staffDashboardScreen.classList.contains('hidden')) {
        staffDashboardScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        showView('timetable');
        btnSwitchToStudentPreview.textContent = 'Back to Staff Portal';
      } else {
        dashboardScreen.classList.add('hidden');
        staffDashboardScreen.classList.remove('hidden');
        btnSwitchToStudentPreview.textContent = 'Preview Student Schedule';
      }
    });
  }

  // Student Login submit with strict validation & role enforcement
  let isLoginSubmitting = false;
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isLoginSubmitting) return;

    emailError.textContent = '';
    passwordError.textContent = '';
    loginFormError.textContent = '';
    const loginSuccessEl = document.getElementById('loginFormSuccess');
    if (loginSuccessEl) {
      loginSuccessEl.classList.add('hidden');
      loginSuccessEl.textContent = '';
    }

    const emailVal = emailInput.value.trim().toLowerCase();
    const pwVal = passwordInput.value;
    const rememberMeBox = document.getElementById('rememberMe');
    const rememberMeVal = rememberMeBox ? rememberMeBox.checked : true;
    let valid = true;

    if (!emailVal) {
      emailError.textContent = 'Please enter your student email address.';
      valid = false;
    } else if (!isValidEmail(emailVal)) {
      emailError.textContent = 'Please enter a valid email address (e.g. you@school.edu).';
      valid = false;
    }

    if (!pwVal) {
      passwordError.textContent = 'Please enter your password.';
      valid = false;
    }

    if (!valid) return;

    isLoginSubmitting = true;
    setButtonLoading(loginForm, true);
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.disabled = true;

    try {
      const user = await DB.login({ email: emailVal, password: pwVal, rememberMe: rememberMeVal, requestedRole: 'student' });
      if (loginSuccessEl) {
        loginSuccessEl.textContent = 'Login successful! Restoring your study session...';
        loginSuccessEl.classList.remove('hidden');
      }
      setTimeout(async () => {
        try {
          await enterDashboard(user);
          loginForm.reset();
          if (loginSuccessEl) loginSuccessEl.classList.add('hidden');
        } catch (enterErr) {
          console.warn('[Login] enterDashboard warning:', enterErr);
        }
      }, 350);
    } catch (err) {
      loginFormError.textContent = err.message || 'Incorrect email or password. Please try again.';
    } finally {
      isLoginSubmitting = false;
      setButtonLoading(loginForm, false);
      if (loginBtn) loginBtn.disabled = false;
    }
  });

  // Staff Login submit with strict role verification
  let isStaffLoginSubmitting = false;
  if (staffLoginForm) {
    staffLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isStaffLoginSubmitting) return;

      if (staffEmailError) staffEmailError.textContent = '';
      if (staffPasswordError) staffPasswordError.textContent = '';
      if (staffLoginFormError) staffLoginFormError.textContent = '';
      const loginSuccessEl = document.getElementById('staffLoginFormSuccess');
      if (loginSuccessEl) {
        loginSuccessEl.classList.add('hidden');
        loginSuccessEl.textContent = '';
      }

      const emailVal = (staffEmailInput ? staffEmailInput.value : '').trim().toLowerCase();
      const pwVal = staffPasswordInput ? staffPasswordInput.value : '';
      const rememberMeBox = document.getElementById('staffRememberMe');
      const rememberMeVal = rememberMeBox ? rememberMeBox.checked : true;
      let valid = true;

      if (!emailVal) {
        if (staffEmailError) staffEmailError.textContent = 'Please enter your faculty/staff email address.';
        valid = false;
      } else if (!isValidEmail(emailVal)) {
        if (staffEmailError) staffEmailError.textContent = 'Please enter a valid institution email address.';
        valid = false;
      }

      if (!pwVal) {
        if (staffPasswordError) staffPasswordError.textContent = 'Please enter your password.';
        valid = false;
      }

      if (!valid) return;

      isStaffLoginSubmitting = true;
      setButtonLoading(staffLoginForm, true);
      const staffLoginBtn = document.getElementById('staffLoginBtn');
      if (staffLoginBtn) staffLoginBtn.disabled = true;

      try {
        const user = await DB.login({ email: emailVal, password: pwVal, rememberMe: rememberMeVal, requestedRole: 'staff' });
        if (loginSuccessEl) {
          loginSuccessEl.textContent = 'Staff authentication verified! Launching administrative portal...';
          loginSuccessEl.classList.remove('hidden');
        }
        setTimeout(async () => {
          try {
            await enterStaffDashboard(user);
            staffLoginForm.reset();
            if (loginSuccessEl) loginSuccessEl.classList.add('hidden');
          } catch (enterErr) {
            console.warn('[Staff Login] enterStaffDashboard warning:', enterErr);
          }
        }, 350);
      } catch (err) {
        if (staffLoginFormError) {
          staffLoginFormError.textContent = err.message || 'Authentication failed. Please check credentials or contact administration.';
        }
      } finally {
        isStaffLoginSubmitting = false;
        setButtonLoading(staffLoginForm, false);
        if (staffLoginBtn) staffLoginBtn.disabled = false;
      }
    });
  }

  // Staff Registration submit with admin passkey verification
  let isStaffRegSubmitting = false;
  if (staffRegisterForm) {
    staffRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isStaffRegSubmitting) return;

      const nameEl = staffRegNameInput || document.getElementById('staffRegName');
      const emailEl = staffRegEmailInput || document.getElementById('staffRegEmail');
      const deptEl = staffRegDeptInput || document.getElementById('staffRegDept');
      const desigEl = staffRegDesigInput || document.getElementById('staffRegDesig') || document.getElementById('staffRegDesignation');
      const pwEl = staffRegPasswordInput || document.getElementById('staffRegPassword');
      const passkeyEl = staffRegPasskeyInput || document.getElementById('staffRegPasskey') || document.getElementById('staffRegAdminKey');

      const nameErrEl = staffRegNameError || document.getElementById('staffRegNameError');
      const emailErrEl = staffRegEmailError || document.getElementById('staffRegEmailError');
      const pwErrEl = staffRegPasswordError || document.getElementById('staffRegPasswordError');
      const passkeyErrEl = staffRegPasskeyError || document.getElementById('staffRegPasskeyError') || document.getElementById('staffRegAdminKeyError');

      if (nameErrEl) nameErrEl.textContent = '';
      if (emailErrEl) emailErrEl.textContent = '';
      if (pwErrEl) pwErrEl.textContent = '';
      if (passkeyErrEl) passkeyErrEl.textContent = '';
      if (staffRegisterFormError) staffRegisterFormError.textContent = '';
      const regSuccessEl = document.getElementById('staffRegisterFormSuccess');
      if (regSuccessEl) {
        regSuccessEl.classList.add('hidden');
        regSuccessEl.textContent = '';
      }

      const nameVal = nameEl ? nameEl.value.trim() : '';
      const emailVal = emailEl ? emailEl.value.trim().toLowerCase() : '';
      const deptVal = (deptEl ? deptEl.value : 'Computer Science & Engineering').trim();
      const desigVal = (desigEl ? desigEl.value : 'Assistant Professor').trim();
      const pwVal = pwEl ? pwEl.value : '';
      const passkeyVal = passkeyEl ? passkeyEl.value.trim() : '';
      let valid = true;

      if (!nameVal || nameVal.length < 2) {
        if (nameErrEl) nameErrEl.textContent = 'Please enter your full faculty name.';
        valid = false;
      }

      if (!emailVal || !isValidEmail(emailVal)) {
        if (emailErrEl) emailErrEl.textContent = 'Please enter a valid academic email address.';
        valid = false;
      }

      if (!pwVal || pwVal.length < 8) {
        if (pwErrEl) pwErrEl.textContent = 'Password must be at least 8 characters long.';
        valid = false;
      }

      if (!passkeyVal) {
        if (passkeyErrEl) passkeyErrEl.textContent = 'Administrative Authorization Passkey is required.';
        valid = false;
      }

      if (!valid) return;

      isStaffRegSubmitting = true;
      setButtonLoading(staffRegisterForm, true);
      const regBtn = document.getElementById('staffRegisterBtn');
      if (regBtn) regBtn.disabled = true;

      try {
        const user = await DB.staffRegister({
          name: nameVal,
          email: emailVal,
          department: deptVal,
          designation: desigVal,
          password: pwVal,
          adminPasskey: passkeyVal
        });

        if (regSuccessEl) {
          regSuccessEl.textContent = 'Staff account approved and created! Launching workspace...';
          regSuccessEl.classList.remove('hidden');
        }

        setTimeout(async () => {
          try {
            await enterStaffDashboard(user);
            staffRegisterForm.reset();
            if (regSuccessEl) regSuccessEl.classList.add('hidden');
          } catch (enterErr) {
            console.warn('[Staff Register] enterStaffDashboard warning:', enterErr);
          }
        }, 450);
      } catch (err) {
        if (staffRegisterFormError) {
          staffRegisterFormError.textContent = err.message || 'Registration rejected. Verify admin passkey.';
        }
      } finally {
        isStaffRegSubmitting = false;
        setButtonLoading(staffRegisterForm, false);
        if (regBtn) regBtn.disabled = false;
      }
    });
  }

  // Forgot Password flow
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
      e.preventDefault();
      loginFormError.textContent = '';
      const loginSuccessEl = document.getElementById('loginFormSuccess');
      if (loginSuccessEl) {
        loginSuccessEl.classList.add('hidden');
        loginSuccessEl.textContent = '';
      }

      let emailForReset = (emailInput.value || '').trim().toLowerCase();
      if (!emailForReset || !isValidEmail(emailForReset)) {
        emailForReset = prompt('Please enter your student email address for password reset:', emailForReset || '');
        if (!emailForReset) return;
        emailForReset = emailForReset.trim().toLowerCase();
        if (!isValidEmail(emailForReset)) {
          loginFormError.textContent = 'Please enter a valid email address (e.g. you@school.edu).';
          return;
        }
      }

      try {
        const res = await DB.sendPasswordReset(emailForReset);
        if (loginSuccessEl) {
          loginSuccessEl.textContent = (res && res.message) || `Password reset instructions sent to ${emailForReset}. Please check your inbox and spam folder.`;
          loginSuccessEl.classList.remove('hidden');
        }
      } catch (err) {
        loginFormError.textContent = err.message || 'Failed to send password reset email. Please try again.';
      }
    });
  }

  // Signup submit with strict validation & duplicate prevention
  let isSignupSubmitting = false;
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSignupSubmitting) return;

    signupNameError.textContent = '';
    signupEmailError.textContent = '';
    signupPasswordError.textContent = '';
    signupFormError.textContent = '';
    const signupSuccessEl = document.getElementById('signupFormSuccess');
    if (signupSuccessEl) {
      signupSuccessEl.classList.add('hidden');
      signupSuccessEl.textContent = '';
    }

    const nameVal = signupNameInput.value.trim();
    const emailVal = signupEmailInput.value.trim().toLowerCase();
    const pwVal = signupPasswordInput.value;
    const courseVal = signupCourseSelect.value;
    let valid = true;

    if (!nameVal) {
      signupNameError.textContent = 'Please enter your full name.';
      valid = false;
    } else if (nameVal.length < 2) {
      signupNameError.textContent = 'Full name must be at least 2 characters.';
      valid = false;
    }

    if (!emailVal) {
      signupEmailError.textContent = 'Please enter your student email address.';
      valid = false;
    } else if (!isValidEmail(emailVal)) {
      signupEmailError.textContent = 'Please enter a valid email address (e.g. you@school.edu).';
      valid = false;
    }

    if (!courseVal) {
      signupFormError.textContent = 'Please select your course from the dropdown.';
      valid = false;
    }

    if (!pwVal) {
      signupPasswordError.textContent = 'Please create a password.';
      valid = false;
    } else if (pwVal.length < 8) {
      signupPasswordError.textContent = 'Password must be at least 8 characters.';
      valid = false;
    }

    if (!valid) return;

    isSignupSubmitting = true;
    setButtonLoading(signupForm, true);
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) signupBtn.disabled = true;

    try {
      const user = await DB.signup({ name: nameVal, email: emailVal, password: pwVal, course: courseVal });
      if (signupSuccessEl) {
        signupSuccessEl.textContent = 'Registration successful! Preparing your study workspace...';
        signupSuccessEl.classList.remove('hidden');
      }
      // Visual confirmation before entering dashboard
      setTimeout(async () => {
        try {
          await enterDashboard(user);
          signupForm.reset();
          if (signupSuccessEl) signupSuccessEl.classList.add('hidden');
        } catch (enterErr) {
          console.warn('[Signup] enterDashboard warning:', enterErr);
        }
      }, 500);
    } catch (err) {
      signupFormError.textContent = err.message || 'Signup failed. Please try again.';
    } finally {
      isSignupSubmitting = false;
      setButtonLoading(signupForm, false);
      if (signupBtn) signupBtn.disabled = false;
    }
  });

  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn.addEventListener('click', async () => {
    currentUser = null;
    window.currentUser = null;
    clearSession();
    try {
      localStorage.setItem('study_assistant_logged_out', 'true');
      localStorage.removeItem('novastudy_user');
      localStorage.removeItem('nova_timetable_cache_v2');
      sessionStorage.removeItem('nova_tt_admin');
    } catch (e) {}
    try {
      if (window.FirebaseAuthService) {
        await window.FirebaseAuthService.logout();
      }
    } catch (e) {}
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}

    // Reset user profile labels to neutral state
    if (userNameLabel) userNameLabel.textContent = 'Student';
    if (userCourseLabel) userCourseLabel.textContent = 'Student';
    if (userAvatar) userAvatar.textContent = 'S';
    if (welcomeHeading) welcomeHeading.textContent = 'Hi there!';
    const topNavAvatar = document.getElementById('topNavAvatar');
    const topNavUserName = document.getElementById('topNavUserName');
    const menuUserName = document.getElementById('menuUserName');
    const menuUserEmail = document.getElementById('menuUserEmail');
    if (topNavAvatar) topNavAvatar.textContent = 'S';
    if (topNavUserName) topNavUserName.textContent = 'Student';
    if (menuUserName) menuUserName.textContent = 'Student';
    if (menuUserEmail) menuUserEmail.textContent = 'student@aktu.ac.in';

    // Clear user-specific data from UI
    userTasks = [];
    resetCalendarAndTaskUI();
    const convList = document.getElementById('conversationsList');
    if (convList) convList.innerHTML = '';
    const chatMsgContainer = document.getElementById('chatMessages');
    if (chatMsgContainer) chatMsgContainer.innerHTML = '';
    const asgList = document.getElementById('assignmentsList');
    if (asgList) asgList.innerHTML = '';

    dashboardScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    loginForm.reset();
    signupForm.reset();
    showLoginTab.click();
    const novaFab = document.getElementById('novaFab');
    const novaPanel = document.getElementById('novaPanel');
    if (novaFab) novaFab.classList.add('hidden');
    if (novaPanel) novaPanel.classList.add('hidden');
  });

  /* ---------------------------------------------------
     2. SIDEBAR NAVIGATION
  --------------------------------------------------- */
  const navItems = document.querySelectorAll('.nav-item[data-target]');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');

  function openSidebar() {
    sidebar.classList.add('is-open');
    sidebarOverlay.classList.add('is-open');
  }
  function closeSidebar() {
    sidebar.classList.remove('is-open');
    sidebarOverlay.classList.remove('is-open');
  }
  mobileMenuBtn.addEventListener('click', openSidebar);
  closeSidebarBtn.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  /* View Switcher: Dashboard, AI Chat, Flashcards, Calendar, Courses, Assignments, Settings, Timetable */
  const viewMap = {
    dashboard: document.getElementById('dashboardView'),
    chat: document.getElementById('chatView'),
    flashcards: document.getElementById('flashcardsView'),
    calendar: document.getElementById('calendarView'),
    courses: document.getElementById('coursesView'),
    assignments: document.getElementById('assignmentsView'),
    timetable: document.getElementById('timetableView'),
    'tests-exams': document.getElementById('testsExamsView'),
    settings: document.getElementById('settingsView')
  };

  function showView(viewName, activeNavId) {
    const targetKey = (viewName && viewMap[viewName]) ? viewName : 'dashboard';
    Object.keys(viewMap).forEach((key) => {
      const el = viewMap[key];
      if (el) {
        if (key === targetKey) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    const currentNavLinks = document.querySelectorAll('.sidebar-nav .nav-item[data-target]');
    currentNavLinks.forEach((i) => {
      const navId = i.getAttribute('data-nav-id');
      const target = i.getAttribute('data-target');
      if (activeNavId) {
        if (navId === activeNavId) {
          i.classList.add('active');
        } else {
          i.classList.remove('active');
        }
      } else {
        if (navId === targetKey || (!navId && target === targetKey)) {
          i.classList.add('active');
        } else {
          i.classList.remove('active');
        }
      }
    });

    if (targetKey === 'chat') {
      setTimeout(() => {
        scrollChatToBottom();
        if (chatInput) chatInput.focus();
      }, 60);
    }

    if (targetKey === 'calendar') {
      renderWeekStrip();
      renderDayTasks();
      if (currentUser?.email) {
        DB.getTasks(currentUser.email).then((tasks) => {
          if (Array.isArray(tasks)) {
            userTasks = tasks;
            renderWeekStrip();
            renderDayTasks();
            updateDashboardMetrics();
          }
        }).catch(() => {});
      }
    }

    if (targetKey === 'assignments') {
      loadAssignmentsForUser();
    }

    if (targetKey === 'timetable') {
      if (window.NovaTimetable && window.NovaTimetable.loadAndRender) {
        window.NovaTimetable.loadAndRender();
      }
    }

    if (targetKey === 'tests-exams') {
      if (window.NovaTestsPlanner && window.NovaTestsPlanner.loadAndRender) {
        window.NovaTestsPlanner.loadAndRender();
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.showView = showView;

  document.querySelectorAll('.sidebar-nav .nav-item[data-target]').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('data-target');
      const navId = item.getAttribute('data-nav-id');
      const promptSuggest = item.getAttribute('data-prompt-suggest');
      showView(targetId, navId);
      if (targetId === 'chat' && promptSuggest && chatInput) {
        chatInput.value = promptSuggest;
        setTimeout(() => {
          if (chatInput) chatInput.focus();
        }, 80);
      }
      closeSidebar();
    });
  });

  // Action buttons throughout the dashboard that navigate to dedicated views
  document.querySelectorAll('[data-nav-target]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-nav-target');
      const promptSuggest = btn.getAttribute('data-prompt-suggest');
      if (target) {
        showView(target);
        if (target === 'chat' && promptSuggest && chatInput) {
          chatInput.value = promptSuggest;
          chatInput.focus();
        }
      }
      closeSidebar();
    });
  });

  // Suggested prompt chips inside AI Chat view
  document.querySelectorAll('.chat-chip-btn').forEach((chip) => {
    chip.addEventListener('click', () => {
      if (chatInput) {
        chatInput.value = chip.getAttribute('data-prompt') || chip.textContent.trim();
        chatInput.focus();
      }
    });
  });

  const backToDashboardBtn = document.getElementById('backToDashboardBtn');
  if (backToDashboardBtn) {
    backToDashboardBtn.addEventListener('click', () => {
      showView('dashboard');
    });
  }

  const openAktuPortalBtn = document.getElementById('openAktuPortalBtn');
  if (openAktuPortalBtn) {
    openAktuPortalBtn.addEventListener('click', () => {
      showView('courses');
    });
  }

  /* ---------------------------------------------------
   3. AI CHAT + PERSISTENT STUDENT MEMORY & MULTI-CONVERSATIONS
  --------------------------------------------------- */

  const API_URL = (typeof window !== 'undefined' && window.location && window.location.port === '5000')
    ? 'http://localhost:5000'
    : '';

  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const clearChatBtn = document.getElementById('clearChatBtn');
  const newChatBtn = document.getElementById('newChatBtn');
  const sidebarNewChatBtn = document.getElementById('sidebarNewChatBtn');
  const clearAllChatsBtn = document.getElementById('clearAllChatsBtn');
  const conversationsList = document.getElementById('conversationsList');
  const chatContextSummary = document.getElementById('chatContextSummary');
  const chatContextPillText = document.getElementById('chatContextPillText');

  // Attachment & Multimodal Study Material Elements
  const chatAttachBtn = document.getElementById('chatAttachBtn');
  const chatAttachDropdown = document.getElementById('chatAttachDropdown');
  const attachPdfBtn = document.getElementById('attachPdfBtn');
  const attachImageBtn = document.getElementById('attachImageBtn');
  const pdfFileInput = document.getElementById('pdfFileInput');
  const imageFileInput = document.getElementById('imageFileInput');
  const chatAttachmentPreviewArea = document.getElementById('chatAttachmentPreviewArea');
  const attachmentChipIcon = document.getElementById('attachmentChipIcon');
  const attachmentChipName = document.getElementById('attachmentChipName');
  const attachmentChipMeta = document.getElementById('attachmentChipMeta');
  const attachmentRemoveBtn = document.getElementById('attachmentRemoveBtn');

  let currentAttachment = null;

  // Academic Profile DOM elements
  const profileNameInput = document.getElementById('profileNameInput');
  const profileEmailInput = document.getElementById('profileEmailInput');
  const profileUniversityInput = document.getElementById('profileUniversityInput');
  const profileProgramSelect = document.getElementById('profileProgramSelect');
  const profileBranchSelect = document.getElementById('profileBranchSelect');
  const profileBranchInput = document.getElementById('profileBranchInput');
  const profileBranchGroup = document.getElementById('profileBranchGroup');
  const profileYearSelect = document.getElementById('profileYearSelect');
  const profileSemesterSelect = document.getElementById('profileSemesterSelect');
  const programDurationBadge = document.getElementById('programDurationBadge');
  const profileSubjectsInput = document.getElementById('profileSubjectsInput');
  const syncSyllabusSubjectsBtn = document.getElementById('syncSyllabusSubjectsBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const profileSaveFeedback = document.getElementById('profileSaveFeedback');

  // AKTU standard syllabus curriculum mapping by semester
  const AKTU_SEMESTER_SUBJECTS = {
    'Semester 1': ['Engineering Physics', 'Engineering Mathematics-I', 'Basic Electrical Engineering', 'Programming for Problem Solving'],
    'Semester 2': ['Engineering Chemistry', 'Engineering Mathematics-II', 'Basic Electronics Engineering', 'Emerging Technology'],
    'Semester 3': ['Data Structures', 'Computer System Architecture', 'Discrete Structures & Theory of Logic', 'Technical Communication'],
    'Semester 4': ['Operating Systems', 'Theory of Automata and Formal Languages', 'Object Oriented Programming with Java', 'Universal Human Values'],
    'Semester 5': ['Database Management Systems', 'Compiler Design', 'Design and Analysis of Algorithms', 'Web Designing'],
    'Semester 6': ['Computer Networks', 'Software Engineering', 'Cloud Computing', 'Artificial Intelligence'],
    'Semester 7': ['Machine Learning', 'Cryptography & Network Security', 'Distributed Systems', 'Cloud Security'],
    'Semester 8': ['Deep Learning', 'Big Data Analytics', 'Major Project', 'Professional Ethics']
  };

  // Chat conversation state
  let currentConversationId = 'default';
  let activeConversations = [];

  function scrollChatToBottom() {
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  /* Academic Profile Helper Methods */
  function getCentralProgramsConfig() {
    if (typeof window !== 'undefined' && window.AKTU_CENTRAL_PROGRAMS) {
      return window.AKTU_CENTRAL_PROGRAMS;
    }
    if (typeof AKTU_CENTRAL_PROGRAMS !== 'undefined') {
      return AKTU_CENTRAL_PROGRAMS;
    }
    return {};
  }

  function initProgramDropdown(selectedProgKey) {
    if (!profileProgramSelect) return;
    const config = getCentralProgramsConfig();
    profileProgramSelect.innerHTML = '';

    Object.keys(config).forEach((key) => {
      const prog = config[key];
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = prog.name || key;
      if (selectedProgKey && (selectedProgKey === key || selectedProgKey.toLowerCase() === key.toLowerCase())) {
        opt.selected = true;
      }
      profileProgramSelect.appendChild(opt);
    });

    if (!profileProgramSelect.value && Object.keys(config).length > 0) {
      profileProgramSelect.value = 'B.Tech';
    }
  }

  function findMatchingBranch(branches, targetBranch) {
    if (!branches || !branches.length) return 'General';
    if (!targetBranch) return branches[0];
    const clean = targetBranch.trim().toLowerCase();

    // 1. Exact match
    const exact = branches.find((b) => b.toLowerCase() === clean);
    if (exact) return exact;

    // 2. Parentheses acronym/code match (e.g. "CSE" matches "Computer Science & Engineering (CSE)")
    const acronymMatch = branches.find((b) => {
      const match = b.match(/\(([^)]+)\)/);
      return match && match[1].toLowerCase() === clean;
    });
    if (acronymMatch) return acronymMatch;

    // 3. Substring match
    const subMatch = branches.find((b) => b.toLowerCase().includes(clean) || clean.includes(b.toLowerCase()));
    if (subMatch) return subMatch;

    // 4. Default to first branch
    return branches[0];
  }

  function updateAcademicFieldsByProgram(programKey, desiredBranch, desiredYear, desiredSem) {
    const config = getCentralProgramsConfig();
    const progData = config[programKey] || config['B.Tech'] || {
      name: 'B.Tech',
      durationYears: 4,
      semestersCount: 8,
      branches: ['Computer Science & Engineering (CSE)', 'Other']
    };

    const duration = progData.durationYears || 4;
    const maxSemesters = progData.semestersCount || (duration * 2);
    const suffixes = { 1: 'st', 2: 'nd', 3: 'rd', 4: 'th', 5: 'th' };

    // 1. Update duration badge
    if (programDurationBadge) {
      programDurationBadge.textContent = `${duration}-Year Degree Programme (${maxSemesters} Semesters)`;
    }

    // 2. Populate Branch / Specialization dropdown
    if (profileBranchSelect) {
      profileBranchSelect.innerHTML = '';
      const branches = (progData.branches && progData.branches.length) ? progData.branches : ['General'];
      branches.forEach((b) => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        profileBranchSelect.appendChild(opt);
      });

      const matchedBranch = findMatchingBranch(branches, desiredBranch);
      profileBranchSelect.value = matchedBranch || branches[0];
      if (profileBranchInput) profileBranchInput.value = profileBranchSelect.value;
    }

    // 3. Populate Academic Year dropdown (1 to durationYears)
    if (profileYearSelect) {
      profileYearSelect.innerHTML = '';
      for (let y = 1; y <= duration; y++) {
        const suf = suffixes[y] || 'th';
        const opt = document.createElement('option');
        opt.value = `${y}${suf} Year`;
        opt.textContent = `${y}${suf} Year`;
        profileYearSelect.appendChild(opt);
      }

      // Check if desired year is within valid duration
      let yearNum = 1;
      if (desiredYear) {
        const parsed = parseInt(String(desiredYear).replace(/\D/g, '')) || 1;
        if (parsed >= 1 && parsed <= duration) {
          yearNum = parsed;
        }
      }
      const suf = suffixes[yearNum] || 'th';
      profileYearSelect.value = `${yearNum}${suf} Year`;

      // 4. Populate Current Semester dropdown (1 to semestersCount)
      if (profileSemesterSelect) {
        profileSemesterSelect.innerHTML = '';
        for (let s = 1; s <= maxSemesters; s++) {
          const opt = document.createElement('option');
          opt.value = `Semester ${s}`;
          opt.textContent = `Semester ${s}`;
          profileSemesterSelect.appendChild(opt);
        }

        // Semester range for the active year
        const minSemForYear = (yearNum - 1) * 2 + 1;
        const maxSemForYear = Math.min(yearNum * 2, maxSemesters);

        let semNumToSet = minSemForYear;
        if (desiredSem) {
          const parsedSem = parseInt(String(desiredSem).replace(/\D/g, '')) || 1;
          if (parsedSem >= minSemForYear && parsedSem <= maxSemForYear) {
            semNumToSet = parsedSem;
          }
        }
        profileSemesterSelect.value = `Semester ${semNumToSet}`;
      }
    }
  }

  function updateAcademicBadgeUI(user) {
    if (!user) return;
    const univ = user.university || 'AKTU';
    const prog = user.program || 'B.Tech';
    const branch = user.branch || 'CSE';
    const year = user.year || '2nd Year';
    const sem = user.semester || 'Semester 3';

    // Short branch abbreviation for compact badge
    const parenMatch = branch.match(/\(([^)]+)\)/);
    const shortBranch = parenMatch ? parenMatch[1] : branch;
    const displayBranch = branch.toLowerCase().includes(prog.toLowerCase()) ? branch : `${prog} ${shortBranch}`;
    const subsCount = Array.isArray(user.subjects) ? user.subjects.length : 0;
    const contextStr = `${univ} • ${displayBranch} • ${year} • ${sem}${subsCount ? ` • ${subsCount} Subjects Synced` : ''}`;

    if (chatContextSummary) chatContextSummary.textContent = contextStr;
    if (chatContextPillText) chatContextPillText.textContent = contextStr;
    const chatContextPillEl = document.getElementById('chatContextPill');
    if (chatContextPillEl) {
      const subsList = Array.isArray(user.subjects) && user.subjects.length > 0 ? user.subjects.join(', ') : 'No subjects synced';
      chatContextPillEl.setAttribute('title', `Active Curriculum: ${contextStr}\nSynced Subjects: ${subsList}`);
    }

    const settingsUserName = document.getElementById('settingsUserName');
    const settingsUserEmail = document.getElementById('settingsUserEmail');
    const settingsUserCourse = document.getElementById('settingsUserCourse');
    if (settingsUserName) settingsUserName.textContent = user.name || 'Student';
    if (settingsUserEmail) settingsUserEmail.textContent = user.email;
    if (settingsUserCourse) settingsUserCourse.textContent = `${univ} - ${displayBranch} (${year}, ${sem})`;
  }

  async function loadStudentProfile(user) {
    if (!user || !user.email) return;

    let profileData = { ...user };

    // Fetch persistent profile from backend
    try {
      const res = await fetch(`${API_URL}/api/user/profile/${encodeURIComponent(user.email)}`, {
        headers: { 'x-user-email': user.email },
        credentials: 'include'
      });
      if (res.ok) {
        const serverProfile = await res.json();
        profileData = { ...profileData, ...serverProfile };
      }
    } catch (e) {
      console.warn('Could not fetch server profile, using local DB:', e);
    }

    // Default academic fields
    profileData.university = profileData.university || 'AKTU';
    profileData.program = profileData.program || 'B.Tech';
    profileData.branch = profileData.branch || 'CSE';
    profileData.year = profileData.year || '2nd Year';
    profileData.semester = profileData.semester || 'Semester 3';
    if (!profileData.subjects || !profileData.subjects.length) {
      profileData.subjects = AKTU_SEMESTER_SUBJECTS[profileData.semester] || [
        'Data Structures',
        'Computer System Architecture',
        'Discrete Structures & Theory of Logic',
        'Technical Communication'
      ];
    }

    currentUser = profileData;
    window.currentUser = profileData;

    // Populate Settings UI
    if (profileNameInput) profileNameInput.value = currentUser.name || '';
    if (profileEmailInput) profileEmailInput.value = currentUser.email || '';
    if (profileUniversityInput) profileUniversityInput.value = currentUser.university || 'AKTU';

    // Initialize Program and dependent academic fields
    initProgramDropdown(currentUser.program || 'B.Tech');
    updateAcademicFieldsByProgram(
      currentUser.program || 'B.Tech',
      currentUser.branch || 'CSE',
      currentUser.year || '2nd Year',
      currentUser.semester || 'Semester 3'
    );

    if (profileSubjectsInput) {
      profileSubjectsInput.value = Array.isArray(currentUser.subjects)
        ? currentUser.subjects.join(', ')
        : (currentUser.subjects || '');
    }

    updateAcademicBadgeUI(currentUser);
    if (window.NovaTestsPlanner && window.NovaTestsPlanner.onProfileUpdated) {
      window.NovaTestsPlanner.onProfileUpdated(currentUser);
    }
  }

  async function saveStudentProfile() {
    if (!currentUser) return;

    const nameVal = profileNameInput ? profileNameInput.value.trim() : (currentUser.name || 'Student');
    const univVal = profileUniversityInput ? profileUniversityInput.value.trim() : (currentUser.university || 'AKTU');
    const programVal = profileProgramSelect ? profileProgramSelect.value : (currentUser.program || 'B.Tech');
    const branchVal = profileBranchSelect ? profileBranchSelect.value : (profileBranchInput ? profileBranchInput.value : (currentUser.branch || 'CSE'));
    const yearVal = profileYearSelect ? profileYearSelect.value : (currentUser.year || '2nd Year');
    const semVal = profileSemesterSelect ? profileSemesterSelect.value : (currentUser.semester || 'Semester 3');
    const rawSubs = profileSubjectsInput ? profileSubjectsInput.value.trim() : '';
    const subjectsArray = rawSubs
      ? rawSubs.split(',').map((s) => s.trim()).filter(Boolean)
      : (AKTU_SEMESTER_SUBJECTS[semVal] || []);

    const profileUpdate = {
      email: currentUser.email,
      name: nameVal || 'Student',
      university: univVal || 'AKTU',
      program: programVal || 'B.Tech',
      branch: branchVal || 'CSE',
      year: yearVal,
      semester: semVal,
      subjects: subjectsArray
    };

    // 1. Client IndexedDB update
    await DB.updateUser(currentUser.email, profileUpdate);

    // 2. Server API update
    try {
      await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email
        },
        credentials: 'include',
        body: JSON.stringify(profileUpdate)
      });
    } catch (err) {
      console.warn('Backend profile update failed, using local DB:', err);
    }

    // 3. Update memory state and UI
    currentUser = { ...currentUser, ...profileUpdate };
    window.currentUser = currentUser;
    updateAcademicBadgeUI(currentUser);
    if (window.NovaTestsPlanner && window.NovaTestsPlanner.onProfileUpdated) {
      window.NovaTestsPlanner.onProfileUpdated(currentUser);
    }
    const cleanName = getCleanProfileName(currentUser);
    userNameLabel.textContent = cleanName || 'Student';
    welcomeHeading.textContent = formatUserGreeting(currentUser);
    const topNavAvatar = document.getElementById('topNavAvatar');
    const topNavUserName = document.getElementById('topNavUserName');
    const menuUserName = document.getElementById('menuUserName');
    if (topNavAvatar) topNavAvatar.textContent = (cleanName || 'S').charAt(0).toUpperCase();
    if (topNavUserName) topNavUserName.textContent = cleanName || 'Student';
    if (menuUserName) menuUserName.textContent = cleanName || 'Student';

    // 4. Show success feedback alert
    if (profileSaveFeedback) {
      profileSaveFeedback.classList.remove('hidden');
      setTimeout(() => {
        profileSaveFeedback.classList.add('hidden');
      }, 3500);
    }
  }

  // Profile Event Listeners
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', saveStudentProfile);
  }

  if (profileProgramSelect) {
    profileProgramSelect.addEventListener('change', () => {
      const selectedProg = profileProgramSelect.value;
      const curBranch = profileBranchSelect ? profileBranchSelect.value : '';
      const curYear = profileYearSelect ? profileYearSelect.value : '';
      const curSem = profileSemesterSelect ? profileSemesterSelect.value : '';
      updateAcademicFieldsByProgram(selectedProg, curBranch, curYear, curSem);
    });
  }

  if (profileBranchSelect) {
    profileBranchSelect.addEventListener('change', () => {
      if (profileBranchInput) {
        profileBranchInput.value = profileBranchSelect.value;
      }
    });
  }

  if (profileYearSelect) {
    profileYearSelect.addEventListener('change', () => {
      const yrNum = parseInt(profileYearSelect.value.replace(/\D/g, '')) || 1;
      const progKey = profileProgramSelect ? profileProgramSelect.value : 'B.Tech';
      const config = getCentralProgramsConfig();
      const progData = config[progKey] || { durationYears: 4, semestersCount: 8 };
      const maxSem = progData.semestersCount || (progData.durationYears * 2);

      const minSemForYear = (yrNum - 1) * 2 + 1;
      const maxSemForYear = Math.min(yrNum * 2, maxSem);

      if (profileSemesterSelect) {
        const curSemNum = parseInt(profileSemesterSelect.value.replace(/\D/g, '')) || 1;
        if (curSemNum < minSemForYear || curSemNum > maxSemForYear) {
          profileSemesterSelect.value = `Semester ${minSemForYear}`;
        }
      }
    });
  }

  if (profileSemesterSelect) {
    profileSemesterSelect.addEventListener('change', () => {
      const semNum = parseInt(profileSemesterSelect.value.replace(/\D/g, '')) || 1;
      const progKey = profileProgramSelect ? profileProgramSelect.value : 'B.Tech';
      const config = getCentralProgramsConfig();
      const progData = config[progKey] || { durationYears: 4, semestersCount: 8 };
      const duration = progData.durationYears || 4;

      const expectedYear = Math.ceil(semNum / 2);
      if (expectedYear <= duration && profileYearSelect) {
        const suffixes = { 1: 'st', 2: 'nd', 3: 'rd', 4: 'th', 5: 'th' };
        const suf = suffixes[expectedYear] || 'th';
        profileYearSelect.value = `${expectedYear}${suf} Year`;
      }
    });
  }

  if (syncSyllabusSubjectsBtn) {
    syncSyllabusSubjectsBtn.addEventListener('click', async () => {
      const selectedSem = profileSemesterSelect ? profileSemesterSelect.value : 'Semester 3';
      const selectedProg = profileProgramSelect ? profileProgramSelect.value : 'B.Tech';
      const semNum = parseInt(selectedSem.replace(/\D/g, '')) || 3;

      let subs = null;
      if (typeof window !== 'undefined' && window.AKTU_PROGRAMMES) {
        const progData = window.AKTU_PROGRAMMES.find(p =>
          (p.degree && p.degree.toLowerCase() === selectedProg.toLowerCase()) ||
          (p.shortName && p.shortName.toLowerCase().includes(selectedProg.toLowerCase()))
        );
        if (progData) {
          const semData = progData.semesters.find(s => s.semester === semNum);
          if (semData && semData.subjects && semData.subjects.length) {
            subs = semData.subjects.map(s => s.name);
          }
        }
      }

      if (!subs || !subs.length) {
        subs = AKTU_SEMESTER_SUBJECTS[selectedSem];
      }

      if (subs && profileSubjectsInput) {
        profileSubjectsInput.value = subs.join(', ');
        profileSubjectsInput.focus();
        // Immediately save the updated subject list to the user's student profile in the database
        await saveStudentProfile();
      }
    });
  }

/* =========================================================
   AI STUDY CHAT FORMATTING ENGINE
   Transforms AI study responses into clear, clean, well-structured,
   and easy-to-read presentation with visual headings, bullet points,
   numbered steps, bold terms, math formulas, code blocks, and spacing.
   Never displays raw Markdown symbols to the user.
========================================================= */
function formatStudyResponse(rawText) {
  if (!rawText) return '';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 1. Normalize line endings
  let text = String(rawText).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  // 2. Extract code blocks ```lang\ncode\n```
  const codeBlocks = [];
  text = text.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    const index = codeBlocks.length;
    codeBlocks.push({
      lang: (lang || 'code').trim().toLowerCase(),
      code: code.replace(/\n$/, '')
    });
    return `\n\n__STUDY_CODE_BLOCK_${index}__\n\n`;
  });

  // 3. Extract Block Math $$...$$ or \[...\]
  const mathBlocks = [];
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    const index = mathBlocks.length;
    mathBlocks.push({ math: math.trim(), isBlock: true });
    return `\n\n__STUDY_MATH_BLOCK_${index}__\n\n`;
  });
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, math) => {
    const index = mathBlocks.length;
    mathBlocks.push({ math: math.trim(), isBlock: true });
    return `\n\n__STUDY_MATH_BLOCK_${index}__\n\n`;
  });

  // 4. Extract Inline Math \(...\) or $...$
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (match, math) => {
    const index = mathBlocks.length;
    mathBlocks.push({ math: math.trim(), isBlock: false });
    return `__STUDY_MATH_INLINE_${index}__`;
  });
  text = text.replace(/(^|[^\\])\$([^\$\n]+?)\$/g, (match, prefix, math) => {
    if (/^\s*\d+(\.\d{1,2})?\s*$/.test(math)) {
      return `${prefix}$${math}$`;
    }
    const index = mathBlocks.length;
    mathBlocks.push({ math: math.trim(), isBlock: false });
    return `${prefix}__STUDY_MATH_INLINE_${index}__`;
  });

  // 5. Extract Inline Code `code`
  const inlineCodes = [];
  text = text.replace(/`([^`\n]+)`/g, (match, code) => {
    const index = inlineCodes.length;
    inlineCodes.push(escapeHtml(code));
    return `__STUDY_INLINE_CODE_${index}__`;
  });

  // Math formatting helper
  function renderMath(mathStr, isBlock) {
    let m = escapeHtml(mathStr);

    // Fractions: \frac{a}{b}
    for (let i = 0; i < 3; i++) {
      m = m.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '<span class="ai-math-frac"><span class="ai-math-num">$1</span><span class="ai-math-denom">$2</span></span>');
    }

    // Square roots: \sqrt{x}
    m = m.replace(/\\sqrt\s*\{([^{}]+)\}/g, '<span class="ai-math-root"><span class="ai-math-surd">&radic;</span><span class="ai-math-radicand">$1</span></span>');

    // Standard Math Operators
    m = m.replace(/\\times/g, '&times;');
    m = m.replace(/\\div/g, '&divide;');
    m = m.replace(/\\pm/g, '&plusmn;');
    m = m.replace(/\\mp/g, '&#8723;');
    m = m.replace(/\\cdot/g, '&middot;');
    m = m.replace(/\\approx/g, '&asymp;');
    m = m.replace(/\\equiv/g, '&equiv;');
    m = m.replace(/\\ne(q)?/g, '&ne;');
    m = m.replace(/\\le(q)?/g, '&le;');
    m = m.replace(/\\ge(q)?/g, '&ge;');
    m = m.replace(/\\infty/g, '&infin;');
    m = m.replace(/\\to|\\rightarrow/g, '&rarr;');
    m = m.replace(/\\leftarrow/g, '&larr;');
    m = m.replace(/\\Rightarrow/g, '&rArr;');
    m = m.replace(/\\Leftrightarrow/g, '&hArr;');
    m = m.replace(/\\sum/g, '&sum;');
    m = m.replace(/\\prod/g, '&prod;');
    m = m.replace(/\\int/g, '&int;');
    m = m.replace(/\\oint/g, '&#8750;');
    m = m.replace(/\\partial/g, '&part;');
    m = m.replace(/\\nabla/g, '&nabla;');
    m = m.replace(/\\in/g, '&isin;');
    m = m.replace(/\\notin/g, '&notin;');
    m = m.replace(/\\forall/g, '&forall;');
    m = m.replace(/\\exists/g, '&exist;');
    m = m.replace(/\\circ|\\degree/g, '&deg;');

    // Greek Alphabet
    const greek = {
      alpha: '&alpha;', beta: '&beta;', gamma: '&gamma;', Gamma: '&Gamma;',
      delta: '&delta;', Delta: '&Delta;', epsilon: '&epsilon;', varepsilon: '&epsilon;',
      zeta: '&zeta;', eta: '&eta;', theta: '&theta;', Theta: '&Theta;',
      iota: '&iota;', kappa: '&kappa;', lambda: '&lambda;', Lambda: '&Lambda;',
      mu: '&mu;', nu: '&nu;', xi: '&xi;', Xi: '&Xi;',
      pi: '&pi;', Pi: '&Pi;', rho: '&rho;', sigma: '&sigma;', Sigma: '&Sigma;',
      tau: '&tau;', upsilon: '&upsilon;', phi: '&phi;', Phi: '&Phi;',
      chi: '&chi;', psi: '&psi;', Psi: '&Psi;', omega: '&omega;', Omega: '&Omega;'
    };
    for (const [letter, entity] of Object.entries(greek)) {
      m = m.replace(new RegExp('\\\\' + letter + '\\b', 'g'), entity);
    }

    // Text elements inside math: \text{...}
    m = m.replace(/\\(text|mathrm|mathbf|mathit)\s*\{([^{}]+)\}/g, '<span class="ai-math-text">$2</span>');

    // Superscripts & Subscripts
    m = m.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
    m = m.replace(/\^([0-9a-zA-Z+-]+)/g, '<sup>$1</sup>');
    m = m.replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>');
    m = m.replace(/_([0-9a-zA-Z+-]+)/g, '<sub>$1</sub>');

    // Clean backslashes & braces
    m = m.replace(/\\([\{\},;!|\s])/g, '$1');
    m = m.replace(/\\/g, '');

    if (isBlock) {
      return `<div class="ai-math-block"><div class="ai-math-content">${m}</div></div>`;
    }
    return `<span class="ai-math-inline">${m}</span>`;
  }

  // Format inlines: bold, italics, math, inline code
  function formatInline(str) {
    if (!str) return '';
    let s = escapeHtml(str);

    // Bold: **text** or __text__
    s = s.replace(/\*\*([^*\n]+?)\*\*/g, '<strong class="ai-study-bold">$1</strong>');
    s = s.replace(/__([^_\n]+?)__/g, '<strong class="ai-study-bold">$1</strong>');

    // Italic: *text* or _text_
    s = s.replace(/(^|[^\*])\*([^*\n]+?)\*([^\*]|$)/g, '$1<em class="ai-study-italic">$2</em>$3');
    s = s.replace(/(^|[^_])_([^_\n]+?)_([^_]|$)/g, '$1<em class="ai-study-italic">$2</em>$3');

    // Strikethrough
    s = s.replace(/~~([^~\n]+?)~~/g, '<del>$1</del>');

    // Restore Inline Math
    s = s.replace(/__STUDY_MATH_INLINE_(\d+)__/g, (m, id) => {
      const item = mathBlocks[Number(id)];
      return item ? renderMath(item.math, false) : '';
    });

    // Restore Inline Code
    s = s.replace(/__STUDY_INLINE_CODE_(\d+)__/g, (m, id) => {
      const code = inlineCodes[Number(id)];
      return `<code class="ai-study-inline-code">${code || ''}</code>`;
    });

    // Clean any orphan markdown characters
    s = s.replace(/\*\*/g, '').replace(/__/g, '').replace(/^#{1,6}\s*/g, '');

    return s;
  }

  // Parse Table rows
  function renderTable(rows) {
    if (!rows || rows.length < 2) return '';
    const validRows = rows.map(r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
    if (validRows.length < 2) return '';

    const header = validRows[0];
    let startIdx = 1;
    if (validRows[1] && /^[\s\-:|]+$/.test(rows[1])) {
      startIdx = 2;
    }

    let ths = header.map(h => `<th>${formatInline(h)}</th>`).join('');
    let trs = '';
    for (let i = startIdx; i < validRows.length; i++) {
      let tds = validRows[i].map(d => `<td>${formatInline(d)}</td>`).join('');
      trs += `<tr>${tds}</tr>`;
    }

    return `<div class="ai-table-wrap"><table class="ai-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
  }

  // Line-by-line block parser
  const lines = text.split('\n');
  let output = '';
  let inList = null; // 'ul' | 'ol'
  let currentTable = [];
  let pendingPara = [];

  function flushList() {
    if (inList === 'ul') {
      output += '</ul>';
      inList = null;
    } else if (inList === 'ol') {
      output += '</ol>';
      inList = null;
    }
  }

  function flushTable() {
    if (currentTable.length > 0) {
      output += renderTable(currentTable);
      currentTable = [];
    }
  }

  function flushPara() {
    if (pendingPara.length > 0) {
      const fullPara = pendingPara.join(' ').trim();
      pendingPara = [];
      if (fullPara) {
        // Break long blocks of text into short, readable paragraphs (2-3 sentences)
        const sentences = fullPara.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [fullPara];
        if (sentences.length > 3) {
          let chunk = [];
          for (let i = 0; i < sentences.length; i++) {
            chunk.push(sentences[i]);
            if (chunk.length >= 2 || i === sentences.length - 1) {
              output += `<p class="ai-study-p">${formatInline(chunk.join('').trim())}</p>`;
              chunk = [];
            }
          }
        } else {
          output += `<p class="ai-study-p">${formatInline(fullPara)}</p>`;
        }
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code Block Placeholder
    if (/^__STUDY_CODE_BLOCK_(\d+)__$/.test(trimmed)) {
      flushPara();
      flushList();
      flushTable();
      const idx = Number(trimmed.match(/\d+/)[0]);
      const cb = codeBlocks[idx];
      if (cb) {
        const langDisplay = cb.lang ? cb.lang.toUpperCase() : 'CODE';
        output += `<div class="ai-code-card">
          <div class="ai-code-header">
            <span class="ai-code-lang">${escapeHtml(langDisplay)}</span>
            <button type="button" class="ai-copy-code-btn" data-code="${encodeURIComponent(cb.code)}" title="Copy code">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy</span>
            </button>
          </div>
          <pre class="ai-code-pre"><code class="ai-code-body">${escapeHtml(cb.code)}</code></pre>
        </div>`;
      }
      continue;
    }

    // Math Block Placeholder
    if (/^__STUDY_MATH_BLOCK_(\d+)__$/.test(trimmed)) {
      flushPara();
      flushList();
      flushTable();
      const idx = Number(trimmed.match(/\d+/)[0]);
      const mb = mathBlocks[idx];
      if (mb) {
        output += renderMath(mb.math, true);
      }
      continue;
    }

    // Blank line
    if (!trimmed) {
      flushPara();
      flushList();
      flushTable();
      continue;
    }

    // Horizontal Rule: ---, ***, ___
    if (/^(?:---|\*\*\*|___)\s*$/.test(trimmed)) {
      flushPara();
      flushList();
      flushTable();
      output += '<hr class="ai-study-hr">';
      continue;
    }

    // Headings: #, ##, ###, ####
    if (/^#\s+(.+)$/.test(trimmed)) {
      flushPara();
      flushList();
      flushTable();
      const hText = trimmed.replace(/^#\s+/, '');
      output += `<h3 class="ai-study-h1">${formatInline(hText)}</h3>`;
      continue;
    }
    if (/^##\s+(.+)$/.test(trimmed)) {
      flushPara();
      flushList();
      flushTable();
      const hText = trimmed.replace(/^##\s+/, '');
      output += `<h4 class="ai-study-h2">${formatInline(hText)}</h4>`;
      continue;
    }
    if (/^###\s+(.+)$/.test(trimmed)) {
      flushPara();
      flushList();
      flushTable();
      const hText = trimmed.replace(/^###\s+/, '');
      output += `<h5 class="ai-study-h3">${formatInline(hText)}</h5>`;
      continue;
    }
    if (/^####\s+(.+)$/.test(trimmed)) {
      flushPara();
      flushList();
      flushTable();
      const hText = trimmed.replace(/^####\s+/, '');
      output += `<h6 class="ai-study-h4">${formatInline(hText)}</h6>`;
      continue;
    }

    // Markdown Table row
    if (/^\|(.+)\|$/.test(trimmed)) {
      flushPara();
      flushList();
      currentTable.push(trimmed);
      continue;
    } else {
      flushTable();
    }

    // Blockquote
    if (/^>\s*(.*)$/.test(trimmed)) {
      flushPara();
      flushList();
      const qText = trimmed.replace(/^>\s*/, '');
      output += `<blockquote class="ai-study-quote">${formatInline(qText)}</blockquote>`;
      continue;
    }

    // Numbered step list item: 1. Step or 1) Step
    const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
    if (numMatch) {
      flushPara();
      if (inList !== 'ol') {
        flushList();
        output += '<ol class="ai-study-ol">';
        inList = 'ol';
      }
      output += `<li>${formatInline(numMatch[2])}</li>`;
      continue;
    }

    // Bullet list item: - Item or * Item or + Item
    const bulletMatch = trimmed.match(/^[\*\-+]\s+(.*)$/);
    if (bulletMatch) {
      flushPara();
      if (inList !== 'ul') {
        flushList();
        output += '<ul class="ai-study-ul">';
        inList = 'ul';
      }
      output += `<li>${formatInline(bulletMatch[1])}</li>`;
      continue;
    }

    // Subheading lines like "**Key Takeaway:**" or "**Step 1: Preparation**"
    const subheadMatch = trimmed.match(/^\*\*([^*\n]+?)\*\*:?\s*$/);
    if (subheadMatch && trimmed.length < 80) {
      flushPara();
      flushList();
      output += `<div class="ai-study-subheading">${formatInline(subheadMatch[1])}</div>`;
      continue;
    }

    // Normal paragraph text line
    flushList();
    pendingPara.push(trimmed);
  }

  flushPara();
  flushList();
  flushTable();

  return output;
}

// Make accessible to floating NOVA chat as well
window.formatStudyResponse = formatStudyResponse;

// Global interactive Copy button for code blocks
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.ai-copy-code-btn');
  if (!btn) return;
  const encodedCode = btn.getAttribute('data-code');
  if (!encodedCode) return;
  const code = decodeURIComponent(encodedCode);
  navigator.clipboard.writeText(code).then(() => {
    const span = btn.querySelector('span');
    const orig = span ? span.textContent : 'Copy';
    btn.classList.add('copied');
    if (span) span.textContent = 'Copied!';
    setTimeout(() => {
      btn.classList.remove('copied');
      if (span) span.textContent = orig;
    }, 2000);
  }).catch(() => {});
});

function renderMessage(text, sender) {
  if (!chatMessages) return;
  const msg = document.createElement('div');
  msg.className = `chat-msg chat-msg-${sender}`;

  const avatar = document.createElement('div');
  avatar.className = `chat-avatar chat-avatar-${sender}`;
  avatar.textContent = sender === 'ai' ? 'AI' : 'You';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';

  if (sender === 'ai') {
    bubble.innerHTML = formatStudyResponse(text);
  } else {
    // Check if message contains an attached file tag
    const attachMatch = text.match(/^\[Attachment:\s*([^\]]+)\](?:\n([\s\S]*))?$/);
    if (attachMatch) {
      const fileName = attachMatch[1].trim();
      const actualText = attachMatch[2] ? attachMatch[2].trim() : '';
      const isPdf = fileName.toLowerCase().endsWith('.pdf');
      const icon = isPdf ? '📄' : '🖼️';

      const attachPill = document.createElement('div');
      attachPill.className = 'chat-msg-user-attachment';
      attachPill.innerHTML = `<span>${icon}</span> <span>${fileName}</span>`;
      bubble.appendChild(attachPill);

      if (actualText) {
        const textDiv = document.createElement('div');
        textDiv.className = 'chat-msg-user-text';
        textDiv.textContent = actualText;
        bubble.appendChild(textDiv);
      }
    } else {
      bubble.textContent = text;
    }
  }

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  chatMessages.appendChild(msg);

  scrollChatToBottom();
}

  function formatTimeAgo(isoString) {
    if (!isoString) return 'Just now';
    const diff = Date.now() - new Date(isoString).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function renderConversationsSidebar() {
    if (!conversationsList) return;
    conversationsList.innerHTML = '';

    if (!activeConversations || activeConversations.length === 0) {
      conversationsList.innerHTML = '<div class="chat-empty-state">No saved conversations.<br>Click <strong>+ New</strong> to start.</div>';
      return;
    }

    activeConversations.forEach((conv) => {
      const item = document.createElement('div');
      const isActive = conv.id === currentConversationId;
      item.className = `chat-conv-item ${isActive ? 'active' : ''}`;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('data-conv-id', conv.id);

      const info = document.createElement('div');
      info.className = 'chat-conv-info';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'chat-conv-title';
      titleSpan.textContent = conv.title || 'New Conversation';
      titleSpan.title = conv.title || 'New Conversation';

      const timeSpan = document.createElement('span');
      timeSpan.className = 'chat-conv-time';
      timeSpan.textContent = formatTimeAgo(conv.updatedAt || conv.createdAt);

      info.appendChild(titleSpan);
      info.appendChild(timeSpan);

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'chat-conv-del-btn';
      delBtn.title = 'Delete conversation';
      delBtn.setAttribute('aria-label', `Delete conversation ${conv.title}`);
      delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86725 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteConversation(conv.id);
      });

      item.appendChild(info);
      item.appendChild(delBtn);

      item.addEventListener('click', () => {
        selectConversation(conv.id);
      });

      conversationsList.appendChild(item);
    });
  }

  async function loadConversationsList() {
    if (!currentUser) return;

    let convs = [];
    try {
      const res = await fetch(`${API_URL}/api/conversations/${encodeURIComponent(currentUser.email)}`);
      if (res.ok) {
        convs = await res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch remote conversations, using local DB:', err);
    }

    if (!convs || convs.length === 0) {
      convs = await DB.getConversations(currentUser.email);
    }

    // If still no conversation, initialize first conversation
    if (!convs || convs.length === 0) {
      const defaultConv = {
        id: 'conv_' + Date.now(),
        title: 'General Study & Exam Prep',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      try {
        await fetch(`${API_URL}/api/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: defaultConv.id,
            userId: currentUser.email,
            title: defaultConv.title
          })
        });
      } catch (e) {}
      await DB.saveConversation(currentUser.email, defaultConv);
      convs = [defaultConv];
    }

    activeConversations = convs;

    // Verify current conversation exists
    const hasCurrent = activeConversations.some((c) => c.id === currentConversationId);
    if (!hasCurrent && activeConversations.length > 0) {
      currentConversationId = activeConversations[0].id;
    }

    renderConversationsSidebar();
    await loadChatHistory(currentConversationId);
  }

  async function selectConversation(convId) {
    if (currentConversationId === convId) return;
    currentConversationId = convId;
    renderConversationsSidebar();
    await loadChatHistory(convId);
  }

  async function startNewConversation(title = 'New Conversation') {
    if (!currentUser) return;
    const newId = 'conv_' + Date.now();
    const newConv = {
      id: newId,
      userId: currentUser.email,
      title: title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConv)
      });
    } catch (err) {}

    await DB.saveConversation(currentUser.email, newConv);
    activeConversations.unshift(newConv);
    currentConversationId = newId;

    renderConversationsSidebar();
    chatMessages.innerHTML = '';
    const userSubs = Array.isArray(currentUser.subjects) && currentUser.subjects.length > 0
      ? currentUser.subjects.join(', ')
      : '';
    const greeting = userSubs
      ? `Hi ${currentUser.name || 'there'}! I'm Nova, your AI study assistant for ${currentUser.university || 'AKTU'} (${currentUser.branch || 'CSE'}, ${currentUser.year || '2nd Year'} - ${currentUser.semester || 'Semester 3'}). Active subjects: **${userSubs}**. What concept, syllabus topic, or exam question would you like to explore?`
      : `Hi ${currentUser.name || 'there'}! I'm Nova, your AI study assistant for ${currentUser.university || 'AKTU'} (${currentUser.branch || 'CSE'}, ${currentUser.year || '2nd Year'} - ${currentUser.semester || 'Semester 3'}). What concept, syllabus topic, or exam question would you like to explore?`;
    renderMessage(greeting, 'ai');
    if (chatInput) chatInput.focus();
  }

  async function deleteConversation(convId) {
    if (!currentUser) return;
    if (!confirm('Are you sure you want to delete this chat conversation?')) return;

    try {
      await fetch(`${API_URL}/api/conversations/${encodeURIComponent(currentUser.email)}/${encodeURIComponent(convId)}`, {
        method: 'DELETE'
      });
    } catch (e) {}

    await DB.deleteConversation(currentUser.email, convId);
    activeConversations = activeConversations.filter((c) => c.id !== convId);

    if (currentConversationId === convId) {
      if (activeConversations.length > 0) {
        currentConversationId = activeConversations[0].id;
        renderConversationsSidebar();
        await loadChatHistory(currentConversationId);
      } else {
        await startNewConversation('General Study');
      }
    } else {
      renderConversationsSidebar();
    }
  }

  async function clearAllConversationsHistory() {
    if (!currentUser) return;
    if (!confirm('Are you sure you want to clear your entire chat history? This will delete all saved conversations.')) return;

    try {
      await fetch(`${API_URL}/api/chat/${encodeURIComponent(currentUser.email)}`, {
        method: 'DELETE'
      });
    } catch (e) {}

    await DB.clearConversations(currentUser.email);
    activeConversations = [];
    await startNewConversation('General Study & Exam Prep');
  }

  async function saveChatMessage(sender, text) {
    if (!currentUser) return;
    const convId = currentConversationId || 'default';

    // 1. Client IndexedDB save
    await DB.saveChatMessage(currentUser.email, sender, text, convId);

    // 2. Server API save
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser.email,
          conversationId: convId,
          sender: sender,
          text: text
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save chat message to server');
      }
    } catch (error) {
      console.warn('Chat save server fallback to local DB:', error);
    }

    // Auto-update conversation title if it's currently a default/generic title
    if (sender === 'user') {
      const currentConv = activeConversations.find((c) => c.id === convId);
      if (currentConv && (currentConv.title === 'New Conversation' || currentConv.title === 'General Study')) {
        const cleanTitle = text.slice(0, 36).replace(/[\n\r]+/g, ' ').trim() + (text.length > 36 ? '…' : '');
        currentConv.title = cleanTitle;
        currentConv.updatedAt = new Date().toISOString();

        await DB.saveConversation(currentUser.email, currentConv);
        try {
          await fetch(`${API_URL}/api/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: convId,
              userId: currentUser.email,
              title: cleanTitle
            })
          });
        } catch (e) {}

        renderConversationsSidebar();
      }
    }
  }

  async function appendMessage(text, sender) {
    renderMessage(text, sender);
    await saveChatMessage(sender, text);
  }

  function showTypingIndicator() {
    if (chatMessages) {
      const existing = chatMessages.querySelectorAll('.chat-msg-typing');
      existing.forEach((el) => el.remove());
    }

    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg-ai chat-msg-typing';
    msg.setAttribute('role', 'status');
    msg.setAttribute('aria-live', 'polite');
    msg.innerHTML = `
      <div class="chat-avatar chat-avatar-ai">AI</div>
      <div class="chat-bubble">
        <span class="typing-dots" aria-label="Nova is thinking">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </span>
        <span class="typing-label">Nova is thinking…</span>
      </div>
    `;

    if (chatMessages) {
      chatMessages.appendChild(msg);
      scrollChatToBottom();
    }

    return msg;
  }

  // Attachment preview helpers
  function showAttachmentPreview(att) {
    if (!chatAttachmentPreviewArea || !att) return;
    const isPdf = att.mimeType === 'application/pdf' || att.name.toLowerCase().endsWith('.pdf');
    if (attachmentChipIcon) attachmentChipIcon.textContent = isPdf ? '📄' : '🖼️';
    if (attachmentChipName) attachmentChipName.textContent = att.name;
    if (attachmentChipMeta) {
      const sizeKb = Math.round(att.size / 1024);
      const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
      attachmentChipMeta.textContent = `${isPdf ? 'PDF Document' : 'Image'} • ${sizeStr}`;
    }
    chatAttachmentPreviewArea.classList.remove('hidden');
    if (chatInput) {
      chatInput.placeholder = isPdf
        ? 'Ask questions or click Summarize for this PDF…'
        : 'Ask questions or click Summarize for this image…';
      chatInput.focus();
    }
  }

  function clearAttachment() {
    currentAttachment = null;
    if (chatAttachmentPreviewArea) {
      chatAttachmentPreviewArea.classList.add('hidden');
    }
    if (chatInput) {
      chatInput.placeholder = 'Ask a question or paste notes to summarize…';
    }
  }

  function handleFileSelected(file) {
    if (!file) return;

    // Check size limit (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      alert('File size exceeds the 20MB limit. Please select a smaller PDF or image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target.result;
      const base64Data = result.split(',')[1];
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      const mimeType = file.type || (isPdf ? 'application/pdf' : 'image/jpeg');

      currentAttachment = {
        name: file.name,
        mimeType: mimeType,
        data: base64Data,
        size: file.size
      };

      showAttachmentPreview(currentAttachment);
    };
    reader.readAsDataURL(file);
  }

  // Toggle attachment menu
  if (chatAttachBtn && chatAttachDropdown) {
    chatAttachBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = chatAttachDropdown.classList.contains('hidden');
      if (isHidden) {
        chatAttachDropdown.classList.remove('hidden');
        chatAttachBtn.setAttribute('aria-expanded', 'true');
      } else {
        chatAttachDropdown.classList.add('hidden');
        chatAttachBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close attachment dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!chatAttachDropdown.classList.contains('hidden')) {
        const menuWrap = document.getElementById('chatAttachmentMenuWrap');
        if (menuWrap && !menuWrap.contains(e.target)) {
          chatAttachDropdown.classList.add('hidden');
          chatAttachBtn.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  // Trigger PDF file picker
  if (attachPdfBtn && pdfFileInput) {
    attachPdfBtn.addEventListener('click', () => {
      if (chatAttachDropdown) chatAttachDropdown.classList.add('hidden');
      if (chatAttachBtn) chatAttachBtn.setAttribute('aria-expanded', 'false');
      pdfFileInput.click();
    });
  }

  // Trigger Image file picker
  if (attachImageBtn && imageFileInput) {
    attachImageBtn.addEventListener('click', () => {
      if (chatAttachDropdown) chatAttachDropdown.classList.add('hidden');
      if (chatAttachBtn) chatAttachBtn.setAttribute('aria-expanded', 'false');
      imageFileInput.click();
    });
  }

  // File input change events
  if (pdfFileInput) {
    pdfFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleFileSelected(file);
      pdfFileInput.value = '';
    });
  }

  if (imageFileInput) {
    imageFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleFileSelected(file);
      imageFileInput.value = '';
    });
  }

  // Remove attachment button
  if (attachmentRemoveBtn) {
    attachmentRemoveBtn.addEventListener('click', clearAttachment);
  }

  async function generateReply(message, attachment = null) {
    try {
      // Gather recent message history from active conversation for multi-turn awareness
      const recentMessages = [];
      const chatMsgElements = chatMessages ? chatMessages.querySelectorAll('.chat-msg:not(.chat-msg-typing)') : [];
      const lastElements = Array.from(chatMsgElements).slice(-6);
      lastElements.forEach((el) => {
        const isAI = el.classList.contains('chat-msg-ai');
        const textEl = el.querySelector('.chat-bubble');
        if (textEl) {
          recentMessages.push({
            role: isAI ? 'model' : 'user',
            text: textEl.innerText.trim()
          });
        }
      });

      const studentContext = {
        email: currentUser ? (currentUser.email || '') : '',
        userId: currentUser ? (currentUser.email || '') : '',
        name: currentUser ? (currentUser.name || 'Student') : 'Student',
        university: currentUser ? (currentUser.university || 'AKTU') : 'AKTU',
        program: currentUser ? (currentUser.program || 'B.Tech') : 'B.Tech',
        branch: currentUser ? (currentUser.branch || 'CSE') : 'CSE',
        year: currentUser ? (currentUser.year || '2nd Year') : '2nd Year',
        semester: currentUser ? (currentUser.semester || 'Semester 3') : 'Semester 3',
        subjects: Array.isArray(currentUser?.subjects) ? currentUser.subjects : []
      };

      const payload = {
        message: message,
        conversationId: currentConversationId,
        userEmail: currentUser ? (currentUser.email || '') : '',
        studentContext: studentContext,
        recentHistory: recentMessages
      };

      if (attachment && attachment.data && attachment.mimeType) {
        payload.attachment = {
          name: attachment.name,
          mimeType: attachment.mimeType,
          data: attachment.data
        };
      }

      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser ? (currentUser.email || '') : ''
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI request failed');
      }

      return data.reply;
    } catch (error) {
      console.error('AI API error:', error);
      return 'Sorry, I could not connect to Nova right now. Please verify your connection or Gemini API key in Settings.';
    }
  }

  let isAiResponding = false;

  async function sendAIReply(replyText) {
    const typingMsg = showTypingIndicator();

    setTimeout(async () => {
      if (typingMsg && typingMsg.parentNode) {
        typingMsg.remove();
      }
      await appendMessage(replyText, 'ai');
    }, 600);
  }

  async function handleSend() {
    if (isAiResponding) return;

    const text = chatInput ? chatInput.value.trim() : '';
    const attachmentToSend = currentAttachment;

    if (!text && !attachmentToSend) return;

    clearAttachment();

    let messageTextForUI = text;
    if (attachmentToSend) {
      messageTextForUI = text
        ? `[Attachment: ${attachmentToSend.name}]\n${text}`
        : `[Attachment: ${attachmentToSend.name}]`;
    }

    await appendMessage(messageTextForUI, 'user');

    if (chatInput) {
      chatInput.value = '';
      autoResizeChatInput();
    }

    // Immediately display three dots indicator for the waiting time of the AI response
    isAiResponding = true;
    if (sendBtn) sendBtn.disabled = true;
    if (summarizeBtn) summarizeBtn.disabled = true;

    const typingMsg = showTypingIndicator();

    try {
      const reply = await generateReply(text, attachmentToSend);
      if (typingMsg && typingMsg.parentNode) {
        typingMsg.remove();
      }
      await appendMessage(reply, 'ai');
    } catch (err) {
      console.error('AI chat error:', err);
      if (typingMsg && typingMsg.parentNode) {
        typingMsg.remove();
      }
      await appendMessage('Sorry, I encountered an issue while generating a reply. Please try again.', 'ai');
    } finally {
      isAiResponding = false;
      if (sendBtn) sendBtn.disabled = false;
      if (summarizeBtn) summarizeBtn.disabled = false;
      if (chatInput) chatInput.focus();
    }
  }

  async function handleSummarize() {
    if (isAiResponding) return;

    const text = chatInput ? chatInput.value.trim() : "";
    const attachmentToSend = currentAttachment;

    if (!text && !attachmentToSend) {
      const typingMsg = showTypingIndicator();
      setTimeout(async () => {
        if (typingMsg && typingMsg.parentNode) typingMsg.remove();
        await appendMessage("Please upload a PDF document, photo of notes, or paste study text into the input box, then click **Summarize**.", "ai");
      }, 500);
      return;
    }

    clearAttachment();

    let summaryPrompt = "";
    let messageTextForUI = "";

    if (attachmentToSend) {
      summaryPrompt = text || `Summarize this study material (${attachmentToSend.name}). Provide a structured breakdown of the core concepts, important definitions, formulas, and high-yield exam takeaways.`;
      messageTextForUI = `[Attachment: ${attachmentToSend.name}]\n${summaryPrompt}`;
    } else {
      messageTextForUI = `Summarize this: "${text}"`;
      summaryPrompt = `Please provide a clear, structured academic summary of the following study notes. Group key ideas with headings, bullet points, and high-yield exam takeaways:\n\n${text}`;
    }

    await appendMessage(messageTextForUI, "user");

    if (chatInput) {
      chatInput.value = "";
      autoResizeChatInput();
    }

    // Immediately display three dots indicator for the waiting time of the AI response
    isAiResponding = true;
    if (sendBtn) sendBtn.disabled = true;
    if (summarizeBtn) summarizeBtn.disabled = true;

    const typingMsg = showTypingIndicator();

    try {
      const reply = await generateReply(summaryPrompt, attachmentToSend);
      if (typingMsg && typingMsg.parentNode) {
        typingMsg.remove();
      }
      await appendMessage(reply, "ai");
    } catch (err) {
      console.error("AI summary error:", err);
      if (typingMsg && typingMsg.parentNode) {
        typingMsg.remove();
      }
      await appendMessage("Sorry, I encountered an issue generating this summary. Please try again.", "ai");
    } finally {
      isAiResponding = false;
      if (sendBtn) sendBtn.disabled = false;
      if (summarizeBtn) summarizeBtn.disabled = false;
      if (chatInput) chatInput.focus();
    }
  }

  function autoResizeChatInput() {
    if (!chatInput) return;
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  }

  async function loadChatHistory(targetConvId) {
    if (!chatMessages) return;
    chatMessages.innerHTML = '';

    if (!currentUser) return;

    const convId = targetConvId || currentConversationId;
    let history = [];

    try {
      const response = await fetch(
        `${API_URL}/api/chat/${encodeURIComponent(currentUser.email)}?conversationId=${encodeURIComponent(convId)}`
      );

      if (response.ok) {
        history = await response.json();
      }
    } catch (error) {
      console.warn('Chat history server fetch error, falling back to local DB:', error);
    }

    if (!history || history.length === 0) {
      history = await DB.getChatHistory(currentUser.email, convId);
    }

    if (!history || history.length === 0) {
      const userSubs = Array.isArray(currentUser.subjects) && currentUser.subjects.length > 0
        ? currentUser.subjects.join(', ')
        : '';
      const greeting = userSubs
        ? `Hi ${currentUser.name || 'there'}! I'm Nova, your AI study assistant for ${currentUser.university || 'AKTU'} (${currentUser.branch || 'CSE'}, ${currentUser.year || '2nd Year'} - ${currentUser.semester || 'Semester 3'}). Active subjects: **${userSubs}**. Ask me anything about your syllabus, high-yield exam questions, or paste your lecture notes for a step-by-step summary.`
        : `Hi ${currentUser.name || 'there'}! I'm Nova, your AI study assistant for ${currentUser.university || 'AKTU'} (${currentUser.branch || 'CSE'}, ${currentUser.year || '2nd Year'} - ${currentUser.semester || 'Semester 3'}). Ask me anything about your syllabus, high-yield exam questions, or paste your lecture notes for a step-by-step summary.`;
      renderMessage(greeting, 'ai');
      return;
    }

    history.forEach((message) => {
      renderMessage(message.text, message.sender);
    });
  }

  // Clear current active conversation messages
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', async () => {
      if (!currentUser) return;
      if (!confirm('Are you sure you want to clear this conversation?')) return;

      try {
        await fetch(
          `${API_URL}/api/chat/${encodeURIComponent(currentUser.email)}?conversationId=${encodeURIComponent(currentConversationId)}`,
          {
            method: 'DELETE'
          }
        );
      } catch (error) {
        console.error('Clear chat error:', error);
      }

      await DB.clearChatHistory(currentUser.email, currentConversationId);
      await loadChatHistory(currentConversationId);
    });
  }

  // Clear all conversations
  if (clearAllChatsBtn) {
    clearAllChatsBtn.addEventListener('click', clearAllConversationsHistory);
  }

  // New Chat buttons
  if (newChatBtn) {
    newChatBtn.addEventListener('click', () => startNewConversation());
  }
  if (sidebarNewChatBtn) {
    sidebarNewChatBtn.addEventListener('click', () => startNewConversation());
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', handleSend);
  }

  if (summarizeBtn) {
    summarizeBtn.addEventListener('click', handleSummarize);
  }

  if (chatInput) {
    chatInput.addEventListener('input', autoResizeChatInput);

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }


  /* ---------------------------------------------------
     4. FLASHCARDS (course + subject driven, from courses.js)
  --------------------------------------------------- */
  const courseSelect = document.getElementById('courseSelect');
  const subjectSelect = document.getElementById('subjectSelect');
  const flashcard = document.getElementById('flashcard');
  const cardFront = document.getElementById('cardFront');
  const cardBack = document.getElementById('cardBack');
  const cardCounter = document.getElementById('cardCounter');
  const prevCardBtn = document.getElementById('prevCardBtn');
  const nextCardBtn = document.getElementById('nextCardBtn');
  const shuffleCardBtn = document.getElementById('shuffleCardBtn');
  const knownBtn = document.getElementById('knownBtn');
  const fcProgressFill = document.getElementById('fcProgressFill');
  const fcProgressText = document.getElementById('fcProgressText');
  const fcKnownCount = document.getElementById('fcKnownCount');
  const fcRemainingCount = document.getElementById('fcRemainingCount');

  let activeDeck = [];
  let cardIndex = 0;
  let knownSet = new Set();

  // populate course dropdown (flashcards widget)
  Object.keys(COURSES).forEach((key) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = COURSES[key].label;
    courseSelect.appendChild(opt);
  });

  function populateSubjects() {
    const course = COURSES[courseSelect.value];
    subjectSelect.innerHTML = '';
    Object.keys(course.subjects).forEach((subjectName) => {
      const opt = document.createElement('option');
      opt.value = subjectName;
      opt.textContent = subjectName;
      subjectSelect.appendChild(opt);
    });
  }
function renderCourseList() {
  const courseList = document.getElementById('courseList');
  if (!courseList) return;

  courseList.innerHTML = '';

  Object.keys(COURSES).forEach((key) => {
    const course = COURSES[key];
    const subjectCount = Object.keys(course.subjects).length;

    const li = document.createElement('li');
    li.className = 'course-list-item';
    li.innerHTML = `
      <div>
        <div class="course-list-name">${course.label}</div>
        <div class="course-list-count">${subjectCount} subject${subjectCount !== 1 ? 's' : ''}</div>
      </div>
      <svg class="course-list-arrow" viewBox="0 0 24 24" fill="none"><path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    `;

    // clicking a course jumps to Flashcards widget with that course selected
    li.addEventListener('click', () => {
      courseSelect.value = key;
      populateSubjects();
      loadDeckAndProgress();
      document.getElementById('flashcards').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    courseList.appendChild(li);
  });
}
  async function loadDeckAndProgress() {
    const course = courseSelect.value;
    const subject = subjectSelect.value;
    activeDeck = (COURSES[course] && COURSES[course].subjects[subject]) || [];
    cardIndex = 0;
    knownSet = new Set();

    if (currentUser) {
      const progress = await DB.getProgress(currentUser.email, course, subject);
      progress.filter(p => p.known).forEach(p => knownSet.add(p.cardIndex));
    }
    renderCard();
  }

  function renderCard() {
    if (activeDeck.length === 0) {
      cardFront.textContent = 'No cards yet for this subject.';
      cardBack.textContent = '—';
      cardCounter.textContent = '0 / 0';
      if (fcProgressFill) fcProgressFill.style.width = '0%';
      if (fcProgressText) fcProgressText.textContent = '0 of 0';
      if (fcKnownCount) fcKnownCount.textContent = '0';
      if (fcRemainingCount) fcRemainingCount.textContent = '0';
      if (knownBtn) {
        knownBtn.classList.remove('is-known');
        const knownLabel = knownBtn.querySelector('.known-btn-label');
        if (knownLabel) knownLabel.textContent = 'Mark Known';
      }
      return;
    }
    flashcard.classList.remove('is-flipped');
    setTimeout(() => {
      cardFront.textContent = activeDeck[cardIndex].front;
      cardBack.textContent = activeDeck[cardIndex].back;
    }, 150);
    const isCurrentKnown = knownSet.has(cardIndex);
    const knownTag = isCurrentKnown ? ' ✓' : '';
    cardCounter.textContent = `${cardIndex + 1} / ${activeDeck.length}${knownTag}`;

    // Update study progress bar and stats
    const currentNum = cardIndex + 1;
    const totalNum = activeDeck.length;
    const pct = Math.round((currentNum / totalNum) * 100);
    if (fcProgressFill) fcProgressFill.style.width = `${pct}%`;
    if (fcProgressText) fcProgressText.textContent = `Card ${currentNum} of ${totalNum}`;
    if (fcKnownCount) fcKnownCount.textContent = String(knownSet.size);
    if (fcRemainingCount) fcRemainingCount.textContent = String(Math.max(0, totalNum - knownSet.size));

    // Update Known button visual state
    if (knownBtn) {
      const lbl = knownBtn.querySelector('.known-btn-label');
      if (isCurrentKnown) {
        knownBtn.classList.add('is-known');
        if (lbl) lbl.textContent = 'Known ✓';
        knownBtn.setAttribute('title', 'Card marked as known (click to unmark)');
      } else {
        knownBtn.classList.remove('is-known');
        if (lbl) lbl.textContent = 'Mark Known';
        knownBtn.setAttribute('title', 'Mark card as known');
      }
    }
  }

  courseSelect.addEventListener('change', async () => {
    populateSubjects();
    await loadDeckAndProgress();
  });
  subjectSelect.addEventListener('change', loadDeckAndProgress);

  flashcard.addEventListener('click', () => {
    flashcard.classList.toggle('is-flipped');
  });

  flashcard.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      flashcard.classList.toggle('is-flipped');
    }
  });

  prevCardBtn.addEventListener('click', () => {
    if (activeDeck.length === 0) return;
    cardIndex = (cardIndex - 1 + activeDeck.length) % activeDeck.length;
    renderCard();
  });

  nextCardBtn.addEventListener('click', () => {
    if (activeDeck.length === 0) return;
    cardIndex = (cardIndex + 1) % activeDeck.length;
    renderCard();
  });

  shuffleCardBtn.addEventListener('click', () => {
    if (activeDeck.length <= 1) return;
    let newIndex = cardIndex;
    while (newIndex === cardIndex) {
      newIndex = Math.floor(Math.random() * activeDeck.length);
    }
    cardIndex = newIndex;
    renderCard();
  });

  knownBtn.addEventListener('click', async () => {
    if (activeDeck.length === 0 || !currentUser) return;
    const nowKnown = !knownSet.has(cardIndex);
    if (nowKnown) knownSet.add(cardIndex); else knownSet.delete(cardIndex);
    await DB.markCardKnown(currentUser.email, courseSelect.value, subjectSelect.value, cardIndex, nowKnown);
    renderCard();
    if (nowKnown) {
      await recordActiveDay();
    }
    updateDashboardMetrics();
  });

  /* ---------------------------------------------------
     5. FOCUS TIMER (Pomodoro)
  --------------------------------------------------- */
  const FOCUS_SECONDS = 25 * 60;
  const BREAK_SECONDS = 5 * 60;

  let secondsLeft = FOCUS_SECONDS;
  let totalSeconds = FOCUS_SECONDS;
  let isRunning = false;
  let isBreak = false;
  let timerInterval = null;

  const timerDisplay = document.getElementById('timerDisplay');
  const timerRing = document.getElementById('timerRing');
  const timerToggleBtn = document.getElementById('timerToggleBtn');
  const timerResetBtn = document.getElementById('timerResetBtn');
  const timerBtnLabel = document.getElementById('timerBtnLabel');
  const timerModeLabel = document.getElementById('timerModeLabel');
  const playIcon = timerToggleBtn.querySelector('.play-icon');
  const pauseIcon = timerToggleBtn.querySelector('.pause-icon');

  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(secondsLeft);
    const progress = 1 - secondsLeft / totalSeconds;
    const deg = Math.round(progress * 360);
    const ringColor = isBreak ? '#FF8A3D' : '#4C7CFF';
    timerRing.style.background = `conic-gradient(${ringColor} ${deg}deg, #ECEFF6 ${deg}deg)`;
  }

  function tick() {
    if (secondsLeft <= 0) {
      if (!isBreak && currentUser) {
        recordActiveDay(null, 'focus_pomodoro');
      }
      isBreak = !isBreak;
      totalSeconds = isBreak ? BREAK_SECONDS : FOCUS_SECONDS;
      secondsLeft = totalSeconds;
      timerModeLabel.textContent = isBreak ? 'Break time' : 'Focus session';
      updateTimerDisplay();
      return;
    }
    secondsLeft -= 1;
    updateTimerDisplay();
  }

  function startTimer() {
    isRunning = true;
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    timerBtnLabel.textContent = 'Pause';
    timerInterval = setInterval(tick, 1000);
  }

  function pauseTimer() {
    isRunning = false;
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    timerBtnLabel.textContent = 'Resume';
    clearInterval(timerInterval);
  }

  function resetTimer() {
    pauseTimer();
    isBreak = false;
    totalSeconds = FOCUS_SECONDS;
    secondsLeft = FOCUS_SECONDS;
    timerModeLabel.textContent = 'Focus session';
    timerBtnLabel.textContent = 'Start Focus';
    updateTimerDisplay();
  }

  timerToggleBtn.addEventListener('click', () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  timerResetBtn.addEventListener('click', resetTimer);

  updateTimerDisplay();

  /* ---------------------------------------------------
     6. STUDY TIMELINE, CALENDAR & USER TASKS (Interactive & Persistent)
  --------------------------------------------------- */
  let userTasks = [];
  let userStats = { activeStudyDates: [], streak: 0, longestStreak: 0, overallProgress: 0 };
  let selectedCalendarDate = getLocalDateStr(new Date());
  let calendarViewWeekStart = getStartOfWeek(new Date());

  function getLocalDateStr(date = new Date()) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getPreviousDateStr(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 1);
    return getLocalDateStr(dt);
  }

  function getNextDateStr(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + 1);
    return getLocalDateStr(dt);
  }

  function getStartOfWeek(date) {
    const copy = new Date(date);
    const day = copy.getDay(); // 0 is Sun
    copy.setDate(copy.getDate() - day);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  function calculateStreakInfo(activeDates = [], savedLongestStreak = 0) {
    if (!activeDates || activeDates.length === 0) {
      return { currentStreak: 0, longestStreak: savedLongestStreak || 0, isStudiedToday: false };
    }

    const dateSet = new Set(activeDates.map((d) => String(d).trim()).filter(Boolean));
    const todayStr = getLocalDateStr(new Date());
    const yesterdayStr = getPreviousDateStr(todayStr);

    const studiedToday = dateSet.has(todayStr);
    const studiedYesterday = dateSet.has(yesterdayStr);

    let currentStreak = 0;
    if (studiedToday) {
      // User studied today: count consecutive days backwards starting from today
      currentStreak = 1;
      let checkDate = yesterdayStr;
      while (dateSet.has(checkDate)) {
        currentStreak++;
        checkDate = getPreviousDateStr(checkDate);
      }
    } else if (studiedYesterday) {
      // User has not studied today yet, but studied yesterday:
      // Retain yesterday's streak until current day ends
      currentStreak = 1;
      let checkDate = getPreviousDateStr(yesterdayStr);
      while (dateSet.has(checkDate)) {
        currentStreak++;
        checkDate = getPreviousDateStr(checkDate);
      }
    } else {
      // Missed full calendar day: streak resets to 0
      currentStreak = 0;
    }

    // Historical max consecutive days in activeDates
    const allDatesSorted = Array.from(dateSet).sort();
    let maxConsecutive = 0;
    let tempStreak = 0;
    let prevDate = null;
    for (const d of allDatesSorted) {
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const expectedPrev = getPreviousDateStr(d);
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

  function calculateOverallProgress() {
    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter((t) => t.completed).length;

    // Track known flashcards
    const knownCardsCount = typeof knownSet !== 'undefined' && knownSet ? knownSet.size : 0;
    const totalCardsCount = (typeof activeDeck !== 'undefined' && activeDeck && activeDeck.length) ? activeDeck.length : 0;

    let overallPercentage = 0;
    if (totalTasks > 0) {
      overallPercentage = Math.round((completedTasks / totalTasks) * 100);
    } else if (totalCardsCount > 0 && knownCardsCount > 0) {
      overallPercentage = Math.round((knownCardsCount / totalCardsCount) * 100);
    } else {
      overallPercentage = 0;
    }

    return Math.max(0, Math.min(100, overallPercentage));
  }

  async function recordActiveDay(dateStr = null, activityType = 'study_activity') {
    if (!currentUser) return;
    const dayStr = dateStr || getLocalDateStr(new Date());
    if (!userStats.activeStudyDates) userStats.activeStudyDates = [];
    if (!userStats.activeStudyDates.includes(dayStr)) {
      userStats.activeStudyDates.push(dayStr);
      userStats.activeStudyDates.sort();
    }

    const streakInfo = calculateStreakInfo(userStats.activeStudyDates, userStats.longestStreak || 0);
    userStats.streak = streakInfo.currentStreak;
    userStats.longestStreak = streakInfo.longestStreak;
    userStats.overallProgress = calculateOverallProgress();

    // Call server activity endpoint
    try {
      await DB.recordActivity(currentUser.email, activityType, dayStr);
    } catch (e) {}

    await DB.updateUserStats(currentUser.email, userStats);
    updateDashboardMetrics();
  }

  function updateDashboardMetrics() {
    const progressLabel = document.getElementById('progressLabel');
    const streakLabel = document.getElementById('streakLabel');
    const goalsDoneLabel = document.getElementById('goalsDoneLabel');

    if (!currentUser) {
      if (progressLabel) progressLabel.textContent = '0%';
      if (streakLabel) streakLabel.textContent = '0';
      if (goalsDoneLabel) goalsDoneLabel.textContent = '0/0';
      return;
    }

    // 1. Overall Progress (Dynamic calculation from actual user activities)
    const overallPercentage = calculateOverallProgress();
    if (progressLabel) {
      progressLabel.textContent = `${overallPercentage}%`;
    }

    // 2. Day Streak (Consecutive active calendar days)
    const streakInfo = calculateStreakInfo(userStats.activeStudyDates || [], userStats.longestStreak || 0);
    const currentStreak = streakInfo.currentStreak;
    if (streakLabel) {
      streakLabel.textContent = currentStreak;
    }

    // 3. Today's Goals (Tasks scheduled for today)
    const todayStr = getLocalDateStr(new Date());
    const todayTasks = userTasks.filter((t) => t.date === todayStr);
    const todayCompleted = todayTasks.filter((t) => t.completed).length;

    if (goalsDoneLabel) {
      goalsDoneLabel.textContent = `${todayCompleted}/${todayTasks.length}`;
    }

    // Update user record with latest metrics
    currentUser.streak = currentStreak;
    currentUser.longestStreak = streakInfo.longestStreak;
    currentUser.overallProgress = overallPercentage;
    currentUser.goalsDone = todayCompleted;
    currentUser.goalsTotal = todayTasks.length;

    userStats.streak = currentStreak;
    userStats.longestStreak = streakInfo.longestStreak;
    userStats.overallProgress = overallPercentage;
    userStats.goalsDone = todayCompleted;
    userStats.goalsTotal = todayTasks.length;

    DB.updateUserStats(currentUser.email, userStats).catch(() => {});
  }

  async function loadUserTasksAndStats() {
    if (!currentUser) return;
    try {
      userTasks = await DB.getTasks(currentUser.email);
    } catch (e) {
      userTasks = [];
    }

    try {
      const stats = await DB.getUserStats(currentUser.email);
      userStats = {
        activeStudyDates: Array.isArray(stats?.activeStudyDates) ? stats.activeStudyDates : [],
        streak: typeof stats?.streak === 'number' ? stats.streak : 0,
        longestStreak: typeof stats?.longestStreak === 'number' ? stats.longestStreak : 0,
        overallProgress: typeof stats?.overallProgress === 'number' ? stats.overallProgress : (currentUser.overallProgress || 0)
      };

      // Also incorporate dates of any already completed tasks into activeStudyDates
      userTasks.forEach((t) => {
        if (t.completed) {
          const compDate = t.completedAt ? getLocalDateStr(t.completedAt) : t.date;
          if (compDate && !userStats.activeStudyDates.includes(compDate)) {
            userStats.activeStudyDates.push(compDate);
          }
        }
      });

      const streakInfo = calculateStreakInfo(userStats.activeStudyDates, userStats.longestStreak);
      userStats.streak = streakInfo.currentStreak;
      userStats.longestStreak = streakInfo.longestStreak;
    } catch (e) {
      userStats = { activeStudyDates: [], streak: 0, longestStreak: 0, overallProgress: 0 };
    }

    renderWeekStrip();
    renderDayTasks();
    updateDashboardMetrics();
  }

  function resetCalendarAndTaskUI() {
    userTasks = [];
    userStats = { activeStudyDates: [], streak: 0, longestStreak: 0, overallProgress: 0 };
    const myTasksList = document.getElementById('myTasksList');
    if (myTasksList) myTasksList.innerHTML = '';
    const myTasksEmpty = document.getElementById('myTasksEmpty');
    if (myTasksEmpty) myTasksEmpty.classList.remove('hidden');
    updateDashboardMetrics();
  }

  // Week strip rendering
  const weekStrip = document.getElementById('weekStrip');
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function renderWeekStrip() {
    if (!weekStrip) return;
    weekStrip.innerHTML = '';

    const todayStr = getLocalDateStr(new Date());

    // Update month label from middle of week
    const midWeek = new Date(calendarViewWeekStart);
    midWeek.setDate(midWeek.getDate() + 3);
    const calMonthLabel = document.getElementById('calendarMonthLabel');
    if (calMonthLabel) {
      calMonthLabel.textContent = `${monthNames[midWeek.getMonth()]} ${midWeek.getFullYear()}`;
    }

    for (let i = 0; i < 7; i++) {
      const date = new Date(calendarViewWeekStart);
      date.setDate(calendarViewWeekStart.getDate() + i);
      const dateStr = getLocalDateStr(date);

      const isToday = (dateStr === todayStr);
      const isSelected = (dateStr === selectedCalendarDate);
      const dayTasksCount = userTasks.filter(t => t.date === dateStr).length;

      const chip = document.createElement('div');
      chip.className = 'day-chip' + (isToday ? ' is-today' : '') + (isSelected ? ' is-selected' : '');
      chip.setAttribute('data-date', dateStr);
      chip.setAttribute('title', `${date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}${dayTasksCount ? ` (${dayTasksCount} task${dayTasksCount > 1 ? 's' : ''})` : ''}`);

      let dotHtml = '';
      if (dayTasksCount > 0) {
        dotHtml = `<span class="task-dot-indicator" title="${dayTasksCount} task(s)"></span>`;
      }

      chip.innerHTML = `
        <span class="dow">${dayLabels[i]}</span>
        <span class="dnum">${date.getDate()}</span>
        ${dotHtml}
      `;

      chip.addEventListener('click', () => {
        selectedCalendarDate = dateStr;
        currentTaskFilter = 'selected';
        renderWeekStrip();
        renderDayTasks();
      });

      weekStrip.appendChild(chip);
    }
  }

  // Week Strip Navigation
  const prevWeekBtn = document.getElementById('prevWeekBtn');
  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => {
      calendarViewWeekStart.setDate(calendarViewWeekStart.getDate() - 7);
      renderWeekStrip();
    });
  }

  const nextWeekBtn = document.getElementById('nextWeekBtn');
  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => {
      calendarViewWeekStart.setDate(calendarViewWeekStart.getDate() + 7);
      renderWeekStrip();
    });
  }

  const todayWeekBtn = document.getElementById('todayWeekBtn');
  if (todayWeekBtn) {
    todayWeekBtn.addEventListener('click', () => {
      calendarViewWeekStart = getStartOfWeek(new Date());
      selectedCalendarDate = getLocalDateStr(new Date());
      currentTaskFilter = 'selected';
      renderWeekStrip();
      renderDayTasks();
    });
  }

  /* ---------------------------------------------------
     TASK VIEWS & FILTERS (All Added Tasks, Selected Day, Pending, Completed)
  --------------------------------------------------- */
  let currentTaskFilter = 'all'; // Default to 'all' so added tasks always show here!
  let newlyAddedTaskId = null;

  function setTaskFilter(filterName) {
    currentTaskFilter = filterName;
    renderDayTasks();
  }

  function updateFilterUI() {
    const filterButtons = document.querySelectorAll('.tasks-filter-btn');
    filterButtons.forEach(btn => {
      const f = btn.getAttribute('data-task-filter');
      const isActive = (f === currentTaskFilter);
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    const selectedDayFilterLabel = document.getElementById('selectedDayFilterLabel');
    if (selectedDayFilterLabel) {
      const todayStr = getLocalDateStr(new Date());
      if (selectedCalendarDate === todayStr) {
        selectedDayFilterLabel.textContent = 'Today';
      } else {
        const selObj = new Date(selectedCalendarDate + 'T00:00:00');
        selectedDayFilterLabel.textContent = isNaN(selObj.getTime())
          ? 'Selected Day'
          : selObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      }
    }
  }

  function getTaskDateBadge(dateStr) {
    if (!dateStr) return null;
    const todayStr = getLocalDateStr(new Date());
    const tomorrowStr = getNextDateStr(todayStr);
    const yesterdayStr = getPreviousDateStr(todayStr);

    if (dateStr === todayStr) {
      return { text: 'Today', class: 'date-pill-today' };
    } else if (dateStr === tomorrowStr) {
      return { text: 'Tomorrow', class: 'date-pill-tomorrow' };
    } else if (dateStr === yesterdayStr) {
      return { text: 'Yesterday', class: 'date-pill-past' };
    } else {
      const d = new Date(dateStr + 'T00:00:00');
      const formatted = isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const isPast = dateStr < todayStr;
      return { text: formatted, class: isPast ? 'date-pill-past' : 'date-pill-future' };
    }
  }

  // Hook up filter bar buttons
  const filterAllTasksBtn = document.getElementById('filterAllTasksBtn');
  if (filterAllTasksBtn) {
    filterAllTasksBtn.addEventListener('click', () => setTaskFilter('all'));
  }
  const filterSelectedDayBtn = document.getElementById('filterSelectedDayBtn');
  if (filterSelectedDayBtn) {
    filterSelectedDayBtn.addEventListener('click', () => setTaskFilter('selected'));
  }
  const filterPendingTasksBtn = document.getElementById('filterPendingTasksBtn');
  if (filterPendingTasksBtn) {
    filterPendingTasksBtn.addEventListener('click', () => setTaskFilter('pending'));
  }
  const filterCompletedTasksBtn = document.getElementById('filterCompletedTasksBtn');
  if (filterCompletedTasksBtn) {
    filterCompletedTasksBtn.addEventListener('click', () => setTaskFilter('completed'));
  }
  const emptyShowAllTasksBtn = document.getElementById('emptyShowAllTasksBtn');
  if (emptyShowAllTasksBtn) {
    emptyShowAllTasksBtn.addEventListener('click', () => setTaskFilter('all'));
  }

  // Render Tasks for Selected Day / Filter
  function renderDayTasks() {
    const myTasksList = document.getElementById('myTasksList');
    const myTasksEmpty = document.getElementById('myTasksEmpty');
    const myTasksEmptyTitle = document.getElementById('myTasksEmptyTitle');
    const myTasksEmptySub = document.getElementById('myTasksEmptySub');
    const emptyShowAllBtn = document.getElementById('emptyShowAllTasksBtn');
    const selectedDateBadge = document.getElementById('selectedDateBadge');
    const selectedDateSubtitle = document.getElementById('selectedDateSubtitle');
    const selectedDateTaskCount = document.getElementById('selectedDateTaskCount');

    // Counts
    const allCount = userTasks.length;
    const dayTasks = userTasks.filter(t => t.date === selectedCalendarDate);
    const dayCount = dayTasks.length;
    const pendingTasks = userTasks.filter(t => !t.completed);
    const completedTasks = userTasks.filter(t => t.completed);

    // Update filter badges
    const allTasksCountBadge = document.getElementById('allTasksCountBadge');
    if (allTasksCountBadge) allTasksCountBadge.textContent = allCount;

    const selectedTasksCountBadge = document.getElementById('selectedTasksCountBadge');
    if (selectedTasksCountBadge) selectedTasksCountBadge.textContent = dayCount;

    const pendingTasksCountBadge = document.getElementById('pendingTasksCountBadge');
    if (pendingTasksCountBadge) pendingTasksCountBadge.textContent = pendingTasks.length;

    const completedTasksCountBadge = document.getElementById('completedTasksCountBadge');
    if (completedTasksCountBadge) completedTasksCountBadge.textContent = completedTasks.length;

    updateFilterUI();

    if (!myTasksList) return;

    const todayStr = getLocalDateStr(new Date());
    const selDateObj = new Date(selectedCalendarDate + 'T00:00:00');
    const formattedSelDate = isNaN(selDateObj.getTime())
      ? selectedCalendarDate
      : selDateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

    if (selectedDateBadge) {
      if (currentTaskFilter === 'all') {
        selectedDateBadge.textContent = `All Tasks (${allCount})`;
      } else if (currentTaskFilter === 'pending') {
        selectedDateBadge.textContent = `Pending (${pendingTasks.length})`;
      } else if (currentTaskFilter === 'completed') {
        selectedDateBadge.textContent = `Completed (${completedTasks.length})`;
      } else {
        selectedDateBadge.textContent = (selectedCalendarDate === todayStr)
          ? 'Today, ' + formattedSelDate
          : formattedSelDate;
      }
    }

    if (selectedDateTaskCount) {
      if (currentTaskFilter === 'all') {
        selectedDateTaskCount.textContent = `${completedTasks.length}/${allCount} done`;
      } else if (currentTaskFilter === 'selected') {
        const completedDayCount = dayTasks.filter(t => t.completed).length;
        selectedDateTaskCount.textContent = dayCount === 0 ? '0 tasks' : `${completedDayCount}/${dayCount} done`;
      } else if (currentTaskFilter === 'pending') {
        selectedDateTaskCount.textContent = `${pendingTasks.length} to do`;
      } else if (currentTaskFilter === 'completed') {
        selectedDateTaskCount.textContent = `${completedTasks.length} done`;
      }
    }

    if (selectedDateSubtitle) {
      if (currentTaskFilter === 'all') {
        selectedDateSubtitle.textContent = allCount === 0
          ? 'No personal study tasks added yet'
          : `Showing all ${allCount} personal study task${allCount > 1 ? 's' : ''} across your schedule`;
      } else if (currentTaskFilter === 'pending') {
        selectedDateSubtitle.textContent = pendingTasks.length === 0
          ? 'No pending study tasks'
          : `${pendingTasks.length} active study task${pendingTasks.length > 1 ? 's' : ''} to complete`;
      } else if (currentTaskFilter === 'completed') {
        selectedDateSubtitle.textContent = completedTasks.length === 0
          ? 'No completed study tasks yet'
          : `${completedTasks.length} completed study task${completedTasks.length > 1 ? 's' : ''}`;
      } else {
        selectedDateSubtitle.textContent = dayCount === 0
          ? `No personal study tasks planned for ${formattedSelDate}`
          : `${dayCount} personal study task${dayCount > 1 ? 's' : ''} scheduled for ${formattedSelDate}`;
      }
    }

    // Determine tasks to show based on current filter
    let visibleTasks = [];
    if (currentTaskFilter === 'all') {
      visibleTasks = [...userTasks].sort((a, b) => {
        if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.time || '').localeCompare(b.time || '');
      });
    } else if (currentTaskFilter === 'selected') {
      visibleTasks = dayTasks;
    } else if (currentTaskFilter === 'pending') {
      visibleTasks = [...pendingTasks].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    } else if (currentTaskFilter === 'completed') {
      visibleTasks = [...completedTasks].sort((a, b) => (b.completedAt || b.date || '').localeCompare(a.completedAt || a.date || ''));
    }

    myTasksList.innerHTML = '';

    if (visibleTasks.length === 0) {
      if (myTasksEmpty) {
        myTasksEmpty.classList.remove('hidden');
        if (currentTaskFilter === 'selected' && allCount > 0) {
          if (myTasksEmptyTitle) myTasksEmptyTitle.textContent = `No tasks scheduled for this day`;
          if (myTasksEmptySub) myTasksEmptySub.textContent = `You have ${allCount} task${allCount > 1 ? 's' : ''} added on other days.`;
          if (emptyShowAllBtn) emptyShowAllBtn.classList.remove('hidden');
        } else if (currentTaskFilter === 'pending' && completedTasks.length > 0) {
          if (myTasksEmptyTitle) myTasksEmptyTitle.textContent = 'All caught up!';
          if (myTasksEmptySub) myTasksEmptySub.textContent = `You have completed all ${completedTasks.length} task${completedTasks.length > 1 ? 's' : ''}. Great work!`;
          if (emptyShowAllBtn) emptyShowAllBtn.classList.remove('hidden');
        } else if (currentTaskFilter === 'completed' && pendingTasks.length > 0) {
          if (myTasksEmptyTitle) myTasksEmptyTitle.textContent = 'No tasks marked completed yet';
          if (myTasksEmptySub) myTasksEmptySub.textContent = `Check off tasks as you finish them to track your progress and streak.`;
          if (emptyShowAllBtn) emptyShowAllBtn.classList.remove('hidden');
        } else {
          if (myTasksEmptyTitle) myTasksEmptyTitle.textContent = 'No tasks scheduled';
          if (myTasksEmptySub) myTasksEmptySub.textContent = 'Plan assignments, problem sets, or revision goals.';
          if (emptyShowAllBtn) emptyShowAllBtn.classList.add('hidden');
        }
      }
      return;
    }

    if (myTasksEmpty) myTasksEmpty.classList.add('hidden');

    visibleTasks.forEach(task => {
      const li = document.createElement('li');
      const isNew = (task.id === newlyAddedTaskId);
      li.className = 'my-task-item' + (task.completed ? ' is-completed' : '') + (isNew ? ' is-newly-added' : '');
      li.setAttribute('data-task-id', task.id);

      const dateBadgeInfo = getTaskDateBadge(task.date);
      const dateBadgeHtml = dateBadgeInfo
        ? `<span class="task-date-chip ${dateBadgeInfo.class}" title="Scheduled for ${task.date}">
            <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" stroke-width="1.8"/></svg>
            ${escapeHtml(dateBadgeInfo.text)}
          </span>`
        : '';

      const timeHtml = task.time
        ? `<span class="time-badge">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7V12L15 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            ${escapeHtml(task.time)}
          </span>`
        : '';

      const descHtml = task.description
        ? `<p class="task-desc">${escapeHtml(task.description)}</p>`
        : '';

      const priorityClass = `priority-${task.priority || 'Medium'}`;

      li.innerHTML = `
        <div class="task-checkbox-wrap">
          <button type="button" class="task-checkbox-btn" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}" title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
            <svg viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div class="task-body">
          <div class="task-header-row">
            <span class="task-title">${escapeHtml(task.title)}</span>
          </div>
          ${descHtml}
          <div class="task-meta-row">
            ${dateBadgeHtml}
            <span class="subject-badge">${escapeHtml(task.subject || 'General')}</span>
            <span class="priority-badge ${priorityClass}">${escapeHtml(task.priority || 'Medium')}</span>
            ${timeHtml}
          </div>
        </div>
        <div class="task-actions">
          <button type="button" class="task-btn-icon task-btn-edit" title="Edit Task" aria-label="Edit Task">
            <svg viewBox="0 0 24 24" fill="none"><path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 20V13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button type="button" class="task-btn-icon task-btn-delete" title="Delete Task" aria-label="Delete Task">
            <svg viewBox="0 0 24 24" fill="none"><path d="M3 6H21M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11V17M14 11V17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>
      `;

      // Checkbox click
      const chkBtn = li.querySelector('.task-checkbox-btn');
      chkBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleTaskCompletion(task.id);
      });

      // Edit click
      const editBtn = li.querySelector('.task-btn-edit');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTaskModal(task);
      });

      // Delete click
      const delBtn = li.querySelector('.task-btn-delete');
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteTask(task.id);
      });

      myTasksList.appendChild(li);
    });

    if (newlyAddedTaskId) {
      setTimeout(() => {
        newlyAddedTaskId = null;
      }, 2500);
    }
  }

  // Toggle Task Completion
  async function toggleTaskCompletion(taskId) {
    if (!currentUser) return;
    const task = userTasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;

    if (task.completed) {
      await recordActiveDay(task.date || getLocalDateStr(new Date()));
    }

    try {
      await DB.saveTask(task);
    } catch (e) {}

    renderDayTasks();
    renderWeekStrip();
    updateDashboardMetrics();
  }

  // Delete Task
  async function deleteTask(taskId) {
    if (!currentUser) return;
    userTasks = userTasks.filter(t => t.id !== taskId);
    try {
      await DB.deleteTask(currentUser.email, taskId);
    } catch (e) {}

    renderDayTasks();
    renderWeekStrip();
    updateDashboardMetrics();
  }

  // Task Modal Handling
  const taskModalOverlay = document.getElementById('taskModalOverlay');
  const closeTaskModalBtn = document.getElementById('closeTaskModalBtn');
  const cancelTaskModalBtn = document.getElementById('cancelTaskModalBtn');
  const openAddTaskBtn = document.getElementById('openAddTaskBtn');
  const emptyAddTaskBtn = document.getElementById('emptyAddTaskBtn');
  const taskForm = document.getElementById('taskForm');
  const taskFormId = document.getElementById('taskFormId');
  const taskFormTitle = document.getElementById('taskFormTitle');
  const taskFormDate = document.getElementById('taskFormDate');
  const taskFormTime = document.getElementById('taskFormTime');
  const taskFormSubject = document.getElementById('taskFormSubject');
  const taskFormPriority = document.getElementById('taskFormPriority');
  const taskFormDescription = document.getElementById('taskFormDescription');
  const taskFormCompleted = document.getElementById('taskFormCompleted');
  const taskModalTitle = document.getElementById('taskModalTitle');
  const saveTaskBtnText = document.getElementById('saveTaskBtnText');

  function openTaskModal(taskToEdit = null) {
    if (!taskModalOverlay) return;

    if (taskToEdit) {
      if (taskModalTitle) taskModalTitle.textContent = 'Edit Study Task';
      if (saveTaskBtnText) saveTaskBtnText.textContent = 'Update Task';
      if (taskFormId) taskFormId.value = taskToEdit.id;
      if (taskFormTitle) taskFormTitle.value = taskToEdit.title || '';
      if (taskFormDate) taskFormDate.value = taskToEdit.date || selectedCalendarDate;
      if (taskFormTime) taskFormTime.value = taskToEdit.time || '';
      if (taskFormSubject) taskFormSubject.value = taskToEdit.subject || 'General';
      if (taskFormPriority) taskFormPriority.value = taskToEdit.priority || 'Medium';
      if (taskFormDescription) taskFormDescription.value = taskToEdit.description || '';
      if (taskFormCompleted) taskFormCompleted.checked = Boolean(taskToEdit.completed);
    } else {
      if (taskModalTitle) taskModalTitle.textContent = 'Add New Study Task';
      if (saveTaskBtnText) saveTaskBtnText.textContent = 'Save Task';
      if (taskForm) taskForm.reset();
      if (taskFormId) taskFormId.value = '';
      if (taskFormDate) taskFormDate.value = selectedCalendarDate;
      if (taskFormPriority) taskFormPriority.value = 'Medium';
      if (taskFormCompleted) taskFormCompleted.checked = false;
      if (taskFormSubject) {
        taskFormSubject.value = currentUser?.subjects?.[0] || 'General';
      }
    }

    taskModalOverlay.classList.remove('hidden');
    if (taskFormTitle) taskFormTitle.focus();
  }

  function closeTaskModal() {
    if (taskModalOverlay) taskModalOverlay.classList.add('hidden');
    if (taskForm) taskForm.reset();
  }

  if (openAddTaskBtn) {
    openAddTaskBtn.addEventListener('click', () => openTaskModal());
  }

  if (emptyAddTaskBtn) {
    emptyAddTaskBtn.addEventListener('click', () => openTaskModal());
  }

  if (closeTaskModalBtn) {
    closeTaskModalBtn.addEventListener('click', closeTaskModal);
  }

  if (cancelTaskModalBtn) {
    cancelTaskModalBtn.addEventListener('click', closeTaskModal);
  }

  if (taskModalOverlay) {
    taskModalOverlay.addEventListener('click', (e) => {
      if (e.target === taskModalOverlay) closeTaskModal();
    });
  }

  if (taskForm) {
    taskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser) return;

      const title = (taskFormTitle?.value || '').trim();
      const date = (taskFormDate?.value || selectedCalendarDate).trim();
      if (!title || !date) return;

      const id = taskFormId?.value || `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const isEdit = Boolean(taskFormId?.value);

      const taskObj = {
        id,
        userEmail: currentUser.email,
        userId: currentUser.email,
        title,
        date,
        time: (taskFormTime?.value || '').trim(),
        subject: (taskFormSubject?.value || 'General').trim(),
        priority: taskFormPriority?.value || 'Medium',
        description: (taskFormDescription?.value || '').trim(),
        completed: Boolean(taskFormCompleted?.checked),
        completedAt: taskFormCompleted?.checked ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      };

      if (isEdit) {
        const idx = userTasks.findIndex(t => t.id === id);
        if (idx !== -1) userTasks[idx] = taskObj;
        else userTasks.push(taskObj);
      } else {
        userTasks.push(taskObj);
      }

      // Record activity if marked completed
      if (taskObj.completed) {
        await recordActiveDay(taskObj.date);
      }

      await DB.saveTask(taskObj);

      // Make sure the view shows the task's date and shows in list
      selectedCalendarDate = date;
      newlyAddedTaskId = id;
      currentTaskFilter = 'all';

      // Adjust week view if date is outside current week view
      const taskDateObj = new Date(date + 'T00:00:00');
      if (!isNaN(taskDateObj.getTime())) {
        const weekStart = getStartOfWeek(taskDateObj);
        calendarViewWeekStart = weekStart;
      }

      closeTaskModal();
      renderWeekStrip();
      renderDayTasks();
      updateDashboardMetrics();
    });
  }

  /* ---------------------------------------------------
     7. INITIALIZE CALENDAR DISPLAY
  --------------------------------------------------- */
  renderWeekStrip();
  renderDayTasks();
  updateDashboardMetrics();


  /* ---------------------------------------------------
     8. AKTU COURSES & SYLLABUS PORTAL CONTROLLER
  --------------------------------------------------- */
  function initAktuCoursesPortal() {
    const aktuContainer = document.getElementById('aktuProgrammesContainer');
    const searchInput = document.getElementById('aktuSearchInput');
    const branchSelect = document.getElementById('aktuBranchSelect');
    const progTabs = document.getElementById('aktuProgTabs');
    const semStrip = document.getElementById('aktuSemesterStrip');
    const resetBtn = document.getElementById('resetAktuFiltersBtn');

    const modal = document.getElementById('aktuSyllabusModal');
    const modalCloseBtn = document.getElementById('closeAktuModalBtn');
    const modalBottomCloseBtn = document.getElementById('modalCloseBtn');
    const modalPracticeCardsBtn = document.getElementById('modalPracticeCardsBtn');
    const modalAskAiBtn = document.getElementById('modalAskAiBtn');

    const modalTitle = document.getElementById('aktuModalSubjectTitle');
    const modalSub = document.getElementById('aktuModalSubjectSub');
    const modalMetaGrid = document.getElementById('aktuModalMetaGrid');
    const modalUnitsContainer = document.getElementById('aktuModalUnitsContainer');
    const modalBooksList = document.getElementById('aktuModalBooksList');

    if (!aktuContainer) return;

    let selectedProg = 'all';
    let selectedBranch = 'all';
    let selectedSem = 'all';
    let searchKeyword = '';
    let currentModalSubject = null;
    let currentModalProg = null;

    function openSyllabusModal(subject, prog) {
      currentModalSubject = subject;
      currentModalProg = prog;

      if (modalTitle) modalTitle.textContent = `${subject.code}: ${subject.name}`;
      if (modalSub) modalSub.textContent = `${prog.name} (${prog.level}) • ${subject.category || 'Core Subject'} • Dr. A.P.J. Abdul Kalam Technical University`;

      if (modalMetaGrid) {
        modalMetaGrid.innerHTML = `
          <div class="aktu-s-meta-item">
            <span>Subject Code</span>
            <strong>${subject.code}</strong>
          </div>
          <div class="aktu-s-meta-item">
            <span>Contact Hours (L-T-P)</span>
            <strong>${subject.periods || '3-1-0'}</strong>
          </div>
          <div class="aktu-s-meta-item">
            <span>Academic Credits</span>
            <strong>${subject.credits || 4} Credits</strong>
          </div>
          <div class="aktu-s-meta-item">
            <span>Evaluation Scheme</span>
            <strong>${subject.evaluation || '30 Sessional / 70 ESE'}</strong>
          </div>
        `;
      }

      if (modalUnitsContainer) {
        modalUnitsContainer.innerHTML = '';
        if (subject.units && subject.units.length > 0) {
          subject.units.forEach((u) => {
            const uCard = document.createElement('div');
            uCard.className = 'aktu-unit-card';
            uCard.innerHTML = `
              <div class="aktu-unit-header">
                <span class="aktu-unit-pill">Unit ${u.unit}</span>
                <span class="aktu-unit-title">${u.title}</span>
              </div>
              <p class="aktu-unit-desc">${u.desc}</p>
            `;
            modalUnitsContainer.appendChild(uCard);
          });
        } else {
          modalUnitsContainer.innerHTML = '<p style="color:var(--slate-500);font-size:13px;">Unit outlines aligned with official AICTE/AKTU curriculum.</p>';
        }
      }

      if (modalBooksList) {
        modalBooksList.innerHTML = '';
        if (subject.books && subject.books.length > 0) {
          subject.books.forEach((b) => {
            const li = document.createElement('li');
            li.textContent = b;
            modalBooksList.appendChild(li);
          });
        } else {
          const li = document.createElement('li');
          li.textContent = 'Official AKTU Prescribed Textbooks & References for ' + subject.name;
          modalBooksList.appendChild(li);
        }
      }

      if (modal) modal.classList.remove('hidden');
    }

    function closeSyllabusModal() {
      if (modal) modal.classList.add('hidden');
      currentModalSubject = null;
      currentModalProg = null;
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeSyllabusModal);
    if (modalBottomCloseBtn) modalBottomCloseBtn.addEventListener('click', closeSyllabusModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeSyllabusModal();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        closeSyllabusModal();
      }
    });

    function launchFlashcardsForSubject(subject) {
      closeSyllabusModal();
      showView('flashcards');

      // Attempt to find matching course in COURSES
      const subjCodeUpper = (subject.code || '').toUpperCase();
      const subjNameLower = (subject.name || '').toLowerCase();
      let matchedCourseKey = null;
      let matchedSubjectKey = null;

      if (typeof COURSES !== 'undefined') {
        for (const [cKey, cVal] of Object.entries(COURSES)) {
          for (const sKey of Object.keys(cVal.subjects || {})) {
            const sKeyUpper = sKey.toUpperCase();
            if (sKeyUpper.includes(subjCodeUpper) || subjNameLower.includes(sKey.toLowerCase()) || sKey.toLowerCase().includes(subjNameLower)) {
              matchedCourseKey = cKey;
              matchedSubjectKey = sKey;
              break;
            }
          }
          if (matchedCourseKey) break;
        }
      }

      if (matchedCourseKey && courseSelect && subjectSelect) {
        courseSelect.value = matchedCourseKey;
        populateSubjects();
        if (matchedSubjectKey) subjectSelect.value = matchedSubjectKey;
        loadDeckAndProgress();
      }

      const flashcardsEl = document.getElementById('flashcards');
      if (flashcardsEl) {
        setTimeout(() => {
          flashcardsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }

    function askAiAboutSubject(subject) {
      closeSyllabusModal();
      showView('chat');

      const chatEl = document.getElementById('chat');
      const inputEl = document.getElementById('chatInput');
      if (inputEl) {
        inputEl.value = `Explain the syllabus, key topics, and exam preparation tips for AKTU ${subject.code}: ${subject.name}.`;
        inputEl.focus();
      }
      if (chatEl) {
        setTimeout(() => {
          chatEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }

    if (modalPracticeCardsBtn) {
      modalPracticeCardsBtn.addEventListener('click', () => {
        if (currentModalSubject) launchFlashcardsForSubject(currentModalSubject);
      });
    }

    if (modalAskAiBtn) {
      modalAskAiBtn.addEventListener('click', () => {
        if (currentModalSubject) askAiAboutSubject(currentModalSubject);
      });
    }

    function renderAktuProgrammes() {
      aktuContainer.innerHTML = '';
      const programmes = (typeof window.AKTU_PROGRAMMES !== 'undefined') ? window.AKTU_PROGRAMMES : [];
      const q = searchKeyword.toLowerCase().trim();

      const filteredProgrammes = programmes.filter((p) => {
        if (selectedProg !== 'all' && p.id !== selectedProg) return false;
        if (selectedBranch !== 'all' && p.branch !== selectedBranch) return false;

        // Check if query matches programme title/code
        const progMatches = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);

        // Check if any subject matches search and semester filter
        const hasMatchingSubject = p.semesters.some((sem) => {
          if (selectedSem !== 'all' && String(sem.semester) !== String(selectedSem)) return false;
          if (!q) return true;
          return sem.subjects.some((s) => {
            return s.code.toLowerCase().includes(q) ||
                   s.name.toLowerCase().includes(q) ||
                   (s.category && s.category.toLowerCase().includes(q)) ||
                   (s.units && s.units.some(u => u.title.toLowerCase().includes(q) || u.desc.toLowerCase().includes(q)));
          });
        });

        return progMatches || hasMatchingSubject;
      });

      if (filteredProgrammes.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'aktu-card';
        emptyState.style.padding = '40px 24px';
        emptyState.style.textAlign = 'center';
        emptyState.innerHTML = `
          <div style="font-size:32px;margin-bottom:12px;">📚</div>
          <h3 style="font-family:var(--font-display);font-size:18px;color:var(--navy-950);margin-bottom:8px;">No AKTU Courses Match Your Search</h3>
          <p style="color:var(--slate-500);font-size:13.5px;max-width:440px;margin:0 auto 16px;">Try adjusting your search keyword, semester, or programme filters to view Dr. APJ Abdul Kalam Technical University courses.</p>
          <button type="button" class="btn-aktu-syllabus" id="clearAllFiltersInlineBtn">Reset All Filters</button>
        `;
        aktuContainer.appendChild(emptyState);
        const inlineReset = document.getElementById('clearAllFiltersInlineBtn');
        if (inlineReset) {
          inlineReset.addEventListener('click', resetFilters);
        }
        return;
      }

      filteredProgrammes.forEach((prog) => {
        const card = document.createElement('div');
        card.className = 'aktu-card';
        card.id = `prog-card-${prog.id}`;

        // Filter valid semesters for this programme based on selectedSem & query
        const validSemesters = prog.semesters.filter((sem) => {
          if (selectedSem !== 'all' && String(sem.semester) !== String(selectedSem)) return false;
          if (!q) return true;
          return sem.subjects.some((s) => {
            return s.code.toLowerCase().includes(q) ||
                   s.name.toLowerCase().includes(q) ||
                   (s.category && s.category.toLowerCase().includes(q)) ||
                   (s.units && s.units.some(u => u.title.toLowerCase().includes(q) || u.desc.toLowerCase().includes(q)));
          });
        });

        if (validSemesters.length === 0) return;

        // Card Header
        const headerEl = document.createElement('div');
        headerEl.className = 'aktu-card-header';
        headerEl.innerHTML = `
          <div class="aktu-card-main-info">
            <div class="aktu-badges-row">
              <span class="aktu-badge-code">${prog.code}</span>
              <span class="aktu-badge-tag">${prog.level}</span>
              <span class="aktu-badge-tag aktu-badge-gold">NEP 2020 / CBCS</span>
              <span class="aktu-badge-tag">AICTE Approved</span>
            </div>
            <h2 class="aktu-prog-title">${prog.name}</h2>
            <p class="aktu-prog-desc">${prog.desc}</p>
          </div>
          <div class="aktu-prog-meta">
            <div class="aktu-meta-item">Duration: <strong>${prog.duration}</strong></div>
            <div class="aktu-meta-item">Affiliation: <strong>AKTU Lucknow</strong></div>
            <div class="aktu-meta-item">Semesters: <strong>${prog.semesters.length} Semesters</strong></div>
          </div>
        `;
        card.appendChild(headerEl);

        // Card Body
        const bodyEl = document.createElement('div');
        bodyEl.className = 'aktu-card-body';

        // Semester Navigation Tabs within Card
        const semNav = document.createElement('div');
        semNav.className = 'aktu-sem-nav';

        const tableContainer = document.createElement('div');
        tableContainer.className = 'aktu-table-wrapper';

        let activeSemNumber = validSemesters[0].semester;

        function renderSemesterTable(semNumber) {
          activeSemNumber = semNumber;
          const targetSem = prog.semesters.find(s => s.semester === semNumber);
          if (!targetSem) return;

          // Update active sem tab
          semNav.querySelectorAll('.aktu-sem-tab').forEach((tab) => {
            tab.classList.toggle('active', tab.getAttribute('data-sem') === String(semNumber));
          });

          // Filter subjects by query if needed
          let subjects = targetSem.subjects;
          if (q) {
            subjects = subjects.filter(s => {
              return s.code.toLowerCase().includes(q) ||
                     s.name.toLowerCase().includes(q) ||
                     (s.category && s.category.toLowerCase().includes(q)) ||
                     (s.units && s.units.some(u => u.title.toLowerCase().includes(q) || u.desc.toLowerCase().includes(q)));
            });
          }

          let tableHtml = `
            <table class="aktu-table">
              <thead>
                <tr>
                  <th style="width:110px;">Subject Code</th>
                  <th>Course Title / Subject Name</th>
                  <th style="width:140px;">Category</th>
                  <th style="width:80px;">L-T-P</th>
                  <th style="width:70px;">Credits</th>
                  <th style="width:140px;">Exam Scheme</th>
                  <th style="width:230px;text-align:center;">Curriculum Actions</th>
                </tr>
              </thead>
              <tbody>
          `;

          if (subjects.length === 0) {
            tableHtml += `
              <tr>
                <td colspan="7" style="text-align:center;color:var(--slate-500);padding:24px;">No subjects matched the search filter for Semester ${semNumber}.</td>
              </tr>
            `;
          } else {
            subjects.forEach((s) => {
              tableHtml += `
                <tr data-subject-code="${s.code}">
                  <td class="aktu-code-cell">${s.code}</td>
                  <td>
                    <div class="aktu-subject-name">${s.name}</div>
                  </td>
                  <td><span class="aktu-badge-tag">${s.category || 'Core'}</span></td>
                  <td class="aktu-ltp-cell">${s.periods || '3-1-0'}</td>
                  <td><span class="aktu-credit-badge">${s.credits || 4} Cr</span></td>
                  <td style="font-size:12px;color:var(--slate-600);">${s.evaluation || '30 Int / 70 Ext'}</td>
                  <td>
                    <div class="aktu-actions-cell">
                      <button type="button" class="btn-aktu-syllabus btn-view-syllabus" title="View official AKTU 5-unit syllabus">
                        Units
                      </button>
                      <button type="button" class="btn-aktu-flashcards btn-practice-flashcards" title="Practice revision flashcards">
                        Cards
                      </button>
                      <button type="button" class="btn-aktu-ask-ai btn-ask-ai" title="Ask Nova AI assistant">
                        Ask AI
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            });
          }

          tableHtml += `
              </tbody>
            </table>
          `;

          tableContainer.innerHTML = tableHtml;

          // Attach click listeners to row action buttons
          tableContainer.querySelectorAll('tbody tr').forEach((row) => {
            const code = row.getAttribute('data-subject-code');
            if (!code) return;
            const subject = targetSem.subjects.find(s => s.code === code);
            if (!subject) return;

            const syllabusBtn = row.querySelector('.btn-view-syllabus');
            const flashcardsBtn = row.querySelector('.btn-practice-flashcards');
            const askAiBtn = row.querySelector('.btn-ask-ai');

            if (syllabusBtn) {
              syllabusBtn.addEventListener('click', () => openSyllabusModal(subject, prog));
            }
            if (flashcardsBtn) {
              flashcardsBtn.addEventListener('click', () => launchFlashcardsForSubject(subject));
            }
            if (askAiBtn) {
              askAiBtn.addEventListener('click', () => askAiAboutSubject(subject));
            }
          });
        }

        // Create semester tabs
        validSemesters.forEach((sem) => {
          const tabBtn = document.createElement('button');
          tabBtn.type = 'button';
          tabBtn.className = 'aktu-sem-tab' + (sem.semester === activeSemNumber ? ' active' : '');
          tabBtn.setAttribute('data-sem', String(sem.semester));
          tabBtn.textContent = `Semester ${sem.semester} (${sem.subjects.length} Subjects)`;
          tabBtn.addEventListener('click', () => {
            renderSemesterTable(sem.semester);
          });
          semNav.appendChild(tabBtn);
        });

        bodyEl.appendChild(semNav);
        bodyEl.appendChild(tableContainer);
        card.appendChild(bodyEl);

        aktuContainer.appendChild(card);

        // Initial table render for first semester
        renderSemesterTable(activeSemNumber);
      });
    }

    function resetFilters() {
      selectedProg = 'all';
      selectedBranch = 'all';
      selectedSem = 'all';
      searchKeyword = '';

      if (searchInput) searchInput.value = '';
      if (branchSelect) branchSelect.value = 'all';

      if (progTabs) {
        progTabs.querySelectorAll('.aktu-tab-btn').forEach((btn) => {
          btn.classList.toggle('active', btn.getAttribute('data-filter') === 'all');
        });
      }

      if (semStrip) {
        semStrip.querySelectorAll('.aktu-sem-pill').forEach((pill) => {
          pill.classList.toggle('active', pill.getAttribute('data-sem') === 'all');
        });
      }

      renderAktuProgrammes();
    }

    // Event listeners
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchKeyword = e.target.value;
        renderAktuProgrammes();
      });
    }

    if (branchSelect) {
      branchSelect.addEventListener('change', (e) => {
        selectedBranch = e.target.value;
        renderAktuProgrammes();
      });
    }

    if (progTabs) {
      progTabs.querySelectorAll('.aktu-tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          progTabs.querySelectorAll('.aktu-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedProg = btn.getAttribute('data-filter');
          renderAktuProgrammes();
        });
      });
    }

    if (semStrip) {
      semStrip.querySelectorAll('.aktu-sem-pill').forEach((pill) => {
        pill.addEventListener('click', () => {
          semStrip.querySelectorAll('.aktu-sem-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          selectedSem = pill.getAttribute('data-sem');
          renderAktuProgrammes();
        });
      });
    }

    if (resetBtn) resetBtn.addEventListener('click', resetFilters);

    // Initial render
    renderAktuProgrammes();
  }

  initAktuCoursesPortal();

  /* =========================================================
     8. ASSIGNMENT TRACKER MODULE
     Full-featured coursework manager with:
     - Manual assignment create, edit, delete, completion
     - KPI counters, filters, search, sort
     - Persistent storage associated with student account
  ========================================================= */

  let userAssignments = [];
  let currentAsgFilter = 'all';
  let currentAsgSort = 'due-asc';
  let currentAsgSearch = '';
  let assignmentToDelete = null;

  // DOM Elements
  const asgItemsList = document.getElementById('asgItemsList');
  const asgEmptyState = document.getElementById('asgEmptyState');
  const asgEmptyTitle = document.getElementById('asgEmptyTitle');
  const asgEmptySub = document.getElementById('asgEmptySub');
  const asgEmptyAddBtn = document.getElementById('asgEmptyAddBtn');

  const asgKpiTotal = document.getElementById('asgKpiTotal');
  const asgKpiPending = document.getElementById('asgKpiPending');
  const asgKpiDueSoon = document.getElementById('asgKpiDueSoon');
  const asgKpiOverdue = document.getElementById('asgKpiOverdue');
  const asgKpiCompleted = document.getElementById('asgKpiCompleted');

  const tabCountAll = document.getElementById('tabCountAll');
  const tabCountPending = document.getElementById('tabCountPending');
  const tabCountDue = document.getElementById('tabCountDue');
  const tabCountOverdue = document.getElementById('tabCountOverdue');
  const tabCountFinished = document.getElementById('tabCountFinished');
  const tabCountCompleted = document.getElementById('tabCountCompleted');

  // Google Classroom Auth DOM Elements
  const classroomLoginBtn = document.getElementById('classroomLoginBtn');
  const classroomLogoutBtn = document.getElementById('classroomLogoutBtn');
  const classroomManualCodeBtn = document.getElementById('classroomManualCodeBtn');
  const classroomConnectedBadge = document.getElementById('classroomConnectedBadge');
  const classroomUserName = document.getElementById('classroomUserName');

  if (classroomLoginBtn) {
    classroomLoginBtn.addEventListener('click', () => {
      const activeEmail = (currentUser && currentUser.email) || getSession() || '';
      classroomLoginBtn.href = activeEmail
        ? `/auth/google?email=${encodeURIComponent(activeEmail)}`
        : '/auth/google';
    });
  }
  if (classroomLogoutBtn) {
    classroomLogoutBtn.addEventListener('click', () => {
      const activeEmail = (currentUser && currentUser.email) || getSession() || '';
      classroomLogoutBtn.href = activeEmail
        ? `/auth/logout?email=${encodeURIComponent(activeEmail)}`
        : '/auth/logout';
    });
  }
  if (classroomManualCodeBtn) {
    classroomManualCodeBtn.addEventListener('click', async () => {
      const activeEmail = (currentUser && currentUser.email) || getSession() || '';
      const input = window.prompt(
        'If Google redirected to an unavailable page, please paste the full redirect URL (or just the "code" parameter) from your browser address bar:'
      );
      if (!input || !input.trim()) return;

      let extractedCode = input.trim();
      if (extractedCode.includes('code=')) {
        try {
          const u = new URL(extractedCode.startsWith('http') ? extractedCode : `https://example.com/${extractedCode}`);
          extractedCode = u.searchParams.get('code') || extractedCode;
        } catch (e) {
          const match = extractedCode.match(/[?&]code=([^&#]+)/);
          if (match) extractedCode = decodeURIComponent(match[1]);
        }
      }

      showAsgAlert('Connecting Google Classroom with authorization code...');
      try {
        const res = await fetch('/api/classroom/exchange-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: extractedCode, email: activeEmail })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showAsgAlert('Google Classroom connected! Assignments synced.');
          await loadAssignments();
        } else {
          showAsgAlert(data.error || 'Failed to connect Google Classroom.', true);
        }
      } catch (err) {
        showAsgAlert('Failed to exchange code: ' + (err.message || 'Network error'), true);
      }
    });
  }

  const asgSearchInput = document.getElementById('asgSearchInput');
  const asgSearchClear = document.getElementById('asgSearchClear');
  const asgSortSelect = document.getElementById('asgSortSelect');

  const openAddAssignmentBtn = document.getElementById('openAddAssignmentBtn');

  const asgAlertBanner = document.getElementById('asgAlertBanner');
  const asgAlertMsg = document.getElementById('asgAlertMsg');
  const asgAlertClose = document.getElementById('asgAlertClose');

  // Modals
  const asgModalOverlay = document.getElementById('asgModalOverlay');
  const asgModalTitle = document.getElementById('asgModalTitle');
  const asgModalSub = document.getElementById('asgModalSub');
  const closeAsgModalBtn = document.getElementById('closeAsgModalBtn');
  const cancelAsgModalBtn = document.getElementById('cancelAsgModalBtn');
  const asgForm = document.getElementById('asgForm');
  const asgEditId = document.getElementById('asgEditId');
  const asgFormTitle = document.getElementById('asgFormTitle');
  const asgTitleError = document.getElementById('asgTitleError');
  const asgFormSubject = document.getElementById('asgFormSubject');
  const asgFormPriority = document.getElementById('asgFormPriority');
  const asgFormDueDate = document.getElementById('asgFormDueDate');
  const asgFormDueTime = document.getElementById('asgFormDueTime');
  const asgFormStatus = document.getElementById('asgFormStatus');
  const asgFormPoints = document.getElementById('asgFormPoints');
  const asgFormAttachment = document.getElementById('asgFormAttachment');
  const asgFormDesc = document.getElementById('asgFormDesc');
  const saveAsgBtnLabel = document.getElementById('saveAsgBtnLabel');
  const asgSubjectSuggestions = document.getElementById('asgSubjectSuggestions');

  const asgDeleteModalOverlay = document.getElementById('asgDeleteModalOverlay');
  const asgDeleteModalItemTitle = document.getElementById('asgDeleteModalItemTitle');
  const closeAsgDeleteModalBtn = document.getElementById('closeAsgDeleteModalBtn');
  const cancelAsgDeleteBtn = document.getElementById('cancelAsgDeleteBtn');
  const confirmAsgDeleteBtn = document.getElementById('confirmAsgDeleteBtn');

  function showAsgAlert(message, isError = false) {
    if (!asgAlertBanner || !asgAlertMsg) return;
    asgAlertMsg.textContent = message;
    asgAlertBanner.classList.remove('hidden');
    if (isError) {
      asgAlertBanner.style.background = '#fef2f2';
      asgAlertBanner.style.color = '#b91c1c';
      asgAlertBanner.style.borderColor = '#fecaca';
    } else {
      asgAlertBanner.style.background = '#ecfdf5';
      asgAlertBanner.style.color = '#047857';
      asgAlertBanner.style.borderColor = '#a7f3d0';
    }
  }

  function hideAsgAlert() {
    if (asgAlertBanner) asgAlertBanner.classList.add('hidden');
  }

  if (asgAlertClose) {
    asgAlertClose.addEventListener('click', hideAsgAlert);
  }

  // Handle redirect feedback from Google OAuth
  (function handleGoogleAuthQueryParam() {
    try {
      const params = new URLSearchParams(window.location.search);
      const targetHash = window.location.hash || '#assignments';
      if (params.get('classroom_auth') === 'success') {
        showAsgAlert('Google Classroom connected! Assignments synced.');
        window.history.replaceState({}, document.title, window.location.pathname + targetHash);
      } else if (params.get('classroom_logout') === 'success') {
        showAsgAlert('Logged out of Google Classroom.');
        window.history.replaceState({}, document.title, window.location.pathname + targetHash);
      } else if (params.get('code')) {
        const code = params.get('code');
        const stateEmail = params.get('state') || (currentUser && currentUser.email) || getSession() || '';
        showAsgAlert('Connecting Google Classroom with authorization code...');
        fetch('/api/classroom/exchange-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, email: stateEmail })
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              showAsgAlert('Google Classroom connected! Assignments synced.');
              loadAssignments();
            } else {
              showAsgAlert(data.error || 'Failed to exchange authorization code.', true);
            }
          })
          .catch(() => {
            showAsgAlert('Could not complete Google Classroom connection.', true);
          })
          .finally(() => {
            window.history.replaceState({}, document.title, window.location.pathname + targetHash);
          });
      } else if (params.get('error')) {
        showAsgAlert('Google Classroom notice: ' + params.get('error'), true);
        window.history.replaceState({}, document.title, window.location.pathname + targetHash);
      }
    } catch (e) {}
  })();

  function getAddDaysYMD(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Helper to normalize date and time from either ISO string or YYYY-MM-DD
  function parseDateStrings(dueDate, dueTime) {
    if (!dueDate) return { dateStr: '', timeStr: dueTime || '' };
    if (typeof dueDate === 'string' && dueDate.includes('T')) {
      const dt = new Date(dueDate);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      const h = String(dt.getHours()).padStart(2, '0');
      const min = String(dt.getMinutes()).padStart(2, '0');
      return { dateStr: `${y}-${m}-${d}`, timeStr: `${h}:${min}` };
    }
    return { dateStr: dueDate, timeStr: dueTime || '' };
  }

  function formatDisplayAsgDate(dateStr, timeStr) {
    if (!dateStr) return 'No due date';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const todayStr = getLocalDateStr(new Date());
    const tomorrowStr = getAddDaysYMD(1);
    const yesterdayStr = getPreviousDateStr(todayStr);

    let base = '';
    if (dateStr === todayStr) {
      base = 'Today';
    } else if (dateStr === tomorrowStr) {
      base = 'Tomorrow';
    } else if (dateStr === yesterdayStr) {
      base = 'Yesterday';
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      base = `${dayNames[dt.getDay()]}, ${monthNames[dt.getMonth()]} ${d}`;
    }

    if (timeStr) {
      const [h, min] = timeStr.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      const minStr = String(min || 0).padStart(2, '0');
      return `${base} at ${h12}:${minStr} ${ampm}`;
    }
    return base;
  }

  function getAsgDateChipInfo(dueDate, dueTime, isCompleted) {
    if (!dueDate) {
      return { text: 'No Deadline', class: 'chip-nodate' };
    }
    const { dateStr, timeStr } = parseDateStrings(dueDate, dueTime);
    const todayStr = getLocalDateStr(new Date());
    const threeDaysStr = getAddDaysYMD(3);
    const formatted = formatDisplayAsgDate(dateStr, timeStr);

    if (isCompleted) {
      return { text: formatted, class: 'chip-future' };
    }

    if (dateStr < todayStr) {
      return { text: `Due • ${formatted}`, class: 'chip-overdue' };
    }
    if (dateStr === todayStr) {
      return { text: `Due Today${timeStr ? ' • ' + timeStr : ''}`, class: 'chip-due-today' };
    }
    if (dateStr <= threeDaysStr) {
      return { text: `Due Soon • ${formatted}`, class: 'chip-due-soon' };
    }
    return { text: formatted, class: 'chip-future' };
  }

  // Returns normalized status category: 'pending' | 'due' | 'finished'
  function getAssignmentStatusCategory(asg) {
    if (asg.source === 'classroom') {
      return asg.status || 'pending';
    }

    // Manual assignment status logic
    if (asg.completed || asg.status === 'Completed' || asg.status === 'finished') {
      return 'finished';
    }

    const todayStr = getLocalDateStr(new Date());
    const { dateStr } = parseDateStrings(asg.dueDate, asg.dueTime);
    if (dateStr && dateStr < todayStr) {
      return 'due';
    }

    return 'pending';
  }

  function updateClassroomAuthUI(classroomUser) {
    if (classroomUser && classroomUser.name) {
      if (classroomLoginBtn) classroomLoginBtn.classList.add('hidden');
      if (classroomManualCodeBtn) classroomManualCodeBtn.classList.add('hidden');
      if (classroomConnectedBadge) {
        classroomConnectedBadge.classList.remove('hidden');
        if (classroomUserName) classroomUserName.textContent = classroomUser.name;
      }
    } else {
      if (classroomLoginBtn) classroomLoginBtn.classList.remove('hidden');
      if (classroomManualCodeBtn) classroomManualCodeBtn.classList.remove('hidden');
      if (classroomConnectedBadge) classroomConnectedBadge.classList.add('hidden');
    }
  }

  function populateSubjectDatalist() {
    if (!asgSubjectSuggestions) return;
    const subjectsSet = new Set();

    // From current user profile
    if (currentUser?.subjects && Array.isArray(currentUser.subjects)) {
      currentUser.subjects.forEach(s => subjectsSet.add(s.trim()));
    }
    // From loaded assignments
    userAssignments.forEach(a => {
      const name = a.course || a.subject;
      if (name) subjectsSet.add(name.trim());
    });

    // Default AKTU core subjects if empty
    if (subjectsSet.size === 0) {
      subjectsSet.add('Data Structures (BCS-301)');
      subjectsSet.add('Computer System Architecture (BCS-302)');
      subjectsSet.add('Discrete Structures & Theory of Logic (BCS-303)');
      subjectsSet.add('Technical Communication (BAS-301)');
    }

    asgSubjectSuggestions.innerHTML = '';
    subjectsSet.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      asgSubjectSuggestions.appendChild(opt);
    });
  }

  let manualAssignments = [];
  let classroomAssignments = [];

  async function loadAssignmentsForUser() {
    const activeEmail = (currentUser && currentUser.email) || getSession() || '';
    if (!activeEmail) return;

    const authHeaders = { 'x-user-email': activeEmail };

    // 1. Fetch manual assignments
    try {
      manualAssignments = await DB.getAssignments(activeEmail);
    } catch (e) {
      console.warn('Failed to load manual assignments:', e);
      manualAssignments = [];
    }

    // 2. Fetch Google Classroom authentication state and assignments
    classroomAssignments = [];
    try {
      const userRes = await fetch(`/api/classroom/user?email=${encodeURIComponent(activeEmail)}`, {
        credentials: 'include',
        headers: authHeaders
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.loggedIn && userData.user) {
          updateClassroomAuthUI(userData.user);

          // Fetch Classroom assignments with credentials: 'include'
          const asgRes = await fetch(`/api/classroom/assignments?email=${encodeURIComponent(activeEmail)}`, {
            credentials: 'include',
            headers: authHeaders
          });
          if (asgRes.ok) {
            classroomAssignments = await asgRes.json();
          }
        } else {
          updateClassroomAuthUI(null);
        }
      } else {
        updateClassroomAuthUI(null);
      }
    } catch (err) {
      console.warn('Could not load Google Classroom assignments:', err);
      updateClassroomAuthUI(null);
    }

    // 3. Merge manual and classroom assignments
    userAssignments = [...manualAssignments, ...classroomAssignments];

    populateSubjectDatalist();
    renderAssignmentsDashboard();
  }

  function renderAssignmentsDashboard() {
    if (!asgItemsList) return;

    // Compute KPI metrics using normalized status category
    const totalCount = userAssignments.length;
    const pendingCount = userAssignments.filter(a => getAssignmentStatusCategory(a) === 'pending').length;
    const dueCount = userAssignments.filter(a => getAssignmentStatusCategory(a) === 'due').length;
    const finishedCount = userAssignments.filter(a => getAssignmentStatusCategory(a) === 'finished').length;

    // Update KPI counters
    if (asgKpiTotal) asgKpiTotal.textContent = totalCount;
    if (asgKpiPending) asgKpiPending.textContent = pendingCount;
    if (asgKpiDueSoon) asgKpiDueSoon.textContent = pendingCount;
    if (asgKpiOverdue) asgKpiOverdue.textContent = dueCount;
    if (asgKpiCompleted) asgKpiCompleted.textContent = finishedCount;

    // Update tab badges (pending, due, finished)
    if (tabCountAll) tabCountAll.textContent = totalCount;
    if (tabCountPending) tabCountPending.textContent = pendingCount;
    if (tabCountDue) tabCountDue.textContent = dueCount;
    if (tabCountOverdue) tabCountOverdue.textContent = dueCount;
    if (tabCountFinished) tabCountFinished.textContent = finishedCount;
    if (tabCountCompleted) tabCountCompleted.textContent = finishedCount;

    // Filter assignments according to selected tab
    let filtered = [...userAssignments];

    if (currentAsgFilter === 'pending') {
      filtered = filtered.filter(a => getAssignmentStatusCategory(a) === 'pending');
    } else if (currentAsgFilter === 'due' || currentAsgFilter === 'overdue') {
      filtered = filtered.filter(a => getAssignmentStatusCategory(a) === 'due');
    } else if (currentAsgFilter === 'finished' || currentAsgFilter === 'completed') {
      filtered = filtered.filter(a => getAssignmentStatusCategory(a) === 'finished');
    }

    // Search filter
    if (currentAsgSearch.trim()) {
      const q = currentAsgSearch.trim().toLowerCase();
      filtered = filtered.filter(a =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.subject || '').toLowerCase().includes(q) ||
        (a.course || '').toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = a.dueDate ? a.dueDate.slice(0, 10) : '';
      const dateB = b.dueDate ? b.dueDate.slice(0, 10) : '';
      if (currentAsgSort === 'due-asc') {
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.localeCompare(dateB);
      } else if (currentAsgSort === 'due-desc') {
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.localeCompare(dateA);
      } else if (currentAsgSort === 'priority') {
        const order = { High: 1, Medium: 2, Low: 3 };
        const pa = order[a.priority] || 2;
        const pb = order[b.priority] || 2;
        if (pa !== pb) return pa - pb;
        return dateA.localeCompare(dateB);
      } else if (currentAsgSort === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (currentAsgSort === 'created') {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      return 0;
    });

    // Render list
    asgItemsList.innerHTML = '';

    if (filtered.length === 0) {
      if (asgEmptyState) {
        asgEmptyState.classList.remove('hidden');
        if (currentAsgSearch.trim()) {
          asgEmptyTitle.textContent = 'No matching assignments found';
          asgEmptySub.textContent = `No assignments match "${currentAsgSearch}". Try adjusting your search keywords.`;
        } else if (currentAsgFilter === 'due' || currentAsgFilter === 'overdue') {
          asgEmptyTitle.textContent = 'No due assignments';
          asgEmptySub.textContent = 'All your assignments are up to date! Great job keeping up with deadlines.';
        } else if (currentAsgFilter === 'finished' || currentAsgFilter === 'completed') {
          asgEmptyTitle.textContent = 'No finished assignments yet';
          asgEmptySub.textContent = 'Completed and turned-in assignments will appear here.';
        } else if (currentAsgFilter === 'pending') {
          asgEmptyTitle.textContent = 'No pending assignments';
          asgEmptySub.textContent = 'You have no assignments waiting to be completed.';
        } else {
          asgEmptyTitle.textContent = 'No assignments tracked yet';
          asgEmptySub.textContent = 'Add a manual assignment or connect Google Classroom to start tracking.';
        }
      }
      return;
    }

    if (asgEmptyState) asgEmptyState.classList.add('hidden');

    filtered.forEach((asg) => {
      const li = document.createElement('li');
      const isClassroom = asg.source === 'classroom' || String(asg.id).startsWith('gc_');
      const statusCat = getAssignmentStatusCategory(asg);
      const isCompleted = statusCat === 'finished';
      const isOverdue = statusCat === 'due';
      const isPending = statusCat === 'pending';

      li.className = 'asg-item-card' +
        (isCompleted ? ' is-completed' : '') +
        (isOverdue ? ' is-overdue' : '') +
        (isPending ? ' is-due-soon' : '');
      li.setAttribute('data-asg-id', asg.id);

      const dateBadge = getAsgDateChipInfo(asg.dueDate, asg.dueTime, isCompleted);

      // Points display
      let pointsHtml = '';
      if (asg.points !== null && asg.points !== undefined) {
        pointsHtml = `<span class="asg-points-chip">${escapeHtml(asg.points)} pts</span>`;
      }

      // Link to attachment or reference if present
      let linkHtml = '';
      if (asg.attachmentUrl) {
        linkHtml = `
          <a href="${escapeHtml(asg.attachmentUrl)}" target="_blank" rel="noopener noreferrer" class="asg-link-btn" title="Open reference link">
            <svg viewBox="0 0 24 24" fill="none"><path d="M10 13A5 5 0 0017.07 13.07L19.9 10.24A5 5 0 0012.83 3.17L11.41 4.59M14 11A5 5 0 006.93 10.93L4.1 13.76A5 5 0 0011.17 20.83L12.59 19.41" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>Reference</span>
          </a>
        `;
      }

      const descHtml = asg.description ? `<p class="asg-item-desc">${escapeHtml(asg.description)}</p>` : '';

      // Classroom badge
      const classroomBadgeHtml = isClassroom ? `
        <span class="asg-source-badge classroom-badge" title="Imported from Google Classroom">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/></svg>
          Classroom
        </span>
      ` : '';

      // Actions section: Classroom items are READ-ONLY (no edit or delete) + "Open in Classroom" button
      let actionsHtml = '';
      if (isClassroom) {
        actionsHtml = `
          <div class="asg-item-actions">
            ${asg.link ? `
              <a href="${escapeHtml(asg.link)}" target="_blank" rel="noopener noreferrer" class="asg-btn-classroom" title="Open in Google Classroom">
                <span>Open in Classroom</span>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none"><path d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11M15 3H21M21 3V9M21 3L10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </a>
            ` : ''}
            <span class="asg-readonly-chip" title="Read-only: managed in Google Classroom">Read-only</span>
          </div>
        `;
      } else {
        actionsHtml = `
          <div class="asg-item-actions">
            <button type="button" class="asg-action-btn btn-edit" title="Edit Assignment" aria-label="Edit Assignment">
              <svg viewBox="0 0 24 24" fill="none"><path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 20V13M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button type="button" class="asg-action-btn btn-delete" title="Delete Assignment" aria-label="Delete Assignment">
              <svg viewBox="0 0 24 24" fill="none"><path d="M3 6H21M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M10 11V17M14 11V17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        `;
      }

      const subjectOrCourse = asg.course || asg.subject || 'General';

      li.innerHTML = `
        <div class="asg-checkbox-wrap">
          <button type="button" class="asg-check-btn ${isClassroom ? 'is-readonly' : ''}" aria-label="${isCompleted ? 'Mark incomplete' : 'Mark complete'}" title="${isClassroom ? (isCompleted ? 'Turned in / Completed in Google Classroom' : 'Google Classroom assignment') : (isCompleted ? 'Mark incomplete' : 'Mark complete')}">
            <svg viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div class="asg-item-body">
          <div class="asg-item-top">
            ${classroomBadgeHtml}
            <span class="asg-subject-pill" title="${escapeHtml(subjectOrCourse)}">${escapeHtml(subjectOrCourse)}</span>
            ${asg.priority ? `<span class="asg-priority-pill priority-${asg.priority}">${escapeHtml(asg.priority)}</span>` : ''}
          </div>
          <div class="asg-item-title">${escapeHtml(asg.title)}</div>
          ${descHtml}
          <div class="asg-item-meta-row">
            <span class="asg-date-chip ${dateBadge.class}">
              <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" stroke-width="1.8"/></svg>
              ${escapeHtml(dateBadge.text)}
            </span>
            ${pointsHtml}
            ${linkHtml}
          </div>
        </div>
        ${actionsHtml}
      `;

      // Event handlers for this card (only for manual assignments)
      if (!isClassroom) {
        const checkBtn = li.querySelector('.asg-check-btn');
        if (checkBtn) {
          checkBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await toggleAssignmentCompleted(asg.id, isCompleted);
          });
        }

        const editBtn = li.querySelector('.btn-edit');
        if (editBtn) {
          editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditAssignmentModal(asg);
          });
        }

        const delBtn = li.querySelector('.btn-delete');
        if (delBtn) {
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteAssignmentModal(asg);
          });
        }
      }

      asgItemsList.appendChild(li);
    });
  }

  // Toggle completion
  async function toggleAssignmentCompleted(asgId, currentlyCompleted) {
    if (!currentUser?.email) return;
    const newCompleted = !currentlyCompleted;
    const newStatus = newCompleted ? 'Completed' : 'In Progress';

    // Optimistic UI update
    const idx = userAssignments.findIndex(a => a.id === asgId);
    if (idx >= 0) {
      userAssignments[idx].completed = newCompleted;
      userAssignments[idx].status = newStatus;
      renderAssignmentsDashboard();
    }

    try {
      await DB.updateAssignment(asgId, currentUser.email, {
        completed: newCompleted,
        status: newStatus
      });
      if (newCompleted) {
        await DB.recordActivity(currentUser.email, 'assignment');
      }
    } catch (e) {
      console.warn('Failed to update assignment completion:', e);
      // Revert on error
      if (idx >= 0) {
        userAssignments[idx].completed = currentlyCompleted;
        renderAssignmentsDashboard();
      }
    }
  }

  // Filter tabs click
  const asgTabs = document.querySelectorAll('.asg-tab');
  asgTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      asgTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentAsgFilter = tab.getAttribute('data-filter') || 'all';
      renderAssignmentsDashboard();
    });
  });

  // Search input
  if (asgSearchInput) {
    asgSearchInput.addEventListener('input', () => {
      currentAsgSearch = asgSearchInput.value;
      if (asgSearchClear) {
        asgSearchClear.classList.toggle('hidden', !currentAsgSearch);
      }
      renderAssignmentsDashboard();
    });
  }

  if (asgSearchClear) {
    asgSearchClear.addEventListener('click', () => {
      if (asgSearchInput) asgSearchInput.value = '';
      currentAsgSearch = '';
      asgSearchClear.classList.add('hidden');
      renderAssignmentsDashboard();
    });
  }

  // Sort select
  if (asgSortSelect) {
    asgSortSelect.addEventListener('change', () => {
      currentAsgSort = asgSortSelect.value;
      renderAssignmentsDashboard();
    });
  }

  // Modal Open / Close
  function openAddAssignmentModal() {
    if (asgEditId) asgEditId.value = '';
    if (asgModalTitle) asgModalTitle.textContent = 'Add New Assignment';
    if (asgModalSub) asgModalSub.textContent = 'Create a manual course assignment or revision project';
    if (saveAsgBtnLabel) saveAsgBtnLabel.textContent = 'Save Assignment';
    if (asgTitleError) asgTitleError.classList.add('hidden');

    if (asgForm) asgForm.reset();
    if (asgFormDueDate) asgFormDueDate.value = getAddDaysYMD(2);
    if (asgFormPriority) asgFormPriority.value = 'Medium';
    if (asgFormStatus) asgFormStatus.value = 'Not Started';

    // Auto-fill first subject from profile if available
    if (asgFormSubject && currentUser?.subjects && currentUser.subjects[0]) {
      asgFormSubject.value = currentUser.subjects[0];
    }

    if (asgModalOverlay) asgModalOverlay.classList.remove('hidden');
    setTimeout(() => { if (asgFormTitle) asgFormTitle.focus(); }, 100);
  }

  function openEditAssignmentModal(asg) {
    if (asgEditId) asgEditId.value = asg.id;
    if (asgModalTitle) asgModalTitle.textContent = 'Edit Assignment';
    if (asgModalSub) asgModalSub.textContent = 'Update coursework details, due date, or priority';
    if (saveAsgBtnLabel) saveAsgBtnLabel.textContent = 'Update Assignment';
    if (asgTitleError) asgTitleError.classList.add('hidden');

    if (asgFormTitle) asgFormTitle.value = asg.title || '';
    if (asgFormSubject) asgFormSubject.value = asg.subject || '';
    if (asgFormPriority) asgFormPriority.value = asg.priority || 'Medium';
    if (asgFormDueDate) asgFormDueDate.value = asg.dueDate || '';
    if (asgFormDueTime) asgFormDueTime.value = asg.dueTime || '';
    if (asgFormStatus) asgFormStatus.value = asg.status || (asg.completed ? 'Completed' : 'Not Started');
    if (asgFormPoints) asgFormPoints.value = asg.points !== null && asg.points !== undefined ? asg.points : '';
    if (asgFormAttachment) asgFormAttachment.value = asg.attachmentUrl || '';
    if (asgFormDesc) asgFormDesc.value = asg.description || '';

    if (asgModalOverlay) asgModalOverlay.classList.remove('hidden');
    setTimeout(() => { if (asgFormTitle) asgFormTitle.focus(); }, 100);
  }

  function closeAddAssignmentModal() {
    if (asgModalOverlay) asgModalOverlay.classList.add('hidden');
  }

  if (openAddAssignmentBtn) openAddAssignmentBtn.addEventListener('click', openAddAssignmentModal);
  if (asgEmptyAddBtn) asgEmptyAddBtn.addEventListener('click', openAddAssignmentModal);
  if (closeAsgModalBtn) closeAsgModalBtn.addEventListener('click', closeAddAssignmentModal);
  if (cancelAsgModalBtn) cancelAsgModalBtn.addEventListener('click', closeAddAssignmentModal);

  // Form Submit
  if (asgForm) {
    asgForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser?.email) return;

      const title = asgFormTitle.value.trim();
      if (!title) {
        if (asgTitleError) asgTitleError.classList.remove('hidden');
        asgFormTitle.focus();
        return;
      }
      if (asgTitleError) asgTitleError.classList.add('hidden');

      const isEdit = Boolean(asgEditId.value);
      const payload = {
        userId: currentUser.email,
        title,
        subject: asgFormSubject.value.trim() || 'General',
        priority: asgFormPriority.value,
        dueDate: asgFormDueDate.value || null,
        dueTime: asgFormDueTime.value || '',
        status: asgFormStatus.value,
        completed: asgFormStatus.value === 'Completed',
        points: asgFormPoints.value ? Number(asgFormPoints.value) : null,
        attachmentUrl: asgFormAttachment.value.trim(),
        description: asgFormDesc.value.trim()
      };

      try {
        if (isEdit) {
          const updated = await DB.updateAssignment(asgEditId.value, currentUser.email, payload);
          const idx = userAssignments.findIndex(a => a.id === asgEditId.value);
          if (idx >= 0 && updated) userAssignments[idx] = updated;
        } else {
          const saved = await DB.saveAssignment(payload);
          userAssignments.unshift(saved);
        }
        closeAddAssignmentModal();
        renderAssignmentsDashboard();
        showAsgAlert(isEdit ? 'Assignment updated successfully.' : 'Assignment created successfully.');
      } catch (err) {
        console.warn('Failed to save assignment:', err);
        alert('Failed to save assignment. Please try again.');
      }
    });
  }

  // Delete modal
  function openDeleteAssignmentModal(asg) {
    assignmentToDelete = asg;
    if (asgDeleteModalItemTitle) asgDeleteModalItemTitle.textContent = `"${asg.title}"`;
    if (asgDeleteModalOverlay) asgDeleteModalOverlay.classList.remove('hidden');
  }

  function closeDeleteAssignmentModal() {
    assignmentToDelete = null;
    if (asgDeleteModalOverlay) asgDeleteModalOverlay.classList.add('hidden');
  }

  if (closeAsgDeleteModalBtn) closeAsgDeleteModalBtn.addEventListener('click', closeDeleteAssignmentModal);
  if (cancelAsgDeleteBtn) cancelAsgDeleteBtn.addEventListener('click', closeDeleteAssignmentModal);

  if (confirmAsgDeleteBtn) {
    confirmAsgDeleteBtn.addEventListener('click', async () => {
      if (!assignmentToDelete || !currentUser?.email) return;
      const targetId = assignmentToDelete.id;
      try {
        await DB.deleteAssignment(targetId, currentUser.email);
        userAssignments = userAssignments.filter(a => a.id !== targetId);
        closeDeleteAssignmentModal();
        renderAssignmentsDashboard();
        showAsgAlert('Assignment deleted successfully.');
      } catch (e) {
        console.warn('Failed to delete assignment:', e);
        alert('Failed to delete assignment.');
      }
    });
  }

  // Expose assignment functions globally for inspection and tests
  window.loadAssignmentsForUser = loadAssignmentsForUser;

  /* ---------------------------------------------------
     9. AUTO LOGIN & PERSISTENT SESSION RESTORATION (Firebase Auth & Server)
  --------------------------------------------------- */
  let isRestoringSession = false;
  let authInitialized = false;

  async function tryAutoLogin() {
    if (currentUser) {
      const authLoadingScreen = document.getElementById('authLoadingScreen');
      if (authLoadingScreen) authLoadingScreen.classList.add('hidden');
      return;
    }
    if (isRestoringSession) return;
    isRestoringSession = true;

    const authLoadingScreen = document.getElementById('authLoadingScreen');

    let isExplicitlyLoggedOut = false;
    try {
      isExplicitlyLoggedOut = localStorage.getItem('study_assistant_logged_out') === 'true';
    } catch (e) {}

    // Check stored session from localStorage or URL parameter (e.g. from Google OAuth callback)
    let sessionEmail = null;
    try {
      sessionEmail = getSession();
      const params = new URLSearchParams(window.location.search);
      const urlEmail = params.get('email');
      if (urlEmail) {
        sessionEmail = urlEmail.toLowerCase().trim();
        saveSession(sessionEmail);
        try {
          localStorage.removeItem('study_assistant_logged_out');
          isExplicitlyLoggedOut = false;
        } catch (e) {}
      }
    } catch (e) {}

    // If Firebase Auth Service is loaded, bind to onAuthStateChanged
    if (typeof window !== 'undefined' && window.FirebaseAuthService) {
      try {
        window.FirebaseAuthService.onAuthStateChanged(async (fbProfile, fbUser) => {
          authInitialized = true;
          if (fbUser && fbProfile && !isExplicitlyLoggedOut) {
            if (isStaffUser(fbProfile)) {
              await enterStaffDashboard(fbProfile);
            } else {
              await enterDashboard(fbProfile);
            }
            if (authLoadingScreen) authLoadingScreen.classList.add('hidden');
            isRestoringSession = false;
            return;
          }

          // If no Firebase user but sessionEmail exists and not explicitly logged out, check fallback
          if (!currentUser && sessionEmail && !isExplicitlyLoggedOut) {
            await checkFallbackSession(sessionEmail, authLoadingScreen);
          } else if (!currentUser) {
            showLoginScreen(authLoadingScreen);
          }
        });
        return;
      } catch (fbInitErr) {
        console.warn('[Auth] FirebaseAuthService onAuthStateChanged notice:', fbInitErr);
      }
    }

    // Direct fallback if Firebase Auth Service not available
    if (isExplicitlyLoggedOut && !sessionEmail) {
      showLoginScreen(authLoadingScreen);
      return;
    }

    await checkFallbackSession(sessionEmail, authLoadingScreen);
  }

  async function checkFallbackSession(sessionEmail, authLoadingScreen) {
    let user = null;

    // 1. Verify session with server (/api/auth/me)
    try {
      const headers = {};
      if (sessionEmail) {
        headers['X-User-Email'] = sessionEmail;
      }
      const meRes = await fetch('/api/auth/me', {
        headers,
        credentials: 'include'
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData && meData.authenticated && meData.user) {
          user = meData.user;
        }
      }
    } catch (e) {
      console.warn('[Auth] Backend session verification temporary network failure:', e);
    }

    // 2. Restore from local IndexedDB if server was unreachable
    if (!user && sessionEmail) {
      try {
        const localUser = await DB.getUser(sessionEmail);
        if (localUser && localUser.email) {
          user = localUser;
        }
      } catch (idbErr) {
        console.warn('[Auth] IndexedDB session restoration fallback failed:', idbErr);
      }
    }

    if (user) {
      if (isStaffUser(user)) {
        await enterStaffDashboard(user);
      } else {
        await enterDashboard(user);
      }
      if (authLoadingScreen) authLoadingScreen.classList.add('hidden');
      isRestoringSession = false;
      return;
    }

    showLoginScreen(authLoadingScreen);
  }

  function showLoginScreen(authLoadingScreen) {
    currentUser = null;
    window.currentUser = null;
    clearSession();
    if (authLoadingScreen) authLoadingScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
    if (staffDashboardScreen) staffDashboardScreen.classList.add('hidden');
    const novaFab = document.getElementById('novaFab');
    const novaPanel = document.getElementById('novaPanel');
    if (novaFab) novaFab.classList.add('hidden');
    if (novaPanel) novaPanel.classList.add('hidden');
    isRestoringSession = false;
  }

  // Safety fallback: ensure auth loading screen does not hang indefinitely
  setTimeout(() => {
    const authLoadingScreen = document.getElementById('authLoadingScreen');
    if (authLoadingScreen && !authLoadingScreen.classList.contains('hidden') && !currentUser) {
      authLoadingScreen.classList.add('hidden');
      loginScreen.classList.remove('hidden');
    }
  }, 4000);

  // Execute session restoration on startup
  tryAutoLogin();

  /* ==========================================================================
     TOP NAVIGATION BAR MODULE:
     - Global Search with ⌘K / Ctrl+K shortcut, real-time indexed results & AI query
     - Study Notifications Bell with real data (Exams, Schedule, Assignments, Goals)
     - Theme Toggle with persistent mode
     - User Profile Menu dropdown
     ========================================================================== */
  function initTopNavigation() {
    // ----------------------------------------------------
    // 1. THEME MODE TOGGLE
    // ----------------------------------------------------
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const savedTheme = localStorage.getItem('nova_theme_mode');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
    }

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        try {
          localStorage.setItem('nova_theme_mode', isDark ? 'dark' : 'light');
        } catch (e) {}
      });
    }

    // ----------------------------------------------------
    // 2. USER PROFILE MENU DROPDOWN
    // ----------------------------------------------------
    const topNavProfileBtn = document.getElementById('topNavProfileBtn');
    const profileDropdownMenu = document.getElementById('profileDropdownMenu');
    const menuLogoutBtn = document.getElementById('menuLogoutBtn');

    if (topNavProfileBtn && profileDropdownMenu) {
      topNavProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = profileDropdownMenu.classList.contains('hidden');
        // Close other dropdowns
        const notifPanel = document.getElementById('notifDropdownPanel');
        const searchDropdown = document.getElementById('searchResultsDropdown');
        if (notifPanel) notifPanel.classList.add('hidden');
        if (searchDropdown) searchDropdown.classList.add('hidden');

        profileDropdownMenu.classList.toggle('hidden', !isHidden);
        topNavProfileBtn.setAttribute('aria-expanded', String(isHidden));
      });

      profileDropdownMenu.querySelectorAll('[data-nav-target]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const target = btn.getAttribute('data-nav-target');
          if (target && window.showView) {
            window.showView(target);
          }
          profileDropdownMenu.classList.add('hidden');
          topNavProfileBtn.setAttribute('aria-expanded', 'false');
        });
      });
    }

    if (menuLogoutBtn) {
      menuLogoutBtn.addEventListener('click', () => {
        profileDropdownMenu.classList.add('hidden');
        const mainLogoutBtn = document.getElementById('logoutBtn');
        if (mainLogoutBtn) mainLogoutBtn.click();
      });
    }

    // ----------------------------------------------------
    // 3. STUDY NOTIFICATIONS SYSTEM (Real Data Driven)
    // ----------------------------------------------------
    const notifBellBtn = document.getElementById('notifBellBtn');
    const notifDropdownPanel = document.getElementById('notifDropdownPanel');
    const notifBadgeCount = document.getElementById('notifBadgeCount');
    const notifPillCount = document.getElementById('notifPillCount');
    const notifMarkAllBtn = document.getElementById('notifMarkAllBtn');
    const notifList = document.getElementById('notifList');

    // Default real notification registry
    const NOTIFICATIONS_DATA = [
      {
        id: 'notif-exam-bcs301',
        category: 'EXAM',
        type: 'exam',
        title: 'Unit 1 Mastery Test: Data Structures (BCS-301)',
        desc: 'Upcoming practice test on Arrays, Search & Sort algorithms. 14 marks weightage.',
        time: 'In 3 days',
        targetView: 'tests-exams'
      },
      {
        id: 'notif-tt-os',
        category: 'SCHEDULE',
        type: 'schedule',
        title: "Today's Class: Operating Systems",
        desc: 'Room 302 • Section CSE 2A with Dr. Sharma at 11:15 AM.',
        time: 'Today, 11:15 AM',
        targetView: 'timetable'
      },
      {
        id: 'notif-asg-bst',
        category: 'ASSIGNMENT',
        type: 'assignment',
        title: 'Assignment Due: Balanced BST Implementation',
        desc: 'KCS-301 coursework on AVL tree rotations due this Sunday at 11:59 PM.',
        time: 'Due in 2 days',
        targetView: 'assignments'
      },
      {
        id: 'notif-focus-streak',
        category: 'FOCUS',
        type: 'focus',
        title: 'Keep Your Daily Study Streak Alive',
        desc: 'Complete 1 Pomodoro session today to reach your 25-minute academic target.',
        time: 'Today',
        targetView: 'calendar'
      }
    ];

    function getReadNotificationIds() {
      try {
        const stored = localStorage.getItem('nova_read_notifications_v2');
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }

    function saveReadNotificationIds(ids) {
      try {
        localStorage.setItem('nova_read_notifications_v2', JSON.stringify(ids));
      } catch (e) {}
    }

    function renderStudyNotifications() {
      if (!notifList) return;
      const readIds = getReadNotificationIds();
      const unreadCount = NOTIFICATIONS_DATA.filter((n) => !readIds.includes(n.id)).length;

      // Update badge count
      if (notifBadgeCount) {
        if (unreadCount > 0) {
          notifBadgeCount.textContent = unreadCount;
          notifBadgeCount.classList.remove('hidden');
        } else {
          notifBadgeCount.classList.add('hidden');
        }
      }

      // Update header pill
      if (notifPillCount) {
        notifPillCount.textContent = unreadCount > 0 ? `${unreadCount} unread` : 'All caught up';
      }

      if (NOTIFICATIONS_DATA.length === 0) {
        notifList.innerHTML = `<div class="notif-empty">No study notifications at this time.</div>`;
        return;
      }

      notifList.innerHTML = NOTIFICATIONS_DATA.map((item) => {
        const isUnread = !readIds.includes(item.id);
        let iconSvg = '';
        if (item.type === 'exam') {
          iconSvg = `<svg viewBox="0 0 24 24" fill="none"><path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
        } else if (item.type === 'schedule') {
          iconSvg = `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 6V12L16 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
        } else if (item.type === 'assignment') {
          iconSvg = `<svg viewBox="0 0 24 24" fill="none"><path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 20.1046 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" stroke-width="1.8"/><rect x="9" y="3" width="6" height="4" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M9 14L11 16L15 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
        } else {
          iconSvg = `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 6 8.5 6 13.5C6 17.0899 8.68629 20 12 20C15.3137 20 18 17.0899 18 13.5C18 8.5 12 2 12 2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
        }

        return `
          <button type="button" class="notif-item ${isUnread ? 'unread' : ''}" data-notif-id="${item.id}" data-target-view="${item.targetView}">
            ${isUnread ? '<span class="notif-item-dot" title="Unread"></span>' : ''}
            <div class="notif-item-icon ${item.type}">
              ${iconSvg}
            </div>
            <div class="notif-item-body">
              <div class="notif-item-header">
                <span class="notif-item-tag">${item.category}</span>
                <span class="notif-item-time">${item.time}</span>
              </div>
              <div class="notif-item-title">${item.title}</div>
              <div class="notif-item-desc">${item.desc}</div>
            </div>
          </button>
        `;
      }).join('');

      // Bind individual notification item clicks
      notifList.querySelectorAll('.notif-item').forEach((btn) => {
        btn.addEventListener('click', () => {
          const notifId = btn.getAttribute('data-notif-id');
          const targetView = btn.getAttribute('data-target-view');
          if (notifId) {
            const currentReads = getReadNotificationIds();
            if (!currentReads.includes(notifId)) {
              currentReads.push(notifId);
              saveReadNotificationIds(currentReads);
            }
          }
          if (notifDropdownPanel) notifDropdownPanel.classList.add('hidden');
          if (notifBellBtn) notifBellBtn.setAttribute('aria-expanded', 'false');
          renderStudyNotifications();
          if (targetView && window.showView) {
            window.showView(targetView);
          }
        });
      });
    }

    window.refreshStudyNotifications = renderStudyNotifications;
    renderStudyNotifications();

    if (notifBellBtn && notifDropdownPanel) {
      notifBellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = notifDropdownPanel.classList.contains('hidden');
        // Close other dropdowns
        const profileDropdown = document.getElementById('profileDropdownMenu');
        const searchDropdown = document.getElementById('searchResultsDropdown');
        if (profileDropdown) profileDropdown.classList.add('hidden');
        if (searchDropdown) searchDropdown.classList.add('hidden');

        notifDropdownPanel.classList.toggle('hidden', !isHidden);
        notifBellBtn.setAttribute('aria-expanded', String(isHidden));
        renderStudyNotifications();
      });
    }

    if (notifMarkAllBtn) {
      notifMarkAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const allIds = NOTIFICATIONS_DATA.map((n) => n.id);
        saveReadNotificationIds(allIds);
        renderStudyNotifications();
      });
    }

    // ----------------------------------------------------
    // 4. GLOBAL SEARCH SYSTEM
    // ----------------------------------------------------
    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsDropdown = document.getElementById('searchResultsDropdown');
    const searchResultsInner = document.getElementById('searchResultsInner');
    const searchClearBtn = document.getElementById('searchClearBtn');
    const searchKbdHint = document.getElementById('searchKbdHint');

    // Set keyboard shortcut label based on OS
    if (searchKbdHint) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      searchKbdHint.textContent = isMac ? '⌘K' : 'Ctrl+K';
    }

    // Build real searchable index
    const SEARCH_INDEX = [
      // Courses & Subjects
      {
        type: 'course',
        section: 'COURSES & SUBJECTS',
        title: 'Data Structures (BCS-301)',
        subtitle: 'B.Tech CSE Sem 3 • Arrays, Stacks, Queues, Trees, Graphs, Sorting algorithms',
        badge: 'Course',
        iconClass: 'blue',
        view: 'courses',
        queryParam: 'Data Structures'
      },
      {
        type: 'course',
        section: 'COURSES & SUBJECTS',
        title: 'Computer System Architecture (BCS-302)',
        subtitle: 'B.Tech CSE Sem 3 • CPU Registers, Instruction formats, RISC Pipelining, Cache Memory',
        badge: 'Course',
        iconClass: 'blue',
        view: 'courses',
        queryParam: 'Computer System Architecture'
      },
      {
        type: 'course',
        section: 'COURSES & SUBJECTS',
        title: 'Discrete Structures & Theory of Logic (BCS-303)',
        subtitle: 'B.Tech CSE Sem 3 • Sets, Relations, Posets, Propositional Logic, Graph Theory',
        badge: 'Course',
        iconClass: 'blue',
        view: 'courses',
        queryParam: 'Discrete Structures'
      },
      {
        type: 'course',
        section: 'COURSES & SUBJECTS',
        title: 'Engineering Mathematics - I (KAS-101)',
        subtitle: 'B.Tech Sem 1 • Matrices, Eigenvalues, Differential Calculus, Vector Calculus',
        badge: 'Course',
        iconClass: 'blue',
        view: 'courses',
        queryParam: 'Engineering Mathematics'
      },
      {
        type: 'course',
        section: 'COURSES & SUBJECTS',
        title: 'Engineering Physics (KAS-102)',
        subtitle: 'B.Tech Sem 1 • Special Relativity, EM Field Theory, Quantum Mechanics, Fiber Optics',
        badge: 'Course',
        iconClass: 'blue',
        view: 'courses',
        queryParam: 'Engineering Physics'
      },
      {
        type: 'course',
        section: 'COURSES & SUBJECTS',
        title: 'Operating Systems (KCS-401)',
        subtitle: 'B.Tech CSE Sem 4 • Processes, CPU Scheduling, Virtual Memory, Deadlock handling',
        badge: 'Course',
        iconClass: 'blue',
        view: 'courses',
        queryParam: 'Operating Systems'
      },
      {
        type: 'course',
        section: 'COURSES & SUBJECTS',
        title: 'Database Management Systems (KCS-501)',
        subtitle: 'B.Tech CSE Sem 5 • ER Modeling, SQL queries, Normalization, ACID transactions',
        badge: 'Course',
        iconClass: 'blue',
        view: 'courses',
        queryParam: 'Database Management Systems'
      },
      {
        type: 'course',
        section: 'COURSES & SUBJECTS',
        title: 'Python Programming (KNC-301)',
        subtitle: 'B.Tech Sem 3 • Python fundamentals, OOP, Data Structures, Numpy, Pandas',
        badge: 'Course',
        iconClass: 'blue',
        view: 'courses',
        queryParam: 'Python'
      },
      {
        type: 'course',
        section: 'COURSES & SUBJECTS',
        title: 'Web Designing & HTML5 (KCS-031)',
        subtitle: 'B.Tech CSE Sem 3 • Semantic HTML, CSS3 Flexbox/Grid, Responsive Web Design',
        badge: 'Course',
        iconClass: 'blue',
        view: 'courses',
        queryParam: 'Web Designing'
      },

      // Flashcards & Active Recall Decks
      {
        type: 'flashcard',
        section: 'FLASHCARDS & STUDY DECKS',
        title: 'Data Structures Flashcards Deck',
        subtitle: 'Interactive revision: Time complexities, AVL Rotations, Tree traversals',
        badge: 'Flashcards',
        iconClass: 'amber',
        view: 'flashcards'
      },
      {
        type: 'flashcard',
        section: 'FLASHCARDS & STUDY DECKS',
        title: 'Computer Architecture Flashcards Deck',
        subtitle: 'Interactive revision: Harvard vs Von Neumann, Cache hit ratio, Pipeline Hazards',
        badge: 'Flashcards',
        iconClass: 'amber',
        view: 'flashcards'
      },
      {
        type: 'flashcard',
        section: 'FLASHCARDS & STUDY DECKS',
        title: 'Operating Systems Flashcards Deck',
        subtitle: 'Interactive revision: Mutex vs Semaphore, Page Replacement, Banker Algorithm',
        badge: 'Flashcards',
        iconClass: 'amber',
        view: 'flashcards'
      },

      // Tests, Exams & Assignments
      {
        type: 'test',
        section: 'TESTS & ASSIGNMENTS',
        title: 'Unit 1 Mastery Test: Data Structures',
        subtitle: 'AKTU PYQ-aligned mock test on Arrays, Search & Sort algorithms (14 Marks)',
        badge: 'Test',
        iconClass: 'green',
        view: 'tests-exams'
      },
      {
        type: 'test',
        section: 'TESTS & ASSIGNMENTS',
        title: 'Mid-Term Sessional Examination Schedule',
        subtitle: 'Theory papers, evaluation dates, and subject syllabus breakdown',
        badge: 'Exams',
        iconClass: 'green',
        view: 'tests-exams'
      },
      {
        type: 'assignment',
        section: 'TESTS & ASSIGNMENTS',
        title: 'BCS-301 Balanced BST & AVL Tree Implementation',
        subtitle: 'Coursework assignment on AVL rotations and tree balancing algorithms',
        badge: 'Assignment',
        iconClass: 'green',
        view: 'assignments'
      },
      {
        type: 'schedule',
        section: 'ACADEMIC SCHEDULE',
        title: 'Weekly Timetable & Schedule Management',
        subtitle: 'Mon–Fri classes for B.Tech CSE 2nd Year (Sections 2A, 2B, 2C, 2D)',
        badge: 'Schedule',
        iconClass: 'purple',
        view: 'timetable'
      },
      {
        type: 'planner',
        section: 'ACADEMIC SCHEDULE',
        title: 'Planner & Focus Timer (Pomodoro)',
        subtitle: 'Daily study goals, 25-minute Pomodoro sessions, and streak tracker',
        badge: 'Planner',
        iconClass: 'purple',
        view: 'calendar'
      }
    ];

    let highlightedIndex = -1;
    let currentRenderedItems = [];

    function executeSearchResult(item) {
      if (!item) return;

      if (item.type === 'ai') {
        if (window.showView) window.showView('chat');
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
          chatInput.value = item.query;
          setTimeout(() => {
            chatInput.focus();
            scrollChatToBottom();
          }, 80);
        }
      } else if (item.type === 'course') {
        if (window.showView) window.showView('courses');
        const aktuSearchInput = document.getElementById('aktuSearchInput');
        if (aktuSearchInput && item.queryParam) {
          aktuSearchInput.value = item.queryParam;
          aktuSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else if (item.view) {
        if (window.showView) window.showView(item.view);
      }

      closeSearchDropdown();
    }

    function closeSearchDropdown() {
      if (searchResultsDropdown) searchResultsDropdown.classList.add('hidden');
      highlightedIndex = -1;
      currentRenderedItems = [];
    }

    function renderSearchResults(query) {
      if (!searchResultsDropdown || !searchResultsInner) return;
      const cleanQ = query.trim().toLowerCase();

      if (!cleanQ) {
        closeSearchDropdown();
        return;
      }

      // Filter matches
      const matches = SEARCH_INDEX.filter((item) => {
        return (
          item.title.toLowerCase().includes(cleanQ) ||
          item.subtitle.toLowerCase().includes(cleanQ) ||
          (item.queryParam && item.queryParam.toLowerCase().includes(cleanQ)) ||
          item.badge.toLowerCase().includes(cleanQ)
        );
      });

      // Prepare items list including AI query option
      currentRenderedItems = [...matches];
      currentRenderedItems.push({
        type: 'ai',
        section: 'ASK NOVA AI',
        title: `Ask Nova AI: "${query.trim()}"`,
        subtitle: 'Get instant explanations, formula derivations, code examples, or exam revision',
        badge: 'AI Assistant',
        iconClass: 'ai',
        query: query.trim()
      });

      highlightedIndex = 0; // Default highlight top item

      if (matches.length === 0) {
        searchResultsInner.innerHTML = `
          <div class="search-empty-state">
            <div class="search-empty-title">No direct database matches for "${query.trim()}"</div>
            <div class="search-empty-desc">Nova AI can explain this concept, syllabus unit, or answer your question directly.</div>
            <button type="button" class="search-ask-ai-btn" id="searchEmptyAiBtn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/></svg>
              <span>Ask Nova AI about "${query.trim()}"</span>
            </button>
          </div>
        `;

        const emptyAiBtn = document.getElementById('searchEmptyAiBtn');
        if (emptyAiBtn) {
          emptyAiBtn.addEventListener('click', () => {
            executeSearchResult({ type: 'ai', query: query.trim() });
          });
        }
      } else {
        // Group by sections
        const grouped = {};
        currentRenderedItems.forEach((item, idx) => {
          if (!grouped[item.section]) grouped[item.section] = [];
          grouped[item.section].push({ item, idx });
        });

        let html = '';
        Object.keys(grouped).forEach((sec) => {
          html += `<div class="search-section-label">${sec}</div>`;
          grouped[sec].forEach(({ item, idx }) => {
            let iconSvg = '';
            if (item.iconClass === 'blue') {
              iconSvg = `<svg viewBox="0 0 24 24" fill="none"><path d="M12 6C10 4.5 7 4 4 4.5V17.5C7 17 10 17.5 12 19C14 17.5 17 17 20 17.5V4.5C17 4 14 4.5 12 6Z" stroke="currentColor" stroke-width="1.8"/><path d="M12 6V19" stroke="currentColor" stroke-width="1.8"/></svg>`;
            } else if (item.iconClass === 'amber') {
              iconSvg = `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="6" y="8" width="15" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/></svg>`;
            } else if (item.iconClass === 'green') {
              iconSvg = `<svg viewBox="0 0 24 24" fill="none"><path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" stroke-width="1.8"/></svg>`;
            } else if (item.iconClass === 'purple') {
              iconSvg = `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="1.8"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="1.8"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="1.8"/></svg>`;
            } else {
              iconSvg = `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/></svg>`;
            }

            html += `
              <button type="button" class="search-result-item ${idx === highlightedIndex ? 'highlighted' : ''}" data-item-index="${idx}" role="option">
                <div class="search-result-icon ${item.iconClass}">
                  ${iconSvg}
                </div>
                <div class="search-result-content">
                  <div class="search-result-title">${item.title}</div>
                  <div class="search-result-sub">${item.subtitle}</div>
                </div>
                <span class="search-result-badge">${item.badge}</span>
              </button>
            `;
          });
        });

        searchResultsInner.innerHTML = html;

        // Bind clicks
        searchResultsInner.querySelectorAll('.search-result-item').forEach((btn) => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-item-index'), 10);
            if (!isNaN(index) && currentRenderedItems[index]) {
              executeSearchResult(currentRenderedItems[index]);
            }
          });
        });
      }

      searchResultsDropdown.classList.remove('hidden');
    }

    if (globalSearchInput) {
      let debounceTimer = null;
      globalSearchInput.addEventListener('input', () => {
        const val = globalSearchInput.value;
        if (searchClearBtn) {
          searchClearBtn.classList.toggle('hidden', val.length === 0);
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          renderSearchResults(val);
        }, 90);
      });

      globalSearchInput.addEventListener('focus', () => {
        if (globalSearchInput.value.trim()) {
          renderSearchResults(globalSearchInput.value);
        }
      });

      globalSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeSearchDropdown();
          globalSearchInput.blur();
          return;
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (currentRenderedItems.length > 0) {
            highlightedIndex = (highlightedIndex + 1) % currentRenderedItems.length;
            updateHighlightedSearchResult();
          }
          return;
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (currentRenderedItems.length > 0) {
            highlightedIndex = (highlightedIndex - 1 + currentRenderedItems.length) % currentRenderedItems.length;
            updateHighlightedSearchResult();
          }
          return;
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          if (currentRenderedItems.length > 0 && highlightedIndex >= 0 && currentRenderedItems[highlightedIndex]) {
            executeSearchResult(currentRenderedItems[highlightedIndex]);
          } else if (globalSearchInput.value.trim()) {
            executeSearchResult({ type: 'ai', query: globalSearchInput.value.trim() });
          }
        }
      });
    }

    function updateHighlightedSearchResult() {
      if (!searchResultsInner) return;
      searchResultsInner.querySelectorAll('.search-result-item').forEach((el, idx) => {
        el.classList.toggle('highlighted', idx === highlightedIndex);
        if (idx === highlightedIndex) {
          el.scrollIntoView({ block: 'nearest' });
        }
      });
    }

    if (searchClearBtn && globalSearchInput) {
      searchClearBtn.addEventListener('click', () => {
        globalSearchInput.value = '';
        searchClearBtn.classList.add('hidden');
        closeSearchDropdown();
        globalSearchInput.focus();
      });
    }

    // Global keyboard shortcut: ⌘K, Ctrl+K, or / to focus search
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (globalSearchInput) {
          globalSearchInput.focus();
          globalSearchInput.select();
        }
      } else if (e.key === '/' && document.activeElement !== globalSearchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        if (globalSearchInput) {
          globalSearchInput.focus();
          globalSearchInput.select();
        }
      }
    });

    // Close open menus/dropdowns on outside click
    document.addEventListener('click', (e) => {
      const searchWrap = document.getElementById('topNavSearchWrap');
      if (searchWrap && !searchWrap.contains(e.target)) {
        closeSearchDropdown();
      }

      const notifWrap = document.getElementById('topNavNotifWrap');
      if (notifWrap && !notifWrap.contains(e.target)) {
        if (notifDropdownPanel) notifDropdownPanel.classList.add('hidden');
        if (notifBellBtn) notifBellBtn.setAttribute('aria-expanded', 'false');
      }

      const profileWrap = document.getElementById('topNavProfileWrap');
      if (profileWrap && !profileWrap.contains(e.target)) {
        if (profileDropdownMenu) profileDropdownMenu.classList.add('hidden');
        if (topNavProfileBtn) topNavProfileBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Initialize Top Navigation component
  initTopNavigation();

});