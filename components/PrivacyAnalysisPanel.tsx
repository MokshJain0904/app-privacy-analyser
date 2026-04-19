'use client';

import React, { useState } from 'react';
import { AlertCircle, TrendingUp, Shield, AlertTriangle, CheckCircle, Database, Radio, Loader2 } from 'lucide-react';

interface TrackerInfo {
  id: string;
  name: string;
  categories: string[];
  website: string;
  description?: string;
}

interface TrackerCategory {
  category: string;
  count: number;
}

interface LeakageIndicator {
  hasUnexpectedLocationTracking: boolean;
  hasUnexpectedAudioCapture: boolean;
  hasUnexpectedContactAccess: boolean;
  hasUnexpectedPhotoAccess: boolean;
  hasExcessiveDataAccess: boolean;
  showsConcernedBehavior: boolean;
}

interface SuspiciousPermission {
  permission: string;
  userFriendlyName: string;
  leakageRisk: 'NORMAL' | 'SUSPICIOUS' | 'CRITICAL';
  recommendation: string;
}

interface PrivacyAnalysisProps {
  appName: string;
  appCategory: string;
  exodusData?: {
    found: boolean;
    trackerCount?: number;
    trackerRiskLevel?: string;
    trackerRiskScore?: number;
    trackers?: TrackerInfo[];
    trackerCategories?: TrackerCategory[];
    leakageIndicators?: Record<string, boolean>;
  };
  leakageData?: {
    leakageScore: number;
    leakageLevel: 'LOW' | 'MODERATE' | 'CRITICAL';
    overallAssessment: string;
    suspiciousPermissions: SuspiciousPermission[];
    leakageIndicators: LeakageIndicator;
    suspiciousCount: number;
    permissionCount: number;
  };
  isLoading?: boolean;
}

