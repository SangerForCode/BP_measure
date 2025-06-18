import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Dimensions, Pressable, ActivityIndicator, Alert } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';

const HealthDashboard = ({ userLoggedIn }) => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7days');

  const API_URL = 'https://health-app-asr-default-rtdb.firebaseio.com/tryout.json';

  const dateRanges = [
    { label: '7 Days', value: '7days' },
    { label: '14 Days', value: '14days' },
    { label: '1 Month', value: '1month' }
  ];

  // Format dates for better X-axis display
  const formatChartDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`; // Shows as "D/M" (e.g., "15/6")
  };

  // 1. Update the Data Transformation in fetchData()
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);

      if (!response.data) {
        throw new Error('No data received from server');
      }

      const transformedData = Object.entries(response.data).map(([key, value]) => {
        const timestamp = new Date(value.vital_signs.timestamp);
        return {
          id: key,
          timestamp,
          date: timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: timestamp.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          bp: {
            high: Number(value.vital_signs.blood_pressure.systolic) || 0,
            low: Number(value.vital_signs.blood_pressure.diastolic) || 0
          },
          pulse: Number(value.vital_signs.pulse_rate?.value) || 0, // Fixed pulse data access
          stress: value.vital_signs.high_stress_level,
          symptoms: value.vital_signs.had_symptoms,
          exercise: value.vital_signs.exercised_today,
          meds: value.vital_signs.medication_taken,
          notes: value.vital_signs.notes || 'No notes'
        };
      }).sort((a, b) => b.timestamp - a.timestamp);

      setRawData(transformedData);
    } catch (error) {
      Alert.alert("Error", "Failed to process health data");
      console.error("Data processing error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!rawData.length) return [];
    
    const now = new Date();
    const cutoffDate = new Date(now);
    
    switch(dateRange) {
      case '7days':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '14days':
        cutoffDate.setDate(now.getDate() - 14);
        break;
      case '1month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      default:
        cutoffDate.setDate(now.getDate() - 7);
    }
    
    return rawData.filter(item => item.timestamp > cutoffDate);
  }, [rawData, dateRange]);

  // 2. Update Statistics Calculation
  const stats = useMemo(() => {
    if (!filteredData.length) return null;

    const bpHighValues = filteredData.map(item => item.bp.high);
    const bpLowValues = filteredData.map(item => item.bp.low);
    const pulseValues = filteredData.map(item => item.pulse); // Now correctly accessing pulse

    const average = (arr) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    const min = (arr) => Math.min(...arr);
    const max = (arr) => Math.max(...arr);

    return {
      bpHigh: {
        avg: average(bpHighValues),
        min: min(bpHighValues),
        max: max(bpHighValues)
      },
      bpLow: {
        avg: average(bpLowValues),
        min: min(bpLowValues),
        max: max(bpLowValues)
      },
      pulse: {
        avg: average(pulseValues), // Will now show correct values
        min: min(pulseValues),
        max: max(pulseValues)
      },
      stressDays: filteredData.filter(item => item.stress).length,
      exerciseDays: filteredData.filter(item => item.exercise).length,
      symptomDays: filteredData.filter(item => item.symptoms).length,
      medicationDays: filteredData.filter(item => item.meds).length
    };
  }, [filteredData]);

  useEffect(() => {
    if (userLoggedIn) {
      fetchData();
    }
  }, [userLoggedIn]);

  const renderOverview = () => (
    <View>
      {/* Statistics Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Blood Pressure</Text>
          <Text style={styles.statValue}>{stats?.bpHigh.avg || '--'}/{stats?.bpLow.avg || '--'}</Text>
          <Text style={styles.statSubtext}>Avg (High/Low)</Text>
          <Text style={styles.statRange}>Range: {stats?.bpHigh.min || '--'}-{stats?.bpHigh.max || '--'}/{stats?.bpLow.min || '--'}-{stats?.bpLow.max || '--'}</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Heart Rate</Text>
          <Text style={styles.statValue}>{stats?.pulse.avg || '--'}</Text>
          <Text style={styles.statSubtext}>Avg BPM</Text>
          <Text style={styles.statRange}>Range: {stats?.pulse.min || '--'}-{stats?.pulse.max || '--'}</Text>
        </View>
      </View>

      {/* Health Highlights */}
      <View style={styles.highlightsContainer}>
        <View style={styles.highlightItem}>
          <Text style={styles.highlightText}>🏋️ {stats?.exerciseDays || 0} workout days</Text>
        </View>
        <View style={styles.highlightItem}>
          <Text style={styles.highlightText}>😟 {stats?.stressDays || 0} stressful days</Text>
        </View>
        <View style={styles.highlightItem}>
          <Text style={styles.highlightText}>💊 {stats?.medicationDays || 0} med days</Text>
        </View>
      </View>

      {/* Blood Pressure Chart with Health Range Coloring and Legend */}
      <View>
        <Text style={styles.sectionTitle}>Blood Pressure Trend</Text>
        <LineChart
          data={{
            labels: filteredData.map(item => formatChartDate(item.timestamp)),
            datasets: [
              {
                data: filteredData.map(item => item.bp.high),
                color: (opacity = 1) => `rgba(255, 50, 50, ${opacity})`, // Red for systolic
                strokeWidth: 2
              },
              {
                data: filteredData.map(item => item.bp.low),
                color: (opacity = 1) => `rgba(50, 50, 255, ${opacity})`, // Blue for diastolic
                strokeWidth: 2
              }
            ]
          }}
          width={Dimensions.get('window').width - 40}
          height={220}
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#f8f8f8",
            backgroundGradientTo: "#f8f8f8",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForLabels: {
              fontSize: 10,
              rotation: -45
            }
          }}
          fromZero={false}
          style={styles.chart}
          withHorizontalLines={false}
          withHorizontalLabels={true}
          segments={5}
          formatYLabel={(value) => `${value}`}
          getDotColor={(dataPoint, index) => {
            // Color coding for systolic (datasetIndex 0) and diastolic (datasetIndex 1)
            if (dataPoint === 0) return 'transparent';
            // react-native-chart-kit does not provide datasetIndex, so color all dots green as fallback
            // For advanced coloring, a custom chart or Victory/VictoryNative is needed
            return 'green';
          }}
        />

        {/* Healthy Range Legend */}
        <View style={styles.rangeLegend}>
          <View style={styles.rangeItem}>
            <View style={[styles.rangeColor, {backgroundColor: 'red'}]} />
            <Text style={styles.rangeText}>High (Systolic: &gt;140, Diastolic: &gt;90)</Text>
          </View>
          <View style={styles.rangeItem}>
            <View style={[styles.rangeColor, {backgroundColor: 'green'}]} />
            <Text style={styles.rangeText}>Normal (Systolic: 90-140, Diastolic: 60-90)</Text>
          </View>
          <View style={styles.rangeItem}>
            <View style={[styles.rangeColor, {backgroundColor: 'orange'}]} />
            <Text style={styles.rangeText}>Low (Systolic: &lt;90, Diastolic: &lt;60)</Text>
          </View>
        </View>
      </View>

      {/* Pulse Chart */}
      <Text style={styles.sectionTitle}>Heart Rate Trend</Text>
      <LineChart
        data={{
          labels: filteredData.map(item => formatChartDate(item.timestamp)),
          datasets: [{
            data: filteredData.map(item => item.pulse), // Now using correct pulse values
            color: (opacity = 1) => `rgba(0, 200, 0, ${opacity})`,
            strokeWidth: 2
          }]
        }}
        width={Dimensions.get('window').width - 40}
        height={220}
        yAxisSuffix=" bpm"
        chartConfig={{
          backgroundColor: "#ffffff",
          backgroundGradientFrom: "#f8f8f8",
          backgroundGradientTo: "#f8f8f8",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: { borderRadius: 16 },
          propsForLabels: {
            fontSize: 10,
            rotation: -45
          }
        }}
        style={styles.chart}
      />
    </View>
  );

  // 4. Update Detail Card Display
  const renderDetails = () => (
    <View style={styles.detailsContainer}>
      {filteredData.map((record) => (
        <View key={record.id} style={styles.detailCard}>
          <Text style={styles.detailDate}>{record.fullDate} at {record.time}</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailMetric}>
              <Text style={styles.detailLabel}>Blood Pressure</Text>
              <Text style={[styles.detailValue, { color: '#e53935' }]}>
                {record.bp.high}
                <Text style={{ color: '#000' }}>/</Text>
                {record.bp.low}
              </Text>
              <Text style={styles.detailUnit}>mmHg</Text>
            </View>
            <View style={styles.detailMetric}>
              <Text style={styles.detailLabel}>Pulse</Text>
              <Text style={[styles.detailValue, { color: '#43a047' }]}>
                {record.pulse} {/* Now showing actual pulse value */}
              </Text>
              <Text style={styles.detailUnit}>bpm</Text>
            </View>
          </View>
          
          <View style={styles.detailIndicators}>
            <View style={[styles.indicator, record.stress && styles.stressIndicator]}>
              <Text>{record.stress ? "😟 Stressed" : "😊 Normal"}</Text>
            </View>
            <View style={[styles.indicator, record.symptoms && styles.symptomIndicator]}>
              <Text>{record.symptoms ? "🤒 Symptoms" : "😃 Healthy"}</Text>
            </View>
            <View style={[styles.indicator, record.exercise && styles.exerciseIndicator]}>
              <Text>{record.exercise ? "🏋️ Exercised" : "🛌 No exercise"}</Text>
            </View>
            <View style={[styles.indicator, record.meds && styles.medicationIndicator]}>
              <Text>{record.meds ? "💊 Meds taken" : "❌ No meds"}</Text>
            </View>
          </View>
          
          <Text style={styles.notesText}>📝 Notes: {record.notes}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Date Range Selector */}
      <View style={styles.rangeContainer}>
        {dateRanges.map((range) => (
          <Pressable
            key={range.value}
            style={[styles.rangeButton, dateRange === range.value && styles.activeRangeButton]}
            onPress={() => setDateRange(range.value)}
          >
            <Text style={[styles.rangeButtonText, dateRange === range.value && styles.activeRangeButtonText]}>
              {range.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabButton, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'details' && styles.activeTab]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>Details</Text>
        </Pressable>
      </View>

      {/* Refresh Button */}
      <Pressable 
        onPress={fetchData} 
        style={styles.refreshButton}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>🔄 Refresh Data</Text>
        )}
      </Pressable>

      {/* Content Area */}
      {loading && !rawData.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading your health data...</Text>
        </View>
      ) : rawData.length > 0 ? (
        activeTab === 'overview' ? renderOverview() : renderDetails()
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No health data available</Text>
          <Pressable onPress={fetchData} style={styles.refreshButton}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  rangeButton: {
    flex: 1,
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center'
  },
  activeRangeButton: {
    backgroundColor: '#4CAF50'
  },
  rangeButtonText: {
    fontSize: 14,
    color: '#555'
  },
  activeRangeButtonText: {
    color: 'white',
    fontWeight: '600'
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0'
  },
  tabButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center'
  },
  activeTab: {
    backgroundColor: '#4CAF50'
  },
  tabText: {
    fontWeight: '500',
    color: '#555'
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600'
  },
  refreshButton: {
    padding: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16
  },
  buttonText: {
    color: 'white',
    fontWeight: '600'
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  statSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  statRange: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  highlightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  highlightItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1
  },
  highlightText: {
    fontSize: 14
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333'
  },
  chart: {
    borderRadius: 8,
    marginBottom: 24
  },
  detailsContainer: {
    marginBottom: 16
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  detailDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333'
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  detailMetric: {
    flex: 1,
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  detailValue: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  detailUnit: {
    fontSize: 12,
    color: '#999'
  },
  detailIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8
  },
  indicator: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
    minWidth: '48%'
  },
  stressIndicator: {
    backgroundColor: '#ffebee'
  },
  symptomIndicator: {
    backgroundColor: '#fff3e0'
  },
  exerciseIndicator: {
    backgroundColor: '#e8f5e9'
  },
  medicationIndicator: {
    backgroundColor: '#e3f2fd'
  },
  notesText: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    color: '#666',
    fontStyle: 'italic'
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 40
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16
  },
  rangeLegend: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8
  },
  rangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  rangeColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8
  },
  rangeText: {
    fontSize: 12,
    color: '#555'
  }
};

export default HealthDashboard;