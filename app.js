const { createClient } = supabase;

const supabaseUrl = "https://atgmcttfsqpdhfdbfqkj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0Z21jdHRmc3FwZGhmZGJmcWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjg1NzMsImV4cCI6MjA4Njk0NDU3M30.VwGHqIXtsJZwA7hcpH2X1XrBDmT7TCt5xUgubhKB4Ns";

const client = createClient(supabaseUrl, supabaseKey);

async function uploadFile(file) {
  const filePath = file.name;

  const { error } = await client
    .storage
    .from("files")
    .upload(filePath, file, { upsert: true });

  if (error) {
    alert("Ошибка загрузки: " + error.message);
    return;
  }

  listFiles();
}

async function downloadFile(name) {
  const { data, error } = await client
    .storage
    .from("files")
    .download(name);

  if (error) {
    alert("Ошибка скачивания: " + error.message);
    return;
  }

  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}

async function deleteFile(name) {
  const { error } = await client
    .storage
    .from("files")
    .remove([name]);

  if (error) {
    alert("Ошибка удаления: " + error.message);
    return;
  }

  listFiles();
}

async function listFiles() {
  const { data, error } = await client
    .storage
    .from("files")
    .list("", { limit: 100 });

  if (error) {
    console.error(error);
    return;
  }

  const ul = document.getElementById("filesList");
  ul.innerHTML = "";

  data.forEach(file => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${file.name}</span>
      <div class="file-actions">
        <button onclick="downloadFile('${file.name}')">⬇</button>
        <button onclick="deleteFile('${file.name}')">🗑</button>
      </div>
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
