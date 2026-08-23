/**
 * NexusSync AI - Configuration Module
 * Central configuration for the entire application
 */

const CONFIG = {
  // API Configuration
  API_BASE_URL: window.location.origin,
  WS_URL: window.location.origin,
  
  // Groq Configuration
  GROQ_MODEL: 'llama-3.3-70b-versatile',
  GROQ_MAX_TOKENS: 6000,
  GROQ_TEMPERATURE: 0.2,
  
  // File Upload Configuration
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_EXTENSIONS: ['.pdf', '.txt', '.csv', '.xlsx', '.xls', '.docx', '.json', '.xml', '.md'],
  
  // Agent Configuration
  AGENTS: {
    EXTRACTION: {
      id: 'extraction',
      name: 'Extraction Agent',
      icon: '📄',
      color: '#38BDF8'
    },
    VALIDATION: {
      id: 'validation',
      name: 'Validation Agent',
      icon: '✅',
      color: '#34D399'
    },
    ENRICHMENT: {
      id: 'enrichment',
      name: 'Enrichment Agent',
      icon: '✨',
      color: '#818CF8'
    },
    ORCHESTRATOR: {
      id: 'orchestrator',
      name: 'Orchestrator',
      icon: '🎯',
      color: '#FBBF24'
    }
  },
  
  // Knowledge Graph Configuration
  GRAPH: {
    NODE_SIZE_MIN: 4,
    NODE_SIZE_MAX: 25,
    EDGE_WIDTH_MIN: 0.5,
    EDGE_WIDTH_MAX: 3,
    REPULSION_FORCE: 5000,
    ATTRACTION_FORCE: 0.01,
    CENTERING_FORCE: 0.001,
    MAX_DISPLACEMENT: 2,
    DAMPING: 0.85
  },
  
  // UI Configuration
  UI: {
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 4000,
    PARTICLE_COUNT: 50,
    MAX_VISIBLE_ENTITIES: 100,
    CONFIDENCE_THRESHOLDS: {
      HIGH: 0.85,
      MEDIUM: 0.60,
      LOW: 0.40
    }
  },
  
  // Schema Templates
  SCHEMAS: {
    INDUSTRIAL_PRODUCT: 'industrial_product',
    TECHNICAL_SPEC: 'technical_spec',
    COMMERCE_READY: 'commerce_ready'
  },
  
  // Export Formats
  EXPORT_FORMATS: {
    JSON: 'json',
    PIM: 'pim',
    CSV: 'csv'
  }
};

// Freeze configuration to prevent modification
Object.freeze(CONFIG);
Object.freeze(CONFIG.AGENTS);
Object.freeze(CONFIG.GRAPH);
Object.freeze(CONFIG.UI);
Object.freeze(CONFIG.SCHEMAS);
Object.freeze(CONFIG.EXPORT_FORMATS);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}