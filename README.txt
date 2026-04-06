╔═══════════════════════════════════════════════════════════════════╗
║                         SOL SKIES                                 ║
║           Decentralized Drone Marketplace on Solana               ║
╚═══════════════════════════════════════════════════════════════════╝

A peer-to-peer platform connecting drone operators with enterprises
for real-world missions — with on-chain SOL escrow, live weather,
NASA hazard alerts, and subtask-based pay splitting.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Frontend   React 19 + Vite, React Router v7
  Wallets    Solana Wallet Adapter (Phantom, Solflare)
  Blockchain Solana Devnet — @solana/web3.js v1.98
  Backend    Node.js (ESM) + Express.js
  Database   Flat JSON (db.json) via simple-db.mjs
  Maps       OpenStreetMap Nominatim (address autocomplete)
  Weather    OpenWeatherMap API + mock fallback
  Hazards    NASA EONET v3 (free, no key required)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PROJECT STRUCTURE — WHERE EACH FILE GOES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  "Solana shit/" is the root project folder.

  ┌── Solana shit/
  │   ├── server/                    ← CREATE this folder
  │   │   ├── index.mjs              ← Express API server
  │   │   ├── escrow.mjs             ← Solana devnet escrow logic
  │   │   ├── simple-db.mjs          ← JSON database helpers
  │   │   └── db.json                ← Auto-created on first run
  │   │
  │   ├── src/
  │   │   ├── pages/
  │   │   │   ├── SignUp.jsx
  │   │   │   ├── Home.jsx
  │   │   │   ├── Login.jsx
  │   │   │   ├── EnterpriseDashboard.jsx
  │   │   │   ├── EnterpriseProfile.jsx
  │   │   │   ├── OperatorProfile.jsx
  │   │   │   ├── MissionDetails.jsx
  │   │   │   └── operator/
  │   │   │       └── dashboard.jsx
  │   │   │
  │   │   ├── components/
  │   │   │   ├── ProtectedRoute.jsx
  │   │   │   ├── AddressAutocomplete.jsx
  │   │   │   ├── WeatherWidget.jsx
  │   │   │   ├── MapView.jsx
  │   │   │   └── ContractCard.jsx
  │   │   │
  │   │   ├── Context/
  │   │   │   ├── sessionContext.jsx
  │   │   │   └── WalletContext.jsx
  │   │   │
  │   │   └── App.jsx
  │   │
  │   └── package.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SETUP & RUNNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Install dependencies
     cd "Solana shit"
     npm install

  2. (Optional) Set weather API key for live conditions
     Create a .env file in the root:
       WEATHER_API_KEY=your_openweathermap_key_here
     Free key at: https://openweathermap.org/api
     Without a key, realistic mock weather data is used automatically.

  3. Start everything
     npm run dev:all

     This runs both the Express server (port 3001) and the
     Vite frontend (port 5173) at the same time.

  4. Open http://localhost:5173

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  WALLET SETUP (IMPORTANT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  This app runs on Solana DEVNET — not mainnet.
  You need devnet SOL (free) to create missions.

  Step 1 — Switch Phantom to Devnet:
    Phantom → Settings → Developer Settings → Change Network → Devnet

  Step 2 — Get free devnet SOL:
    Go to https://faucet.solana.com
    Paste your wallet address → Select Devnet → Request 5 SOL

  Your balance will show inside the Enterprise Dashboard
  with a live USD conversion.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HOW THE ESCROW WORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Escrow address: Dx9ey3aYGcpJn1XWNBknC2BvGBpS9TwGAWpRkFGTFf1m
  Network:        Solana Devnet

  1. Enterprise creates a mission and defines subtasks with
     individual SOL amounts per operator.

  2. The total SOL is transferred from the enterprise wallet
     to the escrow address on-chain (Phantom signs this).

  3. The server verifies the transaction signature on-chain
     using getParsedTransaction() before activating the mission.

  4. Operators browse missions and claim subtasks — each subtask
     is locked to the first operator who claims it.

  5. When enterprise marks a contract complete, the server
     signs a transfer from the escrow keypair to the operator's
     wallet address automatically — no wallet popup needed.

  6. Every transaction is visible on Solana Explorer (devnet):
     https://explorer.solana.com/?cluster=devnet

  The escrow keypair is server-held and devnet-only.
  On mainnet production this would be replaced with an
  Anchor on-chain program.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ENTERPRISE
  ─ Sign up with company info + optional business certificate upload
  ─ Live devnet SOL balance with real-time USD conversion
  ─ Create missions with address autocomplete (OpenStreetMap)
  ─ Set number of operators needed — auto-generates subtask slots
  ─ Define subtasks with individual names, descriptions, SOL rewards
  ─ On-chain escrow deposit locked at mission creation
  ─ Approve/reject operator applications
  ─ Rate operators and trigger SOL payout on completion
  ─ View Solana Explorer links for all escrow transactions

  OPERATOR
  ─ Sign up with drone specs, certifications, and license docs
  ─ Browse available missions with live weather flyability badges
  ─ Claim specific subtasks — locked once claimed, others can't take it
  ─ Weather tab: current conditions (temp, wind, humidity, pressure,
    visibility) + 7-day forecast
  ─ NASA EONET natural hazard alerts (wildfires, storms, floods,
    earthquakes, volcanoes) filtered by location radius
  ─ In-app messaging per contract
  ─ Earnings tracking

  PLATFORM
  ─ Solana wallet authentication (sign-message, no password)
  ─ Public operator and enterprise profile pages
  ─ Mission detail pages with weather widget and map
  ─ Admin panel for verification management

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  API ENDPOINTS (server runs on port 3001)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Auth
    GET  /api/auth/wallet-check?wallet=
    POST /api/auth/wallet-login

  Operators / Enterprises
    POST /api/operators
    GET  /api/operators/:id/dashboard
    GET  /api/enterprises/:id
    POST /api/enterprises

  Missions
    POST /api/missions
    GET  /api/missions?enterprise_id=
    GET  /api/missions/:id
    POST /api/missions/:id/subtasks/:subtaskId/claim
    POST /api/missions/:id/subtasks/:subtaskId/complete

  Escrow (Solana Devnet)
    GET  /api/escrow/info
    POST /api/escrow/verify-deposit
    POST /api/escrow/airdrop
    POST /api/contracts/:id/release-payment

  Weather
    GET  /api/weather?lat=&lng=            (7-day forecast)
    GET  /api/weather/current?lat=&lng=    (current conditions)

  NASA EONET Hazards
    GET  /api/eonet?lat=&lng=&radius=&days=

  Contracts / Applications / Messages
    POST /api/applications
    GET  /api/missions/:id/applications
    PATCH /api/applications/:id
    GET  /api/contracts
    POST /api/contracts/:id/complete
    GET  /api/messages/:contractId
    POST /api/messages

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  LINKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  GitHub   https://github.com/sanadabuamirah-commits/SOL-SKIES
  Twitter  https://x.com/SOL_SK1ES
  Explorer https://explorer.solana.com/?cluster=devnet

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Built for the Solana Hackathon — April 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
