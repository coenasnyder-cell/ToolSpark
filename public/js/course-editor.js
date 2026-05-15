// ── LOAD COURSE + LESSONS ──
function updateEditModeButton() {
  var btn = document.getElementById('edit-mode-btn');
  if (!btn) return;
  btn.style.display = (isAdmin && !editMode) ? 'inline-flex' : 'none';
  btn.textContent = '✏️ Edit Course';
}

function toggleEditMode() {
  if (!isAdmin) return;
  editMode = !editMode;
  updateEditModeButton();
  if (!editMode && currentLesson) {
    loadLesson(currentIndex);
    return;
  }
  renderEditModeUI();
  renderSidebar();
}

function renderEditModeUI() {
  if (!currentLesson) return;

  var topbarTitle = document.getElementById('topbar-title');
  var lessonDesc = document.getElementById('lesson-desc');
  var lessonHtml = document.getElementById('lesson-html');
  var editorActions = document.getElementById('editor-actions');
  var resourceSection = document.getElementById('resource-links-section');
  var threadSection = document.getElementById('thread-section');

  if (editMode && isAdmin) {
    topbarTitle.textContent = currentLesson.lessonTitle || 'Untitled';
    lessonDesc.style.display = 'none';
    lessonDesc.textContent = '';
    lessonHtml.innerHTML = buildLessonEditMarkup(currentLesson);
    if (editorActions) editorActions.style.display = 'flex';
    if (resourceSection) resourceSection.style.display = 'none';
    if (threadSection) threadSection.style.display = 'none';
    initializeLessonEditorUI();
    return;
  }

  topbarTitle.textContent = currentLesson.lessonTitle || 'Untitled';
  lessonDesc.style.display = '';
  lessonDesc.textContent = currentLesson.lessonDescription || '';
  lessonHtml.innerHTML = currentLesson.lessonContent || '';
  renderLessonResourceLinks(currentLesson.resourceLinks);
  if (editorActions) editorActions.style.display = 'none';
}

