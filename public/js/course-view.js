var firebaseConfig = {
  apiKey: "AIzaSyCJ0aVMa7M_Bs_Rg7otoAuckI86OtsFUgE",
  authDomain: "toolspark-2d62d.firebaseapp.com",
  projectId: "toolspark-2d62d",
  storageBucket: "toolspark-2d62d.firebasestorage.app",
  messagingSenderId: "82966513396",
  appId: "1:82966513396:web:f52b52b0ed2dc9537ac0a1"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var auth = firebase.auth();
var storage = firebase.storage();

// ── STATE ──
let currentUser = null;
let courseId = null;
let courseData = null;
let lessons = [];
let currentLesson = null;
let currentIndex = 0;
let completedLessons = new Set();
let progressDocId = null;
let progressData = null;
let isAdmin = false;
let editMode = false;
let lessonEditorSelection = null;
let selectedLessonImageFile = null;
let currentLessonImageUrl = '';

// ── BOOT ──
const params = new URLSearchParams(window.location.search);
courseId = params.get('courseId');
const initLessonId = params.get('lessonId');

if (!courseId) window.location.href = 'dashboard.html';

auth.onAuthStateChanged(async user => {
  if (!user) { window.location.href = 'signon.html'; return; }
  currentUser = user;
  progressDocId = user.uid + '_' + courseId;
  try {
    var userSnap = await db.collection('users').doc(user.uid).get();
    var userRole = userSnap.exists ? userSnap.data().userRole : '';
    if (userRole === 'admin') {
      isAdmin = true;
    }
    updateEditModeButton();
    await Promise.all([loadCourse(), loadProgress()]);
    pickStartLesson();
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('app').classList.add('visible');
  } catch(e) {
    document.getElementById('loading-screen').innerHTML =
      '<div style="color:#9A9488;padding:2rem;text-align:center;font-family:Lato,sans-serif;">' +
      'Could not load course.<br><a href="dashboard.html" style="color:#C9A84C;font-weight:700;">← Back to Dashboard</a></div>';
  }
});

function syncLessonVideoSection() {
  var typeInput = document.getElementById('edit-lesson-type');
  var videoSection = document.getElementById('editor-video-section');
  var imageSection = document.getElementById('editor-image-section');
  if (!typeInput) return;
  var t = typeInput.value;
  if (videoSection) videoSection.style.display = (t === 'video' || t === 'mixed') ? '' : 'none';
  if (imageSection) imageSection.style.display = t === 'image' ? '' : 'none';
}

function updateLessonVideoPreview() {
  var input = document.getElementById('edit-lesson-video-url');
  var preview = document.getElementById('editor-video-preview');
  if (!input || !preview) return;

  var meta = parseVideoUrl(input.value);
  if (!meta) {
    preview.innerHTML = '';
    return;
  }

  if (meta.provider === 'youtube') {
    preview.innerHTML = '<img class="editor-video-thumb" src="' + meta.thumbnailUrl + '" alt="Video thumbnail preview">';
    return;
  }

  if (meta.provider === 'loom') {
    preview.innerHTML = '<div class="editor-video-badge">&#10003; Loom video linked</div>';
    return;
  }

  preview.innerHTML = '';
}



function renderLessonResourceLinks(resourceLinks) {
  var section = document.getElementById('resource-links-section');
  var list = document.getElementById('resource-links-list');
  if (!section || !list) return;

  var links = Array.isArray(resourceLinks) ? resourceLinks.filter(function(link) {
    return link && link.url;
  }) : [];

  if (!links.length || editMode) {
    list.innerHTML = '';
    section.style.display = 'none';
    return;
  }

  list.innerHTML = links.map(function(link) {
    var url = String(link.url || '').trim();
    var label = String(link.label || '').trim() || 'Resource Link';
    var targetAttr = isExternalResourceLink(url) ? ' target="_blank" rel="noopener"' : '';
    return '<a class="resource-link-card" href="' + escHtml(url) + '"' + targetAttr + '>' +
      '<span class="resource-link-arrow">&rarr;</span>' +
      '<span>' + escHtml(label) + '</span>' +
      '</a>';
  }).join('');
  section.style.display = 'block';
}

function isExternalResourceLink(url) {
  return /^https?:\/\//i.test(String(url || '').trim());
}

async function loadCourse() {
  const snap = await db.collection('courses').doc(courseId).get();
  if (!snap.exists) throw new Error('Course not found');
  courseData = { id: snap.id, ...snap.data() };

  const lSnap = await db.collection('courses').doc(courseId)
    .collection('lessons').orderBy('lessonOrder').get();
  lessons = lSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  document.getElementById('course-title-sidebar').textContent = courseData.title || 'Course';
  document.title = (courseData.title || 'Course') + ' — ToolSpark';
}

// ── LOAD / INIT PROGRESS ──
async function loadProgress() {
  const snap = await db.collection('userProgress').doc(progressDocId).get();
  if (snap.exists) {
    progressData = snap.data();
    completedLessons = new Set(progressData.completedLessons || []);
  } else {
    await db.collection('userProgress').doc(progressDocId).set({
      userId: currentUser.uid,
      clientEmail: currentUser.email || '',
      displayName: currentUser.displayName || '',
      courseId,
      completedLessons: [],
      lastLessonId: '',
      percentComplete: 0,
      startedAt: firebase.firestore.FieldValue.serverTimestamp(),
      completedAt: null
    });
    progressData = { completedLessons: [], lastLessonId: '' };
    completedLessons = new Set();
  }
}

// ── PICK STARTING LESSON ──
function pickStartLesson() {
  if (!lessons.length) return;

  if (initLessonId) {
    const idx = lessons.findIndex(l => l.id === initLessonId);
    if (idx >= 0) { loadLesson(idx); return; }
  }

  const lastId = progressData && progressData.lastLessonId;
  const idx = lastId ? lessons.findIndex(l => l.id === lastId) : -1;
  loadLesson(idx >= 0 ? idx : 0);
}

// ── LOAD LESSON ──
function loadLesson(index) {
  if (index < 0 || index >= lessons.length) return;
  currentIndex = index;
  currentLesson = lessons[index];
  selectedLessonImageFile = null;
  currentLessonImageUrl = '';

  const u = new URL(window.location.href);
  u.searchParams.set('lessonId', currentLesson.id);
  window.history.pushState({}, '', u);

  document.getElementById('topbar-title').textContent = currentLesson.lessonTitle || 'Untitled';
  document.getElementById('topbar-dur').textContent =
    currentLesson.lessonDuration ? currentLesson.lessonDuration + ' min' : '';
  refreshMarkBtn();
  document.getElementById('topbar-type').textContent =
    ({ video: 'Video', written: 'Written', mixed: 'Mixed', section: 'Section', image: 'Image' })[currentLesson.lessonType] || '';

  const videoMeta = parseVideoUrl(currentLesson.videoUrl);
  const embed = videoMeta ? videoMeta.embedUrl : null;
  const vSec = document.getElementById('video-section');
  if (embed) {
    document.getElementById('video-iframe').src = embed;
    vSec.style.display = 'block';
  } else {
    document.getElementById('video-iframe').src = '';
    vSec.style.display = 'none';
  }

  const iSec = document.getElementById('image-section');
  const imgEl = document.getElementById('lesson-image');
  const imageUrl = currentLesson.imageUrl ? currentLesson.imageUrl.trim() : '';
  if (imageUrl && iSec && imgEl) {
    imgEl.src = imageUrl;
    imgEl.alt = currentLesson.lessonTitle || '';
    iSec.style.display = 'block';
  } else if (iSec) {
    if (imgEl) imgEl.src = '';
    iSec.style.display = 'none';
  }

  document.getElementById('lesson-desc').textContent = currentLesson.lessonDescription || '';
  document.getElementById('lesson-html').innerHTML = currentLesson.lessonContent || '';
  renderLessonResourceLinks(currentLesson.resourceLinks);

  if (currentLesson.linkedThreadId) {
    loadThread(currentLesson.linkedThreadId);
  } else {
    document.getElementById('thread-section').style.display = 'none';
  }

  renderEditModeUI();

  document.getElementById('prev-btn').disabled = (index === 0);
  document.getElementById('next-btn').disabled = (index === lessons.length - 1);
  document.getElementById('lesson-counter').textContent =
    'Lesson ' + (index + 1) + ' of ' + lessons.length;

  renderSidebar();
  var scroll = document.querySelector('.content-scroll');
  if (scroll) scroll.scrollTo(0, 0);
  closeSidebar();

  db.collection('userProgress').doc(progressDocId)
    .update({ lastLessonId: currentLesson.id }).catch(function() {});
}

// ── VIDEO EMBED ──
function parseVideoUrl(url) {
  if (!url || !url.trim()) return null;

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    var vid = '';
    try {
      if (url.includes('youtu.be/')) {
        vid = url.split('youtu.be/')[1].split(/[?&#]/)[0];
      } else if (url.includes('/embed/')) {
        vid = url.split('/embed/')[1].split(/[?&#]/)[0];
      } else {
        vid = new URL(url).searchParams.get('v') || '';
      }
    } catch(e) {}
    return vid ? {
      provider: 'youtube',
      videoId: vid,
      embedUrl: 'https://www.youtube.com/embed/' + vid,
      thumbnailUrl: 'https://img.youtube.com/vi/' + vid + '/hqdefault.jpg'
    } : null;
  }

  if (url.includes('loom.com')) {
    try {
      var parts = url.split('/share/');
      if (parts[1]) {
        var loomId = parts[1].split(/[?&#]/)[0];
        return {
          provider: 'loom',
          videoId: loomId,
          embedUrl: 'https://www.loom.com/embed/' + loomId
        };
      }
    } catch(e) {}
  }

  return null;
}

// ── LOAD THREAD ──
async function loadThread(threadId) {
  var section = document.getElementById('thread-section');
  section.style.display = 'none';
  if (editMode) return;
  try {
    var tSnap = await db.collection('threads').doc(threadId).get();
    if (!tSnap.exists) return;
    var thread = tSnap.data();

    document.getElementById('thread-content').innerHTML =
      '<div class="thread-card"><div class="thread-card-title">' +
      escHtml(thread.title || 'Discussion') + '</div></div>' +
      '<a href="community.html?thread=' + threadId + '" class="view-thread-link">View full discussion →</a>';

    section.style.display = 'block';
  } catch(e) {}
}

// ── MARK COMPLETE TOGGLE ──
async function toggleComplete() {
  if (!currentLesson) return;
  var btn = document.getElementById('mark-btn');
  btn.disabled = true;
  var lessonId = currentLesson.id;
  var wasDone = completedLessons.has(lessonId);

  if (wasDone) {
    completedLessons.delete(lessonId);
    await db.collection('userProgress').doc(progressDocId).update({
      completedLessons: firebase.firestore.FieldValue.arrayRemove(lessonId),
      percentComplete: calcPct()
    }).catch(function() {});
  } else {
    completedLessons.add(lessonId);
    var update = {
      completedLessons: firebase.firestore.FieldValue.arrayUnion(lessonId),
      percentComplete: calcPct(),
      lastLessonId: lessonId
    };
    if (completedLessons.size === lessons.length) {
      update.completedAt = firebase.firestore.FieldValue.serverTimestamp();
    }
    await db.collection('userProgress').doc(progressDocId).update(update).catch(function() {});
    onLessonComplete(currentUser.uid);
    if (completedLessons.size === lessons.length) {
      onCourseComplete(currentUser.uid);
      showCompletion();
    }
  }

  refreshMarkBtn();
  renderSidebar();
  btn.disabled = false;
}

function calcPct() {
  return lessons.length ? Math.round((completedLessons.size / lessons.length) * 100) : 0;
}

function refreshMarkBtn() {
  var btn = document.getElementById('mark-btn');
  var done = currentLesson && completedLessons.has(currentLesson.id);
  btn.textContent = done ? '✓ Completed' : 'Mark as Complete ✓';
  if (done) btn.classList.add('completed');
  else btn.classList.remove('completed');
}

function prevLesson() {
  if (currentIndex > 0) loadLesson(currentIndex - 1);
}

async function nextLesson() {
  if (!currentLesson) return;
  if (!completedLessons.has(currentLesson.id)) {
    completedLessons.add(currentLesson.id);
    var update = {
      completedLessons: firebase.firestore.FieldValue.arrayUnion(currentLesson.id),
      percentComplete: calcPct(),
      lastLessonId: currentLesson.id
    };
    if (completedLessons.size === lessons.length) {
      update.completedAt = firebase.firestore.FieldValue.serverTimestamp();
    }
    await db.collection('userProgress').doc(progressDocId).update(update).catch(function() {});
    onLessonComplete(currentUser.uid);
    if (completedLessons.size === lessons.length) { onCourseComplete(currentUser.uid); showCompletion(); return; }
  }
  if (currentIndex < lessons.length - 1) loadLesson(currentIndex + 1);
}

// ── RENDER SIDEBAR ──
function renderSidebar() {
  var list = document.getElementById('lesson-list');
  var editorBar = document.getElementById('sidebar-editor-bar');
  var editHeader = document.getElementById('sidebar-edit-header');
  var normalHeader = document.getElementById('sidebar-header');
  var addSectionBar = document.getElementById('sidebar-add-section-bar');
  var footer = document.querySelector('.sidebar-footer');
  var typeIcon = { video: '🎬', written: '📝', mixed: '🎯', image: '🖼️' };

  typeIcon.section = 'S';
  var showEditorControls = isAdmin && editMode;

  if (editHeader) editHeader.classList.toggle('visible', showEditorControls);
  if (normalHeader) normalHeader.style.display = showEditorControls ? 'none' : '';
  if (addSectionBar) addSectionBar.classList.toggle('visible', showEditorControls);
  if (footer) footer.style.display = showEditorControls ? 'none' : '';
  if (editorBar) editorBar.style.display = showEditorControls ? 'block' : 'none';

  var editCourseTitle = document.getElementById('sidebar-edit-course-title');
  if (editCourseTitle && courseData) {
    editCourseTitle.textContent = (courseData.title || 'Course').toUpperCase();
  }

  list.innerHTML = lessons.map(function(l, i) {
    var done = completedLessons.has(l.id);
    var active = currentLesson && l.id === currentLesson.id;

    if (showEditorControls) {
      return '<div class="lesson-item lesson-item-editing' + (active ? ' active' : '') + '" onclick="loadLesson(' + i + ')">' +
        '<span class="drag-handle">&#8801;</span>' +
        '<div class="li-body">' +
        '<div class="li-title">' + escHtml(l.lessonTitle || 'Untitled') + '</div>' +
        '</div>' +
        '<button class="lesson-edit-btn" onclick="event.stopPropagation(); loadLesson(' + i + ')">&#9998;</button>' +
        '<button class="lesson-delete-btn" onclick="deleteLesson(event, \'' + l.id + '\')">&#128465;</button>' +
        '</div>';
    }

    var statusClass = done ? 'done' : active ? 'current' : 'pending';
    var statusChar = done ? '✅' : active ? '▶' : '○';
    return '<div class="lesson-item' + (active ? ' active' : '') + '" onclick="loadLesson(' + i + ')">' +
      '<span class="li-status ' + statusClass + '">' + statusChar + '</span>' +
      '<div class="li-body">' +
      '<div class="li-num">Lesson ' + (i + 1) + '</div>' +
      '<div class="li-title">' + escHtml(l.lessonTitle || 'Untitled') + '</div>' +
      '<div class="li-meta">' +
      (l.lessonDuration ? '<span class="li-dur">' + l.lessonDuration + ' min</span>' : '') +
      '<span class="li-type-icon">' + (typeIcon[l.lessonType] || '') + '</span>' +
      '</div></div>' +
      '</div>';
  }).join('');

  if (!showEditorControls) updateProgressUI();
}

function updateProgressUI() {
  var total = lessons.length;
  var done = completedLessons.size;
  var pct = calcPct();

  document.getElementById('prog-label').textContent = done + ' of ' + total + ' lessons complete';
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('circ-pct').textContent = pct + '%';
  document.getElementById('foot-done-text').textContent =
    done + ' lesson' + (done !== 1 ? 's' : '') + ' done';

  // r=18, circumference = 2π×18 ≈ 113.1
  var circ = 113.1;
  document.getElementById('circ-arc').style.strokeDashoffset = circ - (pct / 100) * circ;
}

// ── COMPLETION ──
function showCompletion() {
  document.getElementById('completion-msg').textContent =
    "You've completed " + (courseData && courseData.title ? courseData.title : 'this course') + '. Amazing work!';
  document.getElementById('completion-overlay').style.display = 'flex';
}

// ── MOBILE ──
function setSidebarOpen(isOpen) {
  document.getElementById('sidebar').classList.toggle('open', isOpen);
  document.getElementById('sidebar-overlay').classList.toggle('active', isOpen);
}
function toggleSidebar() {
  var sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  setSidebarOpen(!sidebar.classList.contains('open'));
}
function closeSidebar() {
  setSidebarOpen(false);
}

// ── UTILS ──
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getLessonEditorHtml(editor) {
  var html = editor ? String(editor.innerHTML || '').trim() : '';
  if (!html || html === '<br>' || html === '<div><br></div>' || html === '<p><br></p>') {
    return '';
  }
  return html;
}

function setLessonSaveButtonState(state) {
  var saveBtn = document.getElementById('editor-save-btn');
  if (!saveBtn) return;

  saveBtn.classList.remove('is-saving', 'is-saved');

  if (state === 'uploading') {
    saveBtn.classList.add('is-saving');
    saveBtn.innerHTML = '<span class="editor-spinner"></span><span>Uploading...</span>';
    return;
  }

  if (state === 'saving') {
    saveBtn.classList.add('is-saving');
    saveBtn.innerHTML = '<span class="editor-spinner"></span><span>Saving...</span>';
    return;
  }

  if (state === 'saved') {
    saveBtn.classList.add('is-saved');
    saveBtn.innerHTML = '&#10003; Saved';
    return;
  }

  if (state === 'error') {
    saveBtn.style.background = '#C4622D';
    saveBtn.textContent = 'Save failed — check console';
    return;
  }

  saveBtn.style.background = '';
  saveBtn.textContent = 'Save Lesson';
}

function wait(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
