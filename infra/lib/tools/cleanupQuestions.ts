import { DynamoDBClient, ScanCommand, DeleteItemCommand, AttributeValue } from '@aws-sdk/client-dynamodb';

const ddb = new DynamoDBClient({});
const TABLE = process.env.QUESTIONS_TABLE!;
const PREFIX = process.env.PREFIX || '2025-W'; // 古い qId を削除

export const handler = async () => {
  let startKey: Record<string, AttributeValue> | undefined;
  let deleted = 0;

  do {
    const res = await ddb.send(new ScanCommand({
      TableName: TABLE,
      ExclusiveStartKey: startKey,
      ProjectionExpression: 'qId',
      FilterExpression: 'begins_with(#q, :p)',
      ExpressionAttributeNames: { '#q': 'qId' },
      ExpressionAttributeValues: { ':p': { S: PREFIX } }
    }));

    for (const item of res.Items ?? []) {
      await ddb.send(new DeleteItemCommand({
        TableName: TABLE,
        Key: { qId: { S: item.qId.S! } }
      }));
      deleted++;
    }
    startKey = res.LastEvaluatedKey;
  } while (startKey);

  return { statusCode: 200, body: JSON.stringify({ deleted, prefix: PREFIX }) };
};
