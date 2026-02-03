const mapObject = document.getElementById("metro-map");
const info = document.getElementById("station-info");

mapObject.addEventListener("load", () => {
  const svg = mapObject.contentDocument;

  // СТАНЦИИ = ТЕКСТОВЫЕ ПОДПИСИ
  const stations = svg.querySelectorAll("text");

  const saved = JSON.parse(localStorage.getItem("stations") || "{}");

  stations.forEach((station, index) => {
    const originalName = station.textContent.trim();
    if (!originalName) return;

    const id = `station-${index}`;
    station.setAttribute("data-id", id);
    station.style.cursor = "pointer";

    // если переименовано
    if (saved[id]) {
      station.textContent = saved[id];
      station.style.fontWeight = "bold";
    }

    // hover — ТЕСТ
    station.addEventListener("mouseenter", () => {
      station.style.fill = "#000";
    });

    station.addEventListener("mouseleave", () => {
      station.style.fill = "";
    });

    // click
    station.addEventListener("click", () => {
      const current = station.textContent;
      const name = prompt("Название станции:", current);
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
