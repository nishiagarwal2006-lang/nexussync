/**
 * NexusSync AI - Utility Functions
 * Common helper functions used across the application
 */

class Utils {
  /**
   * Generate a unique ID
   * @param {string} prefix - ID prefix
   * @returns {string} Unique identifier
   */
  static generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format a date string
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date
   */
  static formatDate(date) {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Format file size
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  static truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Get confidence color
   * @param {number} confidence - Confidence score (0-1)
   * @returns {string} Color hex code
   */
  static getConfidenceColor(confidence) {
    if (confidence >= 0.85) return '#34D399';
    if (confidence >= 0.60) return '#38BDF8';
    if (confidence >= 0.40) return '#FBBF24';
    return '#F87171';
  }

  /**
   * Get validation status color
   * @param {string} status - Validation status
   * @returns {string} Color hex code
   */
  static getValidationColor(status) {
    const colors = {
      'approved': '#34D399',
      'auto_validated': '#38BDF8',
      'needs_review': '#FBBF24',
      'pending': '#A78BFA',
      'rejected': '#F87171'
    };
    return colors[status] || '#38BDF8';
  }

  /**
   * Get confidence level
   * @param {number} confidence - Confidence score
   * @returns {string} Confidence level
   */
  static getConfidenceLevel(confidence) {
    if (confidence >= 0.85) return 'High';
    if (confidence >= 0.60) return 'Medium';
    if (confidence >= 0.40) return 'Low';
    return 'Very Low';
  }

  /**
   * Deep clone an object
   * @param {*} obj - Object to clone
   * @returns {*} Cloned object
   */
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Debounce function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} Debounced function
   */
  static debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in ms
   * @returns {Function} Throttled function
   */
  static throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Calculate average
   * @param {Array<number>} numbers - Array of numbers
   * @returns {number} Average
   */
  static average(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  /**
   * Check if value is numeric
   * @param {*} value - Value to check
   * @returns {boolean} Whether value is numeric
   */
  static isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  /**
   * Escape HTML string
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  static escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Parse file extension
   * @param {string} fileName - File name
   * @returns {string} File extension
   */
  static getFileExtension(fileName) {
    return fileName.split('.').pop().toLowerCase();
  }

  /**
   * Check if file type is allowed
   * @param {string} fileName - File name
   * @returns {boolean} Whether file is allowed
   */
  static isAllowedFile(fileName) {
    const ext = '.' + this.getFileExtension(fileName);
    return CONFIG.ALLOWED_EXTENSIONS.includes(ext);
  }

  /**
   * Download data as file
   * @param {string} data - Data to download
   * @param {string} fileName - File name
   * @param {string} mimeType - MIME type
   */
  static downloadFile(data, fileName, mimeType = 'application/json') {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}