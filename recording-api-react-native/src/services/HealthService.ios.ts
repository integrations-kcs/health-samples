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

import AppleHealthKit, {
  HealthKitPermissions,
  HealthValue,
  HealthInputOptions,
} from 'react-native-health';
import {
  HealthServiceInterface,
  DataType,
  Bucket,
  ReadDataOptions,
  DataPoint,
} from '../types/health';

const PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
    ],
    write: [],
  },
};

class HealthServiceIOS implements HealthServiceInterface {
  private initialized = false;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.initHealthKit(PERMISSIONS, (error) => {
        if (error) {
          console.error('Error initializing HealthKit:', error);
          reject(error);
        } else {
          this.initialized = true;
          resolve();
        }
      });
    });
  }

  async isAvailable(): Promise<boolean> {
    return AppleHealthKit.isAvailable();
  }

  async hasPermission(dataTypes: DataType[]): Promise<boolean> {
    // HealthKit doesn't provide a way to check permission status
    // We assume permissions are granted if initialized
    return this.initialized;
  }

  async requestPermissions(dataTypes: DataType[]): Promise<boolean> {
    // Permissions are requested during initialization
    // Re-initialize to prompt user if not already initialized
    if (!this.initialized) {
      try {
        await this.initialize();
        return true;
      } catch (error) {
        return false;
      }
    }
    return this.initialized;
  }

  async subscribe(dataTypes: DataType[]): Promise<void> {
    // HealthKit doesn't require explicit subscription
    // Background delivery is handled by iOS automatically
    return Promise.resolve();
  }

  async readData(options: ReadDataOptions): Promise<Bucket[]> {
    const { dataType, startDate, endDate, bucketInterval, isAggregate } = options;

    if (!this.initialized) {
      throw new Error('HealthKit not initialized');
    }

    try {
      // Create buckets based on interval
      const buckets = this.createBuckets(startDate, endDate, bucketInterval);

      // Fetch data for each bucket
      const bucketsWithData = await Promise.all(
        buckets.map(async (bucket, index) => {
          const data = await this.fetchDataForBucket(
            dataType,
            new Date(bucket.startTime * 1000),
            new Date(bucket.endTime * 1000),
            isAggregate
          );

          return {
            index,
            startTime: bucket.startTime,
            endTime: bucket.endTime,
            dataSets: data.length > 0 ? [{ index: 0, dataPoints: data }] : [],
          };
        })
      );

      return bucketsWithData;
    } catch (error) {
      console.error('Error reading HealthKit data:', error);
      throw error;
    }
  }

  private createBuckets(
    startDate: Date,
    endDate: Date,
    intervalHours: number
  ): Array<{ startTime: number; endTime: number }> {
    const buckets: Array<{ startTime: number; endTime: number }> = [];
    const intervalMs = intervalHours * 60 * 60 * 1000;

    let currentStart = startDate.getTime();
    const end = endDate.getTime();

    while (currentStart < end) {
      const currentEnd = Math.min(currentStart + intervalMs, end);
      buckets.push({
        startTime: Math.floor(currentStart / 1000),
        endTime: Math.floor(currentEnd / 1000),
      });
      currentStart = currentEnd;
    }

    return buckets;
  }

  private async fetchDataForBucket(
    dataType: DataType,
    startDate: Date,
    endDate: Date,
    isAggregate: boolean
  ): Promise<DataPoint[]> {
    const options: HealthInputOptions = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    return new Promise((resolve, reject) => {
      switch (dataType) {
        case DataType.STEPS:
          this.getSteps(options, isAggregate, resolve, reject);
          break;
        case DataType.DISTANCE:
          this.getDistance(options, isAggregate, resolve, reject);
          break;
        case DataType.CALORIES:
          this.getCalories(options, isAggregate, resolve, reject);
          break;
        default:
          reject(new Error('Unsupported data type'));
      }
    });
  }

  private getSteps(
    options: HealthInputOptions,
    isAggregate: boolean,
    resolve: (value: DataPoint[]) => void,
    reject: (reason: any) => void
  ) {
    if (isAggregate) {
      AppleHealthKit.getStepCount(options, (err, results) => {
        if (err) {
          reject(err);
        } else {
          const dataPoints: DataPoint[] = [{
            index: 0,
            startTime: Math.floor(new Date(options.startDate!).getTime() / 1000),
            endTime: Math.floor(new Date(options.endDate!).getTime() / 1000),
            fieldName: 'steps',
            fieldValue: results.value.toString(),
          }];
          resolve(dataPoints);
        }
      });
    } else {
      AppleHealthKit.getDailyStepCountSamples(options, (err, results) => {
        if (err) {
          reject(err);
        } else {
          const dataPoints: DataPoint[] = results.map((item, index) => ({
            index,
            startTime: Math.floor(new Date(item.startDate).getTime() / 1000),
            endTime: Math.floor(new Date(item.endDate).getTime() / 1000),
            fieldName: 'steps',
            fieldValue: item.value.toString(),
          }));
          resolve(dataPoints);
        }
      });
    }
  }

  private getDistance(
    options: HealthInputOptions,
    isAggregate: boolean,
    resolve: (value: DataPoint[]) => void,
    reject: (reason: any) => void
  ) {
    AppleHealthKit.getDistanceWalkingRunning(options, (err, results) => {
      if (err) {
        reject(err);
      } else {
        const dataPoints: DataPoint[] = [{
          index: 0,
          startTime: Math.floor(new Date(options.startDate!).getTime() / 1000),
          endTime: Math.floor(new Date(options.endDate!).getTime() / 1000),
          fieldName: 'distance',
          fieldValue: results.value.toString(),
        }];
        resolve(dataPoints);
      }
    });
  }

  private getCalories(
    options: HealthInputOptions,
    isAggregate: boolean,
    resolve: (value: DataPoint[]) => void,
    reject: (reason: any) => void
  ) {
    AppleHealthKit.getActiveEnergyBurned(options, (err, results) => {
      if (err) {
        reject(err);
      } else {
        const dataPoints: DataPoint[] = [{
          index: 0,
          startTime: Math.floor(new Date(options.startDate!).getTime() / 1000),
          endTime: Math.floor(new Date(options.endDate!).getTime() / 1000),
          fieldName: 'calories',
          fieldValue: results.value.toString(),
        }];
        resolve(dataPoints);
      }
    });
  }
}

export default new HealthServiceIOS();
