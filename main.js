/**
 * Medroute Healthcare Super-App - Global Client Controller
 * Powers universal search, slide-over cart drawer, city & live pincode resolver,
 * app download SMS/QR triggers, and appointment/video consultation simulations.
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbarState();
  initCartDrawer();
  initSearchAutocomplete();
  initPincodeLookup();
  initAppDownloadSMS();
  subscribeStoreUpdates();
});

// Subscribe to store updates to sync Cart badges and User status
function subscribeStoreUpdates() {
  store.subscribe(state => {
    updateCartBadges(state);
    updateUserNav(state);
  });
  updateCartBadges(store.state);
  updateUserNav(store.state);
}

function updateCartBadges(state) {
  const count = state.cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  document.querySelectorAll('.cart-badge').forEach(badge => {
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  });
}

function updateUserNav(state) {
  const goldBadges = document.querySelectorAll('.gold-status-indicator');
  goldBadges.forEach(b => {
    b.innerHTML = '';
  });

  const cityLabel = document.getElementById('selected-city-label');
  if (cityLabel) {
    const currentCity = MEDROUTE_DATA.cities.find(c => c.id === state.selectedCity);
    if (currentCity) cityLabel.textContent = currentCity.name;
  }
}

// Universal Search Autocomplete
function initSearchAutocomplete() {
  const searchInputs = document.querySelectorAll('.universal-search-input');
  searchInputs.forEach(input => {
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 hidden max-h-96 overflow-y-auto';
    input.parentElement.classList.add('relative');
    input.parentElement.appendChild(resultsContainer);

    input.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (q.length < 2) {
        resultsContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';
        return;
      }

      const matches = [];

      // Search Doctors
      MEDROUTE_DATA.doctors.forEach(doc => {
        if (doc.name.toLowerCase().includes(q) || doc.specialty.toLowerCase().includes(q) || doc.hospital.toLowerCase().includes(q)) {
          matches.push({
            type: 'Doctor',
            title: doc.name,
            subtitle: `${doc.specialty} (${doc.hospital})`,
            link: `/consult.html?doc=${doc.id}`,
            icon: '👨‍⚕️'
          });
        }
      });

      // Search Lab Tests
      MEDROUTE_DATA.labPackages.forEach(pkg => {
        if (pkg.name.toLowerCase().includes(q) || pkg.desc.toLowerCase().includes(q)) {
          matches.push({
            type: 'Health Checkup',
            title: pkg.name,
            subtitle: `${pkg.testsCount} Tests included • ₹${pkg.price}`,
            link: `/lab-tests.html#${pkg.id}`,
            icon: '🧪'
          });
        }
      });
      MEDROUTE_DATA.individualTests.forEach(t => {
        if (t.name.toLowerCase().includes(q)) {
          matches.push({
            type: 'Lab Test',
            title: t.name,
            subtitle: `Report in ${t.turnaround} • ₹${t.price}`,
            link: `/lab-tests.html`,
            icon: '🔬'
          });
        }
      });

      // Search Medicines
      MEDROUTE_DATA.medicines.forEach(m => {
        if (m.name.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)) {
          matches.push({
            type: 'Medicine',
            title: m.name,
            subtitle: `${m.generic} • ₹${m.price}`,
            link: `/pharmacy.html#${m.id}`,
            icon: '💊'
          });
        }
      });

      // Search Surgeries
      MEDROUTE_DATA.surgeries.forEach(s => {
        if (s.name.toLowerCase().includes(q) || s.clinicalTerm.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)) {
          matches.push({
            type: 'Surgery Care',
            title: s.name,
            subtitle: `${s.clinicalTerm} • EMI ₹${s.monthlyEmi}/mo`,
            link: `/surgeries.html#${s.id}`,
            icon: '🏥'
          });
        }
      });

      // Search Hospitals
      MEDROUTE_DATA.hospitals.forEach(h => {
        if (h.name.toLowerCase().includes(q) || h.branch.toLowerCase().includes(q) || h.address.toLowerCase().includes(q)) {
          matches.push({
            type: 'Hospital',
            title: `${h.name} - ${h.branch}`,
            subtitle: `${h.address} • Cashless Empaneled`,
            link: `/insurance.html#hospitals`,
            icon: '🏢'
          });
        }
      });

      if (matches.length === 0) {
        resultsContainer.innerHTML = `
          <div class="p-4 text-center text-sm text-slate-500">
            No exact matches found for "<span class="font-semibold text-slate-700">${e.target.value}</span>".<br>
            <a href="consult.html" class="text-teal-600 font-bold hover:underline mt-1 inline-block">Consult a Doctor</a> or 
            <a href="lab-tests.html" class="text-teal-600 font-bold hover:underline inline-block">View All Tests</a>
          </div>
        `;
      } else {
        resultsContainer.innerHTML = `
          <div class="p-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            Found ${matches.length} matching health services
          </div>
          ${matches.slice(0, 8).map(m => `
            <a href="${m.link}" class="flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition">
              <span class="text-xl">${m.icon}</span>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold text-slate-800">${m.title}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">${m.type}</span>
                </div>
                <p class="text-xs text-slate-500 truncate">${m.subtitle}</p>
              </div>
            </a>
          `).join('')}
        `;
      }

      resultsContainer.classList.remove('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!input.parentElement.contains(e.target)) {
        resultsContainer.classList.add('hidden');
      }
    });
  });
}

// Slide-Over Cart Drawer
function initCartDrawer() {
  let drawer = document.getElementById('medroute-cart-drawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'medroute-cart-drawer';
    drawer.className = 'fixed inset-0 z-50 overflow-hidden hidden';
    drawer.innerHTML = `
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity drawer-backdrop"></div>
      <div class="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300 drawer-panel">
        <!-- Header -->
        <div class="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div class="flex items-center gap-2">
            <span class="text-xl">🛒</span>
            <h3 class="font-bold text-lg text-slate-800">Your Healthcare Cart</h3>
          </div>
          <button onclick="toggleCartDrawer(false)" class="text-slate-400 hover:text-slate-700 text-2xl font-bold">✕</button>
        </div>

        <!-- Items List -->
        <div id="cart-drawer-items" class="flex-1 overflow-y-auto p-5 space-y-4">
          <!-- Dynamic Cart Items -->
        </div>

        <!-- Footer / Checkout -->
        <div id="cart-drawer-footer" class="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
          <!-- Dynamic Totals -->
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    drawer.querySelector('.drawer-backdrop').addEventListener('click', () => toggleCartDrawer(false));
  }

  // Attach toggle to all cart buttons
  document.querySelectorAll('.open-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleCartDrawer(true);
    });
  });
}

function toggleCartDrawer(open) {
  const drawer = document.getElementById('medroute-cart-drawer');
  if (!drawer) return;
  const panel = drawer.querySelector('.drawer-panel');

  if (open) {
    renderCartDrawer();
    drawer.classList.remove('hidden');
    requestAnimationFrame(() => {
      panel.classList.remove('translate-x-full');
    });
  } else {
    panel.classList.add('translate-x-full');
    setTimeout(() => {
      drawer.classList.add('hidden');
    }, 300);
  }
}

function renderCartDrawer() {
  const itemsContainer = document.getElementById('cart-drawer-items');
  const footerContainer = document.getElementById('cart-drawer-footer');
  if (!itemsContainer || !footerContainer) return;

  const items = store.state.cart;
  const isGold = store.state.user.isGoldMember;
  const totals = store.getCartTotals();

  if (items.length === 0) {
    itemsContainer.innerHTML = `
      <div class="py-16 text-center text-slate-400">
        <div class="text-5xl mb-3">🧺</div>
        <p class="font-bold text-slate-700 text-base">Your cart is currently empty</p>
        <p class="text-xs text-slate-400 mt-1">Book lab tests, full body checkups, or order genuine medicines.</p>
        <div class="mt-6 flex flex-col gap-2">
          <a href="lab-tests.html" onclick="toggleCartDrawer(false)" class="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-teal-700">Explore Lab Packages</a>
          <a href="pharmacy.html" onclick="toggleCartDrawer(false)" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200">Order Medicines</a>
        </div>
      </div>
    `;
    footerContainer.innerHTML = '';
    return;
  }

  itemsContainer.innerHTML = items.map(item => {
    const itemPrice = (isGold && item.goldPrice) ? item.goldPrice : item.price;
    return `
      <div class="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <img src="${item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=100&q=80'}" class="w-14 h-14 object-cover rounded-lg border border-slate-100" />
        <div class="flex-1">
          <h4 class="text-xs font-bold text-slate-800 line-clamp-1">${item.name}</h4>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-sm font-extrabold text-slate-900">₹${itemPrice * (item.qty || 1)}</span>
            ${isGold && item.goldPrice ? '<span class="text-2xs bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">Gold Price</span>' : ''}
          </div>
          <div class="flex items-center gap-2 mt-2">
            <button onclick="store.updateCartQty('${item.id}', -1); renderCartDrawer();" class="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center">-</button>
            <span class="text-xs font-bold px-1">${item.qty || 1}</span>
            <button onclick="store.updateCartQty('${item.id}', 1); renderCartDrawer();" class="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center">+</button>
            <button onclick="store.removeFromCart('${item.id}'); renderCartDrawer();" class="ml-auto text-xs text-rose-500 hover:underline">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  footerContainer.innerHTML = `
    <!-- Coupon code box -->
    <div class="flex gap-2">
      <input type="text" id="cart-coupon-input" placeholder="Enter coupon (e.g. MEDROUTE20)" value="${store.state.appliedCoupon || ''}" class="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg uppercase font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500" />
      <button onclick="applyCartCoupon()" class="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition">Apply</button>
    </div>

    <!-- Summary rows -->
    <div class="space-y-1.5 text-xs text-slate-600 border-t border-slate-200 pt-3">
      <div class="flex justify-between">
        <span>Item Total (${totals.itemCount} items)</span>
        <span class="font-semibold text-slate-800">₹${totals.subtotal}</span>
      </div>
      ${totals.discount > 0 ? `
        <div class="flex justify-between text-emerald-600 font-semibold">
          <span>Coupon Discount (20%)</span>
          <span>- ₹${totals.discount}</span>
        </div>
      ` : ''}
      <div class="flex justify-between">
        <span>Sample Pickup / Delivery</span>
        <span class="font-semibold ${totals.deliveryFee === 0 ? 'text-emerald-600' : 'text-slate-800'}">
          ${totals.deliveryFee === 0 ? 'FREE' : '₹' + totals.deliveryFee}
        </span>
      </div>
      <div class="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-200 pt-2">
        <span>To Pay:</span>
        <span class="text-teal-700">₹${totals.total}</span>
      </div>
    </div>

    <!-- Checkout CTA -->
    <button onclick="simulateOrderCheckout()" class="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2">
      <span>Proceed to Cashless Checkout</span>
      <span>→</span>
    </button>
  `;
}

function applyCartCoupon() {
  const input = document.getElementById('cart-coupon-input');
  if (input) {
    store.applyCoupon(input.value.trim());
    renderCartDrawer();
  }
}

function simulateOrderCheckout() {
  const totals = store.getCartTotals();
  const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
  
  const newOrder = {
    id: orderId,
    items: store.state.cart.map(i => `${i.name} (x${i.qty || 1})`),
    total: totals.total,
    status: 'Confirmed & Order Placed',
    expected: 'Within 24 Hours',
    address: 'Delivery address confirmed for ' + store.state.selectedCity.toUpperCase()
  };

  store.state.orders.unshift(newOrder);
  store.clearCart();
  toggleCartDrawer(false);
  store.showToast(`Order #${orderId} successfully placed! Sample collection / delivery scheduled.`, 'success');
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1200);
}

// Live Indian Pincode Resolver & City Modal
function initPincodeLookup() {
  const cityBtn = document.getElementById('city-selector-btn');
  if (cityBtn) {
    cityBtn.addEventListener('click', openCityModal);
  }
}

function openCityModal() {
  let modal = document.getElementById('city-selector-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'city-selector-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden p-6 animate-slide-down border border-slate-100">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 class="font-bold text-base text-slate-900 flex items-center gap-1.5">
            <span>📍</span> Select Punjab District & Location
          </h3>
          <p class="text-xs text-slate-500">Find doctors, surgery care, and verified hospitals near you across Punjab</p>
        </div>
        <button onclick="document.getElementById('city-selector-modal').remove()" class="text-slate-400 hover:text-slate-700 text-xl font-bold">✕</button>
      </div>

      <!-- Real-Time Punjab Pincode Input -->
      <div class="mt-4">
        <label class="block text-xs font-bold text-slate-700 mb-1">Enter 6-digit Indian / Punjab PIN Code for Live Detection:</label>
        <div class="flex gap-2">
          <input type="text" id="live-pincode-input" placeholder="e.g. 141001 (Ludhiana), 143001 (Amritsar), 151001 (Bathinda)" maxlength="6" class="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold" />
          <button onclick="handleLivePincodeLookup()" class="px-5 py-2 bg-medteal hover:bg-medtealDark text-white rounded-xl text-xs font-bold transition">Locate</button>
        </div>
        <div id="pincode-result-msg" class="text-xs mt-2 text-slate-500"></div>
      </div>

      <!-- Punjab Districts Section -->
      <div class="mt-5">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-extrabold uppercase tracking-wider text-slate-500">Punjab Healthcare Hubs (24 Districts)</span>
          <span class="text-2xs text-medteal font-bold">State: Punjab</span>
        </div>

        <!-- Quick Search Filter for Districts -->
        <div class="mb-3">
          <input type="text" id="district-search-input" oninput="filterPunjabDistrictsModal()" placeholder="🔍 Quick search district (e.g. Ludhiana, Bathinda, Mohali, Patiala)..." class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-medteal font-medium" />
        </div>

        <div id="punjab-districts-grid" class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
          ${MEDROUTE_DATA.cities.map(c => `
            <button onclick="store.setCity('${c.id}'); document.getElementById('city-selector-modal').remove(); store.showToast('Location updated to ${c.name}, Punjab', 'info');" data-district-name="${c.name.toLowerCase()}" class="district-btn p-2.5 text-left border rounded-xl hover:border-medteal hover:bg-teal-50/50 transition ${store.state.selectedCity === c.id ? 'border-medteal bg-teal-50 font-bold text-teal-900 ring-2 ring-medteal/20' : 'border-slate-200 text-slate-700 bg-white'}">
              <div class="text-xs font-bold text-slate-900 truncate">${c.name}</div>
              <div class="text-2xs text-medteal font-semibold">📍 Punjab</div>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function filterPunjabDistrictsModal() {
  const query = (document.getElementById('district-search-input')?.value || '').trim().toLowerCase();
  const buttons = document.querySelectorAll('.district-btn');
  buttons.forEach(btn => {
    const name = btn.getAttribute('data-district-name') || '';
    if (!query || name.includes(query)) {
      btn.style.display = '';
    } else {
      btn.style.display = 'none';
    }
  });
}

async function handleLivePincodeLookup() {
  const input = document.getElementById('live-pincode-input');
  const msgBox = document.getElementById('pincode-result-msg');
  if (!input || !msgBox) return;

  const pin = input.value.trim();
  msgBox.innerHTML = '<span class="text-teal-600 font-medium">Querying Official Indian Postal API in real time...</span>';

  const res = await store.resolvePincode(pin);
  if (res.success) {
    msgBox.innerHTML = `
      <div class="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
        ✓ <strong>Detected:</strong> ${res.locality}, ${res.district}, ${res.state}<br>
        <span class="text-2xs text-emerald-600">Empaneled with nearest Punjab Healthcare network centers & verified hospitals.</span>
      </div>
    `;
    setTimeout(() => {
      document.getElementById('city-selector-modal')?.remove();
      store.showToast(`Location set to ${res.locality} (${pin})`, 'success');
    }, 1200);
  } else {
    msgBox.innerHTML = `<span class="text-rose-600 font-semibold">${res.message}</span>`;
  }
}

// App Download SMS Trigger (MediBuddy feature)
function initAppDownloadSMS() {
  document.querySelectorAll('.app-sms-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const container = btn.closest('.app-sms-container') || btn.parentElement;
      const input = container.querySelector('.app-sms-input');
      const phone = input ? input.value.trim() : '';

      if (!phone || phone.length < 10) {
        store.showToast('Please enter a valid 10-digit mobile number.', 'error');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Sending...';

      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'Send Link';
        if (input) input.value = '';
        store.showToast(`SMS sent to ${phone}! Tap the link in your message to install Medroute directly.`, 'success');
      }, 800);
    });
  });
}

// Interactive Doctor Video Consultation Instant Call simulation
function startInstantVideoConsult(docName = 'Dr. Rajesh Sharma', specialty = 'Senior Physician') {
  let modal = document.getElementById('instant-call-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'instant-call-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 text-center animate-slide-down">
      <div class="w-20 h-20 mx-auto rounded-full bg-teal-500/20 flex items-center justify-center text-3xl mb-4 pulse-glow text-teal-400">
        🩺
      </div>
      <h3 class="text-xl font-bold">Connecting to ${docName}</h3>
      <p class="text-sm text-teal-400 mt-1">${specialty} • Video Consultation Room</p>
      
      <div class="my-6 p-4 rounded-2xl bg-slate-800 border border-slate-700 text-left space-y-2 text-xs text-slate-300">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>End-to-End HIPAA Encrypted Telemedicine Session</span>
        </div>
        <div class="flex items-center gap-2">
          <span>📹</span>
          <span>Microphone & HD Video: Ready</span>
        </div>
        <div class="flex items-center gap-2">
          <span>⚡</span>
          <span>Consultation Fee: ${store.state.user.isGoldMember ? '₹0 (Medroute Gold Member)' : '₹650'}</span>
        </div>
      </div>

      <div class="flex items-center justify-center gap-3">
        <button onclick="document.getElementById('instant-call-modal').remove()" class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition flex items-center gap-2">
          <span>End Call</span>
        </button>
        <button onclick="store.showToast('Doctor connected! High definition video session active.', 'success'); document.getElementById('instant-call-modal').remove(); window.location.href='dashboard.html';" class="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-slate-900 transition flex items-center gap-2">
          <span>Enter Video Room</span>
          <span>→</span>
        </button>
      </div>
    </div>
  `;
}

// Helper to open QR code enlarged modal
function expandAppQrModal() {
  let modal = document.getElementById('qr-expand-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'qr-expand-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center animate-slide-down border border-slate-100">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-slate-900 text-base">Scan to Install Medroute</h3>
        <button onclick="document.getElementById('qr-expand-modal').remove()" class="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
      </div>
      
      <!-- High-res vector QR code representation -->
      <div class="p-4 bg-slate-50 border-2 border-dashed border-teal-500/40 rounded-2xl inline-block shadow-inner">
        <svg viewBox="0 0 120 120" class="w-48 h-48 mx-auto" fill="#1b3b6f">
          <path d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M22,22 h6 v6 h-6 z M80,10 h30 v30 h-30 z M85,15 v20 h20 v-20 z M92,22 h6 v6 h-6 z M10,80 h30 v30 h-30 z M15,85 v20 h20 v-20 z M22,92 h6 v6 h-6 z M50,15 h20 v10 h-20 z M50,35 h10 v20 h-10 z M70,35 h10 v10 h-10 z M50,65 h10 v15 h-10 z M70,60 h20 v10 h-20 z M95,50 h15 v20 h-15 z M50,90 h20 v20 h-20 z M80,85 h10 v25 h-10 z M100,85 h10 v25 h-10 z" />
        </svg>
      </div>

      <p class="text-xs text-slate-500 mt-4 leading-relaxed">
        Point your phone camera at this QR code to launch Medroute PWA. Prompt <strong>"Add to Home Screen"</strong> to install the full mobile app.
      </p>

      <div class="mt-4 flex justify-center gap-2">
        <span class="text-2xs bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-semibold">✓ Android (Chrome)</span>
        <span class="text-2xs bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-semibold">✓ iOS (Safari)</span>
      </div>
    </div>
  `;
}

function initNavbarState() {
  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const mobileMenu = document.getElementById('mobile-nav-menu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}
