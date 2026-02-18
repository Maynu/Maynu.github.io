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
    const { data, error } = await client
        .from("admin_settings")
        .select("admin_password")
        .single();

    if (error || !data) return false;

    return pass === data.admin_password;
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
// Загрузка ФАЙЛОВ
// ===============================
async function uploadFile() {
    if (!isAdmin) return alert("Нет доступа");

    const file = document.getElementById("fileInput").files[0];
    if (!file) return;

    const path = `files/${Date.now()}_${file.name}`;

    const { error } = await client.storage
        .from("files")
        .upload(path, file);

    if (error) return alert("Ошибка загрузки");

    loadFiles();
}

async function deleteFile(path) {
    if (!isAdmin) return alert("Нет доступа");

    const { error } = await client.storage
        .from("files")
        .remove([path]);

    if (error) return alert("Ошибка удаления");

    loadFiles();
}

async function loadFiles() {
    const container = document.getElementById("fileList");
    container.innerHTML = "";

    const { data, error } = await client.storage
        .from("files")
        .list("files", { limit: 100 });

    if (error) return;

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
        const { error } = await client.storage.from("posts").upload(path, file);
        if (error) return alert("Ошибка загрузки файла");

        fileUrl = client.storage.from("posts").getPublicUrl(path).data.publicUrl;
    }

    const { error } = await client
        .from("posts")
        .insert([{ text, file_url: fileUrl }]);

    if (error) return alert("Ошибка публикации");

    document.getElementById("postText").value = "";
    document.getElementById("postFile").value = "";

    loadPosts();
}

async function deletePost(id) {
    if (!isAdmin) return alert("Нет доступа");

    const { error } = await client
        .from("posts")
        .delete()
        .eq("id", id);

    if (error) return alert("Ошибка удаления");

    loadPosts();
}

async function loadPosts() {
    const container = document.getElementById("postsList");
    container.innerHTML = "";

    const { data, error } = await client
        .from("posts")
        .select("*")
        .order("id", { ascending: false });

    if (error) return;

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
    document.getElementById("tabPosts").classList.add("active");
    document.getElementById("tabFiles").classList.remove("active");
};

document.getElementById("tabFiles").onclick = () => {
    document.getElementById("postsSection").classList.add("hidden");
    document.getElementById("filesSection").classList.remove("hidden");
    document.getElementById("tabFiles").classList.add("active");
    document.getElementById("tabPosts").classList.remove("active");
};

// ===============================
// Старт
// ===============================
loadFiles();
loadPosts();
