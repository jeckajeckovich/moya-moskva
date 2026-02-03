const mapObject = document.getElementById("metro-map");
const viewport = document.getElementById("map-viewport");

const emptyState = document.getElementById("empty-state");
const editor = document.getElementById("editor");
const nameInput = document.getElementById("station-name");
const noteInput = document.getElementById("station-note");
const saveBtn = document.getElementById("save-station");
const resetBtn = document.getElementById("reset-station");

let activeStation = null;
let activeId = null;

// ====== LOAD SVG & STATIONS ======
mapObject.addEventListener("load", () => {
  const svg = mapObject.contentDocument;
  const stations = svg.querySelectorAll("text");

  const saved = JSON.parse(localStorage.getItem("stations") || "{}");

  stations.forEach((station, index) => {
    const originalName = station.textContent.trim();
    if (!originalName) return;

    const id = `station-${index}`;
    station.style.cursor = "pointer";

    if (saved[id]) {
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
    });
  });

  // ===== SAVE =====
  saveBtn.onclick = () => {
    if (!activeStation || !activeId) return;

    const name = nameInput.value.trim();
    const note = noteInput.value.trim();
    if (!name) return;

    activeStation.textContent = name;
    activeStation.style.fontWeight = "bold";

    saved[activeId] = { name, note };
    localStorage.setItem("stations", JSON.stringify(saved));
  };

  // ===== RESET =====
  resetBtn.onclick = () => {
    if (!activeStation || !activeId) return;

    delete saved[activeId];
    localStorage.setItem("stations", JSON.stringify(saved));
    location.reload();
  };
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

// zoom колесом
viewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  scale = Math.min(Math.max(0.5, scale + delta), 3);
  updateTransform();
}, { passive: false });

// pan мышью
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
