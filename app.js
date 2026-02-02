const mapObject = document.getElementById("metro-map");
const info = document.getElementById("station-info");

mapObject.addEventListener("load", () => {
  const svg = mapObject.contentDocument;

  // ВАЖНО: временно ловим ВСЕ circle
  const stations = svg.querySelectorAll("circle");

  // загружаем сохранённые данные
  const saved = JSON.parse(localStorage.getItem("stations") || "{}");

  stations.forEach((station, index) => {
    const id = station.getAttribute("id") || `station-${index}`;
    station.setAttribute("data-id", id);
    station.style.cursor = "pointer";

    // если станция уже сохранена
    if (saved[id]) {
      station.setAttribute("data-name", saved[id]);
      station.style.fill = "#000";
    }

    // hover — визуальный тест
    station.addEventListener("mouseenter", () => {
      station.style.stroke = "#000";
      station.style.strokeWidth = "2";
    });

    station.addEventListener("mouseleave", () => {
      station.style.strokeWidth = "0";
    });

    // click
    station.addEventListener("click", () => {
      const current = station.getAttribute("data-name") || "";
      const name = prompt("Название станции:", current);
      if (!name) return;

      station.setAttribute("data-name", name);
      station.style.fill = "#000";

      saved[id] = name;
      localStorage.setItem("stations", JSON.stringify(saved));

      info.innerHTML = `
        <strong>${name}</strong>
        <p>Станция сохранена</p>
      `;
    });
  });
});
