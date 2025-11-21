# Recording API React Native Sample

This repository contains a React Native sample app that demonstrates how to use:
- **Recording API on Mobile** (Android) - Google's new on-device fitness tracking API
- **HealthKit** (iOS) - Apple's health data framework

This is a cross-platform conversion of the Android [RecordingApiOnMobileSample](../recording-api-on-mobile/RecordingApiOnMobileSample).

## Features

- ✅ Request ACTIVITY_RECOGNITION permission (Android) and HealthKit permissions (iOS)
- ✅ Subscribe to fitness data types (steps, distance, calories)
- ✅ Read raw data from the last 24 hours
- ✅ Read aggregate data from the last 24 hours
- ✅ Display data in hierarchical format (Buckets → DataSets → DataPoints)
- ✅ Cross-platform UI with identical experience on Android and iOS

## Architecture

### Platform-Specific APIs

| Platform | API | Data Storage | Subscription Required |
|----------|-----|--------------|----------------------|
| **Android** | Recording API on Mobile | On-device, app-specific | Yes |
| **iOS** | HealthKit | On-device, system-wide | No |

### Technology Stack

- **Framework**: React Native 0.73
- **Language**: TypeScript
- **Android API**: Recording API (LocalRecordingClient)
- **iOS API**: HealthKit (via react-native-health)
- **Architecture**: Custom native modules + TypeScript abstraction layer

## Prerequisites

### General
- Node.js >= 18
- npm >= 9

### Android
- Android Studio
- Android SDK API 29+ (Recording API requirement)
- Java 17

### iOS
- macOS
- Xcode 14+
- CocoaPods
- iOS 13+ device or simulator

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/android/health-samples.git
cd health-samples/recording-api-react-native
```

### 2. Install dependencies

```bash
npm install
```

### 3. iOS Setup

```bash
cd ios
pod install
cd ..
```

**Enable HealthKit in Xcode:**
1. Open `ios/RecordingAPIReactNative.xcworkspace` in Xcode
2. Select the project in the navigator
3. Select the target → Signing & Capabilities tab
4. Click "+ Capability" → Add "HealthKit"

### 4. Android Setup

The Android native module is already configured. No additional setup needed.

## Running the App

### Android

```bash
npm run android
```

Or:
```bash
npx react-native run-android
```

### iOS

```bash
npm run ios
```

Or:
```bash
npx react-native run-ios
```

## Project Structure

```
recording-api-react-native/
├── android/
│   └── app/
│       └── src/
│           └── main/
│               ├── java/com/recordingapireactnative/
│               │   └── recordingapi/
│               │       ├── RecordingAPIModule.java      # Native Android module
│               │       └── RecordingAPIPackage.java
│               └── AndroidManifest.xml
├── ios/
│   └── RecordingAPIReactNative/
│       └── Info.plist                                   # HealthKit permissions
├── src/
│   ├── components/
│   │   ├── BucketCard.tsx                              # UI: Bucket display
│   │   ├── DataSetRow.tsx                              # UI: DataSet display
│   │   └── DataPointRow.tsx                            # UI: DataPoint display
│   ├── screens/
│   │   └── HomeScreen.tsx                              # Main screen
│   ├── services/
│   │   ├── HealthService.ts                            # Platform selector
│   │   ├── HealthService.android.ts                    # Android implementation
│   │   └── HealthService.ios.ts                        # iOS implementation
│   ├── types/
│   │   └── health.ts                                   # TypeScript interfaces
│   ├── hooks/
│   │   └── useHealthData.ts                            # Custom hook
│   └── App.tsx                                         # Root component
├── package.json
└── README.md
```

## How It Works

### 1. Initialization

The app initializes the appropriate health service based on the platform:

- **Android**: Uses custom native module for Recording API
- **iOS**: Uses react-native-health library for HealthKit

### 2. Permissions

**Android (Recording API):**
- Requests `ACTIVITY_RECOGNITION` permission
- Must subscribe to each data type to enable background recording
- Data retained for up to 10 days

**iOS (HealthKit):**
- Requests permissions during HealthKit initialization
- No subscription needed (handled by iOS automatically)
- Data retention managed by iOS

### 3. Reading Data

Both platforms read data in buckets (time intervals):
- Bucket interval: 1 hour
- Time range: Last 24 hours
- Supports raw and aggregate data

### 4. Data Structure

```typescript
Bucket {
  index: number
  startTime: number  // Unix timestamp (seconds)
  endTime: number
  dataSets: DataSet[]
}

