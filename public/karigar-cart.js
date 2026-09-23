/* =====================================================
   KARIGAR — Cart & wishlist store
   New, additive client-side module. Nothing in the
   existing AR/product code depends on this file, and
   this file never touches DeepAR, products.json, or
   any API route. localStorage only — no backend,
   no payment data is ever collected here.
===================================================== */

(function (window) {
  "use strict";

  const CART_KEY = "karigarCart";
  const WISHLIST_KEY = "karigarWishlist";

  const listeners = new Set();

  function readJSON(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      console.warn(`KarigarCart: could not read ${key}`, error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`KarigarCart: could not save ${key}`, error);
    }
  }

  function notify() {
    const snapshot = getState();
    listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (error) {
        console.error("KarigarCart listener error:", error);
      }
    });
  }

  function getCart() {
    return readJSON(CART_KEY, []);
  }

  function getWishlist() {
    return readJSON(WISHLIST_KEY, []);
  }

  function getState() {
    const cart = getCart();
    return {
      cart,
      wishlist: getWishlist(),
      cartCount: cart.reduce((sum, item) => sum + (item.qty || 0), 0),
      wishlistCount: getWishlist().length,
    };
  }

  function parsePrice(price) {
    const numeric = String(price ?? "").replace(/[^0-9.]/g, "");
    const value = parseFloat(numeric);
    return Number.isFinite(value) ? value : 0;
  }

  function addToCart(product, qty) {
    if (!product || !product.id) return getState();

    const quantity = Math.max(1, Number(qty) || 1);
    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.qty += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name || "Khussa",
        price: product.price || "",
        image: product.image || "",
        qty: quantity,
      });
    }

    writeJSON(CART_KEY, cart);
    notify();
    return getState();
  }

  function removeFromCart(productId) {
    const cart = getCart().filter((item) => item.id !== productId);
    writeJSON(CART_KEY, cart);
    notify();
    return getState();
  }

  function setQty(productId, qty) {
    const cart = getCart();
    const item = cart.find((entry) => entry.id === productId);

    if (!item) return getState();

    const quantity = Math.max(1, Number(qty) || 1);
    item.qty = quantity;

    writeJSON(CART_KEY, cart);
    notify();
    return getState();
  }

  function clearCart() {
    writeJSON(CART_KEY, []);
    notify();
    return getState();
  }

  function getTotals() {
    const cart = getCart();
    const subtotal = cart.reduce(
      (sum, item) => sum + parsePrice(item.price) * item.qty,
      0
    );
    return {
      itemCount: cart.reduce((sum, item) => sum + item.qty, 0),
      subtotal,
    };
  }

  function isWishlisted(productId) {
    return getWishlist().includes(productId);
  }

  function toggleWishlist(productId) {
    if (!productId) return getState();

    let wishlist = getWishlist();

    if (wishlist.includes(productId)) {
      wishlist = wishlist.filter((id) => id !== productId);
    } else {
      wishlist = [...wishlist, productId];
    }

    writeJSON(WISHLIST_KEY, wishlist);
    notify();
    return getState();
  }

  function subscribe(fn) {
    if (typeof fn !== "function") return () => {};
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function formatPrice(price) {
    const value = parsePrice(price);
    if (!value) return String(price ?? "");
    return `Rs. ${value.toLocaleString("en-PK")}`;
  }

  window.KarigarCart = {
    getState,
    getCart,
    getWishlist,
    getTotals,
    addToCart,
    removeFromCart,
    setQty,
    clearCart,
    isWishlisted,
    toggleWishlist,
    subscribe,
    formatPrice,
    parsePrice,
  };
})(window);