function buildLessonEditMarkup(lesson) {
  var lessonType = String(lesson.lessonType || 'written').toLowerCase();
  var duration = lesson.lessonDuration === 0 ? '0' : (lesson.lessonDuration || '');

  return '' +
    '<div class="lesson-edit-shell">' +
      '<div class="editor-section">' +
        '<div class="editor-section-title">Section 1 - Lesson Info</div>' +
        '<div class="editor-field">' +
          '<label class="editor-field-label" for="edit-lesson-title">Lesson Title</label>' +
          '<input type="text" id="edit-lesson-title" class="editor-title-input" placeholder="Lesson title..." value="' + escHtml(lesson.lessonTitle || '') + '">' +
        '</div>' +
        '<div class="editor-grid-3" style="margin-top:14px;">' +
          '<div class="editor-field">' +
            '<label class="editor-field-label" for="edit-lesson-type">Type</label>' +
            '<select id="edit-lesson-type" class="editor-select">' +
              '<option value="video"' + getSelectedAttr(lessonType, 'video') + '>Video</option>' +
              '<option value="written"' + getSelectedAttr(lessonType, 'written') + '>Written</option>' +
              '<option value="mixed"' + getSelectedAttr(lessonType, 'mixed') + '>Mixed</option>' +
              '<option value="section"' + getSelectedAttr(lessonType, 'section') + '>Section</option>' +
            '</select>' +
          '</div>' +
          '<div class="editor-field">' +
            '<label class="editor-field-label" for="edit-lesson-duration">Duration</label>' +
            '<div class="editor-inline-input">' +
              '<input type="number" min="0" step="1" id="edit-lesson-duration" class="editor-input editor-number-input" value="' + escHtml(duration) + '">' +
              '<span class="editor-duration-suffix">min</span>' +
            '</div>' +
          '</div>' +
          '<div class="editor-field">' +
            '<label class="editor-field-label">Access</label>' +
            '<div class="editor-access-toggle" id="edit-access-toggle">' +
              '<button type="button" class="editor-toggle-btn" data-access="free" onclick="setLessonAccess(true)">Free</button>' +
              '<button type="button" class="editor-toggle-btn" data-access="paid" onclick="setLessonAccess(false)">Paid</button>' +
            '</div>' +
            '<input type="hidden" id="edit-lesson-is-free" value="' + (lesson.isFree === false ? 'false' : 'true') + '">' +
          '</div>' +
        '</div>' +
        '<div class="editor-field" style="margin-top:14px;">' +
          '<label class="editor-field-label" for="edit-lesson-description">Short Description</label>' +
          '<textarea id="edit-lesson-description" rows="2" class="editor-textarea" placeholder="Brief description shown in lesson list...">' + escHtml(lesson.lessonDescription || '') + '</textarea>' +
        '</div>' +
      '</div>' +
      '<div class="editor-section" id="editor-video-section">' +
        '<div class="editor-section-title">Section 2 - Video</div>' +
        '<div class="editor-field">' +
          '<label class="editor-field-label" for="edit-lesson-video-url">Video URL</label>' +
          '<input type="url" id="edit-lesson-video-url" class="editor-input" placeholder="Paste YouTube or Loom URL here" value="' + escHtml(lesson.videoUrl || '') + '">' +
          '<div class="editor-help-text">Supports YouTube and Loom links</div>' +
          '<div class="editor-video-preview" id="editor-video-preview"></div>' +
        '</div>' +
      '</div>' +
      '<div class="editor-section">' +
        '<div class="editor-section-title">Section 3 - Content Editor</div>' +
        '<div class="editor-field-label" style="margin-bottom:10px;">Lesson Content</div>' +
        '<div class="editor-toolbar">' +
          '<div class="editor-toolbar-row">' +
            '<button type="button" class="editor-toolbar-btn" onmousedown="event.preventDefault(); runLessonEditorCommand(\'bold\')">Bold</button>' +
            '<button type="button" class="editor-toolbar-btn" onmousedown="event.preventDefault(); runLessonEditorCommand(\'italic\')">Italic</button>' +
            '<button type="button" class="editor-toolbar-btn" onmousedown="event.preventDefault(); runLessonEditorCommand(\'underline\')">Underline</button>' +
            '<button type="button" class="editor-toolbar-btn" onmousedown="event.preventDefault(); runLessonEditorCommand(\'strikeThrough\')">Strikethrough</button>' +
            '<button type="button" class="editor-toolbar-btn" onmousedown="event.preventDefault(); runLessonEditorCommand(\'formatBlock\', \'<h1>\')">H1</button>' +
            '<button type="button" class="editor-toolbar-btn" onmousedown="event.preventDefault(); runLessonEditorCommand(\'formatBlock\', \'<h2>\')">H2</button>' +
            '<button type="button" class="editor-toolbar-btn" onmousedown="event.preventDefault(); runLessonEditorCommand(\'formatBlock\', \'<h3>\')">H3</button>' +
            '<button type="button" class="editor-toolbar-btn" onmousedown="event.preventDefault(); runLessonEditorCommand(\'formatBlock\', \'<p>\')">Normal</button>' +
            '<select id="editor-font-size" class="editor-toolbar-select" onchange="applyLessonFontSize(this.value)">' +
              '<option value="">Font Size</option>' +
              '<option value="13px">Small</option>' +
              '<option value="15px">Normal</option>' +
              '<option value="18px">Large</option>' +
              '<option value="22px">XLarge</option>' +
            '</select>' +
            '<div class="editor-color-picker">' +
              '<button type="button" class="editor-toolbar-btn" onmousedown="event.preventDefault();" onclick="toggleLessonColorMenu(event)">Text Color</button>' +
              '<div class="editor-color-menu" id="editor-color-menu">' +
                buildEditorColorOption('#2F2A24', 'Default') +
                buildEditorColorOption('#C9A84C', 'Gold') +
                buildEditorColorOption('#7E786E', 'Muted grey') +
                buildEditorColorOption('#FFFFFF', 'White') +
                buildEditorColorOption('#C4622D', 'Red') +
                buildEditorColorOption('#2F7D57', 'Green') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="editor-toolbar-row">' +
            '<button type="button" class="editor-toolbar-btn" onmousedown="event.preventDefault(); runLessonEditorCommand(\'insertUnorderedList\')">Bullet List</button>' +
            '<button type="button" class="editor-toolbar-btn" onmousedown="event.preventDefault(); runLessonEditorCommand(\'insertOrderedList\')">Numbered List</button>' +
            '<button type="button" class="editor-toolbar-btn" onmousedown="event.preventDefault(); runLessonEditorCommand(\'formatBlock\', \'<blockquote>\')">Quote</button>' +
            '<button type="button" class="editor-toolbar-btn" onmousedown="event.preventDefault(); insertLessonEditorLink()">Link</button>' +
            '<button type="button" class="editor-toolbar-btn" onmousedown="event.preventDefault(); insertLessonDivider()">Divider</button>' +
            '<button type="button" class="editor-toolbar-btn" onmousedown="event.preventDefault(); clearLessonFormatting()">Clear formatting</button>' +
          '</div>' +
        '</div>' +
        '<div id="edit-lesson-content" class="editor-content-input" contenteditable="true" data-placeholder="Write your lesson content here...">' + (lesson.lessonContent || '') + '</div>' +
      '</div>' +
      '<div class="editor-section">' +
        '<div class="editor-section-title">Section 4 - Links and Resources</div>' +
        '<div class="editor-field-label">Lesson Resources (optional)</div>' +
        '<div class="editor-resource-list" id="resource-links-builder"></div>' +
        '<button type="button" class="editor-add-resource-btn" onclick="addResourceLinkRow()">+ Add Resource Link</button>' +
      '</div>' +
      '<div class="editor-section">' +
        '<div class="editor-section-title">Section 5 - Community Thread</div>' +
        '<div class="editor-field">' +
          '<label class="editor-field-label" for="edit-linked-thread-id">Link Community Thread (optional)</label>' +
          '<input type="text" id="edit-linked-thread-id" class="editor-thread-input" placeholder="Paste thread document ID" value="' + escHtml(lesson.linkedThreadId || '') + '">' +
          '<div class="editor-help-text">Members will see a discussion section at the bottom of this lesson</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function buildEditorColorOption(color, label) {
  return '<button type="button" class="editor-color-option" onmousedown="event.preventDefault(); applyLessonTextColor(\'' + color + '\')">' +
    '<span class="editor-color-swatch" style="background:' + color + ';"></span>' + label + '</button>';
}

