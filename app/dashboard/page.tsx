import fs from 'fs';
import path from 'path';
import RiskDistributionChart from '@/components/RiskDistributionChart';
import CategoryComparisonChart from '@/components/CategoryComparisonChart';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const datasetPath = path.join(process.cwd(), 'data', 'dataset.json');
  let dataset: any[] = [];
  
  if (fs.existsSync(datasetPath)) {
    try {
      dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    } catch {
      dataset = [];
    }
  }

  let safeCount = 0;
  let permissiveCount = 0;
  let riskyCount = 0;
  const categoryScores: Record<string, { totalScore: number, count: number }> = {};
  
  dataset.forEach((app: any) => {
    // Collect counts
    if (app.computedScore > 60) riskyCount++;
    else if (app.computedScore > 25) permissiveCount++;
    else safeCount++;
    
    // Collect category totals
    if (!categoryScores[app.category]) {
      categoryScores[app.category] = { totalScore: 0, count: 0 };
    }
    categoryScores[app.category].totalScore += app.computedScore;
    categoryScores[app.category].count += 1;
  });

  const categoryAverages = Object.keys(categoryScores).map(cat => ({
    name: cat.replace(/_/g, ' '),
    averageRisk: Math.round(categoryScores[cat].totalScore / categoryScores[cat].count)
  })).sort((a, b) => b.averageRisk - a.averageRisk);

  const riskDistribution = [
    { name: 'Safe (0-25)', value: safeCount, fill: '#10b981' }, 
    { name: 'Over-Permissive (26-60)', value: permissiveCount, fill: '#f59e0b' }, 
    { name: 'Risky (61-100)', value: riskyCount, fill: '#ef4444' } 
  ];

  return { riskDistribution, categoryAverages, totalApps: dataset.length };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Privacy Analysis Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Overview of application privacy risks analyzed by the system pipeline. 
            Currently showing stats for <span className="font-semibold text-gray-900">{data.totalApps}</span> apps.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1 */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Aggregate Risk Distribution</h2>
            <RiskDistributionChart data={data.riskDistribution} />
          </div>
          
          {/* Chart 2 */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Average Risk by Category</h2>
            <CategoryComparisonChart data={data.categoryAverages} />
          </div>
        </div>

      </div>
    </div>
  );
}
