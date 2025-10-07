// Settings page functionality for Co-Founders Outreach
// This script handles the interactive elements for the settings page

document.addEventListener('DOMContentLoaded', () => {
  // Initialize settings page
  initializeSettings();

  // Set up event listeners
  setupEventListeners();
});

// Initialize settings page
function initializeSettings() {
  // Load user settings from backend/storage
  loadUserSettings();

  // Set up settings navigation
  setupSettingsNavigation();
}

// Load user settings from backend/storage
async function loadUserSettings() {
  try {
    // In production, this would fetch real data from the backend via the Electron bridge
    // const userSettings = await window.api.getSettings();

    // For demo purposes, we'll use mock data
    const userSettings = getMockUserSettings();

    // Populate form fields with settings data
    populateSettingsForm(userSettings);

    console.log('Settings loaded successfully');
  } catch (error) {
    console.error('Failed to load settings:', error);
    showNotification('Error loading settings. Please try again.', 'error');
  }
}

// Set up settings navigation
function setupSettingsNavigation() {
  const navItems = document.querySelectorAll('.settings-nav-item');
  const panels = document.querySelectorAll('.settings-panel');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Get target panel ID
      const targetId = item.getAttribute('data-target');
      const targetPanel = document.getElementById(`${targetId}-panel`);

      // Remove active class from all items and panels
      navItems.forEach(navItem => navItem.classList.remove('active'));
      panels.forEach(panel => panel.classList.remove('active'));

      // Add active class to clicked item and target panel
      item.classList.add('active');
      if (targetPanel) {
        targetPanel.classList.add('active');
      } else {
        // If panel doesn't exist yet, show notification
        showNotification(`${targetId.charAt(0).toUpperCase() + targetId.slice(1)} settings would be shown here`, 'info');
      }
    });
  });
}

// Set up event listeners for interactive elements
function setupEventListeners() {
  // Navigation menu items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      // Get the text content of the nav item
      const section = item.querySelector('.nav-text').textContent;

      // Handle navigation based on section
      handleNavigation(section);
    });
  });

  // Form submission
  const accountForm = document.querySelector('#account-panel .settings-actions .btn-primary');
  if (accountForm) {
    accountForm.addEventListener('click', () => {
      saveAccountSettings();
    });
  }

  // Platform settings form
  const platformForm = document.querySelector('#platforms-panel .settings-actions .btn-primary');
  if (platformForm) {
    platformForm.addEventListener('click', () => {
      savePlatformSettings();
    });
  }

  // Window control buttons
  document.getElementById('minimize-btn').addEventListener('click', () => {
    if (window.api) {
      window.api.minimizeWindow();
    } else {
      console.log('Minimize window');
    }
  });

  document.getElementById('maximize-btn').addEventListener('click', () => {
    if (window.api) {
      window.api.maximizeWindow();
    } else {
      console.log('Maximize window');
    }
  });

  document.getElementById('close-btn').addEventListener('click', () => {
    if (window.api) {
      window.api.closeWindow();
    } else {
      console.log('Close window');
    }
  });
}

// Handle navigation between sections
function handleNavigation(section) {
  // In a real app, we would navigate to the selected section
  console.log(`Navigating to ${section}`);

  // For demo, just show a notification
  showNotification(`Navigating to ${section}...`, 'info');

  // Simulate navigation by redirecting to the appropriate page
  switch (section.toLowerCase()) {
    case 'dashboard':
      window.location.href = 'index.html';
      break;
    case 'messages':
      window.location.href = 'messages.html';
      break;
    case 'compose':
      window.location.href = 'compose.html';
      break;
    case 'analytics':
      window.location.href = 'analytics.html';
      break;
    case 'billing':
      window.location.href = 'billing.html';
      break;
    case 'settings':
      window.location.href = 'settings.html';
      break;
    default:
      // For other pages, just show notification
      showNotification(`${section} page would load here`, 'info');
  }
}

