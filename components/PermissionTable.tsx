'use client';

import React, { useState, Fragment } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserFriendlyPermissionName } from '@/lib/permission-names';
import { getUserFriendlyPermissionInfo } from '@/lib/user-friendly-permissions';

interface PermissionTableRow {
  permissionName: UserFriendlyPermissionName;
  decision: 'ACCEPT' | 'REJECT' | 'CAUTION';
  explanation: string;
  riskScore: number;
  isExpanded: boolean;
}

interface PermissionTableProps {
  mode: 'before-install' | 'already-install';
  appName: string;
  appCategory: string;
  rows: PermissionTableRow[];
  overallRiskScore: number;
  riskLevel: 'SAFE' | 'MEDIUM' | 'RISKY';
  onRowClick: (permissionName: UserFriendlyPermissionName) => void;
}

export function PermissionTable({
  mode,
  appName,
  appCategory,
  rows,
  overallRiskScore,
  riskLevel,
  onRowClick,
}: PermissionTableProps) {
  const riskConfig = {
    SAFE: { color: 'green', text: '🟢 SAFE', bg: 'bg-green-50' },
    MEDIUM: { color: 'yellow', text: '🟡 MEDIUM', bg: 'bg-yellow-50' },
    RISKY: { color: 'red', text: '🔴 RISKY', bg: 'bg-red-50' },
  };

  const config = riskConfig[riskLevel];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className={`${config.bg} border-b border-slate-200 p-6`}>
        <div className="w-full mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{appName}</h2>
              <p className="text-sm text-slate-600 mt-1">
                {mode === 'before-install' ? '📱 Before Installation Analysis' : '🔍 Already Installed Analysis'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-slate-900">{overallRiskScore}%</div>
              <div className="text-sm font-bold text-slate-600 mt-1">{config.text}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span className="font-semibold text-slate-700">
                {rows.filter(r => r.decision === 'ACCEPT').length} Accept
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="font-semibold text-slate-700">
                {rows.filter(r => r.decision === 'CAUTION').length} Review
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">❌</span>
              <span className="font-semibold text-slate-700">
                {rows.filter(r => r.decision === 'REJECT').length} Reject
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-left text-sm font-black text-slate-700 uppercase tracking-wider">
                Permission
              </th>
              <th className="px-6 py-4 text-center text-sm font-black text-slate-700 uppercase tracking-wider">
                Recommendation
              </th>
              <th className="px-6 py-4 text-right text-sm font-black text-slate-700 uppercase tracking-wider">
                Risk
              </th>
              <th className="px-6 py-4 text-center text-sm font-black text-slate-700 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => {
              const permInfo = getUserFriendlyPermissionInfo(row.permissionName);
              const decisionIcon =
                row.decision === 'ACCEPT'
                  ? { icon: '✅', color: 'text-green-600', bg: 'bg-green-50' }
                  : row.decision === 'CAUTION'
                  ? { icon: '⚠️', color: 'text-yellow-600', bg: 'bg-yellow-50' }
                  : { icon: '❌', color: 'text-red-600', bg: 'bg-red-50' };

              const riskColor =
                row.riskScore > 70
                  ? 'text-red-600 bg-red-50'
                  : row.riskScore > 50
                  ? 'text-yellow-600 bg-yellow-50'
                  : 'text-green-600 bg-green-50';

              return (
                <Fragment key={row.permissionName}>
                  <tr className="hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {row.decision === 'ACCEPT'
                            ? '✅'
                            : row.decision === 'CAUTION'
                            ? '⚠️'
                            : '❌'}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">{row.permissionName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {permInfo?.riskScore}% risk level
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          row.decision === 'ACCEPT'
                            ? 'bg-green-100 text-green-800'
                            : row.decision === 'CAUTION'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {row.decision}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${riskColor}`}>
                        {row.riskScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onRowClick(row.permissionName)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        {row.isExpanded ? (
                          <ChevronUp size={20} className="text-slate-600" />
                        ) : (
                          <ChevronDown size={20} className="text-slate-600" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row Details */}
                  {row.isExpanded && permInfo && (
                    <tr className="bg-slate-50 border-b-2 border-slate-200">
                      <td colSpan={4} className="px-6 py-6">
                        <div className="max-w-4xl mx-auto space-y-6">
                          {/* AI Summary */}
                          <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-2">AI Summary</h4>
                            <p className="text-slate-700 leading-relaxed">{row.explanation}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* What It Does */}
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                              <h4 className="font-bold text-slate-900 mb-2">What It Does</h4>
                              <p className="text-sm text-slate-700">{permInfo.whatItDoes}</p>
                            </div>

                            {/* Risk Level */}
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                              <h4 className="font-bold text-slate-900 mb-2">Risk Level</h4>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-slate-600">Score:</span>
                                  <span
                                    className={`font-bold ${
                                      permInfo.riskScore > 70
                                        ? 'text-red-600'
                                        : permInfo.riskScore > 50
                                        ? 'text-yellow-600'
                                        : 'text-green-600'
                                    }`}
                                  >
                                    {permInfo.riskScore}/100
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
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
                              </div>
                            </div>
                          </div>

                          {/* What It Can Access */}
                          <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-3">What It Can Access</h4>
                            <ul className="space-y-2">
                              {permInfo.whatItCanAccess.map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-sm text-slate-700">
                                  <span className="text-orange-600 font-bold flex-shrink-0">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Risks */}
                          <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-3">Privacy & Security Risks</h4>
                            <ul className="space-y-2">
                              {permInfo.risks.map((risk, idx) => (
                                <li key={idx} className="flex gap-3 text-sm text-slate-700">
                                  <span className="text-red-600 font-bold flex-shrink-0">⚠️</span>
                                  <span>{risk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Common Uses */}
                          <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-3">Legitimate Uses</h4>
                            <ul className="space-y-2">
                              {permInfo.commonUses.map((use, idx) => (
                                <li key={idx} className="flex gap-3 text-sm text-slate-700">
                                  <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                                  <span>{use}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Red Flags */}
                          {permInfo.redFlags.length > 0 && (
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                              <h4 className="font-bold text-red-900 mb-3">Red Flags - Be Suspicious If</h4>
                              <ul className="space-y-2">
                                {permInfo.redFlags.map((flag, idx) => (
                                  <li key={idx} className="flex gap-3 text-sm text-red-800">
                                    <span className="font-bold flex-shrink-0">🚩</span>
                                    <span>{flag}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
