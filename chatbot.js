/**
 * Medroute AI Health Assistant & Symptom Triage Chatbot ("MediRoute Bot")
 */

const MEDROUTE_CHATBOT = {
  isOpen: false,
  messageHistory: [],

  init() {
    this.appendBotMessage(
      "Hello! I'm **MediRoute**, your 24/7 hospital assistant. How can I help you today? You can describe your symptoms, ask about doctor appointments, check surgery costs, or track your OPD wait times."
    );
  },

  toggleChat() {
    this.isOpen = !this.isOpen;
    const windowEl = document.getElementById("chatbotWindow");
    const badge = document.getElementById("chatbotBadge");
    if (windowEl) {
      if (this.isOpen) {
        windowEl.classList.remove("hidden");
        if (badge) badge.classList.add("hidden");
        document.getElementById("chatbotInput").focus();
      } else {
        windowEl.classList.add("hidden");
      }
    }
  },

  handleQuickPrompt(text) {
    const input = document.getElementById("chatbotInput");
    if (input) {
      input.value = text;
      this.sendMessage();
    }
  },

  sendMessage() {
    const input = document.getElementById("chatbotInput");
    const message = input.value.trim();
    if (!message) return;

    this.appendUserMessage(message);
    input.value = "";

    // Show typing indicator
    this.showTypingIndicator();

    setTimeout(() => {
      this.removeTypingIndicator();
      this.processResponse(message);
    }, 700);
  },

  appendUserMessage(text) {
    const messagesContainer = document.getElementById("chatbotMessages");
    const div = document.createElement("div");
    div.className = "flex justify-end mb-3";
    div.innerHTML = `
      <div class="max-w-[80%] rounded-2xl rounded-tr-sm bg-sky-600 text-white p-3 text-xs shadow-sm">
        ${this.escapeHtml(text)}
      </div>
    `;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  appendBotMessage(html) {
    const messagesContainer = document.getElementById("chatbotMessages");
    const div = document.createElement("div");
    div.className = "flex gap-2.5 mb-3";
    div.innerHTML = `
      <div class="w-7 h-7 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
        <i class="fa-solid fa-robot"></i>
      </div>
      <div class="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 p-3 text-xs shadow-sm space-y-2">
        ${html}
      </div>
    `;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  showTypingIndicator() {
    const messagesContainer = document.getElementById("chatbotMessages");
    const div = document.createElement("div");
    div.id = "botTypingIndicator";
    div.className = "flex gap-2.5 mb-3";
    div.innerHTML = `
      <div class="w-7 h-7 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 flex items-center justify-center flex-shrink-0 text-xs">
        <i class="fa-solid fa-robot"></i>
      </div>
      <div class="rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-700/80 p-3 text-xs flex items-center gap-1.5 text-slate-400">
        <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
      </div>
    `;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  removeTypingIndicator() {
    const el = document.getElementById("botTypingIndicator");
    if (el) el.remove();
  },

  processResponse(userText) {
    const text = userText.toLowerCase();

    // 1. EMERGENCY RED FLAGS
    if (text.includes("chest pain") || text.includes("heart attack") || text.includes("can't breathe") || text.includes("severe bleeding") || text.includes("unconscious") || text.includes("stroke")) {
      this.appendBotMessage(`
        <div class="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-900 dark:text-rose-200">
          <p class="font-bold text-xs uppercase flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <i class="fa-solid fa-triangle-exclamation"></i> Emergency Detected
          </p>
          <p class="text-xs mt-1">Your symptoms may indicate a critical medical situation requiring immediate emergency attention.</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button onclick="MEDROUTE_APP.openEmergencyModal()" class="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs shadow-md hover:bg-rose-700 flex items-center gap-1.5">
              <i class="fa-solid fa-truck-medical"></i> 1-Click SOS Dispatch
            </button>
            <a href="tel:108" class="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-rose-300 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5">
              <i class="fa-solid fa-phone"></i> Call Emergency (108)
            </a>
          </div>
        </div>
      `);
      return;
    }

    // 2. APPOINTMENT BOOKING TRIGGER
    if (text.includes("book") || text.includes("appointment") || text.includes("schedule") || text.includes("see doctor")) {
      this.appendBotMessage(`
        <p>I can help you schedule an appointment with our specialist doctors right now.</p>
        <p class="text-[11px] text-slate-500">You can book by selecting a doctor directly, choosing a specialty department, or using our symptom helper.</p>
        <button onclick="MEDROUTE_APP.openBookingWizard(); MEDROUTE_CHATBOT.toggleChat();" class="mt-2 w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm">
          <i class="fa-regular fa-calendar-plus"></i> Open Appointment Booking Wizard
        </button>
      `);
      return;
    }

    // 3. QUEUE & WAIT TIMES
    if (text.includes("queue") || text.includes("token") || text.includes("wait time") || text.includes("opd status")) {
      this.appendBotMessage(`
        <p>Our Live OPD Queue Tracker lets you check which token number is currently inside the doctor's consultation room and your estimated wait time.</p>
        <div class="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-xs">
          <div class="flex justify-between font-bold text-slate-800 dark:text-white">
            <span>Cardiology OPD: Token #24</span>
            <span class="text-sky-600">~12 min wait</span>
          </div>
          <p class="text-[11px] text-slate-500 mt-1">Tokens moving at approx 8 mins per consultation.</p>
        </div>
        <button onclick="MEDROUTE_APP.scrollToSection('queueSection'); MEDROUTE_CHATBOT.toggleChat();" class="mt-2 w-full py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-semibold text-xs flex items-center justify-center gap-1.5">
          <i class="fa-solid fa-stopwatch"></i> View Live Queue Tracker
        </button>
      `);
      return;
    }

    // 4. SURGERY COST ESTIMATE
    if (text.includes("cost") || text.includes("price") || text.includes("fee") || text.includes("estimate") || text.includes("knee") || text.includes("angioplasty")) {
      this.appendBotMessage(`
        <p>Medroute provides complete transparency for surgery and procedure charges. Our itemized breakdown covers surgeon fees, operation theater, consumables, and ward/suite charges.</p>
        <button onclick="MEDROUTE_APP.scrollToSection('costEstimatorSection'); MEDROUTE_CHATBOT.toggleChat();" class="mt-2 w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm">
          <i class="fa-solid fa-calculator"></i> Launch Treatment Cost Estimator
        </button>
      `);
      return;
    }

    // 5. INSURANCE & CASHLESS
    if (text.includes("insurance") || text.includes("cashless") || text.includes("tpa") || text.includes("claim") || text.includes("ayushman") || text.includes("policy")) {
      this.appendBotMessage(`
        <p>Medroute partners with over 30+ leading private and government health insurance networks, including <strong>Blue Cross, UnitedHealthcare, Aetna, Cigna, Star Health, ICICI Lombard, and Ayushman Bharat (PM-JAY)</strong>.</p>
        <p class="text-[11px] text-slate-500">Our 24/7 TPA Desk guarantees cashless pre-authorization approval within 30-45 minutes.</p>
        <button onclick="MEDROUTE_APP.scrollToSection('insuranceSection'); MEDROUTE_CHATBOT.toggleChat();" class="mt-2 w-full py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-semibold text-xs flex items-center justify-center gap-1.5">
          <i class="fa-solid fa-shield-halved text-sky-500"></i> Check Accepted Insurance
        </button>
      `);
      return;
    }

    // 6. SYMPTOM ROUTING TO DEPARTMENTS
    if (text.includes("kid") || text.includes("child") || text.includes("baby") || text.includes("fever in baby") || text.includes("pediatric")) {
      this.appendBotMessage(`
        <p>For childhood illnesses and infant health, we recommend our <strong>Pediatrics & Neonatology</strong> department led by <strong>Dr. Priya Sharma</strong>.</p>
        <button onclick="MEDROUTE_APP.prefillBooking('doc-4'); MEDROUTE_CHATBOT.toggleChat();" class="mt-2 w-full py-2 px-3 rounded-xl bg-sky-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm">
          <i class="fa-solid fa-calendar-check"></i> Book with Dr. Priya Sharma ($80)
        </button>
      `);
      return;
    }

    if (text.includes("bone") || text.includes("joint") || text.includes("knee") || text.includes("back pain") || text.includes("fracture") || text.includes("ortho")) {
      this.appendBotMessage(`
        <p>For bone, joint, or spinal concerns, our <strong>Orthopedics & Joint Replacement</strong> department led by <strong>Dr. Sarah Al-Mansoor</strong> specializes in robotic surgery and rapid rehabilitation.</p>
        <button onclick="MEDROUTE_APP.prefillBooking('doc-3'); MEDROUTE_CHATBOT.toggleChat();" class="mt-2 w-full py-2 px-3 rounded-xl bg-sky-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm">
          <i class="fa-solid fa-calendar-check"></i> Book with Dr. Sarah Al-Mansoor ($95)
        </button>
      `);
      return;
    }

    if (text.includes("heart") || text.includes("palpitation") || text.includes("bp") || text.includes("blood pressure") || text.includes("cardio")) {
      this.appendBotMessage(`
        <p>For cardiovascular checkups, hypertension, and heart care, consult our Senior Interventional Cardiologist, <strong>Dr. Eleanor Vance</strong>.</p>
        <button onclick="MEDROUTE_APP.prefillBooking('doc-1'); MEDROUTE_CHATBOT.toggleChat();" class="mt-2 w-full py-2 px-3 rounded-xl bg-sky-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm">
          <i class="fa-solid fa-calendar-check"></i> Book with Dr. Eleanor Vance ($100)
        </button>
      `);
      return;
    }

    if (text.includes("headache") || text.includes("migraine") || text.includes("seizure") || text.includes("memory") || text.includes("dizzy") || text.includes("neuro")) {
      this.appendBotMessage(`
        <p>For neurological diagnostics and headache clinics, our Senior Neurologist <strong>Dr. Marcus Chen</strong> is available for consultation.</p>
        <button onclick="MEDROUTE_APP.prefillBooking('doc-2'); MEDROUTE_CHATBOT.toggleChat();" class="mt-2 w-full py-2 px-3 rounded-xl bg-sky-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm">
          <i class="fa-solid fa-calendar-check"></i> Book with Dr. Marcus Chen ($110)
        </button>
      `);
      return;
    }

    // Default friendly assistant fallback
    this.appendBotMessage(`
      <p>Thank you for reaching out! Here are quick things I can help you with:</p>
      <div class="grid grid-cols-1 gap-1.5 pt-1">
        <button onclick="MEDROUTE_CHATBOT.handleQuickPrompt('Book an appointment')" class="text-left px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-sky-500 text-xs">
          📅 Book Doctor Consultation
        </button>
        <button onclick="MEDROUTE_CHATBOT.handleQuickPrompt('Check cost of surgery')" class="text-left px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-sky-500 text-xs">
          💰 Procedure & Surgery Pricing
        </button>
        <button onclick="MEDROUTE_CHATBOT.handleQuickPrompt('Accepted insurance')" class="text-left px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-sky-500 text-xs">
          🛡️ Cashless Insurance & TPAs
        </button>
        <button onclick="MEDROUTE_CHATBOT.handleQuickPrompt('Live queue wait time')" class="text-left px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-sky-500 text-xs">
          ⏱️ Check OPD Live Token Wait Time
        </button>
      </div>
    `);
  },

  escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};
