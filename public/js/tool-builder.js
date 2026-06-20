/**
 * tool-builder.js — Stage 2 refinement engine.
 * Receives toolId from URL, loads the tool, opens Sparky refinement chat.
 * Requires: auth, db, functions initialized on window by tool-builder.html
 */

// ── State ──────────────────────────────────────────────────────────────────────

const state = {
  toolId:              '',
  creatorId:           '',
  currentSystemPrompt: '',
  shape:               '',
  toolName:            '',
  isPublished:         false,
  viewMode:            'desktop',
  hubSlug:             '',
  chatHistory:         [],
  approved:            false,
};

// ── Auth + load ────────────────────────────────────────────────────────────────

auth.onAuthStateChanged(user => {
  if (!user) { window.location.href = '/signon.html?redirect=' + encodeURIComponent(window.location.href); return; }

  db.collection('creators').doc(user.uid).get().then(doc => {
    if (!doc.exists || doc.data().ownerId !== user.uid) {
      window.location.href = '/hub/setup';
      return;
    }
    state.creatorId = user.uid;
    state.hubSlug   = doc.data().slug || '';
    _injectBranding(doc.data().branding);
    loadTool(user.uid);
  });
});

function _injectBranding(branding) {
  if (!branding) return;
  const overrides = [];
  if (branding.primaryColor) overrides.push('--yellow: ' + branding.primaryColor + ';');
  if (branding.accentColor)  overrides.push('--purple: ' + branding.accentColor  + ';');
  if (branding.bgColor)      overrides.push('--bg: '     + branding.bgColor      + ';');
  if (!overrides.length) return;
  const style = document.createElement('style');
  style.textContent = ':root { ' + overrides.join(' ') + ' }';
  document.head.appendChild(style);
}

function loadTool(uid) {
  const params = new URLSearchParams(window.location.search);
  const toolId = params.get('toolId');

  if (!toolId) {
    // No tool — send them to the Build Agent to start fresh
    window.location.href = '/build-agent';
    return;
  }

  state.toolId = toolId;

  db.collection('creators').doc(uid).collection('tools').doc(toolId).get()
    .then(doc => {
      if (!doc.exists) {
        window.location.href = '/build-agent';
        return;
      }
      const tool = doc.data();

      state.currentSystemPrompt = tool.systemPrompt || '';
      state.shape               = tool.shape        || 'diagnostic';
      state.toolName            = tool.toolName      || 'Untitled Tool';
      state.isPublished         = tool.isPublished   || false;

      document.getElementById('bar-tool-name').value = state.toolName;
      document.title = state.toolName + ' — Tool Builder';

      // Live preview is the first thing the creator sees
      showLivePreview(toolId);

      // Sparky opens the refinement chat
      startRefinement();
    })
    .catch(() => { window.location.href = '/build-agent'; });
}

// ── Refinement chat ────────────────────────────────────────────────────────────

function startRefinement() {
  addSparkyMsg(
    'Your tool is live in the preview! 🎉 Try it as your audience would — then come back and tell me what you\'d like to change. Say <strong>"looks good"</strong> when you\'re happy with it.'
  );
  setInputVisible(true);
  // No auto-focus — creator should be looking at the preview, not the chat
}

function sendRefinement() {
  const inp  = document.getElementById('chat-input');
  const text = inp.value.trim();
  if (!text || state.approved) return;

  clearInput();
  addUserMsg(text);
  state.chatHistory.push({ role: 'user', content: text });

  setInputVisible(false);
  showBuilding('Thinking...');

  const fn = functions.httpsCallable('refineToolPrompt');
  fn({
    creatorId:           state.creatorId,
    toolId:              state.toolId,
    messages:            state.chatHistory,
    currentSystemPrompt: state.currentSystemPrompt,
  })
  .then(result => {
    hideBuilding();
    const { message, action } = result.data;

    state.chatHistory.push({ role: 'assistant', content: message });
    addSparkyMsg(message);

    if (action === 'update_prompt') {
      // refineToolPrompt already saved the new prompt — reload preview
      // Re-fetch the updated prompt so future refinements have the right base
      db.collection('creators').doc(state.creatorId)
        .collection('tools').doc(state.toolId).get()
        .then(doc => {
          if (doc.exists) state.currentSystemPrompt = doc.data().systemPrompt || state.currentSystemPrompt;
        });
      showLivePreview(state.toolId);
      setInputVisible(true);
    } else if (action === 'approved') {
      state.approved = true;
      setInputVisible(false);
      showPublishPrompt();
    } else {
      // 'none' — conversation continues, ask clarifying question etc.
      setInputVisible(true);
      focusInput();
    }
  })
  .catch(err => {
    hideBuilding();
    addSparkyMsg('Something went wrong — want to try that again?');
    setInputVisible(true);
    focusInput();
  });
}

