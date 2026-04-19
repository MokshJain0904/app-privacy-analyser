/**
 * PERMISSION ANALYZER - USAGE EXAMPLES
 * 
 * This file demonstrates how the new permission recommendation system works
 */

// ============================================
// EXAMPLE 1: Analyze Instagram
// ============================================

import { 
  analyzeAppPermissions, 
  calculateOverallRiskScore, 
  getRiskLevel 
} from '@/lib/permission-recommendations';

const analyzeInstagram = async () => {
  const recommendations = await analyzeAppPermissions(
    'Instagram',           // appName
    'Social Media',        // category
    'Share photos and videos with friends, connect with people, direct messaging', // description
    [
      'READ_CONTACTS',           // For friend suggestions
      'ACCESS_FINE_LOCATION',    // For location tagging
      'CAMERA',                  // For taking photos
      'RECORD_AUDIO',            // For video calls
      'READ_SMS',                // Suspicious! No need for SMS
      'READ_EXTERNAL_STORAGE',   // For uploading photos
      'INTERNET',                // Required for all features
    ]
  );

  // Results:
  // READ_CONTACTS → ✅ ACCEPT (expected for social media)
  // ACCESS_FINE_LOCATION → ❌ REJECT (not needed for core function)
  // CAMERA → ✅ ACCEPT (needed for photos/videos)
  // RECORD_AUDIO → ✅ ACCEPT (needed for video calls)
  // READ_SMS → ❌ REJECT (no legitimate reason)
  // READ_EXTERNAL_STORAGE → ✅ ACCEPT (needed to upload)
  // INTERNET → ✅ ACCEPT (required)

  const riskScore = calculateOverallRiskScore(recommendations);
  const riskLevel = getRiskLevel(riskScore);

  console.log('Risk Score:', riskScore, '%');     // ~35%
  console.log('Risk Level:', riskLevel);          // MEDIUM
  console.log('Recommendations:', recommendations);
};


// ============================================
// EXAMPLE 2: Analyze Maps App (Safe)
// ============================================

const analyzeMaps = async () => {
  const recommendations = await analyzeAppPermissions(
    'Google Maps',
    'Maps & Navigation',
    'Navigate with real-time traffic, find locations, discover businesses',
    [
      'ACCESS_FINE_LOCATION',    // ✅ Expected - core feature
      'ACCESS_COARSE_LOCATION',  // ✅ Expected - fallback
      'CAMERA',                  // ✅ Expected - street view
      'INTERNET',                // ✅ Expected - required
      'READ_EXTERNAL_STORAGE',   // ✅ Expected - offline maps
    ]
  );

  const riskScore = calculateOverallRiskScore(recommendations);
  const riskLevel = getRiskLevel(riskScore);

  console.log('Risk Score:', riskScore, '%');     // ~15% (SAFE)
  console.log('Risk Level:', riskLevel);          // SAFE
  // All permissions are expected for a maps app
};


// ============================================
// EXAMPLE 3: Analyze Flashlight (Risky!)
// ============================================

const analyzeFlashlight = async () => {
  const recommendations = await analyzeAppPermissions(
    'Flashlight',
    'Utilities',
    'Turn on your phone flashlight',
    [
      'CAMERA',                   // ✅ ACCEPT - maybe for camera LED
      'ACCESS_FINE_LOCATION',     // ❌ RED FLAG! Why does flashlight need GPS?
      'READ_CONTACTS',            // ❌ RED FLAG! No reason for this
      'RECORD_AUDIO',             // ❌ RED FLAG! Unnecessary for flashlight
      'INTERNET',                 // ❌ RED FLAG! Offline app shouldn't need internet
    ]
  );

  const riskScore = calculateOverallRiskScore(recommendations);
  const riskLevel = getRiskLevel(riskScore);

  console.log('Risk Score:', riskScore, '%');     // ~85% (RISKY!)
  console.log('Risk Level:', riskLevel);          // RISKY
  // Recommendation: "❌ REJECT - Do not install. Too many unnecessary permissions"
};


// ============================================
// EXAMPLE 4: React Component Usage
// ============================================

import { PermissionAnalyzer } from '@/components/PermissionAnalyzer';

