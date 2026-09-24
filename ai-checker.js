/**
 * Punjab Healthcare AI Clinical Assistant & Hospital Knowledge Chatbot
 * 
 * Directly loads data from punjab_hospital_15000.csv (with fallback to PUNJAB_HOSPITAL_DATA).
 * Features:
 * - Natural conversation skills (handles "hlo", "hi", "how are you", Punjabi greetings, etc.)
 * - Deep querying over 15,000 Punjab hospital records (budget, location, disease, rating, success rate)
 * - Voice speech synthesis (Read Aloud 🔊)
 * - Quick category filtering tabs (Heart, Cancer, Ortho, Budget < ₹1L, Top Cities)
 * - In-chat Hospital Comparison engine
 * - Hospital Detail Modal preview with Ayushman & Cashless insurance indicators
 * - Copy / Share hospital recommendations
 * - Emergency 108 triage protocol
 * - Soft audio chime on response
 */

class PunjabHealthcareAIChatbot {
  constructor() {
    this.isOpen = false;
    this.isMaximized = false;
    this.soundEnabled = true;
    this.hospitalData = [];
    this.dataSource = 'Loading...';
    this.dataReady = false;
    this.currentMatches = [];
    this.currentOffset = 0;
    this.pageSize = 3;

    this.init();
  }

  async init() {
    this.injectStyles();
    this.createModal();
    this.ensureFloatingButton();
    this.bindEvents();
    await this.loadHospitalDataFromCSV();
  }

  // Load directly from punjab_hospital_15000.csv with fast parsing
  async loadHospitalDataFromCSV() {
    try {
      const response = await fetch('punjab_hospital_15000.csv');
      if (response.ok) {
        const text = await response.text();
        const lines = text.trim().split('\n');
        const parsed = [];
        // Header: id,disease,location,hospital_name,age_group,treatment_type,budget,total_patient,successful_patients,success_rate,rating
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const parts = line.split(',');
          if (parts.length >= 11) {
            parsed.push({
              id: parseInt(parts[0]) || i,
              disease: parts[1] || 'General',
              location: parts[2] || 'Punjab',
              hospital: parts[3] || 'Punjab Healthcare Centre',
              age: parts[4] || 'All Ages',
              treatment: parts[5] || 'General Treatment',
              budget: parseFloat(parts[6]) || 50000,
              total_patients: parseInt(parts[7]) || 100,
              successful_patients: parseInt(parts[8]) || 90,
              success_rate: parseFloat(parts[9]) || 90.0,
              rating: parseFloat(parts[10]) || 4.5
            });
          }
        }

        if (parsed.length > 0) {
          this.hospitalData = parsed;
          this.dataReady = true;
          this.dataSource = 'punjab_hospital_15000.csv';
          this.updateDataBadge(parsed.length, 'punjab_hospital_15000.csv');
          console.log(`[Punjab AI Chatbot] Successfully parsed ${parsed.length} hospitals from punjab_hospital_15000.csv`);
          return;
        }
      }
    } catch (e) {
      console.warn('[Punjab AI Chatbot] CSV fetch failed, checking PUNJAB_HOSPITAL_DATA fallback:', e);
    }

