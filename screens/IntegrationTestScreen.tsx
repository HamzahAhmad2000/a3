import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { integrationTestService, IntegrationTestSuite, IntegrationTestResult } from '../services/integrationTest';

const IntegrationTestScreen: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<IntegrationTestSuite | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const runQuickConnectivityTest = async () => {
    setIsConnected(null);
    const connected = await integrationTestService.quickConnectivityTest();
    setIsConnected(connected);
    
    if (connected) {
      Alert.alert('✅ Success', 'Backend is connected and responding!');
    } else {
      Alert.alert('❌ Failed', 'Cannot connect to backend. Make sure the server is running on localhost:5000');
    }
  };

  const runFullIntegrationTest = async () => {
    setIsRunning(true);
    setTestResults(null);
    
    try {
      const results = await integrationTestService.runFullIntegrationTest();
      setTestResults(results);
      
      const statusMessage = results.overallStatus === 'passed' 
        ? '🎉 All tests passed! Frontend-Backend integration is working perfectly.'
        : results.overallStatus === 'partial'
        ? '⚠️ Some tests passed. Core functionality is working but some features may need attention.'
        : '❌ Multiple tests failed. Please check the backend server and configuration.';
      
      Alert.alert('Test Complete', statusMessage);
    } catch (error: any) {
      Alert.alert('Test Error', `Failed to run tests: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return '#4CAF50';
      case 'failed': return '#F44336';
      case 'skipped': return '#FF9800';
      default: return '#757575';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      default: return '❓';
    }
  };

  const renderTestResult = (result: IntegrationTestResult, index: number) => (
    <View key={index} style={[styles.testResult, { borderLeftColor: getStatusColor(result.status) }]}>
      <View style={styles.testHeader}>
        <Text style={styles.testEmoji}>{getStatusEmoji(result.status)}</Text>
        <Text style={styles.testTitle}>{result.service} - {result.test}</Text>
        <Text style={styles.testDuration}>{result.duration}ms</Text>
      </View>
      <Text style={[styles.testMessage, { color: getStatusColor(result.status) }]}>
        {result.message}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Integration Test Suite</Text>
        <Text style={styles.subtitle}>Test Frontend-Backend Connectivity</Text>
      </View>

      {/* Quick Connectivity Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Connectivity Test</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={runQuickConnectivityTest}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Backend Connection</Text>
        </TouchableOpacity>
        
        {isConnected !== null && (
          <View style={[styles.connectionStatus, { backgroundColor: isConnected ? '#E8F5E8' : '#FFEBEE' }]}>
            <Text style={[styles.connectionText, { color: isConnected ? '#4CAF50' : '#F44336' }]}>
              {isConnected ? '✅ Backend Connected' : '❌ Backend Disconnected'}
            </Text>
          </View>
        )}
      </View>

      {/* Full Integration Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Full Integration Test</Text>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={runFullIntegrationTest}
          disabled={isRunning}
        >
          {isRunning ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={[styles.buttonText, { marginLeft: 10 }]}>Running Tests...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Run Full Test Suite</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Test Results */}
      {testResults && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          
          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Tests:</Text>
              <Text style={styles.summaryValue}>{testResults.totalTests}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>✅ Passed:</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{testResults.passedTests}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>❌ Failed:</Text>
              <Text style={[styles.summaryValue, { color: '#F44336' }]}>{testResults.failedTests}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Success Rate:</Text>
              <Text style={styles.summaryValue}>
                {((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{testResults.duration}ms</Text>
            </View>
          </View>

          {/* Individual Results */}
          <View style={styles.resultsContainer}>
            {testResults.results.map((result, index) => renderTestResult(result, index))}
          </View>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instruction}>
          1. Make sure the backend server is running on localhost:5000
        </Text>
        <Text style={styles.instruction}>
          2. Run the quick connectivity test first
        </Text>
        <Text style={styles.instruction}>
          3. If connected, run the full test suite to verify all services
        </Text>
        <Text style={styles.instruction}>
          4. Check individual test results for any issues
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStatus: {
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summary: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  resultsContainer: {
    marginTop: 10,
  },
  testResult: {
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  testEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  testTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  testDuration: {
    fontSize: 12,
    color: '#999999',
  },
  testMessage: {
    fontSize: 12,
    marginLeft: 24,
  },
  instruction: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
    paddingLeft: 10,
  },
});

export default IntegrationTestScreen; 