function getSelectedAttr(currentValue, expectedValue) {
  return currentValue === expectedValue ? ' selected' : '';
}

function initializeLessonEditorUI() {
  var titleInput = document.getElementById('edit-lesson-title');
  var typeInput = document.getElementById('edit-lesson-type');
  var videoInput = document.getElementById('edit-lesson-video-url');
  var editor = document.getElementById('edit-lesson-content');

  if (titleInput) {
    titleInput.addEventListener('input', function() {
      document.getElementById('topbar-title').textContent = titleInput.value.trim() || 'Untitled';
    });
  }

  setLessonAccess(currentLesson && currentLesson.isFree === false ? false : true);
  renderLessonResourceRows(Array.isArray(currentLesson.resourceLinks) ? currentLesson.resourceLinks : []);
  syncLessonVideoSection();
  updateLessonVideoPreview();

  if (typeInput) typeInput.addEventListener('change', syncLessonVideoSection);
  if (videoInput) videoInput.addEventListener('input', updateLessonVideoPreview);

  if (editor) {
    editor.addEventListener('mouseup', saveLessonEditorSelection);
    editor.addEventListener('keyup', saveLessonEditorSelection);
    editor.addEventListener('input', saveLessonEditorSelection);
    editor.addEventListener('focus', saveLessonEditorSelection);
    editor.addEventListener('paste', function(e) {
      e.preventDefault();
      var text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
      insertPlainTextIntoLessonEditor(text);
    });
  }
}

function runLessonEditorCommand(command, value) {
  var editor = document.getElementById('edit-lesson-content');
  if (!editor) return;
  restoreLessonEditorSelection();
  editor.focus();
  document.execCommand('styleWithCSS', false, true);
  document.execCommand(command, false, value || null);
  saveLessonEditorSelection();
}

function insertLessonEditorLink() {
  var url = prompt('Enter URL');
  if (!url) return;
  restoreLessonEditorSelection();
  runLessonEditorCommand('createLink', url);
}

function insertLessonDivider() {
  insertLessonHtml('<hr>');
}

function clearLessonFormatting() {
  restoreLessonEditorSelection();
  document.execCommand('removeFormat', false, null);
  document.execCommand('unlink', false, null);
  saveLessonEditorSelection();
}

function saveLessonEditorSelection() {
  var editor = document.getElementById('edit-lesson-content');
  var sel = window.getSelection();
  if (!editor || !sel || !sel.rangeCount) return;
  var range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;
  lessonEditorSelection = range.cloneRange();
}

function restoreLessonEditorSelection() {
  if (!lessonEditorSelection) return;
  var sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(lessonEditorSelection);
}

function insertLessonHtml(html) {
  var editor = document.getElementById('edit-lesson-content');
  if (!editor) return;
  restoreLessonEditorSelection();
  editor.focus();
  document.execCommand('insertHTML', false, html);
  saveLessonEditorSelection();
}

function applyLessonFontSize(size) {
  var select = document.getElementById('editor-font-size');
  if (!size) return;
  wrapLessonSelectionWithStyle('fontSize', size);
  if (select) select.value = '';
}

