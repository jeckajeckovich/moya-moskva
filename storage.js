const STORAGE_KEY = "my-moscow";

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadAll() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
}

function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}
