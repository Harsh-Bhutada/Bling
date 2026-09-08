/**
 * 💎 BLING BOUTIQUE — STORAGE & CATALOGUE ENGINE
 * GitHub-Pages-Ready Client-Side Persistence Layer
 * Integrates LocalStorage, Default JSON Bundling, and Reactive Mutation Events
 */

const BLING_STORAGE_KEY = 'bling_boutique_catalog_v2';
const BLING_WISHLIST_KEY = 'bling_boutique_wishlist_v2';

const BlingStorage = {
  _cache: null,
  _listeners: [],

  /**
   * Initializes the catalog state.
   * Loads from localStorage if present; otherwise fetches ./data/catalog.json
   */
  async init() {
    try {
      const stored = localStorage.getItem(BLING_STORAGE_KEY);
      if (stored) {
        this._cache = JSON.parse(stored);
        return this._cache;
      }
    } catch (e) {
      console.warn('LocalStorage read failed, trying default catalog', e);
    }

    try {
      const res = await fetch('./data/catalog.json');
      if (res.ok) {
        const data = await res.json();
        this._cache = data;
        this._persist();
        return this._cache;
      }
    } catch (err) {
      console.warn('Fetch ./data/catalog.json failed, using inline emergency backup', err);
    }

    if (!this._cache || !this._cache.length) {
      this._cache = this._getFallbackSeed();
      this._persist();
    }
    return this._cache;
  },

  /**
   * Get all active products
   */
  getCatalog() {
    if (!this._cache) {
      try {
        const stored = localStorage.getItem(BLING_STORAGE_KEY);
        if (stored) this._cache = JSON.parse(stored);
      } catch (e) {}
    }
    return this._cache || [];
  },

  /**
   * Get a single product by ID
   */
  getProductById(id) {
    const list = this.getCatalog();
    return list.find(item => item.id === id) || null;
  },

  /**
   * Add a new product to catalogue
   */
  addProduct(productData) {
    const list = this.getCatalog();
    const id = 'bling-custom-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    const sku = 'BL-' + (productData.category ? productData.category.substr(0, 2).toUpperCase() : 'CU') + '-' + Math.floor(100 + Math.random() * 900);
    
    const newProduct = {
      id,
      sku,
      title: productData.title || 'Untitled Custom Creation',
      category: productData.category || 'nails',
      categoryName: this._getCategoryDisplayName(productData.category),
      price: Number(productData.price) || 999,
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : Math.round(Number(productData.price || 999) * 1.3),
      image: productData.image || 'SampleImages/WhatsApp Image 2026-09-08 at 11.16.39 PM.jpeg',
      style: productData.style || 'Minimalist Chic',
      occasion: productData.occasion || 'Everyday Chic',
      rating: 5.0,
      reviewsCount: 1,
      isBestseller: Boolean(productData.isBestseller),
      isNew: true,
      badge: productData.badge || 'New Arrival',
      description: productData.description || 'Artisanal creation handcrafted with premium materials and signature design by Bling.',
      specs: productData.specs || {
        material: 'Premium Handcrafted Medium',
        finish: 'Artisan High Polish',
        care: 'Handle with delicate care, avoid moisture.'
      }
    };

    list.unshift(newProduct);
    this._cache = list;
    this._persist();
    this._notify('add', newProduct);
    return newProduct;
  },

  /**
   * Update an existing product
   */
  updateProduct(id, updates) {
    const list = this.getCatalog();
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;

    const updated = {
      ...list[index],
      ...updates,
      price: updates.price !== undefined ? Number(updates.price) : list[index].price,
      originalPrice: updates.originalPrice !== undefined ? Number(updates.originalPrice) : list[index].originalPrice
    };

    if (updates.category) {
      updated.categoryName = this._getCategoryDisplayName(updates.category);
    }

    list[index] = updated;
    this._cache = list;
    this._persist();
    this._notify('update', updated);
    return updated;
  },

  /**
   * Delete a product by ID
   */
  deleteProduct(id) {
    const list = this.getCatalog();
    const filtered = list.filter(item => item.id !== id);
    this._cache = filtered;
    this._persist();
    this._notify('delete', { id });
    return true;
  },

  /**
   * Reset the catalog back to initial 20+ item factory default
   */
  async resetToDefault() {
    try {
      const res = await fetch('./data/catalog.json');
      if (res.ok) {
        const data = await res.json();
        this._cache = data;
        this._persist();
        this._notify('reset', this._cache);
        return this._cache;
      }
    } catch (e) {}

    this._cache = this._getFallbackSeed();
    this._persist();
    this._notify('reset', this._cache);
    return this._cache;
  },

  /**
   * Export the catalog as a downloadable JSON file
   */
  exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.getCatalog(), null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bling-boutique-catalog-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  /**
   * Import catalog from a JSON string
   */
  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this._cache = parsed;
        this._persist();
        this._notify('import', this._cache);
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON import', e);
    }
    return false;
  },

  /* --- Wishlist Methods --- */
  getWishlist() {
    try {
      const saved = localStorage.getItem(BLING_WISHLIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  },

  isWishlisted(id) {
    return this.getWishlist().includes(id);
  },

  toggleWishlist(id) {
    let list = this.getWishlist();
    if (list.includes(id)) {
      list = list.filter(item => item !== id);
    } else {
      list.push(id);
    }
    try {
      localStorage.setItem(BLING_WISHLIST_KEY, JSON.stringify(list));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('bling:wishlist-updated', { detail: { wishlist: list } }));
    return list.includes(id);
  },

  /* --- Helper Internal Utilities --- */
  _persist() {
    try {
      localStorage.setItem(BLING_STORAGE_KEY, JSON.stringify(this._cache));
    } catch (e) {
      console.warn('Failed to save to localStorage (quota exceeded?)', e);
    }
  },

  _notify(action, payload) {
    window.dispatchEvent(new CustomEvent('bling:catalog-updated', {
      detail: { action, payload, total: this._cache ? this._cache.length : 0 }
    }));
  },

  _getCategoryDisplayName(cat) {
    const map = {
      nails: 'Press-On Nails',
      necklaces: 'Necklaces',
      hair: 'Hair Accessories',
      earrings: 'Earrings & Brooches',
      bracelets: 'Bracelets & Charms'
    };
    return map[cat] || 'Artisan Accessory';
  },

  _getFallbackSeed() {
    return [
      {
        id: "bling-nl-01",
        sku: "BL-NL-01",
        title: "Opulent 3D Floral & Gold French Press-On Nails",
        category: "nails",
        categoryName: "Press-On Nails",
        price: 1299,
        originalPrice: 1699,
        image: "SampleImages/WhatsApp Image 2026-09-08 at 11.16.39 PM.jpeg",
        style: "Bridal Glam",
        occasion: "Wedding & Festive",
        rating: 4.9,
        reviewsCount: 42,
        isBestseller: true,
        isNew: true,
        badge: "Handcrafted 3D",
        description: "Exquisite salon-grade press-on nails featuring hand-sculpted 3D porcelain flowers, metallic gold French contouring, and luminous micro pearl embellishments."
      },
      {
        id: "bling-nk-01",
        sku: "BL-NK-01",
        title: "Royal Emerald Silk & Pearl Festive Choker Set",
        category: "necklaces",
        categoryName: "Necklaces",
        price: 2499,
        originalPrice: 3299,
        image: "SampleImages/WhatsApp Image 2026-09-08 at 11.19.10 PM.jpeg",
        style: "Vintage Victorian",
        occasion: "Wedding & Festive",
        rating: 4.9,
        reviewsCount: 36,
        isBestseller: true,
        isNew: true,
        badge: "Heritage Set",
        description: "Statement royal bottle-green raw silk medallion flanked by hand-woven multi-strand pearl strings, filigree brass antique barrel, and matching studs."
      },
      {
        id: "bling-ha-01",
        sku: "BL-HA-01",
        title: "Artisanal Pearl & Crystal Tulle Hair Bow",
        category: "hair",
        categoryName: "Hair Accessories",
        price: 699,
        originalPrice: 999,
        image: "SampleImages/WhatsApp Image 2026-09-08 at 11.18.23 PM (1).jpeg",
        style: "Bridal Glam",
        occasion: "Wedding & Festive",
        rating: 5.0,
        reviewsCount: 47,
        isBestseller: true,
        isNew: true,
        badge: "Viral Favorite",
        description: "Dreamy tiered white tulle hair bow adorned with crystalline diamantes, cascading pearl tassel strands, and a secure French barrette clip."
      },
      {
        id: "bling-ea-02",
        sku: "BL-EA-02",
        title: "Handcrafted Pearl & Ruby Blossom Saree Wreath Brooch",
        category: "earrings",
        categoryName: "Earrings & Brooches",
        price: 899,
        originalPrice: 1299,
        image: "SampleImages/WhatsApp Image 2026-09-08 at 11.18.22 PM.jpeg",
        style: "Vintage Victorian",
        occasion: "Wedding & Festive",
        rating: 5.0,
        reviewsCount: 39,
        isBestseller: true,
        isNew: true,
        badge: "Artisan Special",
        description: "Handcrafted floral wreath brooch featuring 8 hand-wired pearl blossoms with deep ruby gemstone centers on flexible golden wire armature."
      }
    ];
  }
};

// Make globally available
window.BlingStorage = BlingStorage;
