// ===============================
// GLOBAL STATE
// ===============================

let currentStation = null;
let mapData = {};

// ===============================
// DOM
// ===============================

const stationInfo = document.getElementById("station-info");
const noteInput = document.getElementById("note");
const photoInput = document.getElementById("photo");
const saveBtn = document.getElementById("save");
const resetBtn = document.getElementById("reset");
const shareBtn = document.getElementById("share");
const shareResult = document.getElementById("share-result");
const mapCodeInput = document.getElementById("map-code-input");
const loadBtn = document.getElementById("load-map");

const photoModal = document.getElementById("photo-modal");
const modalImg = document.getElementById("modal-img");

// ===============================
// WAIT SVG LOAD
// ===============================

const metroObject = document.getElementById("metro-map");

metroObject.addEventListener("load", () => {
  const svgDoc = metroObject.contentDocument;
  const stations = svgDoc.querySelectorAll("text");

  stations.forEach(station => {
    station.style.cursor = "pointer";

    station.addEventListener("click", () => {
      const name = station.textContent.trim();
      selectStation(name);
    });
  });
});

// ===============================
// SELECT STATION
// ===============================

function selectStation(name) {
  currentStation = name;
  stationInfo.textContent = name;

  if (mapData[name]) {
    noteInput.value = mapData[name].note || "";
  } else {
    noteInput.value = "";
  }
}

// ===============================
// SAVE
// ===============================

saveBtn.addEventListener("click", () => {
  if (!currentStation) return alert("Выберите станцию");

  const note = noteInput.value;
  const file = photoInput.files[0];

  if (!mapData[currentStation]) {
    mapData[currentStation] = {};
  }

  mapData[currentStation].note = note;

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      mapData[currentStation].photo = e.target.result;
      alert("Сохранено");
    };
    reader.readAsDataURL(file);
  } else {
    alert("Сохранено");
  }

  photoInput.value = "";
});

// ===============================
// RESET
// ===============================

resetBtn.addEventListener("click", () => {
  if (!confirm("Удалить всю карту?")) return;

  mapData = {};
  noteInput.value = "";
  stationInfo.textContent = "Кликните на станцию";
  alert("Карта очищена");
});

// ===============================
// SHARE
// ===============================

shareBtn.addEventListener("click", () => {
  if (Object.keys(mapData).length === 0) {
    alert("Карта пустая");
    return;
  }

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(mapData))));
  shareResult.innerHTML = `
    <textarea style="width:100%;height:120px;">${encoded}</textarea>
  `;
});

// ===============================
// LOAD MAP
// ===============================

loadBtn.addEventListener("click", () => {
  const code = mapCodeInput.value.trim();
  if (!code) return alert("Введите код");

  try {
    const decoded = JSON.parse(
      decodeURIComponent(escape(atob(code)))
    );

    mapData = decoded;
    alert("Карта загружена");
  } catch (e) {
    alert("Неверный код");
  }
});

// ===============================
// PHOTO VIEW
// ===============================

document.addEventListener("dblclick", () => {
  if (!currentStation) return;
  if (!mapData[currentStation]) return;
  if (!mapData[currentStation].photo) return;

  modalImg.src = mapData[currentStation].photo;
  photoModal.classList.remove("hidden");
});

photoModal.addEventListener("click", () => {
  photoModal.classList.add("hidden");
});
