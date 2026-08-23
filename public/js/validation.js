/**
 * NexusSync AI - Validation Module
 * Handles data validation and schema checking
 */

class ValidationModule {
  constructor() {
    this.schema = null;
    this.results = [];
    this.initialize();
  }

  /**
   * Initialize validation module
   */
  initialize() {
    this.loadSchema();
  }

  /**
   * Load schema template
   */
  async loadSchema() {
    try {
      const response = await fetch('/api/schemas/industrial-product');
      if (response.ok) {
        this.schema = await response.json();
      } else {
        this.schema = this.getDefaultSchema();
      }
    } catch (error) {
      console.warn('Using default schema fallback:', error);
      this.schema = this.getDefaultSchema();
    }
  }

  /**
   * Get default schema
   */
  getDefaultSchema() {
    return {
      version: '1.0',
      name: 'industrial_product',
      required_attributes: ['name', 'part_number', 'material', 'manufacturer'],
      optional_attributes: ['category', 'description', 'dimensions', 'weight', 'price', 'outer_diameter', 'inner_diameter', 'load_rating', 'speed_rating', 'temperature_range', 'certification', 'lead_time', 'application'],
      validation_rules: {
        part_number: { min_length: 3, pattern: '^[A-Z0-9\\-_]+$' }
      }
    };
  }

  /**
   * Validate entities against schema
   */
  validateEntities(entities) {
    this.results = entities.map(entity => this.validateEntity(entity));
    
    return {
      results: this.results,
      summary: this.generateSummary(this.results)
    };
  }

