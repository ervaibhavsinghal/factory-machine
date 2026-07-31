export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

export type GeoZone = { lat: number; lng: number; geoRadiusM: number };

export type GeoResult =
  | { inside: true; distance: number; radius: number }
  | { inside: false; reason: "location_unavailable" }
  | { inside: false; reason: "outside_zone"; distance: number; radius: number };

export function geoStatus(zone: GeoZone, lat: number | null | undefined, lng: number | null | undefined): GeoResult {
  if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { inside: false, reason: "location_unavailable" };
  }
  const distance = distanceMeters(zone.lat, zone.lng, lat, lng);
  const radius = zone.geoRadiusM || 100;
  if (distance <= radius) return { inside: true, distance, radius };
  return { inside: false, reason: "outside_zone", distance, radius };
}
