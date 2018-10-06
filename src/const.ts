import * as fs from 'fs';
import * as path from 'path';
import { Config } from './types';

let config: Partial<Config> = {};
try {
  const configFile = path.join(process.cwd(), '.config.json');
  config = JSON.parse(fs.readFileSync(configFile).toString());
} catch {}

const [_, __, FILENAME = 'result'] = process.argv;

export { FILENAME };

export const QUERY_DIR = path.join(process.cwd(), 'query');
export const RESULTS_DIR = path.join(process.cwd(), 'results');

export const BQ_LOCATION = config.bigQuery && config.bigQuery.location ? config.bigQuery.location : 'US';
export const MAX_RESULTS = config.bigQuery && config.bigQuery.maxResults ? config.bigQuery.maxResults : 10000;

export const DOLLAR_YEN_RATE = config.dollarYenRate ? config.dollarYenRate : 113;
