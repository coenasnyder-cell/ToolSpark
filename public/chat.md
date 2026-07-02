Here's the implementation for "wipe and start over" on the left card, plus one thing I need to fix first to make it actually stick.
There's a related bug I noticed while checking this: during the live chat (beginChatFlow, handleSend, finishQuestions), your answers get saved to Firestore nested under a field called answers: {...}, but loadSavedDraft() reads them as flat top-level fields (journeyData.finallyGetsIt, etc. — same as how lockInTransformation and generateTransformationDraft save them). So mid-chat progress doesn't actually round-trip correctly on reload today. I'll fix that as part of this change since "wipe and start over" needs to reliably clear those same fields.
1. Fix the three inconsistent persistSession calls — change each from nesting under answers: to spreading flat, matching the rest of the file:
In beginChatFlow():
jsawait persistSession(Object.assign({}, buildAnswerPayload(), {
  currentPhase: "chat",
  status: "in_progress",
  sessionAudienceOverride: buildAudienceOverridePayload()
}));
In handleSend() — both occurrences, e.g.:
jsawait persistSession(Object.assign({}, buildAnswerPayload(), {
  currentPhase: "chat",
  status: "in_progress"
}));
In finishQuestions():
jsawait persistSession(Object.assign({}, buildAnswerPayload(), {
  currentPhase: "generating",
  status: "in_progress"
}));
2. Add a new function for the left card, right after startSession():
jsasync function startFreshSession() {
  QUESTION_FLOW.forEach(function (item) { answers[item.key] = ""; });
  Object.keys(followupsAsked).forEach(function (key) { delete followupsAsked[key]; });
  REVIEW_FIELDS.forEach(function (field) { reviewData[field.key] = ""; });
  currentQuestionIndex = -1;
  awaitingFollowupFor = null;

  showScreen("chat");

  const wipe = {};
  QUESTION_FLOW.forEach(function (item) { wipe[item.key] = ""; });
  REVIEW_FIELDS.forEach(function (field) { wipe[field.key] = ""; });

  await persistSession(Object.assign({}, wipe, {
    currentPhase: "recap",
    status: "in_progress",
    resultsReviewed: false
  }));

  beginRecap();
}
3. Point the left card at it:
html<div class="choice-card reveal" id="newCard" onclick="startFreshSession()">
The right card ("Been Here Before") stays on resumeToReview(), untouched — it still goes straight to the saved draft.
One optional follow-up: updateStartState() currently relabels the left button to "Review the Transformation" when a draft exists, which would now be misleading since clicking it wipes instead of reviewing. Want me to change that label to "Start Over" whenever any saved progress exists, so it's clear what the button will actually do?