export function AppPermissionReview() {
  const [recommendations, setRecommendations] = React.useState([]);
  const [riskScore, setRiskScore] = React.useState(0);
  const [riskLevel, setRiskLevel] = React.useState<'SAFE' | 'MEDIUM' | 'RISKY'>('SAFE');

  const handleAnalyze = async (appName: string, category: string) => {
    const recs = await analyzeAppPermissions(
      appName,
      category,
      'App description here',
      ['PERMISSION1', 'PERMISSION2', ...]
    );

    setRecommendations(recs);
    setRiskScore(calculateOverallRiskScore(recs));
    setRiskLevel(getRiskLevel(calculateOverallRiskScore(recs)));
  };

  return (
    <PermissionAnalyzer
      appName="Instagram"
      appCategory="Social Media"
      appIcon="https://..."
      appRating={4.5}
      appDownloads="100M+"
      recommendations={recommendations}
      overallRiskScore={riskScore}
      riskLevel={riskLevel}
      onSuggestAlternatives={() => {
        console.log('Show safer alternatives');
      }}
      onInstall={() => {
        console.log('Show installation instructions');
      }}
    />
  );
}


// ============================================
// EXAMPLE 5: Permission Database Usage
// ============================================

import { 
  getPermissionInfo, 
  getPermissionRiskScore 
} from '@/lib/permission-explanations';

// Get info about a specific permission
const locationInfo = getPermissionInfo('ACCESS_FINE_LOCATION');
console.log(locationInfo);
// Output:
// {
//   name: "Precise Location (GPS)",
//   technicalName: "ACCESS_FINE_LOCATION",
//   riskScore: 85,
//   whatItDoes: "Can determine your exact GPS location in real-time...",
//   whatItCanAccess: ["Your current GPS coordinates", "Your location history", ...],
//   risks: ["Real-time tracking", "Battery drain", ...],
//   commonUses: ["Maps and navigation", ...],
//   redFlags: ["Social media app asking for GPS", ...]
// }

// Get risk score for a permission
const riskScore = getPermissionRiskScore('READ_CONTACTS');
console.log(riskScore); // 95 (very risky)


// ============================================
// EXAMPLE 6: Custom Permission Categories
// ============================================

import { 
  CATEGORY_EXPECTED_PERMISSIONS,
  isPermissionExpectedForCategory 
} from '@/lib/permission-recommendations';

// Check if a permission is expected for an app category
const isSafe = isPermissionExpectedForCategory('LOCATION', 'Maps & Navigation');
console.log(isSafe); // true

const isSuspicious = isPermissionExpectedForCategory('LOCATION', 'Flashlight');
console.log(isSuspicious); // false (SUSPICIOUS!)

// View all expected permissions for a category
console.log(CATEGORY_EXPECTED_PERMISSIONS['Social Media']);
// Output: Set(10) {
//   "READ_CONTACTS",
//   "CAMERA",
//   "RECORD_AUDIO",
//   "READ_EXTERNAL_STORAGE",
//   ...
// }


// ============================================
// EXPECTED PERMISSION FLOW IN UI
// ============================================

/*
USER JOURNEY:

1. USER ENTERS APP NAME
   Input: "Instagram"
   
2. SYSTEM FETCHES APP DATA
   Play Store Data:
   - Title: Instagram
   - Category: Social Media
   - Icon: [image]
   - Rating: 4.2 ⭐
   - Downloads: 2.5B+
   - Permissions: [TECHNICAL_NAMES]

3. USER CLICKS "GET PERMISSION RECOMMENDATIONS"
   
4. SYSTEM ANALYZES EACH PERMISSION
   For READ_CONTACTS:
   - Is it expected? YES (social media finds friends)
   - AI says: "For friend suggestions from contacts"
   - Decision: ✅ ACCEPT (confidence: HIGH)

   For ACCESS_FINE_LOCATION:
   - Is it expected? NO
   - AI says: "Used for location-based ad targeting"
   - Decision: ❌ REJECT (confidence: HIGH)

5. RESULTS DISPLAYED
   ┌─────────────────────────────┐
   │ Instagram - Risk: 35% 🟡    │
   │                             │
   │ ✅ Accept: 3                │
   │ ❌ Reject: 2                │
   │ ⚠️  Review: 1               │
   │                             │
   │ By following recommendations│
   │ risk reduces by 43%         │
   └─────────────────────────────┘

6. USER CLICKS A PERMISSION
   Modal Opens:
   
   ┌─────────────────────────────┐
   │ 📍 ACCESS_FINE_LOCATION     │
   │ Recommendation: ❌ REJECT   │
   │                             │
   │ What it does:               │
   │ Can track your GPS location │
   │                             │
   │ Risks:                      │
   │ • Real-time tracking        │
   │ • Battery drain             │
   │ • Privacy violation         │
   │                             │
   │ Red Flags:                  │
   │ 🚩 Social media asking GPS  │
   └─────────────────────────────┘

7. USER MAKES DECISION
   - Install with Safe Settings: Accepts only ACCEPT permissions
   - See Alternatives: Shows safer apps with fewer permissions
*/


