/**
 * 💎 BLING BOUTIQUE — GLOBAL APPLICATION SCRIPT
 * Manages Navigation, Global Wishlist, WhatsApp Inquiry Link Formatting,
 * Quick-View Modal, and Dynamic Bestseller Spotlight
 */

const BLING_PHONE = '919284557339'; // Poonam Somani / Bling Official

/**
 * Generates an optimized, pre-filled WhatsApp inquiry URL
 * Automatically tailors message between Instant Store Pickup vs Custom Bespoke Recreation
 */
function getWhatsAppInquiryUrl(product, customNotes = '') {
  const isMadeToOrder = product.availability_status === 'made_to_order';
  let brandGreeting, actionPrompt;

  if (isMadeToOrder) {
    brandGreeting = "Hi Poonam! I saw this design on Bling Boutique:";
    actionPrompt = "I see this studio sample is marked 'Crafted on Order / Sold'. Can you recreate this custom piece for me in my size / preferred color?";
  } else {
    brandGreeting = "Hi Poonam! I found this creation on Bling Boutique:";
    actionPrompt = "Is this piece currently available in your Solapur studio for immediate pickup / same-day dispatch?";
  }

  const prodInfo = `*${product.title}* (SKU: ${product.sku || product.id}) - ₹${product.price.toLocaleString('en-IN')}`;
  const notes = customNotes ? `\n*My Customization Request:* ${customNotes}` : `\n${actionPrompt}`;
  const fullText = `${brandGreeting}\n\n${prodInfo}${notes}\n\nPlease share delivery and ordering details.`;
  return `https://wa.me/${BLING_PHONE}?text=${encodeURIComponent(fullText)}`;
}

/**
 * Initializes global UI interactions
 */
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Storage
  if (window.BlingStorage) {
    await window.BlingStorage.init();
  }

  // 2. Setup Sticky Header Elevation
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // 3. Setup Mobile Navigation Drawer
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  const drawerCloseBtn = document.querySelector('.mobile-drawer-close');
  const backdrop = document.querySelector('.backdrop-overlay');

  function openDrawer() {
    if (mobileDrawer) mobileDrawer.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (mobileDrawer) mobileDrawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', () => {
    closeDrawer();
    closeQuickView();
  });

  // 4. Update Wishlist Count
  updateWishlistBadges();
  window.addEventListener('bling:wishlist-updated', updateWishlistBadges);

  // 5. If on index page, render Bestsellers
  const bestsellersContainer = document.getElementById('bestsellers-grid');
  if (bestsellersContainer) {
    renderBestsellers(bestsellersContainer);
    window.addEventListener('bling:catalog-updated', () => renderBestsellers(bestsellersContainer));
  }

  // 6. Setup Modal Listeners
  setupQuickViewModal();
});

/**
 * Updates all wishlist counters on the page
 */
