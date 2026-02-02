const mapObject = document.getElementById("metro-map");

mapObject.addEventListener("load", () => {
  const svgDoc = mapObject.contentDocument;

  // временно: считаем станциями все circle
  const stations = svgDoc.querySelectorAll("circle");

  stations.forEach((station, index) => {const info = document.getElementById("station-info");

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
