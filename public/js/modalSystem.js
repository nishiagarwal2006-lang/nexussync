/**
 * NexusSync AI - Modal System
 * Manages modal dialogs
 */

class ModalSystem {
  constructor() {
    this.modals = [];
    this.initialize();
  }

  /**
   * Initialize modal system
   */
  initialize() {
    this.container = document.getElementById('modalContainer');
    
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'modalContainer';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Show a modal
   * @param {Object} options - Modal options
   * @returns {string} Modal ID
   */
  show(options) {
    const modalId = Utils.generateId('modal');
    const modal = {
      id: modalId,
      ...options
    };
    
    this.modals.push(modal);
    this.renderModal(modal);
    
    return modalId;
  }

  /**
   * Render a modal
   * @param {Object} modal - Modal object
   */
  renderModal(modal) {
    const modalElement = document.createElement('div');
    modalElement.className = 'modal-overlay';
    modalElement.id = modal.id;
    
    modalElement.innerHTML = `
      <div class="modal glass-card">
        <div class="modal-header">
          <h3>${modal.title || 'Modal'}</h3>
          <button class="modal-close" onclick="window.modalSystem.close('${modal.id}')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-content">
          ${modal.content || ''}
        </div>
        ${modal.actions ? `
          <div class="modal-actions">
            ${modal.actions.map(action => `
              <button class="btn btn-${action.type || 'primary'}" onclick="${action.onclick}">
                ${action.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
    
    this.container.appendChild(modalElement);
    
    // Animate in
    requestAnimationFrame(() => {
      modalElement.style.opacity = '0';
      
      requestAnimationFrame(() => {
        modalElement.style.transition = 'opacity 0.3s ease-out';
        modalElement.style.opacity = '1';
      });
    });
    
    // Close on overlay click
    modalElement.addEventListener('click', (e) => {
      if (e.target === modalElement) {
        this.close(modal.id);
      }
    });
  }

  /**
   * Close a modal
   * @param {string} modalId - Modal ID to close
   */
  close(modalId) {
    const modalElement = document.getElementById(modalId);
    
    if (modalElement) {
      modalElement.style.opacity = '0';
      
      setTimeout(() => {
        modalElement.remove();
      }, 300);
    }
    
    this.modals = this.modals.filter(m => m.id !== modalId);
  }

  /**
   * Close all modals
   */
  closeAll() {
    this.modals.forEach(modal => this.close(modal.id));
  }

  /**
   * Show confirmation modal
   * @param {Object} options - Confirmation options
   * @returns {string} Modal ID
   */
  confirm(options) {
    const modalId = Utils.generateId('modal');
    
    this.show({
      id: modalId,
      title: options.title || 'Confirm',
      content: `<p>${options.message || 'Are you sure?'}</p>`,
      actions: [
        {
          label: options.cancelLabel || 'Cancel',
          type: 'ghost',
          onclick: `window.modalSystem.close('${modalId}')`
        },
        {
          label: options.confirmLabel || 'Confirm',
          type: options.confirmType || 'primary',
          onclick: options.onConfirm || `window.modalSystem.close('${modalId}')`
        }
      ]
    });
    
    return modalId;
  }

  /**
   * Show alert modal
   * @param {Object} options - Alert options
   * @returns {string} Modal ID
   */
  alert(options) {
    const modalId = Utils.generateId('modal');
    
    this.show({
      id: modalId,
      title: options.title || 'Alert',
      content: `<p>${options.message || ''}</p>`,
      actions: [
        {
          label: options.buttonLabel || 'OK',
          type: 'primary',
          onclick: `window.modalSystem.close('${modalId}')`
        }
      ]
    });
    
    return modalId;
  }
}

// Initialize modal system
document.addEventListener('DOMContentLoaded', () => {
  window.modalSystem = new ModalSystem();
});