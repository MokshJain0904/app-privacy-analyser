'use client';

import { PermissionDecision, ConfidenceLevel } from '@/lib/permission-recommendations';
import { PermissionInfo, PERMISSION_EXPLANATIONS } from '@/lib/permission-explanations';
import { ChevronRight, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface PermissionCardProps {
  permission: string;
  decision: PermissionDecision;
  explanation: string;
  confidence: ConfidenceLevel;
  riskScore: number;
  onClick: () => void;
}

export function PermissionCard({
  permission,
  decision,
  explanation,
  confidence,
  riskScore,
  onClick,
}: PermissionCardProps) {
  const permInfo = PERMISSION_EXPLANATIONS[permission];

  const decisionStyles: Record<PermissionDecision, { badge: string; icon: any; text: string; bg: string }> = {
    ACCEPT: {
      badge: 'bg-green-100 text-green-800',
      icon: <CheckCircle2 size={20} className="text-green-600" />,
      text: 'ACCEPT',
      bg: 'hover:bg-green-50'
    },
    REJECT: {
      badge: 'bg-red-100 text-red-800',
      icon: <AlertTriangle size={20} className="text-red-600" />,
      text: 'REJECT',
      bg: 'hover:bg-red-50'
    },
    CAUTION: {
      badge: 'bg-yellow-100 text-yellow-800',
      icon: <AlertCircle size={20} className="text-yellow-600" />,
      text: 'REVIEW',
      bg: 'hover:bg-yellow-50'
    },
  };

  const styles = decisionStyles[decision];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left border border-gray-200 rounded-lg p-4 transition-all duration-200 ${styles.bg} hover:shadow-md hover:border-gray-300`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left side: Icon, Name, and Explanation */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0">
              {styles.icon}
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {permInfo?.name || permission}
            </h3>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${styles.badge}`}>
              {styles.text}
            </span>
          </div>

          {/* Technical name */}
          <p className="text-xs text-gray-500 ml-8 mb-2 font-mono">
            {permInfo?.technicalName || permission}
          </p>

          {/* Explanation */}
          <p className="text-sm text-gray-700 ml-8 line-clamp-2">
            {explanation}
          </p>

          {/* Risk indicator and confidence */}
          <div className="flex items-center gap-4 mt-3 ml-8 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Risk:</span>
              <div className="w-24 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    riskScore > 70
                      ? 'bg-red-500'
                      : riskScore > 50
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>
              <span className="text-gray-600">{riskScore}%</span>
            </div>

            {confidence !== 'HIGH' && (
              <span className="text-gray-500">
                Confidence: {confidence === 'MEDIUM' ? '📊 Medium' : '❓ Low'}
              </span>
            )}
          </div>
        </div>

        {/* Right side: Click indicator */}
        <div className="flex-shrink-0 text-gray-400 mt-1">
          <ChevronRight size={24} />
        </div>
      </div>
    </button>
  );
}
