importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCIPQjiBJ_yXql51VVb54CZfEAha4CyJEg",
  authDomain: "alert-55bd2.firebaseapp.com",
  projectId: "alert-55bd2",
  messagingSenderId: "747701425490",
  appId: "1:747701425490:web:f77d3cc86c420567aad68b"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("バックグラウンド通知:", payload);

  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/icon.png"
    }
  );
});