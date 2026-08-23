/**
 * NexusSync AI - Toast Notification System
 * Displays temporary notifications to users
 */

class ToastSystem {
  constructor() {
    this.container = null;
    this.toasts = [];
    this.maxToasts = 5;
    this.initialize();
  }

  /**
   * Initialize toast system
   */
  initialize() {
    this.container = document.getElementById('toastContainer');
    
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toastContainer';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, warning, error, info)
   * @param {number} duration - Display duration in ms
   */
  show(message, type = 'info', duration = CONFIG.UI.TOAST_DURATION) {
    const toast = {
      id: Utils.generateId('toast'),
      message,
      type,
      duration
    };
    
    this.toasts.push(toast);
    
    // Remove oldest toast if exceeding maximum
    if (this.toasts.length > this.maxToasts) {
      const oldestToast = this.toasts.shift();
      this.removeToast(oldestToast.id);
    }
    
    this.renderToast(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
      this.removeToast(toast.id);
    }, duration);
  }

  /**
   * Render a toast notification
   * @param {Object} toast - Toast object
   */
  renderToast(toast) {
    const toastElement = document.createElement('div');
    toastElement.className = `toast toast-${toast.type}`;
    toastElement.id = toast.id;
    toastElement.innerHTML = this.renderToastContent(toast);
    
    this.container.appendChild(toastElement);
    
    // Animate in
    requestAnimationFrame(() => {
      toastElement.style.opacity = '0';
      toastElement.style.transform = 'translateX(100%)';
      
      requestAnimationFrame(() => {
        toastElement.style.transition = 'all 0.3s ease-out';
        toastElement.style.opacity = '1';
        toastElement.style.transform = 'translateX(0)';
      });
    });
  }

  /**
   * Render toast content
   * @param {Object} toast - Toast object
   * @returns {string} Toast content HTML
   */
  renderToastContent(toast) {
    const icons = {
      success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F87171" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><path d="M12 16v-4M12 8h.01"/><circle cx="12" cy="12" r="10"/></svg>'
    };
    
    return `
      <div class="toast-icon">${icons[toast.type] || icons.info}</div>
      <div class="toast-content">
        <p>${Utils.escapeHtml(toast.message)}</p>
      </div>
      <button class="toast-close" onclick="window.toastSystem.removeToast('${toast.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    `;
  }

  /**
   * Remove a toast notification
   * @param {string} toastId - Toast ID to remove
   */
  removeToast(toastId) {
    const toastElement = document.getElementById(toastId);
    
    if (toastElement) {
      toastElement.style.opacity = '0';
      toastElement.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        toastElement.remove();
      }, 300);
    }
    
    this.toasts = this.toasts.filter(t => t.id !== toastId);
  }

  /**
   * Clear all toasts
   */
  clearAll() {
    this.toasts.forEach(toast => this.removeToast(toast.id));
  }
}

// Initialize toast system
document.addEventListener('DOMContentLoaded', () => {
  window.toastSystem = new ToastSystem();
});