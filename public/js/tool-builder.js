/**
 * tool-builder.js
 * Powers the two-panel AI tool builder chat flow.
 * Requires: auth, db, functions initialized on window by tool-builder.html
 */

// ── Data ───────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'attract',   icon: '🎯', name: 'Attract',   desc: 'Bring leads in' },
  { key: 'qualify',   icon: '✅', name: 'Qualify',   desc: 'Filter the right clients' },
  { key: 'transform', icon: '🚀', name: 'Transform', desc: 'Deliver results' },
  { key: 'create',    icon: '🛠️', name: 'Create',    desc: 'Build their business' },
];

const TEMPLATES = {
  attract: [
    { key: 'The Quiz',        desc: '"What type of [X] are you?" — personality style, most viral, highest opt-in' },
    { key: 'The Assessment',  desc: '"Score your [X]" — gives a number/grade they want to improve' },
    { key: 'The Calculator',  desc: '"How much are you losing by not fixing [X]?" — money or time, creates urgency' },
  ],
  qualify: [
    { key: 'The Fit Checker',          desc: '"Is [offer] right for you?" — yes/no questions that pre-qualify before a sales call' },
    { key: 'The Readiness Assessment', desc: '"Are you ready for [program]?" — scores readiness, recommends next step' },
  ],
  transform: [
    { key: 'The Action Plan Generator', desc: 'Personalized next steps based on their answers' },
    { key: 'The Goal Setter',           desc: 'Helps them get crystal clear on what they want' },
    { key: 'The Mindset Audit',         desc: 'Identifies blocks and limiting beliefs' },
  ],
  create: [
    { key: 'The Niche Clarity Tool', desc: 'Helps them find their profitable focus' },
    { key: 'The Offer Builder',      desc: 'Turns their expertise into a product idea' },
    { key: 'The Bio Writer',         desc: 'Creates their introvert-friendly social bio from answers' },
  ],
};

// ── State ──────────────────────────────────────────────────────────────────────

const state = {
  step:            0,
  category:        '',
  template:        '',
  toolName:        '',
  audience:        '',
  outcome:         '',
  tone:            '',
  questionCount:   0,
  customQuestions: '',
  toolId:          null,
  isPublished:     false,
  isDirty:         false,
  tryMode:         false,
  viewMode:        'desktop',
  creatorId:       '',
  hubSlug:         '',
};

// ── Auth guard ─────────────────────────────────────────────────────────────────

