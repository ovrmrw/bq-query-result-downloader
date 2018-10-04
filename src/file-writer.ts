import * as fs from 'fs';
import { WriteStream } from 'fs';
import * as path from 'path';
import { Subject } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { RESULTS_DIR, FILENAME } from './const';
import { Row, Field } from './types';
import { createJsonRow, createCsvRow } from './helpers';

interface RowObject {
  row: Row;
  fields: Field[];
  csvQuotations?: boolean;
}

export class FileWriter {
  private jsonWriteStream: WriteStream;
  private csvWriteStream: WriteStream;
  private subject$: Subject<RowObject>;

  constructor() {
    const now = Math.floor(Date.now() / 1000);
    const jsonFilepath = path.join(RESULTS_DIR, FILENAME + `_${now}.json`);
    const csvFilepath = path.join(RESULTS_DIR, FILENAME + `_${now}.csv`);
    this.jsonWriteStream = fs.createWriteStream(jsonFilepath);
    this.csvWriteStream = fs.createWriteStream(csvFilepath);
    this.subject$ = new Subject();
    let jsonRowCounter = 0;
    let csvRowCounter = 0;
    const jsonWriter$ = this.subject$
      .pipe(
        concatMap(({ row, fields }) => {
          if (!this.jsonWriteStream.write(createJsonRow(row, fields))) {
            return new Promise<void>(resolve => this.jsonWriteStream.once('drain', resolve));
          } else {
            return Promise.resolve();
          }
        })
      )
      .subscribe({
        next: () => jsonRowCounter++,
        error: err => console.error(err),
        complete: () => {
          this.jsonWriteStream.end();
          console.log(
            JSON.stringify(
              {
                message: 'JSONファイルの生成が完了しました',
                filepath: jsonFilepath,
                rowCounter: jsonRowCounter
              },
              null,
              2
            )
          );
        }
      });
    const csvWriter$ = this.subject$
      .pipe(
        concatMap(({ row, fields, csvQuotations }) => {
          if (!this.csvWriteStream.write(createCsvRow(row, fields, csvQuotations))) {
            return new Promise<void>(resolve => this.csvWriteStream.once('drain', resolve));
          } else {
            return Promise.resolve();
          }
        })
      )
      .subscribe({
        next: () => csvRowCounter++,
        error: err => console.error(err),
        complete: () => {
          this.csvWriteStream.end();
          console.log(
            JSON.stringify(
              { message: 'CSVファイルの生成が完了しました', filepath: csvFilepath, rowCounter: csvRowCounter },
              null,
              2
            )
          );
        }
      });
  }

  writeRow(row: Row, fields: Field[], csvQuotations?: boolean): void {
    this.subject$.next({ row, fields, csvQuotations });
  }

  writeCsvHeader(fields: Field[], csvQuotations?: boolean): void {
    console.log('fields:', fields);
    this.csvWriteStream.write(fields.map(f => (csvQuotations ? `"${f.name}"` : f.name)).join(',') + '\n');
  }

  finish(): void {
    this.subject$.complete();
  }
}
