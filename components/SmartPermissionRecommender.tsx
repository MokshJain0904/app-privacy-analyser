import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
  Shield
} from 'lucide-react';

export interface FeatureRecommendation {
  featureName: string;
  explanation: string;
  riskLevel: 'Safe' | 'Review Needed' | 'High Risk';
}

export interface SmartPermissionCard {
  permissionName: string;
  technicalName: string;
  riskLevel: 'Safe' | 'Review Needed' | 'High Risk';
  explanation: string;
  usedFeatures: string[];
  features: FeatureRecommendation[];
  recommendation: string;
}

export const SmartPermissionRecommender: React.FC<{
  appName: string;
  permissions: SmartPermissionCard[];
  overallRiskScore: number;
  category: string;
}> = ({ appName, permissions, overallRiskScore, category }) => {
  const [expandedPermission, setExpandedPermission] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<{
    permission: string;
    feature: FeatureRecommendation;
  } | null>(null);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Safe':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800' };
      case 'Review Needed':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' };
      case 'High Risk':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' };
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'Safe':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'Review Needed':
        return <AlertCircle size={20} className="text-yellow-600" />;
      case 'High Risk':
        return <Shield size={20} className="text-red-600" />;
      default:
        return <Info size={20} className="text-gray-600" />;
    }
  };

  const safePermissions = permissions.filter(p => p.riskLevel === 'Safe').length;
  const reviewPermissions = permissions.filter(p => p.riskLevel === 'Review Needed').length;
  const riskyPermissions = permissions.filter(p => p.riskLevel === 'High Risk').length;

  return (
    <div className="space-y-6">
      {/* Risk Score Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-blue-900">{overallRiskScore}% Risk Score</h2>
            <p className="text-blue-700 mt-1">
              {overallRiskScore < 25 && 'This app respects your privacy. ✓'}
              {overallRiskScore >= 25 && overallRiskScore < 60 && 'This app requests more permissions than necessary.'}
              {overallRiskScore >= 60 && 'This app is over-permissive. Review carefully.'}
            </p>
            <div className="mt-3 text-sm text-blue-600">
              <p>• <strong>{safePermissions}</strong> safe permissions</p>
              <p>• <strong>{reviewPermissions}</strong> to review</p>
              <p>• <strong>{riskyPermissions}</strong> high risk</p>
            </div>
          </div>
          <div className="text-right">
            <div className="w-24 h-24 rounded-full bg-white border-4 border-blue-200 flex items-center justify-center">
              <span className="text-3xl font-bold text-blue-900">{overallRiskScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Zap size={20} />
          Permission Analysis with Feature Context
        </h3>

        {permissions.map((permission) => {
          const colors = getRiskColor(permission.riskLevel);
          const isExpanded = expandedPermission === permission.technicalName;

          return (
            <div
              key={permission.technicalName}
              className={`border rounded-lg transition ${colors.border} ${isExpanded ? colors.bg : 'bg-white'}`}
            >
              {/* Permission Header */}
              <button
                onClick={() =>
                  setExpandedPermission(isExpanded ? null : permission.technicalName)
                }
                className="w-full text-left p-4 hover:bg-opacity-50 transition flex items-start justify-between"
              >
                <div className="flex items-start gap-3 flex-1">
                  {getRiskIcon(permission.riskLevel)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{permission.permissionName}</h4>
                    <p className="text-sm text-gray-600">{permission.technicalName}</p>
                    <p className="text-sm text-gray-700 mt-2">{permission.explanation}</p>

                    {/* Used Features Tags */}
                    {permission.usedFeatures.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {permission.usedFeatures.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.badge}`}>
                    {permission.riskLevel}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t p-4 space-y-4">
                  {/* Recommendation */}
                  <div className={`p-3 rounded-lg ${colors.bg}`}>
                    <p className={`text-sm font-medium ${colors.text}`}>
                      💡 Smart Recommendation
                    </p>
                    <p className={`text-sm mt-1 ${colors.text}`}>
                      {permission.recommendation}
                    </p>
                  </div>

                  {/* Feature Breakdown */}
                  {permission.features.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-sm text-gray-900 mb-2">
                        How This Permission is Used
                      </h5>
                      <div className="space-y-2">
                        {permission.features.map((feature, idx) => {
                          const featureColors = getRiskColor(feature.riskLevel);
                          const featureKey = `${permission.technicalName}-${idx}`;
                          const isFeatureSelected = selectedFeature?.feature === feature;

                          return (
                            <button
                              key={idx}
                              onClick={() =>
                                setSelectedFeature(
                                  isFeatureSelected
                                    ? null
                                    : { permission: permission.technicalName, feature }
                                )
                              }
                              className={`w-full text-left p-3 rounded-lg border transition ${featureColors.border} ${featureColors.bg} hover:opacity-75`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {feature.featureName}
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    {feature.explanation}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ml-3 flex-shrink-0 ${featureColors.badge}`}>
                                  {feature.riskLevel}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {permission.riskLevel === 'Safe' && (
                      <button className="flex-1 px-3 py-2 bg-green-100 text-green-800 rounded font-medium text-sm hover:bg-green-200 transition">
                        ✓ Safe to Grant
                      </button>
                    )}
                    {permission.riskLevel === 'Review Needed' && (
                      <button className="flex-1 px-3 py-2 bg-yellow-100 text-yellow-800 rounded font-medium text-sm hover:bg-yellow-200 transition">
                        ⚠ Grant with Caution
                      </button>
                    )}
                    {permission.riskLevel === 'High Risk' && (
                      <button className="flex-1 px-3 py-2 bg-red-100 text-red-800 rounded font-medium text-sm hover:bg-red-200 transition">
                        ✕ Do Not Grant
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary & Tips */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h4 className="font-semibold text-indigo-900 mb-2">💡 Privacy Tips</h4>
        <ul className="text-sm text-indigo-800 space-y-1">
          <li>✓ Grant permissions only for features you actually use</li>
          <li>✓ Review permission usage in app settings regularly</li>
          <li>✓ Consider using alternatives with fewer permissions</li>
          <li>✓ Disable location tracking when not needed</li>
        </ul>
      </div>
    </div>
  );
};

export default SmartPermissionRecommender;