DataSet {
  index: number
  dataPoints: DataPoint[]
}

DataPoint {
  index: number
  startTime: number
  endTime: number
  fieldName: string   // "steps", "distance", or "calories"
  fieldValue: string
}
```

## Key Differences: Original Android App vs React Native

| Aspect | Original Android | React Native |
|--------|-----------------|--------------|
| **Platform** | Android only | Android + iOS |
| **Language** | Kotlin | TypeScript + Java (native module) |
| **UI Framework** | Jetpack Compose | React Native |
| **Android API** | Recording API | Recording API (same) |
| **iOS API** | N/A | HealthKit |
| **Min Android** | API 29 | API 29 |
| **Min iOS** | N/A | iOS 13 |

## Important Notes

### Android (Recording API)

1. **Requires Android API 29+** (Android 10+)
2. **Subscription required**: Must call `subscribe()` for each data type
3. **Data retention**: Up to 10 days
4. **No Google Account needed**: Fully on-device
5. **Battery efficient**: More efficient than SensorManager

### iOS (HealthKit)

1. **HealthKit capability required**: Must be enabled in Xcode
2. **No subscription needed**: iOS handles background updates
3. **No data retention limit**: Managed by iOS
4. **System-wide storage**: Data shared across apps (with permission)

### Permissions

**Android:**
- Must request `ACTIVITY_RECOGNITION` permission at runtime
- User must grant permission for app to work

**iOS:**
- Must include usage descriptions in Info.plist
- User can grant/deny permissions per data type
- Cannot check permission status directly

## Troubleshooting

### Android

**Error: "RecordingAPI module not found"**
- Ensure RecordingAPIPackage is registered in MainApplication.java
- Clean and rebuild: `cd android && ./gradlew clean && cd ..`

**Error: "Permission denied"**
- Request ACTIVITY_RECOGNITION permission
- Check that minSdk is 29 or higher

**No data returned:**
- Ensure you've called `subscribe()` for the data types
- Wait a few minutes for data to be collected
- Recording API only stores up to 10 days of data

### iOS

**Error: "HealthKit not available"**
- HealthKit is not available in iOS Simulator on Mac
- Test on a real device
- Ensure HealthKit capability is enabled in Xcode

**Error: "Module RCTHealthKit not found"**
- Run `cd ios && pod install && cd ..`
- Clean build folder in Xcode

**No data returned:**
- Ensure HealthKit permissions are granted
- Check that user has health data in Apple Health app
- Some data types require actual activity to generate data

## API Reference

### HealthService

```typescript
interface HealthServiceInterface {
  initialize(): Promise<void>
  isAvailable(): Promise<boolean>
  hasPermission(dataTypes: DataType[]): Promise<boolean>
  requestPermissions(dataTypes: DataType[]): Promise<boolean>
  subscribe(dataTypes: DataType[]): Promise<void>
  readData(options: ReadDataOptions): Promise<Bucket[]>
}
```

### Data Types

```typescript
enum DataType {
  STEPS = 'steps',
  DISTANCE = 'distance',
  CALORIES = 'calories',
}
```

## Support

If you've found an error in this sample, please file an issue:
https://github.com/android/health-samples/issues

For questions about Recording API on Mobile:
https://developer.android.com/health-and-fitness/recording-api

For questions about React Native:
https://reactnative.dev/help

## License

```
Copyright 2024 The Android Open Source Project

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
