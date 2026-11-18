export function authorized(req) {
  const pw = process.env.TOOL_PASSWORD;
  if (!pw) return true;
  return req.headers.get('x-tool-password') === pw;
}
