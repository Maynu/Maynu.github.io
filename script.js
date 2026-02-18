// ===============================
// ИНИЦИАЛИЗАЦИЯ SUPABASE
// ===============================
const supabaseClient = supabase.createClient(
  "https://namidzjzqkwomcarrrhi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hbWlkemp6cWt3b21jYXJycmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDM0NjYsImV4cCI6MjA4Njk3OTQ2Nn0.9ePabtYYcTXg9vOIZxR2XFivome99MoBBJQSLAw2hmg"
);

let isAdmin = false;

// ===============================
// АДМИНКА ПО CTRL + SHIFT + X
// ===============================
document.addEventListener("keydown", async (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") {
        const pass = prompt("Введите пароль администратора:");

        if (!pass) return;

        const { data } = await supabaseClient
            .from("admin_settings")
            .select("admin_password")
            .limit(1)
            .maybeSingle();

        if (data && pass === data.admin_password) {
            isAdmin = true;
            alert("Админ режим активирован");

            document.getElementById("adminPostUpload").classList.remove("hidden");
            document.getElementById("adminUpload").classList.remove("hidden");

            loadPosts();
            loadFiles();
        } else {
            alert("Неверный пароль");
        }
    }
});

// ===============================
// ФОРМАТ ДАТЫ (1 января)
// ===============================
function formatDate(dateString) {
    const date = new Date(dateString);
    const months = [
        "января", "февраля", "марта", "апреля", "мая", "июня",
        "июля", "августа", "сентября", "октября", "ноября", "декабря"
    ];
    return `${date.getDate()} ${months[date.getMonth()]}`;
}

// ===============================
// ЗАГРУЗКА ПУБЛИКАЦИЙ
// ===============================
async function loadPosts() {
    const postsList = document.getElementById("postsList");
    postsList.innerHTML = "Загрузка...";

    const { data } = await supabaseClient
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

    postsList.innerHTML = "";

    data.forEach(post => {
        const div = document.createElement("div");
        div.className = "post";

        let media = "";
        if (post.file_url) {
            if (post.file_url.endsWith(".mp4")) {
                media = `<video controls src="${post.file_url}" style="width:100%; border-radius:10px;"></video>`;
            } else {
                media = `<img src="${post.file_url}" style="width:100%; border-radius:10px;">`;
            }
        }

        div.innerHTML = `
            <div>${post.text}</div>
            ${media}

            <div style="display:flex; gap:6px; margin-top:10px;">
                <button class="comment-btn" onclick="toggleComments(${post.id})">Комментарии</button>
                <button class="comment-btn" onclick="toggleCommentForm(${post.id})">Комментировать</button>
            </div>

            <div id="commentForm_${post.id}" class="hidden"></div>
            <div id="comments_${post.id}" class="hidden"></div>

            ${isAdmin ? `<button class="delete-btn" onclick="deletePost(${post.id})">Удалить</button>` : ""}
        `;

        postsList.appendChild(div);
    });
}

// ===============================
// ФОРМА КОММЕНТАРИЯ
// ===============================
function toggleCommentForm(postId) {
    const form = document.getElementById(`commentForm_${postId}`);

    if (!form.classList.contains("hidden")) {
        form.classList.add("hidden");
        form.innerHTML = "";
        return;
    }

    form.classList.remove("hidden");

    form.innerHTML = `
        <div class="comment-box">
            <input id="name_${postId}" placeholder="Ваше имя">
            <textarea id="text_${postId}" placeholder="Комментарий"></textarea>
            <button class="comment-btn" onclick="addComment(${postId})">Отправить</button>
        </div>
    `;
}

