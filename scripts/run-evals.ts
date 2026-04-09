import gplay from 'google-play-scraper';
import { calculateRiskScore, normalizeScore } from '../lib/scoring';

/**
 * GROUND TRUTH DATASET
 * This acts as the benchmark for your research paper. 
 * We label apps manually, and then force the AI scoring system to guess.
 * We measure the AI's accuracy by calculating how many times it agreed with the Manual Label.
 */
const benchmarkApps = [
  { appId: "com.whatsapp", name: "WhatsApp", manualLabel: "Safe" },
  { appId: "com.facebook.katana", name: "Facebook", manualLabel: "Over-Permissive" },
  { appId: "com.instagram.android", name: "Instagram", manualLabel: "Over-Permissive" },
  { appId: "com.google.android.apps.maps", name: "Google Maps", manualLabel: "Safe" },
  { appId: "org.videolan.vlc", name: "VLC", manualLabel: "Safe" },
  { appId: "com.snapchat.android", name: "Snapchat", manualLabel: "Over-Permissive" },
  { appId: "com.truecaller", name: "Truecaller", manualLabel: "Risky" },
  { appId: "com.shazam.android", name: "Shazam", manualLabel: "Safe" },
  { appId: "com.lenovo.anyshare.gps", name: "SHAREit", manualLabel: "Risky" },
  { appId: "com.king.candycrushsaga", name: "Candy Crush", manualLabel: "Over-Permissive" },
  { appId: "com.adobe.reader", name: "Adobe Acrobat Reader", manualLabel: "Safe" },
  { appId: "com.tencent.ig", name: "PUBG Mobile", manualLabel: "Over-Permissive" }
];

async function runEvaluations() {
  console.log("Starting Privacy Benchmark Evaluation...\n");
  
  let tp = 0; // True Positives: System correctly flagged a risky app
  let fp = 0; // False Positives: System flagged a safe app as risky
  let tn = 0; // True Negatives: System correctly cleared a safe app
  let fn = 0; // False Negatives: System cleared a risky app

  for (const app of benchmarkApps) {
    console.log(`Analyzing: ${app.name}...`);
    try {
      const details = await gplay.app({ appId: app.appId });
      const permsData = await gplay.permissions({ appId: app.appId });
      const permissions = permsData.map(p => p.permission);

      const category = details.genre || 'Unknown';
      
      const rawScore = await calculateRiskScore(permissions, category);
      const normalizedScore = normalizeScore(rawScore, permissions.length);

      let systemRiskLabel = "Safe";
      if (normalizedScore > 60) {
        systemRiskLabel = "Risky";
      } else if (normalizedScore > 25) {
        systemRiskLabel = "Over-Permissive";
      }

      console.log(`  -> System Label: ${systemRiskLabel} (${normalizedScore}%) | Manual: ${app.manualLabel}`);

      const isSystemFlagged = systemRiskLabel === "Risky" || systemRiskLabel === "Over-Permissive";
      const isManualFlagged = app.manualLabel === "Risky" || app.manualLabel === "Over-Permissive";

      if (isSystemFlagged && isManualFlagged) tp++;
      else if (isSystemFlagged && !isManualFlagged) fp++;
      else if (!isSystemFlagged && !isManualFlagged) tn++;
      else if (!isSystemFlagged && isManualFlagged) fn++;

    } catch (error) {
      console.log(`  -> Failed to fetch data for ${app.appId} (${(error as Error).message})`);
    }
  }

  const totalAnalyzed = tp + fp + tn + fn;
  const accuracy = (tp + tn) / totalAnalyzed;
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1 = (precision + recall) > 0 ? 2 * ((precision * recall) / (precision + recall)) : 0;

  console.log("\n==============================================");
  console.log("        🔥 RESEARCH EVALUATION RESULTS 🔥     ");
  console.log("==============================================");
  console.log(`Total Apps Evaluated : ${totalAnalyzed}`);
  console.log(`Accuracy             : ${(accuracy * 100).toFixed(2)}%  (Overall correctness)`);
  console.log(`Precision            : ${(precision * 100).toFixed(2)}%  (When it flags an app, how often is it right?)`);
  console.log(`Recall               : ${(recall * 100).toFixed(2)}%  (Out of all bad apps, how many did it catch?)`);
  console.log(`F1 Score             : ${(f1 * 100).toFixed(2)}%  (Harmonic mean of precision & recall)`);
  console.log("==============================================\n");
}

runEvaluations();
