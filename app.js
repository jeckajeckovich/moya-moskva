document.addEventListener("DOMContentLoaded", () => {

  // ==============================
  // DB
  // ==============================
  const db = window.db;
  const storage = window.storage;

  // ==============================
  // DOM
  // ==============================
  const mapObject = document.getElementById("metro-map");
  const viewport = document.getElementById("map-viewport");
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

  const startScreen = document.getElementById("start-screen");
  const createModeBtn = document.getElementById("create-mode");
  const viewModeBtn = document.getElementById("view-mode");
  const app = document.getElementById("app");

  const photoModal = document.getElementById("photo-modal");
  const modalImg = document.getElementById("modal-img");

  // ==============================
  // STATE
  // ==============================
  let data = JSON.parse(localStorage.getItem("stations") || "{}");
  let currentStationId = null;
  let scale = 1;
  let isDragging = false;
  let startX, startY;
  let translateX = 0;
  let translateY = 0;

  if (app) app.style.display = "none";

  // ==============================
  // START SCREEN
  // ==============================
  if (createModeBtn) {
    createModeBtn.addEventListener("click", () => {
      startScreen.style.display = "none";
      app.style.display = "grid";
    });
  }

  if (viewModeBtn) {
    viewModeBtn.addEventListener("click", () => {
      startScreen.style.display = "none";
      app.style.display = "grid";
      mapCodeInput.focus();
    });
  }

  // ==============================
  // LOAD SVG
  // ==============================
  if (mapObject) {
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

          if (data[id]?.photo) {
            photoPreview.src = data[id].photo;
            photoPreview.style.display = "block";
          } else {
            photoPreview.style.display = "none";
          }
        });
      });

      enableZoomAndPan(svg.querySelector("svg"));
    });
  }

  // ==============================
  // SAVE
  // ==============================
  async function saveCurrentStation() {
    if (!currentStationId) return;

    if (!data[currentStationId]) data[currentStationId] = {};

    data[currentStationId].note = noteInput.value;

    try {
      const file = fileInput.files[0];

      if (file && storage) {
        const fileRef = storage
          .ref()
          .child("photos/" + Date.now() + "_" + file.name);

        await fileRef.put(file);
        const downloadURL = await fileRef.getDownloadURL();
        data[currentStationId].photo = downloadURL;
        fileInput.value = "";
      }

      localStorage.setItem("stations", JSON.stringify(data));
      updateVisuals();

    } catch (err) {
      console.error(err);
    }
  }

  if (saveBtn) saveBtn.addEventListener("click", saveCurrentStation);

  if (noteInput) {
    noteInput.addEventListener("input", () => {
      if (!currentStationId) return;

      if (!data[currentStationId]) data[currentStationId] = {};
      data[currentStationId].note = noteInput.value;

      localStorage.setItem("stations", JSON.stringify(data));
      updateVisuals();
    });
  }

  // ==============================
  // RESET
  // ==============================
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (!confirm("Сбросить всё?")) return;
      localStorage.removeItem("stations");
      data = {};
      updateVisuals();
      info.textContent = "Кликните на станцию";
      noteInput.value = "";
      photoPreview.style.display = "none";
    });
  }

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
  // SHARE
  // ==============================
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      try {
        const password = prompt("Придумайте приватный код:");
        if (!password) return;

        const payload = {
          stations: data
        };

        const docRef = await db.collection("maps").add({
          payload,
          createdAt: Date.now()
        });

        shareResult.innerHTML = `
          🧭 Код карты: <strong>${docRef.id}</strong><br>
          🔐 Приватный код: <strong>${password}</strong>
        `;

      } catch (err) {
        console.error(err);
        alert("Ошибка записи");
      }
    });
  }

  // ==============================
  // LOAD
  // ==============================
  if (loadBtn) {
    loadBtn.addEventListener("click", async () => {
      const mapId = mapCodeInput.value.trim();

      if (!mapId) {
        loadResult.textContent = "Введите код карты";
        return;
      }

      try {
        const snapshot = await db.collection("maps").doc(mapId).get();

        if (!snapshot.exists) {
          loadResult.textContent = "Карта не найдена";
          return;
        }

        data = snapshot.data().payload.stations || {};
        localStorage.setItem("stations", JSON.stringify(data));

        updateVisuals();
        loadResult.textContent = "Карта загружена!";

      } catch (e) {
        console.error(e);
        loadResult.textContent = "Ошибка загрузки";
      }
    });
  }

  // ==============================
  // ZOOM + PAN
  // ==============================
  function enableZoomAndPan(svgElement) {
    if (!svgElement || !viewport) return;

    viewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      scale += e.deltaY * -0.001;
      scale = Math.min(Math.max(0.5, scale), 3);
      updateTransform(svgElement);
    });

    viewport.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
    });

    viewport.addEventListener("mouseup", () => isDragging = false);
    viewport.addEventListener("mouseleave", () => isDragging = false);

    viewport.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform(svgElement);
    });
  }

  function updateTransform(svgElement) {
    svgElement.style.transform =
      `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  // ==============================
  // PHOTO MODAL
  // ==============================
  if (photoPreview) {
    photoPreview.addEventListener("click", () => {
      if (!photoPreview.src) return;
      modalImg.src = photoPreview.src;
      photoModal.classList.remove("hidden");
    });
  }

  if (photoModal) {
    photoModal.addEventListener("click", () => {
      photoModal.classList.add("hidden");
    });
  }

});
