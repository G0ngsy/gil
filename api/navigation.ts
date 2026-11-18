/**
 * Vercel 서버 진입점: 배포 환경의 서버 설정으로 길찾기 API 핸들러를 연결합니다.
 */
import { createNavigationHandler } from '../server/navigation.js';
const handler = (request: Request) => createNavigationHandler({appKey:process.env.TMAP_APP_KEY || ''})(request);
export const GET = handler;
export const POST = handler;
