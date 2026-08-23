/**
 * NexusSync AI - Mock Data Generator
 * Provides realistic mock data for testing without Groq API
 */

class MockDataGenerator {
  constructor() {
    this.initialize();
  }

  /**
   * Initialize mock data generator
   */
  initialize() {
    this.manufacturers = [
      'Precision Engineering Co.',
      'Industrial Solutions Ltd.',
      'Global Manufacturing Inc.',
      'TechComponents GmbH',
      'Advanced Systems Corp.',
      'Quality Parts Manufacturing'
    ];
    
    this.materials = [
      'Stainless Steel 304',
      'Carbon Steel',
      'Aluminum 6061',
      'Brass',
      'Titanium',
      'Cast Iron'
    ];
    
    this.categories = [
      'Bearings', 'Valves', 'Motors', 'Pumps',
      'Gears', 'Actuators', 'Sensors', 'Fasteners',
      'Couplings', 'Cylinders'
    ];
  }

  /**
   * Generate mock entities
   * @param {number} count - Number of entities to generate
   * @returns {Array<Object>} Mock entities
   */
  generateEntities(count = 5) {
    const entities = [];
    
    for (let i = 0; i < count; i++) {
      entities.push(this.generateEntity(i));
    }
    
    return entities;
  }

  /**
   * Generate a single mock entity
   * @param {number} index - Entity index
   * @returns {Object} Mock entity
   */
  generateEntity(index) {
    const category = this.categories[index % this.categories.length];
    const material = this.materials[index % this.materials.length];
    const manufacturer = this.manufacturers[index % this.manufacturers.length];
    const name = `${category} Type-${String.fromCharCode(65 + index)}${100 + index * 50}`;
    const partNumber = `${category.substring(0, 3).toUpperCase()}-${100 + index * 50}-${material.substring(0, 3).toUpperCase()}`;
    
    const attributes = [
      this.createAttribute('part_number', partNumber, 'string'),
      this.createAttribute('material', material, 'string'),
      this.createAttribute('manufacturer', manufacturer, 'string'),
      this.createAttribute('category', category, 'string'),
      this.createAttribute('dimensions', `${20 + index * 5}mm x ${40 + index * 10}mm`, 'string', 'mm'),
      this.createAttribute('weight', (0.5 + index * 0.3).toFixed(2), 'number', 'kg'),
      this.createAttribute('load_rating', (10 + index * 5).toFixed(1), 'number', 'kN'),
      this.createAttribute('speed_rating', (5000 + index * 1000).toString(), 'number', 'RPM'),
      this.createAttribute('operating_temperature', `-${20 + index * 5}°C to ${80 + index * 10}°C`, 'string'),
      this.createAttribute('price', `$${(50 + index * 75).toFixed(2)}`, 'string'),
      this.createAttribute('lead_time', `${1 + index % 3} weeks`, 'string')
    ];
    
    const confidence = Utils.average(attributes.map(a => a.confidence_score));
    
    return {
      id: `mock-entity-${index}`,
      name,
      entity_type: 'product',
      attributes,
      relationships: [],
      confidence_score: confidence,
      validation_status: 'pending',
      source: 'mock_data.txt',
      enriched: false,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Create a mock attribute
   * @param {string} key - Attribute key
   * @param {*} value - Attribute value
   * @param {string} dataType - Data type
   * @param {string|null} unit - Measurement unit
   * @returns {Object} Attribute object
   */
  createAttribute(key, value, dataType, unit = null) {
    const confidence = 0.65 + Math.random() * 0.3;
    
    return {
      id: Utils.generateId('mock-attr'),
      key,
      value,
      data_type: dataType,
      unit,
      confidence_score: confidence,
      validation_status: confidence >= 0.85 ? 'approved' : confidence >= 0.60 ? 'approved' : 'needs_review',
      sources: [{
        source_type: 'mock_data',
        file_name: 'mock_products.txt',
        excerpt: `${key}: ${value}`
      }]
    };
  }

  /**
   * Generate mock knowledge graph
   * @param {Array<Object>} entities - Entities for graph
   * @returns {Object} Knowledge graph data
   */
  generateKnowledgeGraph(entities) {
    const nodes = [];
    const edges = [];
    const nodeIds = new Set();
    
    entities.forEach((entity, entityIndex) => {
      if (!nodeIds.has(entity.id)) {
        nodeIds.add(entity.id);
        nodes.push({
          id: entity.id,
          label: entity.name.substring(0, 25),
          type: 'product',
          x: Math.random() * 600,
          y: Math.random() * 400,
          size: 8 + entity.confidence_score * 12,
          color: '#38BDF8',
          confidence: entity.confidence_score,
          data: entity
        });
      }
      
      entity.attributes.forEach((attr, attrIndex) => {
        if (!nodeIds.has(attr.id)) {
          nodeIds.add(attr.id);
          nodes.push({
            id: attr.id,
            label: attr.key.substring(0, 18),
            type: 'attribute',
            x: Math.random() * 600,
            y: Math.random() * 400,
            size: 4 + attr.confidence_score * 6,
            color: this.getConfidenceColor(attr.confidence_score),
            confidence: attr.confidence_score,
            data: attr
          });
        }
        
        edges.push({
          id: `mock-edge-${entity.id}-${attr.id}`,
          source: entity.id,
          target: attr.id,
          label: 'has_attribute',
          weight: attr.confidence_score
        });
      });
    });
    
    return { nodes, edges };
  }

  /**
   * Get confidence color
   * @param {number} confidence - Confidence score
   * @returns {string} Color hex
   */
  getConfidenceColor(confidence) {
    if (confidence >= 0.85) return '#34D399';
    if (confidence >= 0.60) return '#38BDF8';
    if (confidence >= 0.40) return '#FBBF24';
    return '#F87171';
  }

  /**
   * Load mock data into dashboard
   */
  loadMockData() {
    if (!window.dashboard) return;
    
    const entities = this.generateEntities(5);
    const knowledgeGraph = this.generateKnowledgeGraph(entities);
    
    const result = {
      jobId: Utils.generateId('mock-job'),
      status: 'completed',
      entities,
      knowledgeGraph,
      logs: [
        { agent: 'orchestrator', message: 'Starting mock data pipeline...', level: 'start', timestamp: Date.now() },
        { agent: 'extraction', message: 'Processing mock product data...', level: 'thinking', timestamp: Date.now() + 500 },
        { agent: 'extraction', message: `Extracted ${entities.length} entities`, level: 'success', timestamp: Date.now() + 1000 },
        { agent: 'validation', message: 'Validating against schema...', level: 'thinking', timestamp: Date.now() + 1500 },
        { agent: 'validation', message: 'Validation complete', level: 'success', timestamp: Date.now() + 2000 },
        { agent: 'enrichment', message: 'Enriching with AI data...', level: 'thinking', timestamp: Date.now() + 2500 },
        { agent: 'enrichment', message: 'Enrichment complete', level: 'success', timestamp: Date.now() + 3000 }
      ],
      summary: {
        totalEntities: entities.length,
        totalAttributes: entities.reduce((sum, e) => sum + e.attributes.length, 0),
        averageConfidence: Utils.average(entities.map(e => e.confidence_score)).toFixed(2),
        approved: 0,
        needsReview: 0,
        rejected: 0
      },
      completedAt: Date.now()
    };
    
    window.dashboard.handleExtractionComplete(result);
  }
}

// Initialize mock data generator
document.addEventListener('DOMContentLoaded', () => {
  window.mockData = new MockDataGenerator();
});