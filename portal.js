/**
 * Medroute Patient Portal Controller ("MyMedroute")
 * Handles Auth, Family Profiles, Lab Reports, Prescriptions, Health ID & Document Vault
 */

const MEDROUTE_PORTAL = {
  isLoggedIn: false,
  currentUser: null,
  activeProfileId: "self",

  init() {
    this.currentUser = JSON.parse(JSON.stringify(MEDROUTE_DATA.patientDemoUser));
    // Check localStorage if any previous session existed
    const savedAuth = localStorage.getItem("medroute_auth");
    if (savedAuth === "true") {
      this.isLoggedIn = true;
    }
    this.renderPortal();
  },

  loginDemoUser() {
    this.isLoggedIn = true;
    localStorage.setItem("medroute_auth", "true");
    this.renderPortal();
    MEDROUTE_APP.showNotification("Welcome back, Alex Morgan! Patient Portal Unlocked.", "success");
  },

  logout() {
    this.isLoggedIn = false;
    localStorage.removeItem("medroute_auth");
    this.renderPortal();
    MEDROUTE_APP.showNotification("You have been securely logged out.", "info");
  },

  switchProfile(profileId) {
    this.activeProfileId = profileId;
    const profile = this.currentUser.activeProfiles.find(p => p.id === profileId);
    MEDROUTE_APP.showNotification(`Switched profile to ${profile ? profile.name : 'Selected Member'}`, "info");
    this.renderPortal();
  },

  getActiveProfile() {
    return this.currentUser.activeProfiles.find(p => p.id === this.activeProfileId) || this.currentUser.activeProfiles[0];
  },

  renderPortal() {
    const portalContainer = document.getElementById("portalViewContainer");
    if (!portalContainer) return;

    if (!this.isLoggedIn) {
      // Show Login & Demo Gateway
      portalContainer.innerHTML = `
        <div class="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div class="grid grid-cols-1 md:grid-cols-2">
            <div class="p-8 md:p-12 bg-gradient-to-br from-sky-600 to-sky-800 text-white flex flex-col justify-between">
              <div>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm mb-6">
                  <i class="fa-solid fa-lock"></i> 256-Bit HIPAA Compliant
                </span>
                <h3 class="text-3xl font-bold mb-4">MyMedroute Patient Portal</h3>
                <p class="text-sky-100 text-sm leading-relaxed mb-6">
                  Access your complete electronic health record, diagnostic test reports, verified digital prescriptions, appointments, and family profiles 24/7.
                </p>
                <div class="space-y-3 text-sm text-sky-100">
                  <div class="flex items-center gap-3">
                    <i class="fa-solid fa-circle-check text-emerald-300"></i> Instant lab & radiology results download
                  </div>
                  <div class="flex items-center gap-3">
                    <i class="fa-solid fa-circle-check text-emerald-300"></i> Active prescription tracking & 1-click refills
                  </div>
                  <div class="flex items-center gap-3">
                    <i class="fa-solid fa-circle-check text-emerald-300"></i> Unified family account management
                  </div>
                </div>
              </div>
              <div class="mt-8 pt-6 border-t border-sky-500/40 text-xs text-sky-200">
                Need technical assistance? Call Helpline: +1 (800) 633-7680 (Ext 4)
              </div>
            </div>

            <div class="p-8 md:p-12 flex flex-col justify-center">
              <h4 class="text-2xl font-bold text-slate-800 dark:text-white mb-2">Patient Sign In</h4>
              <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Log in with your registered mobile or Patient ID.</p>
              
              <div class="space-y-4 mb-6">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">Mobile / ABHA / Patient ID</label>
                  <input type="text" value="+1 (555) 234-5678" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" placeholder="e.g. +1 555-0199 or MED-99420">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">Password / 6-Digit OTP</label>
                  <input type="password" value="••••••••" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" placeholder="Enter secure PIN or password">
                </div>
              </div>

              <div class="space-y-3">
                <button onclick="MEDROUTE_PORTAL.loginDemoUser()" class="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2">
                  <i class="fa-solid fa-right-to-bracket"></i> Sign In to MyMedroute
                </button>
                <div class="relative flex py-2 items-center">
                  <div class="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                  <span class="flex-shrink mx-4 text-xs text-slate-400 font-medium">EXPLORE INSTANTLY</span>
                  <div class="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <button onclick="MEDROUTE_PORTAL.loginDemoUser()" class="w-full py-3 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold text-sm hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                  <i class="fa-solid fa-wand-magic-sparkles text-emerald-600"></i> One-Click Demo Patient Portal Login
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Patient is logged in: render full dashboard
    const activeMember = this.getActiveProfile();
    const user = this.currentUser;

    portalContainer.innerHTML = `
      <div class="space-y-8">
        <!-- Top Profile & Family Switcher Bar -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              <img src="${activeMember.avatar}" alt="${activeMember.name}" class="w-16 h-16 rounded-2xl object-cover border-2 border-sky-500 shadow-md">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-xl font-bold text-slate-900 dark:text-white">${activeMember.name}</h3>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">${activeMember.relation}</span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ID: <span class="font-mono text-slate-700 dark:text-slate-200 font-semibold">${user.id}</span> | 
                  Blood Group: <span class="font-semibold text-rose-600">${activeMember.bloodGroup}</span> | 
                  ABHA ID: <span class="font-mono text-slate-700 dark:text-slate-200">${user.abhaId}</span>
                </p>
              </div>
            </div>

            <!-- Family Profile Tabs -->
            <div class="flex items-center flex-wrap gap-2">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Family Switcher:</span>
              ${user.activeProfiles.map(p => `
                <button onclick="MEDROUTE_PORTAL.switchProfile('${p.id}')" class="px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${this.activeProfileId === p.id ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
                  <i class="fa-solid ${p.id === 'child' ? 'fa-baby' : (p.id === 'parent' ? 'fa-user-tie' : 'fa-user')} text-xs"></i>
                  ${p.relation} (${p.name.split(' ')[0]})
                </button>
              `).join('')}
              <button onclick="MEDROUTE_PORTAL.logout()" class="ml-2 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-all">
                <i class="fa-solid fa-power-off"></i> Logout
              </button>
            </div>
          </div>
        </div>

        <!-- Portal Sub-Sections: Tabs -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Column 1 & 2: Main Records (Prescriptions & Lab Reports) -->
          <div class="lg:col-span-2 space-y-8">
            
            <!-- Active Prescriptions -->
            <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 text-lg">
                    <i class="fa-solid fa-prescription"></i>
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900 dark:text-white">Active Digital Prescriptions</h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Digitally signed by hospital attending doctors</p>
                  </div>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 rounded-full">
                  ${user.prescriptions.length} Records
                </span>
              </div>

              <div class="space-y-4">
                ${user.prescriptions.map((rx, idx) => `
                  <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/40">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <span class="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400">${rx.id}</span>
                        <h5 class="font-bold text-slate-800 dark:text-white text-base">${rx.diagnosis}</h5>
                        <p class="text-xs text-slate-500">${rx.doctor} • ${rx.dept} • <span class="text-slate-400">${rx.date}</span></p>
                      </div>
                      <div class="flex items-center gap-2">
                        <button onclick="MEDROUTE_PORTAL.viewPrescriptionModal('${rx.id}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 shadow-sm">
                          <i class="fa-solid fa-print"></i> View & Print Rx
                        </button>
                        <button onclick="MEDROUTE_APP.orderRefillModal('${rx.id}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-sm">
                          <i class="fa-solid fa-pills"></i> 1-Click Refill
                        </button>
                      </div>
                    </div>
                    
                    <div class="divide-y divide-slate-200 dark:divide-slate-700 text-xs">
                      ${rx.medicines.map(m => `
                        <div class="py-2 flex items-center justify-between">
                          <div>
                            <span class="font-bold text-slate-800 dark:text-white">${m.name}</span>
                            <span class="text-slate-500 ml-2">(${m.dosage})</span>
                            <p class="text-[11px] text-slate-400">${m.frequency} • Duration: ${m.duration}</p>
                          </div>
                          ${m.refillAllowed ? '<span class="text-[11px] text-emerald-600 font-medium"><i class="fa-solid fa-check"></i> Refill Eligible</span>' : '<span class="text-[11px] text-slate-400">Doctor review required</span>'}
                        </div>
                      `).join('')}
                    </div>
                    <div class="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 italic">
                      <i class="fa-solid fa-circle-info text-sky-500 mr-1"></i> "${rx.notes}"
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Diagnostic Lab Reports -->
            <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 text-lg">
                    <i class="fa-solid fa-vial-virus"></i>
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900 dark:text-white">Diagnostic Laboratory Reports</h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Complete automated pathology & biochemical investigations</p>
                  </div>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 rounded-full">
                  ${user.labReports.length} Available
                </span>
              </div>

              <div class="space-y-4">
                ${user.labReports.map(report => `
                  <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/40">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400">${report.id}</span>
                          <span class="px-2 py-0.5 text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-md">
                            ${report.status}
                          </span>
                        </div>
                        <h5 class="font-bold text-slate-800 dark:text-white text-base mt-1">${report.testName}</h5>
                        <p class="text-xs text-slate-500">${report.category} • Referred by ${report.doctor} • ${report.date}</p>
                      </div>
                      <button onclick="MEDROUTE_PORTAL.viewLabReportModal('${report.id}')" class="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 shadow-sm">
                        <i class="fa-solid fa-file-medical"></i> View & Print Report
                      </button>
                    </div>

                    <!-- Parameter snippet table -->
                    <div class="overflow-x-auto">
                      <table class="w-full text-xs text-left">
                        <thead class="text-slate-500 bg-slate-100 dark:bg-slate-800">
                          <tr>
                            <th class="py-2 px-3 rounded-l-lg">Investigated Parameter</th>
                            <th class="py-2 px-3">Result</th>
                            <th class="py-2 px-3">Reference Range</th>
                            <th class="py-2 px-3 rounded-r-lg">Status</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
                          ${report.parameters.slice(0, 3).map(p => `
                            <tr>
                              <td class="py-2 px-3 font-medium text-slate-800 dark:text-white">${p.name}</td>
                              <td class="py-2 px-3 font-bold ${p.status === 'High' ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}">${p.result} ${p.unit}</td>
                              <td class="py-2 px-3 text-slate-500">${p.normalRange} ${p.unit}</td>
                              <td class="py-2 px-3">
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}">
                                  ${p.status}
                                </span>
                              </td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Column 3: Digital Health Card & Document Vault -->
          <div class="space-y-8">
            
            <!-- Digital ABHA / Medroute Health ID Card -->
            <div class="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 text-white shadow-xl border border-sky-900/60">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400 text-sm">
                    <i class="fa-solid fa-hospital-user"></i>
                  </div>
                  <span class="font-bold text-sm tracking-wide">MEDROUTE DIGITAL HEALTH CARD</span>
                </div>
                <i class="fa-solid fa-wifi text-sky-300 rotate-90 text-sm"></i>
              </div>

              <div class="my-4 flex items-center justify-between">
                <div>
                  <p class="text-xs text-sky-300 font-mono">PATIENT IDENTIFIER</p>
                  <p class="text-xl font-bold tracking-widest font-mono text-white mt-1">${user.id}</p>
                  <p class="text-xs text-sky-200 mt-2">NAME: <span class="font-bold">${activeMember.name.toUpperCase()}</span></p>
                  <p class="text-xs text-sky-200">RELATION: ${activeMember.relation.toUpperCase()}</p>
                </div>
                <div class="bg-white p-2 rounded-xl text-slate-900 text-center shadow-md">
                  <i class="fa-solid fa-qrcode text-4xl"></i>
                  <p class="text-[9px] font-mono font-bold mt-1">SCAN EHR</p>
                </div>
              </div>

              <div class="pt-4 border-t border-sky-800/80 flex items-center justify-between text-xs text-sky-300">
                <div>
                  <span class="text-[10px] block text-sky-400">ABHA NUM</span>
                  <span class="font-mono text-white text-xs">${user.abhaId}</span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] block text-sky-400">BLOOD GROUP</span>
                  <span class="font-bold text-rose-400 text-sm">${activeMember.bloodGroup}</span>
                </div>
              </div>
            </div>

            <!-- Upcoming Appointments Quick Card -->
            <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 class="font-bold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                <i class="fa-regular fa-calendar-check text-sky-600"></i> Scheduled Consultations
              </h4>
              <div class="space-y-3">
                ${user.appointments.map(apt => `
                  <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-sky-50/50 dark:bg-sky-950/20">
                    <div class="flex items-center justify-between text-xs mb-1">
                      <span class="font-bold text-slate-800 dark:text-white">${apt.doctor}</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300">${apt.status}</span>
                    </div>
                    <p class="text-xs text-slate-500">${apt.dept} • <span class="font-semibold text-slate-700 dark:text-slate-300">${apt.date}</span></p>
                    <div class="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <span class="text-slate-400"><i class="fa-solid fa-ticket text-sky-500 mr-1"></i>${apt.token}</span>
                      <button onclick="MEDROUTE_APP.openQueueTracker('${apt.token}')" class="text-sky-600 dark:text-sky-400 font-semibold hover:underline">Track Wait Time</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Medical Document Vault (Upload Past Records) -->
            <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 class="font-bold text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                <i class="fa-solid fa-cloud-arrow-up text-sky-600"></i> Secure Health Document Vault
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Upload insurance cards, previous hospital discharge summaries, or outside lab scans.
              </p>

              <div id="vaultUploadArea" onclick="document.getElementById('vaultFileInput').click()" class="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-700/30">
                <i class="fa-solid fa-file-arrow-up text-3xl text-sky-500 mb-2"></i>
                <p class="text-xs font-semibold text-slate-700 dark:text-slate-200">Click to upload medical files</p>
                <p class="text-[11px] text-slate-400 mt-1">PDF, JPG, PNG or DICOM up to 25MB</p>
                <input type="file" id="vaultFileInput" class="hidden" onchange="MEDROUTE_PORTAL.handleDocumentUpload(event)">
              </div>

              <div id="vaultUploadedList" class="mt-4 space-y-2">
                <div class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2 truncate">
                    <i class="fa-solid fa-file-pdf text-rose-500"></i>
                    <span class="truncate font-medium text-slate-700 dark:text-slate-200">Prior_Hospital_Discharge_Summary_2024.pdf</span>
                  </div>
                  <span class="text-[10px] text-slate-400 ml-2">2.4 MB</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    `;
  },

  handleDocumentUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const list = document.getElementById("vaultUploadedList");
    if (list) {
      const item = document.createElement("div");
      item.className = "p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs";
      item.innerHTML = `
        <div class="flex items-center gap-2 truncate">
          <i class="fa-solid fa-check-circle text-emerald-600"></i>
          <span class="truncate font-medium text-emerald-900 dark:text-emerald-200">${file.name}</span>
        </div>
        <span class="text-[10px] text-emerald-700 dark:text-emerald-400 ml-2">${(file.size / 1024).toFixed(0)} KB</span>
      `;
      list.prepend(item);
    }
    MEDROUTE_APP.showNotification(`File "${file.name}" uploaded successfully to EHR vault!`, "success");
  },

  viewPrescriptionModal(rxId) {
    const rx = this.currentUser.prescriptions.find(p => p.id === rxId);
    if (!rx) return;
    const activeMember = this.getActiveProfile();

    const modalArea = document.getElementById("genericModalContainer");
    modalArea.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" id="printableModalArea">
          
          <!-- Hospital Header -->
          <div class="border-b-2 border-sky-600 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h2 class="text-2xl font-black text-sky-700 tracking-tight flex items-center gap-2">
                <i class="fa-solid fa-heart-pulse"></i> MEDROUTE
              </h2>
              <p class="text-xs text-slate-500">Super-Speciality Hospital & Research Institute</p>
              <p class="text-[11px] text-slate-400">450 Medroute Blvd • Tel: +1 (800) 633-7680</p>
            </div>
            <div class="text-right">
              <span class="px-2.5 py-1 rounded bg-sky-100 text-sky-800 font-mono font-bold text-xs">E-PRESCRIPTION</span>
              <p class="text-xs font-mono text-slate-500 mt-1">Rx #: ${rx.id}</p>
              <p class="text-xs text-slate-500">Date: ${rx.date}</p>
            </div>
          </div>

          <!-- Patient & Doctor Metadata -->
          <div class="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-xs mb-6">
            <div>
              <p class="text-slate-400">PATIENT DETAILS:</p>
              <p class="font-bold text-slate-900 dark:text-white text-sm">${activeMember.name} (${activeMember.relation})</p>
              <p class="text-slate-500">Age: ${activeMember.age} Yrs | Blood: ${activeMember.bloodGroup}</p>
              <p class="text-slate-500 font-mono">Patient ID: ${this.currentUser.id}</p>
            </div>
            <div class="text-right">
              <p class="text-slate-400">CONSULTING PHYSICIAN:</p>
              <p class="font-bold text-slate-900 dark:text-white text-sm">${rx.doctor}</p>
              <p class="text-slate-500">${rx.dept}</p>
              <p class="text-slate-500">Reg No: MD-LIC-99420-US</p>
            </div>
          </div>

          <div class="mb-4">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">DIAGNOSIS & CLINICAL IMPRESSION:</span>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">${rx.diagnosis}</p>
          </div>

          <!-- Medicines Table -->
          <div class="mb-6">
            <h5 class="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <i class="fa-solid fa-pills"></i> Rx PRESCRIBED MEDICINES
            </h5>
            <table class="w-full text-xs text-left border border-slate-200 dark:border-slate-700">
              <thead class="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                <tr>
                  <th class="p-2.5">Medication & Strength</th>
                  <th class="p-2.5">Dosage</th>
                  <th class="p-2.5">Frequency & Timing</th>
                  <th class="p-2.5">Duration</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
                ${rx.medicines.map(m => `
                  <tr>
                    <td class="p-2.5 font-bold text-slate-900 dark:text-white">${m.name}</td>
                    <td class="p-2.5">${m.dosage}</td>
                    <td class="p-2.5">${m.frequency}</td>
                    <td class="p-2.5">${m.duration}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 mb-6">
            <strong>Physician's Advisory:</strong> ${rx.notes}
          </div>

          <!-- Signature & Footer -->
          <div class="flex justify-between items-end border-t pt-4 text-xs">
            <div class="text-[11px] text-slate-400">
              Generated via Medroute Electronic Health Records System.<br>QR Verified Digital Signature.
            </div>
            <div class="text-center">
              <div class="font-signature text-xl text-sky-800 dark:text-sky-300 font-serif italic">${rx.doctor}</div>
              <p class="border-t border-slate-300 dark:border-slate-600 pt-1 text-[11px] text-slate-500">Authorized Signature & Seal</p>
            </div>
          </div>

          <!-- Action Buttons (No Print) -->
          <div class="mt-8 flex justify-end gap-3 no-print">
            <button onclick="document.getElementById('genericModalContainer').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300">
              Close
            </button>
            <button onclick="window.print()" class="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-2 shadow-md">
              <i class="fa-solid fa-print"></i> Print Prescription
            </button>
          </div>

        </div>
      </div>
    `;
  },

  viewLabReportModal(repId) {
    const report = this.currentUser.labReports.find(r => r.id === repId);
    if (!report) return;
    const activeMember = this.getActiveProfile();

    const modalArea = document.getElementById("genericModalContainer");
    modalArea.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" id="printableModalArea">
          
          <div class="border-b-2 border-purple-600 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h2 class="text-2xl font-black text-purple-700 tracking-tight flex items-center gap-2">
                <i class="fa-solid fa-vial-virus"></i> MEDROUTE DIAGNOSTICS
              </h2>
              <p class="text-xs text-slate-500">NABL & CAP Certified Central Clinical Laboratory</p>
              <p class="text-[11px] text-slate-400">450 Medroute Blvd • Pathology Helpdesk: +1 (800) 633-7682</p>
            </div>
            <div class="text-right">
              <span class="px-2.5 py-1 rounded bg-purple-100 text-purple-800 font-mono font-bold text-xs">OFFICIAL LAB REPORT</span>
              <p class="text-xs font-mono text-slate-500 mt-1">Report #: ${report.id}</p>
              <p class="text-xs text-slate-500">Date: ${report.date}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-xs mb-6">
            <div>
              <p class="text-slate-400">PATIENT INFORMATION:</p>
              <p class="font-bold text-slate-900 dark:text-white text-sm">${activeMember.name}</p>
              <p class="text-slate-500">Age/Gender: ${activeMember.age} Yrs / ${activeMember.relation}</p>
              <p class="text-slate-500 font-mono">Patient ID: ${this.currentUser.id}</p>
            </div>
            <div class="text-right">
              <p class="text-slate-400">REFERRED BY / SPECIMEN:</p>
              <p class="font-bold text-slate-900 dark:text-white text-sm">${report.doctor}</p>
              <p class="text-slate-500">Department: ${report.category}</p>
              <p class="text-emerald-600 font-bold"><i class="fa-solid fa-circle-check"></i> Quality Check Verified</p>
            </div>
          </div>

          <div class="mb-4">
            <h4 class="text-base font-bold text-slate-900 dark:text-white">${report.testName}</h4>
            <p class="text-xs text-slate-500 italic mt-0.5">Clinical Impression: ${report.summary}</p>
          </div>

          <table class="w-full text-xs text-left border border-slate-200 dark:border-slate-700 mb-6">
            <thead class="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              <tr>
                <th class="p-2.5">Investigation Parameter</th>
                <th class="p-2.5">Observed Value</th>
                <th class="p-2.5">Biological Reference Range</th>
                <th class="p-2.5">Evaluation</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
              ${report.parameters.map(p => `
                <tr class="${p.status === 'High' ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}">
                  <td class="p-2.5 font-bold text-slate-800 dark:text-white">${p.name}</td>
                  <td class="p-2.5 font-bold ${p.status === 'High' ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}">
                    ${p.result} <span class="font-normal text-slate-500">${p.unit}</span>
                  </td>
                  <td class="p-2.5 text-slate-500">${p.normalRange} ${p.unit}</td>
                  <td class="p-2.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}">
                      ${p.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="flex justify-between items-end border-t pt-4 text-xs">
            <div class="text-[11px] text-slate-400">
              End of Examination Report.<br>Analyzed using automated Beckman Coulter / Roche Analyzers.
            </div>
            <div class="text-center">
              <p class="font-bold text-slate-800 dark:text-white">Dr. Sarah Jenkins, MD</p>
              <p class="text-[10px] text-slate-400">Consultant Pathologist & Lab Director</p>
            </div>
          </div>

          <div class="mt-8 flex justify-end gap-3 no-print">
            <button onclick="document.getElementById('genericModalContainer').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300">
              Close
            </button>
            <button onclick="window.print()" class="px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 shadow-md">
              <i class="fa-solid fa-print"></i> Print Official Report
            </button>
          </div>

        </div>
      </div>
    `;
  }
};
