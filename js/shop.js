/**
 * 💎 BLING BOUTIQUE — SHOP & ADVANCE FILTERING ENGINE
 * Multi-Attribute Filtering (Category, Aesthetic, Occasion, Availability Status, Price Tier, Search, Wishlist)
 * Real-time DOM updates & reactivity with BlingStorage & QR Scan Auto-Open
 */

const ShopFilter = {
  state: {
    category: 'all',
    style: 'all',
    occasion: 'all',
    availability: 'all',
    priceTier: 'all',
    searchQuery: '',
    sortBy: 'featured',
    onlyWishlist: false
  },

  init() {
    this._readQueryParams();
    this._bindEvents();
    this.render();

    // Listen for storage mutations from Admin or Realtime Supabase
    window.addEventListener('bling:catalog-updated', () => {
      this.render();
    });

    window.addEventListener('bling:wishlist-updated', () => {
      if (this.state.onlyWishlist) {
        this.render();
      }
    });
  },

  _readQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const filter = params.get('filter');
    const sku = params.get('sku');
    const status = params.get('status');

    if (category) {
      this.state.category = category;
      document.querySelectorAll('#category-pills .filter-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
      });
    }

    if (filter === 'wishlist') {
      this.state.onlyWishlist = true;
    }

    if (status) {
      this.state.availability = status;
      const availSelect = document.getElementById('availability-filter');
      if (availSelect) availSelect.value = status;
    }

    // Physical QR Scan Handler:
    if (sku) {
      // 1. If scanned from an Admin device (Poonam at counter), jump directly to 1-Tap Countertop POS!
      if (window.BlingAuth && window.BlingAuth.isAuthenticated()) {
        window.location.replace(`admin.html?tab=countertop&sku=${encodeURIComponent(sku)}`);
        return;
      }

      // 2. Otherwise (customer scanning), isolate creation and pop up Quick View modal
      this.state.searchQuery = sku.toLowerCase();
      const searchInput = document.getElementById('search-input');
      if (searchInput) searchInput.value = sku;
      
      setTimeout(() => {
        if (window.BlingStorage) {
          const item = window.BlingStorage.getProductById(sku);
          if (item && window.openQuickView) {
            window.openQuickView(item.id);
          }
        }
      }, 400);
    }
  },

  _bindEvents() {
    // 1. Category Pills
    const pills = document.querySelectorAll('#category-pills .filter-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.state.category = pill.dataset.category;
        this.render();
      });
    });

    // 2. Advance Filters Drawer Toggle
    const toggleBtn = document.getElementById('toggle-advance-filters');
    const drawer = document.getElementById('advance-filters-drawer');
    if (toggleBtn && drawer) {
      toggleBtn.addEventListener('click', () => {
        const isOpen = drawer.classList.toggle('open');
        toggleBtn.classList.toggle('active', isOpen);
      });
    }

    // 3. Search Bar
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value.trim().toLowerCase();
        this.render();
      });
    }

    // 4. Dropdowns
    const styleSelect = document.getElementById('style-filter');
    if (styleSelect) {
      styleSelect.addEventListener('change', (e) => {
        this.state.style = e.target.value;
        this.render();
      });
    }

    const occasionSelect = document.getElementById('occasion-filter');
    if (occasionSelect) {
      occasionSelect.addEventListener('change', (e) => {
        this.state.occasion = e.target.value;
        this.render();
      });
    }

    const availSelect = document.getElementById('availability-filter');
    if (availSelect) {
      availSelect.addEventListener('change', (e) => {
        this.state.availability = e.target.value;
        this.render();
      });
    }

    const priceSelect = document.getElementById('price-filter');
    if (priceSelect) {
      priceSelect.addEventListener('change', (e) => {
        this.state.priceTier = e.target.value;
        this.render();
      });
    }

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.state.sortBy = e.target.value;
        this.render();
      });
    }

    // 5. Wishlist Filter Button in header
    const wishBtn = document.getElementById('wishlist-filter-btn');
    if (wishBtn) {
      wishBtn.addEventListener('click', () => {
        this.state.onlyWishlist = !this.state.onlyWishlist;
        wishBtn.classList.toggle('active', this.state.onlyWishlist);
        this.render();
      });
    }

    // 6. Clear all filters
    const clearBtn = document.getElementById('clear-all-filters-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.resetAllFilters();
      });
    }
  },

  render() {
    if (!window.BlingStorage) return;
    const catalog = window.BlingStorage.getCatalog();
    const grid = document.getElementById('catalog-grid');
    const emptyState = document.getElementById('empty-state');
    const resultsCount = document.getElementById('results-count');
    const clearBtn = document.getElementById('clear-all-filters-btn');

    let filtered = catalog.filter(product => {
      // Wishlist filter
      if (this.state.onlyWishlist && !window.BlingStorage.isWishlisted(product.id)) {
        return false;
      }

      // Category filter
      if (this.state.category !== 'all' && product.category !== this.state.category) {
        return false;
      }

      // Availability Status filter
      if (this.state.availability !== 'all' && product.availability_status !== this.state.availability) {
        return false;
      }

      // Style / Aesthetic filter
      if (this.state.style !== 'all' && product.style !== this.state.style) {
        return false;
      }

      // Occasion filter
      if (this.state.occasion !== 'all' && product.occasion !== this.state.occasion) {
        return false;
      }

      // Price filter
      if (this.state.priceTier === 'under-800' && product.price >= 800) {
        return false;
      }
      if (this.state.priceTier === '800-1200' && (product.price < 800 || product.price > 1200)) {
        return false;
      }
      if (this.state.priceTier === 'above-1200' && product.price <= 1200) {
        return false;
      }

      // Search Query (matches title, description, SKU, style, occasion)
      if (this.state.searchQuery) {
        const query = this.state.searchQuery;
        const matchesTitle = (product.title || '').toLowerCase().includes(query);
        const matchesDesc = (product.description || '').toLowerCase().includes(query);
        const matchesStyle = (product.style || '').toLowerCase().includes(query);
        const matchesOccasion = (product.occasion || '').toLowerCase().includes(query);
        const matchesSku = (product.sku || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesStyle && !matchesOccasion && !matchesSku) {
          return false;
        }
      }

      return true;
    });

    // Apply Sorting
    filtered.sort((a, b) => {
      if (this.state.sortBy === 'price-asc') return a.price - b.price;
      if (this.state.sortBy === 'price-desc') return b.price - a.price;
      if (this.state.sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      // Default: featured/bestseller first
      if (a.isBestseller && !b.isBestseller) return -1;
      if (!a.isBestseller && b.isBestseller) return 1;
      return 0;
    });

    // Update Counter
    if (resultsCount) {
      resultsCount.textContent = `Showing ${filtered.length} ${filtered.length === 1 ? 'creation' : 'creations'}`;
    }

    // Update Active Filter Tags UI
    this._renderActiveTags();

    // Show/hide clear button
    const hasActiveFilters = this.state.category !== 'all' || 
                             this.state.style !== 'all' || 
                             this.state.occasion !== 'all' || 
                             this.state.availability !== 'all' ||
                             this.state.priceTier !== 'all' || 
                             this.state.searchQuery !== '' || 
                             this.state.onlyWishlist;

    if (clearBtn) {
      clearBtn.style.display = hasActiveFilters ? 'inline-block' : 'none';
    }

    // Render cards or empty state
    if (filtered.length === 0) {
      if (grid) grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (grid) {
        grid.style.display = 'grid';
        grid.innerHTML = filtered.map(createProductCardHTML).join('');
      }
    }
  },

  _renderActiveTags() {
    const container = document.getElementById('active-tag-container');
    if (!container) return;
    const tags = [];

    if (this.state.onlyWishlist) {
      tags.push({ label: 'Wishlist Only', clear: () => { this.state.onlyWishlist = false; } });
    }
    if (this.state.category !== 'all') {
      tags.push({ label: `Category: ${this.state.category}`, clear: () => { 
        this.state.category = 'all';
        document.querySelectorAll('#category-pills .filter-pill').forEach(p => p.classList.toggle('active', p.dataset.category === 'all'));
      }});
    }
    if (this.state.availability !== 'all') {
      const label = this.state.availability === 'in_stock' ? 'Status: In Studio' : 'Status: Made to Order';
      tags.push({ label, clear: () => {
        this.state.availability = 'all';
        const el = document.getElementById('availability-filter');
        if (el) el.value = 'all';
      }});
    }
    if (this.state.style !== 'all') {
      tags.push({ label: `Style: ${this.state.style}`, clear: () => { 
        this.state.style = 'all'; 
        const el = document.getElementById('style-filter');
        if (el) el.value = 'all';
      }});
    }
    if (this.state.occasion !== 'all') {
      tags.push({ label: `Occasion: ${this.state.occasion}`, clear: () => { 
        this.state.occasion = 'all'; 
        const el = document.getElementById('occasion-filter');
        if (el) el.value = 'all';
      }});
    }
    if (this.state.priceTier !== 'all') {
      tags.push({ label: `Price Tier`, clear: () => { 
        this.state.priceTier = 'all'; 
        const el = document.getElementById('price-filter');
        if (el) el.value = 'all';
      }});
    }
    if (this.state.searchQuery) {
      tags.push({ label: `Search: "${this.state.searchQuery}"`, clear: () => {
        this.state.searchQuery = '';
        const el = document.getElementById('search-input');
        if (el) el.value = '';
      }});
    }

    if (tags.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = tags.map((t, idx) => `
      <span class="active-tag">
        ${t.label}
        <button type="button" aria-label="Remove filter" onclick="ShopFilter.clearTag(${idx})">✕</button>
      </span>
    `).join('');

    this._tagClearHandlers = tags.map(t => t.clear);
  },

  clearTag(idx) {
    if (this._tagClearHandlers && this._tagClearHandlers[idx]) {
      this._tagClearHandlers[idx]();
      this.render();
    }
  },

  resetAllFilters() {
    this.state.category = 'all';
    this.state.style = 'all';
    this.state.occasion = 'all';
    this.state.availability = 'all';
    this.state.priceTier = 'all';
    this.state.searchQuery = '';
    this.state.sortBy = 'featured';
    this.state.onlyWishlist = false;

    // Reset UI elements
    document.querySelectorAll('#category-pills .filter-pill').forEach(p => p.classList.toggle('active', p.dataset.category === 'all'));
    const styleEl = document.getElementById('style-filter');
    if (styleEl) styleEl.value = 'all';
    const occEl = document.getElementById('occasion-filter');
    if (occEl) occEl.value = 'all';
    const availEl = document.getElementById('availability-filter');
    if (availEl) availEl.value = 'all';
    const priceEl = document.getElementById('price-filter');
    if (priceEl) priceEl.value = 'all';
    const sortEl = document.getElementById('sort-select');
    if (sortEl) sortEl.value = 'featured';
    const searchEl = document.getElementById('search-input');
    if (searchEl) searchEl.value = '';
    const wishBtn = document.getElementById('wishlist-filter-btn');
    if (wishBtn) wishBtn.classList.remove('active');

    this.render();
  }
};

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  ShopFilter.init();
});

window.ShopFilter = ShopFilter;
window.resetAllFilters = () => ShopFilter.resetAllFilters();
