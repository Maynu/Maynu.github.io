const { createClient } = supabase;

const supabaseUrl = "https://atgmcttfsqpdhfdbfqkj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0Z21jdHRmc3FwZGhmZGJmcWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjg1NzMsImV4cCI6MjA4Njk0NDU3M30.VwGHqIXtsJZwA7hcpH2X1XrBDmT7TCt5xUgubhKB4Ns";

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

document.getElementById("uploadBtn").addEventListener("click", () => {
  const input = document.getElementById("fileInput");
  if (!input.files.length) return alert("Выбери файл!");
  uploadFile(input.files[0]);
});

listFiles();
