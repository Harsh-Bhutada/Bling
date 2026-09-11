/**
 * 💎 BLING BOUTIQUE — ADMIN PORTAL & COUNTERTOP CONTROLLER
 * Full Management Suite:
 * 1. 7-Day Session & Fast-PIN Security Gateway
 * 2. ⚡ 1-Tap Countertop POS View (1.5-second stock toggling)
 * 3. 🖨️ Vector Display QR Tray Tag Generator (for boutique velvet trays)
 * 4. ⚙️ Supabase Cloud Sync Manager & 1-Click Database Seeder
 * 5. Full In-Browser CRUD (Add, Edit, Delete, Export, Demo Reset)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Storage & Supabase Client
  if (window.BlingStorage) {
    await window.BlingStorage.init();
  }

  // DOM Elements
  const authOverlay = document.getElementById('admin-auth-overlay');
  const authPinForm = document.getElementById('auth-pin-form');
  const authPinInput = document.getElementById('auth-pin-input');
  const authEmailForm = document.getElementById('auth-email-form');
  const authEmailInput = document.getElementById('auth-email-input');
  const authPassInput = document.getElementById('auth-password-input');
  const authErrorMsg = document.getElementById('auth-error-msg');
  const btnLogout = document.getElementById('btn-admin-logout');
  const sessionBadge = document.getElementById('session-badge');
  const cloudBadge = document.getElementById('cloud-status-badge');

  // Tabs
  const tabButtons = document.querySelectorAll('.admin-tab-btn');
  const tabContents = {
    'tab-table': document.getElementById('view-table'),
    'tab-countertop': document.getElementById('view-countertop'),
    'tab-qr': document.getElementById('view-qr'),
    'tab-cloud': document.getElementById('view-cloud')
  };

  // Table & Countertop search
  const tableBody = document.getElementById('admin-table-body');
  const searchInput = document.getElementById('admin-search-input');
  const countertopSearchInput = document.getElementById('countertop-search-input');
  const countertopGrid = document.getElementById('countertop-grid');
  const qrGrid = document.getElementById('qr-tray-grid');

  // Modal & Form Elements
  const modal = document.getElementById('product-form-modal');
  const modalTitle = document.getElementById('modal-form-title');
  const form = document.getElementById('product-admin-form');
  const btnOpenAdd = document.getElementById('btn-open-add-modal');
  const btnCloseModal = document.getElementById('close-form-modal');
  const btnCancelForm = document.getElementById('btn-cancel-form');
  const btnResetDemo = document.getElementById('btn-reset-demo');
  const btnExportJson = document.getElementById('btn-export-json');

  // Form Fields
  const fId = document.getElementById('form-product-id');
  const fTitle = document.getElementById('form-title');
  const fCategory = document.getElementById('form-category');
  const fAvailability = document.getElementById('form-availability');
  const fPrice = document.getElementById('form-price');
  const fOrigPrice = document.getElementById('form-orig-price');
  const fStyle = document.getElementById('form-style');
  const fOccasion = document.getElementById('form-occasion');
  const fBadge = document.getElementById('form-badge');
  const fImageUrl = document.getElementById('form-image-url');
  const fImageFile = document.getElementById('form-image-file');
  const fImagePreviewBox = document.getElementById('form-image-preview-box');
  const fImagePreviewImg = document.getElementById('form-image-preview-img');
  const fDescription = document.getElementById('form-description');
  const fIsBestseller = document.getElementById('form-is-bestseller');

  let currentImageData = '';

  // Cloud Sync Form
  const cloudForm = document.getElementById('cloud-credentials-form');
  const cloudUrlInput = document.getElementById('cloud-url-input');
  const cloudKeyInput = document.getElementById('cloud-key-input');
  const btnClearCloud = document.getElementById('btn-clear-cloud');
  const btnSeedSupabase = document.getElementById('btn-seed-supabase');
  const changePinForm = document.getElementById('change-pin-form');
  const newPinInput = document.getElementById('new-pin-input');

  /* =========================================================================
     1. AUTHENTICATION GATEWAY (7-DAY PERSISTENT SESSION)
     ========================================================================= */

  function checkAuthentication() {
    if (!window.BlingAuth) return true;
    const isAuth = window.BlingAuth.isAuthenticated();

    if (!isAuth) {
      authOverlay.style.display = 'flex';
      if (authPinInput) authPinInput.focus();
    } else {
      authOverlay.style.display = 'none';
      updateSessionBadge();
    }
    return isAuth;
  }

  function updateSessionBadge() {
    if (!sessionBadge || !window.BlingAuth) return;
    const remainingDays = window.BlingAuth.getSessionRemainingDays();
    sessionBadge.textContent = `🔒 7-Day Session Active (${remainingDays}d left)`;
  }

  // Switch Auth Tab (PIN vs Supabase Email)
  window.switchAuthTab = function (tab) {
    const tabPinBtn = document.getElementById('tab-auth-pin');
    const tabEmailBtn = document.getElementById('tab-auth-email');
    authErrorMsg.style.display = 'none';

    if (tab === 'pin') {
      tabPinBtn.classList.add('active');
      tabEmailBtn.classList.remove('active');
      authPinForm.style.display = 'block';
      authEmailForm.style.display = 'none';
      if (authPinInput) authPinInput.focus();
    } else {
      tabEmailBtn.classList.add('active');
      tabPinBtn.classList.remove('active');
      authPinForm.style.display = 'none';
      authEmailForm.style.display = 'block';
      if (authEmailInput) authEmailInput.focus();
    }
  };

  // Handle PIN Unlock
  if (authPinForm) {
    authPinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPin = authPinInput.value.trim();
      if (window.BlingAuth && window.BlingAuth.loginWithPin(enteredPin)) {
        authOverlay.style.display = 'none';
        authPinInput.value = '';
        authErrorMsg.style.display = 'none';
        showToast('🔓 Boutique session unlocked for 7 days!');
        updateSessionBadge();
      } else {
        authErrorMsg.textContent = '❌ Incorrect PIN. (Default: 9284)';
        authErrorMsg.style.display = 'block';
      }
    });
  }

  // Handle Supabase Email Unlock
  if (authEmailForm) {
    authEmailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = authEmailInput.value.trim();
      const pass = authPassInput.value;
      try {
        await window.BlingAuth.loginWithEmailPassword(email, pass);
        authOverlay.style.display = 'none';
        authEmailInput.value = '';
        authPassInput.value = '';
        authErrorMsg.style.display = 'none';
        showToast('🔓 Supabase admin verified for 7 days!');
        updateSessionBadge();
      } catch (err) {
        authErrorMsg.textContent = `❌ ${err.message || 'Login failed'}`;
        authErrorMsg.style.display = 'block';
      }
    });
  }

  // Handle Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      if (confirm('Log out from Bling Boutique Admin on this device?')) {
        if (window.BlingAuth) await window.BlingAuth.logout();
        authOverlay.style.display = 'flex';
        showToast('Logged out successfully.');
      }
    });
  }

  // Run initial auth check
  checkAuthentication();

  /* =========================================================================
     2. TAB SWITCHING ENGINE
     ========================================================================= */

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.dataset.tab;
      Object.keys(tabContents).forEach(key => {
        if (tabContents[key]) {
          tabContents[key].style.display = (key === targetTab) ? 'block' : 'none';
        }
      });

      // Trigger lazy render per tab
      if (targetTab === 'tab-countertop') renderCountertopPOS();
      if (targetTab === 'tab-qr') renderQRTrayCards();
      if (targetTab === 'tab-cloud') loadCloudSettings();
    });
  });

  /* =========================================================================
     3. ⚡ 1-TAP COUNTERTOP POS MODE (1.5-SECOND INSTANT AVAILABILITY TOGGLE)
     ========================================================================= */

  function renderCountertopPOS(filterQuery = '') {
    if (!countertopGrid || !window.BlingStorage) return;
    const catalog = window.BlingStorage.getCatalog();

    let items = catalog;
    if (filterQuery) {
      items = catalog.filter(p =>
        (p.title || '').toLowerCase().includes(filterQuery) ||
        (p.sku || '').toLowerCase().includes(filterQuery) ||
        (p.category || '').toLowerCase().includes(filterQuery)
      );
    }

    if (items.length === 0) {
      countertopGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--color-text-muted);">
          No boutique creations found matching filter.
        </div>
      `;
      return;
    }

    countertopGrid.innerHTML = items.map(p => {
      const isInStock = p.availability_status !== 'made_to_order';

      return `
        <div class="countertop-card" data-id="${p.id}" data-sku="${p.sku}">
          <div class="countertop-card-header">
            <img 
              class="countertop-thumb" 
              src="${encodeURI(p.image)}" 
              alt="${p.title}" 
              onerror="this.onerror=null; this.src='SampleImages/WhatsApp Image 2026-09-08 at 11.16.39 PM.jpeg';"
            />
            <div style="flex: 1; min-width: 0;">
              <div class="countertop-sku">${p.sku} • ${p.categoryName || p.category}</div>
              <div class="countertop-title">${p.title}</div>
              <div style="font-weight: 700; color: var(--color-text-main); font-size: 0.9rem; margin-top: 2px;">
                ₹${p.price.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div class="countertop-actions">
            <button 
              type="button" 
              class="btn-toggle-stock ${isInStock ? 'active-in-stock' : ''}" 
              onclick="window.quickSetStatus('${p.id}', 'in_stock')"
              title="Piece is physically on display in Solapur store"
            >
              <span class="status-indicator-dot" style="background: #10B981;"></span>
              In Studio
            </button>

            <button 
              type="button" 
              class="btn-toggle-stock ${!isInStock ? 'active-made-to-order' : ''}" 
              onclick="window.quickSetStatus('${p.id}', 'made_to_order')"
              title="Counter piece sold! Website switches to custom order recreation"
            >
              <span class="status-indicator-dot" style="background: #F59E0B;"></span>
              Made to Order
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Global Quick Set Status Handler (1.5-second execution)
  window.quickSetStatus = async function (id, targetStatus) {
    if (!window.BlingStorage) return;

    // Optimistic UI feedback
    const card = document.querySelector(`.countertop-card[data-id="${id}"]`);
    if (card) {
      card.style.transform = 'scale(0.98)';
      setTimeout(() => { card.style.transform = ''; }, 150);
    }

    const updated = await window.BlingStorage.toggleAvailability(id, targetStatus);
    if (updated) {
      const statusLabel = targetStatus === 'in_stock' ? 'Ready in Studio 🟢' : 'Sold • Made to Order 🟡';
      showToast(`⚡ ${updated.sku} set to ${statusLabel}`);
      renderDashboard(searchInput ? searchInput.value.trim().toLowerCase() : '');
      renderCountertopPOS(countertopSearchInput ? countertopSearchInput.value.trim().toLowerCase() : '');
    }
  };

  if (countertopSearchInput) {
    countertopSearchInput.addEventListener('input', () => {
      renderCountertopPOS(countertopSearchInput.value.trim().toLowerCase());
    });
  }

  /* =========================================================================
     4. 🖨️ DISPLAY QR TRAY TAG GENERATOR (VECTOR QR VIA QRious)
     ========================================================================= */

  function renderQRTrayCards() {
    if (!qrGrid || !window.BlingStorage) return;
    const catalog = window.BlingStorage.getCatalog();

    // Determine current origin or live link
    const baseUrl = window.location.href.split('admin.html')[0] + 'shop.html';

    qrGrid.innerHTML = catalog.map(p => `
      <div class="qr-tray-tag" id="qr-tag-${p.id}">
        <div class="brand-header">BLING BOUTIQUE</div>
        <div class="brand-subtitle">Solapur Studio</div>

        <div class="qr-code-box">
          <canvas id="qr-canvas-${p.id}"></canvas>
        </div>

        <div class="tag-title">${p.title}</div>
        <div class="tag-sku">${p.sku} • ${p.categoryName || p.category}</div>
        <div class="tag-price">₹${p.price.toLocaleString('en-IN')}</div>
        
        <div class="tag-footer">
          Scan to View Sizing & Custom Details
        </div>
      </div>
    `).join('');

    // Generate QR canvases
    setTimeout(() => {
      catalog.forEach(p => {
        const canvas = document.getElementById(`qr-canvas-${p.id}`);
        if (canvas && window.QRious) {
          const productUrl = `${baseUrl}?sku=${encodeURIComponent(p.sku)}`;
          new window.QRious({
            element: canvas,
            value: productUrl,
            size: 130,
            level: 'H',
            foreground: '#171413'
          });
        }
      });
    }, 100);
  }

  /* =========================================================================
     5. ⚙️ CLOUD SYNC & CREDENTIALS MANAGER
     ========================================================================= */

  function loadCloudSettings() {
    if (!cloudUrlInput || !cloudKeyInput) return;
    cloudUrlInput.value = localStorage.getItem('bling_supabase_url') || (window.BLING_SUPABASE_CONFIG?.url || '');
    cloudKeyInput.value = localStorage.getItem('bling_supabase_anon_key') || (window.BLING_SUPABASE_CONFIG?.anonKey || '');
    updateCloudBadge();
  }

  function updateCloudBadge() {
    if (!cloudBadge) return;
    const isCloud = window.BlingStorage && window.BlingStorage.isCloudActive();
    if (isCloud) {
      cloudBadge.className = 'cloud-status-indicator cloud-online';
      cloudBadge.textContent = '🟢 Supabase Cloud Live';
    } else {
      cloudBadge.className = 'cloud-status-indicator cloud-local';
      cloudBadge.textContent = '⚡ Local Fallback Mode';
    }
  }

  if (cloudForm) {
    cloudForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = cloudUrlInput.value.trim();
      const key = cloudKeyInput.value.trim();

      if (window.BlingSupabase) {
        window.BlingSupabase.saveCredentials(url, key);
        if (window.BlingStorage) {
          await window.BlingStorage.init();
        }
        updateCloudBadge();
        showToast('Supabase Cloud connection updated!');
      }
    });
  }

  if (btnClearCloud) {
    btnClearCloud.addEventListener('click', () => {
      if (confirm('Clear saved Supabase credentials and return to Local Fallback Mode?')) {
        if (window.BlingSupabase) window.BlingSupabase.clearCredentials();
        if (cloudUrlInput) cloudUrlInput.value = '';
        if (cloudKeyInput) cloudKeyInput.value = '';
        updateCloudBadge();
        showToast('Reverted to Local Fallback Mode.');
      }
    });
  }

  if (btnSeedSupabase) {
    btnSeedSupabase.addEventListener('click', async () => {
      try {
        btnSeedSupabase.disabled = true;
        btnSeedSupabase.textContent = 'Seeding creations to Supabase...';
        if (window.BlingStorage) {
          const count = await window.BlingStorage.seedSupabaseFromLocal();
          showToast(`🎉 Successfully seeded ${count} creations into Supabase Cloud!`);
          updateCloudBadge();
        }
      } catch (err) {
        alert('Seeding Error: ' + err.message);
      } finally {
        btnSeedSupabase.disabled = false;
        btnSeedSupabase.textContent = '🚀 Seed All 20 Products to Supabase';
      }
    });
  }

  if (changePinForm) {
    changePinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newPin = newPinInput.value.trim();
      if (newPin && newPin.length === 4) {
        if (window.BlingAuth && window.BlingAuth.setCustomPin(newPin)) {
          showToast(`✅ Boutique PIN updated to ${newPin}!`);
          newPinInput.value = '';
        }
      } else {
        alert('PIN must be exactly 4 digits.');
      }
    });
  }

  /* =========================================================================
     6. CATALOGUE TABLE & FULL CRUD CONTROLLER
     ========================================================================= */

  renderDashboard();
  updateCloudBadge();

  // Search filter
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderDashboard(searchInput.value.trim().toLowerCase());
    });
  }

  // Open Add Modal
  if (btnOpenAdd) {
    btnOpenAdd.addEventListener('click', () => {
      form.reset();
      fId.value = '';
      currentImageData = 'SampleImages/WhatsApp Image 2026-09-08 at 11.16.39 PM.jpeg';
      fImageUrl.value = currentImageData;
      updateImagePreview(currentImageData);
      modalTitle.textContent = 'Add New Handcrafted Creation';
      modal.classList.add('active');
    });
  }

  // Close Modal
  function closeModal() {
    modal.classList.remove('active');
  }
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if (btnCancelForm) btnCancelForm.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Handle Image URL input
  if (fImageUrl) {
    fImageUrl.addEventListener('input', (e) => {
      currentImageData = e.target.value;
      updateImagePreview(currentImageData);
    });
  }

  // Handle Image File Upload (Base64 conversion)
  if (fImageFile) {
    fImageFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          currentImageData = loadEvt.target.result;
          fImageUrl.value = 'Local Upload (' + file.name + ')';
          updateImagePreview(currentImageData);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function updateImagePreview(src) {
    if (src) {
      fImagePreviewImg.src = src;
      fImagePreviewBox.style.display = 'block';
    } else {
      fImagePreviewBox.style.display = 'none';
    }
  }

  // Handle Form Submit (Add or Edit)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window.BlingStorage) return;

    const payload = {
      title: fTitle.value.trim(),
      category: fCategory.value,
      price: Number(fPrice.value),
      originalPrice: fOrigPrice.value ? Number(fOrigPrice.value) : null,
      style: fStyle.value,
      occasion: fOccasion.value,
      badge: fBadge.value.trim(),
      image: currentImageData || 'SampleImages/WhatsApp Image 2026-09-08 at 11.16.39 PM.jpeg',
      description: fDescription.value.trim(),
      isBestseller: fIsBestseller.checked,
      availability_status: fAvailability ? fAvailability.value : 'in_stock'
    };

    if (fId.value) {
      await window.BlingStorage.updateProduct(fId.value, payload);
      showToast('Creation updated successfully!');
    } else {
      await window.BlingStorage.addProduct(payload);
      showToast('New creation added to boutique catalogue!');
    }

    closeModal();
    renderDashboard(searchInput ? searchInput.value.trim().toLowerCase() : '');
    renderCountertopPOS();
  });

  // Reset Demo Button
  if (btnResetDemo) {
    btnResetDemo.addEventListener('click', async () => {
      if (confirm('Reset catalogue back to factory 20-item demo? Any custom test additions will be restored.')) {
        await window.BlingStorage.resetToDefault();
        showToast('Catalogue restored to factory demo state!');
        renderDashboard();
        renderCountertopPOS();
      }
    });
  }

  // Export JSON Button
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      window.BlingStorage.exportJSON();
      showToast('Catalogue exported as JSON!');
    });
  }

  // Render Dashboard Table & Metrics
  function renderDashboard(filterQuery = '') {
    if (!window.BlingStorage) return;
    const catalog = window.BlingStorage.getCatalog();

    // Update Stats
    const sTotal = document.getElementById('stat-total-products');
    const sInStock = document.getElementById('stat-in-stock');
    const sMadeToOrder = document.getElementById('stat-made-to-order');
    const sBestsellers = document.getElementById('stat-total-bestsellers');

    const inStockCount = catalog.filter(p => p.availability_status !== 'made_to_order').length;
    const madeToOrderCount = catalog.filter(p => p.availability_status === 'made_to_order').length;

    if (sTotal) sTotal.textContent = catalog.length;
    if (sInStock) sInStock.textContent = inStockCount;
    if (sMadeToOrder) sMadeToOrder.textContent = madeToOrderCount;
    if (sBestsellers) sBestsellers.textContent = catalog.filter(p => p.isBestseller).length;

    // Filter list for table
    let items = catalog;
    if (filterQuery) {
      items = catalog.filter(p =>
        (p.title || '').toLowerCase().includes(filterQuery) ||
        (p.category || '').toLowerCase().includes(filterQuery) ||
        (p.sku || '').toLowerCase().includes(filterQuery) ||
        (p.style || '').toLowerCase().includes(filterQuery)
      );
    }

    // Render Table Rows
    if (tableBody) {
      if (items.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: var(--space-lg); color: var(--color-text-muted);">
              No products found matching query.
            </td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = items.map(p => {
        const isInStock = p.availability_status !== 'made_to_order';
        const statusBadge = isInStock
          ? `<span class="product-status-badge status-in-stock"><span class="status-indicator-dot"></span> In Studio</span>`
          : `<span class="product-status-badge status-made-to-order"><span class="status-indicator-dot"></span> Made to Order</span>`;

        return `
          <tr>
            <td>
              <div class="thumb-cell">
                <img 
                  src="${encodeURI(p.image)}" 
                  alt="${p.title}" 
                  onerror="this.onerror=null; this.src='SampleImages/WhatsApp Image 2026-09-08 at 11.16.39 PM.jpeg';"
                />
              </div>
            </td>
            <td>
              <div style="font-weight: 700; color: var(--color-text-main);">${p.title}</div>
              <div style="font-size: 0.75rem; color: var(--color-text-light);">${p.sku || p.id}</div>
            </td>
            <td>
              <span style="display: inline-block; padding: 3px 8px; border-radius: var(--radius-pill); background: var(--color-bg-subtle); font-size: 0.75rem; font-weight: 600;">
                ${p.categoryName || p.category}
              </span>
            </td>
            <td>
              <strong style="color: var(--color-text-main);">₹${p.price.toLocaleString('en-IN')}</strong>
              ${p.originalPrice ? `<div style="font-size: 0.75rem; color: var(--color-text-light); text-decoration: line-through;">₹${p.originalPrice.toLocaleString('en-IN')}</div>` : ''}
            </td>
            <td>
              ${statusBadge}
            </td>
            <td>
              ${p.badge ? `<span style="font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-pill); background: var(--color-accent-light); color: var(--color-accent-hover);">${p.badge}</span>` : '—'}
              ${p.isBestseller ? `<span style="display: block; font-size: 0.65rem; color: #E11D48; font-weight: 700; margin-top: 2px;">★ Bestseller</span>` : ''}
            </td>
            <td>
              <div class="action-btn-group">
                <button class="btn-table-edit" onclick="window.editProduct('${p.id}')">Edit</button>
                <button class="btn-table-delete" onclick="window.deleteProduct('${p.id}')">Delete</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Global Edit Handler
  window.editProduct = function (id) {
    if (!window.BlingStorage) return;
    const p = window.BlingStorage.getProductById(id);
    if (!p) return;

    fId.value = p.id;
    fTitle.value = p.title || '';
    fCategory.value = p.category || 'nails';
    if (fAvailability) fAvailability.value = p.availability_status || 'in_stock';
    fPrice.value = p.price || '';
    fOrigPrice.value = p.originalPrice || '';
    fStyle.value = p.style || 'Bridal Glam';
    fOccasion.value = p.occasion || 'Wedding & Festive';
    fBadge.value = p.badge || '';
    fImageUrl.value = p.image || '';
    currentImageData = p.image || '';
    updateImagePreview(currentImageData);
    fDescription.value = p.description || '';
    fIsBestseller.checked = Boolean(p.isBestseller);

    modalTitle.textContent = 'Edit Creation: ' + p.title;
    modal.classList.add('active');
  };

  // Global Delete Handler
  window.deleteProduct = async function (id) {
    if (!window.BlingStorage) return;
    const p = window.BlingStorage.getProductById(id);
    if (!p) return;

    if (confirm(`Are you sure you want to delete "${p.title}"?`)) {
      await window.BlingStorage.deleteProduct(id);
      showToast(`Deleted "${p.title}"`);
      renderDashboard(searchInput ? searchInput.value.trim().toLowerCase() : '');
      renderCountertopPOS();
    }
  };

  // Toast Notification helper
  function showToast(msg) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    if (toast && msgEl) {
      msgEl.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }
  }

  // Re-render when mutations occur remotely
  window.addEventListener('bling:catalog-updated', () => {
    renderDashboard(searchInput ? searchInput.value.trim().toLowerCase() : '');
    renderCountertopPOS(countertopSearchInput ? countertopSearchInput.value.trim().toLowerCase() : '');
  });
});
