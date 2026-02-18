// ===============================
// ИНИЦИАЛИЗАЦИЯ SUPABASE
// ===============================
const client = supabase.createClient(
    "https://atgmcttfsqpdhfdbfqkj.supabase.co",
    "ВСТАВЬ_СВОЙ_АНОН_КЛЮЧ_СЮДА"
);

let isAdmin = false;

// ===============================
// АДМИН
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
    const description = document.getElementById("fileDescription").value;

    if (!file) return;

    const path = `files/${Date.now()}_${file.name}`;

    // Загружаем файл
    await client.storage.from("files").upload(path, file);

    // Сохраняем описание
    await client.from("files_meta").insert([
        { path, description }
    ]);

    loadFiles();
}

async function deleteFile(path) {
    if (!isAdmin) return alert("Нет доступа");

    await client.storage.from("files").remove([path]);
    await client.from("files_meta").delete().eq("path", path);

    loadFiles();
}

function toggleDescription(id) {
    const box = document.getElementById(`desc_${id}`);
    if (box) box.classList.toggle("hidden");
}

async function loadFiles() {
    const container = document.getElementById("fileList");
    container.innerHTML = "";

    const { data: files } = await client.storage.from("files").list("files");
    const { data: meta } = await client.from("files_meta").select("*");

    files.forEach(file => {
        const filePath = `files/${file.name}`;
        const url = client.storage.from("files").getPublicUrl(filePath).data.publicUrl;

        const info = meta.find(m => m.path === filePath);

        // Делаем безопасный ID
        const safeId = file.name.replace(/[^a-zA-Z0-9_-]/g, "_");

        const div = document.createElement("div");
        div.className = "file-item";

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <p>${file.name}</p>
                <div class="comment-toggle" onclick="toggleDescription('${safeId}')">▼</div>
            </div>

            <div id="desc_${safeId}" class="hidden" style="margin-top:10px; opacity:0.8;">
                ${info?.description || "Нет описания"}
            </div>

            ${isAdmin ? `<button class="delete-btn" onclick="deleteFile('${filePath}')">Удалить</button>` : ""}
        `;

        // Скачивание файла
        div.style.cursor = "pointer";
        div.onclick = (e) => {
            if (e.target.classList.contains("comment-toggle")) return;

            const a = document.createElement("a");
            a.href = url;
            a.download = file.name;
            a.click();
        };

        container.appendChild(div);
    });
}

// ===============================
// ПОСТЫ
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
// КОММЕНТАРИИ
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

async function addComment(postId) {
    const nameInput = document.getElementById(`commentName_${postId}`);
    const textInput = document.getElementById(`commentText_${postId}`);

    const name = nameInput.value.trim();
    const text = textInput.value.trim();

    if (!name || !text) return;

    await client.from("comments").insert([{ post_id: postId, name, text }]);

    nameInput.value = "";
    textInput.value = "";

    loadComments(postId, document.getElementById(`comments_${postId}`));
}

function toggleComments(postId) {
    const box = document.getElementById(`comments_${postId}`);
    const addBtn = document.getElementById(`addCommentBtn_${postId}`);
    const form = document.getElementById(`commentForm_${postId}`);

    if (box.classList.contains("hidden")) {
        box.classList.remove("hidden");
        addBtn.classList.remove("hidden");
        loadComments(postId, box);
    } else {
        box.classList.add("hidden");
        addBtn.classList.add("hidden");
        form.classList.add("hidden");
    }
}

function showCommentForm(postId) {
    const form = document.getElementById(`commentForm_${postId}`);
    form.classList.remove("hidden");
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

            <div style="display:flex; gap:10px; margin-top:10px;">
                <div class="comment-toggle" onclick="toggleComments(${post.id})">Комментарии</div>
                <div id="addCommentBtn_${post.id}" class="comment-toggle hidden" onclick="showCommentForm(${post.id})">Оставить комментарий</div>
            </div>

            <div id="comments_${post.id}" class="comment-box hidden"></div>

            <div id="commentForm_${post.id}" class="hidden" style="margin-top:10px;">
                <input id="commentName_${post.id}" placeholder="Ваше имя">
                <input id="commentText_${post.id}" placeholder="Ваш комментарий">
                <button class="comment-toggle" onclick="addComment(${post.id})">Отправить</button>
            </div>

            ${isAdmin ? `<button class="delete-btn" onclick="deletePost(${post.id})">Удалить</button>` : ""}
        `;

        container.appendChild(div);
    });
}

// ===============================
// СТАРТ
// ===============================
loadFiles();
loadPosts();
