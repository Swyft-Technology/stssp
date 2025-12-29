# SwyftPOS - Modern Point of Sale System

SwyftPOS is a production-ready POS system built with React, TypeScript, and Firebase. It features offline support, inventory management, modifier logic, and real-time order syncing.

## 🚀 Getting Started Locally

### Prerequisites
1. **Node.js**: Install Node.js (v18+)
2. **Firebase Account**: You need a Google account to create a Firebase project.

### Step 1: Clone and Install
```bash
git clone https://github.com/yourusername/swyftpos.git
cd swyftpos
npm install
```

### Step 2: Firebase Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (e.g., "swyftpos-dev").
3. **Authentication**:
   - Go to "Authentication" > "Get Started".
   - Enable **Email/Password** sign-in provider.
   - Create a user (e.g., `admin@swyft.com`) for testing.
4. **Firestore Database**:
   - Go to "Firestore Database" > "Create Database".
   - Start in **Test Mode** (for development) or **Production Mode** (see Rules below).
   - Choose a location near you.
5. **Get Config**:
   - Click the Gear icon (Project Settings).
   - Scroll to "Your apps" > "Web app" > "SDK setup and configuration".
   - Copy the configuration keys.

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory (if using Vite) or update `src/firebase.ts` directly.

**`.env` Example:**
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 4: Run the App
```bash
npm run dev
```
Open `http://localhost:5173`.

**Note:** On the very first run, if your Firestore database is empty, the app will automatically Seed the database with the default menu items defined in `src/constants.ts`.

---

## 🔒 Security Rules (Firestore)

For production deployment, go to the Firebase Console > Firestore > Rules and publish the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone authenticated to read menu
    match /menu/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Refine for Admin only in future
    }
    match /categories/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /toppings/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /config/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /orders/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📦 Deployment to Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init`
   - Choose **Hosting**.
   - Use your existing project.
   - Public directory: `dist`
   - Configure as single-page app: **Yes**
4. Build and Deploy:
   ```bash
   npm run build
   firebase deploy
   ```

## ✨ Features

- **Offline First**: Uses Firebase Firestore offline persistence.
- **Complex Menu Items**: Supports Half/Half pizzas and Bundles.
- **Real-time Sync**: Orders update instantly across devices.
