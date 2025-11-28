import { GoogleGenAI } from "@google/genai";
import { JourneyStats } from '../types';

export const generateJourneySummary = async (stats: JourneyStats): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. Returning fallback text.");
    return "Please configure your API Key to receive AI-powered summaries of your workout.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      I just finished a tracked journey (walking/running/cycling). 
      Here are my stats:
      - Total Distance: ${stats.totalDistanceKm.toFixed(3)} km
      - Duration: ${stats.durationSeconds} seconds
      - Average Speed: ${stats.averageSpeedKmH.toFixed(2)} km/h
      - Max Speed: ${stats.maxSpeedKmH.toFixed(2)} km/h

      Please provide a short, motivating summary of this activity (approx 50 words). 
      Include a small health fact related to this level of activity. 
      Tone: Energetic, encouraging, and professional.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Great job on your journey! Keep moving to stay healthy.";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Great effort! Unable to connect to AI for a detailed summary right now, but keep up the good work!";
  }
};