// ============================================
// Toast helper (used across dashboard/billing/settings/playground)
// ============================================
function showToast(message) {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${message}</span>`;
  stack.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'opacity .25s, transform .25s';
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

// ============================================
// Sidebar toggle (mobile drawer)
// ============================================
const sidebar = document.querySelector('.app-sidebar');
const menuToggle = document.querySelector('.app-menu-toggle');
let scrim = document.querySelector('.sidebar-scrim');
if (sidebar && menuToggle) {
  if (!scrim) {
    scrim = document.createElement('div');
    scrim.className = 'sidebar-scrim';
    document.body.appendChild(scrim);
  }
  const closeSidebar = () => { sidebar.classList.remove('open'); scrim.classList.remove('open'); };
  const openSidebar = () => { sidebar.classList.add('open'); scrim.classList.add('open'); };
  menuToggle.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  scrim.addEventListener('click', closeSidebar);
  window.addEventListener('resize', () => { if (window.innerWidth > 900) closeSidebar(); });
}

// ============================================
// Playground: tool switcher
// ============================================
const pgToolBtns = document.querySelectorAll('.pg-tool-btn');
const pgPanels = document.querySelectorAll('.pg-panel');
pgToolBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tool;
    pgToolBtns.forEach(b => b.classList.remove('active'));
    pgPanels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.querySelector(`.pg-panel[data-tool="${target}"]`);
    if (panel) panel.classList.add('active');
  });
});

// ============================================
// Playground: mock chat send
// ============================================
const chatForm = document.getElementById('chatForm');
const chatWindow = document.getElementById('chatWindow');
const chatInput = document.getElementById('chatInput');

function addChatMessage(role, text) {
  const msg = document.createElement('div');
  msg.className = `chat-msg ${role}`;
  const initials = role === 'user' ? 'You' : 'AX';
  msg.innerHTML = `
    <div class="chat-avatar">${initials}</div>
    <div class="chat-bubble">${text}</div>
  `;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return msg;
}

const mockReplies = [
  "Got it — routing that to the right model now. Here's a first pass based on your brief.",
  "I read that as a tone-and-structure request, so I kept it tight and led with the strongest point.",
  "Done. I kept your existing formatting conventions and flagged one spot worth a second look.",
  "Here's a draft. Want it warmer, more concise, or more technical?"
];

if (chatForm && chatWindow && chatInput) {
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    addChatMessage('user', text);
    chatInput.value = '';
    chatInput.style.height = 'auto';

    const typingMsg = document.createElement('div');
    typingMsg.className = 'chat-msg assistant';
    typingMsg.innerHTML = `<div class="chat-avatar">AX</div><div class="chat-bubble"><span class="chat-typing"><span></span><span></span><span></span></span></div>`;
    chatWindow.appendChild(typingMsg);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    setTimeout(() => {
      typingMsg.remove();
      const reply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
      addChatMessage('assistant', reply);
    }, 900 + Math.random() * 500);
  });

  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
  });
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.requestSubmit();
    }
  });
}

// ============================================
// Playground: mock generation (image/video/voice/code)
// ============================================
document.querySelectorAll('.gen-generate-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const panel = btn.closest('.pg-panel');
    const outputs = panel.querySelectorAll('.gen-output');
    outputs.forEach(o => {
      o.classList.add('loading');
      o.innerHTML = '';
    });
    setTimeout(() => {
      outputs.forEach((o, i) => {
        o.classList.remove('loading');
        const gradients = [
          'linear-gradient(155deg,#8B7CF6 0%,#3B2E82 55%,#120C24 100%)',
          'linear-gradient(155deg,#F6C453 0%,#F2657A 55%,#2A0E18 100%)',
          'linear-gradient(155deg,#4FD1C5 0%,#1F6E68 55%,#081615 100%)',
          'linear-gradient(155deg,#49D5FF 0%,#8B7CF6 55%,#141024 100%)'
        ];
        o.style.background = gradients[i % gradients.length];
      });
      showToast('Generation complete');
    }, 1400);
  });
});

// ============================================
// Chips (single-select within a row)
// ============================================
document.querySelectorAll('.chip-row').forEach(row => {
  row.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      row.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
});

// ============================================
// Settings: tabs
// ============================================
const settingsTabs = document.querySelectorAll('.settings-tab');
const settingsPanels = document.querySelectorAll('.settings-panel');
settingsTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    settingsTabs.forEach(t => t.classList.remove('active'));
    settingsPanels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.settings-panel[data-tab="${target}"]`)?.classList.add('active');
  });
});

// ============================================
// Generic mock-save buttons (settings, billing) — just confirms via toast
// ============================================
document.querySelectorAll('[data-mock-save]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    showToast(btn.dataset.mockSave || 'Saved');
  });
});
