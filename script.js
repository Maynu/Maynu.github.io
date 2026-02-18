const client = supabase.createClient(
    "https://atgmcttfsqpdhfdbfqkj.supabase.co",
    "YOUR_PUBLIC_ANON_KEY"
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

    await client.storage.from("files").upload(path, file);

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

function toggleDescription(name) {
    const box = document.getElementById(`desc_${name}`);
    box.classList.toggle("hidden");
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

        const div = document.createElement("div");
        div.className = "file-item";

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <p>${file.name}</p>
                <div class="comment-toggle" onclick="toggleDescription('${file.name}')">▼</div>
            </div>

            <div id="desc_${file.name}" class="hidden" style="margin-top:10px; opacity:0.8;">
                ${info?.description || "Нет описания"}
            </div>

            ${isAdmin ? `<button class="delete-btn" onclick="deleteFile('${filePath}')">Удалить</button>` : ""}
        `;

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
// ПОСТЫ + КОММЕНТАРИИ (оставляем как у тебя)
// ===============================

loadFiles();
loadPosts();
