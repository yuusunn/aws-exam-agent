import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { createHash } from 'crypto';

const ddb = new DynamoDBClient({});
const USERS_TABLE = process.env.USERS_TABLE!;

export const handler = async (event: any) => {
  const { email } = JSON.parse(event.body || '{}');
  if (!email) return { statusCode: 400, body: 'email required' };

  const userId = 'u_' + createHash('sha256').update(email).digest('hex').slice(0, 16);

  await ddb.send(new UpdateItemCommand({
    TableName: USERS_TABLE,
    Key: { userId: { S: userId } },
    UpdateExpression: 'SET #s = :u',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':u': { S: 'unsubscribed' } },
  }));

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
