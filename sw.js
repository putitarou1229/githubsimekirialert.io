importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCPQiIjBJ_yQj5IVb54CZfEAh4CyJEg",
  messagingSenderId: "747701425490",
  projectId: "alert-55bd2",
  appId: "1:747701425490:web:f77d3cc86c420567aad68b"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body
  });
});