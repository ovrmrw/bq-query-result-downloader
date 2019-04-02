import * as fs from 'fs';
import * as path from 'path';
import { Field, QueryObject, Row } from './types';
import { QUERY_DIR, DOLLAR_YEN_RATE } from './const';

export function getQueryObject(): QueryObject {
  const filenames = fs.readdirSync(QUERY_DIR).filter(filename => !/^_/.test(filename));
  const queryObjects = filenames.map(filename => {
    return {
      filename,
      query: fs.readFileSync(path.join(QUERY_DIR, filename)).toString()
    };
  });
  console.log('filenames:', filenames, '\n');
  if (filenames.length > 1) {
    throw new Error('有効なSQLファイルが2つ以上存在する場合は処理を続行できません。');
  } else if (filenames.length === 0) {
    throw new Error('有効なSQLファイルが1つもありません。');
  }
  return queryObjects[0];
}

export function createJsonRow(row: Row, fields: Field[]): string {
  const _row = flattenRow(row, fields);
  return JSON.stringify(_row) + '\n';
}

export function createCsvRow(row: Row, fields: Field[], csvQuotations?: boolean): string {
  const _row = flattenRow(row, fields);
  return fields.map(f => (f.type === 'STRING' && csvQuotations ? `"${_row[f.name]}"` : _row[f.name])).join(',') + '\n';
}

export function billedAsYen(bytesProcessed: number): number {
  if (bytesProcessed === 0) {
    return 0;
  }
  const bytesAsTeraBytes = bytesProcessed / 1024 / 1024 / 1024 / 1024;
  return (bytesAsTeraBytes / 1) /* TB */ * 5 /* $ */ * DOLLAR_YEN_RATE; /* 円(ドル円相場) */
}

function flattenRow(row: Row, fields: Field[]): Row {
  return Object.entries(row).reduce((p, [key, valueOrObject]) => {
    if (valueOrObject && typeof valueOrObject === 'object' && Object.keys(valueOrObject).length > 0) {
      const field = fields.find(f => f.name === key);
      if (field && field.type === 'TIMESTAMP') {
        p[key] = valueOrObject.value;
      }
    } else {
      p[key] = valueOrObject;
    }
    return p;
  }, {});
}
