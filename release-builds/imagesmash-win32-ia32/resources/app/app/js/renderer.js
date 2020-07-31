const path = require("path");
const os = require("os");
const { ipcRenderer } = require("electron");

const form = document.getElementById("image-form");
const slider = document.getElementById("slider");
const img = document.getElementById("img");

// Node functions for generating output path
document.getElementById("output-path").innerText = path.join(
  os.homedir(),
  "imagesmash"
);

// On submit
form.addEventListener("submit", (e) => {
  e.preventDefault();

  // Electron function for obtaining img file path
  const imgPath = img.files[0].path;
  const quality = slider.value;

  ipcRenderer.send("image:smallify", {
    imgPath,
    quality,
  });
});

// On done
ipcRenderer.on("image:done", () => {
  M.toast({
    html: `Image resized to ${slider.value}% quality`,
  });
});
