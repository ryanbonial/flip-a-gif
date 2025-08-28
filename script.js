import { parseGIF, decompressFrames } from "gifuct-js";

// File validation function
function validateGifFile(file) {
  // Validate file type
  if (!file.type.startsWith("image/gif")) {
    return {
      isValid: false,
      error:
        "❌ Please select a GIF file only. Other image formats are not supported.",
    };
  }

  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    return {
      isValid: false,
      error:
        "❌ File is too large. Please select a GIF file smaller than 10MB.",
    };
  }

  return { isValid: true };
}

// Process GIF file function
async function processGifFile(file) {
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
}

// File input change handler
document.getElementById("gifInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const validation = validateGifFile(file);
  if (!validation.isValid) {
    showError(validation.error);
    e.target.value = ""; // Clear the input
    document.getElementById("fileName").textContent = "";
    return;
  }

  await processGifFile(file);
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

// Make example GIFs draggable
document.addEventListener("DOMContentLoaded", () => {
  const exampleGifs = document.querySelectorAll(".example-gifs img");
  exampleGifs.forEach((img) => {
    img.draggable = true;
    img.addEventListener("dragstart", (e) => {
      // Set drag data to help with Chrome compatibility
      e.dataTransfer.setData("text/plain", img.src);
      e.dataTransfer.setData("text/uri-list", img.src);
      e.dataTransfer.effectAllowed = "copy";
    });
  });
});

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

  // Handle file drops
  if (files.length > 0) {
    const file = files[0];
    const validation = validateGifFile(file);

    if (!validation.isValid) {
      showError(validation.error);
      return;
    }

    gifInput.files = files;
    gifInput.dispatchEvent(new Event("change"));
    return;
  }

  // Handle image drops from the page (for Chrome compatibility)
  const items = dt.items;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if it's an image
      if (item.type.startsWith("image/")) {
        // Get the file from the item
        const file = item.getAsFile();
        if (file) {
          const validation = validateGifFile(file);

          if (!validation.isValid) {
            showError(validation.error);
            return;
          }

          // Create a DataTransfer object to set the files
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          gifInput.files = dataTransfer.files;
          gifInput.dispatchEvent(new Event("change"));
          return;
        }
      }

      // Check if it's a URL (for images dragged from the page)
      if (item.type === "text/uri-list" || item.type === "text/plain") {
        item.getAsString((url) => {
          if (url && url.endsWith(".gif")) {
            // Fetch the GIF from the URL
            fetch(url)
              .then((response) => response.blob())
              .then((blob) => {
                // Create a file object from the blob
                const file = new File([blob], "dragon-dropped.gif", {
                  type: "image/gif",
                });

                const validation = validateGifFile(file);
                if (!validation.isValid) {
                  showError(validation.error);
                  return;
                }

                // Create a DataTransfer object to set the files
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                gifInput.files = dataTransfer.files;
                gifInput.dispatchEvent(new Event("change"));
              })
              .catch((error) => {
                console.error("Error fetching GIF:", error);
                showError("❌ Error loading the GIF file. Please try again.");
              });
          } else {
            showError(
              "❌ Please drop a GIF file only. Other image formats are not supported."
            );
          }
        });
        return;
      }
    }
  }

  // If we get here, no valid file was dropped
  showError("❌ Please drop a valid GIF file.");
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