auth.onAuthStateChanged(user => {
  if (!user) { window.location.href = '/signon.html?redirect=/hub/tool-builder'; return; }
  db.collection('creators').doc(user.uid).get().then(doc => {
    if (!doc.exists || doc.data().ownerId !== user.uid) {
      window.location.href = '/hub/setup';
      return;
    }
    state.creatorId = user.uid;
    state.hubSlug   = doc.data().slug || '';
    _injectBranding(doc.data().branding);
    startFlow();
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

function addChoiceGroup(html) {
  const msgs = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = 'choice-group';
  div.innerHTML  = html;
  msgs.appendChild(div);
  scrollChat();
}

function scrollChat() {
  const msgs = document.getElementById('chat-messages');
  msgs.scrollTop = msgs.scrollHeight;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
    sendAnswer();
  }
}

// ── Flow ───────────────────────────────────────────────────────────────────────

function startFlow() {
  state.step = 0;
  setInputVisible(false);
  addSparkyMsg("Hey! I'm Sparky. Let's build your AI tool together. It'll only take a couple minutes. 🚀");
  setTimeout(() => askStep(1), 600);
}

function askStep(step) {
  state.step = step;

  if (step === 1) {
    addSparkyMsg('First — what category fits your tool?');
    addChoiceGroup(`<div class="choice-tiles">
      ${CATEGORIES.map(c =>
        `<button class="choice-tile" onclick="pickCategory('${c.key}', this)">
          <div class="choice-tile-icon">${c.icon}</div>
          <div class="choice-tile-name">${c.name}</div>
          <div class="choice-tile-desc">${c.desc}</div>
        </button>`
      ).join('')}
    </div>`);
    setInputVisible(false);
    return;
  }

  if (step === 2) {
    const templates = TEMPLATES[state.category] || [];
    addSparkyMsg('Which template fits best?');
    addChoiceGroup(`<div class="template-tiles">
      ${templates.map(t =>
        `<button class="template-tile" onclick="pickTemplate('${escHtml(t.key)}', this)">
          <div class="template-tile-name">${t.key}</div>
          <div class="template-tile-desc">${t.desc}</div>
        </button>`
      ).join('')}
    </div>`);
    setInputVisible(false);
    return;
  }

  if (step === 3) {
    addSparkyMsg("What's your tool called?");
    setInputVisible(true);
    focusInput();
    return;
  }

  if (step === 4) {
    addSparkyMsg('Who is it for? (your target audience)');
    setInputVisible(true);
    focusInput();
    return;
  }

  if (step === 5) {
    addSparkyMsg("What's the main outcome they'll get from this tool?");
    setInputVisible(true);
    focusInput();
    return;
  }

  if (step === 6) {
    addSparkyMsg('Pick your tone:');
    addChoiceGroup(`<div class="tone-tiles">
      ${['Friendly','Professional','Motivational'].map(t =>
        `<button class="tone-tile" onclick="pickTone('${t.toLowerCase()}', this)">${t}</button>`
      ).join('')}
    </div>`);
    setInputVisible(false);
    return;
  }

  if (step === 7) {
    addSparkyMsg('How many questions should it ask?');
    addChoiceGroup(`<div class="count-tiles">
      ${[3,5,7].map(n =>
        `<button class="count-tile" onclick="pickCount(${n}, this)">
          <div class="count-num">${n}</div>
          <div class="count-label">questions</div>
        </button>`
      ).join('')}
    </div>`);
    setInputVisible(false);
    return;
  }

  if (step === 8) {
    addSparkyMsg('Any specific questions you want included? <span style="color:var(--text3);font-size:12px;">(optional)</span>');
    setInputVisible(true);
    addSkipButton();
    focusInput();
    return;
  }
}

function focusInput() {
  setTimeout(() => document.getElementById('chat-input').focus(), 100);
}

function addSkipButton() {
  const wrap = document.getElementById('chat-input-wrap');
  const existing = wrap.querySelector('.skip-btn');
  if (existing) existing.remove();
  const btn = document.createElement('button');
  btn.className   = 'skip-btn';
  btn.textContent = 'Skip';
  btn.onclick     = () => {
    btn.remove();
    clearInput();
    state.customQuestions = '';
    addUserMsg('Skip');
    buildTool();
  };
  wrap.insertBefore(btn, wrap.firstChild);
}

function removeSkipButton() {
  const btn = document.getElementById('chat-input-wrap')?.querySelector('.skip-btn');
  if (btn) btn.remove();
}

// ── Pick handlers ──────────────────────────────────────────────────────────────

function pickCategory(key, el) {
  document.querySelectorAll('.choice-tile').forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');
  state.category = key;
  const label = CATEGORIES.find(c => c.key === key)?.name || key;
  addUserMsg(label);
  updateStaticPreview();
  setTimeout(() => askStep(2), 400);
}

function pickTemplate(key, el) {
  document.querySelectorAll('.template-tile').forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');
  state.template = key;
  addUserMsg(key);
  updateStaticPreview();
  setTimeout(() => askStep(3), 400);
}

function pickTone(key, el) {
  document.querySelectorAll('.tone-tile').forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');
  state.tone = key;
  addUserMsg(key.charAt(0).toUpperCase() + key.slice(1));
  updateStaticPreview();
  setTimeout(() => askStep(7), 400);
}

function pickCount(n, el) {
  document.querySelectorAll('.count-tile').forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');
  state.questionCount = n;
  addUserMsg(n + ' questions');
  updateStaticPreview();
  setTimeout(() => askStep(8), 400);
}

// ── Send text answer ───────────────────────────────────────────────────────────

function sendAnswer() {
  const inp  = document.getElementById('chat-input');
  const text = inp.value.trim();
  if (!text) return;

  clearInput();
  removeSkipButton();
  addUserMsg(text);

  if (state.step === 3) {
    state.toolName = text;
    document.getElementById('bar-tool-name').value = text;
    updateStaticPreview();
    askStep(4);
    return;
  }
  if (state.step === 4) {
    state.audience = text;
    updateStaticPreview();
    askStep(5);
    return;
  }
  if (state.step === 5) {
    state.outcome = text;
    updateStaticPreview();
    askStep(6);
    return;
  }
  if (state.step === 8) {
    state.customQuestions = text;
    buildTool();
  }
}

// ── Static preview updates ─────────────────────────────────────────────────────

function updateStaticPreview() {
  const totalSteps = 8;
  const progress   = Math.round((state.step / totalSteps) * 100);
  document.getElementById('prev-progress').style.width = progress + '%';

  if (state.toolName) {
    document.getElementById('prev-title').textContent = state.toolName;
  }
  if (state.audience) {
    document.getElementById('prev-sub').textContent = 'For ' + state.audience;
  }
  if (state.template) {
    document.getElementById('prev-question').textContent = state.template + ' — loading questions...';
  }
}

// ── Build tool ─────────────────────────────────────────────────────────────────

function buildTool() {
  setInputVisible(false);
  document.getElementById('building-msg').classList.add('show');
  addSparkyMsg('⚡ Building your tool now...');

  const fn = functions.httpsCallable('generateToolPrompt');
  fn({
    category:        state.category,
    template:        state.template,
    toolName:        state.toolName,
    audience:        state.audience,
    outcome:         state.outcome,
    tone:            state.tone,
    questionCount:   state.questionCount,
    customQuestions: state.customQuestions,
  }).then(result => {
    const systemPrompt = result.data.systemPrompt;
    return saveTool(systemPrompt);
  }).then(toolId => {
    state.toolId = toolId;
    document.getElementById('building-msg').classList.remove('show');
    addSparkyMsg('Your tool is ready! 🎉 Try it in the preview →');
    showLivePreview(toolId);
  }).catch(err => {
    document.getElementById('building-msg').classList.remove('show');
    let msg = err.message || 'Something went wrong.';
    if (msg.includes('No API key') || msg.includes('failed-precondition')) {
      msg = 'No API key found. <a href="/hub/admin-settings" style="color:var(--purple);font-weight:700;">Add your API key in Settings</a> and come back.';
    }
    addSparkyMsg(msg);
    setInputVisible(true);
  });
}

function saveTool(systemPrompt) {
  const toolName = state.toolName || document.getElementById('bar-tool-name').value.trim() || 'Untitled Tool';
  const toolRef  = state.toolId
    ? db.collection('creators').doc(state.creatorId).collection('tools').doc(state.toolId)
    : db.collection('creators').doc(state.creatorId).collection('tools').doc();

  return toolRef.set({
    toolName,
    category:     state.category,
    template:     state.template,
    systemPrompt,
    config: {
      audience:        state.audience,
      outcome:         state.outcome,
      tone:            state.tone,
      questionCount:   state.questionCount,
      customQuestions: state.customQuestions,
    },
    isPublished:   state.isPublished,
    createdAt:     firebase.firestore.FieldValue.serverTimestamp(),
    lastEditedAt:  firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true }).then(() => toolRef.id);
}

// ── Live preview ───────────────────────────────────────────────────────────────

function showLivePreview(toolId) {
  document.getElementById('preview-static').style.display   = 'none';
  document.getElementById('preview-desktop').style.display  = 'block';

  const src = `/hub/tool-preview?toolId=${toolId}&creatorId=${state.creatorId}&draft=true`;
  document.getElementById('preview-iframe').src        = src;
  document.getElementById('preview-mobile-iframe').src = src;
}

function setView(mode) {
  state.viewMode = mode;
  const isDesktop = mode === 'desktop';
  document.getElementById('toggle-desktop').classList.toggle('active', isDesktop);
  document.getElementById('toggle-mobile').classList.toggle('active', !isDesktop);
  document.getElementById('preview-desktop').style.display = isDesktop ? 'block' : 'none';
  document.getElementById('preview-mobile').style.display  = isDesktop ? 'none'  : 'block';
}

function toggleTryMode() {
  state.tryMode = !state.tryMode;
  const btn = document.getElementById('try-mode-btn');
  btn.textContent = state.tryMode ? 'Exit Try Mode' : 'Try as User';
  btn.classList.toggle('active', state.tryMode);
  // iframe is already interactive; try mode just reloads without the builder controls visible
  if (state.toolId) showLivePreview(state.toolId);
}

// ── Top bar actions ────────────────────────────────────────────────────────────

document.getElementById('bar-tool-name').addEventListener('input', function() {
  state.toolName = this.value;
  document.getElementById('prev-title').textContent = this.value || 'Your Tool Name';
  state.isDirty = true;
});

function saveDraft() {
  if (!state.toolId && !state.toolName) {
    alert('Finish building your tool first, then save.');
    return;
  }
  const btn = document.getElementById('save-draft-btn');
  btn.disabled    = true;
  btn.textContent = 'Saving...';

  const toolRef = state.toolId
    ? db.collection('creators').doc(state.creatorId).collection('tools').doc(state.toolId)
    : null;
  if (!toolRef) { btn.disabled = false; btn.textContent = 'Save Draft'; return; }

  toolRef.update({
    toolName:     state.toolName || 'Untitled Tool',
    lastEditedAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    btn.textContent = 'Saved ✓';
    setTimeout(() => { btn.disabled = false; btn.textContent = 'Save Draft'; }, 1800);
  }).catch(err => {
    alert('Error: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Save Draft';
  });
}

function publishTool() {
  if (!state.toolId) {
    alert('Finish building your tool first, then publish.');
    return;
  }
  const btn = document.getElementById('publish-btn');
  btn.disabled    = true;
  btn.textContent = 'Publishing...';

  db.collection('creators').doc(state.creatorId).collection('tools').doc(state.toolId)
    .update({
      isPublished:  true,
      lastEditedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      state.isPublished = true;
      btn.textContent = 'Published ✓';
      btn.style.background = '#16A34A';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'Published';
      }, 2000);
      addSparkyMsg('Your tool is live! 🎉 Members can access it from the hub now.');
    })
    .catch(err => {
      alert('Error: ' + err.message);
      btn.disabled = false;
      btn.textContent = 'Publish';
    });
}
