// 🔥 Firebase読み込み
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

// 🔧 Firebase初期化
const firebaseConfig = {
  apiKey: "AIzaSyBg2JChe4VhOjkbypEdHjUpGXDr6mKS3bM",
  messagingSenderId: "747701425490",
  projectId: "alert-55bd2",
  appId: "1:747701425490:web:f77d3cc86c420567aad68b"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);


// ==============================
// 🔑 トークン取得（スマホ表示）
// ==============================
getToken(messaging, {
  vapidKey: "BES2l0snOl90A-49auNHyDvUjCk7Gt6TOAd7-1kVhT7piiu5OCnYY4wkZtWgahEUgxTOwgEk8LixBEc2vP74gcc"
}).then((currentToken) => {
  if (currentToken) {
    console.log("トークン:", currentToken);

    // 👇 スマホでも見えるように表示
    document.body.innerHTML += `
      <div style="padding:10px; word-break:break-all; background:#fff;">
        <h3>スマホ用トークン</h3>
        <p>${currentToken}</p>
      </div>
    `;
  } else {
    alert("トークン取得失敗");
  }
}).catch((err) => {
  console.error("トークンエラー:", err);
});


// ==============================
// 🔔 フォアグラウンド通知
// ==============================
onMessage(messaging, (payload) => {
  console.log("フォアグラウンド通知:", payload);

  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: "./icon.png"
  });
});


// ==============================
// 📱 Service Worker登録
// ==============================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./firebase-messaging-sw.js");
}


// ==============================
// 🔔 通知許可
// ==============================
if ("Notification" in window) {
  Notification.requestPermission();
}


// ==============================
// 📦 既存アプリ機能
// ==============================
const list = document.getElementById("list");
const modal = document.getElementById("modal");

document.getElementById("addBtn").onclick = () => {
  modal.classList.remove("hidden");
};

document.getElementById("closeBtn").onclick = () => {
  modal.classList.add("hidden");
};

let items = JSON.parse(localStorage.getItem("items")) || [];
let notified = JSON.parse(localStorage.getItem("notified")) || {};

const todayKey = new Date().toDateString();
const lastReset = localStorage.getItem("lastReset");

if (lastReset !== todayKey) {
  localStorage.removeItem("notified");
  localStorage.setItem("lastReset", todayKey);
  notified = {};
}

function saveData() {
  localStorage.setItem("items", JSON.stringify(items));
}

function checkDeadlines() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  items.forEach(item => {
    const d = new Date(item.deadline);
    d.setHours(0, 0, 0, 0);

    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));

    if (diff <= 3 && diff >= 0) {
      const key = `${item.title}_${item.deadline}_${diff}`;

      if (!notified[key]) {
        notified[key] = true;
        localStorage.setItem("notified", JSON.stringify(notified));
      }
    }
  });
}

function dailyCheck() {
  const last = localStorage.getItem("lastCheckDate");
  const today = new Date().toDateString();

  if (last === today) return;

  checkDeadlines();
  localStorage.setItem("lastCheckDate", today);
}

function render() {
  list.innerHTML = "";

  items.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  items.forEach((item, index) => {
    const li = document.createElement("li");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const d = new Date(item.deadline);
    d.setHours(0, 0, 0, 0);

    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));

    if (diff <= 0) {
      li.classList.add("danger");
    } else if (diff === 1) {
      li.classList.add("warning");
    } else {
      li.classList.add("safe");
    }

    li.innerHTML = `
      <h3>${item.title}</h3>
      <p>締切：${item.deadline}（残り${diff}日）</p>
      ${item.image ? `<img src="${item.image}" width="100">` : ""}
      <button onclick="complete(${index})">完了</button>
    `;

    list.appendChild(li);
  });
}

function complete(index) {
  items.splice(index, 1);
  saveData();
  render();
  dailyCheck();
}

document.getElementById("saveBtn").onclick = () => {
  const title = document.getElementById("title").value;
  const deadline = document.getElementById("deadline").value;
  const file = document.getElementById("image").files[0];

  if (!title || !deadline) return alert("入力して");

  const addItem = (image = null) => {
    items.push({ title, deadline, image });
    saveData();
    render();
    dailyCheck();
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = function () {
      addItem(reader.result);
    };
    reader.readAsDataURL(file);
  } else {
    addItem();
  }

  modal.classList.add("hidden");
};

render();
dailyCheck();