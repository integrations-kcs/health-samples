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

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DataPoint } from '../types/health';
import { format } from 'date-fns';

interface DataPointRowProps {
  dataPoint: DataPoint;
}

const DataPointRow: React.FC<DataPointRowProps> = ({ dataPoint }) => {
  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'HH:mm:ss');
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Index:</Text>
        <Text style={styles.value}>{dataPoint.index}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Time:</Text>
        <Text style={styles.value}>
          {formatTime(dataPoint.startTime)} - {formatTime(dataPoint.endTime)}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{dataPoint.fieldName}:</Text>
        <Text style={styles.valueHighlight}>{dataPoint.fieldValue}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    width: 80,
  },
  value: {
    fontSize: 13,
    color: '#000',
    flex: 1,
  },
  valueHighlight: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    flex: 1,
  },
});

export default DataPointRow;