function updateWishlistBadges() {
  const count = window.BlingStorage ? window.BlingStorage.getWishlist().length : 0;
  document.querySelectorAll('.wishlist-counter').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

/**
 * Creates HTML for a luxury double-bezel product card
 */
function createProductCardHTML(product) {
  const isWish = window.BlingStorage && window.BlingStorage.isWishlisted(product.id);
  const isMadeToOrder = product.availability_status === 'made_to_order';
  const waUrl = getWhatsAppInquiryUrl(product);

  const statusBadgeHTML = isMadeToOrder
    ? `<span class="product-status-badge status-made-to-order" title="Sold in Studio — Available for bespoke handcrafted recreation">
        <span class="status-indicator-dot"></span> Crafted on Order
       </span>`
    : `<span class="product-status-badge status-in-stock" title="Available in Solapur Studio for instant pickup / dispatch">
        <span class="status-indicator-dot"></span> In Studio
       </span>`;

  const ctaBtnText = isMadeToOrder ? 'Recreate' : 'Inquire';
  
  return `
    <article class="product-card" data-id="${product.id}" data-sku="${product.sku || ''}">
      <div class="product-image-wrap">
        <img 
          src="${encodeURI(product.image)}" 
          alt="${product.title}" 
          loading="lazy" 
          decoding="async"
          onerror="this.onerror=null; this.src='SampleImages/WhatsApp Image 2026-09-08 at 11.16.39 PM.jpeg';"
        />
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
        <button 
          class="product-wishlist-btn ${isWish ? 'active' : ''}" 
          aria-label="Add to wishlist" 
          onclick="handleWishlistClick(event, '${product.id}')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWish ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      
      <div class="product-details">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
          <div class="product-category-tag">${product.categoryName || product.category}</div>
          ${statusBadgeHTML}
        </div>

        <h3 class="product-title" title="${product.title}">${product.title}</h3>
        
        <div class="product-meta">
          <div class="price-wrap">
            <span class="current-price">₹${product.price.toLocaleString('en-IN')}</span>
            ${product.originalPrice ? `<span class="original-price">₹${product.originalPrice.toLocaleString('en-IN')}</span>` : ''}
          </div>
          <span style="font-size: 0.72rem; color: var(--color-text-muted);">${product.sku || ''}</span>
        </div>

        <div class="product-card-actions">
          <button class="btn btn-secondary btn-sm" onclick="openQuickView('${product.id}')">
            Quick View
          </button>
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm" title="${isMadeToOrder ? 'Request Custom Recreation on WhatsApp' : 'Inquire on WhatsApp'}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.18-.544-1.748-.724-2.883-2.484-2.969-2.599-.086-.116-.714-.951-.714-1.815 0-.865.452-1.29.613-1.464.162-.174.354-.217.472-.217.118 0 .236.002.339.006.109.005.254-.041.398.305.148.356.507 1.235.551 1.324.045.09.075.195.015.313-.059.12-.089.195-.178.299-.089.105-.187.234-.267.314-.09.09-.184.188-.079.369.105.18.468.772 1.004 1.249.691.614 1.274.805 1.454.895.18.09.286.076.392-.045.106-.12.453-.526.574-.707.121-.18.242-.15.405-.09.163.06 1.034.488 1.212.577.178.09.297.135.34.21.043.075.043.435-.101.84z"/>
            </svg>
            ${ctaBtnText}
          </a>
        </div>
      </div>
    </article>
  `;
}

/**
 * Handle Wishlist Heart Click
 */
function handleWishlistClick(e, id) {
  e.stopPropagation();
  e.preventDefault();
  if (!window.BlingStorage) return;
  const isNowWish = window.BlingStorage.toggleWishlist(id);
  const btn = e.currentTarget;
  if (btn) {
    btn.classList.toggle('active', isNowWish);
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', isNowWish ? 'currentColor' : 'none');
  }
}

/**
 * Render Bestsellers on Index
 */
function renderBestsellers(container) {
  if (!window.BlingStorage) return;
  const catalog = window.BlingStorage.getCatalog();
  const bestsellers = catalog.filter(p => p.isBestseller).slice(0, 4);
  const itemsToRender = bestsellers.length ? bestsellers : catalog.slice(0, 4);
  
  container.innerHTML = itemsToRender.map(createProductCardHTML).join('');
}

/**
 * Setup Quick-View Modal Logic
 */
function setupQuickViewModal() {
  const modalOverlay = document.getElementById('quick-view-modal');
  if (!modalOverlay) return;

  const closeBtn = modalOverlay.querySelector('.modal-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeQuickView);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeQuickView();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeQuickView();
  });
}

