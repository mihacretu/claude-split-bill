# Claude Split Bill App

A React Native application for splitting bills, built with Expo and integrated with Supabase authentication.

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- Expo CLI
- Supabase account (for authentication)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Supabase authentication:
   - Create a Supabase project at [https://app.supabase.com/](https://app.supabase.com/)
   - Get your project URL and anon key from Settings > API
   - Copy `.env.example` to `.env` and add your credentials:
     ```bash
     cp .env.example .env
     # Then edit .env with your actual Supabase URL and key
     ```
   - See `src/config/supabase-setup.md` for detailed setup instructions

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
- Supabase for authentication and backend services
- Drag and drop functionality with @dnd-kit
- Timeline components
- Gesture handling and animations
- Secure storage for authentication tokens

## Features

### Authentication
- ✅ User registration with email and password
- ✅ User login with secure session management
- ✅ Password reset functionality
- ✅ Secure token storage using Expo SecureStore
- ✅ Automatic session restoration on app restart
- ✅ Logout functionality with confirmation

### Bill Splitting (Existing Features)
- Interactive bill splitting interface
- Drag and drop food items to assign to people
- Quantity-based item assignment
- Timeline view of past bills
- Modern, animated UI with glass-morphism design

## Architecture

### Authentication Flow
The app uses a context-based authentication system:
- `AuthContext` provides authentication state and methods throughout the app
- Automatic routing between authenticated and unauthenticated screens
- Secure session management with Supabase

### File Structure
```
src/
├── config/
│   ├── supabase.js              # Supabase client configuration
│   └── supabase-setup.md        # Setup instructions
├── context/
│   └── AuthContext.js           # Authentication context provider
├── components/
│   ├── AuthInput.js             # Reusable input component for auth forms
│   ├── AuthButton.js            # Reusable button component for auth
│   └── ...                      # Existing components
├── screens/
│   ├── LoginScreen.js           # User login screen
│   ├── SignUpScreen.js          # User registration screen
│   ├── ForgotPasswordScreen.js  # Password reset screen
│   └── ...                      # Existing screens
└── ...
```

### Package Compatibility Notice

Some packages may show compatibility warnings with the current Expo version. The app should still function correctly, but consider updating packages as recommended for best compatibility.

## Setup Instructions

**Important**: You must configure Supabase before the app will work properly. 

### Quick Setup:
1. Copy the environment template: `cp .env.example .env`
2. Edit `.env` with your Supabase credentials
3. Restart your development server: `npm start`
4. See `src/config/supabase-setup.md` for detailed instructions

### Setup Script:
Run `./setup-supabase.sh` for an interactive setup experience.

### Environment Variables:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key