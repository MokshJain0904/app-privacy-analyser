'use client';

import { X, AlertTriangle, CheckCircle2, HelpCircle, Shield } from 'lucide-react';
import { PermissionInfo, PERMISSION_EXPLANATIONS } from '@/lib/permission-explanations';
import { PermissionDecision, ConfidenceLevel } from '@/lib/permission-recommendations';

interface PermissionExplanationModalProps {
  permission: string;
  decision: PermissionDecision;
  explanation: string;
  confidence: ConfidenceLevel;
  isOpen: boolean;
  onClose: () => void;
}

export function PermissionExplanationModal({
  permission,
  decision,
  explanation,
  confidence,
  isOpen,
  onClose,
}: PermissionExplanationModalProps) {
  if (!isOpen) return null;

  const permInfo = PERMISSION_EXPLANATIONS[permission];
  if (!permInfo) return null;

  const decisionColors: Record<PermissionDecision, { bg: string; text: string; icon: string }> = {
    ACCEPT: { bg: 'bg-green-50', text: 'text-green-700', icon: '✅' },
    REJECT: { bg: 'bg-red-50', text: 'text-red-700', icon: '❌' },
    CAUTION: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: '⚠️' },
  };

  const colors = decisionColors[decision];
  const riskLevel = permInfo.riskScore > 70 ? '🔴 CRITICAL' : permInfo.riskScore > 50 ? '🟡 HIGH' : '🟢 LOW';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
          {/* Header */}
          <div className={`${colors.bg} px-6 py-4 flex items-start justify-between border-b border-gray-200`}>
            <div className="flex items-start gap-3 flex-1">
              <div className={`text-2xl flex-shrink-0`}>{colors.icon}</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{permInfo.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{permInfo.technicalName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
            {/* Recommendation Section */}
            <div className={`${colors.bg} rounded-lg p-4 border-l-4 border-current`}>
              <div className={`font-semibold ${colors.text} mb-2 text-lg`}>
                Recommendation: {decision}
              </div>
              <p className="text-gray-700">{explanation}</p>
              <div className="mt-3 text-xs text-gray-600">
                Confidence: {confidence === 'HIGH' ? '🔒 High' : confidence === 'MEDIUM' ? '📊 Medium' : '❓ Low'}
              </div>
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
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Shield size={18} className="text-blue-600" />
                What This Permission Does
              </h3>
              <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{permInfo.whatItDoes}</p>
            </div>

            {/* What It Can Access */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-orange-600" />
                What It Can Access
              </h3>
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
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-600" />
                Privacy & Security Risks
              </h3>
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
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-600" />
                Legitimate Uses
              </h3>
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
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <HelpCircle size={18} className="text-red-600" />
                  Red Flags - Be Suspicious If...
                </h3>
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
