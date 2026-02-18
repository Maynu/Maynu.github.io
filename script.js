const client = supabase.createClient(
    "https://atgmcttfsqpdhfdbfqkj.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0Z21jdHRmc3FwZGhmZGJmcWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjg1NzMsImV4cCI6MjA4Njk0NDU3M30.VwGHqIXtsJZwA7hcpH2X1XrBDmT7TCt5xUgubhKB4Ns"
);

let isAdmin = false;

// переключение вкладок
document.getElementById("tabPosts").onclick = () => switchTab("posts");
document.getElementById("tabFiles").onclick = () => switchTab("files");

function switchTab(tab) {
    document.getElementById("tabPosts").classList.toggle("active", tab === "posts");
    document.getElementById("tabFiles").classList.toggle("active", tab === "files");

    document.getElementById("postsSection").classList.toggle("hidden", tab !== "posts");
    document.getElementById("filesSection").classList.toggle("hidden", tab !== "files");
}

// админ режим
document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.shiftKey && e.key === "X") {
        const pass = prompt("Введите пароль администратора");
        if (pass === "admin123") {
            isAdmin = true;
            document.getElementById("adminUpload").classList.remove("hidden");
            document.getElementById("adminPostUpload").classList.remove("hidden");
            alert("Админ режим включён");
        }
    }
});

// загрузка поста
async function uploadPost() {
    const text = document.getElementById("postText").value.trim();
    const file = document.getElementById("postFile").files[0];

    if (!text && !file) return;

    let file_url = null;
    let file_type = null;

    if (file) {
        const path = `posts/${Date.now()}_${file.name}`;
        await client.storage.from("files").upload(path, file);
        const { data } = client.storage.from("files").getPublicUrl(path);
        file_url = data.publicUrl;
        file_type = file.type;
    }

    await client.from("posts").insert([{ text, file_url, file_type }]);

    document.getElementById("postText").value = "";
    document.getElementById("postFile").value = "";

    loadPosts();
}

// загрузка списка постов
async function loadPosts() {
    const { data } = await client
        .from("posts")
        .select("*")
        .order("id", { ascending: false });

    const list = document.getElementById("postsList");
    list.innerHTML = "";

    data.forEach(post => {
        const div = document.createElement("div");
        div.className = "post";

        let media = "";
        if (post.file_url) {
            if (post.file_type?.startsWith("image")) {
                media = `<img src="${post.file_url}">`;
            } else if (post.file_type?.startsWith("video")) {
                media = `<video controls src="${post.file_url}"></video>`;
            } else {
                media = `<a href="${post.file_url}" target="_blank">📄 Скачать файл</a>`;
            }
        }

        div.innerHTML = `
            <p>${post.text || ""}</p>
            ${media}

            <button class="comment-toggle" onclick="toggleCommentBox(${post.id})">
                Комментарии
            </button>

            <div id="comment-box-${post.id}" class="comment-box hidden">
                <input id="nick-${post.id}" placeholder="Ваш ник">
                <textarea id="comment-${post.id}" placeholder="Комментарий"></textarea>
                <button onclick="addComment(${post.id})">Отправить</button>

                <div id="comments-${post.id}" style="margin-top:10px;"></div>
            </div>
        `;

        list.appendChild(div);
        loadComments(post.id);
    });
}

function toggleCommentBox(postId) {
    const box = document.getElementById(`comment-box-${postId}`);
    box.classList.toggle("hidden");
}

// добавление комментария
async function addComment(postId) {
    const nick = document.getElementById(`nick-${postId}`).value.trim();
    const text = document.getElementById(`comment-${postId}`).value.trim();

    if (!nick || !text) return;

    await client
        .from("comments")
        .insert([{ post_id: postId, text: `${nick}: ${text}` }]);

    document.getElementById(`comment-${postId}`).value = "";
    loadComments(postId);
}

// загрузка комментариев
async function loadComments(postId) {
    const { data } = await client
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("id");

    const block = document.getElementById(`comments-${postId}`);
    block.innerHTML = "";

    data.forEach(c => {
        const div = document.createElement("div");
        div.className = "comment";

        div.innerHTML = `
            <p>${c.text}</p>
            <small>${new Date(c.created_at).toLocaleString()}</small>
            ${isAdmin ? `<button class="delete-btn" onclick="deleteComment(${c.id}, ${postId})">Удалить</button>` : ""}
        `;

        block.appendChild(div);
    });
}

// удаление комментария
async function deleteComment(id, postId) {
    const { error } = await client
        .from("comments")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Ошибка удаления: " + error.message);
        return;
    }

    loadComments(postId);
}

// загрузка файла
async function uploadFile() {
    const file = document.getElementById("fileInput").files[0];
    if (!file) return;

    const path = `files/${Date.now()}_${file.name}`;
    await client.storage.from("files").upload(path, file);

    loadFiles();
}

// загрузка списка файлов
async function loadFiles() {
    const { data } = await client.storage.from("files").list("files");

    const list = document.getElementById("fileList");
    list.innerHTML = "";

    data.forEach(f => {
        const { data: publicData } = client.storage
            .from("files")
            .getPublicUrl(`files/${f.name}`);

        const url = publicData.publicUrl;

        const div = document.createElement("div");
        div.className = "file-item";
        div.innerHTML = `
            <p>${f.name}</p>
            <a href="${url}" target="_blank">Открыть</a>
        `;

        list.appendChild(div);
    });
}

loadPosts();
loadFiles();