export const PrivacyAnalysisPanel: React.FC<PrivacyAnalysisProps> = ({
  appName,
  appCategory,
  exodusData,
  leakageData,
  isLoading,
}) => {
  const [expandedTracker, setExpandedTracker] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-10 bg-white rounded-[2rem] border border-slate-200 flex items-center justify-center gap-4">
        <Loader2 className="w-6 h-6 animate-spin text-red-500" />
        <span className="font-bold text-slate-600">Scanning for trackers & leakage vectors...</span>
      </div>
    );
  }

  const exodusRisk = exodusData?.trackerRiskScore || 0;
  const leakageRisk = leakageData?.leakageScore || 0;
  const combinedRisk = Math.max(exodusRisk, leakageRisk);

  const riskConfig = {
    color: combinedRisk >= 60 ? 'text-red-600' : combinedRisk >= 30 ? 'text-amber-600' : 'text-green-600',
    bg: combinedRisk >= 60 ? 'bg-red-50 border-red-200' : combinedRisk >= 30 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200',
    label: combinedRisk >= 60 ? '🔴 CRITICAL' : combinedRisk >= 30 ? '🟡 MODERATE' : '🟢 LOW',
    barColor: combinedRisk >= 60 ? 'bg-red-500' : combinedRisk >= 30 ? 'bg-amber-500' : 'bg-green-500',
  };

  const trackerRiskConfig = {
    color: exodusData?.trackerRiskLevel === 'RISKY' ? 'text-red-600' : exodusData?.trackerRiskLevel === 'MEDIUM' ? 'text-amber-600' : 'text-green-600',
    bg: exodusData?.trackerRiskLevel === 'RISKY' ? 'bg-red-50 border-red-100' : exodusData?.trackerRiskLevel === 'MEDIUM' ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100',
    iconColor: exodusData?.trackerRiskLevel === 'RISKY' ? 'text-red-600' : exodusData?.trackerRiskLevel === 'MEDIUM' ? 'text-amber-600' : 'text-green-600',
    iconBg: exodusData?.trackerRiskLevel === 'RISKY' ? 'bg-red-100' : exodusData?.trackerRiskLevel === 'MEDIUM' ? 'bg-amber-100' : 'bg-green-100',
    barColor: exodusData?.trackerRiskLevel === 'RISKY' ? 'bg-red-500' : exodusData?.trackerRiskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-green-500',
  };

  const leakageIndicatorLabels: Record<string, string> = {
    hasAnalytics: '📊 Analytics',
    hasAdvertising: '📢 Advertising',
    hasIdentification: '🪪 ID Tracking',
    hasLocation: '📍 Location',
    hasPhoneNumber: '📞 Phone No.',
    hasEmail: '📧 Email',
    hasFileSharing: '📁 File Sharing',
  };

  return (
    <div className="space-y-8">

      {/* Combined Risk Score Header */}
      <div className={`p-8 rounded-[2rem] border-2 ${riskConfig.bg}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Privacy Risk Assessment</h3>
            <p className="text-slate-500 font-medium mt-1">{appName} · {appCategory}</p>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-black ${riskConfig.color}`}>{Math.round(combinedRisk)}%</div>
            <div className={`text-sm font-black mt-1 ${riskConfig.color}`}>{riskConfig.label}</div>
          </div>
        </div>
        <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${riskConfig.barColor}`}
            style={{ width: `${Math.round(combinedRisk)}%` }}
          />
        </div>
        <div className="mt-4 flex gap-6 text-sm font-semibold text-slate-600">
          {exodusData?.found && (
            <span>Tracker Risk: <span className={trackerRiskConfig.color}>{exodusData.trackerRiskScore}%</span></span>
          )}
          {leakageData && (
            <span>Permission Leakage: <span className={leakageData.leakageScore >= 60 ? 'text-red-600' : leakageData.leakageScore >= 30 ? 'text-amber-600' : 'text-green-600'}>{leakageData.leakageScore}%</span></span>
          )}
        </div>
      </div>

      {/* Embedded Tracker Detection Card — Premium Style */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
        {/* Card Header */}
        <div className={`p-8 ${exodusData?.found ? trackerRiskConfig.bg : 'bg-green-50 border-green-100'} border-b`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${exodusData?.found ? trackerRiskConfig.iconBg : 'bg-green-100'}`}>
                <Radio className={`w-6 h-6 ${exodusData?.found ? trackerRiskConfig.iconColor : 'text-green-600'}`} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Embedded Tracker Detection</h3>
                <p className="text-sm text-slate-500 font-medium">Powered by Exodus Privacy Database</p>
              </div>
            </div>
            {exodusData?.found ? (
              <div className={`text-3xl font-black ${trackerRiskConfig.color}`}>
                {exodusData.trackerCount} Tracker{exodusData.trackerCount !== 1 ? 's' : ''}
              </div>
            ) : (
              <span className="text-green-600 font-black text-sm bg-green-100 px-4 py-2 rounded-full">✓ Clean App</span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-8 space-y-6">
          {!exodusData?.found ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-5xl">🛡️</div>
              <p className="font-black text-slate-900 text-lg">No trackers found in Exodus database.</p>
              <p className="text-slate-500 text-sm">This app has not been flagged for known embedded tracking SDKs.</p>
            </div>
          ) : (
            <>
              {/* Risk Score Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-slate-600">
                  <span>Tracker Risk Score</span>
                  <span className={trackerRiskConfig.color}>
                    {exodusData.trackerRiskScore}% — {exodusData.trackerRiskLevel}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${trackerRiskConfig.barColor}`}
                    style={{ width: `${exodusData.trackerRiskScore}%` }}
                  />
                </div>
              </div>

              {/* Leakage Indicator Badges */}
              {exodusData.leakageIndicators && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(exodusData.leakageIndicators).map(([key, value]) => (
                    <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
                      value ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-slate-50 border border-slate-100 text-slate-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${value ? 'bg-red-500' : 'bg-slate-300'}`} />
                      {leakageIndicatorLabels[key] || key}
                    </div>
                  ))}
                </div>
              )}

              {/* Tracker Category Summary */}
              {exodusData.trackerCategories && exodusData.trackerCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {exodusData.trackerCategories.map((cat) => (
                    <span key={cat.category} className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs font-black uppercase">
                      {cat.category} ({cat.count})
                    </span>
                  ))}
                </div>
              )}

              {/* Full Tracker List */}
              {exodusData.trackers && exodusData.trackers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider">Detected Trackers</h4>
                  <div className="grid gap-3">
                    {exodusData.trackers.map((tracker) => (
                      <div
                        key={tracker.id}
                        className="flex items-start gap-4 p-4 bg-red-50/50 border border-red-100 rounded-2xl cursor-pointer hover:bg-red-50 transition"
                        onClick={() => setExpandedTracker(expandedTracker === tracker.id ? null : tracker.id)}
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <Radio className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900">{tracker.name}</span>
                            {tracker.categories?.map((cat) => (
                              <span key={cat} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">{cat}</span>
                            ))}
                          </div>
                          {expandedTracker === tracker.id && (
                            <>
                              {tracker.description && (
                                <p className="text-slate-500 text-xs mt-2">{tracker.description}</p>
                              )}
                              {tracker.website && (
                                <a href={tracker.website} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block truncate">{tracker.website}</a>
                              )}
                            </>
                          )}
                        </div>
                        <TrendingUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Permission Leakage Card */}
      {leakageData && (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-8 border-b bg-blue-50 border-blue-100 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-2xl">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Permission Leakage Analysis</h3>
              <p className="text-sm text-slate-500 font-medium">{leakageData.suspiciousCount} suspicious out of {leakageData.permissionCount} permissions</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <p className="text-slate-700 font-medium leading-relaxed text-sm">{leakageData.overallAssessment}</p>
            </div>

            {leakageData.suspiciousPermissions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider">Suspicious Permissions</h4>
                {leakageData.suspiciousPermissions.map((perm, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border-l-4 ${
                      perm.leakageRisk === 'CRITICAL'
                        ? 'bg-red-50 border-l-red-500'
                        : perm.leakageRisk === 'SUSPICIOUS'
                        ? 'bg-amber-50 border-l-amber-500'
                        : 'bg-slate-50 border-l-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {perm.leakageRisk === 'CRITICAL' && <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />}
                      {perm.leakageRisk === 'SUSPICIOUS' && <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />}
                      <div>
                        <p className="font-black text-slate-900 text-sm">{perm.userFriendlyName}</p>
                        <p className="text-slate-500 text-xs mt-1">{perm.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!exodusData?.found && !leakageData && (
        <div className="p-10 bg-slate-50 rounded-[2rem] border border-slate-200 text-center">
          <p className="text-slate-500 font-medium">No privacy leakage data available for this app.</p>
        </div>
      )}
    </div>
  );
};
