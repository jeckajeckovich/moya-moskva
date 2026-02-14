let selectedStation = null;
let mapData = {};

const mapObject = document.getElementById("metro-map");
const stationInfo = document.getElementById("station-info");
const noteInput = document.querySelector("textarea");

// ======================
// Ждём загрузку SVG
// ======================

mapObject.addEventListener("load", () => {

  const svgDoc = mapObject.contentDocument;
  if (!svgDoc) return;

  const stations = svgDoc.querySelectorAll("text");

  stations.forEach(el => {
    el.style.cursor = "pointer";

    el.addEventListener("click", () => {
      selectedStation = el.textContent.trim();
      stationInfo.innerText = selectedStation;

      if (mapData[selectedStation]) {
        noteInput.value = mapData[selectedStation].note || "";
      } else {
        noteInput.value = "";
      }
    });
  });

});

// ======================
// SAVE
// ======================

document.getElementById("save").addEventListener("click", () => {

  if (!selectedStation) {
    alert("Выберите станцию");
    return;
  }

  mapData[selectedStation] = {
    note: noteInput.value
  };

  alert("Сохранено ❤️");
});

// ======================
// SHARE (без Firebase)
// ======================

document.getElementById("share").addEventListener("click", () => {

  if (Object.keys(mapData).length === 0) {
    alert("Нет данных");
    return;
  }

  const code = btoa(unescape(encodeURIComponent(JSON.stringify(mapData))));
  prompt("Отправь ей этот код ❤️", code);

});

// ======================
// LOAD
// ======================

document.getElementById("load-map").addEventListener("click", () => {

  const input = document.querySelector('input[type="text"]').value;

  if (!input) {
    alert("Введите код");
    return;
  }

  try {
    mapData = JSON.parse(decodeURIComponent(escape(atob(input))));
    alert("Карта загружена ✨");
  } catch {
    alert("Неверный код");
  }

});
