/* =====================================================
   KARIGAR — AR Try-On page chrome.

   This ONLY wires the new header (back/help/close) and
   the bottom "Add to Cart" bar. It never touches
   DeepAR init, the canvas, foot tracking, or the
   #product-list rendering — that all still belongs to
   src/index.js (main.js), untouched.
===================================================== */

(function (window, document) {
  "use strict";

  function initHeader() {
    const backBtn = document.getElementById("kgArBack");
    const closeBtn = document.getElementById("kgArClose");
    const helpBtn = document.getElementById("kgArHelp");
    const helpPopover = document.getElementById("kgArHelpPopover");

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = "shop.html";
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        window.location.href = "shop.html";
      });
    }

    if (helpBtn && helpPopover) {
      helpBtn.addEventListener("click", () => {
        helpPopover.classList.toggle("kg-open");
      });
    }
  }

  async function initBuyBar() {
    const bar = document.getElementById("kgArBuyBar");
    if (!bar || !window.KarigarProducts || !window.KarigarCart) return;

    const nameEl = document.getElementById("kgArBuyName");
    const priceEl = document.getElementById("kgArBuyPrice");
    const addBtn = document.getElementById("kgArBuyAdd");

    async function syncSelectedProduct() {
      const selectedEffect = window.sessionStorage.getItem("selectedEffect");

      if (!selectedEffect) {
        bar.style.display = "none";
        return;
      }

      try {
        const products = await window.KarigarProducts.fetchVisibleProducts();
        const product = products.find((item) => item.effect === selectedEffect);

        if (!product) {
          bar.style.display = "none";
          return;
        }

        nameEl.textContent = product.name;
        priceEl.textContent = window.KarigarCart.formatPrice(product.price);
        bar.style.display = "flex";

        addBtn.onclick = () => {
          window.KarigarCart.addToCart(product, 1);
          if (window.KarigarToast) {
            window.KarigarToast.show(`${product.name} added to cart`);
          } else {
            addBtn.textContent = "Added ✓";
            window.setTimeout(() => {
              addBtn.textContent = "Add to Cart";
            }, 1500);
          }
        };
      } catch (error) {
        console.error("KarigarTryonChrome: could not sync selected product", error);
        bar.style.display = "none";
      }
    }

    syncSelectedProduct();

    // Product cards trigger a full page reload on selection (existing
    // behavior in main.js), so no live re-sync needed beyond initial load.
  }

  function init() {
    initHeader();
    initBuyBar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window, document);
