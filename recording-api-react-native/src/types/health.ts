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

export enum DataType {
  STEPS = 'steps',
  DISTANCE = 'distance',
  CALORIES = 'calories',
}

export interface DataPoint {
  index: number;
  startTime: number; // Unix timestamp in seconds
  endTime: number;
  fieldName: string;
  fieldValue: string;
}

export interface DataSet {
  index: number;
  dataPoints: DataPoint[];
}

export interface Bucket {
  index: number;
  startTime: number;
  endTime: number;
  dataSets: DataSet[];
}

export interface ReadDataOptions {
  dataType: DataType;
  startDate: Date;
  endDate: Date;
  bucketInterval: number; // in hours
  isAggregate: boolean;
}

export interface HealthServiceInterface {
  /**
   * Initialize the health service
   */
  initialize(): Promise<void>;

  /**
   * Check if the health service is available on the device
   */
  isAvailable(): Promise<boolean>;

  /**
   * Check if permissions are granted for the specified data types
   */
  hasPermission(dataTypes: DataType[]): Promise<boolean>;

  /**
   * Request permissions for the specified data types
   */
  requestPermissions(dataTypes: DataType[]): Promise<boolean>;

  /**
   * Subscribe to data types (Android only - Recording API requirement)
   */
  subscribe(dataTypes: DataType[]): Promise<void>;

  /**
   * Read health data
   */
  readData(options: ReadDataOptions): Promise<Bucket[]>;
}
