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
  overallRiskScore: number;
  recommendations: UserFriendlyPermissionRecommendation[];
  onInstall?: () => void;
  onSuggestAlternatives?: () => void;
}

export function BeforeInstallationAnalyzer({
  appName,
  appCategory,
  appIcon,
  appRating,
  appDownloads,
  overallRiskScore,
  recommendations,
  onInstall,
  onSuggestAlternatives,
}: BeforeInstallationAnalyzerProps) {
  const [selectedPermission, setSelectedPermission] = useState<UserFriendlyPermissionRecommendation | null>(null);

  const acceptCount = recommendations.filter(r => r.decision === 'ACCEPT').length;
  const rejectCount = recommendations.filter(r => r.decision === 'REJECT').length;
  const cautionCount = recommendations.filter(r => r.decision === 'CAUTION').length;

  // Compute how much the risk score would drop if the user rejects all REJECT-flagged permissions.
  // Uses the same asymptotic decay k=0.036 as the scoring engine for consistency.
  const k = 0.036;

  const acceptedRawScore = recommendations
    .filter(r => r.decision !== 'REJECT')
    .reduce((sum, r) => {
      const penalty = r.decision === 'CAUTION' ? r.riskScore * 0.2 : r.riskScore * 0.02;
      return sum + penalty;
    }, 0);
  const scoreAfterRejecting = Math.min(100, Math.round(100 * (1 - Math.exp(-k * acceptedRawScore))));
  const riskReduction = Math.max(0, overallRiskScore - scoreAfterRejecting);

  return (
    <>

      {/* Summary Stats Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex justify-around items-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{acceptCount}</div>
            <div className="text-sm font-semibold text-slate-600 mt-1">Accept</div>
          </div>
          <div className="w-px h-12 bg-slate-200" />
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{cautionCount}</div>
            <div className="text-sm font-semibold text-slate-600 mt-1">Review</div>
          </div>
          <div className="w-px h-12 bg-slate-200" />
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{rejectCount}</div>
            <div className="text-sm font-semibold text-slate-600 mt-1">Reject</div>
          </div>
        </div>

        {riskReduction > 0 && (
          <div className="mt-6 p-4 bg-green-100 rounded-xl border border-green-200">
            <div className="flex items-center gap-3 text-sm text-green-800 font-semibold">
              <TrendingDown size={20} />
              <span>Following recommendations reduces your risk score by <strong>{riskReduction} points</strong> ({overallRiskScore}% → {scoreAfterRejecting}%)</span>
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
          className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all bg-blue-600 text-white hover:bg-blue-700"
        >
          📥 Open in Play Store
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