function openQuickView(id) {
  if (!window.BlingStorage) return;
  const product = window.BlingStorage.getProductById(id);
  if (!product) return;

  const modal = document.getElementById('quick-view-modal');
  const modalContent = document.getElementById('quick-view-content');
  if (!modal || !modalContent) return;

  const isMadeToOrder = product.availability_status === 'made_to_order';
  const waUrl = getWhatsAppInquiryUrl(product);

  const statusBadgeHTML = isMadeToOrder
    ? `<span class="product-status-badge status-made-to-order">
        <span class="status-indicator-dot"></span> Sold • Crafted on Order (3–5 Days)
       </span>`
    : `<span class="product-status-badge status-in-stock">
        <span class="status-indicator-dot"></span> Available in Solapur Studio (Same-Day Pickup)
       </span>`;

  modalContent.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-lg); align-items: start;">
      <div style="border-radius: var(--radius-lg); overflow: hidden; background: var(--color-bg-subtle); border: 1px solid var(--color-border); aspect-ratio: 1/1;">
        <img 
          src="${encodeURI(product.image)}" 
          alt="${product.title}" 
          style="width: 100%; height: 100%; object-fit: cover;"
          onerror="this.onerror=null; this.src='SampleImages/WhatsApp Image 2026-09-08 at 11.16.39 PM.jpeg';"
        />
      </div>
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <div class="product-category-tag">${product.categoryName} • ${product.sku || product.id}</div>
          ${statusBadgeHTML}
        </div>
        <h2 style="font-size: clamp(1.5rem, 2vw + 1rem, 2.2rem); margin-bottom: 8px;">${product.title}</h2>
        
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <span style="font-size: 1.5rem; font-weight: 700; color: var(--color-text-main);">₹${product.price.toLocaleString('en-IN')}</span>
          ${product.originalPrice ? `<span style="font-size: 1.05rem; color: var(--color-text-light); text-decoration: line-through;">₹${product.originalPrice.toLocaleString('en-IN')}</span>` : ''}
          ${product.badge ? `<span class="product-badge" style="position: static;">${product.badge}</span>` : ''}
        </div>

        <p style="color: var(--color-text-muted); font-size: 0.95rem; margin-bottom: 16px; line-height: 1.6;">
          ${product.description}
        </p>

        ${isMadeToOrder ? `
          <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: var(--radius-md); padding: 12px; margin-bottom: 16px; font-size: 0.85rem; color: #92400E;">
            <strong>✨ Bespoke Creation:</strong> The original showroom sample of this piece was acquired at our Solapur boutique. Poonam can hand-sculpt a recreation tailored to your exact measurements, colorway, and nail shape.
          </div>
        ` : `
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: var(--radius-md); padding: 12px; margin-bottom: 16px; font-size: 0.85rem; color: #065F46;">
            <strong>🟢 In-Studio Ready:</strong> Available right now on display at Shop No. 3, Alle Nagar, Solapur for instant in-store collection or express dispatch.
          </div>
        `}

        <div style="background: var(--color-bg-subtle); border-radius: var(--radius-md); padding: 14px; margin-bottom: 24px; font-size: 0.85rem; border: 1px solid var(--color-border);">
          <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-accent); margin-bottom: 8px;">Artisanal Specifications</div>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 6px; color: var(--color-text-main);">
            <li><strong>Aesthetic Style:</strong> ${product.style || 'Signature'}</li>
            <li><strong>Ideal Occasion:</strong> ${product.occasion || 'Festive & Daily'}</li>
            ${product.specs && product.specs.material ? `<li><strong>Material:</strong> ${product.specs.material}</li>` : ''}
            ${product.specs && product.specs.finish ? `<li><strong>Finish:</strong> ${product.specs.finish}</li>` : ''}
            ${product.specs && product.specs.sizesAvailable ? `<li><strong>Sizes Available:</strong> ${product.specs.sizesAvailable.join(', ')}</li>` : ''}
          </ul>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp" style="width: 100%;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.18-.544-1.748-.724-2.883-2.484-2.969-2.599-.086-.116-.714-.951-.714-1.815 0-.865.452-1.29.613-1.464.162-.174.354-.217.472-.217.118 0 .236.002.339.006.109.005.254-.041.398.305.148.356.507 1.235.551 1.324.045.09.075.195.015.313-.059.12-.089.195-.178.299-.089.105-.187.234-.267.314-.09.09-.184.188-.079.369.105.18.468.772 1.004 1.249.691.614 1.274.805 1.454.895.18.09.286.076.392-.045.106-.12.453-.526.574-.707.121-.18.242-.15.405-.09.163.06 1.034.488 1.212.577.178.09.297.135.34.21.043.075.043.435-.101.84z"/>
            </svg>
            ${isMadeToOrder ? 'Request Custom Recreation on WhatsApp 💬' : 'Inquire & Reserve on WhatsApp 💬'}
          </a>
          <p style="font-size: 0.75rem; text-align: center; color: var(--color-text-light);">
            ⚡ Connects directly with Poonam Somani on WhatsApp for instant confirmation.
          </p>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  const modal = document.getElementById('quick-view-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Expose modal helpers globally
window.openQuickView = openQuickView;
window.closeQuickView = closeQuickView;
window.handleWishlistClick = handleWishlistClick;
window.getWhatsAppInquiryUrl = getWhatsAppInquiryUrl;
