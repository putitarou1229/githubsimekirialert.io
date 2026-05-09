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
  deleteDoc, //削除機能
  doc,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.onload = async () => {

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
  const db = getFirestore(app);
  const auth = getAuth(app);
  const messaging = getMessaging(app);

  const list = document.getElementById("list");
  const saveBtn = document.getElementById("saveBtn");
  const addBtn = document.getElementById("addBtn");
  const modal = document.getElementById("modal");
  const closeBtn = document.getElementById("closeBtn");

  addBtn.onclick = () => {
    modal.classList.remove("hidden");
  };

  closeBtn.onclick = () => {
    modal.classList.add("hidden");
  };

  if (!saveBtn || !list) {
    console.error("HTML要素が見つかりません");
    return;
  }

  let uid = null;
  let editId = null;

  // ======================
  // 匿名ログイン
  // ======================
  try {
    const user = await signInAnonymously(auth);
    uid = user.user.uid;
    console.log("ログインOK:", uid);
  } catch (e) {
    console.error("ログイン失敗:", e);
    return;
  }

  // ======================
  // 通知許可
  // ======================
  await Notification.requestPermission();

  // ======================
  // Service Worker & Token
  // ======================
  const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");

  const token = await getToken(messaging, {
    vapidKey: "BES2l0snOl90A-49auNHyDvUjCk7Gt6TOAd7-1kVhT7piiu5OCnYY4wkZtWgahEUgxTOwgEk8LixBEc2vP74gcc",
    serviceWorkerRegistration: registration
  });
  //追記箇所⇓
  console.log("FCMトークン:", token);
  await addDoc(collection(db, "tokens"), {
    uid,
    token,
    createdAt: new Date()
  });

  onMessage(messaging, (payload) => {
    console.log("foreground:", payload);
    new Notification(
      payload.notification.title,
      {
        body: payload.notification.body,
        icon: "./icon.png"
      }
    );
  });

  // ======================
  // 日数計算
  // ======================
  function getDaysLeft(deadline) {

    const now = new Date();
    const target = new Date(deadline);

    return Math.ceil(
      (target - now) / (1000 * 60 * 60 * 24)
    );
  }

  function getStatus(days) {

    if (days < 0) return "overdue";

    if (days <= 3) return "warning";

    return "safe";
  }

  // ======================
  // Firestoreリアルタイム取得
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

    items = items.filter(item => !item.completed);

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
           
          <p>${days < 0
          ? "期限切れ"
          : `残り: ${days}日`}
          </p>

          <button onclick="complete('${item.id}')">完了</button>
          <button onclick="editTask('${item.id}', '${item.title}', '${item.deadline}')">編集</button>
          <button onclick="removeTask('${item.id}')">削除</button>
          
        </div>
      `;

      list.appendChild(li);
    });
  }

  // ======================
  // 完了処理
  // ======================
  window.complete = async function (id) {
    await updateDoc(doc(db, "users", uid, "tasks", id), {
      completed: true
    });
  };

  //編集処理
  window.editTask = function (id, title, deadline) {

    editId = id;

    document.getElementById("title").value = title;
    document.getElementById("deadline").value = deadline;

    modal.classList.remove("hidden");
  };


  //削除処理
  window.removeTask = async function (id) {
    if (!confirm("削除する？")) return;
    await deleteDoc(doc(db, "users", uid, "tasks", id));
  };

  // ======================
  // 追加ボタン（完成版）
  // ======================
  saveBtn.onclick = async () => {

    console.log("保存ボタン押された");

    if (!uid) {
      console.error("UID未取得");
      return;
    }

    const title = document.getElementById("title")?.value;
    const deadline = document.getElementById("deadline")?.value;

    if (!title || !deadline) {
      alert("入力してください");
      return;
    }

    try {

      if (editId) {
        // 編集モード
        await updateDoc(doc(db, "users", uid, "tasks", editId), {
          title: title.trim(),
          deadline
        });

        console.log("更新成功:", editId);

        editId = null;

      } else {
        // 新規追加
        const ref = await addDoc(
          collection(db, "users", uid, "tasks"),
          {
            title: title.trim(),
            deadline,
            completed: false,
            notified: {
              before: false,
              today: false,
              overdue: false
            },
            createdAt: new Date()
          }
        );

        console.log("保存成功:", ref.id);
      }

      // 共通処理
      document.getElementById("title").value = "";
      document.getElementById("deadline").value = "";
      modal.classList.add("hidden");

    } catch (e) {
      console.error("保存失敗:", e);
    }
  };

  // ======================
  // 擬似Cron通知
  // ======================
  async function checkTasks() {

    const snapshot = await getDocs(collection(db, "users", uid, "tasks"));

    snapshot.forEach(docSnap => {

      const item = docSnap.data();

      if (item.completed) return;
      if (Notification.permission !== "granted") return;

      const days = getDaysLeft(item.deadline);

      if (days === 1 || days === 0) {
        new Notification("締切アラート", {
          body: `${item.title}（残り${days}日）`,
          icon: "./icon.png",
          tag: `task-${docSnap.id}-${days}`
        });
      }
    });
  }

  checkTasks();
  setInterval(checkTasks, 5 * 60 * 1000);
};