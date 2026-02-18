// Инициализация Supabase
const client = supabase.createClient(
    "https://atgmcttfsqpdhfdbfqkj.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0Z21jdHRmc3FwZGhmZGJmcWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjg1NzMsImV4cCI6MjA4Njk0NDU3M30.VwGHqIXtsJZwA7hcpH2X1XrBDmT7TCt5xUgubhKB4Ns"
);

let isAdmin = false;
let isUploading = false;

// ===============================
// Проверка пароля администратора
// ===============================
async function checkAdminPassword(pass) {
    const { data, error } = await client
        .from("admin_settings")
        .select("admin_password")
        .single();

    if (error || !data) {
        console.error("Ошибка загрузки пароля:", error);
        return false;
    }

    return pass === data.admin_password;
}

// Горячая клавиша для входа в админку
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
// Загрузка файла
// ===============================
async function uploadFile() {
    if (!isAdmin) {
        alert("Нет доступа");
        return;
    }

    if (isUploading) return;
    isUploading = true;

    const file = document.getElementById("fileInput").files[0];
    if (!file) {
        isUploading = false;
        return;
    }

    const path = `files/${Date.now()}_${file.name}`;

    const { error } = await client.storage
        .from("files")
        .upload(path, file);

    if (error) {
        alert("Ошибка загрузки: " + error.message);
        isUploading = false;
        return;
    }

    isUploading = false;
    loadFiles();
}

// ===============================
// Удаление файла
// ===============================
async function deleteFile(path) {
    if (!isAdmin) {
        alert("Нет доступа");
        return;
    }

    const { error } = await client.storage
        .from("files")
        .remove([path]);

    if (error) {
        alert("Ошибка удаления: " + error.message);
        return;
    }

    loadFiles();
}

// ===============================
// Загрузка списка файлов
// ===============================
async function loadFiles() {
    const container = document.getElementById("filesContainer");
    container.innerHTML = "";

    const { data, error } = await client.storage
        .from("files")
        .list("files", { limit: 100 });

    if (error) {
        console.error("Ошибка загрузки списка:", error);
        return;
    }

    data.forEach(file => {
        const filePath = `files/${file.name}`;
        const url = client.storage.from("files").getPublicUrl(filePath).data.publicUrl;

        const div = document.createElement("div");
        div.className = "file-item";

        div.innerHTML = `
            <img src="${url}" class="file-thumb">
            <p>${file.name}</p>
            ${isAdmin ? `<button onclick="deleteFile('${filePath}')">Удалить</button>` : ""}
        `;

        container.appendChild(div);
    });
}

// ===============================
// Автозагрузка при старте
// ===============================
loadFiles();
