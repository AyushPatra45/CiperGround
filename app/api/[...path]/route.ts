import { env } from 'cloudflare:workers';
import { createApi } from '@/server/api';
export const dynamic = 'force-dynamic';
const handler = (request: Request) => createApi(env.DB, env as any)(request);
export { handler as GET, handler as POST, handler as PATCH };
