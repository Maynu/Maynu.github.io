const { createClient } = supabase;

const supabaseUrl = "https://atgmcttfsqpdhfdbfqkj.supabase.co";
const supabaseKey =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0Z21jdHRmc3FwZGhmZGJmcWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjg1NzMsImV4cCI6MjA4Njk0NDU3M30.VwGHqIXtsJZwA7hcpH2X1XrBDmT7TCt5xUgubhKB4Ns";

const db = createClient(supabaseUrl, supabaseKey);

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

/* ------------------ ADMIN (Ctrl + Shift + X) ------------------ */

let isAdmin = false;

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") {
        const pass = prompt("Введите пароль администратора:");
        if (pass === "admin123") {
            isAdmin = true;
            document.getElementById("adminUpload").classList.remove("hidden");
            alert("Админ режим активирован");
            loadFiles();
        }
    }
});

/* ------------------ UPLOAD FILE ------------------ */

document.getElementById("fileInput").addEventListener("change", async (e) => {
    if (!isAdmin) return;

    const file = e.target.files[0];
    if (!file) return;

    // 1) Загружаем файл в Storage
    const { data: uploadData, error: uploadError } = await db
        .storage
        .from("files")
        .upload(file.name, file, { upsert: true });

    if (uploadError) {
        alert("Ошибка загрузки: " + uploadError.message);
        return;
    }

    // 2) Получаем публичный URL
    const { data: urlData } = db
        .storage
        .from("files")
        .getPublicUrl(file.name);

    const url = urlData.publicUrl;

    // 3) Записываем в таблицу files
    await db.from("files").insert({
        name: file.name,
        url: url
    });

    loadFiles();
});

/* ------------------ LOAD FILES ------------------ */

async function loadFiles() {
    const list = document.getElementById("fileList");
    list.innerHTML = "";

    const { data, error } = await db.from("files").select("*");

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(file => {
        const div = document.createElement("div");
        div.className = "file-item";

        const icon = document.createElement("span");
        icon.className = "material-icons file-icon";
        icon.textContent = getFileIcon(file.name);

        const name = document.createElement("div");
        name.textContent = file.name;

        div.appendChild(icon);
        div.appendChild(name);

        // Download
        div.onclick = () => window.open(file.url, "_blank");

        // Delete (admin only)
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

                await db.storage.from("files").remove([file.name]);
                await db.from("files").delete().eq("name", file.name);

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

loadFiles();
