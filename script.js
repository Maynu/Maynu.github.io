/* ------------------ FIREBASE ------------------ */

const firebaseConfig = {
  apiKey: "AIzaSyD7FrrFe2A8oynmKXqBs7bZEq4uIy2C_RU",
  authDomain: "mr-chay-239db.firebaseapp.com",
  projectId: "mr-chay-239db",
  storageBucket: "mr-chay-239db.appspot.com",
  messagingSenderId: "922540749815",
  appId: "1:922540749815:web:454db43196a170289274f2",
  measurementId: "G-JQNS6K6K0R"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

/* ------------------ TABS ------------------ */

const tabPosts = document.getElementById("tabPosts");
const tabFiles = document.getElementById("tabFiles");

const postsSection = document.getElementById("postsSection");
const filesSection = document.getElementById("filesSection");

tabPosts.onclick = () => {
    tabPosts.classList.add("active");
    tabFiles.classList.remove("active");
    postsSection.classList.remove("hidden");
    filesSection.classList.add("hidden");
};

tabFiles.onclick = () => {
    tabFiles.classList.add("active");
    tabPosts.classList.remove("active");
    postsSection.classList.add("hidden");
    filesSection.classList.remove("hidden");
};

/* ------------------ ADMIN MODE ------------------ */

let isAdmin = false;

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") {
        const pass = prompt("Введите пароль администратора:");
        if (pass === "admin123") {
            isAdmin = true;
            document.getElementById("adminUpload").classList.remove("hidden");
            document.getElementById("adminPost").classList.remove("hidden");
            alert("Админ режим активирован");
            loadFiles();
            loadPosts();
        }
    }
});

/* ------------------ CREATE POST ------------------ */

document.getElementById("createPostBtn").onclick = async () => {
    const text = prompt("Введите текст публикации:");
    if (!text) return;

    await db.collection("posts").add({
        text: text,
        time: Date.now()
    });

    loadPosts();
};

/* ------------------ LOAD POSTS ------------------ */

async function loadPosts() {
    const list = document.getElementById("postList");
    list.innerHTML = "";

    const snap = await db.collection("posts").orderBy("time", "desc").get();

    snap.forEach(doc => {
        const data = doc.data();

        const div = document.createElement("div");
        div.className = "post";
        div.textContent = data.text;

        if (isAdmin) {
            const del = document.createElement("span");
            del.className = "material-icons";
            del.style.marginLeft = "auto";
            del.style.cursor = "pointer";
            del.style.color = "#EF5350";
            del.textContent = "delete";

            del.onclick = async (e) => {
                e.stopPropagation();
                if (!confirm("Удалить публикацию?")) return;
                await db.collection("posts").doc(doc.id).delete();
                loadPosts();
            };

            div.appendChild(del);
        }

        list.appendChild(div);
    });
}

/* ------------------ FILE UPLOAD ------------------ */

document.getElementById("fileInput").addEventListener("change", async (e) => {
    if (!isAdmin) return;

    const file = e.target.files[0];
    if (!file) return;

    const ref = storage.ref("files/" + file.name);
    await ref.put(file);

    const url = await ref.getDownloadURL();

    await db.collection("files").add({
        name: file.name,
        url: url
    });

    loadFiles();
});

/* ------------------ LOAD FILES ------------------ */

async function loadFiles() {
    const list = document.getElementById("fileList");
    list.innerHTML = "";

    const snap = await db.collection("files").get();
    snap.forEach(doc => {
        const data = doc.data();

        const div = document.createElement("div");
        div.className = "file-item";

        const icon = document.createElement("span");
        icon.className = "material-icons file-icon";
        icon.textContent = getFileIcon(data.name);

        const name = document.createElement("div");
        name.textContent = data.name;

        div.appendChild(icon);
        div.appendChild(name);

        div.onclick = () => {
            window.open(data.url + "&alt=media", "_blank");
        };

        if (isAdmin) {
            const del = document.createElement("span");
            del.className = "material-icons";
            del.style.marginLeft = "auto";
            del.style.cursor = "pointer";
            del.style.color = "#EF5350";
            del.textContent = "delete";

            del.onclick = async (e) => {
                e.stopPropagation();
                if (!confirm("Удалить файл?")) return;

                const ref = storage.refFromURL(data.url);
                await ref.delete();
                await db.collection("files").doc(doc.id).delete();

                loadFiles();
            };

            div.appendChild(del);
        }

        list.appendChild(div);
    });
}

function getFileIcon(name) {
    const ext = name.split(".").pop().toLowerCase();
    if (ext === "pdf") return "picture_as_pdf";
    if (["png","jpg","jpeg","gif"].includes(ext)) return "image";
    if (["zip","rar","7z"].includes(ext)) return "folder_zip";
    if (["mp4","mov","avi"].includes(ext)) return "movie";
    if (["txt","md"].includes(ext)) return "description";
    return "insert_drive_file";
}

/* ------------------ INITIAL LOAD ------------------ */

loadPosts();
loadFiles();
