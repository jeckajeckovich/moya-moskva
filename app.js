// ================================
// FIREBASE
// ================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0x6YWKPKC7McI58rEgHxnS9OXSYPMuH4",
  authDomain: "moya-moskva.firebaseapp.com",
  projectId: "moya-moskva",
  storageBucket: "moya-moskva.firebasestorage.app",
  messagingSenderId: "397269931085",
  appId: "1:397269931085:web:a5c54a888396794a25b804"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================================
// DOM
// ================================
const mapObject = document.getElementById("metro-map");
const info = document.getElementById("station-info");
const noteInput = document.getElementById("note");
const fileInput = document.getElementById("photo");
const saveBtn = document.getElementById("save");
const resetBtn = document.getElementById("reset");
const shareBtn = document.getElementById("share");
const shareResult = document.getElementById("share-result");
const viewport = document.getElementById("map-viewport");

const mapTitle = document.getElementById("map-title");
const mapNameInput = document.getElementById("map-name-input");

// ================================
// LOCAL STATE
// ================================
let data = JSON.parse(localStorage.getItem("stations") || "{}");
let currentStationId = null;

// ================================
// MAP TITLE
// ================================
const savedMapName = localStorage.getItem("mapName");
if (savedMapName) {
  mapTitle.textContent = savedMapName;
  mapNameInput.value = savedMapName;
}

mapNameInput.addEventListener("input", () => {
  const value = mapNameInput.value.trim();
  mapTitle.textContent = value;
  localStorage.setItem("mapName", value);
});

// ================================
// MAP LOAD
// ================================
mapObject.addEventListener("load", () => {
  const svg = mapObject.contentDocument;
  const stations = svg.querySelectorAll("text");

  stations.forEach((station, index) => {
    const originalName = station.textContent.trim();
    if (!originalName) return;

    const id = `station-${index}`;
    station.dataset.id = id;
    station.classList.add("station");
    station.style.cursor = "pointer";

    applyVisual(station);

    station.addEventListener("click", () => {
      currentStationId = id;
      info.textContent = originalName;
      noteInput.value = data[id]?.note || "";
      fileInput.value = "";
    });
  });
});

// ================================
// SAVE LOCAL
// ================================
saveBtn.addEventListener("click", () => {
  if (!currentStationId) return alert("Выберите станцию");

  if (!data[currentStationId]) data[currentStationId] = {};

  data[currentStationId].note = noteInput.value;

  const file = fileInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      data[currentStationId].photo = reader.result;
      persistLocal();
    };
    reader.readAsDataURL(file);
  } else {
    persistLocal();
  }
});

function persistLocal() {
  localStorage.setItem("stations", JSON.stringify(data));
  updateAllVisual();
}

// ================================
// RESET
// ================================
resetBtn.addEventListener("click", () => {
  if (!confirm("Сбросить всё?")) return;
  localStorage.clear();
  location.reload();
});

// ================================
// VISUAL
// ================================
function applyVisual(station) {
  const id = station.dataset.id;
  const hasData = data[id]?.note || data[id]?.photo;

  station.style.opacity = hasData ? "1" : "0.35";
  station.style.fontWeight = hasData ? "700" : "400";
}

function updateAllVisual() {
  const svg = mapObject.contentDocument;
  if (!svg) return;
  svg.querySelectorAll("text.station").forEach(applyVisual);
}

// ================================
// PAN & ZOOM
// ================================
let scale = 1;
let panX = -400;
let panY = -50;
let isPanning = false;
let startX = 0;
let startY = 0;

function updateTransform() {
  viewport.style.transform =
    `translate(${panX}px, ${panY}px) scale(${scale})`;
}

updateTransform();

viewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  scale += e.deltaY > 0 ? -0.1 : 0.1;
  scale = Math.min(Math.max(0.5, scale), 3);
  updateTransform();
}, { passive: false });

viewport.addEventListener("mousedown", (e) => {
  isPanning = true;
  startX = e.clientX - panX;
  startY = e.clientY - panY;
});

window.addEventListener("mousemove", (e) => {
  if (!isPanning) return;
  panX = e.clientX - startX;
  panY = e.clientY - startY;
  updateTransform();
});

window.addEventListener("mouseup", () => {
  isPanning = false;
});

// ================================
// CRYPTO
// ================================
async function encryptData(data, password) {
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
    enc.encode(JSON.stringify(data))
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

// ================================
// SHARE
// ================================
shareBtn.addEventListener("click", async () => {
  const password = prompt("Придумайте приватный код:");
  if (!password) return;

  const payload = {
    mapName: localStorage.getItem("mapName") || "",
    stations: data
  };

  const encryptedPayload = await encryptData(payload, password);

  const docRef = await addDoc(collection(db, "maps"), {
    payload: encryptedPayload,
    createdAt: Date.now()
  });

  const link =
    `${location.origin}${location.pathname}?map=${docRef.id}`;

  shareResult.innerHTML = `
    🔗 <a href="${link}" target="_blank">${link}</a><br>
    🔐 Код: <strong>${password}</strong>
  `;
});

// ================================
// LOAD SHARED MAP
// ================================
async function loadSharedMap() {
  const params = new URLSearchParams(window.location.search);
  const mapId = params.get("map");
  if (!mapId) return;

  const snapshot = await getDoc(doc(db, "maps", mapId));
  if (!snapshot.exists()) return;

  const password = prompt("Введите код доступа:");
  if (!password) return;

  try {
    const decrypted = await decryptData(
      snapshot.data().payload,
      password
    );

    data = decrypted.stations || {};
    localStorage.setItem("stations", JSON.stringify(data));

    if (decrypted.mapName) {
      localStorage.setItem("mapName", decrypted.mapName);
      mapTitle.textContent = decrypted.mapName;
    }

    updateAllVisual();
  } catch (e) {
    alert("Неверный код");
  }
}

loadSharedMap();
