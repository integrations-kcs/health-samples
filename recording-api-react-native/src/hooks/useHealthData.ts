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

import { useState, useEffect, useCallback } from 'react';
import HealthService from '../services/HealthService';
import { DataType, Bucket } from '../types/health';

export const useHealthData = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [selectedDataType, setSelectedDataType] = useState<DataType>(
    DataType.STEPS
  );
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const dataTypes = [DataType.STEPS, DataType.DISTANCE, DataType.CALORIES];

  useEffect(() => {
    initializeHealth();
  }, []);

  const initializeHealth = async () => {
    try {
      setIsLoading(true);

      // Check if health service is available
      const available = await HealthService.isAvailable();
      if (!available) {
        setError('Health services not available on this device');
        setIsLoading(false);
        return;
      }

      // Initialize the service
      await HealthService.initialize();
      setIsInitialized(true);

      // Check existing permissions
      const hasPerms = await HealthService.hasPermission(dataTypes);
      setHasPermission(hasPerms);

      if (hasPerms) {
        // Subscribe to data types (Android only, no-op on iOS)
        await HealthService.subscribe(dataTypes);
      }
    } catch (err) {
      setError((err as Error).message);
      console.error('Error initializing health service:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const granted = await HealthService.requestPermissions(dataTypes);
      setHasPermission(granted);

      if (granted) {
        // Subscribe to data types (Android Recording API requirement)
        await HealthService.subscribe(dataTypes);
      } else {
        setError('Permissions were not granted');
      }
    } catch (err) {
      setError((err as Error).message);
      console.error('Error requesting permissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const readRawData = useCallback(async () => {
    if (!hasPermission) {
      setError('Permissions not granted');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setBuckets([]); // Clear previous data

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      const data = await HealthService.readData({
        dataType: selectedDataType,
        startDate: startTime,
        endDate: endTime,
        bucketInterval: 1, // 1 hour buckets
        isAggregate: false,
      });

      setBuckets(data);
      console.log(`Successfully read ${data.length} buckets of raw data`);
    } catch (err) {
      setError((err as Error).message);
      console.error('Error reading raw data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDataType, hasPermission]);

  const readAggregateData = useCallback(async () => {
    if (!hasPermission) {
      setError('Permissions not granted');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setBuckets([]); // Clear previous data

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      const data = await HealthService.readData({
        dataType: selectedDataType,
        startDate: startTime,
        endDate: endTime,
        bucketInterval: 1, // 1 hour buckets
        isAggregate: true,
      });

      setBuckets(data);
      console.log(`Successfully read ${data.length} buckets of aggregate data`);
    } catch (err) {
      setError((err as Error).message);
      console.error('Error reading aggregate data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDataType, hasPermission]);

  return {
    hasPermission,
    isLoading,
    buckets,
    selectedDataType,
    dataTypes,
    error,
    isInitialized,
    setSelectedDataType,
    requestPermissions,
    readRawData,
    readAggregateData,
  };
};
