import gplay from 'google-play-scraper';
import * as fs from 'fs';
import * as path from 'path';

// Bypass strict TS compiler errors for the scraper's category enums
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

const APPS_PER_CATEGORY = 200;
const OUTPUT_FILE = path.join(process.cwd(), 'data', 'csb.json');
const THRESHOLD_PERCENTAGE = 0.2; // A permission is expected if > 20% of apps use it

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function buildCSB() {
  console.log('Starting dynamic CSB builder...');
  const csbData: Record<string, any> = {};

  for (const category of TARGET_CATEGORIES) {
    if (!category) continue; // Skip if invalid

    console.log(`\nFetching top apps for category: ${category}`);
    try {
      const collectionEnum = gplay.collection as any;
      const apps = await gplay.list({
        category: category,
        collection: collectionEnum.TOP_FREE,
        num: APPS_PER_CATEGORY,
      });

      console.log(`Found ${apps.length} apps in ${category}. Fetching permissions...`);

      const permissionCounts: Record<string, number> = {};
      let successfulApps = 0;

      // 2. Fetch permissions for each app
      for (let i = 0; i < apps.length; i++) {
        const app = apps[i];
        try {
          // Fetch permissions from Google Play
          const perms = await gplay.permissions({ appId: app.appId });
          successfulApps++;
          
          perms.forEach((p: any) => {
            // Google play scraper returns permission objects with 'permission' string. E.g. "android.permission.INTERNET" or plain strings
            let permName = p.permission || p;
            
            if (typeof permName !== 'string') return;

            // Extract the core permission name if it's an android permission (to match our existing DB format)
            if (permName.startsWith('android.permission.')) {
              permName = permName.replace('android.permission.', '');
            } else if (permName.startsWith('com.android.vending.')) {
               return; // Skip vending billing permissions typically
            }

            permissionCounts[permName] = (permissionCounts[permName] || 0) + 1;
          });

          // Small delay to prevent rate-limiting
          if (i % 10 === 0) {
              process.stdout.write('.');
          }
          await delay(200);

        } catch (err: any) {
          // Some apps might not have public permission info or are geo-blocked
          console.warn(`\nFailed to fetch permissions for ${app.appId}: ${err.message}`);
        }
      }

      console.log(`\nSuccessfully compiled permissions for ${successfulApps}/${apps.length} apps.`);

      // 3. Compute top expected permissions based on threshold
      const expectedPermissions = [];
      const distribution: Record<string, number> = {};

      for (const [perm, count] of Object.entries(permissionCounts)) {
        const frequency = count / successfulApps;
        distribution[perm] = frequency;
        
        if (frequency >= THRESHOLD_PERCENTAGE) {
          expectedPermissions.push(perm);
        }
      }

      // Sort by frequency
      expectedPermissions.sort((a, b) => permissionCounts[b] - permissionCounts[a]);

      csbData[category] = {
        category,
        totalAppsAnalyzed: successfulApps,
        expectedPermissions,
        distribution,
        updatedAt: new Date().toISOString()
      };

      console.log(`Saved baseline for ${category} with ${expectedPermissions.length} expected permissions.`);

    } catch (err) {
      console.error(`Error processing category ${category}:`, err);
    }
  }

  // 4. Save results to data/csb.json
  const dataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(csbData, null, 2));
  console.log(`\nDynamic CSB successfully saved to ${OUTPUT_FILE}`);
}

buildCSB().catch(console.error);
