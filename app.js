import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

document.addEventListener("DOMContentLoaded", async () => {

  const firebaseConfig = {
    apiKey: "AIzaSyBg2JChe4VhOjkbypEdHjUpGXDr6mKS3bM",
    messagingSenderId: "747701425490",
    projectId: "alert-55bd2",
    appId: "1:747701425490:web:f77d3cc86c420567aad68b"
  };

  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  // 🔔 通知許可
  await Notification.requestPermission();

  // 📱 SW登録（先に！）
  const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");

  // 🔑 トークン取得
  const token = await getToken(messaging, {
    vapidKey: "BES2l0snOl90A-49auNHyDvUjCk7Gt6TOAd7-1kVhT7piiu5OCnYY4wkZtWgahEUgxTOwgEk8LixBEc2vP74gcc",
    serviceWorkerRegistration: registration
  });

  console.log("トークン:", token);

  // 👇 画面に表示（これが答え）
  document.body.insertAdjacentHTML("beforeend", `
    <div style="padding:10px; word-break:break-all;">
      <h3>トークン</h3>
      <p>${token}</p>
    </div>
  `);

  // 🔔 フォアグラウンド通知
  onMessage(messaging, (payload) => {
    new Notification(payload.notification.title, {
      body: payload.notification.body,
      icon: "./icon.png"
    });
  });


  // 📱 SW登録
  const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");

  // ======================
  // アプリ機能
  // ======================

  const list = document.getElementById("list");
  const modal = document.getElementById("modal");

  document.getElementById("addBtn").onclick = () => {
    modal.classList.remove("hidden");
  };

  document.getElementById("closeBtn").onclick = () => {
    modal.classList.add("hidden");
  };

  let items = JSON.parse(localStorage.getItem("items")) || [];

  function saveData() {
    localStorage.setItem("items", JSON.stringify(items));
  }

  function render() {
    list.innerHTML = "";

    items.forEach((item, index) => {
      const li = document.createElement("li");

      li.innerHTML = `
        <h3>${item.title}</h3>
        <p>${item.deadline}</p>
        <button onclick="complete(${index})">完了</button>
      `;

      list.appendChild(li);
    });
  }

  window.complete = function (index) {
    items.splice(index, 1);
    saveData();
    render();
  };

  document.getElementById("saveBtn").onclick = () => {
    const title = document.getElementById("title").value;
    const deadline = document.getElementById("deadline").value;

    if (!title || !deadline) return alert("入力して");

    items.push({ title, deadline });

    saveData();
    render();

    modal.classList.add("hidden");
  };

  render();

});