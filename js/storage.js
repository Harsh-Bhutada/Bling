/**
 * 💎 BLING BOUTIQUE — HYBRID STORAGE & REALTIME CLOUD ENGINE
 * Seamlessly integrates Supabase Realtime Cloud Database with
 * Zero-Failure LocalStorage / JSON Fallback for Offline & GitHub Pages Deployments.
 */

const BLING_STORAGE_KEY = 'bling_boutique_catalog_v2';
const BLING_WISHLIST_KEY = 'bling_boutique_wishlist_v2';

const BlingStorage = {
  _cache: null,
  _isCloudSync: false,
  _realtimeSubscribed: false,

  /**
   * Initializes the catalog state.
   * 1. Attempts to connect to Supabase Cloud if credentials exist.
   * 2. If connected, loads live products from Supabase and sets up Realtime channel.
   * 3. If Supabase is unconfigured/unreachable, gracefully falls back to LocalStorage & catalog.json.
   */
  async init() {
    // Clear legacy localStorage product cache to free browser storage and avoid desync
    try {
      localStorage.removeItem(BLING_STORAGE_KEY);
      localStorage.removeItem('bling_boutique_catalog_v1');
    } catch (e) {}

    // 1. Primary Single Source of Truth: Supabase Cloud Database
    if (window.BlingSupabase) {
      const client = window.BlingSupabase.getClient();
      if (client && window.BlingSupabase.isConfigured) {
        try {
          const { data, error } = await client
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && Array.isArray(data) && data.length > 0) {
            this._cache = data.map(this._normalizeProductRecord);
            this._isCloudSync = true;
            this._setupRealtimeListener(client);
            console.log(`💎 Supabase Single Source of Truth: loaded ${this._cache.length} live creations.`);
            return this._cache;
          } else if (error) {
            console.warn('Supabase fetch failed or table empty:', error.message);
          }
        } catch (cloudErr) {
          console.warn('Supabase cloud connection error, falling back to catalog.json:', cloudErr);
        }
      }
    }

    // 2. Offline / Initial Seed Fallback: ./data/catalog.json
    this._isCloudSync = false;
    try {
      const res = await fetch('./data/catalog.json');
      if (res.ok) {
        const data = await res.json();
        this._cache = data.map(this._normalizeProductRecord);
        return this._cache;
      }
    } catch (err) {
      console.warn('Fetch ./data/catalog.json failed, using inline emergency backup', err);
    }

    if (!this._cache || !this._cache.length) {
      this._cache = this._getFallbackSeed().map(this._normalizeProductRecord);
    }
    return this._cache;
  },

  /**
   * Check if Cloud Sync (Supabase) is currently active
   */
  isCloudActive() {
    return this._isCloudSync;
  },

  /**
   * Set up real-time listener on products table
   */
  _setupRealtimeListener(client) {
    if (this._realtimeSubscribed || !client) return;

    try {
      client.channel('public:products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          console.log('⚡ Realtime event received from Supabase:', payload.eventType);
          if (payload.eventType === 'UPDATE') {
            const idx = this._cache.findIndex(p => p.id === payload.new.id || p.sku === payload.new.sku);
            if (idx !== -1) {
              const existing = this._cache[idx];
              // Merge updates into existing record, preserving custom image if payload.new.image is omitted/null
              const merged = {
                ...existing,
                ...payload.new,
                image: (payload.new.image && typeof payload.new.image === 'string' && payload.new.image.trim())
                  ? payload.new.image
                  : existing.image,
                availability_status: payload.new.availability_status || existing.availability_status
              };
              const updated = this._normalizeProductRecord(merged);
              this._cache[idx] = updated;
              this._persist();
              this._notify('update', updated);
            }
          } else if (payload.eventType === 'INSERT') {
            const inserted = this._normalizeProductRecord(payload.new);
            if (!this._cache.some(p => p.id === inserted.id)) {
              this._cache.unshift(inserted);
              this._persist();
              this._notify('add', inserted);
            }
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old.id;
            this._cache = this._cache.filter(p => p.id !== oldId);
            this._persist();
            this._notify('delete', { id: oldId });
          }
        })
        .subscribe();

      this._realtimeSubscribed = true;
    } catch (e) {
      console.warn('Could not subscribe to Supabase Realtime channel:', e);
    }
  },

  /**
   * Normalize product record (ensures availability_status and casing consistency)
   */
  _normalizeProductRecord(item) {
    return {
      id: item.id || ('bling-' + Math.random().toString(36).substr(2, 6)),
      sku: item.sku || ('BL-' + Math.floor(100 + Math.random() * 900)),
      title: item.title || 'Untitled Custom Creation',
      category: item.category || 'nails',
      categoryName: item.categoryName || item.category_name || 'Artisan Accessory',
      price: Number(item.price) || 999,
      originalPrice: item.originalPrice !== undefined ? item.originalPrice : (item.original_price || null),
      image: item.image || 'SampleImages/WhatsApp Image 2026-09-08 at 11.16.39 PM.jpeg',
      style: item.style || 'Minimalist Chic',
      occasion: item.occasion || 'Everyday Chic',
      rating: Number(item.rating) || 5.0,
      reviewsCount: Number(item.reviewsCount || item.reviews_count || 1),
      isBestseller: Boolean(item.isBestseller !== undefined ? item.isBestseller : item.is_bestseller),
      isNew: Boolean(item.isNew !== undefined ? item.isNew : item.is_new),
      badge: item.badge || '',
      description: item.description || '',
      specs: item.specs || null,
      availability_status: item.availability_status || item.availabilityStatus || 'in_stock'
    };
  },

  /**
   * Get all active products
   */
  getCatalog() {
    if (!this._cache) {
      try {
        const stored = localStorage.getItem(BLING_STORAGE_KEY);
        if (stored) this._cache = JSON.parse(stored).map(this._normalizeProductRecord);
      } catch (e) {}
    }
    return this._cache || [];
  },

  /**
   * Get a single product by ID or SKU
   */
  getProductById(id) {
    const list = this.getCatalog();
    return list.find(item => item.id === id || item.sku === id) || null;
  },

  /**
   * 1-Tap Countertop Availability Switcher
   * Toggles an item between 'in_stock' and 'made_to_order' in ~1.5s
   */
  async toggleAvailability(id, targetStatus = null) {
    const list = this.getCatalog();
    const index = list.findIndex(item => item.id === id || item.sku === id);
    if (index === -1) return null;

    const current = list[index];
    const newStatus = targetStatus || (current.availability_status === 'in_stock' ? 'made_to_order' : 'in_stock');

    current.availability_status = newStatus;
    list[index] = current;
    this._cache = list;
    this._persist();
    this._notify('update', current);

    // Sync to Supabase if configured
    if (window.BlingSupabase && window.BlingSupabase.isConfigured) {
      const client = window.BlingSupabase.getClient();
      if (client) {
        try {
          const { error } = await client
            .from('products')
            .update({ availability_status: newStatus })
            .eq('id', current.id);
          if (error) {
            console.warn('Cloud update failed for availability_status:', error.message);
          } else {
            this._isCloudSync = true;
            console.log(`💎 Cloud update synced: ${current.sku} -> ${newStatus}`);
          }
        } catch (e) {
          console.warn('Cloud update exception:', e);
        }
      }
    }

    return current;
  },

  /**
   * Add a new product to catalogue
   */
  async addProduct(productData) {
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
      description: productData.description || 'Artisanal creation handcrafted with signature design by Bling.',
      availability_status: productData.availability_status || 'in_stock'
    };

    list.unshift(newProduct);
    this._cache = list;
    this._persist();
    this._notify('add', newProduct);

    // Cloud insert
    if (window.BlingSupabase && window.BlingSupabase.isConfigured) {
      const client = window.BlingSupabase.getClient();
      if (client) {
        try {
          const { error } = await client.from('products').insert([{
            id: newProduct.id,
            sku: newProduct.sku,
            title: newProduct.title,
            category: newProduct.category,
            category_name: newProduct.categoryName,
            price: newProduct.price,
            original_price: newProduct.originalPrice,
            image: newProduct.image,
            style: newProduct.style,
            occasion: newProduct.occasion,
            badge: newProduct.badge,
            description: newProduct.description,
            is_bestseller: newProduct.isBestseller,
            is_new: newProduct.isNew,
            availability_status: newProduct.availability_status
          }]);
          if (error) {
            console.warn('Cloud insert failed:', error.message);
          } else {
            this._isCloudSync = true;
          }
        } catch (e) {
          console.warn('Cloud insert exception:', e);
        }
      }
    }

    return newProduct;
  },

  /**
   * Update an existing product
   */
  async updateProduct(id, updates) {
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

    // Cloud update
    if (window.BlingSupabase && window.BlingSupabase.isConfigured) {
      const client = window.BlingSupabase.getClient();
      if (client) {
        try {
          await client.from('products').update({
            title: updated.title,
            category: updated.category,
            category_name: updated.categoryName,
            price: updated.price,
            original_price: updated.originalPrice,
            image: updated.image,
            style: updated.style,
            occasion: updated.occasion,
            badge: updated.badge,
            description: updated.description,
            is_bestseller: updated.isBestseller,
            availability_status: updated.availability_status
          }).eq('id', id);
        } catch (e) {
          console.warn('Cloud update failed:', e);
        }
      }
    }

    return updated;
  },

  /**
   * Delete a product by ID
   */
  async deleteProduct(id) {
    const list = this.getCatalog();
    const filtered = list.filter(item => item.id !== id);
    this._cache = filtered;
    this._persist();
    this._notify('delete', { id });

    // Cloud delete
    if (window.BlingSupabase && window.BlingSupabase.isConfigured) {
      const client = window.BlingSupabase.getClient();
      if (client) {
        try {
          await client.from('products').delete().eq('id', id);
        } catch (e) {
          console.warn('Cloud delete failed:', e);
        }
      }
    }

    return true;
  },

  /**
   * One-Click Seed Supabase from Local Catalog
   * Populates a fresh Supabase database with all 20 curated creations
   */
  async seedSupabaseFromLocal() {
    if (!window.BlingSupabase) throw new Error('Supabase client module not found.');
    const client = window.BlingSupabase.getClient();
    if (!client) throw new Error('Please configure Supabase URL and Anon Key first.');

    // Fetch master catalog from catalog.json if cache is empty or incomplete
    let sourceCatalog = this.getCatalog();
    if (!sourceCatalog || sourceCatalog.length < 20) {
      try {
        const res = await fetch('./data/catalog.json');
        if (res.ok) {
          sourceCatalog = await res.json();
        }
      } catch (e) {}
    }

    const rows = sourceCatalog.map(p => ({
      id: p.id,
      sku: p.sku,
      title: p.title,
      category: p.category,
      category_name: p.categoryName || p.category,
      price: p.price,
      original_price: p.originalPrice || null,
      image: p.image,
      style: p.style || 'Artisan',
      occasion: p.occasion || 'Everyday',
      rating: p.rating || 5.0,
      reviews_count: p.reviewsCount || 1,
      is_bestseller: Boolean(p.isBestseller),
      is_new: Boolean(p.isNew),
      badge: p.badge || '',
      description: p.description || '',
      availability_status: p.availability_status || 'in_stock'
    }));

    const { data, error } = await client.from('products').upsert(rows, { onConflict: 'id' });
    if (error) throw error;

    this._isCloudSync = true;
    // Re-fetch clean state from Supabase
    await this.init();
    this._notify('reset', this._cache);
    return rows.length;
  },

  /**
   * Reset the catalog back to factory default
   */
  async resetToDefault() {
    try {
      const res = await fetch('./data/catalog.json');
      if (res.ok) {
        const data = await res.json();
        this._cache = data.map(this._normalizeProductRecord);
        if (window.BlingSupabase && window.BlingSupabase.isConfigured) {
          await this.seedSupabaseFromLocal();
        }
        this._notify('reset', this._cache);
        return this._cache;
      }
    } catch (e) {}

    this._cache = this._getFallbackSeed().map(this._normalizeProductRecord);
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
        this._cache = parsed.map(this._normalizeProductRecord);
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

  /* --- Internal Helper Utilities --- */
  _persist() {
    // Intentionally a no-op: Supabase is the single source of truth for catalogue products.
    // Products are never written to localStorage to avoid 5MB quota exhaustion and device desynchronization.
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
        availability_status: "in_stock",
        description: "Exquisite salon-grade press-on nails featuring hand-sculpted 3D porcelain flowers, metallic gold French contouring, and luminous micro pearl embellishments."
      },
      {
        id: "bling-nl-02",
        sku: "BL-NL-02",
        title: "Ribbed Glass Amber Espresso Minimalist Nails",
        category: "nails",
        categoryName: "Press-On Nails",
        price: 999,
        originalPrice: 1299,
        image: "SampleImages/WhatsApp Image 2026-09-08 at 11.16.40 PM.jpeg",
        style: "Minimalist Chic",
        occasion: "Everyday Chic",
        rating: 4.8,
        reviewsCount: 29,
        isBestseller: true,
        isNew: false,
        badge: "Trending",
        availability_status: "made_to_order",
        description: "Subtle texture meets sophisticated translucent amber fluting. Inspired by artisan fluted glassware."
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
        availability_status: "in_stock",
        description: "Statement royal bottle-green raw silk medallion flanked by hand-woven multi-strand pearl strings."
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
        availability_status: "in_stock",
        description: "Dreamy tiered white tulle hair bow adorned with crystalline diamantes, cascading pearl tassel strands."
      }
    ];
  }
};

// Make globally available
window.BlingStorage = BlingStorage;
