// Инициализация Supabase
const { createClient } = supabase;

const supabaseUrl = "https://atgmcttfsqpdhfdbfqkj.supabase.co";
const supabaseKey = "sb_publishable_9G7S9moMZ4316kVcOG2P9Q_QH8YNTlm";

const client = createClient(supabaseUrl, supabaseKey);

// Загрузка файла
async function uploadFile(file) {
  const filePath = file.name;

  const { data, error } = await client
    .storage
    .from("files")
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error("Ошибка загрузки:", error);
    alert("Ошибка загрузки: " + error.message);
    return;
  }

  alert("Файл загружен!");
  listFiles();
}

// Скачивание файла
async function downloadFile(name) {
  const { data, error } = await client
    .storage
    .from("files")
    .download(name);

  if (error) {
    console.error("Ошибка скачивания:", error);
    alert("Ошибка скачивания: " + error.message);
    return;
  }

  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}

// Удаление файла
async function deleteFile(name) {
  const { error } = await client
    .storage
    .from("files")
    .remove([name]);

  if (error) {
    console.error("Ошибка удаления:", error);
    alert("Ошибка удаления: " + error.message);
    return;
  }

  alert("Файл удалён!");
  listFiles();
}

// Список файлов
async function listFiles() {
  const { data, error } = await client
    .storage
    .from("files")
    .list("", { limit: 100 });

  if (error) {
    console.error("Ошибка списка:", error);
    return;
  }

  const ul = document.getElementById("filesList");
  ul.innerHTML = "";

  data.forEach(file => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${file.name}
      <button onclick="downloadFile('${file.name}')">Скачать</button>
      <button onclick="deleteFile('${file.name}')">Удалить</button>
    `;
    ul.appendChild(li);
  });
}

// Кнопка загрузки
document.getElementById("uploadBtn").addEventListener("click", () => {
  const input = document.getElementById("fileInput");
  if (!input.files.length) return alert("Выбери файл!");
  uploadFile(input.files[0]);
});

// Загружаем список при старте
listFiles();
