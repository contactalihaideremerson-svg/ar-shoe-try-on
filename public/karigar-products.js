/* =====================================================
   KARIGAR — Product fetch/render helpers for the new
   premium UI (Home / Shop / Product Detail / AR tray
   "add to cart" bar).

   IMPORTANT: this file is intentionally separate from
   src/index.js (main.js). It fetches the SAME
   /api/products endpoint and applies the SAME
   `enabled !== false` visibility rule, but renders
   into different container ids (never #product-list)
   so it can never collide with the existing DeepAR /
   product-tray logic that main.js owns.
===================================================== */

(function (window) {
  "use strict";

  const PRODUCT_DATA_URL = "/api/products";

  let cachedPromise = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function fetchAllProducts(force) {
    if (cachedPromise && !force) {
      return cachedPromise;
    }

    cachedPromise = fetch(`${PRODUCT_DATA_URL}?t=${Date.now()}`, {
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load products: ${response.status}`);
        }
        return response.json();
      })
      .then((products) => {
        if (!Array.isArray(products)) {
          throw new Error("products.json must contain an array.");
        }
        return products;
      });

    return cachedPromise;
  }

  async function fetchVisibleProducts(force) {
    const products = await fetchAllProducts(force);
    return products.filter(
      (product) => product && product.enabled !== false
    );
  }

  async function getProductById(id) {
    const products = await fetchAllProducts();
    return products.find((product) => product && product.id === id) || null;
  }

  function triggerArTryOn(product) {
    if (!product || !product.effect) return;
    window.sessionStorage.setItem("selectedEffect", product.effect);
    window.location.href = "tryon.html";
  }

  function productCardHtml(product) {
    const wishlisted =
      window.KarigarCart && window.KarigarCart.isWishlisted(product.id);

    const priceLabel =
      window.KarigarCart ? window.KarigarCart.formatPrice(product.price) : product.price;

    return `
      <div class="kg-product-card" data-product-id="${escapeHtml(product.id)}">
        <div class="kg-product-media">
          <a href="product.html?id=${encodeURIComponent(product.id)}">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
          </a>
          <button
            type="button"
            class="kg-wishlist-btn${wishlisted ? " kg-active" : ""}"
            data-kg-wishlist="${escapeHtml(product.id)}"
            aria-label="Toggle wishlist"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${wishlisted ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2">
              <path d="M12 21s-6.7-4.35-9.3-8.1C.8 9.8 1.9 6 5.4 5.1c2-.5 3.9.4 5.1 2.1a1 1 0 0 0 1 0c1.2-1.7 3.1-2.6 5.1-2.1 3.5.9 4.6 4.7 2.7 7.8C18.7 16.65 12 21 12 21z"/>
            </svg>
          </button>
        </div>
        <div class="kg-product-body">
          <a href="product.html?id=${encodeURIComponent(product.id)}" class="kg-product-name">
            ${escapeHtml(product.name)}
          </a>
          <span class="kg-product-price">${escapeHtml(priceLabel)}</span>
          <div class="kg-product-actions">
            ${
              product.effect
                ? `<button type="button" class="kg-product-tryon-btn" data-kg-tryon="${escapeHtml(product.id)}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
                    Try On
                  </button>`
                : `<span></span>`
            }
            <button type="button" class="kg-product-cart-btn" data-kg-addcart="${escapeHtml(product.id)}" aria-label="Add to cart">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function attachGridEvents(container, products, onCartAdd) {
    container.querySelectorAll("[data-kg-wishlist]").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        const id = btn.getAttribute("data-kg-wishlist");
        if (window.KarigarCart) {
          window.KarigarCart.toggleWishlist(id);
          btn.classList.toggle("kg-active");
          const active = btn.classList.contains("kg-active");
          btn.querySelector("svg").setAttribute("fill", active ? "currentColor" : "none");
        }
      });
    });

    container.querySelectorAll("[data-kg-tryon]").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        const id = btn.getAttribute("data-kg-tryon");
        const product = products.find((item) => item.id === id);
        triggerArTryOn(product);
      });
    });

    container.querySelectorAll("[data-kg-addcart]").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        const id = btn.getAttribute("data-kg-addcart");
        const product = products.find((item) => item.id === id);
        if (product && window.KarigarCart) {
          window.KarigarCart.addToCart(product, 1);
          if (typeof onCartAdd === "function") onCartAdd(product);
        }
      });
    });
  }

  async function renderProductGrid(container, options) {
    if (!container) return [];

    const opts = options || {};

    container.innerHTML = `<div class="kg-product-empty">Loading khussas...</div>`;

    try {
      let products = await fetchVisibleProducts(opts.force);

      if (typeof opts.filter === "function") {
        products = products.filter(opts.filter);
      }

      if (typeof opts.sort === "function") {
        products = [...products].sort(opts.sort);
      }

      if (opts.limit) {
        products = products.slice(0, opts.limit);
      }

      if (!products.length) {
        container.innerHTML = `<div class="kg-product-empty">${
          opts.emptyMessage || "No khussas are currently available."
        }</div>`;
        return [];
      }

      container.innerHTML = products.map(productCardHtml).join("");
      attachGridEvents(container, products, opts.onCartAdd);

      if (typeof opts.onRendered === "function") {
        opts.onRendered(products);
      }

      return products;
    } catch (error) {
      console.error("KarigarProducts: failed to render grid", error);
      container.innerHTML = `<div class="kg-product-error">Unable to load products right now.</div>`;
      return [];
    }
  }

  window.KarigarProducts = {
    fetchAllProducts,
    fetchVisibleProducts,
    getProductById,
    triggerArTryOn,
    renderProductGrid,
    productCardHtml,
    attachGridEvents,
    escapeHtml,
  };
})(window);
