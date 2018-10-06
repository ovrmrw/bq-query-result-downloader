import * as BigQuery from '@google-cloud/bigquery';
import { FileWriter } from './file-writer';
import { createResultsDir } from './utils';
import { billedAsYen, getQueryObject } from './helpers';
import { BQ_LOCATION, MAX_RESULTS } from './const';
import { Field, Row, Result, ResultsOption, QueryOption } from './types';

createResultsDir();

const bigquery = new BigQuery();

async function main(): Promise<void> {
  const queryObject = getQueryObject();
  const queryOption: QueryOption = {
    query: queryObject.query
  };
  console.log('query:', queryObject.query);
  await estimate(queryOption).then(
    async () =>
      await new Promise(resolve => {
        console.log('\n!! The query will be executed after 5 seconds...\n');
        setTimeout(resolve, 5000);
      })
  );
  console.time('execute');
  await execute(queryOption).then(result => console.log(result));
  console.timeEnd('execute');
}

async function estimate(queryOption: QueryOption): Promise<void> {
  await bigquery.createQueryJob({ ...queryOption, dryRun: true }).then(data => {
    const [_, apiResponse] = data;
    const totalBytesProcessed = Number(apiResponse.statistics.totalBytesProcessed);
    const cacheHit = apiResponse.statistics.query.cacheHit;
    console.log(
      'statistics:',
      JSON.stringify(
        {
          計算MB: totalBytesProcessed / 1024 / 1024,
          計算GB: totalBytesProcessed / 1024 / 1024 / 1024,
          キャッシュヒット: cacheHit,
          'コスト(円)': billedAsYen(cacheHit ? 0 : totalBytesProcessed)
        },
        null,
        2
      )
    );
  });
}

async function execute(queryOption: QueryOption, options?: { csvQuotations?: boolean }): Promise<Result> {
  const csvQuotations = options && options.csvQuotations;
  const job = await bigquery.createQueryJob(queryOption).then(data => {
    const [job, apiResponse] = data;
    return job;
  });
  let isFirst = true;
  let rowsCounter = 0;
  let option: ResultsOption = { location: BQ_LOCATION, maxResults: MAX_RESULTS };
  let fields: Field[] = [];
  let result: Result;
  const fileWriter = new FileWriter();
  do {
    const [rows, _option, _result] = (await job.getQueryResults(option)) as [Row[], ResultsOption, Result];
    rowsCounter += rows.length;
    option = _option;
    result = _result;
    if (fields.length === 0 && result.schema && result.schema.fields) {
      fields = (result.schema.fields as Field[]).filter(f => !(f instanceof Array) && f.name && f.type);
    }
    if (isFirst) {
      isFirst = false;
      fileWriter.writeCsvHeader(fields, csvQuotations);
    }
    console.log({ rows: rowsCounter, totalRows: Number(result.totalRows) });
    rows.forEach(row => {
      fileWriter.writeRow(row, fields, csvQuotations);
    });
  } while (option);
  fileWriter.finish();
  delete result.rows;
  return result;
}

main().catch(console.error);
