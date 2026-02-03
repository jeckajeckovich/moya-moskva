// ===== MAP TITLE =====
const mapTitle = document.getElementById("map-title");
const mapNameInput = document.getElementById("map-name-input");

const savedMapName = localStorage.getItem("mapName");
if (savedMapName) {
  mapTitle.textContent = savedMapName;
  mapNameInput.value = savedMapName;
}

mapNameInput.addEventListener("input", () => {
  const value = mapNameInput.value.trim();
  if (value) {
    mapTitle.textContent = value;
    localStorage.setItem("mapName", value);
  }
});

// ===== DOM =====
const mapObject = document.getElementById("metro-map");
const info = document.getElementById("station-info");
const noteInput = document.getElementById("note");
const fileInput = document.getElementById("photo");
const saveBtn = document.getElementById("save");
const resetBtn = document.getElementById("reset");

// ===== STORAGE =====
let data = JSON.parse(localStorage.getItem("stations") || "{}");
let currentStationId = null;

// ===== MAP LOAD =====
mapObject.addEventListener("load", () => {
  const svg = mapObject.contentDocument;

  // Берём все названия станций
  const stations = svg.querySelectorAll("text");

  stations.forEach((station, index) => {
  const originalName = station.textContent.trim();
  if (!originalName) return;

  const id = `station-${index}`;
  station.dataset.id = id;
  station.dataset.original = originalName;
  station.style.cursor = "pointer";

  // сбрасываем классы
  station.classList.remove("station-filled", "station-empty");

  // если есть воспоминание
  if (data[id] && (data[id].note || data[id].photo)) {
    station.classList.add("station-filled");
  } else {
    station.classList.add("station-empty");
  }

  // hover — делаем заметнее
  station.addEventListener("mouseenter", () => {
    station.style.opacity = "1";
  });

  station.addEventListener("mouseleave", () => {
    if (station.classList.contains("station-empty")) {
      station.style.opacity = "0.35";
    }
  });

  // click
  station.addEventListener("click", () => {
    currentStationId = id;
    info.textContent = station.textContent;
    noteInput.value = data[id]?.note || "";
    fileInput.value = "";
  });
});


    const id = `station-${index}`;
    station.dataset.id = id;
    station.dataset.original = originalName;
    station.style.cursor = "pointer";

    // Если есть сохранённые данные
    if (data[id]?.name) {
      station.textContent = data[id].name;
      station.style.fontWeight = "bold";
      station.style.opacity = "1";
    } else {
      station.style.opacity = "0.4"; // пустые — тусклее
    }

    // HOVER
    station.addEventListener("mouseenter", () => {
      station.style.opacity = "1";
    });

    station.addEventListener("mouseleave", () => {
      if (!data[id]) station.style.opacity = "0.4";
    });

    // CLICK
    station.addEventListener("click", () => {
      currentStationId = id;

      info.textContent = station.textContent;
      noteInput.value = data[id]?.note || "";
      fileInput.value = "";
    });
  });
});

// ===== SAVE =====
saveBtn.addEventListener("click", () => {
  if (!currentStationId) return alert("Выберите станцию");

  const note = noteInput.value;
  const file = fileInput.files[0];

  if (!data[currentStationId]) {
    data[currentStationId] = {};
  }

  data[currentStationId].note = note;

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      data[currentStationId].photo = reader.result;
      persist();
    };
    reader.readAsDataURL(file);
  } else {
    persist();
  }
});

function persist() {
  localStorage.setItem("stations", JSON.stringify(data));
  location.reload();
}

// ===== RESET ALL =====
resetBtn.addEventListener("click", () => {
  if (!confirm("Сбросить все изменения?")) return;
  localStorage.removeItem("stations");
  location.reload();
});

// ===== PAN & ZOOM =====
const viewport = document.getElementById("map-viewport");

let scale = 1;
let panX = -400; // ← СТАРТОВЫЙ СДВИГ ВЛЕВО
let panY = -50;

let isPanning = false;
let startX = 0;
let startY = 0;

function updateTransform() {
  viewport.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

// применяем сразу
updateTransform();

// Zoom
viewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  scale = Math.min(Math.max(0.5, scale + delta), 3);
  updateTransform();
}, { passive: false });

// Pan
viewport.addEventListener("mousedown", (e) => {
  isPanning = true;
  startX = e.clientX - panX;
  startY = e.clientY - panY;
});

window.addEventListener("mousemove", (e) => {
  if (!isPanning) return;
  panX = e.clientX - startX;
  panY = e.clientY - startY;
  updateTransform();
});

window.addEventListener("mouseup", () => {
  isPanning = false;
});
