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

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Bucket } from '../types/health';
import DataSetRow from './DataSetRow';
import { format } from 'date-fns';

interface BucketCardProps {
  bucket: Bucket;
}

const BucketCard: React.FC<BucketCardProps> = ({ bucket }) => {
  const [expanded, setExpanded] = useState(false);

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'MMM d, yyyy HH:mm:ss');
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Bucket {bucket.index}</Text>
          <Text style={styles.headerSubtitle}>
            {bucket.dataSets.reduce(
              (total, ds) => total + ds.dataPoints.length,
              0
            )}{' '}
            data point(s)
          </Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeLabel}>Start:</Text>
            <Text style={styles.timeValue}>{formatTime(bucket.startTime)}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeLabel}>End:</Text>
            <Text style={styles.timeValue}>{formatTime(bucket.endTime)}</Text>
          </View>

          <View style={styles.divider} />

          {bucket.dataSets.length > 0 ? (
            bucket.dataSets.map((dataSet) => (
              <DataSetRow key={dataSet.index} dataSet={dataSet} />
            ))
          ) : (
            <Text style={styles.noDataText}>No data in this bucket</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  expandIcon: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 50,
  },
  timeValue: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
});

export default BucketCard;
