const mapObject = document.getElementById("metro-map");
const info = document.getElementById("station-info");

mapObject.addEventListener("load", () => {
  const svgDoc = mapObject.contentDocument;
  const stations = svgDoc.querySelectorAll("circle");

  // загрузка сохранённых данных
  const saved = JSON.parse(localStorage.getItem("stations") || "{}");

  stations.forEach((station, index) => {
    const id = station.getAttribute("id") || `station-${index}`;
    station.setAttribute("data-id", id);
    station.style.cursor = "pointer";

    // если уже сохранено
    if (saved[id]) {
      station.setAttribute("data-name", saved[id]);
      station.style.fill = "#000";
    }

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
