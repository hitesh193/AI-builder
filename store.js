/**
 * Medroute State Store & Real-Time Engine
 * Handles persistent user state, cart, appointment bookings,
 * real-time Indian Postal Pincode resolution, and toast notifications.
 */

class MedrouteStore {
  constructor() {
    this.storageKey = 'medroute_state_v1';
    this.subscribers = [];
    this.state = this.loadState();
  }

  getDefaultState() {
    // Single source of truth for seed data lives in js/data.js (MEDROUTE_DATA.defaultState)
    return JSON.parse(JSON.stringify(MEDROUTE_DATA.defaultState));
  }

  loadState() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = { ...this.getDefaultState(), ...JSON.parse(stored) };
        const validCities = (typeof MEDROUTE_DATA !== 'undefined' && MEDROUTE_DATA.cities) 
          ? MEDROUTE_DATA.cities.map(c => c.id) 
          : [];
        if (validCities.length > 0 && !validCities.includes(parsed.selectedCity)) {
          parsed.selectedCity = 'ludhiana';
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not load stored state, using default.', e);
    }
    return this.getDefaultState();
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      this.notify();
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => cb(this.state));
  }

  // City Management
  setCity(cityId) {
    this.state.selectedCity = cityId;
    this.saveState();
  }

  // Real-Time Indian Postal Pincode Resolution
  async resolvePincode(pincode) {
    if (!/^\d{6}$/.test(pincode)) {
      return { success: false, message: 'Invalid 6-digit PIN code format.' };
    }
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data && data[0] && data[0].Status === 'Success') {
        const postOffice = data[0].PostOffice[0];
        return {
          success: true,
          locality: postOffice.Name,
          district: postOffice.District,
          state: postOffice.State
        };
      }
    } catch (e) {
      console.log('Postal API offline or blocked, resolving via master directory');
    }

    // Fallback lookup from master city directory
    for (const city of MEDROUTE_DATA.cities) {
      if (city.pincodes.includes(pincode)) {
        return {
          success: true,
          locality: city.name + ' Central',
          district: city.name,
          state: city.state
        };
      }
    }
    return { success: true, locality: 'Metropolitan Area', district: 'City Center', state: 'India' };
  }

  // Cart Management
  addToCart(item) {
    const existing = this.state.cart.find(i => i.id === item.id);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      this.state.cart.push({ ...item, qty: 1 });
    }
    this.saveState();
    this.showToast(`Added "${item.name}" to cart!`, 'success');
  }

  removeFromCart(itemId) {
    this.state.cart = this.state.cart.filter(i => i.id !== itemId);
    this.saveState();
    this.showToast('Item removed from cart.', 'info');
  }

  updateCartQty(itemId, delta) {
    const item = this.state.cart.find(i => i.id === itemId);
    if (item) {
      item.qty += delta;
      if (item.qty <= 0) {
        this.removeFromCart(itemId);
        return;
      }
      this.saveState();
    }
  }

  clearCart() {
    this.state.cart = [];
    this.saveState();
  }

  getCartTotals() {
    const isGold = this.state.user.isGoldMember;
    let subtotal = 0;
    this.state.cart.forEach(item => {
      const itemPrice = (isGold && item.goldPrice) ? item.goldPrice : item.price;
      subtotal += itemPrice * (item.qty || 1);
    });

    let discount = 0;
    if (this.state.appliedCoupon === 'MEDROUTE20') {
      discount = Math.round(subtotal * 0.20);
    }

    const deliveryFee = subtotal > 500 || isGold ? 0 : 49;
    const total = Math.max(0, subtotal - discount + deliveryFee);

    return {
      subtotal,
      discount,
      deliveryFee,
      total,
      itemCount: this.state.cart.reduce((sum, item) => sum + (item.qty || 1), 0)
    };
  }

  applyCoupon(code) {
    if (code.toUpperCase() === 'MEDROUTE20') {
      this.state.appliedCoupon = 'MEDROUTE20';
      this.saveState();
      this.showToast('Coupon MEDROUTE20 applied! 20% discount added.', 'success');
      return true;
    } else {
      this.showToast('Invalid coupon code. Try MEDROUTE20', 'error');
      return false;
    }
  }

  // Doctor Consultation Bookings
  bookConsultation(bookingData) {
    const bookingId = 'APT-' + Math.floor(10000 + Math.random() * 90000);
    const newBooking = {
      id: bookingId,
      ...bookingData,
      status: 'Confirmed'
    };
    this.state.bookings.unshift(newBooking);
    this.saveState();
    this.showToast(`Consultation successfully booked! (Booking ID: ${bookingId})`, 'success');
    return newBooking;
  }

  // Medroute Gold Activation
  activateGold(plan) {
    this.state.user.isGoldMember = true;
    this.state.user.goldPlan = plan;
    this.saveState();
    this.showToast(`Congratulations! Medroute Gold (${plan.name}) is now active. All consultations are now ₹0!`, 'success');
  }

  // Toast Notifications
  showToast(message, type = 'info') {
    let container = document.getElementById('medroute-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'medroute-toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-rose-600 text-white',
      info: 'bg-slate-900 text-white',
      gold: 'bg-amber-600 text-white'
    };

    toast.className = `p-4 rounded-xl shadow-2xl flex items-center justify-between text-sm font-medium transform transition-all duration-300 pointer-events-auto translate-y-3 opacity-0 ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-base">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span>${message}</span>
      </div>
      <button onclick="this.parentElement.remove()" class="ml-3 opacity-75 hover:opacity-100 text-base">✕</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-3', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
}

// Global store instance
const store = new MedrouteStore();
