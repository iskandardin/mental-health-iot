# MindWear: IoT Mental Health Monitoring System

## 📱 Overview
MindWear adalah aplikasi mobile berbasis IoT yang memantau kesehatan mental menggunakan sensor wearable. Sistem ini mengumpulkan data fisiologis real-time dan memberikan analisis stres, notifikasi peringatan dini, serta rekomendasi intervensi.

## 🏗️ Arsitektur Sistem

```
┌──────────────────────────────────────────────────────┐
│      Wearable Device (ESP32)                         │
│  ┌─────────────────────────────────────────────────┐ │
│  │ MAX30102 (HRV, Heart Rate)                      │ │
│  │ MLX90614 (Skin Temperature)                     │ │
│  │ GSR Sensor (Galvanic Skin Response)             │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
           ↓ WiFi/MQTT
┌──────────────────────────────────────────────────────┐
│     Cloud Backend (Node.js/Firebase)                 │
│  ┌─────────────────────────────────────────────────┐ │
│  │ API Server & Real-time Processing               │ │
│  │ Stress Analysis Algorithm                       │ │
│  │ Notification System                             │ │
│  └─────────────────────────────────────────────────┘ │
└───��──────────────────────────────────────────────────┘
           ↓ REST API / WebSocket
┌──────────────────────────────────────────────────────┐
│     Mobile App (React Native)                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Dashboard & Real-time Monitoring                │ │
│  │ Health Data Visualization                       │ │
│  │ Intervention Recommendations                    │ │
│  │ Local & Cloud Notifications                     │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

## 📦 Project Structure

```
mental-health-iot/
├── firmware/                 # ESP32 Firmware
│   ├── src/
│   │   ├��─ main.cpp
│   │   ├── sensor_manager.cpp
│   │   ├── sensor_manager.h
│   │   ├── stress_analyzer.cpp
│   │   ├── stress_analyzer.h
│   │   └── wifi_manager.h
│   ├── platformio.ini
│   └── lib/
├── backend/                  # Node.js Backend Server
│   ├── src/
│   │   ├── index.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── middleware/
│   ├── package.json
│   └── .env.example
├── mobile/                   # React Native Mobile App
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── context/
│   │   └── navigation/
│   ├── package.json
│   └── app.json
└── docs/                     # Documentation
    ├── SETUP.md
    ├── API.md
    └── SENSOR_CALIBRATION.md
```

## ✅ Key Features

✅ **Real-time Sensor Data Collection**
- Heart Rate & HRV (Heart Rate Variability)
- Skin Temperature Monitoring
- Galvanic Skin Response (GSR/EDA)

✅ **Stress Level Analysis**
- Automatic stress level categorization
- Machine learning-based pattern recognition
- Personalized baseline establishment

✅ **Early Warning System**
- Real-time anomaly detection
- Push notifications to user & healthcare providers
- Customizable alert thresholds

✅ **Intervention Features**
- Guided breathing exercises
- Relaxation music recommendations
- Medication reminders
- Mood tracking journal

✅ **Cloud Integration**
- Firebase Realtime Database
- Secure data storage & encryption
- Long-term health analytics
- Healthcare provider dashboard

## 🛠️ Tech Stack

### Firmware
- **Microcontroller**: ESP32
- **IDE**: PlatformIO
- **Libraries**: Arduino, WiFi, MQTT, Sensor Libraries

### Backend
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: Firebase Realtime DB
- **Real-time**: Socket.io
- **Authentication**: Firebase Auth

### Mobile
- **Framework**: React Native (Expo)
- **Language**: JavaScript/TypeScript
- **UI**: React Native Paper
- **State Management**: Redux
- **Charts**: react-native-chart-kit

## 📋 Prerequisites

### Hardware
- ESP32 Development Board
- MAX30102 Heart Rate & Pulse Oximetry Sensor
- MLX90614 Infrared Temperature Sensor
- GSR/EDA Sensor Module
- Wearable enclosure/strap

### Software
- Node.js v16+
- npm/yarn
- PlatformIO CLI
- React Native CLI / Expo CLI
- Firebase Account

## 🚀 Quick Start

### 1. Firmware Setup
```bash
cd firmware
pio run -t upload -e esp32
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm start
```

### 3. Mobile App Setup
```bash
cd mobile
npm install
npm start
# Scan QR code with Expo Go app
```

## 📊 Stress Level Algorithm

```
Stress Level = (HRV_abnormality + Temp_elevation + GSR_activity) / 3

- Normal: Score < 40
- Alert: Score 40-70
- High: Score > 70
```

## 📝 License

MIT License - See LICENSE file
