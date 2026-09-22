import * as deepar from "deepar";

console.log("DeepAR version:", deepar.version);

// ---------------------------------------------------------
// DOM ELEMENTS
// ---------------------------------------------------------

const feetText =
  document.getElementById("feet-text");

const brandText =
  document.getElementById("brand-text");

const loader =
  document.getElementById("loader-wrapper");

const canvas =
  document.getElementById("deepar-canvas");

const selectedEffect =
  sessionStorage.getItem("selectedEffect");

// ---------------------------------------------------------
// PRODUCT DATA
// ---------------------------------------------------------

const PRODUCT_DATA_URL =
  "data/products.json";

// ---------------------------------------------------------
// EFFECT PATH NORMALIZER
// ---------------------------------------------------------

function normalizeEffectPath(effectName) {
  if (!effectName) {
    return "";
  }

  const value =
    String(effectName).trim();

  if (value.startsWith("effects/")) {
    return value;
  }

  return `effects/${value}`;
}

// ---------------------------------------------------------
// DEEPAR INITIALIZATION
// ---------------------------------------------------------

console.log(
  "Selected effect on page load:",
  selectedEffect
);

console.log(
  "DeepAR canvas found:",
  !!canvas
);

if (canvas && selectedEffect) {
  console.log(
    "Starting DeepAR with effect:",
    selectedEffect
  );

  initializeDeepar(
    selectedEffect
  );
} else {
  console.log(
    "No effect selected yet. Waiting for product selection."
  );

  if (loader) {
    loader.style.display =
      "none";
  }
}

// ---------------------------------------------------------
// INITIALIZE DEEPAR
// ---------------------------------------------------------

async function initializeDeepar(
  effectName
) {
  try {
    if (feetText) {
      feetText.style.display =
        "none";
    }

    if (!canvas) {
      console.error(
        "DeepAR canvas not found."
      );

      if (loader) {
        loader.style.display =
          "none";
      }

      return;
    }

    // -------------------------------------------------------
    // FULL SCREEN RESPONSIVE CANVAS
    // -------------------------------------------------------

    const scale =
      window.devicePixelRatio || 1;

    const viewportWidth =
      window.innerWidth;

    const viewportHeight =
      window.innerHeight;

    canvas.width =
      Math.floor(
        viewportWidth * scale
      );

    canvas.height =
      Math.floor(
        viewportHeight * scale
      );

    canvas.style.width =
      "100vw";

    canvas.style.height =
      "100vh";

    canvas.style.maxWidth =
      "none";

    canvas.style.maxHeight =
      "none";

    // -------------------------------------------------------
    // EFFECT PATH
    // -------------------------------------------------------

    const effectPath =
      normalizeEffectPath(
        effectName
      );

    console.log(
      "Loading DeepAR effect:",
      effectPath
    );

    // -------------------------------------------------------
    // DEEPAR
    // -------------------------------------------------------

    const deepAR =
      await deepar.initialize({
        licenseKey:
          "911c24ddac2e0d44a1d14a091ef7adb832e3465bc4890aaa04a9149a75fdd16ba8f3b9b3d4eadcb6",

        canvas:
          canvas,

        effect:
          effectPath,

        additionalOptions: {
          cameraConfig: {
            facingMode:
              "environment",
          },

          hint:
            "footInit",
        },
      });

    console.log(
      "DeepAR initialized successfully."
    );

    console.log(
      "Active effect:",
      effectPath
    );

    // -------------------------------------------------------
    // HIDE LOADER
    // -------------------------------------------------------

    if (loader) {
      loader.style.display =
        "none";
    }

    // -------------------------------------------------------
    // SHOW BRAND
    // -------------------------------------------------------

    if (brandText) {
      brandText.style.display =
        "flex";
    }

    // -------------------------------------------------------
    // FOOT TRACKING
    // -------------------------------------------------------

    deepAR.callbacks.onFeetTracked =
      (
        leftFoot,
        rightFoot
      ) => {
        const leftDetected =
          leftFoot?.detected;

        const rightDetected =
          rightFoot?.detected;

        if (
          leftDetected ||
          rightDetected
        ) {
          if (feetText) {
            feetText.style.display =
              "none";
          }

          deepAR.callbacks.onFeetTracked =
            undefined;
        }
      };

    return deepAR;

  } catch (error) {
    console.error(
      "DeepAR initialization failed:",
      error
    );

    if (loader) {
      loader.style.display =
        "none";
    }

    if (feetText) {
      feetText.style.display =
        "block";

      feetText.textContent =
        "Unable to start the virtual try-on. Please check your camera permission and try again.";
    }
  }
}

// ---------------------------------------------------------
// GET EFFECT FROM PRODUCT CARD
// ---------------------------------------------------------

function getEffectNameFromCard(
  card
) {
  if (!card) {
    return "";
  }

  const dataEffect =
    card.getAttribute(
      "data-effect"
    );

  if (dataEffect) {
    return dataEffect;
  }

  return card.id || "";
}

// ---------------------------------------------------------
// PRODUCT SELECTION
// ---------------------------------------------------------

function onProductCardClick(
  card
) {
  if (!card) {
    return;
  }

  const effectName =
    getEffectNameFromCard(
      card
    );

  if (!effectName) {
    console.warn(
      "No DeepAR effect found for product:",
      card
    );

    return;
  }

  console.log(
    "Selected product:",
    card
  );

  console.log(
    "Selected effect:",
    effectName
  );

  // Save selected effect
  sessionStorage.setItem(
    "selectedEffect",
    effectName
  );

  console.log(
    "Effect saved to sessionStorage:",
    sessionStorage.getItem(
      "selectedEffect"
    )
  );

  // Reload so DeepAR starts
  // with selected shoe
  window.location.reload();
}

