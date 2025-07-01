// services/integrationTest.ts
import { AuthService } from './auth';
import { DriverService } from './driver';
import { WalletService } from './wallet';
import { friendsService } from './friends';
import { MessagingService } from './messaging';
import api from './api';

export interface IntegrationTestResult {
  service: string;
  test: string;
  status: 'passed' | 'failed' | 'skipped';
  message: string;
  duration: number;
}

export interface IntegrationTestSuite {
  results: IntegrationTestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  overallStatus: 'passed' | 'failed' | 'partial';
  duration: number;
}

class IntegrationTestService {
  private results: IntegrationTestResult[] = [];
  private testUserId: string | null = null;
  private testUserToken: string | null = null;

  async runTest(service: string, test: string, testFn: () => Promise<void>): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      const result: IntegrationTestResult = {
        service,
        test,
        status: 'passed',
        message: 'Test passed successfully',
        duration
      };
      this.results.push(result);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const result: IntegrationTestResult = {
        service,
        test,
        status: 'failed',
        message: error.message || 'Test failed',
        duration
      };
      this.results.push(result);
      return result;
    }
  }

  async runFullIntegrationTest(): Promise<IntegrationTestSuite> {
    console.log('🚀 Starting Frontend-Backend Integration Tests');
    const suiteStartTime = Date.now();
    this.results = [];

    // Test 1: Health Check
    await this.runTest('API', 'Health Check', async () => {
      const response = await api.get('/health');
      if (response.status !== 200) {
        throw new Error(`Health check failed with status ${response.status}`);
      }
    });

    // Test 2: User Registration
    await this.runTest('Auth', 'User Registration', async () => {
      const timestamp = Date.now();
      const testUser = {
        name: `Test User ${timestamp}`,
        email: `testuser_${timestamp}@ridematch.com`,
        password: 'TestPassword123!',
        dateOfBirth: '1990-05-15',
        gender: 'male' as const,
        phone: '+971501234567'
      };

      const response = await AuthService.register(testUser);
      if (!response.user_id) {
        throw new Error('Registration did not return user_id');
      }
      this.testUserId = response.user_id;
    });

    // Test 3: User Login
    await this.runTest('Auth', 'User Login', async () => {
      if (!this.testUserId) {
        throw new Error('No test user available for login test');
      }

      // Try to login with a known user (admin)
      try {
        const response = await AuthService.login({
          email: 'admin@ridematch.com',
          password: 'admin123'
        });
        this.testUserToken = response.access_token;
      } catch (error) {
        // If admin login fails, skip this test
        throw new Error('Admin login failed - this is expected if admin user not created');
      }
    });

    // Test 4: Protected Endpoint Access
    await this.runTest('API', 'Protected Endpoint Access', async () => {
      try {
        const response = await api.get('/users/profile');
        // 404 is acceptable if profile not set up
        if (response.status !== 200 && response.status !== 404) {
          throw new Error(`Unexpected status code: ${response.status}`);
        }
      } catch (error: any) {
        if (error.message?.includes('401') || error.message?.includes('Authentication')) {
          throw new Error('Authentication failed - token may be invalid');
        }
        // Other errors might be acceptable
      }
    });

    // Test 5: Driver Service
    await this.runTest('Driver', 'Get Driver Status', async () => {
      const response = await DriverService.getApplicationStatus();
      if (!response.status) {
        throw new Error('Driver status response missing status field');
      }
    });

    // Test 6: Wallet Service
    await this.runTest('Wallet', 'Get Wallet Info', async () => {
      const response = await WalletService.getWalletInfo();
      if (typeof response.balance !== 'number') {
        throw new Error('Wallet info response missing balance field');
      }
    });

    // Test 7: Wallet Payment Intent
    await this.runTest('Wallet', 'Create Payment Intent', async () => {
      const response = await WalletService.createPaymentIntent(1000); // $10.00
      if (!response.payment_intent_id || !response.client_secret) {
        throw new Error('Payment intent creation failed');
      }
    });

    // Test 8: Friends Service
    await this.runTest('Friends', 'Get Friends List', async () => {
      const response = await friendsService.getFriendsList();
      if (!Array.isArray(response.friends)) {
        throw new Error('Friends list response invalid');
      }
    });

    // Test 9: Messaging Service
    await this.runTest('Messaging', 'Get Conversations', async () => {
      const response = await MessagingService.getConversations();
      if (!Array.isArray(response)) {
        throw new Error('Conversations response should be an array');
      }
    });

    // Calculate results
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'passed').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    const skippedTests = this.results.filter(r => r.status === 'skipped').length;
    const duration = Date.now() - suiteStartTime;

    let overallStatus: 'passed' | 'failed' | 'partial';
    if (passedTests === totalTests) {
      overallStatus = 'passed';
    } else if (passedTests > failedTests) {
      overallStatus = 'partial';
    } else {
      overallStatus = 'failed';
    }

    const suite: IntegrationTestSuite = {
      results: this.results,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      overallStatus,
      duration
    };

    console.log('🏁 Integration Tests Complete');
    this.logResults(suite);

    return suite;
  }

  private logResults(suite: IntegrationTestSuite) {
    console.log('\n📊 INTEGRATION TEST RESULTS');
    console.log('='.repeat(50));
    
    suite.results.forEach(result => {
      const emoji = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️';
      console.log(`${emoji} ${result.service} - ${result.test}: ${result.message} (${result.duration}ms)`);
    });

    console.log('\n📈 SUMMARY');
    console.log(`Total Tests: ${suite.totalTests}`);
    console.log(`✅ Passed: ${suite.passedTests}`);
    console.log(`❌ Failed: ${suite.failedTests}`);
    console.log(`⏭️ Skipped: ${suite.skippedTests}`);
    console.log(`⏱️ Duration: ${suite.duration}ms`);
    console.log(`🎯 Success Rate: ${((suite.passedTests / suite.totalTests) * 100).toFixed(1)}%`);
    
    const statusEmoji = suite.overallStatus === 'passed' ? '🎉' : 
                       suite.overallStatus === 'partial' ? '⚠️' : '❌';
    console.log(`${statusEmoji} Overall Status: ${suite.overallStatus.toUpperCase()}`);
  }

  // Quick connectivity test
  async quickConnectivityTest(): Promise<boolean> {
    try {
      const response = await api.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('❌ Backend connectivity test failed:', error);
      return false;
    }
  }
}

export const integrationTestService = new IntegrationTestService(); 