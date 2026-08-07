// Reads an env var defensively. Values pasted into a dashboard (Vercel, etc.)
// can carry a trailing newline, leading/trailing space, or wrapping quotes
// copied along from a .env file — any of which breaks header-based API auth
// (e.g. `X-API-KEY: abc123\n`) even though the "same" key works locally.
export function cleanEnv(value: string | undefined): string | undefined {
  return value?.trim().replace(/^['"]|['"]$/g, '')
}
