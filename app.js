const db = window.db;
const storage = window.storage;

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
const photoPreview = document.getElementById("photo-preview");

let data = JSON.parse(localStorage.getItem("stations") || "{}");
let currentStationId = null;

mapObject.addEventListener("load", () => {
  const svg = mapObject.contentDocument;
  const stations = svg.querySelectorAll("text");

  stations.forEach((station, index) => {
    const name = station.textContent.trim();
    if (!name) return;

    const id = "station-" + index;
    station.dataset.id = id;
    station.style.cursor = "pointer";

    updateStationVisual(station);

    station.addEventListener("click", () => {
      currentStationId = id;
      info.textContent = name;
      noteInput.value = data[id]?.note || "";

      if (data[id]?.photo) {
        photoPreview.src = data[id].photo;
        photoPreview.style.display = "block";
      } else {
        photoPreview.style.display = "none";
      }
    });
  });
});

function updateStationVisual(station) {
  const id = station.dataset.id;
  const hasData = data[id]?.note || data[id]?.photo;
  station.style.opacity = hasData ? "1" : "0.35";
  station.style.fontWeight = hasData ? "600" : "400";
}

function updateAllVisuals() {
  const svg = mapObject.contentDocument;
  svg.querySelectorAll("text").forEach(updateStationVisual);
}

saveBtn.addEventListener("click", async () => {
  if (!currentStationId) return alert("Выберите станцию");

  if (!data[currentStationId]) data[currentStationId] = {};
  data[currentStationId].note = noteInput.value;

  const file = fileInput.files[0];

  if (file) {
    const fileRef = storage
      .ref()
      .child("photos/" + Date.now() + "_" + file.name);

    await fileRef.put(file);
    const url = await fileRef.getDownloadURL();
    data[currentStationId].photo = url;
  }

  localStorage.setItem("stations", JSON.stringify(data));
  updateAllVisuals();
  alert("Сохранено 💛");
});

resetBtn.addEventListener("click", () => {
  localStorage.removeItem("stations");
  data = {};
  updateAllVisuals();
  noteInput.value = "";
  photoPreview.style.display = "none";
});

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

shareBtn.addEventListener("click", async () => {
  const password = prompt("Придумайте приватный код:");
  if (!password) return;

  const encryptedPayload = await encryptData(
    { stations: data },
    password
  );

  const docRef = await db.collection("maps").add({
    payload: encryptedPayload,
    createdAt: Date.now()
  });

  shareResult.innerHTML = `
    Код карты: <strong>${docRef.id}</strong><br>
    Приватный код: <strong>${password}</strong>
  `;
});

loadBtn.addEventListener("click", async () => {
  const mapId = mapCodeInput.value.trim();
  const password = accessCodeInput.value.trim();

  const snapshot = await db.collection("maps").doc(mapId).get();

  if (!snapshot.exists) {
    loadResult.textContent = "Карта не найдена";
    return;
  }

  const decrypted = await decryptData(snapshot.data().payload, password);

  data = decrypted.stations || {};
  localStorage.setItem("stations", JSON.stringify(data));
  updateAllVisuals();

  loadResult.textContent = "Карта загружена 💛";
});
