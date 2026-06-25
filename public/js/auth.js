// auth.js — Firebase auth listener, Firestore user read, tsUser, tsUserReady
// Load this first on every page. No UI, no credits logic.
(function () {
  function initAuth() {
    firebase.auth().onAuthStateChanged(function (firebaseUser) {
      if (!firebaseUser) {
        window.tsUser = null;
        window._tsUserReady = true;
        document.dispatchEvent(new CustomEvent('tsUserReady', { detail: null }));
        return;
      }

      firebase.firestore()
        .collection('users')
        .doc(firebaseUser.uid)
        .get()
        .then(function (doc) {
          var data = doc.exists ? doc.data() : {};
          window.tsUser = {
            uid:     firebaseUser.uid,
            email:   firebaseUser.email,
            role:    data.userRole  || null,
            tier:    data.subscriptionTier || null,
            credits: typeof data.credits === 'number' ? data.credits : 0
          };
          window._tsUserReady = true;
          document.dispatchEvent(new CustomEvent('tsUserReady', { detail: window.tsUser }));
        })
        .catch(function (err) {
          console.warn('[auth.js] Firestore read failed:', err);
          // Always fire even on failure — unblock credits.js
          window.tsUser = {
            uid:     firebaseUser.uid,
            email:   firebaseUser.email,
            role:    null,
            tier:    null,
            credits: 0
          };
          window._tsUserReady = true;
          document.dispatchEvent(new CustomEvent('tsUserReady', { detail: window.tsUser }));
        });
    });
  }

  if (typeof firebase !== 'undefined') {
    initAuth();
  } else {
    // Shouldn't happen if script order is correct, but just in case
    window.addEventListener('load', function () {
      if (typeof firebase !== 'undefined') {
        initAuth();
      } else {
        console.error('[auth.js] Firebase SDK not found. Check script load order.');
      }
    });
  }
})();