// ============================================
// RECOMMENDATION DECISION TREE
// ============================================

/*
DECISION LOGIC:

Permission Analysis for each permission:

                    ┌─ Expected for category?
                    │
            YES ────┤─ In app description?
            │       │
            │       YES ── Risk LOW  ── ✅ ACCEPT (HIGH confidence)
            │       │
            │       NO ─── Ask AI
            │               │
            │               ├─ Good reason ── ✅ ACCEPT (MEDIUM confidence)
            │               └─ No reason ──── ⚠️ CAUTION
            │
            NO ─────┤─ Ask AI
                    │
                    ├─ No reason + Risk HIGH ── ❌ REJECT (HIGH confidence)
                    ├─ No reason + Risk MED ─── ❌ REJECT (MEDIUM confidence)
                    └─ Could be legit ──────── ⚠️ CAUTION


RISK SCORE CALCULATION:

Risk_Score = Σ(Permission_Risk × Weight × Novelty) / Total_Permissions

Where:
- Permission_Risk: Individual permission risk (0-100)
- Weight: 1.0x (expected) to 2.0x (unexpected)
- Novelty: 1.0x (existing) to 2.0x (new in update)

Classification:
- 0-30%   → 🟢 SAFE    (recommendation: install)
- 31-60%  → 🟡 MEDIUM  (recommendation: review carefully)
- 61-100% → 🔴 RISKY   (recommendation: don't install)
*/


// ============================================
// HOW TO RUN THIS EXAMPLE
// ============================================

/*
1. Add this file to your project:
   lib/examples/permission-analyzer-examples.ts

2. Import and run:
   import * as examples from '@/lib/examples/permission-analyzer-examples';
   
   // Test Instagram
   await examples.analyzeInstagram();
   
   // Test Maps (safe app)
   await examples.analyzeMaps();
   
   // Test Flashlight (risky app)
   await examples.analyzeFlashlight();

3. View the console output to see results
*/


// ============================================
// TESTING CHECKLIST
// ============================================

/*
TEST CASES:

✅ Test 1: Social Media App
   - App: Instagram
   - Expected: 35% risk (MEDIUM)
   - Reject: LOCATION, SMS
   
✅ Test 2: Navigation App
   - App: Google Maps
   - Expected: 15% risk (SAFE)
   - Accept: All (locations are essential)
   
✅ Test 3: Banking App
   - App: Chase Bank
   - Expected: 25% risk (SAFE)
   - Accept: INTERNET, CAMERA, BIOMETRIC
   
✅ Test 4: Flashlight App
   - App: Flashlight
   - Expected: 80% risk (RISKY)
   - Reject: LOCATION, CONTACTS, AUDIO, INTERNET
   
✅ Test 5: Messaging App
   - App: WhatsApp
   - Expected: 45% risk (MEDIUM)
   - Accept: CONTACTS, AUDIO, CAMERA, STORAGE
   - Reject: SMS (uses internet instead)
   
✅ Test 6: Click Permission Modal
   - Click any permission
   - Modal shows detailed info
   - Can read explanation easily
   
✅ Test 7: Risk Score Display
   - Visual meter shows 0-100%
   - Color-coded (green/yellow/red)
   - Shows confidence level
   
✅ Test 8: Mobile Responsive
   - Test on phone size
   - Cards stack properly
   - Clickable areas work
*/
