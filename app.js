// ==============================
// DB
// ==============================
const db = window.db;

// ==============================
// DOM
// ==============================
const mapObject = document.getElementById("metro-map");
const info = document.getElementById("station-info");
const noteInput = document.getElementById("note");
const fileInput = document.getElementById("photo");
const saveBtn = document.getElementById("save");
const resetBtn = document.getElementById("reset");
const shareBtn = document.getElementById("share");
const shareResult = document.getElementById("share-result");
const loadBtn = document.getElementById("load-map");
const mapCodeInput = document.getElementById("map-code-input");
const accessCodeInput = document.getElementById("access-code-input");
const loadResult = document.getElementById("load-result");
const mapTitle = document.getElementById("map-title");
const mapNameInput = document.getElementById("map-name-input");
const viewport = document.getElementById("map-viewport");

// ==============================
// STATE
// ==============================
let data = JSON.parse(localStorage.getItem("stations") || "{}");
let currentStationId = null;

// ==============================
// MAP TITLE
// ==============================
const savedMapName = localStorage.getItem("mapName");
if (savedMapName) {
  mapTitle.textContent = savedMapName;
  mapNameInput.value = savedMapName;
}

mapNameInput.addEventListener("input", () => {
  localStorage.setItem("mapName", mapNameInput.value);
  mapTitle.textContent = mapNameInput.value;
});

// ==============================
// LOAD SVG
// ==============================
mapObject.addEventListener("load", () => {
  const svg = mapObject.contentDocument;
  if (!svg) return;

  const stations = svg.querySelectorAll("text");

  stations.forEach((station, index) => {
    const name = station.textContent.trim();
    if (!name) return;

    const id = "station-" + index;
    station.dataset.id = id;
    station.classList.add("station");
    station.style.cursor = "pointer";

    applyVisual(station);

    station.addEventListener("click", () => {
      currentStationId = id;
      info.textContent = name;
      noteInput.value = data[id]?.note || "";
      fileInput.value = "";
    });
  });
});

// ==============================
// SAVE
// ==============================
saveBtn.addEventListener("click", () => {
  if (!currentStationId) return alert("Выберите станцию");

  if (!data[currentStationId]) data[currentStationId] = {};
  data[currentStationId].note = noteInput.value;

  const file = fileInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      data[currentStationId].photo = reader.result;
      persist();
    };
    reader.readAsDataURL(file);
  } else {
    persist();
  }
});

function persist() {
  localStorage.setItem("stations", JSON.stringify(data));
  updateVisuals();
}

// ==============================
// RESET
// ==============================
resetBtn.addEventListener("click", () => {
  if (!confirm("Сбросить всё?")) return;
  localStorage.removeItem("stations");
  data = {};
  updateVisuals();
  info.textContent = "Кликните на станцию";
  noteInput.value = "";
});

// ==============================
// VISUAL
// ==============================
function applyVisual(station) {
  const id = station.dataset.id;
  const hasData = data[id]?.note || data[id]?.photo;
  station.style.opacity = hasData ? "1" : "0.35";
  station.style.fontWeight = hasData ? "700" : "400";
}

function updateVisuals() {
  const svg = mapObject.contentDocument;
  if (!svg) return;
  svg.querySelectorAll("text.station").forEach(applyVisual);
}

// ==============================
// ENCRYPT
// ==============================
async function encryptData(payload, password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(JSON.stringify(payload))
  );

  return {
    encrypted: Array.from(new Uint8Array(encrypted)),
    iv: Array.from(iv),
    salt: Array.from(salt)
  };
}

async function decryptData(payload, password) {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint8Array(payload.salt),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(payload.iv) },
    key,
    new Uint8Array(payload.encrypted)
  );

  return JSON.parse(dec.decode(decrypted));
}

// ==============================
// SHARE
// ==============================
shareBtn.addEventListener("click", async () => {
  try {
    const password = prompt("Придумайте приватный код:");
    if (!password) return;

    const payload = {
      mapName: localStorage.getItem("mapName") || "",
      stations: data
    };

    const encryptedPayload = await encryptData(payload, password);

    const docRef = await db.collection("maps").add({
      payload: encryptedPayload,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    shareResult.innerHTML = `
      🧭 Код карты: <strong>${docRef.id}</strong><br>
      🔐 Приватный код: <strong>${password}</strong>
    `;

  } catch (err) {
    console.error(err);
    alert("Ошибка записи в Firestore");
  }
});

// ==============================
// LOAD
// ==============================
loadBtn.addEventListener("click", async () => {
  const mapId = mapCodeInput.value.trim();
  const password = accessCodeInput.value.trim();

  if (!mapId || !password) {
    loadResult.textContent = "Введите код карты и приватный код";
    return;
  }

  try {
    const snapshot = await db.collection("maps").doc(mapId).get();

    if (!snapshot.exists()) {
      loadResult.textContent = "Карта не найдена";
      return;
    }

    const decrypted = await decryptData(
      snapshot.data().payload,
      password
    );

    data = decrypted.stations || {};
    localStorage.setItem("stations", JSON.stringify(data));

    if (decrypted.mapName) {
      localStorage.setItem("mapName", decrypted.mapName);
      mapTitle.textContent = decrypted.mapName;
      mapNameInput.value = decrypted.mapName;
    }

    setTimeout(updateVisuals, 200);

    loadResult.textContent = "Карта загружена!";
  } catch (e) {
    console.error(e);
    loadResult.textContent = "Неверный код";
  }
});
    // ВАЖНО: ждём загрузку SVG
   setTimeout(updateVisuals, 200);

    loadResult.textContent = "Карта загружена!";
  } catch (e) {
    console.error(e);
    loadResult.textContent = "Неверный код";
  }
});
