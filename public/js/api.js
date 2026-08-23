/**
 * NexusSync AI - API Client
 * Handles all HTTP and WebSocket communication with the backend
 */

class APIClient {
  constructor() {
    this.baseUrl = CONFIG.API_BASE_URL;
    this.socket = null;
    this.eventHandlers = {};
    this.isConnected = false;
    this.initializeSocket();
  }

  /**
   * Initialize WebSocket connection
   */
  initializeSocket() {
    try {
      this.socket = io(CONFIG.WS_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.emit('connected', { message: 'Connected to NexusSync AI' });
        this.updateConnectionStatus(true);
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.emit('disconnected', { message: 'Disconnected from server' });
        this.updateConnectionStatus(false);
      });

      this.socket.on('agent_log', (log) => {
        this.emit('agent_log', log);
      });

      this.socket.on('extraction_complete', (result) => {
        this.emit('extraction_complete', result);
      });

      this.socket.on('pong', (data) => {
        this.emit('pong', data);
      });

    } catch (error) {
      console.error('WebSocket initialization failed:', error);
      this.isConnected = false;
      this.updateConnectionStatus(false);
    }
  }

  /**
   * Register event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  /**
   * Emit event to handlers
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  }

  /**
   * Update connection status in UI
   * @param {boolean} connected - Connection status
   */
  updateConnectionStatus(connected) {
    const statusElement = document.getElementById('apiStatus');
    if (statusElement) {
      const dot = statusElement.querySelector('.pulse-dot');
      const text = statusElement.querySelector('span:last-child');
      
      if (connected) {
        dot.style.backgroundColor = '#34D399';
        dot.style.boxShadow = '0 0 10px #34D399';
        text.textContent = 'Connected';
        text.style.color = '#34D399';
      } else {
        dot.style.backgroundColor = '#F87171';
        dot.style.boxShadow = '0 0 10px #F87171';
        text.textContent = 'Disconnected';
        text.style.color = '#F87171';
      }
    }
  }

  /**
   * Upload files to server
   * @param {Array<File>} files - Files to upload
   * @returns {Promise<Object>} Upload response
   */
  async uploadFiles(files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Extract data from documents
   * @param {Object} request - Extraction request
   * @returns {Promise<Object>} Extraction response
   */
  async extractData(request) {
    try {
      const response = await fetch(`${this.baseUrl}/api/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Extraction failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Extraction error:', error);
      throw error;
    }
  }

  /**
   * Validate entities
   * @param {Object} request - Validation request
   * @returns {Promise<Object>} Validation response
   */
  async validateEntities(request) {
    try {
      const response = await fetch(`${this.baseUrl}/api/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Validation error:', error);
      throw error;
    }
  }

  /**
   * Export data
   * @param {Object} request - Export request
   * @returns {Promise<Object>} Export response
   */
  async exportData(request) {
    try {
      const response = await fetch(`${this.baseUrl}/api/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  /**
   * Check API health
   * @returns {Promise<Object>} Health response
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  /**
   * Send ping via WebSocket
   */
  ping() {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
    }
  }
}

// Create global API instance
const api = new APIClient();