/**
 * 💎 BLING BOUTIQUE — ADMIN PORTAL CONTROLLER
 * Full In-Browser CRUD (Add, Edit, Delete), Image Upload to Base64,
 * Factory Demo Reset, and JSON Export for GitHub Pages Deployments
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (window.BlingStorage) {
    await window.BlingStorage.init();
  }

  const tableBody = document.getElementById('admin-table-body');
  const searchInput = document.getElementById('admin-search-input');
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

  // Initial Render
  renderDashboard();

  // 1. Search filter in admin table
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderDashboard(searchInput.value.trim().toLowerCase());
    });
  }

  // 2. Open Add Modal
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

  // 3. Close Modal
  function closeModal() {
    modal.classList.remove('active');
  }
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if (btnCancelForm) btnCancelForm.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // 4. Handle Image URL input
  if (fImageUrl) {
    fImageUrl.addEventListener('input', (e) => {
      currentImageData = e.target.value;
      updateImagePreview(currentImageData);
    });
  }

  // 5. Handle Image File Upload (Base64 conversion)
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

  // 6. Handle Form Submit (Add or Edit)
  form.addEventListener('submit', (e) => {
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
      isBestseller: fIsBestseller.checked
    };

    if (fId.value) {
      // Edit
      window.BlingStorage.updateProduct(fId.value, payload);
      showToast('Creation updated successfully!');
    } else {
      // Add
      window.BlingStorage.addProduct(payload);
      showToast('New creation added to boutique catalogue!');
    }

    closeModal();
    renderDashboard(searchInput ? searchInput.value.trim().toLowerCase() : '');
  });

  // 7. Reset Demo Button
  if (btnResetDemo) {
    btnResetDemo.addEventListener('click', async () => {
      if (confirm('Reset catalogue back to factory 20+ item demo? Any custom test additions will be restored.')) {
        await window.BlingStorage.resetToDefault();
        showToast('Catalogue restored to factory demo state!');
        renderDashboard();
      }
    });
  }

  // 8. Export JSON Button
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      window.BlingStorage.exportJSON();
      showToast('Catalogue exported as JSON!');
    });
  }

  // Render Table & Metrics
  function renderDashboard(filterQuery = '') {
    if (!window.BlingStorage) return;
    const catalog = window.BlingStorage.getCatalog();

    // Update Stats
    const sTotal = document.getElementById('stat-total-products');
    const sNails = document.getElementById('stat-total-nails');
    const sNecklaces = document.getElementById('stat-total-necklaces');
    const sHair = document.getElementById('stat-total-hair');
    const sBestsellers = document.getElementById('stat-total-bestsellers');

    if (sTotal) sTotal.textContent = catalog.length;
    if (sNails) sNails.textContent = catalog.filter(p => p.category === 'nails').length;
    if (sNecklaces) sNecklaces.textContent = catalog.filter(p => p.category === 'necklaces').length;
    if (sHair) sHair.textContent = catalog.filter(p => p.category === 'hair').length;
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

      tableBody.innerHTML = items.map(p => `
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
            <div style="font-size: 0.8rem; font-weight: 600;">${p.style || '—'}</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">${p.occasion || '—'}</div>
          </td>
          <td>
            ${p.badge ? `<span style="font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-pill); background: var(--color-accent-light); color: var(--color-accent-hover);">${p.badge}</span>` : '—'}
            ${p.isBestseller ? `<span style="display: block; font-size: 0.65rem; color: #E11D48; font-weight: 700; margin-top: 2px;">★ Bestseller</span>` : ''}
          </td>
          <td>
            <div class="action-btn-group">
              <button class="btn-table-edit" onclick="editProduct('${p.id}')">Edit</button>
              <button class="btn-table-delete" onclick="deleteProduct('${p.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  }

  // Global Edit Handler
  window.editProduct = function(id) {
    if (!window.BlingStorage) return;
    const p = window.BlingStorage.getProductById(id);
    if (!p) return;

    fId.value = p.id;
    fTitle.value = p.title || '';
    fCategory.value = p.category || 'nails';
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
  window.deleteProduct = function(id) {
    if (!window.BlingStorage) return;
    const p = window.BlingStorage.getProductById(id);
    if (!p) return;

    if (confirm(`Are you sure you want to delete "${p.title}"?`)) {
      window.BlingStorage.deleteProduct(id);
      showToast(`Deleted "${p.title}"`);
      renderDashboard(searchInput ? searchInput.value.trim().toLowerCase() : '');
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
});
