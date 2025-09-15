// Dashboard functionality for Co-Founders Outreach
// This script handles the interactive elements for the dashboard

document.addEventListener('DOMContentLoaded', () => {
  // Initialize dashboard
  initializeDashboard();
  
  // Set up event listeners
  setupEventListeners();
});

// Initialize dashboard
async function initializeDashboard() {
  // Set up navigation
  setupNavigation();
  
  // Set up window controls
  setupWindowControls();
}

// Set up navigation
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Get the text content of the nav item
      const section = item.querySelector('.nav-text').textContent;
      
      // Handle navigation based on section
      handleNavigation(section);
    });
  });
}

// Handle navigation between sections
function handleNavigation(section) {
  // In a real app, we would navigate to the selected section
  console.log(`Navigating to ${section}`);
  
  // For demo, just show a notification
  if (section.toLowerCase() !== 'dashboard') {
    showNotification(`Navigating to ${section}...`, 'info');
    
    // Simulate navigation by redirecting to the appropriate page
    switch (section.toLowerCase()) {
      case 'settings':
        window.location.href = 'settings.html';
        break;
      default:
        // For other pages, just show notification
        showNotification(`${section} page would load`, 'info');
    }
  }
}

// Set up window controls for Electron
function setupWindowControls() {
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');
  
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      if (window.api) {
        window.api.minimizeWindow();
      } else {
        console.log('Minimize window');
      }
    });
  }
  
  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', () => {
      if (window.api) {
        window.api.maximizeWindow();
      } else {
        console.log('Maximize window');
      }
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (window.api) {
        window.api.closeWindow();
      } else {
        console.log('Close window');
      }
    });
  }
}

// Set up event listeners for interactive elements
function setupEventListeners() {
  // Notification icon
  const notificationIcon = document.querySelector('.notification-icon');
  if (notificationIcon) {
    notificationIcon.addEventListener('click', () => {
      showNotification('You have 3 new notifications', 'info');
    });
  }
  
  // Search input
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        showNotification(`Searching for: ${searchInput.value}`, 'info');
        searchInput.value = '';
      }
    });
  }
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
