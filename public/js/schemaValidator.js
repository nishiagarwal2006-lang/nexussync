/**
 * NexusSync AI - Schema Validator
 * Validates entities against schema templates
 */

class SchemaValidator {
  constructor() {
    this.schema = null;
    this.initialize();
  }

  /**
   * Initialize schema validator
   */
  initialize() {
    this.loadSchema();
  }

  /**
   * Load schema from server
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
      console.warn('Failed to load schema, using default:', error);
      this.schema = this.getDefaultSchema();
    }
  }

  /**
   * Get default schema
   * @returns {Object} Default schema
   */
  getDefaultSchema() {
    return {
      version: '1.0',
      name: 'industrial_product',
      required_attributes: ['name', 'part_number', 'material', 'manufacturer', 'category'],
      optional_attributes: ['description', 'dimensions', 'weight', 'price'],
      validation_rules: {
        part_number: { min_length: 3, pattern: '^[A-Z0-9\\-_]+$' }
      }
    };
  }

  /**
   * Validate entity against schema
   * @param {Object} entity - Entity to validate
   * @returns {Object} Validation result
   */
  validateEntity(entity) {
    const issues = [];
    const suggestions = [];
    const attributes = entity.attributes || [];
    const attributeKeys = attributes.map(a => a.key.toLowerCase());
    
    // Check required attributes
    (this.schema?.required_attributes || []).forEach(required => {
      if (!attributeKeys.includes(required.toLowerCase())) {
        issues.push({
          type: 'missing_required',
          attribute: required,
          message: `Missing required attribute: ${required}`
        });
      }
    });
    
    // Validate attribute confidence
    attributes.forEach(attr => {
      if (attr.confidence_score < 0.4) {
        issues.push({
          type: 'low_confidence',
          attribute: attr.key,
          message: `Low confidence for ${attr.key}: ${(attr.confidence_score * 100).toFixed(0)}%`
        });
      }
    });
    
    return {
      entityId: entity.id,
      entityName: entity.name,
      issues,
      suggestions,
      valid: issues.length === 0
    };
  }

  /**
   * Render validation summary
   * @param {HTMLElement} container - Container element
   * @param {Array<Object>} entities - Entities to validate
   */
  renderSummary(container, entities) {
    if (!container) return;
    
    const results = entities.map(e => this.validateEntity(e));
    const total = results.length;
    const valid = results.filter(r => r.valid).length;
    const invalid = total - valid;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    
    container.innerHTML = `
      <div class="validation-summary glass-card">
        <h3>Schema Validation Summary</h3>
        
        <div class="summary-stats">
          <div class="summary-stat">
            <span class="stat-value">${total}</span>
            <span class="stat-label">Total Entities</span>
          </div>
          <div class="summary-stat">
            <span class="stat-value text-success">${valid}</span>
            <span class="stat-label">Valid</span>
          </div>
          <div class="summary-stat">
            <span class="stat-value text-warning">${invalid}</span>
            <span class="stat-label">Invalid</span>
          </div>
          <div class="summary-stat">
            <span class="stat-value text-danger">${totalIssues}</span>
            <span class="stat-label">Total Issues</span>
          </div>
        </div>
        
        ${results.filter(r => !r.valid).length > 0 ? `
          <div class="issues-list">
            <h4>Issues Found</h4>
            ${results.filter(r => !r.valid).map(result => `
              <div class="entity-issues">
                <h5>${Utils.escapeHtml(result.entityName)}</h5>
                ${result.issues.map(issue => `
                  <div class="issue-item">
                    <span class="issue-type">${issue.type}</span>
                    <span class="issue-message">${Utils.escapeHtml(issue.message)}</span>
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="all-valid">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <path d="M22 4L12 14.01l-3-3"/>
            </svg>
            <p>All entities passed validation</p>
          </div>
        `}
      </div>
    `;
  }
}

// Initialize schema validator
document.addEventListener('DOMContentLoaded', () => {
  window.schemaValidator = new SchemaValidator();
});