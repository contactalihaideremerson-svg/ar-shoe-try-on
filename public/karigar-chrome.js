/* =====================================================
   KARIGAR — Shared header / footer / mobile nav chrome.
   Injects markup into #karigar-header and
   #karigar-footer placeholders so the same nav/footer
   isn't duplicated by hand across every page.
   Purely presentational — no AR/product logic lives
   here.
===================================================== */

(function (window, document) {
  "use strict";

  const NAV_LINKS = [
    { href: "index.html", label: "Home", key: "home" },
    { href: "shop.html", label: "Shop", key: "shop" },
    { href: "shop.html#collections", label: "Collections", key: "collections" },
    { href: "about.html", label: "Our Story", key: "about" },
    { href: "contact.html", label: "Contact", key: "contact" },
  ];

  function svgSearch() {
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`;
  }
  function svgUser() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.6-4 5-6 8-6s6.4 2 8 6"/></svg>`;
  }
  function svgHeart() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-6.7-4.35-9.3-8.1C.8 9.8 1.9 6 5.4 5.1c2-.5 3.9.4 5.1 2.1a1 1 0 0 0 1 0c1.2-1.7 3.1-2.6 5.1-2.1 3.5.9 4.6 4.7 2.7 7.8C18.7 16.65 12 21 12 21z"/></svg>`;
  }
  function svgBag() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 7h12l1.2 13.2a2 2 0 0 1-2 2.1H6.8a2 2 0 0 1-2-2.1L6 7z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>`;
  }
  function svgBurger() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`;
  }
  function svgHome() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>`;
  }
  function svgGrid() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`;
  }

  function logoMarkup(tagline, dark) {
    // logo-light.png is transparent and sits cleanly on any light
    // surface. logo-dark.png ships with its own opaque brown card
    // baked in, so on dark surfaces it's wrapped in a matching
    // badge (see .kg-logo-badge) instead of looking like a seam.
    const img = dark
      ? `<span class="kg-logo-badge"><img class="kg-logo-img" src="assets/brand/logo-dark.png" alt="KARIGAR"></span>`
      : `<img class="kg-logo-img" src="assets/brand/logo-light.png" alt="KARIGAR">`;
    return `
      ${img}
      ${tagline ? '<span class="kg-logo-tag">Wear Your Heritage</span>' : ""}
    `;
  }

  function renderHeader(root, opts) {
    const activeKey = opts.active || "";

    root.innerHTML = `
      <div class="kg-announce">
        <div class="kg-announce-inner">
          <span>Free Shipping on Orders Over Rs. 2000</span>
          <div class="kg-announce-links">
            <a href="cart.html">Track Order</a>
            <a href="contact.html">Help &amp; Support</a>
          </div>
        </div>
      </div>

      <header class="kg-header">
        <div class="kg-header-inner">
          <button type="button" class="kg-icon-btn kg-header-burger" id="kgMenuOpen" aria-label="Open menu">
            ${svgBurger()}
          </button>

          <a href="index.html" class="kg-header-logo-link">
            ${logoMarkup(false, false)}
          </a>

          <nav class="kg-nav">
            ${NAV_LINKS.map(
              (link) =>
                `<a href="${link.href}" class="${link.key === activeKey ? "kg-active" : ""}">${link.label}</a>`
            ).join("")}
          </nav>

          <div class="kg-header-actions">
            <label class="kg-search">
              ${svgSearch()}
              <input type="search" id="kgSearchInput" placeholder="Search for your favorite khusa...">
            </label>
            <button type="button" class="kg-icon-btn" id="kgSearchToggle" aria-label="Search" style="display:none;">
              ${svgSearch()}
            </button>
            <a class="kg-icon-btn" href="cart.html" aria-label="Wishlist" id="kgWishlistLink" style="display:none;">
              ${svgHeart()}
              <span class="kg-badge" id="kgWishlistBadge" style="display:none;">0</span>
            </a>
            <a class="kg-icon-btn" href="cart.html" aria-label="Account" style="display:none;">
              ${svgUser()}
            </a>
            <a class="kg-icon-btn" href="cart.html" aria-label="Cart">
              ${svgBag()}
              <span class="kg-badge" id="kgCartBadge" style="display:none;">0</span>
            </a>
          </div>
        </div>
      </header>

      <div class="kg-mobile-menu" id="kgMobileMenu">
        <div class="kg-mobile-menu-backdrop" id="kgMenuBackdrop"></div>
        <div class="kg-mobile-menu-panel">
          <button type="button" class="kg-icon-btn kg-mobile-menu-close" id="kgMenuClose" aria-label="Close menu">✕</button>
          ${logoMarkup(true, false)}
          <label class="kg-search" style="width:100%;min-width:0;">
            ${svgSearch()}
            <input type="search" id="kgSearchInputMobile" placeholder="Search khussas...">
          </label>
          <nav class="kg-mobile-menu-links">
            ${NAV_LINKS.map((link) => `<a href="${link.href}">${link.label}</a>`).join("")}
          </nav>
        </div>
      </div>
    `;

    const menu = document.getElementById("kgMobileMenu");
    const open = () => menu.classList.add("kg-open");
    const close = () => menu.classList.remove("kg-open");

    const openBtn = document.getElementById("kgMenuOpen");
    const closeBtn = document.getElementById("kgMenuClose");
    const backdrop = document.getElementById("kgMenuBackdrop");

    if (openBtn) openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (backdrop) backdrop.addEventListener("click", close);

    [
      ["kgSearchInput", document.getElementById("kgSearchInput")],
      ["kgSearchInputMobile", document.getElementById("kgSearchInputMobile")],
    ].forEach(([, input]) => {
      if (!input) return;
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          const q = input.value.trim();
          window.location.href = q
            ? `shop.html?q=${encodeURIComponent(q)}`
            : "shop.html";
        }
      });
    });
  }

  function renderFooter(root) {
    root.innerHTML = `
      <div class="kg-newsletter">
        <div class="kg-newsletter-inner">
          <div class="kg-newsletter-copy">
            <strong>Stay Connected</strong>
            <span>Subscribe to get updates on new arrivals, exclusive offers and more.</span>
          </div>
          <form class="kg-newsletter-form" id="kgNewsletterForm">
            <input type="email" required placeholder="Enter your email address">
            <button type="submit" class="kg-btn kg-btn-light">Subscribe</button>
          </form>
        </div>
      </div>

      <div class="kg-footer-main">
        <div class="kg-footer-grid">
          <div class="kg-footer-col">
            <span class="kg-logo-badge"><img class="kg-logo-img" src="assets/brand/logo-dark.png" alt="KARIGAR"></span>
            <p style="margin-top:12px;max-width:260px;">
              Handcrafted khussas blending Pakistani heritage with modern luxury.
            </p>
            <div class="kg-footer-script">Wear Your Heritage</div>
          </div>
          <div class="kg-footer-col">
            <h4>Quick Links</h4>
            <a href="index.html">Home</a>
            <a href="shop.html">Shop</a>
            <a href="about.html">About</a>
            <a href="contact.html">Contact</a>
          </div>
          <div class="kg-footer-col">
            <h4>Customer Care</h4>
            <a href="cart.html">Track Order</a>
            <a href="contact.html">Shipping Policy</a>
            <a href="contact.html">Returns &amp; Refunds</a>
            <a href="contact.html">FAQ</a>
          </div>
          <div class="kg-footer-col">
            <h4>Follow Us</h4>
            <div class="kg-footer-social">
              <a href="#" class="kg-icon-btn" style="border-color:rgba(251,248,243,.2);background:transparent;color:#fbf8f3;" aria-label="Facebook">f</a>
              <a href="#" class="kg-icon-btn" style="border-color:rgba(251,248,243,.2);background:transparent;color:#fbf8f3;" aria-label="Instagram">ig</a>
              <a href="#" class="kg-icon-btn" style="border-color:rgba(251,248,243,.2);background:transparent;color:#fbf8f3;" aria-label="Pinterest">p</a>
            </div>
          </div>
        </div>
      </div>

      <div class="kg-footer-bottom">
        <div class="kg-footer-bottom-inner">
          <span>© ${new Date().getFullYear()} KARIGAR. All rights reserved.</span>
          <span>Handcrafted with ♥ in Pakistan</span>
        </div>
      </div>
    `;

    const form = document.getElementById("kgNewsletterForm");
    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        form.reset();
        if (window.KarigarToast) {
          window.KarigarToast.show("Thanks for subscribing!");
        }
      });
    }
  }

  function renderBottomNav(root, opts) {
    if (!root) return;
    const activeKey = opts.active || "";

    const items = [
      { href: "index.html", label: "Home", key: "home", icon: svgHome() },
      { href: "shop.html", label: "Shop", key: "shop", icon: svgGrid() },
      { href: "cart.html", label: "Wishlist", key: "wishlist", icon: svgHeart(), badge: "kgWishlistBadgeMobile" },
      { href: "cart.html", label: "Cart", key: "cart", icon: svgBag(), badge: "kgCartBadgeMobile" },
      { href: "cart.html", label: "Account", key: "account", icon: svgUser() },
    ];

    root.innerHTML = items
      .map(
        (item) => `
        <a href="${item.href}" class="${item.key === activeKey ? "kg-active" : ""}" style="position:relative;">
          ${item.icon}
          <span>${item.label}</span>
          ${item.badge ? `<span class="kg-badge" id="${item.badge}" style="display:none;top:-2px;right:16px;">0</span>` : ""}
        </a>
      `
      )
      .join("");

    document.body.classList.add("kg-has-bottom-nav");
  }

  function updateBadges() {
    if (!window.KarigarCart) return;
    const { cartCount, wishlistCount } = window.KarigarCart.getState();

    [
      ["kgCartBadge", cartCount],
      ["kgCartBadgeMobile", cartCount],
      ["kgWishlistBadge", wishlistCount],
      ["kgWishlistBadgeMobile", wishlistCount],
    ].forEach(([id, count]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = String(count);
      el.style.display = count > 0 ? "flex" : "none";
    });
  }

  function initChrome(options) {
    const opts = options || {};

    const headerRoot = document.getElementById("karigar-header");
    const footerRoot = document.getElementById("karigar-footer");
    const bottomNavRoot = document.getElementById("karigar-bottom-nav");

    if (headerRoot) renderHeader(headerRoot, opts);
    if (footerRoot) renderFooter(footerRoot);
    if (bottomNavRoot) renderBottomNav(bottomNavRoot, opts);

    updateBadges();

    if (window.KarigarCart) {
      window.KarigarCart.subscribe(updateBadges);
    }
  }

  window.KarigarChrome = { init: initChrome };

  window.KarigarToast = {
    show(message) {
      let toast = document.getElementById("kgToast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "kgToast";
        toast.className = "kg-toast";
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add("kg-show");
      window.clearTimeout(toast._kgTimeout);
      toast._kgTimeout = window.setTimeout(() => {
        toast.classList.remove("kg-show");
      }, 2200);
    },
  };
})(window, document);
