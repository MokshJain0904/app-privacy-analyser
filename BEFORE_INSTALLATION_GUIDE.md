# Two-Page Privacy Analysis Feature Guide

## Overview

PrivaGuard now supports **two distinct analysis modes** to help users evaluate app privacy at different stages:

1. **📱 For Apps Before Installation** - User-friendly permission analysis before downloading
2. **🔍 For Apps Already Installed** - Technical permission audit for installed apps

---

## Feature 1: Before Installation Analysis (User-Friendly)

### Purpose
Help non-technical users understand what permissions an app will request **before they install it**, using simple language and familiar permission names.

### Permission Names (User-Friendly)
The system converts technical Android permission names to user-friendly equivalents:

| User-Friendly Name | Technical Permissions | What It Does |
|---|---|---|
| **Location** | `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | GPS tracking and approximate location |
| **Camera** | `CAMERA` | Access to phone camera |
| **Microphone** | `RECORD_AUDIO` | Recording audio from microphone |
| **Contacts** | `READ_CONTACTS`, `WRITE_CONTACTS` | Access to contact list |
| **Storage** | `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` | Access to photos, documents, files |
| **Phone Logs** | `READ_CALL_LOG`, `READ_PHONE_STATE` | Call history and phone state |
| **SMS** | `READ_SMS`, `SEND_SMS`, `WRITE_SMS` | Read/send text messages |
| **Calendar** | `READ_CALENDAR`, `WRITE_CALENDAR` | Access to calendar events |
| **Notifications** | `POST_NOTIFICATIONS` | Permission to send notifications |
| **Bluetooth** | `BLUETOOTH`, `BLUETOOTH_ADMIN` | Connect to Bluetooth devices |
| **Nearby Devices** | `NEARBY_WIFI_DEVICES` | Scan for nearby WiFi/Bluetooth devices |
| **Biometric** | `USE_BIOMETRIC` | Fingerprint/face recognition |
| **Internet** | `INTERNET`, `ACCESS_NETWORK_STATE` | Connect to internet |
| **Vibration** | `VIBRATE` | Phone vibration control |
| **Keep Awake** | `WAKE_LOCK` | Keep screen/processor active |

### How It Works

1. **User searches for an app** and scrapes its data from Play Store
2. **User clicks "Before Install"** button
3. System converts technical Android permissions to user-friendly names
4. **AI Analysis** evaluates each permission using Gemini API to determine:
   - Is this permission expected for this app category?
   - Is there a legitimate reason the app needs it?
5. **Recommendation Decision**:
   - ✅ **ACCEPT**: Safe permissions needed for app functionality
   - ⚠️ **REVIEW**: Permissions that need careful consideration
   - ❌ **REJECT**: Suspicious or unnecessary permissions
6. **Risk Score**: 0-100% calculated from all permissions
7. **User-Friendly Display**: Shows permissions grouped by decision type

### Risk Levels
- 🟢 **SAFE** (0-30%): App respects privacy
- 🟡 **MEDIUM** (31-60%): Some over-permissiveness detected
- 🔴 **RISKY** (61-100%): Critical privacy concerns

### Key Features

**Permission Details Modal**
- Click any permission card to see comprehensive details
- What it does (simple explanation)
- What it can access (specific data types)
- Privacy & security risks
- Legitimate uses (which apps typically need this)
- Red flags (warning patterns)

**Decision Rationale**
- Each permission includes AI-generated explanation
- Why the app wants it
- Whether you should accept or reject

**Visual Indicators**
- Risk score meter (0-100%)
- Color-coded decision badges
- Permission grouping (Reject/Review/Accept)
- Confidence indicators

---

## Feature 2: Already Installed Analysis (Technical)

### Purpose
Deep technical analysis of apps already installed on device using classic permission audit.

### How It Works

1. **User searches app** and scrapes Play Store data
2. **User selects permissions** that are actually requested
3. **User clicks "Already Install"** button
4. **Technical Analysis**:
   - Maps permissions to categories (High Risk/Review Needed/Safe)
   - Generates detailed justification for each
   - Compares against category expectations
5. **AI Risk Assessment** using category context
6. **Comprehensive Report** with:
   - Permission audit details
   - Risk distribution overview
   - Alternative app suggestions
   - Expert recommendations

### Features
- Detailed permission audit breakdown
- Safe permissions toggle
- High-risk permission highlighting
- Alternative privacy-friendly apps
- Expert recommendation summary

---

## Implementation Files

### Core Libraries

**`lib/permission-names.ts`** - Permission name mapping
- Maps 15 user-friendly names to technical Android permissions
- Conversion functions (technical ↔ user-friendly)
- Icon and description for each permission

**`lib/user-friendly-permissions.ts`** - User-friendly permission details
- 15 permission info records with non-technical descriptions
- What each permission does (plain language)
- What data it can access
- Privacy risks (understandable explanations)
- Common legitimate uses
- Red flags (warning patterns)

**`lib/user-friendly-recommendations.ts`** - Analysis engine
- Analyzes user-friendly permissions using Gemini AI
- Decision logic (ACCEPT/REJECT/CAUTION)
- Risk score calculation
- Category-based validation

### Components

**`components/BeforeInstallationAnalyzer.tsx`** - New "Before Installation" UI
- Displays user-friendly permission recommendations
- Permission cards with decisions
- Detailed modal for each permission
- Risk score visualization
- Action buttons (Install / Suggest Alternatives)

**`components/PermissionAnalyzer.tsx`** - Existing "Already Installed" UI
- Technical permission analysis
- High-risk highlighting
- Safe permissions toggle
- Alternatives suggestion

### Main Page Changes

**`app/page.tsx`** - Updated with:
- Two distinct analysis buttons:
  - 🔵 "Before Install" (blue) - user-friendly analysis
  - 🟣 "Already Install" (purple) - technical analysis
- New handler: `handleAnalyzeBeforeInstallation()`
- New state for user-friendly recommendations
- Two separate result sections clearly labeled

---

## User Journey

### Before Installation Flow
```
1. Search app → 2. See app details → 3. Click "Before Install" button
4. System converts permissions to friendly names
5. AI analyzes each permission (2-3 seconds)
6. Shows color-coded recommendations (✅ ⚠️ ❌)
7. Click any permission for detailed explanation
8. Make informed decision based on recommendations
```

### Already Installed Flow
```
1. Search app → 2. See app details
3. Select permissions → 4. Click "Already Install" button
5. System analyzes technical permissions
6. Shows high-risk, review needed, and safe categories
7. Generates detailed audit report
8. Suggests safer alternatives
```

---

## Technical Architecture

### Permission Analysis Pipeline

**User-Friendly Analysis:**
```
Technical Permissions → Convert to Friendly Names → 
Analyze with Gemini AI → 
Decision (ACCEPT/REJECT/CAUTION) → 
Risk Score Calculation → 
Display with User-Friendly UI
```

**Decision Logic:**
```
For Each Permission:
  1. Is it expected for this category?
  2. Get Gemini AI analysis
  3. Evaluate risk score
  4. Generate recommendation with explanation
  
