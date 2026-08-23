/**
 * NexusSync AI - Extraction Module
 * Handles entity extraction and interactive workspace rendering
 */

class ExtractionModule {
  constructor() {
    this.entities = [];
    this.expandedEntities = new Set();
    this.filterState = {
      search: '',
      status: 'all',
      confidence: 'all'
    };
    this.initialize();
  }

  /**
   * Initialize extraction module
   */
  initialize() {
    // Entity card expand/collapse handler
    document.addEventListener('click', (e) => {
      const header = e.target.closest('.entity-clickable-header');
      if (header) {
        const card = header.closest('.entity-card');
        if (card && card.dataset.entityId) {
          this.toggleEntity(card.dataset.entityId);
        }
      }
    });
  }

  /**
   * Toggle entity card expansion
   */
  toggleEntity(entityId) {
    if (this.expandedEntities.has(entityId)) {
      this.expandedEntities.delete(entityId);
    } else {
      this.expandedEntities.add(entityId);
    }
    
    // Re-render extraction view
    const container = document.getElementById('extractionContent') || document.getElementById('extractionResults');
    this.renderResults(container, this.entities);
  }

  /**
   * Render results into target container
   */
  renderResults(container, entities) {
    if (!container) return;
    this.entities = entities || [];
    
    if (this.entities.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4B5563" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          <p>No extraction data available. Upload documents or load sample data to begin.</p>
          <button class="btn btn-primary btn-sm" onclick="loadSampleData()">Load Sample Data</button>
        </div>
      `;
      return;
    }
    
    const isExtractionTab = container.id === 'extractionContent';
    const filtered = this.filterEntities(this.filterState);
    
    let toolbarHtml = '';
    if (isExtractionTab) {
      toolbarHtml = `
        <div class="extraction-workspace-toolbar glass-card">
          <div class="toolbar-search-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" id="extractionSearchInput" class="toolbar-input" placeholder="Search entities or attributes..." value="${Utils.escapeHtml(this.filterState.search)}" oninput="window.extraction.handleSearch(this.value)">
          </div>
          
          <div class="toolbar-filters">
            <select class="toolbar-select" onchange="window.extraction.handleStatusFilter(this.value)">
              <option value="all" ${this.filterState.status === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="approved" ${this.filterState.status === 'approved' ? 'selected' : ''}>Approved</option>
              <option value="needs_review" ${this.filterState.status === 'needs_review' ? 'selected' : ''}>Needs Review</option>
            </select>
            
            <button class="btn btn-primary btn-sm" onclick="exportData('json')">Export JSON</button>
            <button class="btn btn-outline btn-sm" onclick="exportData('csv')">Export CSV</button>
          </div>
        </div>
      `;
    }
    
    const cardsHtml = filtered.map((entity, index) => this.renderEntityCard(entity, index, isExtractionTab)).join('');
    
    container.innerHTML = `
      <div class="extraction-workspace">
        ${toolbarHtml}
        <div class="entities-list">
          ${filtered.length > 0 ? cardsHtml : '<p class="text-muted text-center" style="padding: 2rem;">No entities match the current filters.</p>'}
        </div>
      </div>
    `;
  }

  /**
   * Render single entity card
   */
  renderEntityCard(entity, index, isDetailed = true) {
    const isExpanded = this.expandedEntities.has(entity.id) || !isDetailed;
    const confidenceColor = Utils.getConfidenceColor(entity.confidence_score || 0.85);
    const statusColor = Utils.getValidationColor ? Utils.getValidationColor(entity.validation_status) : '#34D399';
    
    return `
      <div class="entity-card glass-card ${isExpanded ? 'expanded' : ''}" data-entity-id="${entity.id}">
        <div class="entity-header entity-clickable-header">
          <div class="entity-chevron">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="${isExpanded ? 'M18 15l-6-6-6 6' : 'M9 18l6-6-6-6'}"/>
            </svg>
          </div>
          
          <div class="entity-info">
            <h4 class="entity-name">${Utils.escapeHtml(entity.name)}</h4>
            <span class="entity-type">${entity.entity_type || 'product'}</span>
          </div>
          
          <div class="entity-confidence">
            <div class="confidence-bar">
              <div class="confidence-fill" style="width: ${(entity.confidence_score || 0.85) * 100}%; background: ${confidenceColor};"></div>
            </div>
            <span class="confidence-value" style="color: ${confidenceColor}">
              ${((entity.confidence_score || 0.85) * 100).toFixed(0)}%
            </span>
          </div>
          
          <div class="entity-status">
            <span class="badge badge-${entity.validation_status === 'approved' ? 'success' : 'warning'}">
              ${(entity.validation_status || 'approved').toUpperCase().replace('_', ' ')}
            </span>
          </div>
        </div>
        
        ${isExpanded ? `
          <div class="entity-details-body">
            ${this.renderEntityAttributes(entity)}
            <div class="entity-card-footer">
              <button class="btn btn-outline btn-sm" onclick="window.diffViewer.showDiff(window.dashboard?.state.extractedEntities.find(e => e.id === '${entity.id}'))">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                  <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
                </svg>
                Compare Raw vs Enriched
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render attribute rows table
   */
  renderEntityAttributes(entity) {
    const attributes = entity.attributes || [];
    if (attributes.length === 0) {
      return '<p class="text-muted" style="padding: 1rem;">No attributes available</p>';
    }
    
    const rowsHtml = attributes.map(attr => {
      const confidenceColor = Utils.getConfidenceColor(attr.confidence_score || 0.8);
      return `
        <div class="attribute-row">
          <div class="attribute-key">${Utils.escapeHtml(attr.key)}</div>
          <div class="attribute-value">${Utils.escapeHtml(String(attr.value))}</div>
          <div class="attribute-unit">${attr.unit ? Utils.escapeHtml(attr.unit) : '-'}</div>
          <div class="attribute-confidence" style="color: ${confidenceColor}">
            ${((attr.confidence_score || 0.8) * 100).toFixed(0)}%
          </div>
          <div class="attribute-status">
            <span class="status-dot status-${attr.validation_status || 'approved'}"></span>
            ${attr.validation_status || 'approved'}
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <div class="entity-attributes-table">
        <div class="attributes-header">
          <span>Attribute</span>
          <span>Extracted Value</span>
          <span>Unit</span>
          <span>Confidence</span>
          <span>Status</span>
        </div>
        ${rowsHtml}
      </div>
    `;
  }

  handleSearch(val) {
    this.filterState.search = val;
    const container = document.getElementById('extractionContent');
    this.renderResults(container, this.entities);
  }

  handleStatusFilter(status) {
    this.filterState.status = status;
    const container = document.getElementById('extractionContent');
    this.renderResults(container, this.entities);
  }

  filterEntities(filters) {
    let filtered = [...this.entities];
    
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(e => e.validation_status === filters.status);
    }
    
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(e => 
        (e.name || '').toLowerCase().includes(q) ||
        (e.attributes || []).some(a => (a.key || '').toLowerCase().includes(q) || String(a.value || '').toLowerCase().includes(q))
      );
    }
    
    return filtered;
  }
}

// Initialize extraction module
document.addEventListener('DOMContentLoaded', () => {
  window.extraction = new ExtractionModule();
});