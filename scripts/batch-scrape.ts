import gplay from 'google-play-scraper';
import * as fs from 'fs';
import * as path from 'path';
import { calculateRiskScore, normalizeScore } from '../lib/scoring';

// Cast to any to bypass strict Typescript constraint on the external library enum
const categoryEnum = gplay.category as any;

const TARGET_CATEGORIES = [
  categoryEnum.SOCIAL,
  categoryEnum.COMMUNICATION,
  categoryEnum.MAPS_AND_NAVIGATION,
  categoryEnum.PHOTOGRAPHY,
  categoryEnum.FINANCE,
  categoryEnum.TOOLS,
  categoryEnum.LIFESTYLE,
  categoryEnum.EDUCATION,
  categoryEnum.ENTERTAINMENT,
  categoryEnum.SHOPPING
];

const APPS_PER_CATEGORY_TARGET = 100; // Scrape 100 apps per category -> 1000 apps
const OUTPUT_FILE = path.join(process.cwd(), 'data', 'dataset.json');

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function buildLargeDataset() {
  console.log('Starting large dataset scraping pipeline...');
  const dataset: any[] = [];
  let totalAppsScraped = 0;

  for (const category of TARGET_CATEGORIES) {
    if (!category) continue;
    console.log(`\nFetching batch for category: ${category}`);

    try {
      const collectionEnum = gplay.collection as any;
      const apps = await gplay.list({
        category: category,
        collection: collectionEnum.TOP_FREE,
        num: APPS_PER_CATEGORY_TARGET,
      });

      console.log(`Found ${apps.length} apps. Fetching permissions to build dataset...`);

      for (let i = 0; i < apps.length; i++) {
        const app = apps[i];
        try {
          const rawPerms = await gplay.permissions({ appId: app.appId });
          
          const permissions = rawPerms.map((p: any) => p.permission || p);
          
          if (permissions.length === 0) continue;

          // Compute risk score dynamically using semantic matching and config weights block
          const rawScore = await calculateRiskScore(permissions, category);
          const computedScore = normalizeScore(rawScore, permissions.length);

          dataset.push({
            appId: app.appId,
            title: app.title,
            category: category,
            permissions: permissions,
            computedScore: computedScore,
            scrapedAt: new Date().toISOString()
          });

          totalAppsScraped++;

          if (totalAppsScraped % 10 === 0) {
            process.stdout.write('.');
          }
          await delay(250); // Prevent rate limits

        } catch (err: any) {
           // Skip app if scraping issue occurs
        }
      }
      
    } catch (err) {
      console.error(`Error processing category ${category}`);
    }
  }

  // 4. Save results to data/dataset.json
  const dataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataset, null, 2));
  console.log(`\nPipeline completed! Scraped and analyzed ${totalAppsScraped} apps. Dataset saved to ${OUTPUT_FILE}`);
}

buildLargeDataset().catch(console.error);
