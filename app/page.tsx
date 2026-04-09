'use client';

import { useState, useEffect } from 'react';
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
  Loader2,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  X,
  Check,
  TrendingDown,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authService, type User } from '@/lib/auth-service';
import { useRouter } from 'next/navigation';

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

const PRIVACY_TIPS = [
  "Always check why a simple utility app requests access to your contacts or location.",
  "If a permission seems unnecessary for an app's core function, it's safer to deny it.",
  "App risk scores above 60% indicate critical over-permissiveness. Proceed with extreme caution.",
  "Using 'Allow only while using the app' is a great way to restrict background tracking.",
  "Regularly audit installed apps and revoke permissions you haven't used in months.",
  "Flashlight apps shouldn't need your precise GPS location. Question every unexpected request.",
  "Be wary of apps asking for accessibility services unless they genuinely assist with disabilities.",
  "A privacy score between 25% and 60% means the app is slightly over-permissive and requires your attention."
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
  const [showIntro, setShowIntro] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [privacyTip, setPrivacyTip] = useState(PRIVACY_TIPS[0]);
  const [showSafePerms, setShowSafePerms] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = authService.getUser();
    setUser(user);
    setPrivacyTip(PRIVACY_TIPS[Math.floor(Math.random() * PRIVACY_TIPS.length)]);
  }, []);

  const handleLogout = () => {
    authService.signOut();
    router.push('/login');
  };

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
    setShowSafePerms(false);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'analyze',
          appName,
          permissions: selectedPermissions.map(id => PERMISSIONS.find(p => p.id === id)?.label),
          scrapedData
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server error');
      setAnalysisResult({ ...data, appName, genre: scrapedData?.genre });
    } catch (error: any) {
      console.error(error);
      alert('Analysis Error: ' + error.message);
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
      if (!response.ok) throw new Error(data.error || 'Server error');
      setComparisonResult(data);
    } catch (error: any) {
      console.error(error);
      alert('Comparison Error: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewAudit = async (targetAppName: string) => {
    setActiveTab('check');
    setAppName(targetAppName);
    setIsLoading(true);
    let newScrapedData = null;
    let newSelectedPerms: string[] = [];
    try {
      const response = await fetch(`/api/scrape?appName=${encodeURIComponent(targetAppName)}`);
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        setIsLoading(false);
        return;
      } else {
        setScrapedData(data);
        newScrapedData = data;
        newSelectedPerms = PERMISSIONS.filter(p =>
          data.permissions.some((sp: string) => sp.toLowerCase().includes(p.id))
        ).map(p => p.id);
        setSelectedPermissions(newSelectedPerms);
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to fetch app data');
      setIsLoading(false);
      return;
    }

    setIsAnalyzing(true);
    setShowSafePerms(false);
    try {
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'analyze',
          appName: targetAppName,
          permissions: newSelectedPerms.map(id => PERMISSIONS.find(p => p.id === id)?.label),
          scrapedData: newScrapedData
        })
      });
      const analyzeData = await analyzeResponse.json();
      if (!analyzeResponse.ok) throw new Error(analyzeData.error || 'Server error');
      setAnalysisResult({ ...analyzeData, appName: targetAppName, genre: newScrapedData?.genre });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error(error);
      alert('Analysis Error: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (showIntro) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <div className="max-w-4xl w-full space-y-12 animate-in fade-in zoom-in duration-700">
          <div className="text-center space-y-6">
            <div className="inline-flex p-4 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-500/20 mb-4 animate-bounce">
              <ShieldCheck className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight">PrivaGuard <span className="text-indigo-500">AI</span></h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Your intelligent companion for mobile privacy. We scan, analyze, and protect your digital footprint from over-permissive applications.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-4 hover:bg-white/10 transition-all group">
              <div className="p-3 bg-green-500/20 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Search className="text-green-400 w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl">Scrape & Detect</h3>
              <p className="text-sm text-slate-400">Instantly fetch app categories and permissions directly from the Play Store.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-4 hover:bg-white/10 transition-all group">
              <div className="p-3 bg-indigo-500/20 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <ShieldAlert className="text-indigo-400 w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl">AI Audit</h3>
              <p className="text-sm text-slate-400">Gemini AI evaluates if permissions are actually necessary for the app's category.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-4 hover:bg-white/10 transition-all group">
              <div className="p-3 bg-amber-500/20 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <ArrowRightLeft className="text-amber-400 w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl">Comparison</h3>
              <p className="text-sm text-slate-400">Compare two apps side-by-side to find the most privacy-respecting alternative.</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <button
              onClick={() => setShowIntro(false)}
              className="px-12 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xl shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
            >
              Get Started
              <ArrowRight className="w-6 h-6" />
            </button>
            <p className="text-slate-500 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Learn how to protect your privacy in seconds
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowIntro(true)}>
            <div className="bg-indigo-600 p-2 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">PrivaGuard</h1>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('check')}
                className={cn(
                  "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                  activeTab === 'check' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                )}
              >
                Checker
              </button>
              <button
                onClick={() => setActiveTab('compare')}
                className={cn(
                  "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                  activeTab === 'compare' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                )}
              >
                Comparison
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 rounded-lg text-sm font-bold transition-all text-slate-600 hover:text-slate-900"
              >
                Global Stats
              </button>
            </nav>
            {user && (
              <div className="flex items-center gap-4">
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-bold text-slate-900">{user.email}</p>
                  <p className="text-[10px] text-slate-400">Active Session</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {activeTab === 'check' ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Guide Section */}
            <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
              <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <span className="px-4 py-1.5 bg-indigo-500/30 border border-indigo-400/30 rounded-full text-xs font-black uppercase tracking-widest">Guide</span>
                  <h2 className="text-4xl font-black leading-tight">Professional Privacy Audit in 3 Steps</h2>
                  <div className="space-y-4">
                    {[
                      { step: "01", text: "Enter the app name to scrape its Play Store category and permissions." },
                      { step: "02", text: "Review and select the exact permissions the app requested on your device." },
                      { step: "03", text: "Run the AI Analysis to see the safety score and detailed risk breakdown." }
                    ].map((s, i) => (
                      <div key={i} className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                        <span className="text-2xl font-black text-indigo-400">{s.step}</span>
                        <p className="text-sm text-indigo-100">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative hidden md:flex items-center justify-center">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-[100px]" />
                  <ShieldCheck className="w-64 h-64 text-indigo-400/20" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl animate-pulse">
                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                    <p className="mt-4 font-bold text-center">Safety Verified</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
              <div className="space-y-8">
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 p-10 space-y-10">
                  {/* App Input */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-wider">01. Identity Application</label>
                      <HelpCircle className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="relative flex gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search App Name..."
                          className="w-full pl-14 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-lg"
                          value={appName}
                          onChange={(e) => setAppName(e.target.value)}
                        />
                      </div>
                      <button
                        onClick={handleScrape}
                        disabled={isLoading || !appName}
                        className="px-8 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-3 shadow-lg shadow-slate-200"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                          <>
                            Fetch Info
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {scrapedData && (
                    <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-200 animate-in fade-in zoom-in slide-in-from-left-4 duration-500">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                        <img src={scrapedData.icon} alt={scrapedData.title} className="relative w-24 h-24 rounded-2xl shadow-xl border border-white" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-3xl font-black text-slate-900">{scrapedData.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest">{scrapedData.genre}</span>
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1">
                            {scrapedData.score.toFixed(1)} ★
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Permissions Grid */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-wider">02. Select Requested Permissions</label>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{selectedPermissions.length} SELECTED</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {PERMISSIONS.map((perm) => {
                        const Icon = perm.icon;
                        const isSelected = selectedPermissions.includes(perm.id);
                        return (
                          <button
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className={cn(
                              "group flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-3 text-center active:scale-95",
                              isSelected
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xl shadow-indigo-100/50"
                                : "border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            <div className={cn(
                              "p-3 rounded-2xl transition-colors",
                              isSelected ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                            )}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-black leading-tight uppercase tracking-tight">{perm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !appName || selectedPermissions.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-indigo-500/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-xl active:scale-[0.98]"
                  >
                    {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                    Analyze Now
                  </button>
                </div>
              </div>

              {/* Real-time Status Sidebar */}
              <div className="space-y-6 lg:sticky lg:top-28">
                <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/50 space-y-6">
                  <h3 className="font-black text-lg uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-4">Classification</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-100 group-hover:rotate-12 transition-transform">
                        <Check className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-sm">Safe</p>
                        <p className="text-xs text-slate-400">Score &lt; 25%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-100 group-hover:rotate-12 transition-transform">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-sm">Over-Permissive</p>
                        <p className="text-xs text-slate-400">25% - 60%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100 group-hover:rotate-12 transition-transform">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-sm">Risky</p>
                        <p className="text-xs text-slate-400">Score &gt; 60%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-slate-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-100 group-hover:rotate-12 transition-transform">
                        <HelpCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-sm">Unidentified</p>
                        <p className="text-xs text-slate-400">Not in database</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <ShieldAlert className="w-24 h-24 text-white/5 -rotate-12" />
                  </div>
                  <h4 className="font-black text-indigo-400 uppercase text-xs tracking-widest">Privacy Tip</h4>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium capitalize">
                    {privacyTip}
                  </p>
                </div>
              </div>
            </div>

            {/* Analysis Results */}
            {analysisResult && (
              <div id="results" className="space-y-8 animate-in fade-in slide-in-from-top-8 duration-700">
                <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-200 overflow-hidden">
                  <div className={cn(
                    "px-10 py-12 text-white flex flex-col md:flex-row items-center justify-between gap-8",
                    analysisResult.overallRiskScore > 60 ? "bg-red-600" :
                      analysisResult.overallRiskScore > 25 ? "bg-orange-500" :
                        analysisResult.isUnidentified ? "bg-slate-600" : "bg-green-600"
                  )}>
                    <div className="space-y-2 text-center md:text-left">
                      <p className="text-sm font-black uppercase tracking-widest text-white/70">Audit Result</p>
                      <h3 className="text-5xl font-black">{analysisResult.isUnidentified ? 'Unidentified Application' : analysisResult.riskLabel + ' Risk'}</h3>
                      <p className="text-white/80 font-medium">{analysisResult.appName || appName} has been classified based on its category: {analysisResult.genre || scrapedData?.genre}</p>
                    </div>
                    <div className="flex flex-col items-center bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 min-w-[200px]">
                      <span className="text-xs font-black uppercase tracking-widest text-white/70 mb-1">Privacy Score</span>
                      <span className="text-6xl font-black">{analysisResult.overallRiskScore}%</span>
                      <div className="flex items-center gap-1 mt-2 text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                        {analysisResult.overallRiskScore > 35 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        Threshold: 35%
                      </div>
                    </div>
                  </div>

                  <div className="p-10 space-y-12">
                    <div className="space-y-12">
                      <div className="max-w-4xl space-y-6">
                        <h4 className="text-xl font-black border-l-4 border-indigo-600 pl-4">AI Risk Summary</h4>
                        <p className="text-slate-600 leading-relaxed text-base font-medium">{analysisResult.summary}</p>
                      </div>
                      
                      {/* Risk Distribution Overview */}
                      <div className="space-y-6 border-t border-slate-100 pt-8">
                        <h4 className="text-xl font-black border-l-4 border-slate-900 pl-4">Permissions Overview</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* High Risk Column */}
                          <div className="bg-red-50/50 rounded-3xl p-6 border border-red-100">
                            <div className="flex items-center gap-2 mb-4">
                              <ShieldAlert className="w-5 h-5 text-red-500" />
                              <h5 className="font-bold text-red-800">High Risk</h5>
                              <span className="ml-auto bg-red-100 text-red-700 text-xs font-black px-2 py-1 rounded-full">
                                {analysisResult.permissions?.filter((p: any) => p.riskLevel === 'High Risk').length || 0}
                              </span>
                            </div>
                            <ul className="space-y-2">
                              {analysisResult.permissions?.filter((p: any) => p.riskLevel === 'High Risk').map((p: any, i: number) => (
                                <li key={i} className="text-sm font-semibold text-red-700 bg-red-100/50 px-3 py-2 rounded-xl uppercase tracking-widest">{p.name}</li>
                              ))}
                              {analysisResult.permissions?.filter((p: any) => p.riskLevel === 'High Risk').length === 0 && (
                                <li className="text-sm font-semibold text-red-700 bg-red-100/50 px-3 py-2 rounded-xl uppercase tracking-widest">NONE</li>
                              )}
                            </ul>
                          </div>

                          {/* Review Needed Column */}
                          <div className="bg-amber-50/50 rounded-3xl p-6 border border-amber-100">
                            <div className="flex items-center gap-2 mb-4">
                              <AlertTriangle className="w-5 h-5 text-amber-500" />
                              <h5 className="font-bold text-amber-800">Review Needed</h5>
                              <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-black px-2 py-1 rounded-full">
                                {analysisResult.permissions?.filter((p: any) => p.riskLevel === 'Review Needed').length || 0}
                              </span>
                            </div>
                            <ul className="space-y-2">
                              {analysisResult.permissions?.filter((p: any) => p.riskLevel === 'Review Needed').map((p: any, i: number) => (
                                <li key={i} className="text-sm font-semibold text-amber-700 bg-amber-100/50 px-3 py-2 rounded-xl uppercase tracking-widest">{p.name}</li>
                              ))}
                              {analysisResult.permissions?.filter((p: any) => p.riskLevel === 'Review Needed').length === 0 && (
                                <li className="text-sm font-semibold text-amber-700 bg-amber-100/50 px-3 py-2 rounded-xl uppercase tracking-widest">NONE</li>
                              )}
                            </ul>
                          </div>

                          {/* Safe Column */}
                          <div className="bg-green-50/50 rounded-3xl p-6 border border-green-100">
                            <div className="flex items-center gap-2 mb-4">
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                              <h5 className="font-bold text-green-800">Safe</h5>
                              <span className="ml-auto bg-green-100 text-green-700 text-xs font-black px-2 py-1 rounded-full">
                                {analysisResult.permissions?.filter((p: any) => p.riskLevel === 'Safe').length || 0}
                              </span>
                            </div>
                            <ul className="space-y-2">
                              {analysisResult.permissions?.filter((p: any) => p.riskLevel === 'Safe').map((p: any, i: number) => (
                                <li key={i} className="text-sm font-semibold text-green-700 bg-green-100/50 px-3 py-2 rounded-xl uppercase tracking-widest">{p.name}</li>
                              ))}
                              {analysisResult.permissions?.filter((p: any) => p.riskLevel === 'Safe').length === 0 && (
                                <li className="text-sm font-semibold text-green-700 bg-green-100/50 px-3 py-2 rounded-xl uppercase tracking-widest">NONE</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6 border-t border-slate-100 pt-8">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-black border-l-4 border-slate-900 pl-4">Permission Audit</h4>
                          {analysisResult.permissions?.some((p: any) => p.riskLevel === 'Safe') && (
                            <button 
                              onClick={() => setShowSafePerms(!showSafePerms)}
                              className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all"
                            >
                              {showSafePerms ? 'Hide Safe' : `Show All (${analysisResult.permissions.filter((p: any) => p.riskLevel === 'Safe').length} Safe)`}
                            </button>
                          )}
                        </div>
                        <div className="space-y-6">
                          {analysisResult.permissions?.filter((p: any) => showSafePerms || p.riskLevel !== 'Safe').length === 0 ? (
                             <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-center">
                               <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                               <p className="font-bold text-green-800">All requested permissions are safe.</p>
                             </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {analysisResult.permissions?.filter((p: any) => showSafePerms || p.riskLevel !== 'Safe').map((p: any, i: number) => {
                                const isHighRisk = p.riskLevel === 'High Risk';
                                const isReviewNeeded = p.riskLevel === 'Review Needed';
                                const isSafe = p.riskLevel === 'Safe';
                                return (
                                  <div key={i} className={cn(
                                    "bg-white p-6 rounded-3xl border-2 transition-all flex flex-col gap-4",
                                    isHighRisk ? "border-red-100 shadow-sm" :
                                    isReviewNeeded ? "border-amber-100 shadow-sm" :
                                    "border-slate-100"
                                  )}>
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-3">
                                        {isHighRisk && <ShieldAlert className="w-8 h-8 text-red-500" />}
                                        {isReviewNeeded && <AlertTriangle className="w-8 h-8 text-amber-500" />}
                                        {isSafe && <CheckCircle2 className="w-8 h-8 text-green-500" />}
                                        <h5 className="font-black text-slate-900 text-2xl uppercase tracking-wide">{p.name}</h5>
                                      </div>
                                      <div className="pl-11">
                                        <span className={cn(
                                          "font-bold text-sm uppercase tracking-widest",
                                          isHighRisk ? "text-red-600" :
                                          isReviewNeeded ? "text-amber-600" :
                                          "text-green-600"
                                        )}>
                                          Risk Level: {p.riskLevel}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mt-2">
                                      <p className="text-slate-700 text-base font-semibold leading-relaxed">
                                        {p.justification || "Not actively used."}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {analysisResult.recommendation && (
                        <div className="space-y-6 border-t border-slate-100 pt-8 max-w-4xl">
                          <h4 className="text-xl font-black border-l-4 border-indigo-600 pl-4">Expert Recommendation</h4>
                          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex gap-4">
                            <ShieldCheck className="w-8 h-8 text-indigo-600 shrink-0" />
                            <div>
                              <p className="text-lg text-indigo-900 font-semibold leading-relaxed">{analysisResult.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-10 space-y-8">
                      <h4 className="text-2xl font-black flex items-center gap-3">
                        <TrendingDown className="text-green-600 w-8 h-8" />
                        Privacy-Friendly Alternatives
                      </h4>
                      <div className="grid md:grid-cols-3 gap-6">
                        {analysisResult.alternatives?.map((app: any, i: number) => (
                          <div key={i} className="bg-white p-6 rounded-3xl border-2 border-slate-100 hover:border-indigo-600 transition-all group flex flex-col justify-between h-full shadow-sm hover:shadow-xl hover:shadow-indigo-100">
                            <div className="space-y-3">
                              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <ShieldCheck className="w-6 h-6" />
                              </div>
                              <h5 className="font-black text-xl">{app.name}</h5>
                              <p className="text-sm text-slate-500 font-medium">{app.reason}</p>
                            </div>
                            <button onClick={() => handleViewAudit(app.name)} className="mt-6 flex items-center justify-between w-full font-black text-xs uppercase tracking-widest text-indigo-600 group-hover:bg-indigo-50 p-3 rounded-xl transition-all">
                              View Audit
                              <ArrowRight className="w-4 h-4 translate-x-1" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <span className="px-5 py-2 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-[0.2em]">Battle Arena</span>
              <h2 className="text-5xl font-black tracking-tight">App Privacy Winner</h2>
              <p className="text-slate-500 font-medium">Compare two similar apps to see which one respects your privacy more. Our AI will declare the ultimate winner based on permission ethics.</p>
            </div>

            <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-8 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest text-center block">Competitor 01</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. WhatsApp"
                    className="w-full px-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-xl font-bold text-center"
                    value={compareApps.app1}
                    onChange={(e) => setCompareApps(prev => ({ ...prev, app1: e.target.value }))}
                  />
                </div>
              </div>

              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 font-black text-2xl border-4 border-white shadow-xl">
                VS
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest text-center block">Competitor 02</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Signal"
                    className="w-full px-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-xl font-bold text-center"
                    value={compareApps.app2}
                    onChange={(e) => setCompareApps(prev => ({ ...prev, app2: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleCompare}
              disabled={isAnalyzing || !compareApps.app1 || !compareApps.app2}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-6 rounded-[2rem] shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-xl active:scale-[0.98]"
            >
              {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
              Declare Winner
            </button>

            {comparisonResult && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-8 duration-700">
                {/* Privacy Winner Card */}
                <div className="bg-indigo-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-8">
                    <ShieldCheck className="w-48 h-48 text-white/5 -rotate-12" />
                  </div>
                  <div className="relative z-10 space-y-8 text-center md:text-left">
                    <div className="space-y-2">
                      <span className="text-indigo-400 font-black uppercase tracking-widest text-sm">The Verdict</span>
                      <h3 className="text-6xl font-black">Privacy Winner: {comparisonResult.winner}</h3>
                      <p className="text-xl text-indigo-200 max-w-3xl font-medium">{comparisonResult.verdictExplanation}</p>
                    </div>

                  </div>
                </div>

                {/* Comparison Table */}
                <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
                  <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-2xl font-black tracking-tight">Permission Comparison Table</h4>
                    <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest">
                      <span className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4" /> Required</span>
                      <span className="flex items-center gap-2"><X className="text-slate-300 w-4 h-4" /> Not Required</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 text-left">
                          <th className="px-10 py-6 font-black text-sm uppercase tracking-widest text-slate-400">Permission</th>
                          <th className="px-10 py-6 font-black text-xl text-slate-900 border-l border-slate-200/50">{compareApps.app1}</th>
                          <th className="px-10 py-6 font-black text-xl text-slate-900 border-l border-slate-200/50">{compareApps.app2}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {PERMISSIONS.map((perm) => (
                          <tr key={perm.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-10 py-6 flex items-center gap-4">
                              <div className="p-2 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <perm.icon className="w-5 h-5" />
                              </div>
                              <span className="font-bold text-slate-700">{perm.label}</span>
                            </td>
                            <td className="px-10 py-6 border-l border-slate-200/50 text-center">
                              {comparisonResult.table?.find((t: any) => t.id === perm.id)?.app1 ?
                                <div className="bg-green-100 p-2 rounded-full w-fit mx-auto"><Check className="text-green-600 w-5 h-5" /></div> :
                                <X className="text-slate-200 w-5 h-5 mx-auto" />
                              }
                            </td>
                            <td className="px-10 py-6 border-l border-slate-200/50 text-center">
                              {comparisonResult.table?.find((t: any) => t.id === perm.id)?.app2 ?
                                <div className="bg-green-100 p-2 rounded-full w-fit mx-auto"><Check className="text-green-600 w-5 h-5" /></div> :
                                <X className="text-slate-200 w-5 h-5 mx-auto" />
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-lg space-y-6">
                    <div className="flex items-center gap-3">
                      <Info className="text-indigo-600 w-6 h-6" />
                      <h4 className="text-xl font-black uppercase tracking-tight">Security Summary</h4>
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed">{comparisonResult.comparisonSummary}</p>
                  </div>
                  <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl space-y-6 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5 bg-white p-20 rounded-full blur-3xl" />
                    <h4 className="text-xl font-black uppercase tracking-tight text-indigo-400">Similar Recommended Apps</h4>
                    <div className="space-y-3">
                      {comparisonResult.similarApps?.map((app: string, i: number) => (
                        <div key={i} onClick={() => handleViewAudit(app)} className="cursor-pointer flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                          <span className="font-bold text-slate-200">{app}</span>
                          <span className="text-xs uppercase tracking-widest font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">View Audit</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <span className="font-black tracking-tighter text-slate-900">PrivaGuard AI</span>
        </div>
        <p className="text-slate-400 text-sm font-medium">© 2026 PrivaGuard. Protecting your digital footprint with intelligent audits.</p>
      </footer>
    </div>
  );
}
