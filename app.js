import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.onload = async () => {
  console.log("saveBtn:", document.getElementById("saveBtn"));
  document.getElementById("saveBtn").onclick = () => {
    console.log("クリックされた");
  };
  // ======================
  // Firebase初期化
  // ======================
  const firebaseConfig = {
    apiKey: "AIzaSyBg2JChe4VhOjkbypEdHjUpGXDr6mKS3bM",
    messagingSenderId: "747701425490",
    projectId: "alert-55bd2",
    appId: "1:747701425490:web:f77d3cc86c420567aad68b"
  };

  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  const db = getFirestore(app);
  const auth = getAuth(app);

  let uid = null;
  const list = document.getElementById("list");

  // ======================
  // 匿名ログイン
  // ======================
  await signInAnonymously(auth);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      uid = user.uid;
      console.log("ログインOK:", uid);
      startApp();
    }
  });

  // ======================
  // 通知許可
  // ======================
  await Notification.requestPermission();

  // ======================
  // SW
  // ======================
  const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");

  await getToken(messaging, {
    vapidKey: "BES2l0snOl90A-49auNHyDvUjCk7Gt6TOAd7-1kVhT7piiu5OCnYY4wkZtWgahEUgxTOwgEk8LixBEc2vP74gcc",
    serviceWorkerRegistration: registration
  });

  onMessage(messaging, (payload) => {
    console.log("foreground:", payload);
  });

  // ======================
  // メインアプリ
  // ======================
  function startApp() {

    function getDaysLeft(deadline) {
      const now = new Date();
      const target = new Date(deadline);
      return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    }

    function getStatus(days) {
      if (days <= 0) return "overdue";
      if (days <= 3) return "warning";
      return "safe";
    }

    // ======================
    // リアルタイム取得
    // ======================
    onSnapshot(collection(db, "users", uid, "tasks"), (snapshot) => {

      let items = [];

      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });

      render(items);
    });

    // ======================
    // 描画
    // ======================
    function render(items) {

      list.innerHTML = "";

      items.sort((a, b) =>
        new Date(a.deadline) - new Date(b.deadline)
      );

      items.forEach(item => {

        const days = getDaysLeft(item.deadline);
        const status = getStatus(days);

        const li = document.createElement("li");

        li.innerHTML = `
          <div class="task ${status}">
            <h3>${item.title}</h3>
            <p>期限: ${item.deadline}</p>
            <p>残り: ${days}日</p>
            <button onclick="complete('${item.id}')">完了</button>
          </div>
        `;

        list.appendChild(li);
      });
    }

    // ======================
    // 完了
    // ======================
    window.complete = async function (id) {
      await updateDoc(doc(db, "users", uid, "tasks", id), {
        completed: true
      });
    };

    // ======================
    // 追加
    // ======================
    // document.getElementById("saveBtn").onclick = async () => {

    //   const title = document.getElementById("title").value;
    //   const deadline = document.getElementById("deadline").value;

    //   await addDoc(collection(db, "users", uid, "tasks"), {
    //     title,
    //     deadline,
    //     completed: false,
    //     notified: {
    //       before: false,
    //       today: false,
    //       overdue: false
    //     }
    //   });
    // };

document.getElementById("saveBtn").onclick = async () => {
  console.log("保存ボタン押された");

  try {
    const ref = await addDoc(collection(db, "users", uid, "tasks"), {
      title: "テスト",
      deadline: "2026-01-01",
      completed: false
    });

    console.log("保存成功:", ref.id);

  } catch (e) {
    console.error("保存失敗:", e);
  }
};

    // ======================
    // 擬似Cron（自動通知）
    // ======================
    async function checkTasks() {

      const snapshot = await getDocs(collection(db, "users", uid, "tasks"));

      snapshot.forEach(async (docSnap) => {

        const item = { id: docSnap.id, ...docSnap.data() };

        if (item.completed) return;

        const days = new Date(item.deadline) - new Date();
        const d = Math.ceil(days / (1000 * 60 * 60 * 24));

        if (Notification.permission !== "granted") return;

        if (d === 1 || d === 0) {
          new Notification("締切アラート", {
            body: `${item.title}（残り${d}日）`,
            icon: "./icon.png",
            tag: `task-${item.id}-${d}`
          });
        }
      });
    }

    checkTasks();
    setInterval(checkTasks, 5 * 60 * 1000);

  }

};