  /**
   * Validate a single entity
   */
  validateEntity(entity) {
    const issues = [];
    const suggestions = [];
    const attributes = entity.attributes || [];
    
    // Normalize attribute keys for flexible matching (e.g., part_number vs part number)
    const normalize = (str) => String(str || '').toLowerCase().replace(/[\s\-_]/g, '');
    const entityAttrKeyMap = new Map();
    attributes.forEach(a => {
      entityAttrKeyMap.set(normalize(a.key), a);
    });
    
    // Check required attributes against both top-level entity properties and attributes array
    const requiredAttrs = this.schema?.required_attributes || ['name', 'part_number', 'material', 'manufacturer'];
    
    requiredAttrs.forEach(required => {
      const normReq = normalize(required);
      const hasInAttributes = entityAttrKeyMap.has(normReq) && String(entityAttrKeyMap.get(normReq).value || '').trim() !== '';
      const hasTopLevel = (normReq === 'name' && entity.name) ||
                          (normReq === 'partnumber' && (entity.part_number || entity.partNumber)) ||
                          (normReq === 'manufacturer' && entity.manufacturer) ||
                          (normReq === 'material' && entity.material) ||
                          (normReq === 'category' && (entity.category || entity.entity_type)) ||
                          (entity[required] !== undefined && String(entity[required]).trim() !== '');
      
      if (!hasInAttributes && !hasTopLevel) {
        issues.push(`Missing required attribute: ${required.replace(/_/g, ' ')}`);
      }
    });
    
    // Validate individual attribute confidence and format
    let hasLowConfidence = false;
    let hasCriticalIssues = false;

    attributes.forEach(attr => {
      const score = attr.confidence_score !== undefined ? attr.confidence_score : 0.8;
      
      if (score < 0.4) {
        attr.validation_status = 'rejected';
        issues.push(`Low confidence for "${attr.key}" (${(score * 100).toFixed(0)}%)`);
        hasCriticalIssues = true;
      } else if (score < 0.70) {
        attr.validation_status = 'needs_review';
        suggestions.push(`Verify "${attr.key}" value (${(score * 100).toFixed(0)}% confidence)`);
        hasLowConfidence = true;
      } else {
        attr.validation_status = 'approved';
      }
    });
    
    // Set overall entity validation status
    if (issues.length === 0 && !hasCriticalIssues && !hasLowConfidence) {
      entity.validation_status = 'approved';
    } else if (issues.length > 0 || hasCriticalIssues) {
      entity.validation_status = 'needs_review';
    } else {
      entity.validation_status = 'needs_review';
    }
    
    return {
      entityId: entity.id,
      entityName: entity.name || 'Unnamed Entity',
      entityType: entity.entity_type || 'product',
      status: entity.validation_status,
      confidenceScore: entity.confidence_score || 0.85,
      issues,
      suggestions,
      validatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate validation summary
   */
  generateSummary(results) {
    const summary = {
      total: results.length,
      approved: 0,
      needsReview: 0,
      rejected: 0,
      totalIssues: 0,
      totalSuggestions: 0
    };
    
    results.forEach(result => {
      if (result.status === 'approved') summary.approved++;
      else if (result.status === 'needs_review') summary.needsReview++;
      else if (result.status === 'rejected') summary.rejected++;
      
      summary.totalIssues += (result.issues || []).length;
      summary.totalSuggestions += (result.suggestions || []).length;
    });
    
    return summary;
  }

  /**
   * Render validation results in the Validation tab
   */
  renderResults(container, results) {
    if (!container) return;
    
    if (!results || results.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="text-muted">No validation results available. Click "Run Validation" to analyze entities.</p>
        </div>
      `;
      return;
    }
    
    const summary = this.generateSummary(results);
    
    const summaryHtml = `
      <div class="validation-summary-grid">
        <div class="stat-card glass-card">
          <span class="stat-value">${summary.total}</span>
          <span class="stat-label">Total Evaluated</span>
        </div>
        <div class="stat-card glass-card">
          <span class="stat-value text-success">${summary.approved}</span>
          <span class="stat-label">Schema Compliant</span>
        </div>
        <div class="stat-card glass-card">
          <span class="stat-value text-warning">${summary.needsReview}</span>
          <span class="stat-label">Need Review</span>
        </div>
        <div class="stat-card glass-card">
          <span class="stat-value text-danger">${summary.rejected}</span>
          <span class="stat-label">Rejected</span>
        </div>
      </div>
      
      <div class="validation-actions-bar">
        <button class="btn btn-primary btn-sm" onclick="runValidation()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
            <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          Re-Run Schema Validation
        </button>
      </div>
    `;
    
    const cardsHtml = results.map(result => {
      const statusClass = this.getStatusClass(result.status);
      return `
        <div class="validation-card glass-card status-${result.status}">
          <div class="validation-card-header">
            <div class="validation-title-group">
              <h4 class="validation-entity-name">${Utils.escapeHtml(result.entityName)}</h4>
              <span class="entity-type-badge">${result.entityType}</span>
            </div>
            <span class="badge badge-${statusClass}">
              ${result.status.toUpperCase().replace('_', ' ')}
            </span>
          </div>
          
          <div class="validation-body">
            ${result.issues && result.issues.length > 0 ? `
              <div class="validation-issues-box">
                <div class="section-tag error-tag">Issues (${result.issues.length})</div>
                <ul class="issues-list">
                  ${result.issues.map(issue => `
                    <li>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span>${Utils.escapeHtml(issue)}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : `
              <div class="validation-pass-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <path d="M22 4L12 14.01l-3-3"/>
                </svg>
                <span>All required schema rules passed successfully</span>
              </div>
            `}
            
            ${result.suggestions && result.suggestions.length > 0 ? `
              <div class="validation-suggestions-box">
                <div class="section-tag suggestion-tag">Suggestions</div>
                <ul class="suggestions-list">
                  ${result.suggestions.map(sug => `
                    <li>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      <span>${Utils.escapeHtml(sug)}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    container.innerHTML = `
      <div class="validation-container-inner">
        ${summaryHtml}
        <div class="validation-results-grid">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Get status CSS class
   */
  getStatusClass(status) {
    switch (status) {
      case 'approved': return 'success';
      case 'needs_review': return 'warning';
      case 'rejected': return 'danger';
      default: return 'primary';
    }
  }
}

// Initialize validation module
document.addEventListener('DOMContentLoaded', () => {
  window.validation = new ValidationModule();
});