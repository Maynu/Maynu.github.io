// ИНИЦИАЛИЗАЦИЯ SUPABASE
const supabaseClient = supabase.createClient(
  "https://namidzjzqkwomcarrrhi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hbWlkemp6cWt3b21jYXJycmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDM0NjYsImV4cCI6MjA4Njk3OTQ2Nn0.9ePabtYYcTXg9vOIZxR2XFivome99MoBBJQSLAw2hmg"
);

// ====== ТАБЫ ======
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

// ====== ФАЙЛЫ ======
const fileInput = document.getElementById("fileInput");
const fileDescriptionInput = document.getElementById("fileDescription");
const uploadFileBtn = document.getElementById("uploadFileBtn");
const fileUploadStatus = document.getElementById("fileUploadStatus");
const filesList = document.getElementById("filesList");

async function loadFiles() {
  filesList.innerHTML = "Загрузка файлов...";
  const { data, error } = await supabaseClient
    .from("files_meta")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    filesList.innerHTML = `<div class="danger">Ошибка загрузки файлов: ${error.message}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    filesList.innerHTML = "<div class='small'>Файлов пока нет</div>";
    return;
  }

  filesList.innerHTML = "";
  data.forEach((file) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div><b>${file.path}</b></div>
      <div class="small">${file.description || ""}</div>
      <div class="small"><a href="${file.path}" target="_blank">${file.path}</a></div>
      <div class="small">${new Date(file.created_at).toLocaleString()}</div>
    `;
    filesList.appendChild(div);
  });
}

uploadFileBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) {
    fileUploadStatus.textContent = "Выбери файл";
    fileUploadStatus.className = "small danger";
    return;
  }

  fileUploadStatus.textContent = "Загрузка...";
  fileUploadStatus.className = "small";

  const filePath = `files/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("files")
    .upload(filePath, file);

  if (uploadError) {
    fileUploadStatus.textContent = "Ошибка загрузки: " + uploadError.message;
    fileUploadStatus.className = "small danger";
    return;
  }

  const publicUrl = supabaseClient.storage.from("files").getPublicUrl(filePath).data.publicUrl;

  const { error: metaError } = await supabaseClient.from("files_meta").insert({
    path: publicUrl,
    description: fileDescriptionInput.value || null,
  });

  if (metaError) {
    fileUploadStatus.textContent = "Файл загружен, но ошибка записи в БД: " + metaError.message;
    fileUploadStatus.className = "small danger";
  } else {
    fileUploadStatus.textContent = "Файл загружен";
    fileUploadStatus.className = "small success";
    fileInput.value = "";
    fileDescriptionInput.value = "";
    loadFiles();
    loadAdminFiles();
  }
});

// ====== ПОСТЫ ======
const postText = document.getElementById("postText");
const postFileUrl = document.getElementById("postFileUrl");
const createPostBtn = document.getElementById("createPostBtn");
const postCreateStatus = document.getElementById("postCreateStatus");
const postsList = document.getElementById("postsList");

async function loadPosts() {
  postsList.innerHTML = "Загрузка постов...";
  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    postsList.innerHTML = `<div class="danger">Ошибка загрузки постов: ${error.message}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    postsList.innerHTML = "<div class='small'>Постов пока нет</div>";
    return;
  }

  postsList.innerHTML = "";
  data.forEach((post) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div>${post.text || ""}</div>
      ${
        post.file_url
          ? `<div class="small"><a href="${post.file_url}" target="_blank">${post.file_url}</a></div>`
          : ""
      }
      <div class="small">${new Date(post.created_at).toLocaleString()}</div>
    `;
    postsList.appendChild(div);
  });

  loadCommentPostSelect();
  loadComments();
  loadAdminPosts();
}

createPostBtn.addEventListener("click", async () => {
  const text = postText.value.trim();
  const fileUrl = postFileUrl.value.trim() || null;

  if (!text) {
    postCreateStatus.textContent = "Текст поста пустой";
    postCreateStatus.className = "small danger";
    return;
  }

  postCreateStatus.textContent = "Создание поста...";
  postCreateStatus.className = "small";

  const { error } = await supabaseClient.from("posts").insert({
    text,
    file_url: fileUrl,
  });

  if (error) {
    postCreateStatus.textContent = "Ошибка: " + error.message;
    postCreateStatus.className = "small danger";
  } else {
    postCreateStatus.textContent = "Пост создан";
    postCreateStatus.className = "small success";
    postText.value = "";
    postFileUrl.value = "";
    loadPosts();
  }
});

// ====== КОММЕНТАРИИ ======
const commentPostSelect = document.getElementById("commentPostSelect");
const commentName = document.getElementById("commentName");
const commentText = document.getElementById("commentText");
const addCommentBtn = document.getElementById("addCommentBtn");
const commentAddStatus = document.getElementById("commentAddStatus");
const commentsList = document.getElementById("commentsList");

async function loadCommentPostSelect() {
  const { data, error } = await supabaseClient
    .from("posts")
    .select("id, text")
    .order("created_at", { ascending: false });

  if (error || !data) {
    commentPostSelect.innerHTML = "<option value=''>Нет постов</option>";
    return;
  }

  commentPostSelect.innerHTML = "";
  data.forEach((post) => {
    const opt = document.createElement("option");
    opt.value = post.id;
    opt.textContent = `${post.id}: ${post.text?.slice(0, 40) || ""}`;
    commentPostSelect.appendChild(opt);
  });
}

async function loadComments() {
  commentsList.innerHTML = "Загрузка комментариев...";
  const { data, error } = await supabaseClient
    .from("comments")
    .select("*, posts(text)")
    .order("created_at", { ascending: false });

  if (error) {
    commentsList.innerHTML = `<div class="danger">Ошибка загрузки комментариев: ${error.message}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    commentsList.innerHTML = "<div class='small'>Комментариев пока нет</div>";
    return;
  }

  commentsList.innerHTML = "";
  data.forEach((c) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div><b>${c.name || "Аноним"}</b></div>
      <div>${c.text}</div>
      <div class="small">Пост: ${c.posts?.text?.slice(0, 60) || c.post_id}</div>
      <div class="small">${new Date(c.created_at).toLocaleString()}</div>
    `;
    commentsList.appendChild(div);
  });
}

addCommentBtn.addEventListener("click", async () => {
  const postId = commentPostSelect.value;
  const name = commentName.value.trim() || "Аноним";
  const text = commentText.value.trim();

  if (!postId) {
    commentAddStatus.textContent = "Выбери пост";
    commentAddStatus.className = "small danger";
    return;
  }
  if (!text) {
    commentAddStatus.textContent = "Текст комментария пустой";
    commentAddStatus.className = "small danger";
    return;
  }

  commentAddStatus.textContent = "Добавление...";
  commentAddStatus.className = "small";

  const { error } = await supabaseClient.from("comments").insert({
    post_id: postId,
    name,
    text,
  });

  if (error) {
    commentAddStatus.textContent = "Ошибка: " + error.message;
    commentAddStatus.className = "small danger";
  } else {
    commentAddStatus.textContent = "Комментарий добавлен";
    commentAddStatus.className = "small success";
    commentText.value = "";
    loadComments();
  }
});

// ====== АДМИН ======
const adminPasswordInput = document.getElementById("adminPasswordInput");
const checkAdminBtn = document.getElementById("checkAdminBtn");
const adminStatus = document.getElementById("adminStatus");
const adminPanel = document.getElementById("adminPanel");
const newAdminPassword = document.getElementById("newAdminPassword");
const changeAdminPasswordBtn = document.getElementById("changeAdminPasswordBtn");
const adminPasswordChangeStatus = document.getElementById("adminPasswordChangeStatus");
const adminPostsList = document.getElementById("adminPostsList");
const adminFilesList = document.getElementById("adminFilesList");

let isAdmin = false;

async function checkAdminPassword() {
  const { data, error } = await supabaseClient
    .from("admin_settings")
    .select("admin_password")
    .limit(1)
    .maybeSingle();

  if (error) {
    adminStatus.textContent = "Ошибка чтения настроек: " + error.message;
    adminStatus.className = "small danger";
    return false;
  }

  if (!data) {
    adminStatus.textContent = "Нет записи admin_settings";
    adminStatus.className = "small danger";
    return false;
  }

  return data.admin_password;
}

checkAdminBtn.addEventListener("click", async () => {
  adminStatus.textContent = "Проверка...";
  adminStatus.className = "small";

  const realPass = await checkAdminPassword();
  if (!realPass) return;

  if (adminPasswordInput.value === realPass) {
    isAdmin = true;
    adminStatus.textContent = "Админ режим активирован";
    adminStatus.className = "small success";
    adminPanel.style.display = "block";
    loadAdminPosts();
    loadAdminFiles();
  } else {
    adminStatus.textContent = "Неверный пароль";
    adminStatus.className = "small danger";
    adminPanel.style.display = "none";
    isAdmin = false;
  }
});

changeAdminPasswordBtn.addEventListener("click", async () => {
  if (!isAdmin) {
    adminPasswordChangeStatus.textContent = "Нет прав";
    adminPasswordChangeStatus.className = "small danger";
    return;
  }

  const newPass = newAdminPassword.value.trim();
  if (!newPass) {
    adminPasswordChangeStatus.textContent = "Пароль пустой";
    adminPasswordChangeStatus.className = "small danger";
    return;
  }

  adminPasswordChangeStatus.textContent = "Сохранение...";
  adminPasswordChangeStatus.className = "small";

  const { error } = await supabaseClient
    .from("admin_settings")
    .update({ admin_password: newPass })
    .neq("id", 0); // обновим все записи

  if (error) {
    adminPasswordChangeStatus.textContent = "Ошибка: " + error.message;
    adminPasswordChangeStatus.className = "small danger";
  } else {
    adminPasswordChangeStatus.textContent = "Пароль обновлён";
    adminPasswordChangeStatus.className = "small success";
    newAdminPassword.value = "";
  }
});

// ====== АДМИН: ПОСТЫ / ФАЙЛЫ ======
async function loadAdminPosts() {
  if (!isAdmin) return;
  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    adminPostsList.innerHTML = "<div class='small danger'>Ошибка загрузки постов</div>";
    return;
  }

  if (data.length === 0) {
    adminPostsList.innerHTML = "<div class='small'>Постов нет</div>";
    return;
  }

  adminPostsList.innerHTML = "";
  data.forEach((post) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div><b>ID: ${post.id}</b></div>
      <div>${post.text || ""}</div>
      <div class="small">${new Date(post.created_at).toLocaleString()}</div>
      <button data-id="${post.id}" class="delete-post-btn">Удалить</button>
    `;
    adminPostsList.appendChild(div);
  });

  adminPostsList.querySelectorAll(".delete-post-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const { error } = await supabaseClient.from("posts").delete().eq("id", id);
      if (error) {
        alert("Ошибка удаления поста: " + error.message);
      } else {
        loadPosts();
        loadAdminPosts();
      }
    });
  });
}

