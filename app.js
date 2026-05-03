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

// 🔄 毎日リセット
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

//期限確認
function checkDeadlines() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  items.forEach(item => {
    const d = new Date(item.deadline);
    d.setHours(0, 0, 0, 0);

    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));

    const key = `${item.title}_${item.deadline}_${diff}`;

    if (diff <= 3 && diff >= 0 && !notified[key]) {
      new Notification("締切りアラーム", {
        body: `締切まで${diff}日: ${item.title}`
      });

      notified[key] = true;
      localStorage.setItem("notified", JSON.stringify(notified));
    }
  });
}

//毎日確認
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


    // 📝 表示
    li.innerHTML = `
      <h3>${item.title}</h3>
      <p>締切：${item.deadline}（残り${diff}日）</p>
      ${item.image ? `<img src="${item.image}" width="100">` : ""}
      <button onclick="complete(${index})">完了</button>
    `;

    list.appendChild(li);
  });
}

// ❌ 完了削除
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
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = function () {
      addItem(reader.result);
      dailyCheck();
    };
    reader.readAsDataURL(file);
  } else {
    addItem();
  }

  modal.classList.add("hidden");
};

// 🚀 初期表示
dailyCheck();
render();

// 🔔 通知許可
if ("Notification" in window) {
  Notification.requestPermission();
}

// 📱 PWA Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}