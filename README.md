# PrivaGuard - App Privacy Analyzer

PrivaGuard is an advanced, data-driven Android Application Privacy Analyzer. It scans top applications from the Google Play Store, evaluates the permissions they request using a local semantic matching AI model, and leverages Gemini to produce clear risk analysis and recommendations.

## 🔥 Key Features

- **Data-Driven Category Baselines**: Automatically scrapes thousands of apps across different categories (Social, Finance, Tools, etc.) to compute statistically valid "Expected Permissions" for each genre.
- **Semantic Permission Matching**: Uses local Hugging Face Transformers (`@xenova/transformers` with `all-MiniLM-L6-v2`) to accurately understand if an app's permissions align contextually with its category, rather than relying on brittle keyword matching.
- **Large Dataset Analytics Pipeline**: Capable of batch-evaluating 1,000+ app profiles synchronously.
- **Privacy Analyst Dashboard**: Interactive visualization (built with Recharts) showcasing risk distributions, category safety comparisons, and total anomalies.
- **Expert LLM Audit**: Uses Gemini to synthesize highly detailed permission audits mapping exact real-world risk, edge cases, and actionable, safe alternatives.
- **Evaluation Metrics**: Built-in endpoints measuring system Accuracy, Precision, Recall, and F1 scores against manually sourced safety labels.

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

### 3. Initialize the Core Datasets
To initialize the analytics engine properly, generate the dynamically-expected category baselines and the app datasets for the dashboard.
```bash
# 1. Build the Category Baseline (CSB)
npx tsx scripts/build-csb.ts

# 2. Build the Dashboard App Dataset
npx tsx scripts/batch-scrape.ts
```

### 4. Run the Web Application
Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the homepage analyzer, or visit [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to view the dataset analytics dashboard!

## ⚙️ Configuration
You can explicitly configure Risk Scoring algorithms and weight distributions symmetrically altering both the Dashboard datasets and real-time generation in: `config/scoring-weights.json`.
