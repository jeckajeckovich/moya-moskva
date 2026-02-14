let selectedStation = null;
let mapData = {};

const stationInfo = document.getElementById("station-info");
const noteInput = document.querySelector("textarea");
const fileInput = document.querySelector('input[type="file"]');

// ==========================
// STATION CLICK
// ==========================

document.querySelectorAll("#map-viewport text").forEach(el => {
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

// ==========================
// SAVE
// ==========================

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

// ==========================
// SHARE (без firebase пока)
// ==========================

document.getElementById("share").addEventListener("click", () => {
  if (Object.keys(mapData).length === 0) {
    alert("Нет данных");
    return;
  }

  const code = btoa(JSON.stringify(mapData));
  prompt("Отправь ей этот код ❤️", code);
});

// ==========================
// LOAD
// ==========================

document.getElementById("load-map").addEventListener("click", () => {
  const input = document.querySelector('input[type="text"]').value;

  if (!input) {
    alert("Введите код");
    return;
  }

  try {
    mapData = JSON.parse(atob(input));
    renderLoadedData();
    alert("Карта загружена ✨");
  } catch {
    alert("Неверный код");
  }
});

// ==========================
// RENDER
// ==========================

function renderLoadedData() {
  document.querySelectorAll("#map-viewport text").forEach(el => {
    const name = el.textContent.trim();

    if (mapData[name]) {
      el.style.opacity = "1";
      el.style.fontWeight = "700";
    } else {
      el.style.opacity = "0.3";
      el.style.fontWeight = "400";
    }
  });
}
