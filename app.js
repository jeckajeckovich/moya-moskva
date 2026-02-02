const mapObject = document.getElementById("metro-map");

mapObject.addEventListener("load", () => {
  const svgDoc = mapObject.contentDocument;

  // временно: считаем станциями все circle
  const stations = svgDoc.querySelectorAll("circle");

  stations.forEach((station, index) => {
    station.style.cursor = "pointer";

    station.addEventListener("click", () => {
      const name = prompt(
        "Название станции:",
        station.getAttribute("data-name") || `Моё место #${index + 1}`
      );

      if (name) {
        station.setAttribute("data-name", name);
        station.style.fill = "#000"; // чтобы видеть клик
        console.log("Станция:", name);
      }
    });
  });
});
