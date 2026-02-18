// Инициализация Supabase
const client = supabase.createClient(
    "https://atgmcttfsqpdhfdbfqkj.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0Z21jdHRmc3FwZGhmZGJmcWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjg1NzMsImV4cCI6MjA4Njk0NDU3M30.VwGHqIXtsJZwA7hcpH2X1XrBDmT7TCt5xUgubhKB4Ns"
);

let isAdmin = false;

// ===============================
// Вход в админку
// ===============================
async function checkAdminPassword(pass) {
    const { data } = await client
        .from("admin_settings")
        .select("admin_password")
        .single();

    return data && pass === data.admin_password;
}

document.addEventListener("keydown", async e => {
    if (e.ctrlKey && e.shiftKey && e.key === "X") {
        const pass = prompt("Введите пароль администратора");

        if (await checkAdminPassword(pass)) {
            isAdmin = true;
            document.getElementById("adminUpload").classList.remove("hidden");
            document.getElementById("adminPostUpload").classList.remove("hidden");
            alert("Админ режим включён");
        } else {
            alert("Неверный пароль");
        }
    }
});

// ===============================
// ФАЙЛЫ
// ===============================
async function uploadFile() {
    if (!isAdmin) return alert("Нет доступа");

    const file = document.getElementById("fileInput").files[0];
    if (!file) return;

    const path = `files/${Date.now()}_${file.name}`;

    await client.storage.from("files").upload(path, file);

    loadFiles();
}

async function deleteFile(path) {
    if (!isAdmin) return alert("Нет доступа");

    await client.storage.from("files").remove([path]);

    loadFiles();
}

async function loadFiles() {
    const container = document.getElementById("fileList");
    container.innerHTML = "";

    const { data } = await client.storage.from("files").list("files");

    data.forEach(file => {
        const filePath = `files/${file.name}`;
        const url = client.storage.from("files").getPublicUrl(filePath).data.publicUrl;

        const div = document.createElement("div");
        div.className = "file-item";

        div.innerHTML = `
            <p>${file.name}</p>
            <a href="${url}" target="_blank" style="color:#4da3ff">Открыть</a>
            ${isAdmin ? `<button class="delete-btn" onclick="deleteFile('${filePath}')">Удалить</button>` : ""}
        `;

        container.appendChild(div);
    });
}

// ===============================
// ПУБЛИКАЦИИ
// ===============================
async function uploadPost() {
    if (!isAdmin) return alert("Нет доступа");

    const text = document.getElementById("postText").value;
    const file = document.getElementById("postFile").files[0];

    let fileUrl = null;

    if (file) {
        const path = `posts/${Date.now()}_${file.name}`;
        await client.storage.from("posts").upload(path, file);
        fileUrl = client.storage.from("posts").getPublicUrl(path).data.publicUrl;
    }

    await client.from("posts").insert([{ text, file_url: fileUrl }]);

    loadPosts();
}

async function deletePost(id) {
    if (!isAdmin) return alert("Нет доступа");

    await client.from("posts").delete().eq("id", id);

    loadPosts();
}

// ===============================
// КОММЕНТАРИИ (НОВАЯ СИСТЕМА)
// ===============================
async function loadComments(postId, box) {
    const { data } = await client
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("id", { ascending: true });

    box.innerHTML = "";

    data.forEach(c => {
        const div = document.createElement("div");
        div.className = "comment";
        div.innerHTML = `
            <b>${c.name}</b>
            <p>${c.text}</p>
            <small>${c.created_at}</small>
        `;
        box.appendChild(div);
    });
}

async function addComment(postId, nameInput, textInput, box) {
    const name = nameInput.value.trim();
    const text = textInput.value.trim();

    if (!name || !text) return;

    await client.from("comments").insert([{ post_id: postId, name, text }]);

    nameInput.value = "";
    textInput.value = "";

    loadComments(postId, box);
}

function toggleComments(postId) {
    const box = document.getElementById(`comments_${postId}`);
    const form = document.getElementById(`commentForm_${postId}`);

    if (box.classList.contains("hidden")) {
        box.classList.remove("hidden");
        form.classList.remove("hidden");
        loadComments(postId, box);
    } else {
        box.classList.add("hidden");
        form.classList.add("hidden");
    }
}

// ===============================
// ЗАГРУЗКА ПОСТОВ
// ===============================
async function loadPosts() {
    const container = document.getElementById("postsList");
    container.innerHTML = "";

    const { data } = await client
        .from("posts")
        .select("*")
        .order("id", { ascending: false });

    data.forEach(post => {
        const div = document.createElement("div");
        div.className = "post";

        let media = "";
        if (post.file_url) {
            if (post.file_url.endsWith(".mp4")) {
                media = `<video controls src="${post.file_url}"></video>`;
            } else {
                media = `<img src="${post.file_url}">`;
            }
        }

        div.innerHTML = `
            <p>${post.text}</p>
            ${media}

            <div class="comment-toggle" onclick="toggleComments(${post.id})">Комментарии</div>

            <div id="comments_${post.id}" class="comment-box hidden"></div>

            <div id="commentForm_${post.id}" class="hidden">
                <input id="commentName_${post.id}" placeholder="Ваше имя">
                <input id="commentText_${post.id}" placeholder="Ваш комментарий">
                <button onclick="addComment(${post.id}, commentName_${post.id}, commentText_${post.id}, comments_${post.id})">
                    Оставить комментарий
                </button>
            </div>

            ${isAdmin ? `<button class="delete-btn" onclick="deletePost(${post.id})">Удалить</button>` : ""}
        `;

        container.appendChild(div);
    });
}

// ===============================
// Переключение вкладок
// ===============================
document.getElementById("tabPosts").onclick = () => {
    document.getElementById("postsSection").classList.remove("hidden");
    document.getElementById("filesSection").classList.add("hidden");
};

document.getElementById("tabFiles").onclick = () => {
    document.getElementById("postsSection").classList.add("hidden");
    document.getElementById("filesSection").classList.remove("hidden");
};

// ===============================
// Старт
// ===============================
loadFiles();
loadPosts();
