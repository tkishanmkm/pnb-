# Guide to Building an Android APK from the Next.js App

This guide provides the steps to wrap this Next.js web application into a native Android application (APK) using Capacitor.

## What is Capacitor?

Capacitor is a tool that takes your web application and bundles it into a native mobile application. This allows you to submit your app to the Google Play Store and access native device features (like the camera or GPS) directly from your web code.

---

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
1.  **Node.js and npm**: The environment for running your Next.js app.
2.  **Android Studio**: The official IDE for Android development. This is required to build the native Android project and generate the APK.
3.  **Java Development Kit (JDK)**: Required by Android Studio.

---

## Step-by-Step Process

### Step 1: Configure Next.js for Static Export

Capacitor needs a static version of your web app (HTML, CSS, and JavaScript files). You need to configure your Next.js project to produce a static export.

1.  **Update `next.config.ts`**:
    Add the `output: 'export'` option to your `next.config.ts` file. This tells Next.js to generate a static site instead of running a server.

    ```ts
    // next.config.ts
    import type {NextConfig} from 'next';

    const nextConfig: NextConfig = {
      output: 'export', // <-- Add this line
      // ... other existing config ...
    };

    export default nextConfig;
    ```

2.  **Build the Static App**:
    Run the following command in your terminal. This will create a static version of your app in the `out` folder.
    ```bash
    npm run build
    ```

### Step 2: Add Capacitor to Your Project

Now, you will add Capacitor to your project and configure it.

1.  **Install Capacitor**:
    ```bash
    npm install @capacitor/core @capacitor/cli @capacitor/android
    ```

2.  **Initialize Capacitor**:
    This command will create a `capacitor.config.ts` file. It will ask for an "App ID" (use a reverse domain format, e.g., `com.pnb.ebank`) and "App Name" (`PNB eBank`).
    ```bash
    npx cap init
    ```
    When prompted, set the **web directory** to `out`. This is the folder containing your static web app.

3.  **Add the Android Platform**:
    This command creates the native Android project in a new folder called `android`.
    ```bash
    npx cap add android
    ```

### Step 3: Sync Your Web App with the Native Project

Any time you make changes to your web app, you need to rebuild it and sync the changes with the native Android project.

1.  **Rebuild your Next.js app**:
    ```bash
    npm run build
    ```

2.  **Sync with Capacitor**:
    This command copies your latest web build from the `out` folder into the native Android project.
    ```bash
    npx cap sync android
    ```

### Step 4: Build the APK in Android Studio

Now you will use Android Studio to build the actual APK file.

1.  **Open the Android Project**:
    Open Android Studio and choose "Open an existing project". Navigate to your project folder and select the `android` directory that Capacitor created.

2.  **Wait for Gradle Sync**:
    Android Studio will take some time to download dependencies and sync the project. Wait for this process to complete.

3.  **Build the APK**:
    From the top menu in Android Studio, go to `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.

4.  **Locate the APK**:
    Once the build is finished, a notification will appear in the bottom-right corner of Android Studio. Click the "locate" link in the notification to find your generated APK file. It is usually found in a path like `[your-project]/android/app/build/outputs/apk/debug/app-debug.apk`.

You can now install this APK file on an Android device for testing.

---

## Summary

The development cycle looks like this:
1.  Make changes to your Next.js application.
2.  Run `npm run build` to create a new static export.
3.  Run `npx cap sync android` to update the native project.
4.  Re-build the APK in Android Studio if you need a new file to distribute. (You can also run the app directly on a connected device or emulator from within Android Studio by clicking the "Run" button).