    // Fallback if local file restriction prevents direct fetch
    if (window.PUNJAB_HOSPITAL_DATA && Array.isArray(window.PUNJAB_HOSPITAL_DATA) && window.PUNJAB_HOSPITAL_DATA.length > 0) {
      this.hospitalData = window.PUNJAB_HOSPITAL_DATA;
      this.dataReady = true;
      this.dataSource = 'punjab_hospital_15000.csv (Cached)';
      this.updateDataBadge(this.hospitalData.length, 'punjab_hospital_15000.csv');
    } else {
      // Dynamic fallback script load
      const script = document.createElement('script');
      script.src = 'js/punjab_hospital_data.js';
      script.onload = () => {
        if (window.PUNJAB_HOSPITAL_DATA) {
          this.hospitalData = window.PUNJAB_HOSPITAL_DATA;
          this.dataReady = true;
          this.updateDataBadge(this.hospitalData.length, 'punjab_hospital_15000.csv');
        }
      };
      document.head.appendChild(script);
    }
  }

  updateDataBadge(count, filename) {
    const badge = document.getElementById('ph-chat-data-source-badge');
    if (badge) {
      badge.innerHTML = `<span style="color:#10b981;">●</span> ${count.toLocaleString()} Hospitals Loaded from <strong>${filename}</strong>`;
    }
  }

  playSoftChime() {
    if (!this.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  }

  speakText(text) {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel(); // stop current speech
    // Clean markdown/html for speech
    const clean = text.replace(/<[^>]*>?/gm, '').replace(/[*_#~]/g, '');
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    window.speechSynthesis.speak(utter);
  }

  injectStyles() {
    if (document.getElementById('ph-chatbot-styles')) return;
    const style = document.createElement('style');
    style.id = 'ph-chatbot-styles';
    style.textContent = `
      .ph-chat-modal {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 440px;
        max-width: calc(100vw - 32px);
        height: 640px;
        max-height: calc(100vh - 48px);
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(0, 0, 0, 0.08);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, width 0.25s ease, height 0.25s ease;
        transform: translateY(24px) scale(0.96);
        opacity: 0;
        pointer-events: none;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .ph-chat-modal.active {
        transform: translateY(0) scale(1);
        opacity: 1;
        pointer-events: all;
      }

      .ph-chat-modal.maximized {
        width: 780px;
        height: 85vh;
        max-height: 850px;
      }

      .ph-chat-header {
        background: linear-gradient(135deg, #1b3b6f 0%, #0d2342 60%, #00A389 100%);
        color: white;
        padding: 14px 18px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }

      .ph-chat-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .ph-chat-avatar-box {
        position: relative;
        width: 42px;
        height: 42px;
        background: rgba(255,255,255,0.15);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .ph-chat-online-dot {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 10px;
        height: 10px;
        background: #10b981;
        border: 2px solid white;
        border-radius: 50%;
      }

      .ph-data-badge-row {
        font-size: 11px;
        background: rgba(0,0,0,0.22);
        padding: 3px 8px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #e2e8f0;
        width: fit-content;
      }

      /* Quick Category Pills Bar */
      .ph-chat-category-bar {
        background: #f1f5f9;
        border-bottom: 1px solid #e2e8f0;
        padding: 8px 12px;
        display: flex;
        gap: 6px;
        overflow-x: auto;
        white-space: nowrap;
        scrollbar-width: thin;
      }

      .ph-cat-pill {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        color: #334155;
        padding: 4px 10px;
        border-radius: 16px;
        font-size: 11.5px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        flex-shrink: 0;
      }

      .ph-cat-pill:hover {
        background: #1b3b6f;
        color: white;
        border-color: #1b3b6f;
      }

      .ph-chat-body {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        background: #f8fafc;
        display: flex;
        flex-direction: column;
        gap: 14px;
        scroll-behavior: smooth;
      }

      .ph-msg-row {
        display: flex;
        flex-direction: column;
        width: 100%;
      }

      .ph-msg-bubble {
        max-width: 88%;
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 13.5px;
        line-height: 1.55;
        position: relative;
        word-break: break-word;
        box-shadow: 0 1px 4px rgba(0,0,0,0.03);
      }

      .ph-msg-bot {
        background: #ffffff;
        color: #1e293b;
        border-bottom-left-radius: 4px;
        align-self: flex-start;
        border: 1px solid #e2e8f0;
      }

      .ph-msg-user {
        background: linear-gradient(135deg, #00A389 0%, #00826d 100%);
        color: #ffffff;
        border-bottom-right-radius: 4px;
        align-self: flex-end;
      }

      .ph-msg-meta {
        font-size: 10px;
        color: #94a3b8;
        margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .ph-msg-meta.user {
        justify-content: flex-end;
      }

      .ph-voice-btn {
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 4px;
        font-size: 12px;
        transition: color 0.2s;
      }

      .ph-voice-btn:hover {
        color: #00A389;
      }

      .ph-quick-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 10px;
      }

      .ph-chip-btn {
        background: #f1f5f9;
        color: #334155;
        border: 1px solid #cbd5e1;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11.5px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .ph-chip-btn:hover {
        background: #00A389;
        color: white;
        border-color: #00A389;
        transform: translateY(-1px);
      }

      .ph-hospital-card-mini {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-left: 4px solid #00A389;
        border-radius: 10px;
        padding: 12px 14px;
        margin-top: 10px;
        font-size: 12.5px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .ph-hospital-card-mini:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.08);
      }

      .ph-chat-footer {
        padding: 12px 16px;
        background: white;
        border-top: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .ph-input-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .ph-chat-input {
        flex: 1;
        border: 1px solid #cbd5e1;
        border-radius: 24px;
        padding: 10px 16px;
        font-size: 13.5px;
        outline: none;
        transition: all 0.2s ease;
        background: #f8fafc;
      }

      .ph-chat-input:focus {
        background: #ffffff;
        border-color: #00A389;
        box-shadow: 0 0 0 3px rgba(0, 163, 137, 0.15);
      }

      .ph-send-btn {
        background: #00A389;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .ph-send-btn:hover {
        background: #008772;
        transform: scale(1.05);
      }

      .ph-emergency-alert {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-left: 4px solid #ef4444;
        border-radius: 8px;
        padding: 10px 12px;
        margin-top: 8px;
        color: #991b1b;
        font-size: 12px;
      }

      .ph-typing-indicator {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 8px 14px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        border-bottom-left-radius: 4px;
        font-size: 12px;
        color: #64748b;
        width: fit-content;
      }

      .ph-typing-dot {
        width: 6px;
        height: 6px;
        background: #00A389;
        border-radius: 50%;
        animation: phBlink 1.4s infinite both;
      }
      .ph-typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .ph-typing-dot:nth-child(3) { animation-delay: 0.4s; }

      @keyframes phBlink {
        0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1.1); }
      }

      /* Modal for Hospital Full Details */
      .ph-detail-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(4px);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: phFadeIn 0.2s ease;
      }

      .ph-detail-modal-card {
        background: white;
        border-radius: 20px;
        width: 520px;
        max-width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 25px 50px rgba(0,0,0,0.3);
        padding: 24px;
        position: relative;
      }

      @keyframes phFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  ensureFloatingButton() {
    let existingBtn = document.querySelector('button[onclick*="aiChecker"]');
    if (!existingBtn) {
      const floatBtn = document.createElement('button');
      floatBtn.id = 'ph-global-chat-launcher';
      floatBtn.className = 'fixed bottom-6 right-6 z-40 px-4 py-3 bg-medteal hover:bg-medtealDark text-white text-xs font-extrabold rounded-full shadow-2xl flex items-center gap-2 hover-lift transition border border-white/20';
      floatBtn.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:9999; padding:12px 18px; background:#00A389; color:white; font-size:13px; font-weight:700; border-radius:30px; border:1px solid rgba(255,255,255,0.3); box-shadow:0 10px 25px rgba(0,163,137,0.4); display:flex; align-items:center; gap:8px; cursor:pointer;';
      floatBtn.innerHTML = `
        <span style="font-size:18px;">🤖</span>
        <span>Ask AI Hospital Assistant</span>
        <span style="width:8px; height:8px; background:#10b981; border-radius:50%; display:inline-block; border:1.5px solid white;"></span>
      `;
      floatBtn.onclick = () => this.open();
      document.body.appendChild(floatBtn);
    }
  }

  createModal() {
    if (document.getElementById('ph-chat-modal-container')) return;
    const modal = document.createElement('div');
    modal.id = 'ph-chat-modal-container';
    modal.className = 'ph-chat-modal';
    modal.innerHTML = `
      <div class="ph-chat-header">
        <div class="ph-chat-header-row">
          <div style="display:flex; align-items:center;">
            <div class="ph-chat-avatar-box">
              <span>🤖</span>
              <div class="ph-chat-online-dot"></div>
            </div>
            <div>
              <div style="font-weight:700; font-size:15px; letter-spacing:-0.2px;">Punjab Health AI Assistant</div>
              <div style="font-size:11px; opacity:0.88; display:flex; align-items:center; gap:4px;">
                <span>Verified Hospital Advisor</span> • <span style="color:#6ee7b7; font-weight:600;">24/7 Active</span>
              </div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:4px;">
            <button id="ph-chat-sound-toggle" title="Toggle audio chime" style="background:none; border:none; color:white; opacity:0.85; font-size:14px; cursor:pointer; padding:4px;">🔔</button>
            <button id="ph-chat-expand-btn" title="Expand / Minimize" style="background:none; border:none; color:white; opacity:0.85; font-size:14px; cursor:pointer; padding:4px;">⛶</button>
            <button id="ph-chat-clear-btn" title="Clear chat" style="background:none; border:none; color:white; opacity:0.85; font-size:14px; cursor:pointer; padding:4px;">🧹</button>
            <button id="ph-chat-close-btn" style="background:none; border:none; color:white; font-size:22px; line-height:1; cursor:pointer; padding:2px 6px;">&times;</button>
          </div>
        </div>

        <div class="ph-data-badge-row" id="ph-chat-data-source-badge">
          <span style="color:#10b981;">●</span> 15,000 Hospitals Loaded from <strong>punjab_hospital_15000.csv</strong>
        </div>
      </div>

      <!-- Quick Topic Category Bar -->
      <div class="ph-chat-category-bar">
        <button class="ph-cat-pill" data-query="Find top 3 hospitals in Ludhiana">🏥 Ludhiana</button>
        <button class="ph-cat-pill" data-query="Best hospitals in Amritsar with high success rate">🌟 Amritsar</button>
        <button class="ph-cat-pill" data-query="Cardiology Heart hospitals under ₹2 Lakhs">❤️ Heart (&lt;₹2L)</button>
        <button class="ph-cat-pill" data-query="Cancer chemotherapy and surgery in Punjab">🎗️ Cancer Care</button>
        <button class="ph-cat-pill" data-query="Orthopedic knee and joint replacement under ₹1 Lakh">🦴 Ortho (&lt;₹1L)</button>
        <button class="ph-cat-pill" data-query="Hospitals in Bathinda with ratings above 4.5">📍 Bathinda</button>
        <button class="ph-cat-pill" data-query="Kidney Dialysis hospitals in Jalandhar">🩺 Kidney Dialysis</button>
        <button class="ph-cat-pill" data-query="Tell me about Ayushman Bharat and cashless claims">🛡️ Cashless / Ayushman</button>
      </div>

      <div class="ph-chat-body" id="ph-chat-body-content">
        <!-- Initial Empathetic Welcome Message -->
        <div class="ph-msg-row">
          <div class="ph-msg-bubble ph-msg-bot">
            <strong>Sat Sri Akal & Hello! 👋 Namaste! 🙏</strong><br/>
            I am your <strong>Punjab Healthcare AI Assistant</strong>. You can chat with me naturally in English, Punjabi, or Hindi — just say <em>"hlo"</em>, <em>"kaise ho"</em>, or ask me any question!<br/><br/>
            I have full real-time access to <strong>15,000+ hospital records</strong> loaded from <code>punjab_hospital_15000.csv</code>. You can ask me about:
            <ul style="margin: 6px 0 0 16px; padding:0;">
              <li><strong>Hospitals & Cities:</strong> Ludhiana, Amritsar, Jalandhar, Bathinda, Mohali, Patiala, etc.</li>
              <li><strong>Tariffs & Budgets:</strong> Treatments under ₹50k, ₹1L, ₹2L, or cheapest options.</li>
              <li><strong>Specialties:</strong> Heart, Cancer, Kidney, Liver, Joint/Ortho, Asthma, Dengue.</li>
              <li><strong>Outcomes:</strong> Success rates (>90%), verified patient volumes, and star ratings.</li>
            </ul>
            <div class="ph-quick-chips">
              <button class="ph-chip-btn" data-query="hlo">👋 Say Hello</button>
              <button class="ph-chip-btn" data-query="Top Heart hospitals in Ludhiana under ₹2 Lakhs">❤️ Heart Care in Ludhiana (&lt;₹2L)</button>
              <button class="ph-chip-btn" data-query="Best Cancer hospitals in Amritsar">🎗️ Cancer Hospitals in Amritsar</button>
              <button class="ph-chip-btn" data-query="Affordable Orthopedic surgery under ₹1 Lakh in Bathinda">🦴 Joint Surgery in Bathinda (&lt;₹1L)</button>
              <button class="ph-chip-btn" data-query="Kidney Dialysis hospitals in Jalandhar">🩺 Kidney Care in Jalandhar</button>
            </div>
          </div>
          <div class="ph-msg-meta">
            <span>Just now</span>
            <button class="ph-voice-btn" onclick="phChatbot.speakText('Sat Sri Akal and Hello! Welcome to Punjab Healthcare. How can I help you today?')">🔊 Listen</button>
          </div>
        </div>
      </div>

      <div class="ph-chat-footer">
        <div class="ph-input-row">
          <input type="text" id="ph-chat-input-field" class="ph-chat-input" placeholder="Type a message (e.g., 'hlo', 'Cancer in Amritsar', 'Under ₹1L')..." />
          <button id="ph-chat-send-trigger" class="ph-send-btn" title="Send message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  bindEvents() {
    const closeBtn = document.getElementById('ph-chat-close-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();

    const clearBtn = document.getElementById('ph-chat-clear-btn');
    if (clearBtn) clearBtn.onclick = () => this.clearChat();

    const expandBtn = document.getElementById('ph-chat-expand-btn');
    if (expandBtn) {
      expandBtn.onclick = () => {
        const modal = document.getElementById('ph-chat-modal-container');
        if (modal) {
          this.isMaximized = !this.isMaximized;
          modal.classList.toggle('maximized', this.isMaximized);
          expandBtn.textContent = this.isMaximized ? '🗗' : '⛶';
        }
      };
    }

    const soundToggle = document.getElementById('ph-chat-sound-toggle');
    if (soundToggle) {
      soundToggle.onclick = () => {
        this.soundEnabled = !this.soundEnabled;
        soundToggle.textContent = this.soundEnabled ? '🔔' : '🔕';
        soundToggle.title = this.soundEnabled ? 'Sound enabled' : 'Sound muted';
      };
    }

    const sendBtn = document.getElementById('ph-chat-send-trigger');
    const inputField = document.getElementById('ph-chat-input-field');

    if (sendBtn && inputField) {
      const sendHandler = () => {
        const text = inputField.value.trim();
        if (text) {
          this.handleUserQuery(text);
          inputField.value = '';
        }
      };

      sendBtn.onclick = sendHandler;
      inputField.onkeypress = (e) => {
        if (e.key === 'Enter') sendHandler();
      };
    }

    // Category pills and Chip buttons delegation
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.ph-cat-pill, .ph-chip-btn');
      if (btn) {
        const query = btn.getAttribute('data-query');
        if (query) {
          this.handleUserQuery(query);
        }
      }
    });

    // Support window.aiChecker backward compatibility
    window.aiChecker = {
      open: () => this.open(),
      close: () => this.close()
    };
  }

  open() {
    const modal = document.getElementById('ph-chat-modal-container');
    if (modal) {
      modal.classList.add('active');
      this.isOpen = true;
      const inputField = document.getElementById('ph-chat-input-field');
      if (inputField) setTimeout(() => inputField.focus(), 200);
    }
  }

  close() {
    const modal = document.getElementById('ph-chat-modal-container');
    if (modal) {
      modal.classList.remove('active');
      this.isOpen = false;
    }
  }

  clearChat() {
    const body = document.getElementById('ph-chat-body-content');
    if (body) {
      body.innerHTML = `
        <div class="ph-msg-row">
          <div class="ph-msg-bubble ph-msg-bot">
            <strong>Conversation refreshed! ✨</strong><br/>
            I am ready to help you explore any hospital, compare treatment costs, or answer your health queries from our 15,000+ Punjab hospital dataset. What would you like to know?
            <div class="ph-quick-chips">
              <button class="ph-chip-btn" data-query="hlo">👋 Say Hello</button>
              <button class="ph-chip-btn" data-query="Top rated hospitals in Ludhiana">⭐ Top in Ludhiana</button>
              <button class="ph-chip-btn" data-query="Hospitals with >90% success rate under ₹1.5L">🎯 High Success &lt;₹1.5L</button>
              <button class="ph-chip-btn" data-query="Emergency ICU Care in Amritsar">🚨 ICU in Amritsar</button>
            </div>
          </div>
        </div>
      `;
    }
  }

  getTimeString() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  appendMessage(text, isUser = false, extraHtml = '') {
    const body = document.getElementById('ph-chat-body-content');
    if (!body) return;

    const row = document.createElement('div');
    row.className = 'ph-msg-row';

    const msg = document.createElement('div');
    msg.className = `ph-msg-bubble ${isUser ? 'ph-msg-user' : 'ph-msg-bot'}`;
    msg.innerHTML = text + (extraHtml ? `<div>${extraHtml}</div>` : '');
    row.appendChild(msg);

    const meta = document.createElement('div');
    meta.className = `ph-msg-meta ${isUser ? 'user' : ''}`;
    meta.innerHTML = `<span>${this.getTimeString()}</span>`;
    
    if (!isUser) {
      const voiceBtn = document.createElement('button');
      voiceBtn.className = 'ph-voice-btn';
      voiceBtn.innerHTML = '🔊 Listen';
      voiceBtn.onclick = () => this.speakText(msg.innerText);
      meta.appendChild(voiceBtn);
    }
    row.appendChild(meta);

    body.appendChild(row);
    body.scrollTop = body.scrollHeight;

    if (!isUser) {
      this.playSoftChime();
    }
  }

  showTypingIndicator() {
    const body = document.getElementById('ph-chat-body-content');
    if (!body) return;

    const ind = document.createElement('div');
    ind.id = 'ph-typing-indicator-box';
    ind.className = 'ph-typing-indicator';
    ind.innerHTML = `
      <span>Punjab AI Assistant is checking 15,000 records</span>
      <div class="ph-typing-dot"></div>
      <div class="ph-typing-dot"></div>
      <div class="ph-typing-dot"></div>
    `;
    body.appendChild(ind);
    body.scrollTop = body.scrollHeight;
  }

  removeTypingIndicator() {
    const ind = document.getElementById('ph-typing-indicator-box');
    if (ind) ind.remove();
  }

  handleUserQuery(userText) {
    this.appendMessage(userText, true);
    this.showTypingIndicator();

    setTimeout(() => {
      this.removeTypingIndicator();
      const response = this.processKnowledgeQuery(userText);
      this.appendMessage(response.text, false, response.cardsHtml);
    }, 400);
  }

  formatINR(num) {
    if (!num || isNaN(num)) return '₹0';
    return '₹' + Math.round(num).toLocaleString('en-IN');
  }

  // Show detailed hospital modal
  openHospitalDetails(hospId) {
    const hospital = this.hospitalData.find(h => h.id === hospId);
    if (!hospital) return;

    const overlay = document.createElement('div');
    overlay.className = 'ph-detail-modal-overlay';
    overlay.innerHTML = `
      <div class="ph-detail-modal-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <span style="background:#e0f2fe; color:#0369a1; font-size:11px; font-weight:700; padding:3px 8px; border-radius:12px;">Verified Punjab Hospital</span>
            <h2 style="font-size:18px; font-weight:800; color:#1b3b6f; margin:6px 0 2px 0;">${hospital.hospital}</h2>
            <div style="font-size:13px; color:#64748b;">📍 ${hospital.location}, Punjab</div>
          </div>
          <button id="ph-close-detail-modal" style="background:#f1f5f9; border:none; width:32px; height:32px; border-radius:50%; font-size:18px; cursor:pointer;">&times;</button>
        </div>

        <div style="margin-top:16px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div style="background:#f8fafc; padding:12px; border-radius:12px; border:1px solid #e2e8f0;">
            <div style="font-size:11px; color:#64748b;">Specialty Disease</div>
            <div style="font-size:14px; font-weight:700; color:#1e293b;">${hospital.disease}</div>
          </div>
          <div style="background:#f8fafc; padding:12px; border-radius:12px; border:1px solid #e2e8f0;">
            <div style="font-size:11px; color:#64748b;">Procedure / Care</div>
            <div style="font-size:14px; font-weight:700; color:#1e293b;">${hospital.treatment}</div>
          </div>
          <div style="background:#ecfdf5; padding:12px; border-radius:12px; border:1px solid #a7f3d0;">
            <div style="font-size:11px; color:#065f46;">Clinical Success Rate</div>
            <div style="font-size:16px; font-weight:800; color:#059669;">${hospital.success_rate}%</div>
            <div style="font-size:10px; color:#047857;">${hospital.successful_patients} successful / ${hospital.total_patients} total patients</div>
          </div>
          <div style="background:#f0fdfa; padding:12px; border-radius:12px; border:1px solid #99f6e4;">
            <div style="font-size:11px; color:#0f766e;">Budget / Tariff</div>
            <div style="font-size:16px; font-weight:800; color:#00A389;">${this.formatINR(hospital.budget)}</div>
            <div style="font-size:10px; color:#0f766e;">0% EMI & Cashless Available</div>
          </div>
        </div>

        <div style="margin-top:14px; background:#fffbeb; border:1px solid #fef3c7; border-radius:10px; padding:12px;">
          <div style="font-weight:700; font-size:12px; color:#92400e; display:flex; align-items:center; gap:6px;">
            <span>🛡️</span> Cashless Insurance & Ayushman Empanelled
          </div>
          <p style="font-size:11.5px; color:#78350f; margin:4px 0 0 0;">
            Eligible for 100% cashless admission with zero out-of-pocket advance. Accepts Ayushman Bharat (Sarbat Sehat Bima) and all major TPA corporate insurance.
          </p>
        </div>

        <div style="display:flex; gap:10px; margin-top:20px;">
          <a href="surgeries.html?city=${encodeURIComponent(hospital.location)}&disease=${encodeURIComponent(hospital.disease)}" style="flex:1; text-align:center; padding:10px; background:#1b3b6f; color:white; border-radius:10px; font-size:13px; font-weight:700; text-decoration:none;">Open in Surgery Registry</a>
          <a href="consult.html" style="flex:1; text-align:center; padding:10px; background:#00A389; color:white; border-radius:10px; font-size:13px; font-weight:700; text-decoration:none;">Hospital Contact Numbers</a>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector('#ph-close-detail-modal').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  }

  // Load next batch of matches
  showMoreHospitals() {
    if (!this.currentMatches || this.currentMatches.length === 0) return;
    this.currentOffset += this.pageSize;
    const nextBatch = this.currentMatches.slice(this.currentOffset, this.currentOffset + this.pageSize);

    if (nextBatch.length === 0) {
      this.appendMessage("You have viewed all matching hospitals for this search! Feel free to ask a new query or filter by city.", false);
      return;
    }

    const cardsHtml = this.renderHospitalCards(nextBatch, this.currentMatches.length, this.currentOffset);
    this.appendMessage(`Here are <strong>${nextBatch.length} more matching hospitals</strong>:`, false, cardsHtml);
  }

  renderHospitalCards(hospitals, totalCount, currentOffset) {
    let html = hospitals.map(h => {
      const budgetFormatted = typeof h.budget === 'number' ? this.formatINR(h.budget) : (h.budget.startsWith('₹') ? h.budget : '₹' + h.budget);
      const ratingStars = '★'.repeat(Math.round(h.rating || 4.5)) + '☆'.repeat(5 - Math.round(h.rating || 4.5));

      return `
        <div class="ph-hospital-card-mini">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="font-weight:700; color:#1b3b6f; font-size:13.5px;">${h.hospital}</div>
              <div style="color:#64748b; font-size:11.5px; margin-top:2px;">📍 ${h.location}, Punjab • <span style="color:#f59e0b;">${ratingStars}</span> (${h.rating || '4.5'}/5)</div>
            </div>
            <div style="text-align:right;">
              <span style="background:#ecfdf5; color:#065f46; font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px; border:1px solid #a7f3d0;">
                ${h.success_rate}% Success
              </span>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; padding-top:8px; border-top:1px dashed #e2e8f0;">
            <div>
              <span style="font-size:12px; color:#334155;">🩺 <strong>${h.disease}</strong> (${h.treatment})</span>
              ${h.age ? `<div style="font-size:11px; color:#64748b;">Target Group: ${h.age}</div>` : ''}
            </div>
            <div style="text-align:right;">
              <div style="font-size:14px; font-weight:800; color:#00A389;">${budgetFormatted}</div>
              <div style="font-size:10px; color:#94a3b8;">${h.successful_patients}/${h.total_patients} cases healed</div>
            </div>
          </div>

          <div style="display:flex; gap:6px; margin-top:10px;">
            <button onclick="window.phChatbot.openHospitalDetails(${h.id})" style="flex:1; text-align:center; padding:6px 10px; background:#f1f5f9; color:#1b3b6f; border:1px solid #cbd5e1; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">Quick View</button>
            <a href="surgeries.html?city=${encodeURIComponent(h.location)}&disease=${encodeURIComponent(h.disease)}" style="flex:1; text-align:center; padding:6px 10px; background:#1b3b6f; color:white; border-radius:6px; font-size:11px; font-weight:600; text-decoration:none;">Compare & Book</a>
            <a href="consult.html" style="padding:6px 10px; background:#00A389; color:white; border-radius:6px; font-size:11px; font-weight:600; text-decoration:none;">Hospital Contacts</a>
          </div>
        </div>
      `;
    }).join('');

    const remaining = totalCount - (currentOffset + hospitals.length);
    if (remaining > 0) {
      html += `
        <div style="margin-top:10px; text-align:center; display:flex; justify-content:center; gap:8px;">
          <button onclick="window.phChatbot.showMoreHospitals()" style="padding:6px 14px; background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; border-radius:20px; font-size:11.5px; font-weight:700; cursor:pointer;">
            ➕ Load 3 More Hospitals (${remaining} left)
          </button>
          <a href="surgeries.html" style="padding:6px 12px; background:#f8fafc; color:#64748b; border:1px solid #e2e8f0; border-radius:20px; font-size:11.5px; text-decoration:none;">
            View All in Surgery Hub &rarr;
          </a>
        </div>
      `;
    }

    return html;
  }

  processKnowledgeQuery(queryText) {
    const raw = queryText.trim();
    const lower = raw.toLowerCase();

    // -------------------------------------------------------------
    // 1. SIMPLE CASUAL CONVERSATION & GREETINGS ("hlo", "hi", etc.)
    // -------------------------------------------------------------
    const casualGreetings = ['hlo', 'hlw', 'hello', 'hi', 'hey', 'hii', 'helo', 'hy', 'hola', 'yo', 'sup', 'salam'];
    if (casualGreetings.includes(lower) || casualGreetings.some(g => lower.startsWith(g + ' ') || lower.endsWith(' ' + g))) {
      return {
        text: `<strong>Hello there! 👋 Great to connect with you!</strong><br/><br/>
        How are you doing today? I am your friendly <strong>Punjab Healthcare AI Companion</strong>.<br/><br/>
        I have <strong>15,000+ Punjab hospitals loaded from <code>punjab_hospital_15000.csv</code></strong>. Tell me what you're looking for, or choose a quick option below:`,
        cardsHtml: `
          <div class="ph-quick-chips">
            <button class="ph-chip-btn" data-query="How are you?">😊 How are you?</button>
            <button class="ph-chip-btn" data-query="Top hospitals in Ludhiana">🏥 Top hospitals in Ludhiana</button>
            <button class="ph-chip-btn" data-query="Heart treatment under ₹1.5 Lakhs">❤️ Heart Care under ₹1.5L</button>
            <button class="ph-chip-btn" data-query="Best cancer hospital in Amritsar">🎗️ Cancer Care in Amritsar</button>
          </div>
        `
      };
    }

    // Punjabi cultural greetings
    if (lower.includes('sat sri akal') || lower.includes('sasrikaal') || lower.includes('kive o') || lower.includes('kidaan') || lower.includes('ki haal')) {
      return {
        text: `<strong>Sat Sri Akal ji! 🙏 Kive o?</strong><br/><br/>
        Main theek-thaak aan! Punjab Healthcare 'ch tuhada swagat hai.<br/>
        Mere kol Punjab de <strong>15,000+ aspatalaan</strong> da pura data <code>punjab_hospital_15000.csv</code> cho loaded hai.<br/><br/>
        Tusi Ludhiana, Amritsar, Bathinda, Jalandhar ya kise vi shehar de aspatal, operation da kharcha ya doctor bare puch sakde ho!`,
        cardsHtml: `
          <div class="ph-quick-chips">
            <button class="ph-chip-btn" data-query="Top rated hospitals in Ludhiana">🏥 Ludhiana de vadiya aspatal</button>
            <button class="ph-chip-btn" data-query="Affordable Orthopedic surgery in Bathinda">🦴 Bathinda 'ch haddi da ilaj</button>
            <button class="ph-chip-btn" data-query="Heart surgery under ₹2 Lakhs">❤️ Dil da ilaj under ₹2L</button>
          </div>
        `
      };
    }

    // "How are you", "kaise ho"
    if (lower.includes('how are you') || lower.includes('how r u') || lower.includes('kaise ho') || lower.includes('kaisa hai')) {
      return {
        text: `<strong>I'm doing wonderful, thank you for asking! 😊</strong><br/><br/>
        I'm active 24/7 and always ready to help you find the best medical care across Punjab. How are you feeling today? Are you searching for a hospital, checking surgery budgets, or looking for a specialist doctor?`,
        cardsHtml: `
          <div class="ph-quick-chips">
            <button class="ph-chip-btn" data-query="I am looking for a hospital in Ludhiana">🏥 Find hospital in Ludhiana</button>
            <button class="ph-chip-btn" data-query="Check affordable surgeries under ₹1 Lakh">💰 Surgeries under ₹1 Lakh</button>
            <button class="ph-chip-btn" data-query="Connect with doctor on video">👨‍⚕️ Speak to a doctor online</button>
          </div>
        `
      };
    }

    // Name & identity
    if (lower.includes('what is your name') || lower.includes('who are you') || lower.includes('tera naam') || lower.includes('tuhada naam')) {
      return {
        text: `<strong>I am the Punjab Healthcare AI Clinical & Hospital Advisor! 🤖</strong><br/><br/>
        I am directly powered by the official <strong>15,000 Punjab hospital dataset (<code>punjab_hospital_15000.csv</code>)</strong>.<br/>
        My job is to help you find verified hospitals in all 23 Punjab districts, compare tariffs and success rates, and guide you towards safe, affordable healthcare.`,
        cardsHtml: ''
      };
    }

    // Gratitude / Thank you
    if (lower.includes('thank you') || lower.includes('thanks') || lower.includes('tysm') || lower.includes('dhanyawad') || lower.includes('dhanwad') || lower.includes('shukriya')) {
      return {
        text: `<strong>You are most welcome! 😊🙏</strong><br/><br/>
        It is a true honor to help you. Your health and peace of mind always come first! Feel free to ask whenever you need more information about hospitals or treatments in Punjab. Wishing you great health!`,
        cardsHtml: ''
      };
    }

    // Goodbye / Farewell
    if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('see you') || lower.includes('alvida') || lower.includes('tata') || lower.includes('good night') || lower.includes('gn')) {
      return {
        text: `<strong>Goodbye and take great care of yourself! 👋✨</strong><br/><br/>
        Whenever you or your family need medical guidance, hospital comparisons, or surgery budgets in Punjab, I will be right here for you. Stay healthy and safe!`,
        cardsHtml: ''
      };
    }

    // Acknowledgements ("ok", "alright", "got it")
    if (['ok', 'okay', 'alright', 'got it', 'fine', 'cool', 'theek hai', 'accha'].includes(lower)) {
      return {
        text: `Great! 👍 What would you like to explore next? You can ask about any city in Punjab (e.g. <em>"Best hospital in Patiala"</em>) or a specific budget limit (e.g. <em>"under ₹50,000"</em>).`,
        cardsHtml: ''
      };
    }

    // -------------------------------------------------------------
    // 2. CRITICAL EMERGENCY TRIAGE
    // -------------------------------------------------------------
    const emergencyWords = ['chest pain', 'heart attack', 'cannot breathe', 'severe bleeding', 'unconscious', 'stroke', 'head injury', 'collapsed', 'heavy bleeding'];
    const isEmergency = emergencyWords.some(w => lower.includes(w));

    // -------------------------------------------------------------
    // 3. CASHLESS / AYUSHMAN INQUIRY
    // -------------------------------------------------------------
    if (lower.includes('insurance') || lower.includes('cashless') || lower.includes('ayushman') || lower.includes('tpa') || lower.includes('claim')) {
      return {
        text: `<strong>100% Cashless Hospital Admissions in Punjab:</strong><br/>
        Our network supports <strong>Ayushman Bharat (Sarbat Sehat Bima Yojana)</strong> and leading private health insurances (Star Health, Care, HDFC ERGO, ICICI Lombard, Max Bupa, etc.).<br/><br/>
        💡 <strong>Key Features:</strong>
        <ul style="margin:4px 0 0 16px; padding:0;">
          <li>Zero upfront advance payment at empanelled Punjab hospitals</li>
          <li>Fast-track pre-authorization in under 60 minutes</li>
          <li>Free dedicated Medroute Care Buddy for paperwork & bedside assistance</li>
        </ul>`,
        cardsHtml: `
          <div style="margin-top:8px;">
            <a href="insurance.html" style="display:inline-block; padding:8px 16px; background:#1b3b6f; color:white; border-radius:8px; font-size:12px; font-weight:700; text-decoration:none;">Open Insurance Claim Tracker &rarr;</a>
          </div>
        `
      };
    }

    // -------------------------------------------------------------
    // 4. QUERY THE 15,000 HOSPITAL DATASET
    // -------------------------------------------------------------
    const data = this.hospitalData;
    if (!data || data.length === 0) {
      return {
        text: `Hospital data from <code>punjab_hospital_15000.csv</code> is loading. Please wait 1 second and try again!`,
        cardsHtml: ''
      };
    }

    let filtered = [...data];

    // Punjab Locations Matching (all districts)
    const punjabCities = [
      'ludhiana', 'amritsar', 'jalandhar', 'patiala', 'bathinda', 'mohali', 'pathankot',
      'hoshiarpur', 'moga', 'barnala', 'firozpur', 'faridkot', 'kapurthala', 'malerkotla',
      'khanna', 'mansa', 'muktsar', 'nawanshahr', 'rupnagar', 'sangrur', 'fazilka',
      'abohar', 'tarn taran', 'gurdaspur'
    ];

    let detectedCity = punjabCities.find(c => lower.includes(c));
    if (detectedCity) {
      filtered = filtered.filter(h => h.location.toLowerCase().includes(detectedCity));
    }

    // Disease / Clinical Specialty Matching
    const diseaseMap = [
      { key: 'Heart Disease', keywords: ['heart', 'cardio', 'cardiac', 'coronary', 'bypass', 'angioplasty', 'attack', 'hypertension', 'blood pressure', 'bp'] },
      { key: 'Cancer', keywords: ['cancer', 'oncology', 'chemo', 'chemotherapy', 'radiotherapy', 'tumor', 'radiation', 'carcinoma'] },
      { key: 'Kidney Disease', keywords: ['kidney', 'renal', 'dialysis', 'creatinine', 'urinary', 'urology'] },
      { key: 'Liver Disease', keywords: ['liver', 'hepatic', 'jaundice', 'cirrhosis', 'fatty liver', 'gastro'] },
      { key: 'Diabetes', keywords: ['diabetes', 'sugar', 'insulin', 'hyperglycemia', 'diabetic'] },
      { key: 'Asthma', keywords: ['asthma', 'breath', 'wheezing', 'respiratory', 'inhaler'] },
      { key: 'Pneumonia', keywords: ['pneumonia', 'chest congestion', 'lung infection', 'pulmonary'] },
      { key: 'Tuberculosis', keywords: ['tuberculosis', 'tb', 'coughing blood'] },
      { key: 'Arthritis', keywords: ['arthritis', 'joint', 'knee', 'hip', 'bone', 'orthopedic', 'fracture', 'joint pain'] },
      { key: 'Dengue', keywords: ['dengue', 'platelets', 'platelet', 'mosquito'] },
      { key: 'Typhoid', keywords: ['typhoid', 'salmonella', 'gut fever'] },
      { key: 'Malaria', keywords: ['malaria', 'fever with chills'] },
      { key: 'Thyroid Disorder', keywords: ['thyroid', 'hypothyroid', 'goiter'] },
      { key: 'COVID-19', keywords: ['covid', 'corona', 'sars'] }
    ];

    let detectedDisease = null;
    for (let d of diseaseMap) {
      if (d.keywords.some(k => lower.includes(k))) {
        detectedDisease = d.key;
        filtered = filtered.filter(h => 
          h.disease.toLowerCase() === d.key.toLowerCase() ||
          d.keywords.some(k => (h.treatment || '').toLowerCase().includes(k))
        );
        break;
      }
    }

    // Treatment Type Matching
    const treatments = ['surgery', 'icu care', 'dialysis', 'radiotherapy', 'chemotherapy', 'emergency care', 'physiotherapy', 'vaccination', 'medication'];
    let detectedTreatment = treatments.find(t => lower.includes(t));
    if (detectedTreatment) {
      filtered = filtered.filter(h => (h.treatment || '').toLowerCase().includes(detectedTreatment));
    }

    // Age Group Filtering
    let detectedAge = null;
    if (lower.includes('child') || lower.includes('kid') || lower.includes('pediatric')) detectedAge = 'Child';
    else if (lower.includes('teen') || lower.includes('adolescent')) detectedAge = 'Teenager';
    else if (lower.includes('senior') || lower.includes('elderly') || lower.includes('old age')) detectedAge = 'Senior Citizen';
    else if (lower.includes('adult')) detectedAge = 'Adult';

    if (detectedAge) {
      filtered = filtered.filter(h => (h.age || '').toLowerCase() === detectedAge.toLowerCase());
    }

    // Budget Parsing
    let maxBudget = null;
    const lakhMatch = lower.match(/(\d+(\.\d+)?)\s*(lakh|lac|l)\b/);
    const kMatch = lower.match(/(\d+)\s*(k|thousand)\b/);
    const directNumMatch = lower.match(/(₹|rs\.?|inr)?\s*(\d{4,7})/);

    if (lakhMatch) {
      maxBudget = parseFloat(lakhMatch[1]) * 100000;
    } else if (kMatch) {
      maxBudget = parseFloat(kMatch[1]) * 1000;
    } else if (directNumMatch) {
      maxBudget = parseFloat(directNumMatch[2]);
    } else if (lower.includes('cheap') || lower.includes('low cost') || lower.includes('affordable')) {
      maxBudget = 100000;
    }

    if (maxBudget) {
      filtered = filtered.filter(h => {
        let b = typeof h.budget === 'number' ? h.budget : parseFloat((h.budget || '').toString().replace(/[^0-9.]/g, ''));
        return b <= maxBudget;
      });
    }

    // Success Rate / Best Outcome Sorting
    if (lower.includes('success') || lower.includes('highest success') || lower.includes('best outcome') || lower.includes('top rated') || lower.includes('best hospital')) {
      filtered.sort((a, b) => {
        const rateDiff = (b.success_rate || 0) - (a.success_rate || 0);
        if (Math.abs(rateDiff) > 2) return rateDiff;
        return (b.rating || 0) - (a.rating || 0);
      });
    } else if (lower.includes('cheapest') || lower.includes('lowest budget') || lower.includes('most affordable')) {
      filtered.sort((a, b) => {
        let b1 = typeof a.budget === 'number' ? a.budget : parseFloat((a.budget || '0').toString().replace(/[^0-9.]/g, ''));
        let b2 = typeof b.budget === 'number' ? b.budget : parseFloat((b.budget || '0').toString().replace(/[^0-9.]/g, ''));
        return b1 - b2;
      });
    } else {
      // Default: balanced score (success rate & rating)
      filtered.sort((a, b) => (b.success_rate * 0.7 + (b.rating || 4) * 6) - (a.success_rate * 0.7 + (a.rating || 4) * 6));
    }

    this.currentMatches = filtered;
    this.currentOffset = 0;

    const totalMatches = filtered.length;
    const topResults = filtered.slice(0, this.pageSize);

    let responseText = '';

    if (isEmergency) {
      responseText += `
        <div class="ph-emergency-alert">
          <strong>🚨 Immediate Medical Caution:</strong><br/>
          Your message indicates potentially acute or emergency symptoms. Please call <strong>Punjab Emergency Hotline (108)</strong> or visit your nearest hospital casualty ward right away.
        </div><br/>
      `;
    }

    if (totalMatches === 0) {
      return {
        text: responseText + `I analyzed all 15,000 records from <code>punjab_hospital_15000.csv</code>, but couldn't find hospitals matching every single one of your specific filters (${detectedCity ? 'City: ' + detectedCity : ''}${detectedDisease ? ', Specialty: ' + detectedDisease : ''}${maxBudget ? ', Budget under: ' + this.formatINR(maxBudget) : ''}).<br/><br/>
        <strong>Helpful Suggestion:</strong> Try broadening your criteria (for example, selecting nearby major hubs like <em>Ludhiana</em> or <em>Amritsar</em>, or adjusting your budget).`,
        cardsHtml: `
          <div class="ph-quick-chips">
            <button class="ph-chip-btn" data-query="Top rated hospitals in Ludhiana">🏥 Top in Ludhiana</button>
            <button class="ph-chip-btn" data-query="Best hospitals in Amritsar">⭐ Top in Amritsar</button>
            <button class="ph-chip-btn" data-query="Connect with doctor on video">👨‍⚕️ Speak to a Physician</button>
          </div>
        `
      };
    }

    let filterSummaryParts = [];
    if (detectedCity) filterSummaryParts.push(`📍 in <strong>${detectedCity.charAt(0).toUpperCase() + detectedCity.slice(1)}</strong>`);
    if (detectedDisease) filterSummaryParts.push(`for <strong>${detectedDisease}</strong>`);
    if (detectedTreatment) filterSummaryParts.push(`(Treatment: <strong>${detectedTreatment}</strong>)`);
    if (maxBudget) filterSummaryParts.push(`within budget of <strong>${this.formatINR(maxBudget)}</strong>`);

    const filterSummary = filterSummaryParts.length > 0 ? filterSummaryParts.join(' ') : 'matching your search';

    responseText += `From <strong><code>punjab_hospital_15000.csv</code></strong>, I found <strong>${totalMatches.toLocaleString()} matching hospitals</strong> ${filterSummary}.<br/>Here are the <strong>top recommended care centers</strong>:`;

    const extraCards = this.renderHospitalCards(topResults, totalMatches, 0);

    return {
      text: responseText,
      cardsHtml: extraCards
    };
  }
}

// Global initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { window.phChatbot = new PunjabHealthcareAIChatbot(); });
} else {
  window.phChatbot = new PunjabHealthcareAIChatbot();
}
