// ==========================
// FIREBASE INIT
// ==========================

const firebaseConfig = {
  apiKey: "ТВОЙ_API_KEY",
  authDomain: "ТВОЙ_PROJECT.firebaseapp.com",
  projectId: "ТВОЙ_PROJECT_ID",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================
// STATE
// ==========================

let selectedStation = null;
let mapData = {};

const stationInfo = document.getElementById("station-info");
const noteInput = document.querySelector("textarea");
const fileInput = document.querySelector('input[type="file"]');

// ==========================
// SVG LOAD + CLICK STATIONS
// ==========================

const mapObject = document.getElementById("metro-map");

mapObject.addEventListener("load", () => {
  const svg = mapObject.contentDocument;
  if (!svg) return;

  const stations = svg.querySelectorAll("text");

  stations.forEach(el => {
    el.style.cursor = "pointer";

    el.addEventListener("click", () => {
      const name = el.textContent.trim();
      selectedStation = name;
      stationInfo.innerText = name;

      if (mapData[name]) {
        noteInput.value = mapData[name].note || "";
      } else {
        noteInput.value = "";
      }
    });
  });
});

// ==========================
// IMAGE COMPRESSION
// ==========================

function compressImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const img = new Image();

      img.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;

        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressed);
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

// ==========================
// SAVE STATION
// ==========================

document.getElementById("save").addEventListener("click", async () => {
  if (!selectedStation) {
    alert("Выберите станцию");
    return;
  }

  const note = noteInput.value;
  let photo = null;

  if (fileInput.files[0]) {
    photo = await compressImage(fileInput.files[0]);
  }

  mapData[selectedStation] = {
    note: note,
    photo: photo || null
  };

  alert("Сохранено ❤️");
});

// ==========================
// CREATE MAP CODE
// ==========================

document.getElementById("share").addEventListener("click", async () => {
  if (Object.keys(mapData).length === 0) {
    alert("Нет данных для сохранения");
    return;
  }

  const id = Math.random().toString(36).substring(2, 9);

  await db.collection("maps").doc(id).set({
    created: new Date(),
    data: mapData
  });

  alert("Код карты: " + id);
});

// ==========================
// LOAD MAP
// ==========================

document.getElementById("load-map").addEventListener("click", async () => {
  const id = document.querySelector('input[type="text"]').value;

  if (!id) {
    alert("Введите код карты");
    return;
  }

  const doc = await db.collection("maps").doc(id).get();

  if (!doc.exists) {
    alert("Карта не найдена");
    return;
  }

  mapData = doc.data().data;
  renderLoadedData();
});

// ==========================
// RENDER LOADED DATA
// ==========================

function renderLoadedData() {
  const svg = mapObject.contentDocument;
  if (!svg) return;

  const stations = svg.querySelectorAll("text");

  stations.forEach(el => {
    const name = el.textContent.trim();

    if (mapData[name]) {
      el.style.opacity = "1";
      el.style.fontWeight = "700";
    } else {
      el.style.opacity = "0.4";
      el.style.fontWeight = "400";
    }
  });

  alert("Карта загружена ✨");
}

// ==========================
// RESET
// ==========================

document.getElementById("reset").addEventListener("click", () => {
  mapData = {};
  noteInput.value = "";
  fileInput.value = "";
  stationInfo.innerText = "Кликните на станцию";
  alert("Сброшено");
});