// ===============================
// СПИСОК КОММЕНТАРИЕВ (красивый интерфейс)
// ===============================
async function toggleComments(postId) {
    const block = document.getElementById(`comments_${postId}`);

    if (!block.classList.contains("hidden")) {
        block.classList.add("hidden");
        block.innerHTML = "";
        return;
    }

    block.classList.remove("hidden");
    block.innerHTML = "Загрузка...";

    const { data } = await supabaseClient
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

    block.innerHTML = "";

    data.forEach(c => {
        const div = document.createElement("div");
        div.className = "comment";

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <b>${c.name}</b>
                <span style="color:#888; font-size:12px;">${formatDate(c.created_at)}</span>
            </div>
            <div style="white-space:pre-wrap; margin-bottom:10px;">
                ${c.text}
            </div>
        `;

        block.appendChild(div);
    });
}

// ===============================
// ДОБАВЛЕНИЕ КОММЕНТАРИЯ
// ===============================
async function addComment(postId) {
    const name = document.getElementById(`name_${postId}`).value.trim() || "Аноним";
    const text = document.getElementById(`text_${postId}`).value.trim();

    if (!text) {
        alert("Комментарий пустой");
        return;
    }

    await supabaseClient.from("comments").insert({
        post_id: postId,
        name,
        text
    });

    toggleComments(postId);
    toggleComments(postId);
}

// ===============================
// ЗАГРУЗКА ПОСТА
// ===============================
async function uploadPost() {
    const text = document.getElementById("postText").value.trim();
    const file = document.getElementById("postFile").files[0];

    let fileUrl = null;

    if (file) {
        const filePath = `posts/${Date.now()}_${file.name}`;
        await supabaseClient.storage.from("posts").upload(filePath, file);
        fileUrl = supabaseClient.storage.from("posts").getPublicUrl(filePath).data.publicUrl;
    }

    await supabaseClient.from("posts").insert({
        text: text,
        file_url: fileUrl
    });

    loadPosts();
}

// ===============================
// УДАЛЕНИЕ ПОСТА
// ===============================
async function deletePost(id) {
    if (!confirm("Удалить пост?")) return;

    await supabaseClient.from("posts").delete().eq("id", id);

    loadPosts();
}

// ===============================
// ЗАГРУЗКА ФАЙЛОВ (плитки + скачивание)
// ===============================
async function loadFiles() {
    const fileList = document.getElementById("fileList");
    fileList.innerHTML = "Загрузка...";

    const { data } = await supabaseClient
        .from("files_meta")
        .select("*")
        .order("created_at", { ascending: false });

    fileList.innerHTML = "";

    data.forEach(file => {
        const fileName = file.path.split("/").pop();

        const div = document.createElement("div");
        div.className = "file-item";
        div.style.cursor = "pointer";

        div.innerHTML = `
            <div onclick="downloadFile('${file.path}')">
                📄 ${fileName}
            </div>
            ${isAdmin ? `<button class="delete-btn" onclick="deleteFile(${file.id}, '${file.path}')">Удалить</button>` : ""}
        `;

        fileList.appendChild(div);
    });
}

// ===============================
// СКАЧИВАНИЕ ФАЙЛА
// ===============================
function downloadFile(url) {
    const a = document.createElement("a");
    a.href = url;
    a.download = url.split("/").pop();
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// ===============================
// ЗАГРУЗКА ФАЙЛА
// ===============================
async function uploadFile() {
    const file = document.getElementById("fileInput").files[0];

    if (!file) {
        alert("Выбери файл");
        return;
    }

    const filePath = `files/${Date.now()}_${file.name}`;

    await supabaseClient.storage.from("files").upload(filePath, file);

    const publicUrl = supabaseClient.storage.from("files").getPublicUrl(filePath).data.publicUrl;

    await supabaseClient.from("files_meta").insert({
        path: publicUrl
    });

    loadFiles();
}

// ===============================
// УДАЛЕНИЕ ФАЙЛА
// ===============================
async function deleteFile(id, url) {
    if (!confirm("Удалить файл?")) return;

    try {
        const path = url.split("/storage/v1/object/public/files/")[1];
        if (path) {
            await supabaseClient.storage.from("files").remove([path]);
        }
    } catch {}

    await supabaseClient.from("files_meta").delete().eq("id", id);

    loadFiles();
}

// ===============================
// СТАРТОВАЯ ЗАГРУЗКА
// ===============================
loadPosts();
loadFiles();
