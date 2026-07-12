/**
 * Utility functions for geo-spatial calculations in LocationMasterView
 */

export interface GeoLocationItem {
  id: string;
  label: string;
  lat: number;
  lng: number;
  radius: number;
  type: string;
}

/**
 * Calculates the distance between two coordinates in meters using the Haversine formula
 */
export function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

/**
 * Formats circle area into human-readable square meters or square kilometers
 */
export function formatArea(areaSqMeters: number): string {
  if (areaSqMeters >= 1000000) {
    const sqKm = areaSqMeters / 1000000;
    return `${sqKm.toLocaleString('th-TH', { maximumFractionDigits: 2 })} ตร.กม.`;
  }
  return `${areaSqMeters.toLocaleString('th-TH', { maximumFractionDigits: 0 })} ตร.ม.`;
}

/**
 * Parses a master option's composite key "lat,lng,radius" safely
 */
export function parseLocationKey(key: string): { lat: number; lng: number; radius: number } {
  const parts = key.split(',');
  const lat = parseFloat(parts[0]) || 0;
  const lng = parseFloat(parts[1]) || 0;
  const radius = parseFloat(parts[2]) || 100;
  return { lat, lng, radius };
}

/**
 * Scans active locations to find any overlapping geofences of the same type
 */
export function getOverlappingPairs(items: GeoLocationItem[]): Array<{ item1: GeoLocationItem; item2: GeoLocationItem; distance: number }> {
  const overlaps: Array<{ item1: GeoLocationItem; item2: GeoLocationItem; distance: number }> = [];
  
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const item1 = items[i];
      const item2 = items[j];
      
      // Only warn about overlaps of the same type
      if (item1.type !== item2.type) continue;

      const dist = getDistanceMeters(item1.lat, item1.lng, item2.lat, item2.lng);
      const combinedRadius = item1.radius + item2.radius;
      
      if (dist < combinedRadius) {
        overlaps.push({ item1, item2, distance: dist });
      }
    }
  }
  
  return overlaps;
}
