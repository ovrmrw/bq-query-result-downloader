import * as fs from 'fs';
import { RESULTS_DIR } from './const';

export function createResultsDir(): void {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR);
  }
}
