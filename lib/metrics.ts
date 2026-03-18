import * as fs from 'fs';
import * as path from 'path';

// Define the Evaluation Label Interface
export interface EvalLabel {
  appId: string;
  appName: string;
  category: string;
  systemScore: number;
  systemRiskLabel: "Safe" | "Over-Permissive" | "Risky";
  manualLabel: "Safe" | "Over-Permissive" | "Risky";
  timestamp: string;
}

const LABELS_FILE_PATH = path.join(process.cwd(), 'data', 'eval-labels.json');

export function getEvalLabels(): EvalLabel[] {
  if (fs.existsSync(LABELS_FILE_PATH)) {
    try {
      const data = fs.readFileSync(LABELS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

export function saveEvalLabel(label: EvalLabel) {
  const labels = getEvalLabels();
  // Update if exists, else add new
  const existingIdx = labels.findIndex(l => l.appId === label.appId);
  if (existingIdx >= 0) {
    labels[existingIdx] = label;
  } else {
    labels.push(label);
  }
  
  const dataDir = path.dirname(LABELS_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(LABELS_FILE_PATH, JSON.stringify(labels, null, 2));
}

// Compute Accuracy, Precision, Recall, F1 for the "Risky" (+ "Over-Permissive") class detection
export function computeMetrics() {
  const labels = getEvalLabels();
  if (labels.length === 0) return { accuracy: 0, precision: 0, recall: 0, f1: 0, totalAnalyzed: 0 };

  let truePositives = 0; // System says Risky/Over-Permissive, Manual says Risky/Over-Permissive
  let falsePositives = 0; // System says Risky/Over-Permissive, Manual says Safe
  let trueNegatives = 0; // System says Safe, Manual says Safe
  let falseNegatives = 0; // System says Safe, Manual says Risky/Over-Permissive

  labels.forEach(label => {
    const isSystemFlagged = label.systemRiskLabel === "Risky" || label.systemRiskLabel === "Over-Permissive";
    const isManualFlagged = label.manualLabel === "Risky" || label.manualLabel === "Over-Permissive";

    if (isSystemFlagged && isManualFlagged) truePositives++;
    if (isSystemFlagged && !isManualFlagged) falsePositives++;
    if (!isSystemFlagged && !isManualFlagged) trueNegatives++;
    if (!isSystemFlagged && isManualFlagged) falseNegatives++;
  });

  const accuracy = (truePositives + trueNegatives) / labels.length;
  const precision = (truePositives + falsePositives) > 0 ? truePositives / (truePositives + falsePositives) : 0;
  const recall = (truePositives + falseNegatives) > 0 ? truePositives / (truePositives + falseNegatives) : 0;
  
  const f1 = (precision + recall) > 0 ? 2 * ((precision * recall) / (precision + recall)) : 0;

  return {
    accuracy: Number(accuracy.toFixed(3)),
    precision: Number(precision.toFixed(3)),
    recall: Number(recall.toFixed(3)),
    f1: Number(f1.toFixed(3)),
    totalAnalyzed: labels.length,
    confusionMatrix: {
        tp: truePositives,
        fp: falsePositives,
        tn: trueNegatives,
        fn: falseNegatives
    }
  };
}
