const supabase = window.supabase.createClient(
  "https://atgmcttfsqpdhfdbfqkj.supabase.co",
  "sb_publishable_9G7S9moMZ4316kVcOG2P9Q_QH8YNTlm"
);

// Загрузка файла
async function uploadFile(file) {
  const filePath = `files/${file.name}`;

  const { data, error } = await supabase.storage
    .from("files")
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error("Ошибка загрузки:", error);
    return null;
  }

  return getPublicUrl(filePath);
}

// Публичная ссылка
function getPublicUrl(path) {
  const { data } = supabase.storage.from("files").getPublicUrl(path);
  return data.publicUrl;
}

// Скачивание
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

// Удаление
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

// Список файлов
async function listFiles() {
  const { data, error } = await supabase.storage
    .from("files")
    .list("files");

  if (error) {
    console.error("Ошибка списка:", error);
    return [];
  }

  return data;
}