async function loadAdminFiles() {
  if (!isAdmin) return;
  const { data, error } = await supabaseClient
    .from("files_meta")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    adminFilesList.innerHTML = "<div class='small danger'>Ошибка загрузки файлов</div>";
    return;
  }

  if (data.length === 0) {
    adminFilesList.innerHTML = "<div class='small'>Файлов нет</div>";
    return;
  }

  adminFilesList.innerHTML = "";
  data.forEach((file) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div><b>${file.path}</b></div>
      <div class="small">${file.description || ""}</div>
      <button data-id="${file.id}" data-path="${file.path}" class="delete-file-btn">Удалить</button>
    `;
    adminFilesList.appendChild(div);
  });

  adminFilesList.querySelectorAll(".delete-file-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const url = btn.dataset.path;

      // попытка удалить из storage (если URL публичный)
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname.split("/storage/v1/object/public/files/")[1];
        if (path) {
          await supabaseClient.storage.from("files").remove([path]);
        }
      } catch (e) {
        console.log("Не удалось разобрать URL файла", e);
      }

      const { error } = await supabaseClient.from("files_meta").delete().eq("id", id);
      if (error) {
        alert("Ошибка удаления файла: " + error.message);
      } else {
        loadFiles();
        loadAdminFiles();
      }
    });
  });
}

// ====== СТАРТОВАЯ ЗАГРУЗКА ======
loadFiles();
loadPosts();
loadCommentPostSelect();
loadComments();
