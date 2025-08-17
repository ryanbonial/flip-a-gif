import { parseGIF, decompressFrames } from "gifuct-js";

// File input change handler
document.getElementById("gifInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("image/gif")) {
    showError(
      "❌ Please select a GIF file only. Other image formats are not supported."
    );
    e.target.value = ""; // Clear the input
    document.getElementById("fileName").textContent = "";
    return;
  }

  // Validate file size (optional - 10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    showError(
      "❌ File is too large. Please select a GIF file smaller than 10MB."
    );
    e.target.value = "";
    document.getElementById("fileName").textContent = "";
    return;
  }

  // Clear any previous errors
  hideError();

  // Show filename
  document.getElementById("fileName").textContent = `Selected: ${file.name}`;

  const arrayBuffer = await file.arrayBuffer();
  const gif = parseGIF(arrayBuffer);
  const frames = decompressFrames(gif, true); // get RGBA pixel data

  const frameContainer = document.getElementById("frames");
  frameContainer.innerHTML = ""; // clear previous

  // Create a base canvas to build frames on
  const baseCanvas = document.createElement("canvas");
  baseCanvas.width = gif.lsd.width;
  baseCanvas.height = gif.lsd.height;
  const baseCtx = baseCanvas.getContext("2d");

  frames.forEach((frame, index) => {
    // Create a new canvas for this frame
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = gif.lsd.width;
    frameCanvas.height = gif.lsd.height;
    const frameCtx = frameCanvas.getContext("2d");

    // Copy the previous state
    frameCtx.drawImage(baseCanvas, 0, 0);

    // Create ImageData from the frame's pixel data
    const imageData = frameCtx.createImageData(
      frame.dims.width,
      frame.dims.height
    );
    imageData.data.set(frame.patch);

    // Apply the frame data at the correct position
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = frame.dims.width;
    tempCanvas.height = frame.dims.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.putImageData(imageData, 0, 0);

    // Draw the frame onto the main canvas at the correct position
    frameCtx.drawImage(tempCanvas, frame.dims.left, frame.dims.top);

    // Update the base canvas for the next frame
    baseCtx.clearRect(0, 0, gif.lsd.width, gif.lsd.height);
    baseCtx.drawImage(frameCanvas, 0, 0);

    const img = document.createElement("img");
    img.src = frameCanvas.toDataURL("image/png");
    img.alt = `Frame ${index + 1} of flipbook`;
    img.setAttribute(
      "aria-label",
      `Frame ${index + 1} of flipbook - cut along dashed lines`
    );
    frameContainer.appendChild(img);
  });

  // Show print button after frames are loaded
  document.getElementById("printBtn").style.display = "inline-block";
  document.getElementById("printInstructions").style.display = "block";
});

// Add print functionality
document.getElementById("printBtn").addEventListener("click", () => {
  window.print();
});

// Drag and drop functionality
const uploadSection = document.getElementById("uploadSection");
const gifInput = document.getElementById("gifInput");

// Prevent default drag behaviors
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  uploadSection.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

// Highlight drop area when item is dragged over it
["dragenter", "dragover"].forEach((eventName) => {
  uploadSection.addEventListener(eventName, highlight, false);
});

["dragleave", "drop"].forEach((eventName) => {
  uploadSection.addEventListener(eventName, unhighlight, false);
});

// Handle dropped files
uploadSection.addEventListener("drop", handleDrop, false);

// Keyboard support for drag and drop area
uploadSection.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    gifInput.click();
  }
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight(e) {
  uploadSection.classList.add("dragover");
}

function unhighlight(e) {
  uploadSection.classList.remove("dragover");
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;

  if (files.length > 0) {
    const file = files[0];

    // Validate file type
    if (!file.type.startsWith("image/gif")) {
      showError(
        "❌ Please drop a GIF file only. Other image formats are not supported."
      );
      return;
    }

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      showError(
        "❌ File is too large. Please drop a GIF file smaller than 10MB."
      );
      return;
    }

    gifInput.files = files;
    gifInput.dispatchEvent(new Event("change"));
  }
}

function showError(message) {
  const errorMessageElement = document.getElementById("errorMessage");
  errorMessageElement.textContent = message;
  errorMessageElement.style.display = "block";
}

function hideError() {
  const errorMessageElement = document.getElementById("errorMessage");
  errorMessageElement.style.display = "none";
}

// Terms and Conditions Modal
const termsBtn = document.getElementById("termsBtn");
const termsModal = document.getElementById("termsModal");
const closeTerms = document.getElementById("closeTerms");

termsBtn.addEventListener("click", () => {
  termsModal.showModal();
});

closeTerms.addEventListener("click", () => {
  termsModal.close();
});

// Close modal when clicking outside
termsModal.addEventListener("click", (e) => {
  if (e.target === termsModal) {
    termsModal.close();
  }
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && termsModal.open) {
    termsModal.close();
  }
});
