# GeoTrek AI

GeoTrek AI is a real-time movement tracking application built with React, TypeScript, and Google Gemini API. It tracks your journey statistics (distance, speed, duration), visualizes your route using D3.js, and provides an AI-generated summary of your activity upon completion.

## Features

- **Real-time Tracking**: Uses the Geolocation API to track movement with high accuracy.
- **Live Stats**: Displays total distance (km), duration, current speed, and max speed.
- **Route Visualization**: Draws your path in real-time using D3.js.
- **AI Summaries**: Generates a motivational summary and health fact about your workout using Google's Gemini Flash model.
- **Responsive Design**: Built with Tailwind CSS for a seamless mobile and desktop experience.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Google Gemini API Key

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/geotrek-ai.git
    cd geotrek-ai
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment Variables:
    Create a `.env` file in the root directory and add your API key:
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Technologies Used

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Visualization**: D3.js
- **AI**: @google/genai SDK (Gemini 2.5 Flash)
- **Build Tool**: Vite

## License

MIT
