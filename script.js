// ===============================
// ИНИЦИАЛИЗАЦИЯ SUPABASE
// ===============================
const supabaseClient = supabase.createClient(
  "https://namidzjzqkwomcarrrhi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hbWlkemp6cWt3b21jYXJycmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDM0NjYsImV4cCI6MjA4Njk3OTQ2Nn0.9ePabtYYcTXg9vOIZxR2XFivome99MoBBJQSLAw2hmg"
);

let isAdmin = false;

// ===============================
// ОТКРЫТИЕ АДМИНКИ ПО CTRL + SHIFT + X
// ===============================
document.addEventListener("keydown", async (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") {
        const pass = prompt("Введите пароль администратора:");

        if (!pass) return;

        const { data, error } = await supabaseClient
            .from("admin_settings")
            .select("admin_password")
            .limit(1)
            .maybeSingle();

        if (error || !data) {
            alert("Ошибка проверки пароля");
            return;
        }

        if (pass === data.admin_password) {
            isAdmin = true;
            alert("Админ режим активирован");

            // показываем скрытые элементы
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
// ЗАГРУЗКА ПУБЛИКАЦИЙ
// ===============================
async function loadPosts() {
    const postsList = document.getElementById("postsList");
    postsList.innerHTML = "Загрузка...";

    const { data, error } = await supabaseClient
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        postsList.innerHTML = "Ошибка загрузки постов";
        return;
    }

    postsList.innerHTML = "";

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
            <div>${post.text}</div>
            ${media}
            <button class="comment-toggle" onclick="toggleComments(${post.id})">Комментарии</button>
            <div id="comments_${post.id}" class="hidden"></div>
            ${isAdmin ? `<button class="delete-btn" onclick="deletePost(${post.id})">Удалить</button>` : ""}
        `;

        postsList.appendChild(div);
    });
}

// ===============================
// ПУБЛИКАЦИЯ ПОСТА
// ===============================
async function uploadPost() {
    const text = document.getElementById("postText").value.trim();
    const file = document.getElementById("postFile").files[0];

    if (!text && !file) {
        alert("Добавь текст или файл");
        return;
    }

    let fileUrl = null;

    if (file) {
        const filePath = `posts/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabaseClient.storage
            .from("posts")
            .upload(filePath, file);

        if (uploadError) {
            alert("Ошибка загрузки файла");
            return;
        }

        fileUrl = supabaseClient.storage.from("posts").getPublicUrl(filePath).data.publicUrl;
    }

    const { error } = await supabaseClient.from("posts").insert({
        text,
        file_url: fileUrl
    });

    if (error) {
        alert("Ошибка публикации");
        return;
    }

    document.getElementById("postText").value = "";
    document.getElementById("postFile").value = "";

    loadPosts();
}

// ===============================
// КОММЕНТАРИИ
// ===============================
async function toggleComments(postId) {
    const block = document.getElementById(`comments_${postId}`);

    if (!block.classList.contains("hidden")) {
        block.classList.add("hidden");
        block.innerHTML = "";
        return;
    }

    block.classList.remove("hidden");
    block.innerHTML = "Загрузка комментариев...";

    const { data, error } = await supabaseClient
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

    if (error) {
        block.innerHTML = "Ошибка загрузки комментариев";
        return;
    }

    block.innerHTML = `
        <div class="comment-box">
            <input id="name_${postId}" placeholder="Ваше имя">
            <textarea id="text_${postId}" placeholder="Комментарий"></textarea>
            <button class="comment-toggle" onclick="addComment(${postId})">Отправить</button>
        </div>
    `;

    data.forEach(c => {
        const div = document.createElement("div");
        div.className = "comment";
        div.innerHTML = `
            <b>${c.name}</b><br>
            ${c.text}<br>
            <small>${new Date(c.created_at).toLocaleString()}</small>
        `;
        block.appendChild(div);
    });
}

async function addComment(postId) {
    const name = document.getElementById(`name_${postId}`).value.trim() || "Аноним";
    const text = document.getElementById(`text_${postId}`).value.trim();

    if (!text) {
        alert("Комментарий пустой");
        return;
    }

    const { error } = await supabaseClient.from("comments").insert({
        post_id: postId,
        name,
        text
    });

    if (error) {
        alert("Ошибка отправки комментария");
        return;
    }

    toggleComments(postId);
    toggleComments(postId);
}

// ===============================
// УДАЛЕНИЕ ПОСТА
// ===============================
async function deletePost(id) {
    if (!confirm("Удалить пост?")) return;

    const { error } = await supabaseClient.from("posts").delete().eq("id", id);

    if (error) {
        alert("Ошибка удаления");
        return;
    }

    loadPosts();
}

// ===============================
// ЗАГРУЗКА ФАЙЛОВ
// ===============================
async function loadFiles() {
    const fileList = document.getElementById("fileList");
    fileList.innerHTML = "Загрузка...";

    const { data, error } = await supabaseClient
        .from("files_meta")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        fileList.innerHTML = "Ошибка загрузки файлов";
        return;
    }

    fileList.innerHTML = "";

    data.forEach(file => {
        const div = document.createElement("div");
        div.className = "file-item";

        div.innerHTML = `
            <a href="${file.path}" target="_blank">${file.path}</a>
            ${isAdmin ? `<button class="delete-btn" onclick="deleteFile(${file.id}, '${file.path}')">Удалить</button>` : ""}
        `;

        fileList.appendChild(div);
    });
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

    const { error: uploadError } = await supabaseClient.storage
        .from("files")
        .upload(filePath, file);

    if (uploadError) {
        alert("Ошибка загрузки файла");
        return;
    }

    const publicUrl = supabaseClient.storage.from("files").getPublicUrl(filePath).data.publicUrl;

    const { error } = await supabaseClient.from("files_meta").insert({
        path: publicUrl
    });

    if (error) {
        alert("Ошибка записи в БД");
        return;
    }

    document.getElementById("fileInput").value = "";

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
