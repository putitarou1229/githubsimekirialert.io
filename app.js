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

  items.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  items.forEach((item, index) => {
    const li = document.createElement("li");

    const today = new Date();
    const d = new Date(item.deadline);
    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));

    if (diff <= 0) li.classList.add("danger");
    else if (diff === 1) li.classList.add("warning");

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
}

document.getElementById("saveBtn").onclick = () => {
  const title = document.getElementById("title").value;
  const deadline = document.getElementById("deadline").value;
  const file = document.getElementById("image").files[0];

  if (!title || !deadline) return alert("入力して");

  if (file) {
    const reader = new FileReader();
    reader.onload = function () {
      items.push({
        title,
        deadline,
        image: reader.result
      });
      saveData();
      render();
    };
    reader.readAsDataURL(file);
  } else {
    items.push({ title, deadline });
    saveData();
    render();
  }

  modal.classList.add("hidden");
};

render();

// Service Worker登録
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}