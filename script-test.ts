import { semanticPermissionMatch } from './lib/semantic-match';
import { calculateRiskScore } from './lib/scoring';
import { env, pipeline } from '@xenova/transformers';

async function run() {
  env.allowLocalModels = false;
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  const permText = "Location";
  const contextDesc = "E-commerce, buying goods, digital coupons. Requires internet, camera for barcodes, and precise GPS location tracking for mapping and package delivery shipping.";

  const permOutput = await extractor(permText, { pooling: 'mean', normalize: true });
  const contextOutput = await extractor(contextDesc, { pooling: 'mean', normalize: true });

  const permVector = Array.from(permOutput.data) as number[];
  const contextVector = Array.from(contextOutput.data) as number[];

  let dotProduct = 0;
  for (let i = 0; i < permVector.length; i++) {
    dotProduct += permVector[i] * contextVector[i];
  }
  
  console.log(`New Match Score: ${dotProduct}`);
}

run();
