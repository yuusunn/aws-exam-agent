// infra/lib/lambdas/_http.ts
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

export function ok(body: any) {
  return { statusCode: 200, headers: CORS, body: JSON.stringify(body) };
}

export function bad(status: number, message: string) {
  return { statusCode: status, headers: CORS, body: JSON.stringify({ message }) };
}
