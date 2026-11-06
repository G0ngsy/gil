import { createNavigationHandler } from '../server/navigation.js';
const handler = (request: Request) => createNavigationHandler({appKey:process.env.TMAP_APP_KEY || ''})(request);
export const GET = handler;
export const POST = handler;
