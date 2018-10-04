export interface Field {
  name: string;
  type: 'STRING' | 'INT64' | 'TIMESTAMP';
}

export interface QueryObject {
  filename: string;
  query: string;
}

export interface QueryOption {
  query: string;
  dryRun?: boolean;
}

export type Location = 'US' | 'EU' | 'JP';

export interface ResultsOption {
  location: Location;
  maxResults: number;
  pageToken?: string;
}

export type Row = Record<string, any>;
export type Result = Record<string, any>;

export type Config = {
  bigQuery: {
    location: Location;
    maxResults: number;
  };
  dollarYenRate: number;
};
