# Feature-Based Permission Analysis Guide

## Overview

PrivaGuard now includes **Feature-Based Permission Analysis** - a smart system that shows users exactly HOW permissions are used in specific app features, with AI-powered recommendations.

Instead of just saying "Microphone is High Risk", the system now explains:
- ✅ **Safe use**: Microphone for video recording in Instagram
- ✅ **Safe use**: Microphone for voice calling
- ❌ **High Risk**: Microphone for background recording without user action

## New Components & Libraries

### 1. **Permission Feature Mapping** (`lib/permission-feature-mapping.ts`)

Database of all Android permissions mapped to legitimate app features:

```typescript
// Example: RECORD_AUDIO permission
RECORD_AUDIO: {
  featureName: "Video Recording",
  description: "Records audio while capturing video",
  riskInContext: "Safe"
},
{
  featureName: "Background Monitoring",
  description: "Continuously records audio without user action",
  riskInContext: "High Risk"
}
```

**Key Functions:**
- `getPermissionFeatures(permissionName)` - Get all possible uses for a permission
- `getExpectedFeaturesForCategory(permission, category)` - Get safe features for app category
- `getFeatureRiskLevel(permission, feature)` - Get risk of using permission for specific feature

### 2. **Feature-Based Recommendations** (`lib/feature-based-recommendations.ts`)

AI-powered analysis that generates smart recommendations based on feature usage:

```typescript
// Generates advice like:
// "Safe to grant microphone for video recording in Instagram"
// "Monitor storage access - ensures it's only for photo upload"
generateSmartPermissionAdvice(appName, category, permission, description)
```

**Key Functions:**
- `generateSmartPermissionAdvice()` - AI analysis of permission usage in features
- `analyzePermissionsWithFeatures()` - Batch analyze permissions with feature context
- `generateConditionalRecommendation()` - Create conditional permission grants

### 3. **Enhanced Analysis** (`lib/enhanced-analysis.ts`)

Improved AI prompt that asks specifically about feature usage:

```typescript
generateEnhancedAnalysisPrompt(
  appName,
  category,
  permissions,
  expectedPermissions,
  normalizedScore
)
```

Returns analysis with feature explanations:
```json
{
  "permissions": [{
    "name": "RECORD_AUDIO",
    "riskLevel": "Safe",
    "features": ["Video Recording", "Voice Calling"],
    "explanation": "Used for core video/call features"
  }],
  "featureRecommendations": {
    "videoRecording": "Safe - Grant for recording videos",
    "backgroundMonitoring": "Risky - Do not grant"
  }
}
```

### 4. **UI Components**

#### FeatureUsageAnalyzer (`components/FeatureUsageAnalyzer.tsx`)
Shows detailed breakdown of how a permission is used:
- Safe features (green)
- Review-needed features (yellow)
- Risky features (red)
- Click to expand for more details

#### SmartPermissionRecommender (`components/SmartPermissionRecommender.tsx`)
Main component showing all permissions with:
- Overall risk score visualization
- Per-permission risk levels
- Feature-specific usage explanations
- Smart action buttons (Grant/Caution/Deny)
- Privacy tips

### 5. **API Endpoint** (`api/feature-based-analysis/route.ts`)

**POST** `/api/feature-based-analysis`
```json
{
  "appName": "Instagram",
  "permissions": ["RECORD_AUDIO", "CAMERA", "READ_CONTACTS"],
  "category": "Social",
  "appDescription": "Share photos and videos with friends"
}
```

Returns:
```json
{
  "analysisResults": [{
    "permissionName": "RECORD_AUDIO",
    "expectedFeatures": [
      { "featureName": "Video Recording", "riskInContext": "Safe" }
    ],
    "unexpectedFeatures": [
      { "featureName": "Background Recording", "riskInContext": "High Risk" }
    ],
    "aiAdvice": "Safe for Instagram's core video features..."
  }]
}
```

**GET** `/api/feature-based-analysis?permission=RECORD_AUDIO&category=Social`

Returns database of all possible uses for a permission in a category.

## How It Works

### Category-Based Scoring

The system recognizes that **permissions are context-dependent**:

| Permission | App | Old Score | New Score | Reason |
|-----------|-----|-----------|-----------|--------|
| RECORD_AUDIO | Instagram | High Risk (85%) | Safe | Used for video recording (core feature) |
| RECORD_AUDIO | Flashlight | High Risk (85%) | High Risk | No legitimate video/call feature |
| CAMERA | Instagram | Safe (20%) | Safe | Video recording feature |
| CAMERA | Flashlight | High Risk (70%) | Safe | Flashlight app commonly uses camera |

### AI Feature Analysis

When analyzing an app, the system now:

1. **Extracts permissions** from the app
2. **Maps to features** using permission-feature database
3. **Validates against category** (Social, Photography, etc.)
4. **Runs AI analysis** asking specifically about feature usage
5. **Generates recommendations** based on detected features
6. **Explains to user** which features are safe, which need caution

Example output:
```
Microphone Permission in Instagram:
├─ ✅ SAFE: Video Recording
│  └─ Records audio while capturing video
├─ ✅ SAFE: Voice Calling  
│  └─ Used for Instagram's video call feature
└─ ⚠️  REVIEW: Background Audio
   └─ Monitor to ensure it's only active during video features
```

## Usage Examples

### Example 1: Analyzing Instagram

