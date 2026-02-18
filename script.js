// ===============================
// Supabase подключение
// ===============================
const SUPABASE_URL = "https://atgmcttfsqpdhfdbfqkj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0Z21jdHRmc3FwZGhmZGJmcWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjg1NzMsImV4cCI6MjA4Njk0NDU3M30.VwGHqIXtsJZwA7hcpH2X1XrBDmT7TCt5xUgubhKB4Ns";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===============================
// Загрузка постов
// ===============================
async function loadPosts() {
    const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error("Ошибка загрузки постов:", error);
        return;
    }

    const container = document.getElementById("posts");
    container.innerHTML = "";

    data.forEach(post => {
        const div = document.createElement("div");
        div.className = "post";
        div.innerHTML = `
            <p>${post.text}</p>
            ${post.file_url ? `<img src="${post.file_url}" class="post-img">` : ""}
            <div class="comments" id="comments-${post.id}"></div>
            <textarea id="comment-input-${post.id}" placeholder="Написать комментарий..."></textarea>
            <button onclick="addComment(${post.id})">Отправить</button>
        `;
        container.appendChild(div);

        loadComments(post.id);
    });
}

// ===============================
// Загрузка комментариев
// ===============================
async function loadComments(postId) {
    const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("id", { ascending: true });

    if (error) {
        console.error("Ошибка загрузки комментариев:", error);
        return;
    }

    const block = document.getElementById(`comments-${postId}`);
    block.innerHTML = "";

    data.forEach(c => {
        const div = document.createElement("div");
        div.className = "comment";
        div.innerHTML = `
            <p>${c.text}</p>
            <small>${new Date(c.created_at).toLocaleString()}</small>
            ${window.isAdmin ? `<button onclick="deleteComment(${c.id}, ${postId})">Удалить</button>` : ""}
        `;
        block.appendChild(div);
    });
}

// ===============================
// Добавление комментария
// ===============================
async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();

    if (!text) return;

    const { error } = await supabase
        .from("comments")
        .insert([{ post_id: postId, text }]);

    if (error) {
        console.error("Ошибка добавления комментария:", error);
        return;
    }

    input.value = "";
    loadComments(postId);
}

// ===============================
// Удаление комментария (админ)
// ===============================
async function deleteComment(id, postId) {
    const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Ошибка удаления:", error);
        return;
    }

    loadComments(postId);
}

// ===============================
// Админ режим
// ===============================
window.isAdmin = false;

document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.shiftKey && e.key === "X") {
        const pass = prompt("Введите пароль администратора");
        if (pass === "admin123") {
            window.isAdmin = true;
            alert("Админ режим включён");
            loadPosts();
        }
    }
});

// ===============================
// Старт
// ===============================
loadPosts();
