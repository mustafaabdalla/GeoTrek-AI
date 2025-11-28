export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed?: number | null;
  accuracy?: number;
}

export interface JourneyStats {
  totalDistanceKm: number;
  durationSeconds: number;
  averageSpeedKmH: number;
  maxSpeedKmH: number;
}

export enum TrackingStatus {
  IDLE = 'IDLE',
  TRACKING = 'TRACKING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED'
}