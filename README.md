# Fuel Rescue ⛽

A modern web application connecting stranded vehicle users with nearby petrol pumps for fuel delivery.

## Features
- **Geolocation**: Automatically detects user location.
- **Interactive Map**: View nearby pumps on a map.
- **Fuel Request**: Request petrol or diesel delivery.
- **Pump Dashboard**: Service providers can view and accept requests.
- **Responsive Design**: Mobile-first UI with modern aesthetics.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, React Leaflet, Lucide Icons.
- **Backend**: Node.js, Express, MongoDB.

## Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

## Setup Instructions

### 1. Backend Setup
```bash
cd server
npm install
# Ensure MongoDB is running on localhost:27017 or update .env
npm start
```
The server will run on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

## Environment Variables
Create a `.env` file in the `server` directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fuel-rescue
```
