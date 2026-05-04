const list = document.getElementById("list");
const modal = document.getElementById("modal");

document.getElementById("addBtn").onclick = () => {
  modal.classList.remove("hidden");
};

document.getElementById("closeBtn").onclick = () => {
  modal.classList.add("hidden");
};

// 📦 データ
let items = JSON.parse(localStorage.getItem("items")) || [];
let notified = JSON.parse(localStorage.getItem("notified")) || {};

// 🔄 毎日リセット（通知重複防止）
const todayKey = new Date().toDateString();
const lastReset = localStorage.getItem("lastReset");

if (lastReset !== todayKey) {
  localStorage.removeItem("notified");
  localStorage.setItem("lastReset", todayKey);
  notified = {};
}

// 💾 保存
function saveData() {
  localStorage.setItem("items", JSON.stringify(items));
}

// 🚨 期限チェック（Firebase通知用フラグだけ管理）
function checkDeadlines() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  items.forEach(item => {
    const d = new Date(item.deadline);
    d.setHours(0, 0, 0, 0);

    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));

    // 3日前〜当日だけ対象
    if (diff <= 3 && diff >= 0) {
      const key = `${item.title}_${item.deadline}_${diff}`;

      // 通知済みチェック（重複防止）
      if (!notified[key]) {
        // ★ Firebase側で通知する想定なのでここでは記録だけ
        notified[key] = true;
        localStorage.setItem("notified", JSON.stringify(notified));
      }
    }
  });
}

// 📅 毎日1回だけチェック
function dailyCheck() {
  const last = localStorage.getItem("lastCheckDate");
  const today = new Date().toDateString();

  if (last === today) return;

  checkDeadlines();
  localStorage.setItem("lastCheckDate", today);
}

// 🎨 表示
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

    // 🎨 色分け
    if (diff < 0) {
      li.classList.add("danger");
    } else if (diff === 0) {
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

// ❌ 完了
function complete(index) {
  items.splice(index, 1);
  saveData();
  render();
  dailyCheck();
}

// ➕ 追加
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

// 🚀 初期化
render();
dailyCheck();

console.log("通知許可:", Notification.permission);
alert(Notification.permission);

// 🔔 通知許可（Firebase用）
if ("Notification" in window) {
  Notification.requestPermission();
}

// 📱 Service Worker（PWA）
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./firebase-messaging-sw.js");
}