# Claude Split Bill App

A React Native application for splitting bills, built with Expo.

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

The app is configured to run on port 8082 and be accessible on your local network.

#### Development Server
```bash
npm start
```
This will start the Expo development server accessible at:
- Local: http://localhost:8082
- Network: http://[your-ip]:8082

#### Platform-specific Commands
```bash
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator  
npm run web        # Run in web browser
```

### Network Access

The development server is configured with `--host lan` to allow access from other devices on your network. Find your local IP address and use `http://[your-ip]:8082` to access the app from other devices.

To find your IP address:
- Windows: `ipconfig`
- macOS/Linux: `ifconfig`

### Dependencies

This project uses:
- React Native with Expo
- Drag and drop functionality with @dnd-kit
- Timeline components
- Gesture handling and animations

### Package Compatibility Notice

Some packages may show compatibility warnings with the current Expo version. The app should still function correctly, but consider updating packages as recommended for best compatibility.