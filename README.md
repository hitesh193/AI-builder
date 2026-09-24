# Punjab Healthcare - Digital Healthcare Network..

**Punjab Healthcare** is a production-grade digital healthcare platform.

---

## 🌟 Core Features & Specifications (Matching MediBuddy)

1. **Hospital Contact Numbers & Helplines Directory (`consult.html`)**:
   - Official direct telephone contact numbers and helplines for premier hospitals across all 24 Punjab districts.
   - Direct-dial casualty emergency desks, ambulance dispatch (108), reception/OPD booking, and cashless TPA desks.
   - Comprehensive contact extensions for CMC Ludhiana, DMCH, Fortis Mohali, Max Super Speciality, SGRD Amritsar, Patel Hospital, etc.
   - Integrated live directory search over the complete 15,000 Punjab hospital dataset.

2. **Diagnostic Lab Tests & Health Packages (`lab-tests.html`)**:
   - NABL-accredited diagnostic partner network (Thyrocare, Metropolis, Dr. Lal PathLabs).
   - Packages: Comprehensive Full Body Checkup (86 parameters), Diabetic Care 360, Women’s Hormonal Wellness, Senior Citizen Vital Screen.
   - Interactive modal showing all individual test biomarkers, preparation rules (fasting), and specimen types.
   - Free home sample collection by certified phlebotomists.

3. **Online Pharmacy & Medicines (`pharmacy.html`)**:
   - 100% authentic branded and generic medicines across Chronic Care (BP, Diabetes, Thyroid, Cardiac), Antibiotics, Pain relief, and Vitamins.
   - Prescription Upload Dropzone with automated verification feedback.
   - Category filtering, generic salt alternatives, strip sizes, and flat 20% discounts.

4. **Surgery Care & Care Buddy (`surgeries.html`)**:
   - 50+ common elective & day-care procedures (Cataract, Gallbladder stones, Hernia, Total Knee Replacement, Piles, Kidney Stones, LASIK).
   - Dedicated **Punjab Healthcare Care Buddy** personal concierge assisting with surgeon selection, insurance pre-auth, and bedside discharge.
   - Free Second Opinion request modal.

5. **Medroute Gold Membership (`gold.html`)**:
   - MediBuddy Gold equivalent health pass.
   - Unlimited 24/7 video consults for up to 6 family members.
   - Free follow-ups, flat 20% off medicines, and ₹0 home collection fees.
   - Membership tiers: 3 Months (₹499), 1 Year Family Care (₹999), 1 Year Platinum (₹1,799 with free full body checkup).
   - 1-Click activation that applies ₹0 fees site-wide.

6. **Insurance & Corporate TPA Hub (`insurance.html`)**:
   - **Cashless Network Hospitals Locator**: Premier accredited institutions across Punjab districts including Ludhiana, Mohali, Amritsar, Jalandhar, Bathinda, and Patiala (CMC Ludhiana, Fortis Mohali, DMCH, Max Mohali, SGRD Amritsar, Patel Hospital Jalandhar, Max Bathinda, Rajindra Hospital Patiala).
   - **Live Cashless Claim Tracker**: Enter Claim ID (`MED-78291` or `MED-44120`) to view real-time multi-step progress (Intimation $\rightarrow$ TPA Verification $\rightarrow$ Pre-Auth Issued $\rightarrow$ Hospitalization $\rightarrow$ Settlement).
   - Corporate Health Wallet balance preview (₹12,500 allowance).

7. **Patient Health Records (PHR) & Dashboard (`dashboard.html`)**:
   - Track active doctor video appointments.
   - Track medicine orders and delivery progress.
   - Interactive **Digital Lab Report Viewer & Printer** with biological reference intervals and pathologist sign-off.

8. **Punjab Healthcare AI Assistant & Knowledge Chatbot (`js/ai-checker.js`)**:
   - 24/7 empathetic conversational AI assistant equipped with active listening, clinical triage protocols, and emergency detection.
   - Powered by real-time querying over the **15,000 Punjab hospital dataset** (`punjab_hospital_15000.csv` / `js/punjab_hospital_data.js`).
   - Natural language comprehension of budgets (e.g. "<₹1.5 Lakhs"), Punjab locations (Ludhiana, Amritsar, Bathinda, etc.), specialties (Cardiology, Oncology, Orthopedics, etc.), clinical success rates, and patient volumes.
   - Interactive hospital recommendation cards with instant booking & comparison routing.


---

## 🚀 Quick Start Instructions

### Option 1: One-Click Windows Batch Launcher
Double click `run.bat` in this folder:
```cmd
run.bat
```
This starts the local Python server and automatically launches Medroute in your default browser at `http://localhost:8000`.

### Option 2: Command Line (PowerShell)
```powershell
cd C:\Users\pc\.gemini\antigravity\scratch\medroute
python server.py
```
Open your browser to:
`http://localhost:8000/index.html`

---

## 📁 File Structure
```
medroute/
├── index.html          # Main landing page
├── consult.html        # Hospital contact numbers & 24x7 helplines directory
├── lab-tests.html      # Diagnostic lab packages & tests
├── pharmacy.html       # Online medicine ordering & Rx upload
├── surgeries.html      # Surgery care, Care Buddy & 0% EMI calculator
├── gold.html           # Medroute Gold membership plans
├── insurance.html      # Cashless hospital locator & claim tracker
├── dashboard.html      # PHR records, appointments & lab reports
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker for offline/PWA
├── server.py           # Python 3 backend HTTP server with mock REST API
├── run.bat             # One-click Windows launch script
├── css/
│   └── styles.css      # Custom healthcare typography & animations
└── js/
    ├── data.js         # Master registry (Hospitals, Doctors, Tests, Meds, Surgeries)
    ├── store.js        # Reactive state, Cart, Pincode API, Gold & Toasts
    ├── punjab_hospital_data.js # 15,000 Punjab hospital dataset for AI Chatbot & Telemetry
    ├── ai-checker.js   # Punjab Healthcare AI Assistant & Knowledge Chatbot
    └── main.js         # Universal search, cart drawer & modal controllers
```
