/*
 * Copyright 2024 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import {
  HealthServiceInterface,
  DataType,
  Bucket,
  ReadDataOptions,
} from '../types/health';

const { RecordingAPI } = NativeModules;

class HealthServiceAndroid implements HealthServiceInterface {
  private permissionGranted = false;

  async initialize(): Promise<void> {
    // No initialization needed for Recording API
    return Promise.resolve();
  }

  async isAvailable(): Promise<boolean> {
    // Recording API is available on Android API 29+
    return Platform.Version >= 29;
  }

  async hasPermission(dataTypes: DataType[]): Promise<boolean> {
    try {
      const granted = await RecordingAPI.hasPermission();
      this.permissionGranted = granted;
      return granted;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  async requestPermissions(dataTypes: DataType[]): Promise<boolean> {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        {
          title: 'Activity Recognition Permission',
          message:
            'This app needs access to your activity data to track your steps, distance, and calories.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      this.permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      return this.permissionGranted;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  async subscribe(dataTypes: DataType[]): Promise<void> {
    if (!this.permissionGranted) {
      throw new Error('Permission not granted. Call requestPermissions first.');
    }

    try {
      const subscribePromises = dataTypes.map((dataType) =>
        RecordingAPI.subscribe(dataType)
      );
      await Promise.all(subscribePromises);
      console.log('Successfully subscribed to all data types');
    } catch (error) {
      console.error('Error subscribing to data types:', error);
      throw error;
    }
  }

  async readData(options: ReadDataOptions): Promise<Bucket[]> {
    const { dataType, startDate, endDate, bucketInterval, isAggregate } = options;

    try {
      const startTime = Math.floor(startDate.getTime() / 1000);
      const endTime = Math.floor(endDate.getTime() / 1000);

      const buckets = await RecordingAPI.readData(
        dataType,
        startTime,
        endTime,
        bucketInterval,
        isAggregate
      );

      return buckets as Bucket[];
    } catch (error) {
      console.error('Error reading data:', error);
      throw error;
    }
  }
}

export default new HealthServiceAndroid();
