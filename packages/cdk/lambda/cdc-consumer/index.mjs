/**
 * Aurora DSQL CDC Consumer Lambda
 * Kinesis Data Streams からCDCイベントを受け取り、ログに出力する
 */
export const handler = async (event) => {
  console.log(`Received ${event.Records.length} record(s) from Kinesis`);

  for (const record of event.Records) {
    // Kinesis レコードのデータは Base64 エンコードされている
    const payload = Buffer.from(record.kinesis.data, 'base64').toString(
      'utf-8',
    );

    try {
      const cdcEvent = JSON.parse(payload);

      const op = cdcEvent.op;
      const source = cdcEvent.source || {};
      const table = `${source.schema}.${source.table}`;
      const txId = source.txId;

      const opLabels = { c: 'INSERT/UPDATE', u: 'UPDATE', d: 'DELETE' };
      const opLabel = opLabels[op] || op;

      console.log(
        JSON.stringify({
          operation: opLabel,
          table,
          txId,
          type: cdcEvent.type,
          before: cdcEvent.before,
          after: cdcEvent.after,
          timestamp: source.ts_ns,
        }),
      );
    } catch (err) {
      console.error('Failed to parse CDC event:', err.message);
      console.log('Raw payload:', payload);
    }
  }

  return {
    statusCode: 200,
    body: `Processed ${event.Records.length} record(s)`,
  };
};