function applyLessonTextColor(color) {
  wrapLessonSelectionWithStyle('color', color);
  closeLessonColorMenu();
}

function wrapLessonSelectionWithStyle(styleName, value) {
  var editor = document.getElementById('edit-lesson-content');
  var sel = window.getSelection();
  if (!editor || !sel) return;
  restoreLessonEditorSelection();
  if (!sel.rangeCount) return;

  var range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer) || range.collapsed) return;

  var fragment = range.extractContents();
  var wrapper = document.createElement('span');
  wrapper.style[styleName] = value;
  wrapper.appendChild(fragment);
  range.insertNode(wrapper);

  var newRange = document.createRange();
  newRange.selectNodeContents(wrapper);
  sel.removeAllRanges();
  sel.addRange(newRange);
  saveLessonEditorSelection();
}

function insertPlainTextIntoLessonEditor(text) {
  var editor = document.getElementById('edit-lesson-content');
  if (!editor) return;
  restoreLessonEditorSelection();
  editor.focus();
  if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
    document.execCommand('insertText', false, text);
  } else {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    var range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  saveLessonEditorSelection();
}

function setLessonAccess(isFree) {
  var hiddenInput = document.getElementById('edit-lesson-is-free');
  var toggle = document.getElementById('edit-access-toggle');
  if (hiddenInput) hiddenInput.value = isFree ? 'true' : 'false';
  if (!toggle) return;

  Array.prototype.forEach.call(toggle.querySelectorAll('.editor-toggle-btn'), function(btn) {
    var active = btn.getAttribute('data-access') === (isFree ? 'free' : 'paid');
    btn.classList.toggle('active', active);
  });
}


function renderLessonResourceRows(resourceLinks) {
  var list = document.getElementById('resource-links-builder');
  if (!list) return;

  var rows = Array.isArray(resourceLinks) && resourceLinks.length ? resourceLinks : [{ label: '', url: '' }];
  list.innerHTML = rows.map(function(link, index) {
    return '' +
      '<div class="editor-resource-row">' +
        '<div class="editor-field">' +
          '<label class="editor-field-label" for="resource-label-' + index + '">Link Label</label>' +
          '<input type="text" id="resource-label-' + index + '" class="editor-resource-input resource-link-label" placeholder="Link Label" value="' + escHtml((link && link.label) || '') + '">' +
        '</div>' +
        '<div class="editor-field">' +
          '<label class="editor-field-label" for="resource-url-' + index + '">URL</label>' +
          '<input type="text" id="resource-url-' + index + '" class="editor-resource-input resource-link-url" placeholder="URL" value="' + escHtml((link && link.url) || '') + '">' +
        '</div>' +
        '<div class="editor-resource-actions">' +
          '<button type="button" class="editor-resource-btn" onclick="addResourceLinkRow(' + (index + 1) + ')">+ Add</button>' +
          '<button type="button" class="editor-resource-btn" onclick="removeResourceLinkRow(' + index + ')">&#128465;</button>' +
        '</div>' +
      '</div>';
  }).join('');
}

function getDraftResourceLinks() {
  var rows = Array.prototype.slice.call(document.querySelectorAll('#resource-links-builder .editor-resource-row'));
  return rows.map(function(row) {
    var labelInput = row.querySelector('.resource-link-label');
    var urlInput = row.querySelector('.resource-link-url');
    return {
      label: labelInput ? labelInput.value : '',
      url: urlInput ? urlInput.value : ''
    };
  });
}

function addResourceLinkRow(insertAt) {
  var rows = getDraftResourceLinks();
  var insertIndex = typeof insertAt === 'number' ? insertAt : rows.length;
  rows.splice(insertIndex, 0, { label: '', url: '' });
  renderLessonResourceRows(rows);
}

function removeResourceLinkRow(index) {
  var rows = getDraftResourceLinks();
  if (rows.length <= 1) {
    renderLessonResourceRows([{ label: '', url: '' }]);
    return;
  }
  rows.splice(index, 1);
  renderLessonResourceRows(rows);
}

function collectLessonResourceLinks() {
  return getDraftResourceLinks()
    .map(function(link) {
      return {
        label: String(link.label || '').trim(),
        url: String(link.url || '').trim()
      };
    })
    .filter(function(link) {
      return !!link.url;
    })
    .map(function(link) {
      return {
        label: link.label || 'Resource Link',
        url: link.url
      };
    });
}