Calculate Overall Risk:
  Sum of (permission_risk × decision_weight) / total_permissions
```

### AI Integration

- **Model**: Gemini 2.5-flash (with fallbacks to 2.5-mini, 1.5-pro)
- **Input**: App name, category, description, permission, category expectations
- **Output**: Permission justification and recommendation rationale
- **Context**: Explains why app might need permission and risk level

---

## Testing Guide

### Test Scenario 1: Social Media App (Instagram)
**Expected Results:**
- ✅ Camera, Microphone, Contacts, Storage, Notifications (ACCEPT)
- ⚠️ Location (CAUTION)
- ❌ Phone Logs, SMS (REJECT)
- Risk Level: 🟡 MEDIUM (30-50%)

### Test Scenario 2: Maps App (Google Maps)
**Expected Results:**
- ✅ Location, Internet (ACCEPT)
- ✅ Storage, Camera (ACCEPT)
- ❌ Contacts, SMS, Phone Logs (REJECT)
- Risk Level: 🟢 SAFE (10-25%)

### Test Scenario 3: Flashlight App
**Expected Results:**
- ❌ Location, Camera, Microphone, Contacts (REJECT)
- ✅ Vibration, Internet (ACCEPT)
- Risk Level: 🔴 RISKY (70%+)

---

## File Locations

```
lib/
├── permission-names.ts                    # User-friendly name mapping
├── user-friendly-permissions.ts           # Permission explanations
├── user-friendly-recommendations.ts       # Analysis engine
├── permission-recommendations.ts          # (existing)
└── permission-explanations.ts             # (existing)

components/
├── BeforeInstallationAnalyzer.tsx        # New "Before Install" UI
├── PermissionAnalyzer.tsx                # (existing "Already Installed" UI)
└── ...

app/
└── page.tsx                               # Updated with new handlers & UI
```

---

## Configuration

### Category Expectations

Defined in `lib/permission-recommendations.ts`:
```typescript
CATEGORY_EXPECTED_PERMISSIONS = {
  'Social Media': Set of expected permissions,
  'Maps & Navigation': Set of expected permissions,
  ...
}
```

### Risk Scoring

- Base risk: 0-100% from permission risk scores
- Decision weighting:
  - REJECT: 1.5x weight (heavily penalized)
  - CAUTION: 1.2x weight (moderately penalized)
  - ACCEPT: 1.0x weight (baseline)

---

## User Benefits

1. **Before Installation**: Make informed decisions BEFORE installing
2. **Simple Language**: Understand permissions without technical knowledge
3. **Visual Clarity**: Color-coded decisions and risk indicators
4. **AI Insights**: Understand WHY each permission is needed
5. **Two Perspectives**: Choose between user-friendly or technical analysis
6. **Risk Awareness**: See overall risk score and breakdown
7. **Detailed Info**: Click any permission for comprehensive details

---

## Future Enhancements

1. **Alternative Suggestions**: Recommend safer alternatives in both modes
2. **Permission Tracking**: Remember user's permission grants over time
3. **Threat Database**: Real-time updates of malicious permission patterns
4. **Social Validation**: Show what other users grant/deny
5. **Custom Categories**: User-defined app categories
6. **Permission Auditing**: Regular checks of installed apps
7. **Batch Analysis**: Compare multiple apps at once

---

## Support

For questions about:
- **User-friendly permissions**: See permission details modals
- **AI analysis**: Check AI explanation for each permission
- **Risk scoring**: Review classification guide in sidebar
- **Technical details**: Contact support with specific app name

