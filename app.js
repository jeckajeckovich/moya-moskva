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
const viewport = document.getElementById("map-viewport");

// ===== STORAGE =====
let data = JSON.parse(localStorage.getItem("stations") || "{}");
let currentStationId = null;

// ===== MAP LOAD =====
mapObject.addEventListener("load", () => {
  const svg = mapObject.contentDocument;
  const stations = svg.querySelectorAll("text");

  stations.forEach((station, index) => {
    const originalName = station.textContent.trim();
    if (!originalName) return;

    const id = `station-${index}`;
    station.dataset.id = id;
    station.dataset.original = originalName;
    station.classList.add("station");
    station.style.cursor = "pointer";

    applyStationVisual(station);

    // hover
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
      info.textContent = originalName;
      noteInput.value = data[id]?.note || "";
      fileInput.value = "";
    });
  });

  updateStationsVisual();
});

// ===== SAVE =====
saveBtn.addEventListener("click", () => {
  if (!currentStationId) {
    alert("Выберите станцию");
    return;
  }

  if (!data[currentStationId]) {
    data[currentStationId] = {};
  }

  data[currentStationId].note = noteInput.value;

  const file = fileInput.files[0];
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
  updateStationsVisual();
}

// ===== RESET =====
resetBtn.addEventListener("click", () => {
  if (!confirm("Сбросить все изменения?")) return;
  localStorage.removeItem("stations");
  data = {};
  currentStationId = null;
  updateStationsVisual();
  info.textContent = "Кликните на станцию";
  noteInput.value = "";
  fileInput.value = "";
});

// ===== VISUAL =====
function applyStationVisual(station) {
  const id = station.dataset.id;
  const hasData = data[id]?.note || data[id]?.photo;

  station.classList.remove("station-filled", "station-empty");

  if (hasData) {
    station.classList.add("station-filled");
    station.style.opacity = "1";
    station.style.fontWeight = "700";
  } else {
    station.classList.add("station-empty");
    station.style.opacity = "0.35";
    station.style.fontWeight = "400";
  }
}

function updateStationsVisual() {
  const svg = mapObject.contentDocument;
  if (!svg) return;

  svg.querySelectorAll("text.station").forEach(applyStationVisual);
}

// ===== PAN & ZOOM =====
let scale = 1;
let panX = -400;
let panY = -50;
let isPanning = false;
let startX = 0;
let startY = 0;

function updateTransform() {
  viewport.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

updateTransform();

// zoom
viewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  scale += e.deltaY > 0 ? -0.1 : 0.1;
  scale = Math.min(Math.max(0.5, scale), 3);
  updateTransform();
}, { passive: false });

// pan
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