// ── NAVIGATION ──
async function saveLessonEdits() {
  if (!isAdmin || !editMode || !currentLesson) return;

  var saveBtn = document.getElementById('editor-save-btn');
  var cancelBtn = document.getElementById('editor-cancel-btn');
  var titleInput = document.getElementById('edit-lesson-title');
  var typeInput = document.getElementById('edit-lesson-type');
  var durationInput = document.getElementById('edit-lesson-duration');
  var descInput = document.getElementById('edit-lesson-description');
  var videoUrlInput = document.getElementById('edit-lesson-video-url');
  var contentInput = document.getElementById('edit-lesson-content');
  var linkedThreadInput = document.getElementById('edit-linked-thread-id');
  var accessInput = document.getElementById('edit-lesson-is-free');

  if (!titleInput || !typeInput || !descInput || !contentInput || !linkedThreadInput || !accessInput) return;

  saveBtn.disabled = true;
  cancelBtn.disabled = true;
  setLessonSaveButtonState('saving');

  try {
    var durationValue = String(durationInput && durationInput.value ? durationInput.value : '').trim();
    var parsedDuration = durationValue === '' ? '' : Number(durationValue);
    var lessonPayload = {
      lessonTitle: titleInput.value.trim(),
      lessonDescription: descInput.value.trim(),
      lessonType: typeInput.value,
      lessonDuration: Number.isFinite(parsedDuration) ? parsedDuration : '',
      videoUrl: videoUrlInput ? videoUrlInput.value.trim() : '',
      lessonContent: getLessonEditorHtml(contentInput),
      linkedThreadId: linkedThreadInput.value.trim(),
      isFree: accessInput.value !== 'false',
      resourceLinks: collectLessonResourceLinks()
    };

    await db.collection('courses')
      .doc(courseId)
      .collection('lessons')
      .doc(currentLesson.id)
      .update(lessonPayload);

    setLessonSaveButtonState('saved');
    await wait(2000);
    editMode = false;
    updateEditModeButton();
    await loadCourse();
    loadLesson(currentIndex);
  } catch (e) {
    setLessonSaveButtonState('default');
  } finally {
    saveBtn.disabled = false;
    cancelBtn.disabled = false;
    setLessonSaveButtonState('default');
  }
}

function cancelLessonEdits() {
  if (!isAdmin || !currentLesson) return;
  editMode = false;
  updateEditModeButton();
  loadLesson(currentIndex);
}

async function addLesson() {
  if (!isAdmin || !editMode) return;

  var addBtn = document.getElementById('add-lesson-btn');
  if (addBtn) addBtn.disabled = true;

  try {
    var newDoc = await db.collection('courses')
      .doc(courseId)
      .collection('lessons')
      .add({
        lessonTitle: "New Lesson",
        lessonDescription: "",
        lessonContent: "",
        lessonOrder: lessons.length + 1,
        lessonDuration: "",
        lessonType: "written",
        videoUrl: "",
        linkedThreadId: "",
        isFree: true,
        resourceLinks: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

    await loadCourse();
    await db.collection('courses').doc(courseId).update({
      totallessons: lessons.length
    });
    renderSidebar();

    var newIndex = lessons.findIndex(function(l) { return l.id === newDoc.id; });
    loadLesson(newIndex >= 0 ? newIndex : lessons.length - 1);
  } catch (e) {
  } finally {
    if (addBtn) addBtn.disabled = false;
  }
}

async function deleteLesson(event, lessonId) {
  if (event) event.stopPropagation();
  if (!isAdmin || !editMode) return;
  if (lessons.length <= 1) {
    alert('You cannot delete the final remaining lesson.');
    return;
  }
  if (!confirm('Delete this lesson?')) return;

  var deleteIndex = lessons.findIndex(function(l) { return l.id === lessonId; });
  if (deleteIndex < 0) return;

  try {
    await db.collection('courses')
      .doc(courseId)
      .collection('lessons')
      .doc(lessonId)
      .delete();

    await loadCourse();
    await db.collection('courses').doc(courseId).update({
      totallessons: lessons.length
    });
    renderSidebar();

    var nextIndex = Math.min(deleteIndex, lessons.length - 1);
    loadLesson(nextIndex);
  } catch (e) {}
}

function toggleLessonColorMenu(event) {
  if (event) event.stopPropagation();
  var menu = document.getElementById('editor-color-menu');
  if (!menu) return;
  menu.classList.toggle('open');
}

function closeLessonColorMenu() {
  var menu = document.getElementById('editor-color-menu');
  if (!menu) return;
  menu.classList.remove('open');
}

document.addEventListener('click', function(event) {
  var menu = document.getElementById('editor-color-menu');
  var picker = event.target.closest ? event.target.closest('.editor-color-picker') : null;
  if (!menu) return;
  if (!picker) closeLessonColorMenu();
});
