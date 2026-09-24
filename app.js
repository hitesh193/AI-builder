/**
 * Medroute Main Application Controller
 * Handles Navigation, Search, Booking Wizard, Queue Tracker, Telemedicine, SOS Dispatch & Modals
 */

const MEDROUTE_APP = {
  activeSection: 'home',
  currentDoctorFilter: 'all',
  currentLanguage: 'en',
  fontSizeLevel: 'md',

  init() {
    this.setupTheme();
    this.renderDepartments();
    this.renderDoctors();
    this.renderDiagnosticTests();
    this.renderHealthPackages();
    this.renderInsuranceProviders();
    this.renderBloodBank();
    this.renderFAQs();
    this.setupQueueTracker();
    this.setupCostEstimator();

    // Initialize submodules
    if (window.MEDROUTE_PORTAL) MEDROUTE_PORTAL.init();
    if (window.MEDROUTE_CHATBOT) MEDROUTE_CHATBOT.init();

    console.log("Medroute Healthcare Platform Initialized Successfully.");
  },

  // THEME & ACCESSIBILITY
  setupTheme() {
    const isDark = localStorage.getItem('medroute_theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  },

  toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('medroute_theme', isDark ? 'dark' : 'light');
    this.showNotification(`Switched to ${isDark ? 'Dark' : 'Light'} Mode`, 'info');
  },

  setFontSize(size) {
    document.documentElement.classList.remove('font-sm', 'font-md', 'font-lg', 'font-xl');
    document.documentElement.classList.add(`font-${size}`);
    this.fontSizeLevel = size;
    this.showNotification(`Text size adjusted to ${size.toUpperCase()}`, 'info');
  },

  toggleLanguage(lang) {
    this.currentLanguage = lang;
    const names = { en: "English", es: "Español", hi: "हिन्दी" };
    this.showNotification(`Language switched to ${names[lang] || lang}`, 'info');
  },

  // NOTIFICATION TOAST
  showNotification(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    if (!toast) return;

    const colors = {
      success: { bg: 'bg-emerald-600', icon: 'fa-circle-check' },
      info: { bg: 'bg-sky-600', icon: 'fa-circle-info' },
      warning: { bg: 'bg-amber-600', icon: 'fa-triangle-exclamation' },
      danger: { bg: 'bg-rose-600', icon: 'fa-triangle-exclamation' }
    };

    const cfg = colors[type] || colors.info;
    toast.className = `fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl text-white shadow-2xl flex items-center gap-3 transition-all duration-300 ${cfg.bg}`;
    toastIcon.className = `fa-solid ${cfg.icon}`;
    toastMsg.textContent = message;

    toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');

    setTimeout(() => {
      toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
    }, 3800);
  },

  // SMOOTH SCROLL
  scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  },

  // GLOBAL SEARCH (Doctors, Tests, Symptoms, Departments)
  handleGlobalSearch(query) {
    const q = query.trim().toLowerCase();
    const resultsContainer = document.getElementById('globalSearchResults');
    if (!resultsContainer) return;

    if (!q || q.length < 2) {
      resultsContainer.classList.add('hidden');
      return;
    }

    // Match departments
    const matchedDepts = MEDROUTE_DATA.departments.filter(d => 
      d.name.toLowerCase().includes(q) || d.symptoms.some(s => s.toLowerCase().includes(q))
    );

    // Match doctors
    const matchedDocs = MEDROUTE_DATA.doctors.filter(d =>
      d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q) || d.languages.some(l => l.toLowerCase().includes(q))
    );

    // Match tests
    const matchedTests = MEDROUTE_DATA.diagnosticTests.filter(t =>
      t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    );

    let html = '';

    if (matchedDocs.length > 0) {
      html += `<div class="p-2 border-b border-slate-100 dark:border-slate-700">
        <span class="text-[10px] uppercase font-bold text-slate-400 px-2">Doctors & Specialists</span>
        <div class="mt-1 space-y-1">
          ${matchedDocs.slice(0, 3).map(doc => `
            <div onclick="MEDROUTE_APP.prefillBooking('${doc.id}'); MEDROUTE_APP.clearSearch();" class="p-2 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <img src="${doc.photo}" class="w-7 h-7 rounded-full object-cover">
                <div>
                  <p class="font-bold text-slate-800 dark:text-white">${doc.name}</p>
                  <p class="text-[11px] text-slate-500">${doc.specialty}</p>
                </div>
              </div>
              <span class="text-sky-600 font-semibold">$${doc.fee}</span>
            </div>
          `).join('')}
        </div>
      </div>`;
    }

    if (matchedDepts.length > 0) {
      html += `<div class="p-2 border-b border-slate-100 dark:border-slate-700">
        <span class="text-[10px] uppercase font-bold text-slate-400 px-2">Clinical Departments</span>
        <div class="mt-1 space-y-1">
          ${matchedDepts.slice(0, 2).map(dept => `
            <div onclick="MEDROUTE_APP.filterDoctorsByDept('${dept.id}'); MEDROUTE_APP.scrollToSection('doctorsSection'); MEDROUTE_APP.clearSearch();" class="p-2 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2 text-xs">
              <i class="fa-solid ${dept.icon} text-sky-600 w-4 text-center"></i>
              <span class="font-medium text-slate-800 dark:text-white">${dept.name}</span>
            </div>
          `).join('')}
        </div>
      </div>`;
    }

    if (matchedTests.length > 0) {
      html += `<div class="p-2">
        <span class="text-[10px] uppercase font-bold text-slate-400 px-2">Diagnostic Tests</span>
        <div class="mt-1 space-y-1">
          ${matchedTests.slice(0, 2).map(test => `
            <div onclick="MEDROUTE_APP.scrollToSection('diagnosticsSection'); MEDROUTE_APP.clearSearch();" class="p-2 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between text-xs">
              <div>
                <p class="font-medium text-slate-800 dark:text-white">${test.name}</p>
                <p class="text-[10px] text-slate-400">${test.category}</p>
              </div>
              <span class="font-bold text-slate-700 dark:text-slate-300">$${test.price}</span>
            </div>
          `).join('')}
        </div>
      </div>`;
    }

    if (!html) {
      html = `<div class="p-4 text-center text-xs text-slate-500">
        No exact matches for "${query}". Try searching "Cardiology", "Knee", "Chest Pain", or "MRI".
      </div>`;
    }

    resultsContainer.innerHTML = html;
    resultsContainer.classList.remove('hidden');
  },

  clearSearch() {
    const input = document.getElementById('globalSearchInput');
    const container = document.getElementById('globalSearchResults');
    if (input) input.value = '';
    if (container) container.classList.add('hidden');
  },

  // RENDER DEPARTMENTS
  renderDepartments() {
    const container = document.getElementById('departmentsGrid');
    if (!container) return;

    container.innerHTML = MEDROUTE_DATA.departments.map(dept => `
      <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover-lift group cursor-pointer" onclick="MEDROUTE_APP.filterDoctorsByDept('${dept.id}'); MEDROUTE_APP.scrollToSection('doctorsSection');">
        <div class="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-slate-700 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xl mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors">
          <i class="fa-solid ${dept.icon}"></i>
        </div>
        <h4 class="font-bold text-slate-900 dark:text-white text-base mb-2 group-hover:text-sky-600 transition-colors">${dept.name}</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">${dept.description}</p>
        <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
          <span><i class="fa-solid fa-bed text-sky-500 mr-1"></i>${dept.beds} Beds</span>
          <span class="text-sky-600 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            Doctors <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </span>
        </div>
      </div>
    `).join('');
  },

  // RENDER DOCTORS & FILTERS
  renderDoctors() {
    const container = document.getElementById('doctorsGrid');
    if (!container) return;

    const filtered = this.currentDoctorFilter === 'all'
      ? MEDROUTE_DATA.doctors
      : MEDROUTE_DATA.doctors.filter(d => d.deptId === this.currentDoctorFilter);

    container.innerHTML = filtered.map(doc => `
      <div class="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 hover-lift flex flex-col justify-between">
        <div>
          <div class="relative h-56 overflow-hidden bg-slate-100 dark:bg-slate-700">
            <img src="${doc.photo}" alt="${doc.name}" class="w-full h-full object-cover">
            <span class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-900/90 text-amber-500 shadow-sm flex items-center gap-1">
              <i class="fa-solid fa-star"></i> ${doc.rating} <span class="text-slate-400 font-normal">(${doc.reviewsCount})</span>
            </span>
            <span class="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-sky-900/80 text-white backdrop-blur-sm">
              <i class="fa-solid fa-door-open mr-1"></i>${doc.roomNo}
            </span>
          </div>

          <div class="p-6">
            <h4 class="font-bold text-slate-900 dark:text-white text-lg">${doc.name}</h4>
            <p class="text-xs font-semibold text-sky-600 dark:text-sky-400 mt-0.5">${doc.specialty}</p>
            <p class="text-xs text-slate-500 mt-1">${doc.qualification}</p>
            
            <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2 text-[11px]">
              <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                <i class="fa-solid fa-briefcase text-sky-500 mr-1"></i>${doc.experience}
              </span>
              <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                <i class="fa-solid fa-language text-sky-500 mr-1"></i>${doc.languages.join(', ')}
              </span>
            </div>

            <div class="mt-3 text-xs text-slate-500">
              <span class="font-semibold text-slate-700 dark:text-slate-300">Days:</span> ${doc.availability.days.join(', ')}
            </div>
          </div>
        </div>

        <div class="p-6 pt-0">
          <div class="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 uppercase tracking-wider block">OPD Fee</span>
              <span class="text-xl font-bold text-slate-900 dark:text-white">$${doc.fee}</span>
            </div>
            <div class="flex gap-2">
              <button onclick="MEDROUTE_APP.viewDoctorBioModal('${doc.id}')" class="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200">
                Profile
              </button>
              <button onclick="MEDROUTE_APP.prefillBooking('${doc.id}')" class="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shadow-sm shadow-sky-500/20">
                <i class="fa-regular fa-calendar-check"></i> Book
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  filterDoctorsByDept(deptId) {
    this.currentDoctorFilter = deptId;
    const buttons = document.querySelectorAll('.dept-filter-btn');
    buttons.forEach(btn => {
      if (btn.dataset.dept === deptId) {
        btn.className = "dept-filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white shadow-sm";
      } else {
        btn.className = "dept-filter-btn px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200";
      }
    });
    this.renderDoctors();
  },

  viewDoctorBioModal(docId) {
    const doc = MEDROUTE_DATA.doctors.find(d => d.id === docId);
    if (!doc) return;

    const modalArea = document.getElementById("genericModalContainer");
    modalArea.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
          <div class="flex items-start gap-4">
            <img src="${doc.photo}" class="w-20 h-20 rounded-2xl object-cover border-2 border-sky-500">
            <div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white">${doc.name}</h3>
              <p class="text-xs font-semibold text-sky-600 dark:text-sky-400">${doc.specialty}</p>
              <p class="text-xs text-slate-500 mt-1">${doc.qualification}</p>
              <div class="flex items-center gap-3 mt-2 text-xs">
                <span class="text-amber-500 font-bold"><i class="fa-solid fa-star"></i> ${doc.rating}</span>
                <span class="text-slate-400">•</span>
                <span class="text-slate-500 font-medium">${doc.experience}</span>
              </div>
            </div>
          </div>

          <div class="mt-6 space-y-4 text-xs">
            <div>
              <h5 class="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px]">About the Specialist</h5>
              <p class="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">${doc.bio}</p>
            </div>
            
            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 space-y-1.5">
              <p><span class="font-bold text-slate-700 dark:text-slate-200">OPD Suite:</span> ${doc.roomNo}</p>
              <p><span class="font-bold text-slate-700 dark:text-slate-200">Consultation Fee:</span> $${doc.fee}</p>
              <p><span class="font-bold text-slate-700 dark:text-slate-200">Languages:</span> ${doc.languages.join(', ')}</p>
              <p><span class="font-bold text-slate-700 dark:text-slate-200">Consulting Days:</span> ${doc.availability.days.join(', ')}</p>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
            <button onclick="document.getElementById('genericModalContainer').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              Close
            </button>
            <button onclick="MEDROUTE_APP.prefillBooking('${doc.id}'); document.getElementById('genericModalContainer').innerHTML='';" class="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-md">
              Book Consultation ($${doc.fee})
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // RENDER HEALTH PACKAGES
  renderHealthPackages() {
    const container = document.getElementById('healthPackagesGrid');
    if (!container) return;

    container.innerHTML = MEDROUTE_DATA.healthPackages.map(pkg => `
      <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover-lift">
        <div>
          <span class="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 mb-4">
            ${pkg.badge}
          </span>
          <h4 class="text-xl font-bold text-slate-900 dark:text-white mb-2">${pkg.name}</h4>
          <p class="text-xs text-slate-500 mb-4">${pkg.recommendedFor}</p>
          
          <div class="flex items-baseline gap-2 mb-6">
            <span class="text-3xl font-extrabold text-slate-900 dark:text-white">$${pkg.price}</span>
            <span class="text-xs text-slate-400 line-through">$${pkg.originalPrice}</span>
            <span class="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">Save ${Math.round((1 - pkg.price/pkg.originalPrice)*100)}%</span>
          </div>

          <div class="space-y-2 mb-6 text-xs text-slate-600 dark:text-slate-300">
            <p class="font-bold text-slate-900 dark:text-white mb-2"><i class="fa-solid fa-list-check text-sky-500 mr-1.5"></i> Includes ${pkg.testsCount} Essential Tests:</p>
            ${pkg.testsIncluded.map(test => `
              <div class="flex items-start gap-2">
                <i class="fa-solid fa-check text-emerald-500 text-xs mt-0.5"></i>
                <span class="leading-tight">${test}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <button onclick="MEDROUTE_APP.bookPackageModal('${pkg.id}')" class="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2">
          <i class="fa-solid fa-cart-plus"></i> Book Checkup Package
        </button>
      </div>
    `).join('');
  },

  // RENDER DIAGNOSTIC TESTS
  renderDiagnosticTests() {
    const container = document.getElementById('diagnosticsGrid');
    if (!container) return;

    container.innerHTML = MEDROUTE_DATA.diagnosticTests.map(test => `
      <div class="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover-lift">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              ${test.category}
            </span>
            <span class="text-base font-bold text-slate-900 dark:text-white">$${test.price}</span>
          </div>
          <h5 class="font-bold text-slate-900 dark:text-white text-sm mb-1">${test.name}</h5>
          <p class="text-xs text-slate-500 mb-3">${test.desc}</p>
          <div class="text-[11px] text-slate-400 space-y-1 mb-4">
            <p><i class="fa-solid fa-clock text-sky-500 mr-1"></i> Reports in: <strong class="text-slate-700 dark:text-slate-300">${test.turnaround}</strong></p>
            <p><i class="fa-solid fa-triangle-exclamation text-amber-500 mr-1"></i> ${test.fasting}</p>
          </div>
        </div>

        <button onclick="MEDROUTE_APP.scheduleDiagnosticTest('${test.id}')" class="w-full py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-slate-600 text-slate-800 dark:text-white flex items-center justify-center gap-1.5 transition-colors">
          <i class="fa-solid fa-calendar-plus text-sky-600"></i> Schedule Test / Home Sample
        </button>
      </div>
    `).join('');
  },

  // RENDER INSURANCE PROVIDERS
  renderInsuranceProviders() {
    const container = document.getElementById('insuranceGrid');
    if (!container) return;

    container.innerHTML = MEDROUTE_DATA.insuranceProviders.map(ins => `
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">${ins.name}</h5>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Cashless Approved</span>
          </div>
          <p class="text-[11px] text-slate-500 mt-1">${ins.type} • Pre-auth: ~${ins.approvalTime}</p>
        </div>
        <a href="tel:${ins.tollFree}" class="text-xs font-semibold text-sky-600 hover:underline flex items-center gap-1">
          <i class="fa-solid fa-phone text-xs"></i> Helpdesk
        </a>
      </div>
    `).join('');
  },

  // RENDER BLOOD BANK
  renderBloodBank() {
    const container = document.getElementById('bloodBankGrid');
    if (!container) return;

    container.innerHTML = MEDROUTE_DATA.bloodBank.map(item => `
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center hover-lift">
        <span class="text-2xl font-black text-rose-600 block mb-1">${item.group}</span>
        <span class="text-xs font-bold text-slate-800 dark:text-white">${item.units} Units</span>
        <div class="mt-2">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeClass}">
            ${item.status}
          </span>
        </div>
      </div>
    `).join('');
  },

  // RENDER FAQS
  renderFAQs() {
    const container = document.getElementById('faqsAccordion');
    if (!container) return;

    container.innerHTML = MEDROUTE_DATA.faqs.map((faq, idx) => `
      <div class="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
        <button onclick="MEDROUTE_APP.toggleFAQ(${idx})" class="w-full p-5 text-left font-bold text-slate-900 dark:text-white flex justify-between items-center text-sm">
          <span>${faq.q}</span>
          <i id="faqIcon-${idx}" class="fa-solid fa-chevron-down text-xs text-slate-400 transition-transform"></i>
        </button>
        <div id="faqContent-${idx}" class="hidden p-5 pt-0 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/60">
          ${faq.a}
        </div>
      </div>
    `).join('');
  },

  toggleFAQ(idx) {
    const content = document.getElementById(`faqContent-${idx}`);
    const icon = document.getElementById(`faqIcon-${idx}`);
    if (content) {
      const isHidden = content.classList.contains('hidden');
      content.classList.toggle('hidden');
      if (icon) {
        icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    }
  },

  // LIVE OPD QUEUE TRACKER
  currentServingToken: 24,
  userToken: 28,
  queueInterval: null,

  setupQueueTracker() {
    this.updateQueueDisplay();
    // Simulate real-time queue movement every 25 seconds
    if (!this.queueInterval) {
      this.queueInterval = setInterval(() => {
        if (this.currentServingToken < 45) {
          this.currentServingToken++;
          this.updateQueueDisplay();
        }
      }, 25000);
    }
  },

  updateQueueDisplay() {
    const servingEl = document.getElementById('queueServingToken');
    const userTokenEl = document.getElementById('queueUserToken');
    const waitTimeEl = document.getElementById('queueEstimatedWait');
    const progressBar = document.getElementById('queueProgressBar');

    if (servingEl) servingEl.textContent = `Token #${this.currentServingToken}`;
    if (userTokenEl) userTokenEl.textContent = `Token #${this.userToken}`;

    const diff = Math.max(0, this.userToken - this.currentServingToken);
    const estMinutes = diff * 7;

    if (waitTimeEl) {
      if (diff === 0) {
        waitTimeEl.textContent = "It's your turn! Please enter Consultation Room 201.";
        waitTimeEl.className = "text-sm font-bold text-emerald-600 animate-pulse";
      } else {
        waitTimeEl.textContent = `~${estMinutes} Mins (${diff} patient${diff > 1 ? 's' : ''} ahead)`;
        waitTimeEl.className = "text-sm font-bold text-sky-600";
      }
    }

    if (progressBar) {
      const progress = Math.min(100, Math.round(((40 - diff) / 40) * 100));
      progressBar.style.width = `${progress}%`;
    }
  },

  openQueueTracker(tokenString) {
    this.scrollToSection('queueSection');
    if (tokenString) {
      const num = parseInt(tokenString.replace(/\D/g, ''));
      if (!isNaN(num)) {
        this.userToken = num;
        this.updateQueueDisplay();
      }
    }
    this.showNotification(`Tracking Queue for ${tokenString || 'Your Token'}`, 'info');
  },

  // TREATMENT COST ESTIMATOR
  setupCostEstimator() {
    this.recalculateCost();
  },

  recalculateCost() {
    const procedureSelect = document.getElementById('costProcedureSelect');
    const roomSelect = document.getElementById('costRoomSelect');
    if (!procedureSelect || !roomSelect) return;

    const procedureId = procedureSelect.value;
    const roomType = roomSelect.value;

    const est = MEDROUTE_DATA.costEstimates.find(e => e.id === procedureId) || MEDROUTE_DATA.costEstimates[0];
    const roomRatePerDay = est.roomRates[roomType] || est.roomRates.general;
    const totalRoomCost = roomRatePerDay * est.avgStayDays;

    const totalEstimate = est.baseDoctorFee + est.otCharges + est.consumables + totalRoomCost;

    document.getElementById('costDoctorFee').textContent = `$${est.baseDoctorFee}`;
    document.getElementById('costOtCharges').textContent = `$${est.otCharges}`;
    document.getElementById('costConsumables').textContent = `$${est.consumables}`;
    document.getElementById('costRoomCharges').textContent = `$${totalRoomCost} (${est.avgStayDays} days)`;
    document.getElementById('costTotalEstimate').textContent = `$${totalEstimate}`;
    document.getElementById('costProcedureDesc').textContent = est.description;
  },

  // 1-CLICK SOS EMERGENCY DISPATCH
  openEmergencyModal() {
    const modalArea = document.getElementById("genericModalContainer");
    modalArea.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl border-2 border-rose-500 relative overflow-hidden">
          <div class="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-rose-500/10 pointer-events-none"></div>
          
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-2xl pulse-red">
              <i class="fa-solid fa-truck-medical"></i>
            </div>
            <div>
              <h3 class="text-xl font-black text-rose-600 uppercase tracking-tight">1-Click Emergency SOS</h3>
              <p class="text-xs text-slate-500">Instant Trauma Ambulance & Paramedic Dispatch</p>
            </div>
          </div>

          <p class="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            Medroute Trauma Command Center is connected to 18 GPS-monitored mobile intensive care ambulances with defibrillators and oxygen telemetry.
          </p>

          <div class="space-y-4 mb-6">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Your Pickup Location</label>
              <div class="flex gap-2">
                <input type="text" id="sosLocationInput" value="Fetching GPS Coordinates..." class="flex-grow px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none">
                <button onclick="MEDROUTE_APP.detectLocation()" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs hover:bg-slate-200">
                  <i class="fa-solid fa-location-crosshairs text-rose-600"></i>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Emergency Nature</label>
              <select id="sosEmergencyType" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs">
                <option value="cardiac">Severe Chest Pain / Suspected Heart Attack</option>
                <option value="stroke">Sudden Paralysis / Speech Loss (Stroke)</option>
                <option value="trauma">Accident / Deep Trauma Bleeding</option>
                <option value="respiratory">Severe Breathing Difficulty / Asthmatic</option>
                <option value="maternity">Active Maternity Labor / Water Broken</option>
                <option value="other">Other Unconscious Emergency</option>
              </select>
            </div>
          </div>

          <div class="space-y-3">
            <button onclick="MEDROUTE_APP.confirmAmbulanceDispatch()" class="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2">
              <i class="fa-solid fa-paper-plane"></i> DISPATCH NEAREST AMBULANCE NOW
            </button>
            <div class="flex justify-between items-center text-xs">
              <a href="tel:108" class="text-rose-600 font-bold hover:underline">
                <i class="fa-solid fa-phone"></i> Call Emergency Room Direct (108)
              </a>
              <button onclick="document.getElementById('genericModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
                Cancel
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    this.detectLocation();
  },

  detectLocation() {
    const input = document.getElementById("sosLocationInput");
    if (!input) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          input.value = `GPS: Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)} (Metro Sector 4)`;
        },
        () => {
          input.value = "450 Medroute Boulevard / Near 5th Ave (Default Zone)";
        },
        { timeout: 4000 }
      );
    } else {
      input.value = "450 Medroute Boulevard / Near 5th Ave (Default Zone)";
    }
  },

  confirmAmbulanceDispatch() {
    const location = document.getElementById("sosLocationInput")?.value || "Current Location";
    const modalArea = document.getElementById("genericModalContainer");

    modalArea.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl border-2 border-emerald-500 text-center">
          <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl mb-4 animate-bounce">
            <i class="fa-solid fa-truck-medical"></i>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
            Ambulance Dispatched & En Route
          </span>
          <h3 class="text-2xl font-black text-slate-900 dark:text-white mt-2 mb-1">Unit #MED-AMB-07</h3>
          <p class="text-xs text-slate-500 mb-6">Paramedic Crew: James Miller & Sarah Kelly (Advanced Cardiac Life Support)</p>

          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 text-left text-xs space-y-2 mb-6">
            <div class="flex justify-between">
              <span class="text-slate-500">Destination:</span>
              <span class="font-bold text-slate-800 dark:text-white">${location}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Estimated Arrival (ETA):</span>
              <span class="font-bold text-rose-600 text-sm">6 - 8 Minutes</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Live Paramedic Phone:</span>
              <a href="tel:5550199" class="font-bold text-sky-600 hover:underline">+1 (555) 019-9112</a>
            </div>
          </div>

          <div class="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-left text-[11px] text-amber-900 dark:text-amber-200 mb-6">
            <strong>Immediate Instructions:</strong> Keep patient calm and seated or lying down. Do not give solid foods or water. Ensure building entrance is unlocked for paramedics.
          </div>

          <button onclick="document.getElementById('genericModalContainer').innerHTML=''" class="w-full py-3 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-black text-white font-semibold text-xs transition-colors">
            Keep Window Open & Monitor
          </button>
        </div>
      </div>
    `;

    this.showNotification("🚨 Emergency Trauma Ambulance dispatched!", "danger");
  },

  // APPOINTMENT BOOKING WIZARD
  openBookingWizard(prefilledDocId = null) {
    const modalArea = document.getElementById("genericModalContainer");
    modalArea.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto">
          
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-6">
            <div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white">Book Doctor Consultation</h3>
              <p class="text-xs text-slate-500">Instant confirmation with queue token allocation</p>
            </div>
            <button onclick="document.getElementById('genericModalContainer').innerHTML=''" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-900 flex items-center justify-center">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form id="bookingWizardForm" onsubmit="MEDROUTE_APP.submitBooking(event)" class="space-y-4 text-xs">
            
            <!-- Consultation Mode -->
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2">1. Consultation Type</label>
              <div class="grid grid-cols-2 gap-3">
                <label class="p-3 rounded-xl border border-slate-300 dark:border-slate-600 flex items-center gap-2 cursor-pointer hover:border-sky-500 bg-sky-50/40 dark:bg-sky-950/20">
                  <input type="radio" name="consultType" value="In-Person Hospital Visit" checked class="text-sky-600">
                  <div>
                    <span class="font-bold text-slate-900 dark:text-white block">In-Person OPD Visit</span>
                    <span class="text-[10px] text-slate-400">At hospital clinic suite</span>
                  </div>
                </label>
                <label class="p-3 rounded-xl border border-slate-300 dark:border-slate-600 flex items-center gap-2 cursor-pointer hover:border-sky-500">
                  <input type="radio" name="consultType" value="Telemedicine Video Call" class="text-sky-600">
                  <div>
                    <span class="font-bold text-slate-900 dark:text-white block">Telemedicine Video</span>
                    <span class="text-[10px] text-slate-400">Join secure HD video room</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Doctor Selection -->
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1">2. Select Specialist / Doctor</label>
              <select id="bookDoctorSelect" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs">
                ${MEDROUTE_DATA.doctors.map(d => `
                  <option value="${d.id}" ${prefilledDocId === d.id ? 'selected' : ''}>
                    ${d.name} (${d.specialty} - $${d.fee})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Date and Time -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1">3. Preferred Date</label>
                <input type="date" id="bookDateInput" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs">
              </div>
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1">4. Preferred Slot</label>
                <select id="bookSlotSelect" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs">
                  <option value="09:00 AM">09:00 AM - Morning Slot</option>
                  <option value="10:30 AM" selected>10:30 AM - Morning Slot</option>
                  <option value="02:00 PM">02:00 PM - Afternoon Slot</option>
                  <option value="04:30 PM">04:30 PM - Evening Slot</option>
                  <option value="06:00 PM">06:00 PM - Evening Slot</option>
                </select>
              </div>
            </div>

            <!-- Patient Info -->
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 space-y-3">
              <label class="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">5. Patient Contact Information</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" id="bookPatientName" placeholder="Full Patient Name" value="Alex Morgan" required class="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs">
                <input type="tel" id="bookPatientPhone" placeholder="Mobile Number for SMS Reminders" value="+1 (555) 234-5678" required class="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs">
              </div>
              <input type="text" id="bookPatientReason" placeholder="Primary reason or symptom (e.g. routine checkup, knee ache)" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs">
            </div>

            <div class="pt-4 flex justify-end gap-3">
              <button type="button" onclick="document.getElementById('genericModalContainer').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                Cancel
              </button>
              <button type="submit" class="px-6 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-500/20 flex items-center gap-2">
                <i class="fa-solid fa-circle-check"></i> Confirm Appointment
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById("bookDateInput");
    if (dateInput) {
      dateInput.value = tomorrow.toISOString().split('T')[0];
      dateInput.min = new Date().toISOString().split('T')[0];
    }
  },

  prefillBooking(docId) {
    this.openBookingWizard(docId);
  },

  submitBooking(e) {
    e.preventDefault();
    const docId = document.getElementById("bookDoctorSelect").value;
    const doc = MEDROUTE_DATA.doctors.find(d => d.id === docId);
    const date = document.getElementById("bookDateInput").value;
    const slot = document.getElementById("bookSlotSelect").value;
    const patientName = document.getElementById("bookPatientName").value;
    const consultType = document.querySelector('input[name="consultType"]:checked')?.value || "In-Person";
    const token = `Token #${Math.floor(Math.random() * 20) + 30}`;

    // Add to patient demo appointments
    if (window.MEDROUTE_PORTAL && MEDROUTE_PORTAL.currentUser) {
      MEDROUTE_PORTAL.currentUser.appointments.unshift({
        id: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
        doctor: doc.name,
        dept: doc.specialty,
        date: `${date} at ${slot}`,
        type: consultType,
        status: "Confirmed",
        room: doc.roomNo,
        token: token
      });
    }

    const modalArea = document.getElementById("genericModalContainer");
    modalArea.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-700 text-center">
          <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl mb-4">
            <i class="fa-solid fa-check"></i>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Booking Confirmed</span>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mt-2 mb-1">You're All Set!</h3>
          <p class="text-xs text-slate-500 mb-6">Appointment confirmation sent via SMS & added to your Medroute Portal.</p>

          <div class="p-4 rounded-2xl bg-sky-50 dark:bg-slate-700/50 text-left text-xs space-y-2 mb-6">
            <div class="flex justify-between">
              <span class="text-slate-500">Doctor:</span>
              <span class="font-bold text-slate-800 dark:text-white">${doc.name}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Date & Slot:</span>
              <span class="font-bold text-slate-800 dark:text-white">${date} (${slot})</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Consultation Type:</span>
              <span class="font-bold text-sky-600">${consultType}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Clinic Suite:</span>
              <span class="font-bold text-slate-800 dark:text-white">${doc.roomNo}</span>
            </div>
            <div class="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
              <span class="text-slate-500">Your OPD Token:</span>
              <span class="font-black text-rose-600 font-mono text-sm">${token}</span>
            </div>
          </div>

          <div class="flex gap-2">
            <button onclick="document.getElementById('genericModalContainer').innerHTML=''" class="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200">
              Done
            </button>
            <button onclick="MEDROUTE_APP.openQueueTracker('${token}'); document.getElementById('genericModalContainer').innerHTML='';" class="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-sm">
              Track Wait Time
            </button>
          </div>
        </div>
      </div>
    `;

    this.showNotification(`Appointment booked with ${doc.name}!`, 'success');
  },

  // TELEMEDICINE VIDEO ROOM DEMO
  openTelemedicineDemo() {
    const modalArea = document.getElementById("genericModalContainer");
    modalArea.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-700 text-white">
          
          <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-emerald-500 pulse-dot"></div>
              <div>
                <h4 class="font-bold text-sm">Medroute TeleHealth Encrypted Video Suite</h4>
                <p class="text-[11px] text-slate-400">Session ID: #VID-9920-HYPERLINK • HIPAA Verified</p>
              </div>
            </div>
            <button onclick="document.getElementById('genericModalContainer').innerHTML=''" class="text-slate-400 hover:text-white text-xs">
              Leave Call <i class="fa-solid fa-phone-slash text-rose-500 ml-1"></i>
            </button>
          </div>

          <!-- Video Screens Area -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <!-- Doctor screen -->
            <div class="relative h-64 bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 flex items-center justify-center">
              <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover">
              <span class="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 text-[11px] font-medium backdrop-blur-sm">
                Dr. Eleanor Vance (Cardiologist)
              </span>
              <span class="absolute top-3 right-3 text-emerald-400 text-xs">
                <i class="fa-solid fa-signal"></i> HD
              </span>
            </div>

            <!-- Patient self screen -->
            <div class="relative h-64 bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 flex items-center justify-center">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover">
              <span class="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 text-[11px] font-medium backdrop-blur-sm">
                You (Alex Morgan)
              </span>
            </div>
          </div>

          <!-- Audio / Video Controls -->
          <div class="flex items-center justify-center gap-4 pt-2">
            <button class="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300">
              <i class="fa-solid fa-microphone"></i>
            </button>
            <button class="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300">
              <i class="fa-solid fa-video"></i>
            </button>
            <button class="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300">
              <i class="fa-solid fa-message"></i>
            </button>
            <button onclick="document.getElementById('genericModalContainer').innerHTML=''" class="w-14 h-12 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white font-bold">
              <i class="fa-solid fa-phone-slash"></i>
            </button>
          </div>

        </div>
      </div>
    `;
  },

  // HEALTH PACKAGES BOOKING MODAL
  bookPackageModal(pkgId) {
    const pkg = MEDROUTE_DATA.healthPackages.find(p => p.id === pkgId);
    if (!pkg) return;

    const modalArea = document.getElementById("genericModalContainer");
    modalArea.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-700">
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-1">Book ${pkg.name}</h3>
          <p class="text-xs text-slate-500 mb-4">Choose between in-hospital visit or home sample collection.</p>

          <div class="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 mb-6">
            <div class="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
              <span>Package Price</span>
              <span class="text-xl text-sky-600">$${pkg.price}</span>
            </div>
            <p class="text-xs text-slate-500 mt-1">Includes ${pkg.testsCount} tests & free doctor consultation.</p>
          </div>

          <div class="space-y-3 mb-6 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Collection Preference</label>
              <select class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs">
                <option>At Hospital Diagnostic Wing (Fastest Results)</option>
                <option>Free Home Blood Sample Collection (+0$)</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Preferred Date</label>
              <input type="date" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs" value="${new Date(Date.now() + 86400000).toISOString().split('T')[0]}">
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <button onclick="document.getElementById('genericModalContainer').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              Cancel
            </button>
            <button onclick="MEDROUTE_APP.showNotification('Package order placed! Our diagnostic team will contact you.', 'success'); document.getElementById('genericModalContainer').innerHTML='';" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md">
              Confirm & Book ($${pkg.price})
            </button>
          </div>
        </div>
      </div>
    `;
  },

  scheduleDiagnosticTest(testId) {
    const test = MEDROUTE_DATA.diagnosticTests.find(t => t.id === testId);
    if (!test) return;
    this.showNotification(`Scheduling initiated for ${test.name} ($${test.price}).`, 'info');
    this.openBookingWizard();
  },

  orderRefillModal(rxId) {
    const rx = MEDROUTE_DATA.patientDemoUser.prescriptions.find(p => p.id === rxId);
    if (!rx) return;

    this.showNotification(`Refill request submitted for Rx ${rx.id}. Delivery expected tomorrow!`, 'success');
  },

  // DONOR REGISTRATION MODAL
  openDonorModal() {
    const modalArea = document.getElementById("genericModalContainer");
    modalArea.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-700">
          <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl mb-4">
            <i class="fa-solid fa-droplet"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-1">Blood Donor Pledge</h3>
          <p class="text-xs text-slate-500 mb-4">Sign up as a voluntary blood donor. You will only be alerted during local emergencies or critical shortages.</p>

          <form onsubmit="event.preventDefault(); MEDROUTE_APP.showNotification('Thank you for pledging to save lives!', 'success'); document.getElementById('genericModalContainer').innerHTML='';" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
              <select class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs">
                <option>O Positive (O+)</option>
                <option>O Negative (O-) - Universal Donor</option>
                <option>A Positive (A+)</option>
                <option>A Negative (A-)</option>
                <option>B Positive (B+)</option>
                <option>B Negative (B-)</option>
                <option>AB Positive (AB+)</option>
                <option>AB Negative (AB-)</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
              <input type="tel" required placeholder="+1 (555) 000-0000" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs">
            </div>
            <div class="pt-3 flex justify-end gap-3">
              <button type="button" onclick="document.getElementById('genericModalContainer').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md">
                Register as Donor
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  // SECOND OPINION MODAL
  openSecondOpinionModal() {
    const modalArea = document.getElementById("genericModalContainer");
    modalArea.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-700">
          <div class="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center text-xl mb-4">
            <i class="fa-solid fa-user-doctor"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-1">Request Medical Second Opinion</h3>
          <p class="text-xs text-slate-500 mb-4">Have your complex diagnosis, MRI, or surgical recommendation reviewed by Medroute's senior clinical board.</p>

          <form onsubmit="event.preventDefault(); MEDROUTE_APP.showNotification('Second opinion dossier received. Assigned specialist will review within 24 hours.', 'success'); document.getElementById('genericModalContainer').innerHTML='';" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Specialty Department</label>
              <select class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs">
                ${MEDROUTE_DATA.departments.map(d => `<option>${d.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Clinical Summary / Questions for Board</label>
              <textarea rows="3" placeholder="Briefly explain current diagnosis and what specific questions you want the second opinion to clarify..." class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"></textarea>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Attach Medical Reports & Scans (PDF / DICOM)</label>
              <input type="file" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs">
            </div>
            <div class="pt-3 flex justify-end gap-3">
              <button type="button" onclick="document.getElementById('genericModalContainer').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md">
                Submit for Expert Review
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  // HEALTH CALCULATORS HANDLERS
  handleBmiCalculation() {
    const height = parseFloat(document.getElementById('bmiHeight').value);
    const weight = parseFloat(document.getElementById('bmiWeight').value);
    const res = MEDROUTE_CALCULATORS.calculateBMI(height, weight);
    const resDiv = document.getElementById('bmiResultContainer');

    if (!res) {
      this.showNotification("Please enter valid positive numbers for height and weight.", "warning");
      return;
    }

    resDiv.classList.remove('hidden');
    document.getElementById('bmiValue').textContent = res.bmi;
    const catBadge = document.getElementById('bmiCategoryBadge');
    catBadge.textContent = res.category;
    catBadge.className = `px-3 py-1 rounded-full text-xs font-bold ${res.colorClass}`;
    document.getElementById('bmiIdealRange').textContent = res.idealWeightRange;
    document.getElementById('bmiAdvice').textContent = res.advice;
  },

  handleDueDateCalculation() {
    const lmpDate = document.getElementById('dueDateLmp').value;
    const cycle = parseInt(document.getElementById('dueDateCycle').value) || 28;
    const res = MEDROUTE_CALCULATORS.calculateDueDate(lmpDate, cycle);
    const resDiv = document.getElementById('dueDateResultContainer');

    if (!res) {
      this.showNotification("Please select a valid date for Last Menstrual Period.", "warning");
      return;
    }

    resDiv.classList.remove('hidden');
    document.getElementById('dueDateFormatted').textContent = res.dueDateFormatted;
    document.getElementById('dueDateWeeks').textContent = `${res.weeksPregnant} Weeks, ${res.daysPregnant} Days`;
    document.getElementById('dueDateTrimester').textContent = res.trimester;
    document.getElementById('dueDateMilestone').textContent = res.milestone;
  },

  handleCalorieCalculation() {
    const gender = document.getElementById('calGender').value;
    const age = parseInt(document.getElementById('calAge').value);
    const weight = parseFloat(document.getElementById('calWeight').value);
    const height = parseFloat(document.getElementById('calHeight').value);
    const activity = document.getElementById('calActivity').value;

    const res = MEDROUTE_CALCULATORS.calculateCalorieAndHydration(gender, age, weight, height, activity);
    const resDiv = document.getElementById('calResultContainer');

    if (!res) {
      this.showNotification("Please enter complete information for age, height, and weight.", "warning");
      return;
    }

    resDiv.classList.remove('hidden');
    document.getElementById('calMaintenance').textContent = `${res.maintenanceCalories} kcal/day`;
    document.getElementById('calWeightLoss').textContent = `${res.weightLossCalories} kcal/day`;
    document.getElementById('calBmr').textContent = `${res.bmr} kcal/day`;
    document.getElementById('calWater').textContent = `${res.waterLiters} Liters (~${res.waterGlasses} glasses)`;
  },

  renderVaccineSchedule() {
    const ageGroup = document.getElementById('vaccineAgeGroupSelect').value;
    const vaccines = MEDROUTE_DATA.vaccines[ageGroup] || [];
    const container = document.getElementById('vaccineScheduleList');
    if (!container) return;

    container.innerHTML = vaccines.map(v => `
      <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between text-xs">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-900 dark:text-white">${v.name}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${v.mandatory ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}">
              ${v.mandatory ? 'Universal / Mandatory' : 'Optional / Recommended'}
            </span>
          </div>
          <p class="text-slate-500 mt-0.5">Protects Against: <span class="text-slate-700 dark:text-slate-300 font-medium">${v.protection}</span></p>
          <p class="text-[10px] text-slate-400">Route: ${v.route}</p>
        </div>
        <button onclick="MEDROUTE_APP.showNotification('Reminder alert scheduled for ${v.name} vaccine.', 'success')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-300 hover:bg-sky-100 flex items-center gap-1">
          <i class="fa-regular fa-bell"></i> Set Reminder
        </button>
      </div>
    `).join('');
  }
};

// Global startup on DOM load
document.addEventListener('DOMContentLoaded', () => {
  MEDROUTE_APP.init();
});
