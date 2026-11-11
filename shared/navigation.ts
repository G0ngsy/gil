export interface Coordinate { lat: number; lng: number }
export interface LocationAddress { address:string; area:string }
export interface Place extends Coordinate { id: string; name: string; address: string; category: string }
export interface WalkingStep extends Coordinate { description: string; turnType: number }
export interface WalkingRoute {
 distanceMeters: number;
 durationSeconds: number;
 segments: Coordinate[][];
 steps: WalkingStep[];
}

export function isCoordinate(value: unknown): value is Coordinate {
 if (!value || typeof value !== 'object') return false;
 const v = value as Coordinate;
 return Number.isFinite(v.lat) && Number.isFinite(v.lng) && Math.abs(v.lat) <= 90 && Math.abs(v.lng) <= 180;
}

export function formatDistance(meters: number) { return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`; }
export function formatDuration(seconds: number) { return `${Math.max(1, Math.ceil(seconds / 60))}분`; }

/** Straight-line distance is only for search results, never a walking ETA. */
export function distanceBetween(a: Coordinate, b: Coordinate) {
 const rad = Math.PI / 180;
 const dLat = (b.lat - a.lat) * rad;
 const dLng = (b.lng - a.lng) * rad;
 const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
 return 6371000 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(Math.max(0, 1 - s)));
}
