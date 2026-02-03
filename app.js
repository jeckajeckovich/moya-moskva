// ====== RESTORE FROM SHARE LINK ======
if (location.hash.length > 1) {
  try {
    const decoded = decodeURIComponent(atob(location.hash.slice(1)));
    localStorage.setItem("stations", decoded);
  } catch (e) {
    console.warn("Некорректная ссылка");
  }
}

// ====== ELEMENTS ======
const mapObject = document.getElementById("metro-map");
const viewport = document.getElementById("map-viewport");

const emptyState = document.getElementById("empty-state");
const editor = document.getElementById("editor");
const nameInput = document.getElementById("station-name");
const noteInput = document.getElementById("station-note");
const photoInput = document.getElementById("station-photo");
const photoPreview = document.getElementById("photo-preview");

const saveStationBtn = document.getElementById("save-station");
const resetStationBtn = document.getElementById("reset-station");
const resetAllBtn = document.getElementById("reset-all");
const shareBtn = document.getElementById("share-map");

// ====== STATE ======
let activeStation = null;
let activeId = null;
const saved = JSON.parse(localStorage.getItem("stations") || "{}");

// ====== LOAD SVG ======
mapObject.addEventListener("load", () => {
  const svg = mapObject.contentDocument;
  const stations = svg.querySelectorAll("text");

  stations.forEach((station) => {
    const originalName = station.textContent.trim();
    if (!originalName) return;

    const id = originalName.toLowerCase().replace(/\s+/g, "_");
    station.dataset.id = id;
    station.style.cursor = "pointer";

    if (saved[id]?.name) {
      station.textContent = saved[id].name;
      station.style.fontWeight = "bold";
    }

    station.addEventListener("mouseenter", () => {
      station.style.fill = "#000";
    });

    station.addEventListener("mouseleave", () => {
      station.style.fill = "";
    });

    station.addEventListener("click", (e) => {
      e.stopPropagation();

      activeStation = station;
      activeId = id;

      emptyState.hidden = true;
      editor.hidden = false;

      nameInput.value = saved[id]?.name || station.textContent;
      noteInput.value = saved[id]?.note || "";

      if (saved[id]?.photo) {
        photoPreview.src = saved[id].photo;
        photoPreview.style.display = "block";
      } else {
        photoPreview.style.display = "none";
      }
    });
  });
});

// ====== SAVE STATION ======
saveStationBtn.addEventListener("click", () => {
  if (!activeStation || !activeId) return;

  const name = nameInput.value.trim();
  if (!name) return;

  const note = noteInput.value.trim();

  activeStation.textContent = name;
  activeStation.style.fontWeight = "bold";

  if (!saved[activeId]) saved[activeId] = {};
  saved[activeId].name = name;
  saved[activeId].note = note;

  localStorage.setItem("stations", JSON.stringify(saved));
});

// ====== PHOTO ======
photoInput.addEventListener("change", () => {
  if (!activeId) return;
  const file = photoInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    photoPreview.src = reader.result;
    photoPreview.style.display = "block";

    if (!saved[activeId]) saved[activeId] = {};
    saved[activeId].photo = reader.result;

    localStorage.setItem("stations", JSON.stringify(saved));
  };
  reader.readAsDataURL(file);
});

// ====== RESET ONE ======
resetStationBtn.addEventListener("click", () => {
  if (!activeId) return;
  delete saved[activeId];
  localStorage.setItem("stations", JSON.stringify(saved));
  location.reload();
});

// ====== RESET ALL ======
resetAllBtn.addEventListener("click", () => {
  if (!confirm("Удалить все изменения?")) return;
  localStorage.removeItem("stations");
  history.replaceState(null, "", location.pathname);
  location.reload();
});

// ====== SHARE ======
shareBtn.addEventListener("click", () => {
  const data = localStorage.getItem("stations");
  if (!data) {
    alert("Нет изменений для шаринга");
    return;
  }

  const encoded = btoa(encodeURIComponent(data));
  const url = `${location.origin}${location.pathname}#${encoded}`;

  navigator.clipboard.writeText(url);
  alert("Ссылка скопирована 👍");
});

// ====== ZOOM & PAN ======
let scale = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let startX = 0;
let startY = 0;

function updateTransform() {
  viewport.style.transform =
    `translate(${panX}px, ${panY}px) scale(${scale})`;
}

viewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  scale = Math.min(Math.max(0.5, scale + delta), 3);
  updateTransform();
}, { passive: false });

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
