const mapObject = document.getElementById("metro-map");
const info = document.getElementById("station-info");
const viewport = document.getElementById("map-viewport");

// ====== STATIONS ======
mapObject.addEventListener("load", () => {
  const svg = mapObject.contentDocument;

  // станции = названия
  const stations = svg.querySelectorAll("text");
  const saved = JSON.parse(localStorage.getItem("stations") || "{}");

  stations.forEach((station, index) => {
    const originalName = station.textContent.trim();
    if (!originalName) return;

    const id = `station-${index}`;
    station.style.cursor = "pointer";

    if (saved[id]) {
      station.textContent = saved[id];
      station.style.fontWeight = "bold";
    }

    station.addEventListener("mouseenter", () => {
      station.style.fill = "#000";
    });

    station.addEventListener("mouseleave", () => {
      station.style.fill = "";
    });

    station.addEventListener("click", (e) => {
      e.stopPropagation(); // важно для pan
      const name = prompt("Название станции:", station.textContent);
      if (!name) return;

      station.textContent = name;
      station.style.fontWeight = "bold";

      saved[id] = name;
      localStorage.setItem("stations", JSON.stringify(saved));

      info.innerHTML = `
        <strong>${name}</strong>
        <p>Ранее: ${originalName}</p>
      `;
    });
  });
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
