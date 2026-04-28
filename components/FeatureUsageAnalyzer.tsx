import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { FeatureUsage } from '@/lib/permission-feature-mapping';

export interface FeatureUsageAnalysis {
  permissionName: string;
  technicalName: string;
  allFeatures: FeatureUsage[];
  expectedFeatures: FeatureUsage[];
  unexpectedFeatures: FeatureUsage[];
  aiAdvice: string;
  overallRecommendation: 'ACCEPT' | 'REJECT' | 'CONDITIONAL';
}

export const FeatureUsageAnalyzer: React.FC<{
  analysis: FeatureUsageAnalysis;
  appName: string;
}> = ({ analysis, appName }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureUsage | null>(null);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Safe':
        return 'text-green-600 bg-green-50';
      case 'Review Needed':
        return 'text-yellow-600 bg-yellow-50';
      case 'High Risk':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Safe':
        return 'bg-green-100 text-green-800';
      case 'Review Needed':
        return 'bg-yellow-100 text-yellow-800';
      case 'High Risk':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{analysis.permissionName}</h3>
          <p className="text-sm text-gray-600">{analysis.technicalName}</p>
          
          {/* Recommendation Badge */}
          <div className="mt-2 flex items-center gap-2">
            {analysis.overallRecommendation === 'ACCEPT' && (
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                ✓ Recommended
              </span>
            )}
            {analysis.overallRecommendation === 'REJECT' && (
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                ✕ Not Recommended
              </span>
            )}
            {analysis.overallRecommendation === 'CONDITIONAL' && (
              <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                ⚠ Conditional
              </span>
            )}
          </div>
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-lg">
          {expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>

      {/* AI Advice (Always visible) */}
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
        <div className="flex gap-2">
          <HelpCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div>{analysis.aiAdvice}</div>
        </div>
      </div>

      {/* Expandable Content */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Expected Features (Safe) */}
          {analysis.expectedFeatures.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600" />
                Safe Usage in {appName}
              </h4>
              <div className="space-y-2">
                {analysis.expectedFeatures.map((feature, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFeature(selectedFeature?.featureName === feature.featureName ? null : feature)}
                    className="w-full text-left p-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-green-900">{feature.featureName}</p>
                        <p className="text-sm text-green-800">{feature.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskBadgeColor(feature.riskInContext)} flex-shrink-0`}>
                        {feature.riskInContext}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Unexpected Features (Risky) */}
          {analysis.unexpectedFeatures.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertCircle size={18} className="text-red-600" />
                Unusual/Risky Usage Patterns
              </h4>
              <div className="space-y-2">
                {analysis.unexpectedFeatures.map((feature, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFeature(selectedFeature?.featureName === feature.featureName ? null : feature)}
                    className="w-full text-left p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-red-900">{feature.featureName}</p>
                        <p className="text-sm text-red-800">{feature.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskBadgeColor(feature.riskInContext)} flex-shrink-0`}>
                        {feature.riskInContext}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feature Details Modal */}
          {selectedFeature && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h5 className="font-semibold mb-2">{selectedFeature.featureName}</h5>
              <p className="text-sm text-gray-700 mb-3">{selectedFeature.description}</p>
              <div className={`p-3 rounded-lg text-sm ${getRiskColor(selectedFeature.riskInContext)}`}>
                <p className="font-medium mb-1">Risk Level: {selectedFeature.riskInContext}</p>
                {selectedFeature.riskInContext === 'Safe' && (
                  <p>This is a common and safe use of this permission in similar apps.</p>
                )}
                {selectedFeature.riskInContext === 'Review Needed' && (
                  <p>This usage should be reviewed. It may be legitimate, but verify the necessity.</p>
                )}
                {selectedFeature.riskInContext === 'High Risk' && (
                  <p>This is a red flag. Only grant if you fully trust the app with this data.</p>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="pt-3 border-t grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-green-50 rounded">
              <p className="text-2xl font-bold text-green-600">{analysis.expectedFeatures.length}</p>
              <p className="text-xs text-green-700">Safe Uses</p>
            </div>
            <div className="p-2 bg-yellow-50 rounded">
              <p className="text-2xl font-bold text-yellow-600">
                {analysis.allFeatures.filter(f => f.riskInContext === 'Review Needed').length}
              </p>
              <p className="text-xs text-yellow-700">Review</p>
            </div>
            <div className="p-2 bg-red-50 rounded">
              <p className="text-2xl font-bold text-red-600">{analysis.unexpectedFeatures.length}</p>
              <p className="text-xs text-red-700">Risky</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureUsageAnalyzer;
