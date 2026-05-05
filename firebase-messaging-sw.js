// 🔥 Firebase読み込み
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// 🔧 Firebase初期化
firebase.initializeApp({
  apiKey: "AIzaSyBg2JChe4VhOjkbypEdHjUpGXDr6mKS3bM",
  messagingSenderId: "747701425490",
  projectId: "alert-55bd2",
  appId: "1:747701425490:web:f77d3cc86c420567aad68b"
});

const messaging = firebase.messaging();


// ==============================
// 🔔 プッシュ通知（バックグラウンド）
// ==============================
messaging.onBackgroundMessage(function (payload) {
  console.log("バックグラウンド通知:", payload);

  self.registration.showNotification(
    payload.notification?.title || "締切りアラーム",
    {
      body: payload.notification?.body || "通知があります",
      icon: "./icon.png",
      badge: "./icon.png",
      vibrate: [200, 100, 200],
      tag: "deadline-alert",
      renotify: true
    }
  );
});


// ==============================
// 📦 キャッシュ設定（オフライン対応）
// ==============================
const CACHE_NAME = "deadline-app-v2";

const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon.png"
];

// インストール時キャッシュ
self.addEventListener("install", (event) => {
  console.log("SWインストール");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );

  self.skipWaiting();
});

// アクティブ化
self.addEventListener("activate", (event) => {
  console.log("SWアクティブ");

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// フェッチ（オフライン対応）
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});