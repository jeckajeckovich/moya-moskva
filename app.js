const map = document.getElementById("metro-map");
const info = document.getElementById("station-info");
const noteEl = document.getElementById("note");
const photoEl = document.getElementById("photo");

let currentStation = null;
let data = loadAll();
const password = location.hash.slice(1) || crypto.randomUUID();
location.hash = password;

map.addEventListener("load", () => {
  const svg = map.contentDocument;
  const stations = svg.querySelectorAll("text");

  stations.forEach((el, i) => {
    const id = "s" + i;
    el.dataset.id = id;
    el.classList.add(data[id] ? "station-filled" : "station-empty");

    el.addEventListener("click", async () => {
      currentStation = id;
      info.textContent = el.textContent;
      noteEl.value = data[id]?.note || "";
    });
  });
});

document.getElementById("save").onclick = async () => {
  if (!currentStation) return;

  const note = noteEl.value;
  const encrypted = await encrypt(note, password);

  data[currentStation] = { note: encrypted };
  saveAll(data);
  alert("Сохранено");
};

document.getElementById("reset").onclick = resetAll;
