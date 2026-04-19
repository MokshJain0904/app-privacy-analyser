'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, TrendingDown, Lightbulb, ChevronRight, X } from 'lucide-react';
import { UserFriendlyPermissionName } from '@/lib/permission-names';
import { getUserFriendlyPermissionInfo, getRiskLevelFromScore } from '@/lib/user-friendly-permissions';

interface UserFriendlyPermissionRecommendation {
  permissionName: UserFriendlyPermissionName;
  decision: 'ACCEPT' | 'REJECT' | 'CAUTION';
  explanation: string;
  riskScore: number;
}

interface BeforeInstallationAnalyzerProps {
  appName: string;
  appCategory: string;
  appIcon?: string;
  appRating?: number;
  appDownloads?: string;
  recommendations: UserFriendlyPermissionRecommendation[];
  overallRiskScore: number;
  riskLevel: 'SAFE' | 'MEDIUM' | 'RISKY';
  onInstall?: () => void;
  onSuggestAlternatives?: () => void;
}

export function BeforeInstallationAnalyzer({
  appName,
  appCategory,
  appIcon,
  appRating,
  appDownloads,
  recommendations,
  overallRiskScore,
  riskLevel,
  onInstall,
  onSuggestAlternatives,
}: BeforeInstallationAnalyzerProps) {
  const [selectedPermission, setSelectedPermission] = useState<UserFriendlyPermissionRecommendation | null>(null);

  const acceptCount = recommendations.filter(r => r.decision === 'ACCEPT').length;
  const rejectCount = recommendations.filter(r => r.decision === 'REJECT').length;
  const cautionCount = recommendations.filter(r => r.decision === 'CAUTION').length;

  const riskConfig = {
    SAFE: { color: 'green', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2, text: '🟢 SAFE', suggestion: 'This app respects your privacy. Safe to install!' },
    MEDIUM: { color: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertCircle, text: '🟡 MEDIUM', suggestion: 'Review the permissions carefully before installing.' },
    RISKY: { color: 'red', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, text: '🔴 RISKY', suggestion: 'This app requests too many sensitive permissions. Consider safer alternatives.' },
  };

  const config = riskConfig[riskLevel];
  const RiskIcon = config.icon;

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
            <strong>💡 Before Installing:</strong> Review which permissions this app needs. You can grant essential permissions and deny unnecessary ones during installation.
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
              ❌ Permissions to Deny ({rejectCount})
            </h3>
            <div className="space-y-3">
              {recommendations
                .filter(r => r.decision === 'REJECT')
                .map(rec => (
                  <PermissionButton
                    key={rec.permissionName}
                    recommendation={rec}
                    onClick={() => setSelectedPermission(rec)}
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
              ⚠️ Review These Permissions ({cautionCount})
            </h3>
            <div className="space-y-3">
              {recommendations
                .filter(r => r.decision === 'CAUTION')
                .map(rec => (
                  <PermissionButton
                    key={rec.permissionName}
                    recommendation={rec}
                    onClick={() => setSelectedPermission(rec)}
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
              ✅ Safe Permissions ({acceptCount})
            </h3>
            <div className="space-y-3">
              {recommendations
                .filter(r => r.decision === 'ACCEPT')
                .map(rec => (
                  <PermissionButton
                    key={rec.permissionName}
                    recommendation={rec}
                    onClick={() => setSelectedPermission(rec)}
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
          {riskLevel === 'RISKY' ? '❌ Not Recommended' : '📥 Install App'}
        </button>
        {onSuggestAlternatives && (
          <button
            onClick={onSuggestAlternatives}
            className="flex-1 px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all"
          >
            💡 See Safer Alternatives
          </button>
        )}
      </div>

      {/* Permission Details Modal */}
      {selectedPermission && (
        <PermissionDetailModal
          recommendation={selectedPermission}
          isOpen={true}
          onClose={() => setSelectedPermission(null)}
        />
      )}
    </>
  );
}

interface PermissionButtonProps {
  recommendation: UserFriendlyPermissionRecommendation;
  onClick: () => void;
}

function PermissionButton({ recommendation, onClick }: PermissionButtonProps) {
  const decisionStyles = {
    ACCEPT: { badge: 'bg-green-100 text-green-800', icon: <CheckCircle2 size={20} className="text-green-600" />, text: 'ACCEPT', bg: 'hover:bg-green-50' },
    REJECT: { badge: 'bg-red-100 text-red-800', icon: <AlertTriangle size={20} className="text-red-600" />, text: 'REJECT', bg: 'hover:bg-red-50' },
    CAUTION: { badge: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle size={20} className="text-yellow-600" />, text: 'REVIEW', bg: 'hover:bg-yellow-50' },
  };

  const styles = decisionStyles[recommendation.decision];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left border border-gray-200 rounded-lg p-4 transition-all duration-200 ${styles.bg} hover:shadow-md hover:border-gray-300`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0">
              {styles.icon}
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {recommendation.permissionName}
            </h3>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${styles.badge}`}>
              {styles.text}
            </span>
          </div>

          <p className="text-sm text-gray-700 ml-8 line-clamp-2">
            {recommendation.explanation}
          </p>

          <div className="flex items-center gap-4 mt-3 ml-8 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Risk:</span>
              <div className="w-24 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    recommendation.riskScore > 70
                      ? 'bg-red-500'
                      : recommendation.riskScore > 50
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${recommendation.riskScore}%` }}
                />
              </div>
              <span className="text-gray-600">{recommendation.riskScore}%</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 text-gray-400 mt-1">
          <ChevronRight size={24} />
        </div>
      </div>
    </button>
  );
}

interface PermissionDetailModalProps {
  recommendation: UserFriendlyPermissionRecommendation;
  isOpen: boolean;
  onClose: () => void;
}

function PermissionDetailModal({ recommendation, isOpen, onClose }: PermissionDetailModalProps) {
  if (!isOpen) return null;

  const permInfo = getUserFriendlyPermissionInfo(recommendation.permissionName);
  if (!permInfo) return null;

  const decisionColors = {
    ACCEPT: { bg: 'bg-green-50', text: 'text-green-700', icon: '✅' },
    REJECT: { bg: 'bg-red-50', text: 'text-red-700', icon: '❌' },
    CAUTION: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: '⚠️' },
  };

  const colors = decisionColors[recommendation.decision];
  const riskLevel = permInfo.riskScore > 70 ? '🔴 CRITICAL' : permInfo.riskScore > 50 ? '🟡 HIGH' : '🟢 LOW';

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
          {/* Header */}
          <div className={`${colors.bg} px-6 py-4 flex items-start justify-between border-b border-gray-200`}>
            <div className="flex items-start gap-3 flex-1">
              <div className={`text-2xl flex-shrink-0`}>{colors.icon}</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{permInfo.name}</h2>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
            {/* Recommendation Section */}
            <div className={`${colors.bg} rounded-lg p-4 border-l-4 border-current`}>
              <div className={`font-semibold ${colors.text} mb-2 text-lg`}>
                Recommendation: {recommendation.decision}
              </div>
              <p className="text-gray-700">{recommendation.explanation}</p>
            </div>

            {/* Risk Score */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Risk Level:</span>
                <span className="text-xl font-bold">{riskLevel}</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    permInfo.riskScore > 70
                      ? 'bg-red-500'
                      : permInfo.riskScore > 50
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${permInfo.riskScore}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-600">Score: {permInfo.riskScore}/100</div>
            </div>

            {/* What It Does */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What This Permission Does</h3>
              <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{permInfo.whatItDoes}</p>
            </div>

            {/* What It Can Access */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">What It Can Access</h3>
              <ul className="space-y-2">
                {permInfo.whatItCanAccess.map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-gray-700">
                    <span className="text-orange-600 font-bold flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Privacy & Security Risks</h3>
              <ul className="space-y-2">
                {permInfo.risks.map((risk, idx) => (
                  <li key={idx} className="flex gap-3 text-gray-700">
                    <span className="text-red-600 font-bold flex-shrink-0">⚠️</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Common Uses */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Legitimate Uses</h3>
              <ul className="space-y-2">
                {permInfo.commonUses.map((use, idx) => (
                  <li key={idx} className="flex gap-3 text-gray-700">
                    <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                    <span>{use}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Red Flags */}
            {permInfo.redFlags.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Red Flags - Be Suspicious If...</h3>
                <ul className="space-y-2">
                  {permInfo.redFlags.map((flag, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-700 bg-red-50 p-2 rounded">
                      <span className="text-red-600 font-bold flex-shrink-0">🚩</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
