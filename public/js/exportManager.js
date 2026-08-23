/**
 * NexusSync AI - Export Manager
 * Handles data export in various formats
 */

class ExportManager {
  constructor() {
    this.initialize();
  }

  /**
   * Initialize export manager
   */
  initialize() {
    this.formats = {
      json: {
        label: 'JSON',
        description: 'Full structured data with attributes and citations',
        mimeType: 'application/json',
        extension: 'json',
        icon: '📄'
      },
      pim: {
        label: 'PIM Schema',
        description: 'Product Information Management compatible format',
        mimeType: 'application/json',
        extension: 'json',
        icon: '🏷️'
      },
      csv: {
        label: 'CSV',
        description: 'Tabular format for spreadsheet applications',
        mimeType: 'text/csv',
        extension: 'csv',
        icon: '📊'
      }
    };
  }

  /**
   * Export entities in specified format
   * @param {Array<Object>} entities - Entities to export
   * @param {string} format - Export format
   * @param {boolean} includeCitations - Include citations
   * @returns {Object} Export result
   */
  exportData(entities, format, includeCitations = true) {
    switch (format) {
      case 'json':
        return this.exportJSON(entities, includeCitations);
      case 'pim':
        return this.exportPIM(entities, includeCitations);
      case 'csv':
        return this.exportCSV(entities);
      default:
        return this.exportJSON(entities, includeCitations);
    }
  }

  /**
   * Export as JSON
   * @param {Array<Object>} entities - Entities to export
   * @param {boolean} includeCitations - Include citations
   * @returns {Object} Export result
   */
  exportJSON(entities, includeCitations) {
    const data = {
      schema_version: '1.0',
      export_id: Utils.generateId('export'),
      exported_at: new Date().toISOString(),
      product_count: entities.length,
      products: entities.map(entity => {
        const product = {
          id: entity.id,
          name: entity.name,
          entity_type: entity.entity_type || 'product',
          validation_status: entity.validation_status,
          confidence_score: entity.confidence_score,
          attributes: {}
        };
        
        (entity.attributes || []).forEach(attr => {
          product.attributes[attr.key] = {
            value: attr.value,
            data_type: attr.data_type,
            unit: attr.unit,
            confidence_score: attr.confidence_score,
            validation_status: attr.validation_status
          };
          
          if (includeCitations && attr.sources) {
            product.attributes[attr.key].citations = attr.sources;
          }
        });
        
        return product;
      })
    };
    
    return {
      data: JSON.stringify(data, null, 2),
      fileName: `nexussync-export-${Date.now()}.json`,
      mimeType: 'application/json',
      format: 'json'
    };
  }

  /**
   * Export as PIM schema
   * @param {Array<Object>} entities - Entities to export
   * @param {boolean} includeCitations - Include citations
   * @returns {Object} Export result
   */
  exportPIM(entities, includeCitations) {
    const data = {
      schema: 'PIM-1.0',
      export_id: Utils.generateId('pim'),
      timestamp: new Date().toISOString(),
      products: entities.map(entity => ({
        sku: this.getAttributeValue(entity, 'part_number') || entity.id,
        name: entity.name,
        category: this.getAttributeValue(entity, 'category') || 'Uncategorized',
        manufacturer: this.getAttributeValue(entity, 'manufacturer'),
        material: this.getAttributeValue(entity, 'material'),
        specifications: (entity.attributes || [])
          .filter(a => !['name', 'part_number', 'category', 'manufacturer', 'material'].includes(a.key))
          .reduce((acc, a) => {
            acc[a.key] = {
              value: a.value,
              unit: a.unit,
              confidence: a.confidence_score
            };
            return acc;
          }, {}),
        data_quality: {
          score: entity.confidence_score,
          status: entity.validation_status
        }
      }))
    };
    
    return {
      data: JSON.stringify(data, null, 2),
      fileName: `nexussync-pim-${Date.now()}.json`,
      mimeType: 'application/json',
      format: 'pim'
    };
  }

  /**
   * Export as CSV
   * @param {Array<Object>} entities - Entities to export
   * @returns {Object} Export result
   */
  exportCSV(entities) {
    const headers = ['name', 'part_number', 'material', 'manufacturer', 'category', 'confidence_score', 'validation_status'];
    const rows = [headers.join(',')];
    
    entities.forEach(entity => {
      const row = [
        `"${(entity.name || '').replace(/"/g, '""')}"`,
        `"${(this.getAttributeValue(entity, 'part_number') || '').replace(/"/g, '""')}"`,
        `"${(this.getAttributeValue(entity, 'material') || '').replace(/"/g, '""')}"`,
        `"${(this.getAttributeValue(entity, 'manufacturer') || '').replace(/"/g, '""')}"`,
        `"${(this.getAttributeValue(entity, 'category') || '').replace(/"/g, '""')}"`,
        (entity.confidence_score || 0).toFixed(2),
        `"${entity.validation_status || 'pending'}"`
      ];
      rows.push(row.join(','));
    });
    
    return {
      data: rows.join('\n'),
      fileName: `nexussync-export-${Date.now()}.csv`,
      mimeType: 'text/csv',
      format: 'csv'
    };
  }

  /**
   * Get attribute value from entity
   * @param {Object} entity - Entity object
   * @param {string} key - Attribute key
   * @returns {*} Attribute value
   */
  getAttributeValue(entity, key) {
    const attr = (entity.attributes || []).find(a => a.key === key);
    return attr ? attr.value : null;
  }

  /**
   * Download export result
   * @param {Object} result - Export result
   */
  download(result) {
    Utils.downloadFile(result.data, result.fileName, result.mimeType);
  }

  /**
   * Render export panel
   * @param {HTMLElement} container - Container element
   * @param {Array<Object>} entities - Entities to export
   */
  renderExportPanel(container, entities) {
    if (!container) return;
    
    const formatsHtml = Object.entries(this.formats).map(([key, format]) => `
      <button class="export-option glass-card" onclick="window.exportManager.handleExport('${key}')">
        <span class="export-icon">${format.icon}</span>
        <div class="export-info">
          <h4>${format.label}</h4>
          <p>${format.description}</p>
        </div>
      </button>
    `).join('');
    
    container.innerHTML = `
      <div class="export-panel">
        <h3>Export Data</h3>
        <p>Choose export format for ${entities.length} entities</p>
        <div class="export-options">
          ${formatsHtml}
        </div>
        <div class="export-settings">
          <label>
            <input type="checkbox" id="includeCitations" checked>
            Include Citations
          </label>
        </div>
      </div>
    `;
  }

  /**
   * Handle export button click
   * @param {string} format - Export format
   */
  handleExport(format) {
    if (!window.dashboard || window.dashboard.state.extractedEntities.length === 0) {
      if (window.toastSystem) {
        window.toastSystem.show('No data to export', 'warning');
      }
      return;
    }
    
    const includeCitations = document.getElementById('includeCitations')?.checked ?? true;
    const entities = window.dashboard.state.extractedEntities;
    
    const result = this.exportData(entities, format, includeCitations);
    this.download(result);
    
    if (window.toastSystem) {
      window.toastSystem.show(`Exported ${format.toUpperCase()} successfully`, 'success');
    }
  }
}

// Initialize export manager
document.addEventListener('DOMContentLoaded', () => {
  window.exportManager = new ExportManager();
});