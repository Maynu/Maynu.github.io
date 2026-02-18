// Инициализация Supabase
const supabase = window.supabase.createClient(
  "https://atgmcttfsqpdhfdbfqkj.supabase.co",
  "https://atgmcttfsqpdhfdbfqkj.supabase.co"
);

// Загрузка файла
async function uploadFile(file) {
  const filePath = `files/${file.name}`;

  const { data, error } = await supabase.storage
    .from("files")
    .upload(filePath, file, {
      upsert: true
    });

  if (error) {
    console.error("Ошибка загрузки:", error);
    return null;
  }

  return getPublicUrl(filePath);
}

// Получение публичной ссылки
function getPublicUrl(path) {
  const { data } = supabase.storage.from("files").getPublicUrl(path);
  return data.publicUrl;
}

// Скачивание файла
async function downloadFile(path) {
  const { data, error } = await supabase.storage
    .from("files")
    .download(path);

  if (error) {
    console.error("Ошибка скачивания:", error);
    return null;
  }

  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = path.split("/").pop();
  a.click();
}

// Удаление файла
async function deleteFile(path) {
  const { error } = await supabase.storage
    .from("files")
    .remove([path]);

  if (error) {
    console.error("Ошибка удаления:", error);
    return false;
  }

  return true;
}

// Получение списка файлов
async function listFiles() {
  const { data, error } = await supabase.storage
    .from("files")
    .list("files", {
      limit: 100,
      offset: 0
    });

  if (error) {
    console.error("Ошибка списка:", error);
    return [];
  }

  return data;
}
