/**
 * Backend Integration Module for Co-Founders Outreach Dashboard
 * 
 * This module handles the communication between the Electron renderer process
 * and the backend server, providing real data for the dashboard UI.
 */

class BackendIntegration {
  constructor() {
    this.apiBase = 'http://localhost:3030/api';
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
  }

  /**
   * Initialize connection to backend
   */
  async initialize() {
    try {
      await this.checkConnection();
      console.log('Backend connection established');
      return true;
    } catch (error) {
      console.error('Failed to connect to backend:', error);
      return false;
    }
  }

  /**
   * Check connection to backend server
   */
  async checkConnection() {
    try {
      // In Electron environment, use the IPC bridge
      if (window.api) {
        const status = await window.api.checkBackendStatus();
        this.isConnected = status.running;
        return this.isConnected;
      }
      
      // Fallback to direct fetch for development
      const response = await fetch(`${this.apiBase}/health`);
      if (response.ok) {
        const data = await response.json();
        this.isConnected = data.status === 'ok';
        return this.isConnected;
      }
      
      throw new Error('Backend health check failed');
    } catch (error) {
      this.isConnected = false;
      this.connectionAttempts++;
      
      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        throw new Error('Maximum connection attempts reached');
      }
      
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.checkConnection();
    }
  }

  /**
   * Get analytics data from backend
   */
  async getAnalyticsData() {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      // In Electron environment, use the IPC bridge
      if (window.api) {
        return await window.api.getAnalyticsData();
      }
      
      // Fallback to direct fetch for development
      const response = await fetch(`${this.apiBase}/analytics/dashboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Fall back to mock data if backend is unavailable
      return this.getMockAnalyticsData();
    }
  }

  /**
   * Get user settings from backend
   */
  async getUserSettings() {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      // In Electron environment, use the IPC bridge
      if (window.api) {
        return await window.api.getSettings();
      }
      
      // Fallback to direct fetch for development
      const response = await fetch(`${this.apiBase}/settings`);
      if (!response.ok) {
        throw new Error('Failed to fetch user settings');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user settings:', error);
      // Fall back to mock data if backend is unavailable
      return this.getMockUserSettings();
    }
  }

  /**
   * Save user settings to backend
   */
  async saveUserSettings(settings) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      // In Electron environment, use the IPC bridge
      if (window.api) {
        return await window.api.saveSettings(settings);
      }
      
      // Fallback to direct fetch for development
      const response = await fetch(`${this.apiBase}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save user settings');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  }

  /**
   * Get recent messages from backend
   */
  async getRecentMessages() {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      // In Electron environment, use the IPC bridge
      if (window.api) {
        return await window.api.getMessages();
      }
      
      // Fallback to direct fetch for development
      const response = await fetch(`${this.apiBase}/messages/recent`);
      if (!response.ok) {
        throw new Error('Failed to fetch recent messages');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching recent messages:', error);
      // Fall back to mock data if backend is unavailable
      return this.getMockRecentMessages();
    }
  }

  /**
   * Get platform status from backend
   */
  async getPlatformStatus() {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      // In Electron environment, use the IPC bridge
      if (window.api) {
        return await window.api.getPlatformStatus();
      }
      
      // Fallback to direct fetch for development
      const response = await fetch(`${this.apiBase}/platforms/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch platform status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching platform status:', error);
      // Fall back to mock data if backend is unavailable
      return this.getMockPlatformStatus();
    }
  }

  /**
   * Get mock analytics data for fallback
   */
  getMockAnalyticsData() {
    return {
      messageStats: {
        sent: 304,
        responses: 156,
        responseRate: 51,
        unresponsiveRate: 28
      },
      platformPerformance: [
        { platform: 'StartHawk', sent: 180, responses: 92, rate: 51 },
        { platform: 'CoFoundersLab', sent: 124, responses: 64, rate: 52 }
      ],
      timeSaved: {
        hours: 42.5,
        moneySaved: '$2,125.00'
      },
      recentActivity: [
        { type: 'message', platform: 'StartHawk', recipient: 'John D.', time: '2 hours ago', status: 'sent' },
        { type: 'response', platform: 'CoFoundersLab', recipient: 'Sarah M.', time: '4 hours ago', status: 'received' },
        { type: 'follow-up', platform: 'StartHawk', recipient: 'Michael B.', time: '1 day ago', status: 'sent' }
      ],
      monthlyData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        sent: [45, 52, 68, 74, 83, 92],
        responses: [21, 25, 36, 38, 42, 51]
      }
    };
  }

  /**
   * Get mock user settings for fallback
   */
  getMockUserSettings() {
    return {
      account: {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        hourlyRate: 50,
        timezone: 'utc-5',
        twoFactorAuth: true
      },
      platforms: {
        starthawk: {
          enabled: true,
          accountType: 'paid',
          email: 'john.doe@example.com'
        },
        cofoundersLab: {
          enabled: true,
          accountType: 'paid',
          email: 'john.doe@example.com'
        }
      },
      messaging: {
        defaultTemplate: 'template1',
        followUpDays: 3,
        maxFollowUps: 2
      },
      notifications: {
        email: true,
        desktop: true,
        responses: true,
        followUps: true
      },
      appearance: {
        theme: 'dark',
        compactMode: false
      }
    };
  }

  /**
   * Get mock recent messages for fallback
   */
  getMockRecentMessages() {
    return [
      {
        id: 'm1',
        recipient: 'John Smith',
        platform: 'StartHawk',
        subject: 'Co-founder opportunity',
        preview: 'I noticed your profile and wanted to reach out about...',
        date: '2025-06-18T14:30:00Z',
        status: 'sent',
        hasResponse: false
      },
      {
        id: 'm2',
        recipient: 'Sarah Johnson',
        platform: 'CoFoundersLab',
        subject: 'Partnership discussion',
        preview: 'Thank you for your message. I would be interested in...',
        date: '2025-06-17T09:15:00Z',
        status: 'received',
        hasResponse: true
      },
      {
        id: 'm3',
        recipient: 'Michael Brown',
        platform: 'StartHawk',
        subject: 'Follow-up on our conversation',
        preview: 'I wanted to follow up on our previous discussion about...',
        date: '2025-06-16T16:45:00Z',
        status: 'sent',
        hasResponse: false
      }
    ];
  }

  /**
   * Get mock platform status for fallback
   */
  getMockPlatformStatus() {
    return {
      starthawk: {
        connected: true,
        lastSync: '2025-06-19T08:30:00Z',
        messageQuota: {
          daily: 50,
          used: 12,
          remaining: 38
        }
      },
      cofoundersLab: {
        connected: true,
        lastSync: '2025-06-19T08:35:00Z',
        messageQuota: {
          daily: 100,
          used: 24,
          remaining: 76
        }
      }
    };
  }
}

// Export the backend integration instance
const backendIntegration = new BackendIntegration();
