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

// ==========================
// WAIT UNTIL SVG READY
// ==========================

window.addEventListener("DOMContentLoaded", () => {
  initStations();
});

function initStations() {
  const svg = document.querySelector("#map-container svg");

  if (!svg) {
    console.log("SVG не найден");
    return;
  }

  const texts = svg.querySelectorAll("text");

  texts.forEach(el => {
    el.style.cursor = "pointer";

    el.addEventListener("click", () => {
      selectedStation = el.textContent.trim();
      document.getElementById("station-info").innerText = selectedStation;

      if (mapData[selectedStation]) {
        document.querySelector("textarea").value =
          mapData[selectedStation].note || "";

        if (mapData[selectedStation].photo) {
          showPhoto(mapData[selectedStation].photo);
        }
      }
    });
  });
}

// ==========================
// IMAGE COMPRESSION
// ==========================

function compressImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;

        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

// ==========================
// SHOW PHOTO
// ==========================

function showPhoto(base64) {
  let img = document.getElementById("photo-preview");

  if (!img) {
    img = document.createElement("img");
    img.id = "photo-preview";
    img.style.maxWidth = "100%";
    img.style.marginTop = "10px";
    document.getElementById("sidebar").appendChild(img);
  }

  img.src = base64;
  img.style.display = "block";
}

// ==========================
// SAVE
// ==========================

document.getElementById("save").addEventListener("click", async () => {
  if (!selectedStation) {
    alert("Выберите станцию");
    return;
  }

  const note = document.querySelector("textarea").value;
  const fileInput = document.querySelector('input[type="file"]');
  let photo = null;

  if (fileInput.files[0]) {
    photo = await compressImage(fileInput.files[0]);
  }

  mapData[selectedStation] = {
    note,
    photo: photo || mapData[selectedStation]?.photo || null
  };

  alert("Сохранено ❤️");
});

// ==========================
// SHARE
// ==========================

document.getElementById("share").addEventListener("click", async () => {
  if (Object.keys(mapData).length === 0) {
    alert("Нет данных");
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
// LOAD
// ==========================

document.getElementById("load-map").addEventListener("click", async () => {
  const id = document.getElementById("map-code-input").value;

  if (!id) {
    alert("Введите код");
    return;
  }

  const doc = await db.collection("maps").doc(id).get();

  if (!doc.exists) {
    alert("Не найдено");
    return;
  }

  mapData = doc.data().data;
  alert("Карта загружена ✨");
});

// ==========================
// RESET
// ==========================

document.getElementById("reset").addEventListener("click", () => {
  mapData = {};
  document.querySelector("textarea").value = "";
  document.querySelector('input[type="file"]').value = "";
  alert("Сброшено");
});
