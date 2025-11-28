import React, { useState, useEffect, useRef, useCallback } from 'react';
import { calculateDistance, formatDuration, calculateSpeed } from './utils/geo';
import { Coordinate, JourneyStats, TrackingStatus } from './types';
import RouteVisualizer from './components/RouteVisualizer';
import StatCard from './components/StatCard';
import { generateJourneySummary } from './services/geminiService';

// Icons
const PlayIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const StopIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>;
const DistanceIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const TimeIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SpeedIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

const App: React.FC = () => {
  const [status, setStatus] = useState<TrackingStatus>(TrackingStatus.IDLE);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastPositionRef = useRef<Coordinate | null>(null);

  // Timer Effect
  useEffect(() => {
    if (status === TrackingStatus.TRACKING) {
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Handle Start Tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setCoordinates([]);
    setTotalDistance(0);
    setDuration(0);
    setCurrentSpeed(0);
    setMaxSpeed(0);
    setSummary(null);
    setStatus(TrackingStatus.TRACKING);
    setErrorMsg(null);
    lastPositionRef.current = null;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, accuracy } = position.coords;
        const timestamp = position.timestamp;
        
        // Filter low accuracy points (e.g. > 50m radius) if desired, 
        // but for simplicity we'll just log them.
        if (accuracy > 100) return; 

        const newCoord: Coordinate = { latitude, longitude, timestamp, speed, accuracy };

        setCoordinates(prev => {
           // Basic noise filter: if less than 5 meters from last point, ignore
           if (prev.length > 0) {
             const dist = calculateDistance(prev[prev.length - 1], newCoord);
             if (dist < 0.005) { // 5 meters
               return prev;
             }
           }
           return [...prev, newCoord];
        });

        // Calculate Stats
        if (lastPositionRef.current) {
          const dist = calculateDistance(lastPositionRef.current, newCoord);
          setTotalDistance(prev => prev + dist);
          
          // Use GPS speed if available, otherwise calculate
          let instSpeed = (speed !== null && speed >= 0) ? (speed * 3.6) : 0; // m/s to km/h
          
          // Fallback calculation if GPS speed is null
          if (instSpeed === 0 && dist > 0) {
              const timeDiff = (timestamp - lastPositionRef.current.timestamp) / 1000;
              if (timeDiff > 0) {
                  instSpeed = calculateSpeed(dist, timeDiff);
              }
          }

          setCurrentSpeed(instSpeed);
          setMaxSpeed(prev => Math.max(prev, instSpeed));
        }

        lastPositionRef.current = newCoord;
      },
      (error) => {
        console.error(error);
        setErrorMsg("Unable to retrieve location. Please ensure GPS is enabled.");
        setStatus(TrackingStatus.IDLE);
      },
      options
    );
  }, []);

  // Handle Stop Tracking
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus(TrackingStatus.FINISHED);
    setCurrentSpeed(0);

    // Generate AI Summary
    setIsGeneratingSummary(true);
    const stats: JourneyStats = {
      totalDistanceKm: totalDistance,
      durationSeconds: duration,
      averageSpeedKmH: calculateSpeed(totalDistance, duration),
      maxSpeedKmH: maxSpeed
    };

    const aiSummary = await generateJourneySummary(stats);
    setSummary(aiSummary);
    setIsGeneratingSummary(false);

  }, [totalDistance, duration, maxSpeed]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="px-6 py-6 bg-slate-900 border-b border-slate-800 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
              GeoTrek AI
            </h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide">SMART JOURNEY TRACKER</p>
          </div>
          <div className={`h-2 w-2 rounded-full ${status === TrackingStatus.TRACKING ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        
        {/* Error Message */}
        {errorMsg && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        {/* Visualizer */}
        <RouteVisualizer coordinates={coordinates} isTracking={status === TrackingStatus.TRACKING} />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <StatCard 
              label="Total Distance" 
              value={totalDistance.toFixed(2)} 
              unit="km" 
              highlight={true}
              icon={<DistanceIcon />}
            />
          </div>
          <StatCard 
            label="Duration" 
            value={formatDuration(duration)} 
            icon={<TimeIcon />}
          />
          <StatCard 
            label="Current Speed" 
            value={currentSpeed.toFixed(1)} 
            unit="km/h"
            icon={<SpeedIcon />}
          />
        </div>

        {/* AI Summary Section (Visible only when finished) */}
        {status === TrackingStatus.FINISHED && (
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Analysis
            </h3>
            {isGeneratingSummary ? (
               <div className="flex flex-col items-center justify-center py-4 space-y-3">
                 <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-sm text-slate-400">Analyzing your performance...</span>
               </div>
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed">
                {summary}
              </p>
            )}
          </div>
        )}

      </main>

      {/* Controls Footer */}
      <footer className="p-6 bg-slate-900 border-t border-slate-800 sticky bottom-0 z-20">
        {status === TrackingStatus.TRACKING ? (
          <button
            onClick={stopTracking}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold text-lg shadow-lg shadow-red-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <StopIcon />
            Stop Tracking
          </button>
        ) : (
          <button
            onClick={startTracking}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-bold text-lg shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <PlayIcon />
            {status === TrackingStatus.FINISHED ? 'Start New Journey' : 'Start Journey'}
          </button>
        )}
      </footer>
    </div>
  );
};

export default App;