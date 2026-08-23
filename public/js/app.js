/**
 * NexusSync AI - Application Entry Point
 * Initializes all modules and manages application lifecycle
 */

class App {
  constructor() {
    this.modules = {};
    this.initialized = false;
  }

  /**
   * Initialize application
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('🚀 Initializing NexusSync AI...');
    
    try {
      await this.initializeModules();
      this.initialized = true;
      console.log('✅ NexusSync AI initialized successfully');
      
      // Check API health
      this.checkApiHealth();
      
      // Start WebSocket ping
      this.startHeartbeat();
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      this.showInitializationError(error);
    }
  }

  /**
   * Initialize all modules
   */
  async initializeModules() {
    const moduleClasses = [
      { name: 'toastSystem', Class: ToastSystem },
      { name: 'modalSystem', Class: ModalSystem },
      { name: 'validation', Class: ValidationModule },
      { name: 'schemaValidator', Class: SchemaValidator },
      { name: 'knowledgeGraph', Class: KnowledgeGraph },
      { name: 'dashboard', Class: Dashboard },
      { name: 'landingPage', Class: LandingPage }
    ];
    
    moduleClasses.forEach(({ name, Class }) => {
      try {
        if (Class) {
          window[name] = new Class();
          this.modules[name] = window[name];
          console.log(`  ✓ ${name} initialized`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to initialize ${name}:`, error);
      }
    });
    
    // Check for other modules that might exist as singletons
    const singletonModules = [
      'api', 'Utils', 'Config', 'Types'
    ];
    
    singletonModules.forEach(moduleName => {
      if (window[moduleName]) {
        this.modules[moduleName] = window[moduleName];
        console.log(`  ✓ ${moduleName} available`);
      }
    });
  }

  /**
   * Check API health
   */
  async checkApiHealth() {
    try {
      const health = await api.checkHealth();
      console.log('API Health:', health);
      
      if (health.groq_configured) {
        if (window.toastSystem) {
          window.toastSystem.show('Groq API connected', 'success');
        }
      } else {
        console.warn('Groq API not configured - using mock mode');
        if (window.toastSystem) {
          window.toastSystem.show('Running in mock mode (no Groq API key)', 'warning');
        }
      }
    } catch (error) {
      console.warn('API health check failed:', error);
    }
  }

  /**
   * Start heartbeat for WebSocket
   */
  startHeartbeat() {
    setInterval(() => {
      if (api.isConnected) {
        api.ping();
      }
    }, 30000);
  }

  /**
   * Show initialization error
   * @param {Error} error - Error object
   */
  showInitializationError(error) {
    const errorMessage = `
      <div class="init-error">
        <h2>Initialization Error</h2>
        <p>${Utils.escapeHtml(error.message)}</p>
        <p>Please refresh the page or check the console for details.</p>
      </div>
    `;
    
    document.body.innerHTML = errorMessage;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.initialize();
});

// Handle errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Handle unhandled promises
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});