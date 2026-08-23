/**
 * NexusSync AI - Dashboard Controller
 * Main dashboard logic and state management
 */

class Dashboard {
  constructor() {
    this.state = {
      currentTab: 'overview',
      uploadedFiles: [],
      extractedEntities: [],
      knowledgeGraph: null,
      agentLogs: [],
      validationResults: [],
      isProcessing: false,
      selectedEntity: null,
      filters: {
        status: 'all',
        confidence: 'all',
        search: ''
      }
    };
    
    this.elements = {};
    this.initialize();
  }

  /**
   * Initialize dashboard
   */
  initialize() {
    this.cacheElements();
    this.initializeTabs();
    this.initializeEventListeners();
    this.initializeWebSocket();
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      tabs: document.querySelectorAll('.tab-btn'),
      tabContents: document.querySelectorAll('.tab-content'),
      dropZone: document.getElementById('dropZone'),
      fileInput: document.getElementById('fileInput'),
      uploadedFiles: document.getElementById('uploadedFiles'),
      activityFeed: document.getElementById('activityFeed'),
      extractionResults: document.getElementById('extractionResults'),
      extractionContent: document.getElementById('extractionContent'),
      validationContent: document.getElementById('validationContent'),
      exportContent: document.getElementById('exportContent'),
      confidenceRings: document.getElementById('confidenceRings'),
      knowledgeGraph: document.getElementById('knowledgeGraph'),
      statsGrid: document.getElementById('statsGrid'),
      processingIndicator: document.getElementById('processingIndicator'),
      totalEntities: document.getElementById('totalEntities'),
      approvedCount: document.getElementById('approvedCount'),
      needsReviewCount: document.getElementById('needsReviewCount'),
      rejectedCount: document.getElementById('rejectedCount')
    };
  }

  /**
   * Initialize tab switching
   */
  initializeTabs() {
    this.elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });
  }

  /**
   * Initialize event listeners
   */
  initializeEventListeners() {
    // Additional listeners can be registered here
  }

  /**
   * Initialize WebSocket event handlers
   */
  initializeWebSocket() {
    if (window.api && typeof api.on === 'function') {
      api.on('agent_log', (log) => {
        this.addAgentLog(log);
      });
      
      api.on('extraction_complete', (result) => {
        this.handleExtractionComplete(result);
      });
    }
  }

  /**
   * Switch active tab
   * @param {string} tabName - Tab name to switch to
   */
  switchTab(tabName) {
    this.state.currentTab = tabName;
    
    // Update tab buttons
    this.elements.tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update tab content
    const tabIdMap = {
      'overview': 'tabOverview',
      'extraction': 'tabExtraction',
      'graph': 'tabGraph',
      'validation': 'tabValidation',
      'export': 'tabExport'
    };
    
    this.elements.tabContents.forEach(content => {
      if (content.id === tabIdMap[tabName]) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
    
    // Re-render tab-specific views upon switching
    if (tabName === 'graph') {
      setTimeout(() => {
        if (window.knowledgeGraph) {
          if (!window.knowledgeGraph.initialized) {
            window.knowledgeGraph.initialize();
          }
          window.knowledgeGraph.resizeCanvas();
          if (this.state.knowledgeGraph) {
            this.renderKnowledgeGraph();
          }
        }
      }, 100);
    } else if (tabName === 'extraction') {
      this.renderExtractionTab();
    } else if (tabName === 'validation') {
      this.renderValidationTab();
    } else if (tabName === 'export') {
      this.renderExportTab();
    }
  }

  /**
   * Capitalize first letter
   */
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Add agent log entry
   */
  addAgentLog(log) {
    this.state.agentLogs.push(log);
    
    if (window.activityFeed) {
      window.activityFeed.addLog(log);
    }
  }

  /**
   * Handle extraction complete
   */
  handleExtractionComplete(result) {
    this.state.isProcessing = false;
    this.state.extractedEntities = result.entities || [];
    this.state.knowledgeGraph = result.knowledgeGraph || null;
    this.state.validationResults = [];
    
    this.updateStats();
    this.renderExtractionResults();
    this.renderExtractionTab();
    this.renderConfidenceRings();
    this.renderKnowledgeGraph();
    this.renderValidationTab();
    this.renderExportTab();
    
    if (window.toastSystem) {
      window.toastSystem.show(`Extraction complete: ${result.entities?.length || 0} entities found`, 'success');
    }
    
    this.hideProcessingIndicator();
  }

  /**
   * Update statistics display
   */
  updateStats() {
    const entities = this.state.extractedEntities;
    const total = entities.length;
    const approved = entities.filter(e => e.validation_status === 'approved').length;
    const needsReview = entities.filter(e => e.validation_status === 'needs_review').length;
    const rejected = entities.filter(e => e.validation_status === 'rejected').length;
    
    if (this.elements.totalEntities) this.elements.totalEntities.textContent = total;
    if (this.elements.approvedCount) this.elements.approvedCount.textContent = approved;
    if (this.elements.needsReviewCount) this.elements.needsReviewCount.textContent = needsReview;
    if (this.elements.rejectedCount) this.elements.rejectedCount.textContent = rejected;
  }

  /**
   * Render extraction results on the Overview tab
   */
  renderExtractionResults() {
    const container = this.elements.extractionResults;
    if (!container) return;
    
    if (this.state.extractedEntities.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4B5563" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
          </svg>
          <p>Upload documents or load sample data to begin</p>
          <button class="btn btn-outline btn-sm" onclick="loadSampleData()">Load Sample Data</button>
        </div>
      `;
      return;
    }
    
    if (window.extraction) {
      window.extraction.renderResults(container, this.state.extractedEntities);
    }
  }

  /**
   * Render extraction results on the Extraction tab
   */
  renderExtractionTab() {
    const container = document.getElementById('extractionContent');
    if (!container) return;
    
    if (this.state.extractedEntities.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4B5563" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          <p>Upload documents to begin extraction</p>
          <button class="btn btn-primary btn-sm" onclick="loadSampleData()">Load Sample Data</button>
        </div>
      `;
      return;
    }
    
    if (window.extraction) {
      window.extraction.renderResults(container, this.state.extractedEntities);
    }
  }

  /**
   * Render confidence rings in the right panel
   */
  renderConfidenceRings() {
    const container = this.elements.confidenceRings;
    if (!container) return;
    
    if (this.state.extractedEntities.length === 0) {
      container.innerHTML = '<p class="text-muted">No data available</p>';
      return;
    }
    
    if (window.confidenceRing) {
      window.confidenceRing.renderRings(container, this.state.extractedEntities.slice(0, 6));
    }
  }

  /**
   * Render knowledge graph
   */
  renderKnowledgeGraph() {
    if (!this.state.knowledgeGraph || !window.knowledgeGraph) return;
    
    const canvas = document.getElementById('knowledgeGraph');
    if (canvas) {
      window.knowledgeGraph.render(canvas, this.state.knowledgeGraph);
    }
  }

  /**
   * Render validation tab content
   */
  renderValidationTab() {
    const container = document.getElementById('validationContent');
    if (!container) return;
    
    if (this.state.extractedEntities.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4B5563" stroke-width="1.5">
            <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <p>Process data first to validate</p>
          <button class="btn btn-primary btn-sm" onclick="runValidation()">Run Validation</button>
        </div>
      `;
      return;
    }
    
    // If validation results exist, render them
    if (this.state.validationResults && this.state.validationResults.length > 0 && window.validation) {
      window.validation.renderResults(container, this.state.validationResults);
    } else {
      // Pre-validation state
      container.innerHTML = `
        <div class="validation-summary-card glass-card" style="padding: 1.5rem; text-align: center;">
          <h3 style="margin-bottom: 0.5rem;">Validation Ready</h3>
          <p style="color: var(--color-text-muted); margin-bottom: 1.25rem;">
            ${this.state.extractedEntities.length} entities loaded and ready to validate against schemas.
          </p>
          <button class="btn btn-primary btn-sm" onclick="runValidation()">
            Run Validation Now
          </button>
        </div>
      `;
    }
  }

  /**
   * Render export tab content
   */
  renderExportTab() {
    const container = document.getElementById('exportContent');
    if (!container) return;
    
    if (this.state.extractedEntities.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4B5563" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          <p>No data to export yet</p>
          <button class="btn btn-primary btn-sm" onclick="loadSampleData()">Load Sample Data</button>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="export-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem;">
        <div class="export-card glass-card" style="padding: 1.5rem; text-align: center;">
          <h4>JSON Format</h4>
          <p style="color: var(--color-text-muted); font-size: 0.875rem; margin: 0.75rem 0 1.25rem;">
            Structured JSON with all entities, attributes, and source citations.
          </p>
          <button class="btn btn-primary btn-sm w-full" onclick="exportData('json')">
            Export JSON
          </button>
        </div>
        
        <div class="export-card glass-card" style="padding: 1.5rem; text-align: center;">
          <h4>CSV Spreadsheet</h4>
          <p style="color: var(--color-text-muted); font-size: 0.875rem; margin: 0.75rem 0 1.25rem;">
            Tabular format suitable for Excel, Google Sheets, or ERP imports.
          </p>
          <button class="btn btn-outline btn-sm w-full" onclick="exportData('csv')">
            Export CSV
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Show processing indicator
   */
  showProcessingIndicator() {
    this.state.isProcessing = true;
    if (this.elements.processingIndicator) {
      this.elements.processingIndicator.classList.remove('hidden');
    }
  }

  /**
   * Hide processing indicator
   */
  hideProcessingIndicator() {
    this.state.isProcessing = false;
    if (this.elements.processingIndicator) {
      this.elements.processingIndicator.classList.add('hidden');
    }
  }

  /**
   * Set selected entity
   */
  setSelectedEntity(entity) {
    this.state.selectedEntity = entity;
    
    if (window.diffViewer && entity) {
      window.diffViewer.showDiff(entity);
    }
  }

  /**
   * Run validation on extracted entities
   */
  async runValidation() {
    if (this.state.extractedEntities.length === 0) {
      if (window.toastSystem) {
        window.toastSystem.show('No entities to validate', 'warning');
      }
      return;
    }
    
    this.showProcessingIndicator();
    
    try {
      if (window.validation) {
        const validationOutput = window.validation.validateEntities(this.state.extractedEntities);
        this.state.validationResults = validationOutput.results || [];
      } else if (window.api && typeof api.validateEntities === 'function') {
        const result = await api.validateEntities({
          entities: this.state.extractedEntities
        });
        if (result && result.entities) {
          this.state.extractedEntities = result.entities;
        }
      }
      
      this.updateStats();
      this.renderExtractionResults();
      this.renderExtractionTab();
      this.renderValidationTab();
      
      if (window.toastSystem) {
        window.toastSystem.show('Validation complete', 'success');
      }
    } catch (error) {
      console.error('Validation failed:', error);
      if (window.toastSystem) {
        window.toastSystem.show('Validation failed: ' + error.message, 'error');
      }
    } finally {
      this.hideProcessingIndicator();
    }
  }

  /**
   * Export data
   */
  async exportData(format) {
    if (this.state.extractedEntities.length === 0) {
      if (window.toastSystem) {
        window.toastSystem.show('No data to export', 'warning');
      }
      return;
    }
    
    try {
      if (window.exportManager && typeof window.exportManager.export === 'function') {
        window.exportManager.export(this.state.extractedEntities, format);
      } else if (window.api && typeof api.exportData === 'function') {
        const result = await api.exportData({
          entities: this.state.extractedEntities,
          format: format,
          includeCitations: true
        });
        
        if (result && result.success && window.Utils) {
          Utils.downloadFile(result.data, result.fileName, result.mimeType);
        } else {
          this.clientExport(format);
        }
      } else {
        this.clientExport(format);
      }
      
      if (window.toastSystem) {
        window.toastSystem.show(`Exported ${format.toUpperCase()} successfully`, 'success');
      }
    } catch (error) {
      console.warn('API export failed, using client fallback:', error);
      this.clientExport(format);
    }
  }

  /**
   * Client-side fallback export
   */
  clientExport(format) {
    const data = this.state.extractedEntities;
    let content = '';
    let mimeType = 'text/plain';
    let fileName = `nexussync-export-${Date.now()}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
    } else if (format === 'csv') {
      mimeType = 'text/csv';
      const rows = [['Entity Name', 'Type', 'Confidence', 'Status', 'Attribute Key', 'Attribute Value', 'Unit']];
      data.forEach(e => {
        (e.attributes || []).forEach(a => {
          rows.push([
            `"${(e.name || '').replace(/"/g, '""')}"`,
            `"${(e.entity_type || '').replace(/"/g, '""')}"`,
            (e.confidence_score || 0).toFixed(2),
            `"${(e.validation_status || '').replace(/"/g, '""')}"`,
            `"${(a.key || '').replace(/"/g, '""')}"`,
            `"${String(a.value || '').replace(/"/g, '""')}"`,
            `"${(a.unit || '').replace(/"/g, '""')}"`
          ]);
        });
      });
      content = rows.map(r => r.join(',')).join('\n');
    }

    if (window.Utils && typeof Utils.downloadFile === 'function') {
      Utils.downloadFile(content, fileName, mimeType);
    } else {
      const blob = new Blob([content], { type: mimeType });
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
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});

// Global functions for HTML onclick handlers
function runValidation() {
  if (window.dashboard) {
    window.dashboard.runValidation();
  }
}

function exportData(format) {
  if (window.dashboard) {
    window.dashboard.exportData(format);
  }
}

function zoomIn() {
  if (window.knowledgeGraph) {
    window.knowledgeGraph.zoomIn();
  }
}

function zoomOut() {
  if (window.knowledgeGraph) {
    window.knowledgeGraph.zoomOut();
  }
}

function resetGraph() {
  if (window.knowledgeGraph) {
    window.knowledgeGraph.resetView();
  }
}