function showPublishPrompt() {
  const msgs = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = 'publish-nudge';
  div.innerHTML = '<button class="btn-primary" style="width:100%" onclick="publishTool()">Publish Your Tool →</button>';
  msgs.appendChild(div);
  scrollChat();
}

// ── Chat helpers ───────────────────────────────────────────────────────────────

function addSparkyMsg(html) {
  const msgs = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = 'msg sparky';
  div.innerHTML = `
    <div class="msg-avatar">⚡</div>
    <div class="msg-bubble">${html}</div>`;
  msgs.appendChild(div);
  scrollChat();
}

function addUserMsg(text) {
  const msgs = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = 'msg user';
  div.innerHTML = `
    <div class="msg-avatar">C</div>
    <div class="msg-bubble">${escHtml(text)}</div>`;
  msgs.appendChild(div);
  scrollChat();
}

function scrollChat() {
  const msgs = document.getElementById('chat-messages');
  msgs.scrollTop = msgs.scrollHeight;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function setInputVisible(show) {
  document.getElementById('chat-input-wrap').style.display = show ? 'flex' : 'none';
}

function clearInput() {
  const inp = document.getElementById('chat-input');
  inp.value = '';
  inp.style.height = '';
}

function autoGrow(el) {
  el.style.height = '';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function handleInputKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendRefinement();
  }
}

function focusInput() {
  setTimeout(() => document.getElementById('chat-input').focus(), 100);
}

function showBuilding(label) {
  const el = document.getElementById('building-msg');
  el.querySelector('span').textContent = label || 'Updating...';
  el.classList.add('show');
}

function hideBuilding() {
  document.getElementById('building-msg').classList.remove('show');
}

// ── Live preview ───────────────────────────────────────────────────────────────

function showLivePreview(toolId) {
  document.getElementById('preview-static').style.display  = 'none';
  document.getElementById('preview-desktop').style.display = 'block';

  const src = `/hub/tool-preview?toolId=${toolId}&creatorId=${state.creatorId}&draft=true`;
  document.getElementById('preview-iframe').src        = src;
  document.getElementById('preview-mobile-iframe').src = src;
}

function setView(mode) {
  state.viewMode = mode;
  const isDesktop = mode === 'desktop';
  document.getElementById('toggle-desktop').classList.toggle('active',  isDesktop);
  document.getElementById('toggle-mobile').classList.toggle('active',  !isDesktop);
  document.getElementById('preview-desktop').style.display = isDesktop ? 'block' : 'none';
  document.getElementById('preview-mobile').style.display  = isDesktop ? 'none'  : 'block';
}

function toggleTryMode() {
  const btn = document.getElementById('try-mode-btn');
  const active = btn.classList.toggle('active');
  btn.textContent = active ? 'Exit Try Mode' : 'Try as User';
  if (state.toolId) showLivePreview(state.toolId);
}

// ── Top bar actions ────────────────────────────────────────────────────────────

document.getElementById('bar-tool-name').addEventListener('input', function() {
  state.toolName = this.value;
});

function saveDraft() {
  if (!state.toolId) {
    alert('Finish building your tool first, then save.');
    return;
  }
  const btn = document.getElementById('save-draft-btn');
  btn.disabled    = true;
  btn.textContent = 'Saving...';

  db.collection('creators').doc(state.creatorId).collection('tools').doc(state.toolId)
    .update({
      toolName:     state.toolName || 'Untitled Tool',
      lastEditedAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      btn.textContent = 'Saved ✓';
      setTimeout(() => { btn.disabled = false; btn.textContent = 'Save Draft'; }, 1800);
    })
    .catch(err => {
      alert('Error: ' + err.message);
      btn.disabled = false;
      btn.textContent = 'Save Draft';
    });
}

function publishTool() {
  if (!state.toolId) { alert('Build your tool first.'); return; }
  const btn = document.getElementById('publish-btn');
  btn.disabled    = true;
  btn.textContent = 'Publishing...';

  db.collection('creators').doc(state.creatorId).collection('tools').doc(state.toolId)
    .update({
      isPublished:  true,
      lastEditedAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      state.isPublished = true;
      btn.textContent   = 'Published ✓';
      btn.style.background = '#16A34A';
      setTimeout(() => {
        btn.disabled    = false;
        btn.textContent = 'Published';
      }, 2000);
      addSparkyMsg('Your tool is live! 🎉 Members can find it in your hub now.');
    })
    .catch(err => {
      alert('Error: ' + err.message);
      btn.disabled    = false;
      btn.textContent = 'Publish';
    });
}
