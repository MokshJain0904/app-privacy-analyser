'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  Search,
  LayoutGrid,
  ArrowRightLeft,
  Info,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Camera,
  Mic,
  Users,
  HardDrive,
  Phone,
  MessageSquare,
  Calendar,
  Bell,
  Bluetooth,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PERMISSIONS = [
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'camera', label: 'Camera', icon: Camera },
  { id: 'microphone', label: 'Microphone', icon: Mic },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'storage', label: 'Storage/Files', icon: HardDrive },
  { id: 'phone', label: 'Phone/Call Logs', icon: Phone },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'bluetooth', label: 'Nearby Devices/Bluetooth', icon: Bluetooth },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'check' | 'compare'>('check');
  const [appName, setAppName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [compareApps, setCompareApps] = useState({ app1: '', app2: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scrapedData, setScrapedData] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleScrape = async () => {
    if (!appName) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/scrape?appName=${encodeURIComponent(appName)}`);
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        setScrapedData(data);
        // Map scraped permissions to our checklist if possible
        // This is a simplified mapping for the UI
        const mappedPermissions = PERMISSIONS.filter(p =>
          data.permissions.some((sp: string) => sp.toLowerCase().includes(p.id))
        ).map(p => p.id);

        setSelectedPermissions(mappedPermissions);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to fetch app data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!appName || selectedPermissions.length === 0) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'analyze',
          appName,
          permissions: selectedPermissions.map(id => PERMISSIONS.find(p => p.id === id)?.label),
          scrapedData // Pass scraped data for storage
        })
      });
      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      console.error(error);
      alert('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCompare = async () => {
    if (!compareApps.app1 || !compareApps.app2) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'compare',
          app1: compareApps.app1,
          app2: compareApps.app2
        })
      });
      const data = await response.json();
      setComparisonResult(data);
    } catch (error) {
      console.error(error);
      alert('Comparison failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">PrivaGuard</h1>
          </div>
          <nav className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('check')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'check' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Permission Checker
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'compare' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Compare Apps
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {activeTab === 'check' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Analyze App Privacy</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Enter an app name and select the permissions it requests to get an AI-powered privacy risk assessment.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
              {/* App Input */}
              <div className="space-y-4">
                <label className="text-sm font-semibold text-slate-700">App Name</label>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. WhatsApp, Instagram, TikTok..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleScrape}
                    disabled={isLoading || !appName}
                    className="px-6 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Fetch Info'}
                  </button>
                </div>
              </div>

              {scrapedData && (
                <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in zoom-in duration-300">
                  <img src={scrapedData.icon} alt={scrapedData.title} className="w-12 h-12 rounded-lg shadow-sm" />
                  <div>
                    <h4 className="font-bold text-indigo-900">{scrapedData.title}</h4>
                    <p className="text-xs text-indigo-600">{scrapedData.genre} • {scrapedData.score.toFixed(1)} ★</p>
                  </div>
                </div>
              )}

              {/* Permissions Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Requested Permissions</label>
                  <span className="text-xs text-slate-400">{selectedPermissions.length} selected</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {PERMISSIONS.map((perm) => {
                    const Icon = perm.icon;
                    const isSelected = selectedPermissions.includes(perm.id);
                    return (
                      <button
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 text-center",
                          isSelected
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                            : "border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <Icon className={cn("w-6 h-6", isSelected ? "text-indigo-600" : "text-slate-400")} />
                        <span className="text-xs font-medium leading-tight">{perm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !appName || selectedPermissions.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                Analyze Privacy Risks
              </button>
            </div>

            {/* Results Section */}
            {analysisResult && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <ShieldCheck className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-bold">Analysis Results for {appName}</h3>
                    </div>
                    {analysisResult.overallRiskScore !== undefined && (
                      <div className={cn(
                        "px-4 py-2 rounded-xl font-bold text-white shadow-sm",
                        analysisResult.overallRiskScore > 7 ? "bg-red-500" :
                          analysisResult.overallRiskScore > 4 ? "bg-amber-500" : "bg-green-500"
                      )}>
                        Risk Score: {analysisResult.overallRiskScore}/10
                      </div>
                    )}
                  </div>

                  {analysisResult.error ? (
                    <div className="bg-red-50 p-6 rounded-xl border border-red-100 space-y-3">
                      <div className="flex items-center gap-2 text-red-600 font-bold">
                        <AlertTriangle className="w-5 h-5" />
                        <h4>Analysis Error</h4>
                      </div>
                      <p className="text-sm text-red-700">{analysisResult.error}</p>
                      <p className="text-xs text-red-600">Please check your .env.local file and make sure GOOGLE_AI_API_KEY is correct.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid md:grid-cols-3 gap-6">
                        {/* Safe */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-green-600 font-bold">
                            <CheckCircle2 className="w-5 h-5" />
                            <h4>Safe</h4>
                          </div>
                          <ul className="text-sm text-slate-600 space-y-1">
                            {analysisResult.permissions?.filter((p: any) => p.riskLevel?.toLowerCase() === 'safe').map((p: any, i: number) => (
                              <li key={i} className="flex items-start gap-2 group relative">
                                <span className="mt-1 flex-shrink-0">•</span>
                                <span className="cursor-help border-b border-dotted border-slate-300" title={p.justification}>{p.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {/* Review */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-amber-600 font-bold">
                            <Info className="w-5 h-5" />
                            <h4>Review Needed</h4>
                          </div>
                          <ul className="text-sm text-slate-600 space-y-1">
                            {analysisResult.permissions?.filter((p: any) => p.riskLevel?.toLowerCase().includes('review')).map((p: any, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-1 flex-shrink-0">•</span>
                                <span className="cursor-help border-b border-dotted border-amber-300" title={p.justification}>{p.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {/* High Risk */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-red-600 font-bold">
                            <AlertTriangle className="w-5 h-5" />
                            <h4>High Risk</h4>
                          </div>
                          <ul className="text-sm text-slate-600 space-y-1">
                            {analysisResult.permissions?.filter((p: any) => p.riskLevel?.toLowerCase().includes('high')).map((p: any, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-1 flex-shrink-0">•</span>
                                <span className="cursor-help border-b border-dotted border-red-300" title={`${p.justification} - Potential Misuse: ${p.potentialMisuse}`}>{p.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-bold text-slate-900 mb-2">Technical Summary</h4>
                            <p className="text-slate-600 text-sm leading-relaxed">{analysisResult.summary}</p>
                          </div>
                          {analysisResult.keyConcerns && (
                            <div>
                              <h4 className="font-bold text-slate-900 mb-2">Key Concerns</h4>
                              <ul className="space-y-2">
                                {analysisResult.keyConcerns.map((concern: string, i: number) => (
                                  <li key={i} className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                                    <AlertTriangle className="w-4 h-4" />
                                    {concern}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-indigo-900">Expert Recommendation</h4>
                            <p className="text-indigo-700 text-sm leading-relaxed">{analysisResult.recommendation}</p>
                          </div>
                          <div className="text-center px-4 py-2 bg-white rounded-lg border border-indigo-200 shadow-sm">
                            <span className="text-[10px] uppercase font-bold text-indigo-400 block">Analysis Confidence</span>
                            <span className="text-indigo-700 font-bold">{analysisResult.confidence || 'Medium'}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Placeholder for Results (only show if no analysis result) */}
            {!analysisResult && (
              <div className="grid md:grid-cols-3 gap-6 opacity-50">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-bold">Safe Permissions</h3>
                  <p className="text-sm text-slate-500">Permissions that are standard for this app category.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Info className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-bold">Review Needed</h3>
                  <p className="text-sm text-slate-500">Permissions that might be unnecessary or invasive.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="font-bold">High Risk</h3>
                  <p className="text-sm text-slate-500">Potential privacy leakage or security concerns.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Compare App Safety</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Compare two similar apps to see which one respects your privacy more.
              </p>
            </div>

            <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-6">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <label className="text-sm font-semibold text-slate-700">First App</label>
                <input
                  type="text"
                  placeholder="e.g. WhatsApp"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={compareApps.app1}
                  onChange={(e) => setCompareApps(prev => ({ ...prev, app1: e.target.value }))}
                />
              </div>

              <div className="bg-indigo-100 p-3 rounded-full">
                <ArrowRightLeft className="w-6 h-6 text-indigo-600" />
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <label className="text-sm font-semibold text-slate-700">Second App</label>
                <input
                  type="text"
                  placeholder="e.g. Signal"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={compareApps.app2}
                  onChange={(e) => setCompareApps(prev => ({ ...prev, app2: e.target.value }))}
                />
              </div>
            </div>

            <button
              onClick={handleCompare}
              disabled={isAnalyzing || !compareApps.app1 || !compareApps.app2}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <LayoutGrid className="w-5 h-5" />}
              Compare & Recommend
            </button>

            {/* Comparison Result */}
            {comparisonResult && (
              <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/30 p-2 rounded-lg">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">AI Recommendation</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <div className="text-[10px] uppercase text-indigo-300 font-bold">Winner</div>
                      <div className="text-green-400 font-bold">{comparisonResult.winner}</div>
                    </div>
                    <div className="bg-indigo-500/50 px-4 py-2 rounded-xl text-center">
                      <div className="text-[10px] uppercase text-indigo-300">Confidence</div>
                      <div className="text-sm font-bold">{comparisonResult.confidence || 'High'}</div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-indigo-200 font-semibold uppercase tracking-wider text-xs">Security Comparison</h4>
                    <p className="text-lg leading-relaxed">{comparisonResult.reasoning}</p>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <div className="text-[10px] uppercase text-indigo-300 mb-1">{compareApps.app1}</div>
                        <div className="text-2xl font-bold">{comparisonResult.app1RiskScore || 0}<span className="text-xs text-indigo-400">/10 Risk</span></div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <div className="text-[10px] uppercase text-indigo-300 mb-1">{compareApps.app2}</div>
                        <div className="text-2xl font-bold">{comparisonResult.app2RiskScore || 0}<span className="text-xs text-indigo-400">/10 Risk</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-indigo-200 font-semibold uppercase tracking-wider text-xs">Top Concerns</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase text-indigo-400 font-bold">{compareApps.app1}</span>
                        <div className="flex flex-wrap gap-2">
                          {comparisonResult.topConcerns?.app1?.map((c: string, i: number) => (
                            <span key={i} className="text-xs bg-red-500/20 text-red-200 px-2 py-1 rounded-md border border-red-500/30">{c}</span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase text-indigo-400 font-bold">{compareApps.app2}</span>
                        <div className="flex flex-wrap gap-2">
                          {comparisonResult.topConcerns?.app2?.map((c: string, i: number) => (
                            <span key={i} className="text-xs bg-red-500/20 text-red-200 px-2 py-1 rounded-md border border-red-500/30">{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h4 className="text-indigo-200 font-semibold uppercase tracking-wider text-xs">Feature Breakdown</h4>
                  <div className="grid gap-3">
                    {comparisonResult.detailedComparison?.map((item: any, i: number) => (
                      <div key={i} className="bg-white/5 p-4 rounded-2xl grid md:grid-cols-[160px_1fr_1fr] gap-4 items-center border border-white/5 hover:bg-white/10 transition-colors">
                        <span className="font-bold text-indigo-200 text-sm">{item.category}</span>
                        <div className="space-y-1">
                          <p className="text-xs text-indigo-100">{item.app1}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-indigo-100">{item.app2}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />
                    <p className="text-indigo-100 italic text-sm">{comparisonResult.finalVerdict}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Comparison Result Placeholder (only show if no comparison result) */}
            {!comparisonResult && (
              <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl space-y-6 opacity-50">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500/30 p-2 rounded-lg">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">AI Recommendation</h3>
                </div>
                <div className="h-24 bg-white/10 rounded-xl animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-12 bg-white/10 rounded-xl animate-pulse" />
                  <div className="h-12 bg-white/10 rounded-xl animate-pulse" />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-slate-200 text-center text-slate-400 text-sm">
        <p>© 2026 PrivaGuard. Protecting your digital footprint.</p>
      </footer>
    </div>
  );
}
