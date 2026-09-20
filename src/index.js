import * as deepar from 'deepar';

// Log DeepAR version
console.log("DeepAR version:", deepar.version);

// ---------------------------------------------------------
// DOM ELEMENTS
// ---------------------------------------------------------

const feetText = document.getElementById("feet-text");
const brandText = document.getElementById("brand-text");
const loader = document.getElementById("loader-wrapper");

const selectedEffect = sessionStorage.getItem("selectedEffect");

// ---------------------------------------------------------
// DEEPAR INITIALIZATION
// ---------------------------------------------------------

if (selectedEffect && document.getElementById("deepar-canvas")) {
  initializeDeepar(selectedEffect);
}

// Initialize DeepAR
async function initializeDeepar(effectName) {

  try {

    // Hide instruction text while DeepAR loads
    if (feetText) {
      feetText.style.display = "none";
    }

    // -------------------------------------------------------
    // CANVAS
    // -------------------------------------------------------

    const canvas = document.getElementById("deepar-canvas");

    if (!canvas) {
      console.error("DeepAR canvas not found.");
      return;
    }

    const scale = window.devicePixelRatio || 1;

    const width =
      window.innerWidth > window.innerHeight
        ? Math.floor(window.innerHeight * 0.66)
        : window.innerWidth;

    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(window.innerHeight * scale);

    canvas.style.maxHeight = window.innerHeight + "px";
    canvas.style.maxWidth = width + "px";

    // -------------------------------------------------------
    // DEEPAR
    // -------------------------------------------------------

    const deepAR = await deepar.initialize({

      // IMPORTANT:
      // Replace this with your active DeepAR license key.
      licenseKey: "YOUR_DEEPAR_LICENSE_KEY",

      canvas: canvas,

      // Selected shoe effect
      effect: `effects/${effectName}`,

      additionalOptions: {

        cameraConfig: {
          // Rear/environment camera
          facingMode: "environment",
        },

        // Enable foot tracking
        hint: "footInit",
      },
    });

    console.log("DeepAR initialized successfully.");

    // -------------------------------------------------------
    // LOADING SCREEN
    // -------------------------------------------------------

    if (loader) {
      loader.style.display = "none";
    }

    // Show brand indicator
    if (brandText) {
      brandText.style.display = "flex";
    }

    // -------------------------------------------------------
    // FOOT TRACKING
    // -------------------------------------------------------

    deepAR.callbacks.onFeetTracked = (leftFoot, rightFoot) => {

      const leftDetected = leftFoot?.detected;
      const rightDetected = rightFoot?.detected;

      if (leftDetected || rightDetected) {

        if (feetText) {
          feetText.style.display = "none";
        }

        // Stop callback once feet are detected
        deepAR.callbacks.onFeetTracked = undefined;
      }
    };

    return deepAR;

  } catch (error) {

    console.error("DeepAR initialization failed:", error);

    // Hide loader
    if (loader) {
      loader.style.display = "none";
    }

    // Show useful error to user
    if (feetText) {
      feetText.style.display = "block";
      feetText.textContent =
        "Unable to start the virtual try-on. Please check your camera permission and try again.";
    }
  }
}

// ---------------------------------------------------------
// EFFECT NAME
// ---------------------------------------------------------

function getEffectNameFromCardId(cardId) {
  return cardId;
}

// ---------------------------------------------------------
// PRODUCT SELECTION
// ---------------------------------------------------------

function onProductCardClick(cardId) {

  if (!cardId) {
    return;
  }

  const effectName = getEffectNameFromCardId(cardId);

  // Save selected DeepAR effect
  sessionStorage.setItem("selectedEffect", effectName);

  console.log("Selected shoe effect:", effectName);

  // Reload page so DeepAR starts with the new shoe
  window.location.reload();
}

// ---------------------------------------------------------
// PRODUCT CARD EVENTS
// ---------------------------------------------------------

const productCards = document.querySelectorAll(".product-card");

productCards.forEach((card) => {

  card.addEventListener("click", function () {

    const cardId = this.id;

    onProductCardClick(cardId);

  });

});

// ---------------------------------------------------------
// START / SHOW BUTTON NAVIGATION
// ---------------------------------------------------------

const startButton = document.getElementById("getStartBtn");

if (startButton) {

  startButton.addEventListener("click", () => {

    window.location.href = "getInfo.html";

  });

}

const showButton = document.getElementById("showBtn");

if (showButton) {

  showButton.addEventListener("click", () => {

    window.location.href = "tryon.html";

  });

}