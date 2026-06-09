(function() {
  var firebaseConfig = {
    apiKey:            "AIzaSyCJ0aVMa7M_Bs_Rg7otoAuckI86OtsFUgE",
    authDomain:        "toolspark-2d62d.firebaseapp.com",
    projectId:         "toolspark-2d62d",
    storageBucket:     "toolspark-2d62d.firebasestorage.app",
    messagingSenderId: "82966513396",
    appId:             "1:82966513396:web:f52b52b0ed2dc9537ac0a1"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  try { firebase.appCheck().activate('6LefuOcsAAAAAD1Pbu-O1q94rMf8u3bdPYoS82zJ', true); } catch(e) {}

  window.db   = firebase.firestore();
  window.auth = firebase.auth();
})();
