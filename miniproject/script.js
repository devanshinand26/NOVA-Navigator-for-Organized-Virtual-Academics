/* =========================================================
   STUDY ASSISTANT — APP LOGIC
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------
     1. LOGIN
  --------------------------------------------------- */
  const loginScreen = document.getElementById('loginScreen');
  const dashboardScreen = document.getElementById('dashboardScreen');
  const loginForm = document.getElementById('loginForm');
  const loginCard = document.querySelector('.login-card');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const togglePwBtn = document.getElementById('togglePw');
  const userNameLabel = document.getElementById('userNameLabel');
  const userAvatar = document.getElementById('userAvatar');

  togglePwBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePwBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  });

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    emailError.textContent = '';
    passwordError.textContent = '';

    const emailVal = emailInput.value.trim();
    const pwVal = passwordInput.value.trim();
    let valid = true;

    if (!emailVal || !isValidEmail(emailVal)) {
      emailError.textContent = 'Enter a valid email address.';
      valid = false;
    }
    if (!pwVal || pwVal.length < 4) {
      passwordError.textContent = 'Password must be at least 4 characters.';
      valid = false;
    }
    if (!valid) return;

    // Simulate an auth request, then transition screens
    loginCard.classList.add('is-loading');
    setTimeout(() => {
      loginCard.classList.remove('is-loading');

      const name = emailVal.split('@')[0];
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      userNameLabel.textContent = displayName;
      userAvatar.textContent = displayName.charAt(0).toUpperCase();

      loginScreen.classList.add('hidden');
      dashboardScreen.classList.remove('hidden');
    }, 700);
  });

  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn.addEventListener('click', () => {
    dashboardScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    loginForm.reset();
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

  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach((i) => i.classList.remove('active'));
      item.classList.add('active');

      const targetId = item.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      closeSidebar();
    });
  });

  /* ---------------------------------------------------
     3. AI CHAT MOCK
  --------------------------------------------------- */
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const summarizeBtn = document.getElementById('summarizeBtn');

  const AI_RESPONSES = [
    "Great question. Let's break it down step by step, starting with the core concept before applying it to an example.",
    "Here's a simple way to remember this: connect the idea to something you already know, then test yourself without looking at your notes.",
    "That topic often trips students up. Try reviewing the definition first, then work through two practice problems to reinforce it.",
    "Good instinct to ask about this — it usually shows up on exams. I'd focus your next session on the underlying formula and one worked example.",
    "Think of it in three parts: what it is, why it matters, and how it's applied. Want me to generate a flashcard set for this topic?"
  ];

  function scrollChatToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `chat-msg chat-msg-${sender}`;

    const avatar = document.createElement('div');
    avatar.className = `chat-avatar chat-avatar-${sender}`;
    avatar.textContent = sender === 'ai' ? 'AI' : 'You';

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;

    msg.appendChild(avatar);
    msg.appendChild(bubble);
    chatMessages.appendChild(msg);
    scrollChatToBottom();
    return msg;
  }

  function showTypingIndicator() {
    const existing = chatMessages ? chatMessages.querySelectorAll('.chat-msg-typing') : [];
    existing.forEach((el) => el.remove());

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
      </div>`;
    chatMessages.appendChild(msg);
    scrollChatToBottom();
    return msg;
  }

  function sendAIReply(replyText) {
    const typingMsg = showTypingIndicator();
    setTimeout(() => {
      if (typingMsg && typingMsg.parentNode) typingMsg.remove();
      appendMessage(replyText, 'ai');
    }, 1000);
  }

  function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    appendMessage(text, 'user');
    chatInput.value = '';
    autoResizeChatInput();

    const randomReply = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
    sendAIReply(randomReply);
  }

  function summarizeText(text) {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= 25) {
      return `Here's the key idea: ${text}`;
    }
    const snippet = words.slice(0, 25).join(' ');
    return `Summary: ${snippet}… In short, this passage centers on its main topic — review the highlighted terms and rephrase them in your own words to lock it into memory.`;
  }

  function handleSummarize() {
    const text = chatInput.value.trim();
    if (!text) {
      sendAIReply("Paste a paragraph of notes into the box, then hit Summarize and I'll condense it for you.");
      return;
    }
    appendMessage(`Summarize this: "${text.length > 60 ? text.slice(0, 60) + '…' : text}"`, 'user');
    chatInput.value = '';
    autoResizeChatInput();
    sendAIReply(summarizeText(text));
  }

  function autoResizeChatInput() {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  }

  sendBtn.addEventListener('click', handleSend);
  summarizeBtn.addEventListener('click', handleSummarize);
  chatInput.addEventListener('input', autoResizeChatInput);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  /* ---------------------------------------------------
     4. FLASHCARDS
  --------------------------------------------------- */
  const FLASHCARD_DECK = [
    { front: 'What is the powerhouse of the cell?', back: 'The mitochondria.' },
    { front: 'What is the derivative of sin(x)?', back: 'cos(x)' },
    { front: 'What does "ser" mean in Spanish?', back: 'To be (permanent state).' },
    { front: 'What is Newton\'s Second Law?', back: 'Force equals mass times acceleration (F = ma).' },
    { front: 'What is the capital of France?', back: 'Paris.' },
  ];

  let cardIndex = 0;
  const flashcard = document.getElementById('flashcard');
  const cardFront = document.getElementById('cardFront');
  const cardBack = document.getElementById('cardBack');
  const cardCounter = document.getElementById('cardCounter');
  const prevCardBtn = document.getElementById('prevCardBtn');
  const nextCardBtn = document.getElementById('nextCardBtn');
  const shuffleCardBtn = document.getElementById('shuffleCardBtn');

  function renderCard() {
    flashcard.classList.remove('is-flipped');
    setTimeout(() => {
      cardFront.textContent = FLASHCARD_DECK[cardIndex].front;
      cardBack.textContent = FLASHCARD_DECK[cardIndex].back;
    }, 150);
    cardCounter.textContent = `${cardIndex + 1} / ${FLASHCARD_DECK.length}`;
  }

  flashcard.addEventListener('click', () => {
    flashcard.classList.toggle('is-flipped');
  });

  prevCardBtn.addEventListener('click', () => {
    cardIndex = (cardIndex - 1 + FLASHCARD_DECK.length) % FLASHCARD_DECK.length;
    renderCard();
  });

  nextCardBtn.addEventListener('click', () => {
    cardIndex = (cardIndex + 1) % FLASHCARD_DECK.length;
    renderCard();
  });

  shuffleCardBtn.addEventListener('click', () => {
    let newIndex = cardIndex;
    while (newIndex === cardIndex && FLASHCARD_DECK.length > 1) {
      newIndex = Math.floor(Math.random() * FLASHCARD_DECK.length);
    }
    cardIndex = newIndex;
    renderCard();
  });

  renderCard();

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
     6. WEEK STRIP (mini calendar)
  --------------------------------------------------- */
  const weekStrip = document.getElementById('weekStrip');
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function renderWeekStrip() {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);

    weekStrip.innerHTML = '';
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      const chip = document.createElement('div');
      chip.className = 'day-chip' + (i === currentDay ? ' is-today' : '');
      chip.innerHTML = `
        <span class="dow">${dayLabels[i]}</span>
        <span class="dnum">${date.getDate()}</span>
      `;
      weekStrip.appendChild(chip);
    }
  }

  renderWeekStrip();

  /* ---------------------------------------------------
     7. TODAY'S GOALS SUMMARY (simple demo counter)
  --------------------------------------------------- */
  const goalsDoneLabel = document.getElementById('goalsDoneLabel');
  let goalsDone = 2;
  const goalsTotal = 4;
  goalsDoneLabel.textContent = `${goalsDone}/${goalsTotal}`;

});