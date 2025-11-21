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

package com.recordingapireactnative.recordingapi;

import android.Manifest;
import android.content.pm.PackageManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import com.google.android.gms.fitness.FitnessLocal;
import com.google.android.gms.fitness.LocalRecordingClient;
import com.google.android.gms.fitness.data.Bucket;
import com.google.android.gms.fitness.data.DataPoint;
import com.google.android.gms.fitness.data.DataSet;
import com.google.android.gms.fitness.data.LocalDataReadResponse;
import com.google.android.gms.fitness.data.LocalDataType;
import com.google.android.gms.fitness.data.LocalField;
import com.google.android.gms.fitness.request.LocalDataReadRequest;

import java.util.List;
import java.util.concurrent.TimeUnit;

public class RecordingAPIModule extends ReactContextBaseJavaModule {
    private static final String TAG = "RecordingAPIModule";
    private static final String MODULE_NAME = "RecordingAPI";

    private final LocalRecordingClient localRecordingClient;

    public RecordingAPIModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.localRecordingClient = FitnessLocal.getLocalRecordingClient(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * Check if ACTIVITY_RECOGNITION permission is granted
     */
    @ReactMethod
    public void hasPermission(Promise promise) {
        try {
            boolean hasPermission = ContextCompat.checkSelfPermission(
                getReactApplicationContext(),
                Manifest.permission.ACTIVITY_RECOGNITION
            ) == PackageManager.PERMISSION_GRANTED;

            promise.resolve(hasPermission);
        } catch (Exception e) {
            promise.reject("PERMISSION_CHECK_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Subscribe to a data type for background recording
     * @param dataType - "steps", "distance", or "calories"
     */
    @ReactMethod
    public void subscribe(String dataType, Promise promise) {
        try {
            LocalDataType localDataType = getLocalDataType(dataType);

            if (localDataType == null) {
                promise.reject("INVALID_DATA_TYPE", "Invalid data type: " + dataType);
                return;
            }

            localRecordingClient.subscribe(localDataType)
                .addOnSuccessListener(unused -> {
                    Log.i(TAG, "Successfully subscribed to " + dataType);
                    promise.resolve(true);
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Failed to subscribe to " + dataType, e);
                    promise.reject("SUBSCRIBE_ERROR", e.getMessage(), e);
                });
        } catch (Exception e) {
            promise.reject("SUBSCRIBE_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Unsubscribe from a data type
     */
    @ReactMethod
    public void unsubscribe(String dataType, Promise promise) {
        try {
            LocalDataType localDataType = getLocalDataType(dataType);

            if (localDataType == null) {
                promise.reject("INVALID_DATA_TYPE", "Invalid data type: " + dataType);
                return;
            }

            localRecordingClient.unsubscribe(localDataType)
                .addOnSuccessListener(unused -> {
                    Log.i(TAG, "Successfully unsubscribed from " + dataType);
                    promise.resolve(true);
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Failed to unsubscribe from " + dataType, e);
                    promise.reject("UNSUBSCRIBE_ERROR", e.getMessage(), e);
                });
        } catch (Exception e) {
            promise.reject("UNSUBSCRIBE_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Read data from Recording API
     * @param dataType - "steps", "distance", or "calories"
     * @param startTime - Unix timestamp in seconds
     * @param endTime - Unix timestamp in seconds
     * @param bucketInterval - Bucket interval in hours
     * @param isAggregate - Whether to aggregate the data
     */
    @ReactMethod
    public void readData(
        String dataType,
        double startTime,
        double endTime,
        int bucketInterval,
        boolean isAggregate,
        Promise promise
    ) {
        try {
            LocalDataType localDataType = getLocalDataType(dataType);

            if (localDataType == null) {
                promise.reject("INVALID_DATA_TYPE", "Invalid data type: " + dataType);
                return;
            }

            LocalDataReadRequest.Builder builder = new LocalDataReadRequest.Builder();

            if (isAggregate) {
                builder.aggregate(localDataType);
            } else {
                builder.read(localDataType);
            }

            LocalDataReadRequest request = builder
                .bucketByTime(bucketInterval, TimeUnit.HOURS)
                .setTimeRange((long) startTime, (long) endTime, TimeUnit.SECONDS)
                .build();

            localRecordingClient.readData(request)
                .addOnSuccessListener(response -> {
                    try {
                        WritableArray bucketsArray = convertResponseToBuckets(
                            response,
                            dataType
                        );
                        Log.i(TAG, "Successfully read " + dataType + " data");
                        promise.resolve(bucketsArray);
                    } catch (Exception e) {
                        promise.reject("DATA_CONVERSION_ERROR", e.getMessage(), e);
                    }
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Failed to read " + dataType + " data", e);
                    promise.reject("READ_DATA_ERROR", e.getMessage(), e);
                });
        } catch (Exception e) {
            promise.reject("READ_DATA_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Convert LocalDataType string to LocalDataType object
     */
    private LocalDataType getLocalDataType(String dataType) {
        switch (dataType) {
            case "steps":
                return LocalDataType.TYPE_STEP_COUNT_DELTA;
            case "distance":
                return LocalDataType.TYPE_DISTANCE_DELTA;
            case "calories":
                return LocalDataType.TYPE_CALORIES_EXPENDED;
            default:
                return null;
        }
    }

    /**
     * Get the appropriate LocalField for a data type
     */
    private LocalField getLocalField(String dataType) {
        switch (dataType) {
            case "steps":
                return LocalField.FIELD_STEPS;
            case "distance":
                return LocalField.FIELD_DISTANCE;
            case "calories":
                return LocalField.FIELD_CALORIES;
            default:
                return null;
        }
    }

    /**
     * Convert LocalDataReadResponse to WritableArray of buckets
     */
    private WritableArray convertResponseToBuckets(
        LocalDataReadResponse response,
        String dataType
    ) {
        WritableArray bucketsArray = Arguments.createArray();
        List<Bucket> buckets = response.getBuckets();
        LocalField localField = getLocalField(dataType);

        for (int bucketIndex = 0; bucketIndex < buckets.size(); bucketIndex++) {
            Bucket bucket = buckets.get(bucketIndex);
            WritableMap bucketMap = Arguments.createMap();

            bucketMap.putInt("index", bucketIndex);
            bucketMap.putDouble("startTime", bucket.getStartTime(TimeUnit.SECONDS));
            bucketMap.putDouble("endTime", bucket.getEndTime(TimeUnit.SECONDS));

            // Convert DataSets
            WritableArray dataSetsArray = Arguments.createArray();
            List<DataSet> dataSets = bucket.getDataSets();

            for (int dataSetIndex = 0; dataSetIndex < dataSets.size(); dataSetIndex++) {
                DataSet dataSet = dataSets.get(dataSetIndex);
                WritableMap dataSetMap = Arguments.createMap();

                dataSetMap.putInt("index", dataSetIndex);

                // Convert DataPoints
                WritableArray dataPointsArray = Arguments.createArray();
                List<DataPoint> dataPoints = dataSet.getDataPoints();

                for (int dataPointIndex = 0; dataPointIndex < dataPoints.size(); dataPointIndex++) {
                    DataPoint dataPoint = dataPoints.get(dataPointIndex);
                    WritableMap dataPointMap = Arguments.createMap();

                    dataPointMap.putInt("index", dataPointIndex);
                    dataPointMap.putDouble("startTime", dataPoint.getStartTime(TimeUnit.SECONDS));
                    dataPointMap.putDouble("endTime", dataPoint.getEndTime(TimeUnit.SECONDS));
                    dataPointMap.putString("fieldName", localField.getName());

                    // Get field value
                    String fieldValue = dataPoint.getValue(localField).toString();
                    dataPointMap.putString("fieldValue", fieldValue);

                    dataPointsArray.pushMap(dataPointMap);
                }

                dataSetMap.putArray("dataPoints", dataPointsArray);
                dataSetsArray.pushMap(dataSetMap);
            }

            bucketMap.putArray("dataSets", dataSetsArray);
            bucketsArray.pushMap(bucketMap);
        }

        return bucketsArray;
    }
}
