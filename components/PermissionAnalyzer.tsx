'use client';

import { useState } from 'react';
import { PermissionCard } from './PermissionCard';
import { PermissionExplanationModal } from './PermissionExplanationModal';
import { PermissionRecommendation, PermissionDecision } from '@/lib/permission-recommendations';
import { AlertCircle, CheckCircle2, AlertTriangle, TrendingDown, Lightbulb } from 'lucide-react';

interface PermissionAnalyzerProps {
  appName: string;
  appCategory: string;
  appIcon?: string;
  appRating?: number;
  appDownloads?: string;
  recommendations: PermissionRecommendation[];
  overallRiskScore: number;
  riskLevel: 'SAFE' | 'MEDIUM' | 'RISKY';
  onSuggestAlternatives?: () => void;
  onInstall?: () => void;
}

export function PermissionAnalyzer({
  appName,
  appCategory,
  appIcon,
  appRating,
  appDownloads,
  recommendations,
  overallRiskScore,
  riskLevel,
  onSuggestAlternatives,
  onInstall,
}: PermissionAnalyzerProps) {
  const [selectedPermission, setSelectedPermission] = useState<{
    permission: PermissionRecommendation;
  } | null>(null);

  // Count decisions
  const acceptCount = recommendations.filter(r => r.decision === 'ACCEPT').length;
  const rejectCount = recommendations.filter(r => r.decision === 'REJECT').length;
  const cautionCount = recommendations.filter(r => r.decision === 'CAUTION').length;

  // Risk color and icon
  const riskConfig = {
    SAFE: { color: 'green', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2, text: '🟢 SAFE', suggestion: 'This app respects your privacy. Safe to install!' },
    MEDIUM: { color: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertCircle, text: '🟡 MEDIUM', suggestion: 'Review the rejected permissions below before installing.' },
    RISKY: { color: 'red', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, text: '🔴 RISKY', suggestion: 'This app requests too many sensitive permissions. Consider alternatives.' },
  };

  const config = riskConfig[riskLevel];
  const RiskIcon = config.icon;

  // Calculate reduction percentage if user follows recommendations
  const allRejectedRisk = recommendations
    .filter(r => r.decision === 'REJECT')
    .reduce((sum, r) => sum + r.riskScore, 0);
  const riskReduction = allRejectedRisk > 0 ? Math.round((allRejectedRisk / (overallRiskScore + allRejectedRisk)) * 100) : 0;

  return (
    <>
      {/* App Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          {appIcon && (
            <img src={appIcon} alt={appName} className="w-20 h-20 rounded-lg" />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{appName}</h1>
            <p className="text-gray-600 mt-1">{appCategory}</p>
            <div className="flex gap-4 mt-3 text-sm text-gray-600">
              {appRating && <span>⭐ {appRating}/5</span>}
              {appDownloads && <span>📥 {appDownloads}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Overall Risk Card */}
      <div className={`${config.bg} border-2 ${config.border} rounded-xl p-6 mb-6`}>
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <RiskIcon size={28} className={`text-${config.color}-600`} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{config.text}</h2>
                <p className="text-gray-700">{config.suggestion}</p>
              </div>
            </div>

            {/* Risk meter */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Overall Risk Score</span>
                <span className="text-2xl font-bold text-gray-900">{overallRiskScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    riskLevel === 'SAFE'
                      ? 'bg-green-500'
                      : riskLevel === 'MEDIUM'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${overallRiskScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 flex-shrink-0">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{acceptCount}</div>
              <div className="text-xs text-gray-600 mt-1">Accept</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{cautionCount}</div>
              <div className="text-xs text-gray-600 mt-1">Review</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{rejectCount}</div>
              <div className="text-xs text-gray-600 mt-1">Reject</div>
            </div>
          </div>
        </div>

        {riskReduction > 0 && (
          <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-sm text-green-800 font-semibold">
              <TrendingDown size={16} />
              <span>Following recommendations reduces risk by <strong>{riskReduction}%</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Recommendation Summary Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Lightbulb className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <p className="text-sm text-blue-900">
            <strong>💡 How to use this:</strong> Click on any permission below to learn what it does, why it's risky, and whether you should accept or reject it before installation.
          </p>
        </div>
      </div>

      {/* Permissions List */}
      <div>
        {/* Rejected Permissions */}
        {rejectCount > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} />
              🚨 Reject These Permissions ({rejectCount})
            </h3>
            <div className="space-y-3">
              {recommendations
                .filter(r => r.decision === 'REJECT')
                .map(rec => (
                  <PermissionCard
                    key={rec.permissionName}
                    permission={rec.permissionName}
                    decision={rec.decision}
                    explanation={rec.explanation}
                    confidence={rec.confidence}
                    riskScore={rec.riskScore}
                    onClick={() => setSelectedPermission({ permission: rec })}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Caution Permissions */}
        {cautionCount > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-yellow-700 mb-4 flex items-center gap-2">
              <AlertCircle size={20} />
              ⚠️ Review Carefully ({cautionCount})
            </h3>
            <div className="space-y-3">
              {recommendations
                .filter(r => r.decision === 'CAUTION')
                .map(rec => (
                  <PermissionCard
                    key={rec.permissionName}
                    permission={rec.permissionName}
                    decision={rec.decision}
                    explanation={rec.explanation}
                    confidence={rec.confidence}
                    riskScore={rec.riskScore}
                    onClick={() => setSelectedPermission({ permission: rec })}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Accepted Permissions */}
        {acceptCount > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
              <CheckCircle2 size={20} />
              ✅ Safe to Accept ({acceptCount})
            </h3>
            <div className="space-y-3">
              {recommendations
                .filter(r => r.decision === 'ACCEPT')
                .map(rec => (
                  <PermissionCard
                    key={rec.permissionName}
                    permission={rec.permissionName}
                    decision={rec.decision}
                    explanation={rec.explanation}
                    confidence={rec.confidence}
                    riskScore={rec.riskScore}
                    onClick={() => setSelectedPermission({ permission: rec })}
                  />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4 sticky bottom-0 bg-white p-4 border-t border-gray-200 rounded-b-xl">
        <button
          onClick={onInstall}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
            riskLevel === 'SAFE'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : riskLevel === 'MEDIUM'
              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
              : 'bg-gray-400 text-white hover:bg-gray-500 cursor-not-allowed'
          }`}
          disabled={riskLevel === 'RISKY'}
        >
          {riskLevel === 'RISKY' ? '❌ Not Recommended' : '📥 Install with Safe Settings'}
        </button>
        {onSuggestAlternatives && (
          <button
            onClick={onSuggestAlternatives}
            className="flex-1 px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all"
          >
            💡 See Alternatives
          </button>
        )}
      </div>

      {/* Permission Details Modal */}
      {selectedPermission && (
        <PermissionExplanationModal
          permission={selectedPermission.permission.permissionName}
          decision={selectedPermission.permission.decision}
          explanation={selectedPermission.permission.explanation}
          confidence={selectedPermission.permission.confidence}
          isOpen={true}
          onClose={() => setSelectedPermission(null)}
        />
      )}
    </>
  );
}
