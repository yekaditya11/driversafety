/**
 * Simple event bus for cross-component communication
 * Used to ensure dashboard updates when charts are added from chatbot
 */
class EventBus {
  constructor() {
    this.events = {};
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  // Unsubscribe from an event
  off(event, callback) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    
    // Clean up empty event arrays
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }

  // Emit an event
  emit(event, data) {
    console.log(`EventBus: Emitting event '${event}'`, data);
    
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`EventBus: Error in event handler for '${event}':`, error);
      }
    });
  }

  // Get all active events (for debugging)
  getActiveEvents() {
    return Object.keys(this.events);
  }

  // Get listener count for an event
  getListenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }

  // Clear all listeners for an event
  clearEvent(event) {
    delete this.events[event];
  }

  // Clear all events
  clearAll() {
    this.events = {};
  }
}

// Create singleton instance
const eventBus = new EventBus();

// Event constants
export const EVENTS = {
  CHART_ADDED: 'chart_added',
  CHART_REMOVED: 'chart_removed',
  CHARTS_UPDATED: 'charts_updated',
  DASHBOARD_REFRESH: 'dashboard_refresh'
};

export default eventBus;
