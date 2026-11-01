/* =========================================================
   nova-fab.js — FLOATING NOVA CHAT BUBBLE
   Handles the open/close UI + local message sending for the
   floating NOVA icon + panel (bottom-right). Kept separate
   from app.js on purpose — does not touch the existing
   "AI Chat" dashboard widget or its logic in app.js.

   NOTE: Replies here are canned/local (no backend, no API
   key, no OpenAI call) — just so the panel feels alive.
   Swap generateNovaReply() for a real API call later.
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const novaFab = document.getElementById('novaFab');
  const novaPanel = document.getElementById('novaPanel');
  const novaPanelClose = document.getElementById('novaPanelClose');
  const novaPanelExpand = document.getElementById('novaPanelExpand');
  const novaPanelInput = document.getElementById('novaPanelInput');
  const novaPanelSendBtn = document.getElementById('novaPanelSendBtn');
  const novaPanelMessages = document.getElementById('novaPanelMessages');

  if (!novaFab || !novaPanel) return; // safety guard

  function openNovaPanel() {
    novaPanel.classList.remove('hidden');
    novaFab.classList.add('hidden');
    novaPanelInput.focus();
  }

  function closeNovaPanel() {
    novaPanel.classList.add('hidden');
    novaFab.classList.remove('hidden');
  }

  novaFab.addEventListener('click', openNovaPanel);
  novaPanelClose.addEventListener('click', closeNovaPanel);
  if (novaPanelExpand) {
    novaPanelExpand.addEventListener('click', () => {
      closeNovaPanel();
      if (typeof window.showView === 'function') {
        window.showView('chat');
      }
    });
  }

  // Auto-resize the textarea as the user types
  function autoResizeNovaInput() {
    novaPanelInput.style.height = 'auto';
    novaPanelInput.style.height = Math.min(novaPanelInput.scrollHeight, 120) + 'px';
  }
  novaPanelInput.addEventListener('input', autoResizeNovaInput);

  /* ---------------------------------------------------
     Local message rendering (no DB save, no API call —
     this panel is a separate UI shell from the dashboard
     "AI Chat" widget, which already saves to IndexedDB).
  --------------------------------------------------- */
  function scrollNovaToBottom() {
    novaPanelMessages.scrollTop = novaPanelMessages.scrollHeight;
  }

  function renderNovaMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `chat-msg chat-msg-${sender}`;

    const avatar = document.createElement('div');
    avatar.className = `chat-avatar chat-avatar-${sender}`;
    avatar.textContent = sender === 'ai' ? 'AI' : 'You';

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    if (sender === 'ai' && typeof window.formatStudyResponse === 'function') {
      bubble.innerHTML = window.formatStudyResponse(text);
    } else {
      bubble.textContent = text;
    }

    msg.appendChild(avatar);
    msg.appendChild(bubble);
    novaPanelMessages.appendChild(msg);
    scrollNovaToBottom();
  }

  function showNovaTyping() {
    const existing = novaPanelMessages ? novaPanelMessages.querySelectorAll('.chat-msg-typing') : [];
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
    novaPanelMessages.appendChild(msg);
    scrollNovaToBottom();
    return msg;
  }

  const NOVA_REPLIES = [
    "Great question. Let's break it down step by step, starting with the core concept before applying it to an example.",
    "Here's a simple way to remember this: connect the idea to something you already know, then test yourself without looking at your notes.",
    "That topic often trips students up. Try reviewing the definition first, then work through two practice problems to reinforce it.",
    "Good instinct to ask about this — it usually shows up on exams. I'd focus your next session on the underlying formula and one worked example.",
    "Think of it in three parts: what it is, why it matters, and how it's applied."
  ];

  function generateNovaReply() {
    return NOVA_REPLIES[Math.floor(Math.random() * NOVA_REPLIES.length)];
  }

  let isNovaWaiting = false;

  async function sendNovaReply(userMessage) {
    if (isNovaWaiting) return;
    isNovaWaiting = true;
    if (novaPanelSendBtn) novaPanelSendBtn.disabled = true;

    const typingMsg = showNovaTyping();
    try {
      const studentContext = window.currentUser ? {
        email: window.currentUser.email || '',
        userId: window.currentUser.email || '',
        name: window.currentUser.name || 'Student',
        university: window.currentUser.university || 'AKTU',
        program: window.currentUser.program || 'B.Tech',
        branch: window.currentUser.branch || 'CSE',
        year: window.currentUser.year || '2nd Year',
        semester: window.currentUser.semester || 'Semester 3',
        subjects: Array.isArray(window.currentUser.subjects) ? window.currentUser.subjects : []
      } : null;

      const userEmail = window.currentUser ? (window.currentUser.email || '') : '';
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          userEmail: userEmail,
          studentContext
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (typingMsg && typingMsg.parentNode) typingMsg.remove();
        renderNovaMessage(data.reply || generateNovaReply(), 'ai');
        return;
      }
    } catch (e) {
      console.warn('Nova API note:', e.message);
    } finally {
      isNovaWaiting = false;
      if (novaPanelSendBtn) novaPanelSendBtn.disabled = false;
      if (novaPanelInput) novaPanelInput.focus();
    }
    if (typingMsg && typingMsg.parentNode) typingMsg.remove();
    renderNovaMessage(generateNovaReply(), 'ai');
  }

  function handleNovaSend() {
    if (isNovaWaiting) return;
    const text = novaPanelInput.value.trim();
    if (!text) return;
    renderNovaMessage(text, 'user');
    novaPanelInput.value = '';
    autoResizeNovaInput();
    sendNovaReply(text);
  }

  novaPanelSendBtn.addEventListener('click', handleNovaSend);
  novaPanelInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNovaSend();
    }
  });

  // Close on Escape for convenience
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !novaPanel.classList.contains('hidden')) {
      closeNovaPanel();
    }
  });

});
