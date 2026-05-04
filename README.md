# PrivaGuard - App Privacy Analyzer

PrivaGuard is an advanced, data-driven Android Application Privacy Analyzer. It scans top applications from the Google Play Store, evaluates the permissions they request using a strict 3-tier deterministic category baseline, and leverages Gemini AI to produce clear risk analysis and recommendations.

## 🔥 Key Features

- **Data-Driven 3-Tier Category Baselines**: Maps app genres (Social, Finance, Tools, etc.) to strict database rules that classify permissions as **Safe**, **Review Needed**, or **High Risk**.
- **Intelligent AI Refinement**: Instead of semantic guessing, PrivaGuard uses Gemini exclusively as a targeted secondary pass—specifically to analyze if "High Risk" permissions are actually utilized by an app's optional features, safely downgrading them if justified.
- **Asymptotic Risk Scoring**: A robust mathematical scoring engine that penalizes unexpected permissions heavily while ensuring dozens of safe permissions cannot mathematically dilute the overall risk score.
- **Expert LLM Audit**: Uses Gemini to synthesize highly detailed permission audits mapping exact real-world risk, edge cases, and actionable, safe alternatives for any app on the Play Store.

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js (v20+) installed. You will also need a Google Gemini API Key.
Create a `.env.local` file in your root directory:
```env
GOOGLE_AI_API_KEY=your_gemini_api_key_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Data Sources
To initialize the analytics engine properly, generate the dynamically-expected category baselines:
```bash
# Build the Category Baseline (CSB)
npx tsx scripts/build-csb.ts

# Optional: Scrape initial app data
npx tsx scripts/batch-scrape.ts
```

### 4. Run the Web Application
Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view and test the privacy analyzer!

## ⚙️ Configuration
You can explicitly configure Risk Scoring algorithms and weight distributions symmetrically altering the real-time scoring generation in: `config/scoring-weights.json`.
