/**
 * 💎 BLING BOUTIQUE — SIZING GUIDE & SHAPE VISUALIZER SCRIPT
 */

const SHAPES_DATA = {
  Almond: {
    title: 'Almond Shape (Medium / Long)',
    desc: 'Tapers into a soft, rounded peak. Universally flattering shape that visually elongates shorter nail beds and provides a graceful, feminine silhouette for everyday wear and weddings.',
    badge: 'Most Popular'
  },
  Coffin: {
    title: 'Coffin / Ballerina Shape (Long)',
    desc: 'Edges taper gently inward with a sharp flat squared tip. A red-carpet favorite that offers ample surface area for intricate 3D porcelain flowers and crystal embellishments.',
    badge: 'Statement Glam'
  },
  Stiletto: {
    title: 'Stiletto Shape (Long / Drama)',
    desc: 'Dramatic sharp point that creates maximum visual length and fierce presence. Perfect for editorial photoshoots, sangeet parties, and festival occasions.',
    badge: 'High Fashion'
  },
  Square: {
    title: 'Classic Square Shape (Short / Medium)',
    desc: 'Straight parallel sidewalls with clean flat edges. Modern, clean, and provides maximum structural strength for busy typing and active daily routines.',
    badge: 'Daily Favorite'
  },
  Oval: {
    title: 'Natural Oval Shape (Short / Medium)',
    desc: 'Curved edges following the natural contour of your cuticle. A soft timeless shape that resists snagging on fabrics and ensures effortless comfort.',
    badge: 'Timeless Classic'
  }
};

const SIZE_PRESETS = {
  XS: [14, 11, 12, 10, 8],
  S:  [15, 12, 13, 11, 8],
  M:  [16, 12, 14, 12, 9],
  L:  [18, 13, 15, 13, 10]
};

document.addEventListener('DOMContentLoaded', () => {
  let activeShape = 'Almond';
  let activePreset = 'S';

  const thumbInput = document.getElementById('mm-thumb');
  const indexInput = document.getElementById('mm-index');
  const middleInput = document.getElementById('mm-middle');
  const ringInput = document.getElementById('mm-ring');
  const pinkyInput = document.getElementById('mm-pinky');

  // 1. Shape selection
  const shapeBtns = document.querySelectorAll('.shape-btn');
  const shapeTitle = document.getElementById('shape-info-title');
  const shapeDesc = document.getElementById('shape-info-desc');

  shapeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      shapeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeShape = btn.dataset.shape;
      
      const data = SHAPES_DATA[activeShape];
      if (data) {
        if (shapeTitle) shapeTitle.textContent = data.title;
        if (shapeDesc) shapeDesc.textContent = data.desc;
      }
    });
  });

  // 2. Preset Pills
  const presetPills = document.querySelectorAll('#preset-pills .size-pill');
  presetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      presetPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activePreset = pill.dataset.preset;

      if (SIZE_PRESETS[activePreset]) {
        const [t, i, m, r, p] = SIZE_PRESETS[activePreset];
        if (thumbInput) thumbInput.value = t;
        if (indexInput) indexInput.value = i;
        if (middleInput) middleInput.value = m;
        if (ringInput) ringInput.value = r;
        if (pinkyInput) pinkyInput.value = p;
      }
    });
  });

  // 3. User manual input changes preset to 'Custom'
  [thumbInput, indexInput, middleInput, ringInput, pinkyInput].forEach(inp => {
    if (inp) {
      inp.addEventListener('input', () => {
        presetPills.forEach(p => p.classList.toggle('active', p.dataset.preset === 'Custom'));
        activePreset = 'Custom';
      });
    }
  });

  // 4. WhatsApp Sizing Link Trigger
  const waBtn = document.getElementById('send-sizing-wa-btn');
  if (waBtn) {
    waBtn.addEventListener('click', () => {
      const t = thumbInput ? thumbInput.value : '15';
      const i = indexInput ? indexInput.value : '12';
      const m = middleInput ? middleInput.value : '13';
      const r = ringInput ? ringInput.value : '11';
      const p = pinkyInput ? pinkyInput.value : '8';

      const message = `Hi Poonam! Here are my custom sizing details for a Bling Press-On Nail Set:\n\n` +
                      `✨ *Selected Shape:* ${activeShape}\n` +
                      `📏 *Size Profile:* ${activePreset}\n` +
                      `• Thumb: ${t} mm\n` +
                      `• Index: ${i} mm\n` +
                      `• Middle: ${m} mm\n` +
                      `• Ring: ${r} mm\n` +
                      `• Pinky: ${p} mm\n\n` +
                      `Could you please suggest available designs or confirm custom quote for these measurements?`;

      const url = `https://wa.me/919284557339?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    });
  }
});