// Populate settings form with user data
function populateSettingsForm(settings) {
  // Account settings
  if (settings.account) {
    document.getElementById('fullName').value = settings.account.fullName;
    document.getElementById('email').value = settings.account.email;
    document.getElementById('role').value = settings.account.role;
    document.getElementById('hourlyRate').value = settings.account.hourlyRate;
    document.getElementById('timezone').value = settings.account.timezone;
    document.getElementById('twoFactorAuth').checked = settings.account.twoFactorAuth;
  }

  // Platform settings
  if (settings.platforms) {
    document.getElementById('starthawkEnabled').checked = settings.platforms.starthawk.enabled;
    document.getElementById('cofoundersEnabled').checked = settings.platforms.cofoundersLab.enabled;

    // Set radio buttons for account types
    if (settings.platforms.starthawk.accountType === 'free') {
      document.getElementById('starthawkFree').checked = true;
    } else {
      document.getElementById('starthawkPaid').checked = true;
    }

    if (settings.platforms.cofoundersLab.accountType === 'free') {
      document.getElementById('cofoundersFreee').checked = true;
    } else {
      document.getElementById('cofoundersPaid').checked = true;
    }
  }
}

// Save account settings
function saveAccountSettings() {
  // Get form values
  const settings = {
    fullName: document.getElementById('fullName').value,
    email: document.getElementById('email').value,
    role: document.getElementById('role').value,
    hourlyRate: document.getElementById('hourlyRate').value,
    timezone: document.getElementById('timezone').value,
    twoFactorAuth: document.getElementById('twoFactorAuth').checked
  };

  // Validate settings
  if (!settings.fullName || !settings.email) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }

  // In production, this would save to the backend via the Electron bridge
  // window.api.saveSettings({ account: settings });

  console.log('Saving account settings:', settings);
  showNotification('Account settings saved successfully', 'success');
}

// Save platform settings
function savePlatformSettings() {
  // Get form values
  const settings = {
    starthawk: {
      enabled: document.getElementById('starthawkEnabled').checked,
      accountType: document.getElementById('starthawkFree').checked ? 'free' : 'paid'
    },
    cofoundersLab: {
      enabled: document.getElementById('cofoundersEnabled').checked,
      accountType: document.getElementById('cofoundersFreee').checked ? 'free' : 'paid'
    }
  };

  // In production, this would save to the backend via the Electron bridge
  // window.api.saveSettings({ platforms: settings });

  console.log('Saving platform settings:', settings);
  showNotification('Platform settings saved successfully', 'success');
}

// Show notification to user
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Add to document
  document.body.appendChild(notification);

  // Position it
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.padding = '12px 20px';
  notification.style.borderRadius = '8px';
  notification.style.backgroundColor = type === 'error' ? '#ff6b6b' :
    type === 'success' ? '#00d68f' : '#3a86ff';
  notification.style.color = 'white';
  notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  notification.style.zIndex = '1000';
  notification.style.transition = 'all 0.3s ease';
  notification.style.opacity = '0';

  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
  }, 10);

  // Remove after delay
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Get mock user settings for demo
function getMockUserSettings() {
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


document.addEventListener("DOMContentLoaded", () => {
  const bellIcon = document.querySelector(".notification-icon");
  const dropdown = document.getElementById("notificationDropdown");
  const clearBtn = document.getElementById("clearNotifications");

  // Toggle dropdown
  bellIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.style.display =
      dropdown.style.display === "flex" ? "none" : "flex";
  });

  // Close when clicking outside
  document.addEventListener("click", () => {
    dropdown.style.display = "none";
  });

  // Prevent closing when clicking inside dropdown
  dropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Clear all notifications
  clearBtn.addEventListener("click", () => {
    const content = dropdown.querySelector(".dropdown-content");
    content.innerHTML = "<p style='padding:15px; text-align:center; color:#999;'>No new notifications</p>";
    // reset badge
    const badge = bellIcon.querySelector(".notification-badge");
    if (badge) badge.textContent = "0";
  });
});