// ---------------------------------------------------------
// ATTACH PRODUCT CARD EVENTS
// ---------------------------------------------------------

function attachProductCardEvents() {
  const productCards =
    document.querySelectorAll(
      ".product-card"
    );

  productCards.forEach(
    (card) => {

      if (
        card.dataset
          .deepARListener ===
        "true"
      ) {
        return;
      }

      card.dataset
        .deepARListener =
        "true";

      card.addEventListener(
        "click",
        function () {
          onProductCardClick(
            this
          );
        }
      );
    }
  );

  console.log(
    `Attached DeepAR listeners to ${productCards.length} product cards.`
  );
}

// ---------------------------------------------------------
// CREATE DYNAMIC PRODUCT CARD
// ---------------------------------------------------------

function createProductCard(
  product
) {
  if (!product) {
    return null;
  }

  if (!product.effect) {
    console.warn(
      "Product has no DeepAR effect:",
      product
    );

    return null;
  }

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "col";

  const effectPath =
    product.effect;

  const effectFilename =
    effectPath
      .split("/")
      .pop();

  const productId =
    product.id ||
    effectFilename;

  const productName =
    product.name ||
    "Shoe";

  const productPrice =
    product.price ||
    "";

  const productImage =
    product.image ||
    "";

  wrapper.innerHTML = `
    <div
      class="product-card card dynamic-product"
      id="${escapeHtml(effectFilename)}"
      data-product-id="${escapeHtml(productId)}"
      data-effect="${escapeHtml(effectPath)}"
    >

      <span class="img-span">

        <img
          class="card-img-top"
          src="${escapeHtml(productImage)}"
          alt="${escapeHtml(productName)}"
          loading="lazy"
        >

      </span>

      <div
        style="
          flex:1;
          padding:0 .4rem;
        "
      >

        <div class="name-span">

          <p class="card-name">
            ${escapeHtml(productName)}
          </p>

        </div>

        <a class="price">
          ${escapeHtml(productPrice)}
        </a>

      </div>

    </div>
  `;

  return wrapper;
}

// ---------------------------------------------------------
// HTML ESCAPE
// ---------------------------------------------------------

function escapeHtml(
  value
) {
  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

// ---------------------------------------------------------
// LOAD PRODUCTS
// ---------------------------------------------------------

async function loadDynamicProducts() {
  const productList = document.getElementById("product-list");

  if (!productList) {
    console.error("Product list not found.");
    return;
  }

  try {
    const response = await fetch(
      `${PRODUCT_DATA_URL}?t=${Date.now()}`,
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load products.json: ${response.status}`
      );
    }

    const products = await response.json();

    if (!Array.isArray(products)) {
      throw new Error(
        "products.json must contain an array."
      );
    }

    console.log("Products loaded:", products);

    // Remove ALL old products
    productList.innerHTML = "";

    // Only show enabled products
    // If enabled is missing, product is treated as ON
    const visibleProducts = products.filter(
      (product) =>
        product &&
        product.enabled !== false &&
        product.effect
    );

    console.log(
      "Visible products:",
      visibleProducts
    );

    // No products
    if (visibleProducts.length === 0) {
      productList.innerHTML = `
        <div class="col">
          <div class="products-message">
            No shoes are currently available.
          </div>
        </div>
      `;

      const productCount =
        document.querySelector(".product-count");

      if (productCount) {
        productCount.textContent = "0 products";
      }

      return;
    }

    // Create product cards
    visibleProducts.forEach((product) => {
      const card = createProductCard(product);

      if (card) {
        productList.appendChild(card);
      }
    });

    // Attach click events
    attachProductCardEvents();

    // Update count
    const productCount =
      document.querySelector(".product-count");

    if (productCount) {
      productCount.textContent =
        `${visibleProducts.length} ${
          visibleProducts.length === 1
            ? "product"
            : "products"
        }`;
    }

    console.log(
      `Successfully rendered ${visibleProducts.length} products.`
    );

  } catch (error) {
    console.error(
      "Unable to load dynamic products:",
      error
    );

    productList.innerHTML = `
      <div class="col">
        <div class="products-message">
          Unable to load products.
        </div>
      </div>
    `;

    const productCount =
      document.querySelector(".product-count");

    if (productCount) {
      productCount.textContent =
        "Unable to load products";
    }
  }
}

// ---------------------------------------------------------
// START BUTTON
// ---------------------------------------------------------

const startButton =
  document.getElementById(
    "getStartBtn"
  );

if (startButton) {
  startButton.addEventListener(
    "click",
    () => {
      window.location.href =
        "getInfo.html";
    }
  );
}

// ---------------------------------------------------------
// SHOW BUTTON
// ---------------------------------------------------------

const showButton =
  document.getElementById(
    "showBtn"
  );

if (showButton) {
  showButton.addEventListener(
    "click",
    () => {
      window.location.href =
        "tryon.html";
    }
  );
}

// ---------------------------------------------------------
// START PRODUCT LOADING
// ---------------------------------------------------------

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      loadDynamicProducts();
    }
  );
} else {
  loadDynamicProducts();
}