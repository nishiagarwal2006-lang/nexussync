/**
 * NexusSync AI - Enrichment Module
 * Handles AI-powered data enrichment
 */

class EnrichmentModule {
  constructor() {
    this.enrichedEntities = [];
    this.initialize();
  }

  /**
   * Initialize enrichment module
   */
  initialize() {
    // Initialize enrichment patterns
    this.categoryPatterns = this.initializeCategoryPatterns();
  }

  /**
   * Initialize category classification patterns
   * @returns {Array<Object>} Category patterns
   */
  initializeCategoryPatterns() {
    return [
      { category: 'Bearings', keywords: ['bearing', 'ball', 'roller', 'thrust'] },
      { category: 'Valves', keywords: ['valve', 'gate', 'globe', 'check', 'butterfly'] },
      { category: 'Motors', keywords: ['motor', 'electric', 'servo', 'stepper'] },
      { category: 'Pumps', keywords: ['pump', 'centrifugal', 'gear pump', 'hydraulic'] },
      { category: 'Gears', keywords: ['gear', 'sprocket', 'pinion', 'worm'] },
      { category: 'Actuators', keywords: ['actuator', 'pneumatic', 'cylinder', 'linear'] },
      { category: 'Sensors', keywords: ['sensor', 'transducer', 'detector', 'probe'] },
      { category: 'Fasteners', keywords: ['bolt', 'screw', 'nut', 'washer', 'fastener'] },
      { category: 'Couplings', keywords: ['coupling', 'joint', 'connector', 'fitting'] },
      { category: 'Industrial Component', keywords: [] }
    ];
  }

  /**
   * Enrich entities with AI-generated data
   * @param {Array<Object>} entities - Entities to enrich
   * @returns {Array<Object>} Enriched entities
   */
  enrichEntities(entities) {
    return entities.map(entity => this.enrichEntity(entity));
  }

  /**
   * Enrich a single entity
   * @param {Object} entity - Entity to enrich
   * @returns {Object} Enriched entity
   */
  enrichEntity(entity) {
    const enriched = Utils.deepClone(entity);
    const attributes = enriched.attributes || [];
    
    // Add description if missing
    if (!attributes.find(a => a.key === 'description')) {
      attributes.push({
        id: Utils.generateId('attr'),
        key: 'description',
        value: this.generateDescription(entity),
        data_type: 'string',
        unit: null,
        confidence_score: 0.75,
        validation_status: 'auto_validated',
        sources: [{ source_type: 'ai_generated', file_name: 'AI Enrichment' }]
      });
    }
    
    // Add category if missing
    if (!attributes.find(a => a.key === 'category')) {
      attributes.push({
        id: Utils.generateId('attr'),
        key: 'category',
        value: this.classifyCategory(entity),
        data_type: 'string',
        unit: null,
        confidence_score: 0.80,
        validation_status: 'auto_validated',
        sources: [{ source_type: 'ai_classification', file_name: 'AI Classification' }]
      });
    }
    
    // Mark as enriched
    enriched.enriched = true;
    enriched.enriched_at = new Date().toISOString();
    
    return enriched;
  }

  /**
   * Generate entity description
   * @param {Object} entity - Entity object
   * @returns {string} Generated description
   */
  generateDescription(entity) {
    const name = entity.name || 'Product';
    const material = this.getAttributeValue(entity, 'material') || 'high-quality materials';
    const category = this.getAttributeValue(entity, 'category') || 'industrial component';
    
    return `${name} is a premium ${category} manufactured from ${material}. Designed for industrial applications requiring reliability and performance. This component meets rigorous quality standards and is suitable for various manufacturing environments.`;
  }

  /**
   * Classify entity category
   * @param {Object} entity - Entity object
   * @returns {string} Classified category
   */
  classifyCategory(entity) {
    const searchText = `${entity.name} ${JSON.stringify(entity.attributes)}`.toLowerCase();
    
    for (const pattern of this.categoryPatterns) {
      if (pattern.keywords.some(keyword => searchText.includes(keyword))) {
        return pattern.category;
      }
    }
    
    return 'Industrial Component';
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
   * Render enriched data comparison
   * @param {HTMLElement} container - Container element
   * @param {Object} original - Original entity
   * @param {Object} enriched - Enriched entity
   */
  renderDiff(container, original, enriched) {
    if (!container) return;
    
    const originalAttrs = original.attributes || [];
    const enrichedAttrs = enriched.attributes || [];
    const newAttrs = enrichedAttrs.filter(a => 
      !originalAttrs.find(oa => oa.key === a.key)
    );
    
    container.innerHTML = `
      <div class="diff-viewer">
        <div class="diff-column">
          <h4>Original Data</h4>
          ${originalAttrs.map(attr => `
            <div class="diff-item">
              <span class="diff-key">${Utils.escapeHtml(attr.key)}</span>
              <span class="diff-value">${Utils.escapeHtml(String(attr.value))}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="diff-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
        
        <div class="diff-column enriched">
          <h4>AI Enriched</h4>
          ${enrichedAttrs.map(attr => {
            const isNew = newAttrs.find(a => a.key === attr.key);
            return `
              <div class="diff-item ${isNew ? 'new' : ''}">
                <span class="diff-key">${Utils.escapeHtml(attr.key)}</span>
                <span class="diff-value">${Utils.escapeHtml(String(attr.value))}</span>
                ${isNew ? '<span class="badge badge-secondary">AI Generated</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
}

// Initialize enrichment module
document.addEventListener('DOMContentLoaded', () => {
  window.enrichment = new EnrichmentModule();
});