```typescript
// Get feature analysis for Instagram
POST /api/feature-based-analysis
{
  "appName": "Instagram",
  "permissions": ["RECORD_AUDIO", "CAMERA", "READ_CONTACTS", "READ_EXTERNAL_STORAGE"],
  "category": "Social",
  "appDescription": "Share photos and videos with friends"
}

// Response includes:
{
  "RECORD_AUDIO": {
    "expectedFeatures": ["Video Recording", "Voice Calling"],
    "overallRecommendation": "ACCEPT",
    "aiAdvice": "Safe to grant. Instagram's video features require audio recording."
  },
  "READ_EXTERNAL_STORAGE": {
    "expectedFeatures": ["Photo Gallery", "Media Upload"],
    "overallRecommendation": "ACCEPT",
    "aiAdvice": "Safe for core features. Ensure storage access is limited to photos."
  }
}
```

### Example 2: Detecting Suspicious Patterns

```typescript
// Analyzing an app with suspicious permissions
POST /api/feature-based-analysis
{
  "appName": "FreeGameZ",
  "permissions": ["RECORD_AUDIO", "ACCESS_FINE_LOCATION", "READ_CONTACTS"],
  "category": "Entertainment"
}

// Response:
{
  "RECORD_AUDIO": {
    "expectedFeatures": [],  // No expected features
    "unexpectedFeatures": ["Background Recording"],
    "overallRecommendation": "REJECT",
    "aiAdvice": "⚠️  High Risk. Games don't need continuous audio recording."
  },
  "ACCESS_FINE_LOCATION": {
    "overallRecommendation": "REJECT",
    "aiAdvice": "⚠️  Games rarely need precise location. This is suspicious."
  }
}
```

## Smart Recommendation Logic

The system generates conditional recommendations:

### Safe Recommendations ✅
```
✓ "Only grant microphone when recording videos"
✓ "Storage access is safe for downloading photos"
✓ "Camera access is expected for Instagram"
```

### Cautious Recommendations ⚠️
```
⚠ "Monitor storage access - ensure it's limited to photos"
⚠ "Location sharing should be optional, not automatic"
⚠ "Contact access should be for suggestions only"
```

### Deny Recommendations ❌
```
✗ "Do not grant continuous location tracking"
✗ "Never enable background microphone recording"
✗ "Deny access to call logs for social media apps"
```

## Integration Points

### Main Analysis Flow

The system integrates with existing analysis:

```
1. User searches app → Scrape from Play Store
2. Extract permissions
3. Calculate traditional risk score
4. NEW: Run feature-based analysis
5. NEW: Generate feature-specific recommendations
6. Display with both risk score + feature details
7. Cache results for future reference
```

### Updating Existing Components

To use the new recommendations in your components:

```typescript
import { FeatureUsageAnalyzer } from '@/components/FeatureUsageAnalyzer';
import { SmartPermissionRecommender } from '@/components/SmartPermissionRecommender';

// In your analysis result handler:
const analysisResults = response.analysisResults;

// Display with new component
<SmartPermissionRecommender 
  appName={appName}
  permissions={analysisResults}
  overallRiskScore={riskScore}
  category={category}
/>
```

## Configuration

### Adding New Permission-Feature Mappings

Edit `lib/permission-feature-mapping.ts`:

```typescript
CUSTOM_PERMISSION: {
  permissionName: "Custom Permission",
  technicalName: "CUSTOM_PERMISSION",
  features: [
    {
      featureName: "Feature Name",
      description: "How this feature uses the permission",
      riskInContext: "Safe" // or "Review Needed" or "High Risk"
    }
  ]
}
```

### Customizing Categories

Update feature expectations in `getExpectedFeaturesForCategory()`:

```typescript
const categoryFeatureMap: Record<string, string[]> = {
  'YourCategory': ['Feature1', 'Feature2'],
  // ...
};
```

## Testing

Test the feature-based analysis:

```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/feature-based-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "Instagram",
    "permissions": ["RECORD_AUDIO", "CAMERA"],
    "category": "Social"
  }'

# Test permission feature lookup
curl "http://localhost:3000/api/feature-based-analysis?permission=RECORD_AUDIO&category=Social"
```

## Benefits

✅ **Context-Aware Scoring**: Permissions scored based on how they're used
✅ **Feature Transparency**: Users understand exactly why apps need permissions  
✅ **Smart Recommendations**: AI-powered conditional grants (only for features you use)
✅ **Suspicious Pattern Detection**: Catches misuse like games accessing microphone
✅ **Better UX**: Visual breakdown of safe vs risky permission usage
✅ **Non-Technical Language**: Explanations for average users
✅ **Mobile Responsive**: Works on all screen sizes

## Limitations & Future Work

- Currently covers 8+ major permissions (extensible)
- Some apps may have unique features not in the database
- AI analysis depends on Google Gemini API availability
- Feature context may need manual updates for new app types

## Documentation Files

- `FEATURE_BASED_ANALYSIS.md` - This file
- `lib/permission-feature-mapping.ts` - Feature database
- `lib/feature-based-recommendations.ts` - AI recommendation engine
- `lib/enhanced-analysis.ts` - Enhanced AI prompts
- `components/FeatureUsageAnalyzer.tsx` - UI component
- `components/SmartPermissionRecommender.tsx` - Main UI
- `api/feature-based-analysis/route.ts` - API endpoint
