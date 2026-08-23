/**
 * NexusSync AI - Sample Data Generator
 * Provides demo data for instant testing
 */

class SampleDataGenerator {
  constructor() {
    this.sampleProducts = this.initializeSampleProducts();
  }

  /**
   * Initialize sample products
   * @returns {Array<Object>} Sample products
   */
  initializeSampleProducts() {
    return [
      {
        name: 'Industrial Bearing Type-X200',
        part_number: 'BRG-X200-304',
        material: 'Stainless Steel 304',
        outer_diameter: '52mm',
        inner_diameter: '25mm',
        width: '15mm',
        load_rating: '14.5 kN',
        speed_rating: '12000 RPM',
        temperature_range: '-40°C to 120°C',
        manufacturer: 'Precision Bearing Co.',
        certification: 'ISO 9001:2015',
        price: '$245.00',
        lead_time: '2 weeks',
        application: 'High-speed rotating machinery'
      },
      {
        name: 'Hydraulic Valve V-450',
        part_number: 'HV-450-BRASS',
        material: 'Brass with Stainless Steel Trim',
        inlet_pressure: '3000 PSI',
        flow_rate: '45 GPM',
        port_size: '1/2 inch NPT',
        temperature_rating: '-20°F to 400°F',
        manufacturer: 'FlowControl Industries',
        certification: 'CE, RoHS',
        price: '$89.50',
        lead_time: '1 week',
        application: 'Industrial hydraulic systems'
      },
      {
        name: 'Pneumatic Actuator PA-200',
        part_number: 'PA-200-DA',
        bore_size: '200mm',
        stroke: '150mm',
        operating_pressure: '2-8 bar',
        temperature_range: '-20°C to 80°C',
        manufacturer: 'AirMotion Technologies',
        certification: 'ATEX, ISO 9001',
        price: '$450.00',
        lead_time: '3 weeks',
        application: 'Process automation'
      },
      {
        name: 'Electric Motor EM-750',
        part_number: 'EM-750-3PH',
        power: '7.5 kW',
        voltage: '380V',
        rpm: '1450',
        torque: '49.4 Nm',
        efficiency: '92%',
        manufacturer: 'DriveSystems GmbH',
        certification: 'IEC 60034, CE',
        price: '$1,250.00',
        lead_time: '4 weeks',
        application: 'Industrial drive systems'
      }
    ];
  }

  /**
   * Generate sample entities
   * @returns {Array<Object>} Sample entities
   */
  generateSampleEntities() {
    return this.sampleProducts.map((product, index) => {
      const attributes = Object.entries(product).map(([key, value], attrIndex) => ({
        id: `attr-sample-${index}-${attrIndex}`,
        key: key,
        value: value,
        data_type: Utils.isNumeric(value) ? 'number' : 'string',
        unit: this.detectUnit(value),
        confidence_score: 0.75 + Math.random() * 0.2,
        validation_status: 'pending',
        sources: [{
          source_type: 'sample_data',
          file_name: 'sample_products.txt',
          excerpt: `${key}: ${value}`
        }]
      }));
      
      const confidence = Utils.average(attributes.map(a => a.confidence_score));
      
      return {
        id: `entity-sample-${index}`,
        name: product.name,
        entity_type: 'product',
        attributes,
        relationships: [],
        confidence_score: confidence,
        validation_status: 'pending',
        source: 'sample_products.txt',
        enriched: false,
        created_at: new Date().toISOString()
      };
    });
  }

  /**
   * Generate sample knowledge graph
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
          label: entity.name.substring(0, 30),
          type: 'product',
          x: Math.random() * 600,
          y: Math.random() * 400,
          size: 10 + entity.confidence_score * 15,
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
            label: attr.key.substring(0, 20),
            type: 'attribute',
            x: Math.random() * 600,
            y: Math.random() * 400,
            size: 4 + attr.confidence_score * 8,
            color: attr.confidence_score > 0.8 ? '#34D399' : '#FBBF24',
            confidence: attr.confidence_score,
            data: attr
          });
        }
        
        edges.push({
          id: `edge-${entity.id}-${attr.id}`,
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
   * Detect unit from value
   * @param {*} value - Value to check
   * @returns {string|null} Detected unit
   */
  detectUnit(value) {
    const valueStr = String(value);
    const unitPatterns = {
      'mm': /mm$/i,
      'kg': /kg$/i,
      'kN': /kN$/i,
      'RPM': /RPM$/i,
      'PSI': /PSI$/i,
      'GPM': /GPM$/i,
      'bar': /bar$/i,
      'kW': /kW$/i,
      'V': /V$/i,
      'Nm': /Nm$/i
    };
    
    for (const [unit, pattern] of Object.entries(unitPatterns)) {
      if (pattern.test(valueStr)) return unit;
    }
    
    return null;
  }

  /**
   * Load sample data into dashboard
   */
  loadSampleData() {
    if (!window.dashboard) return;
    
    const entities = this.generateSampleEntities();
    const knowledgeGraph = this.generateKnowledgeGraph(entities);
    
    const result = {
      jobId: Utils.generateId('sample-job'),
      status: 'completed',
      entities,
      knowledgeGraph,
      logs: [
        { agent: 'orchestrator', message: 'Starting sample data pipeline...', level: 'start', timestamp: Date.now() },
        { agent: 'extraction', message: 'Parsing sample product data...', level: 'thinking', timestamp: Date.now() + 500 },
        { agent: 'extraction', message: `Extracted ${entities.length} entities`, level: 'success', timestamp: Date.now() + 1000 },
        { agent: 'validation', message: 'Cross-referencing schema templates...', level: 'thinking', timestamp: Date.now() + 1500 },
        { agent: 'validation', message: 'Validation complete', level: 'success', timestamp: Date.now() + 2000 },
        { agent: 'enrichment', message: 'Building knowledge graph...', level: 'thinking', timestamp: Date.now() + 2500 },
        { agent: 'enrichment', message: `Knowledge graph: ${knowledgeGraph.nodes.length} nodes, ${knowledgeGraph.edges.length} edges`, level: 'success', timestamp: Date.now() + 3000 }
      ],
      summary: {
        totalEntities: entities.length,
        totalAttributes: entities.reduce((sum, e) => sum + e.attributes.length, 0),
        averageConfidence: (Utils.average(entities.map(e => e.confidence_score))).toFixed(2),
        approved: 0,
        needsReview: 0,
        rejected: 0
      },
      completedAt: Date.now()
    };
    
    window.dashboard.handleExtractionComplete(result);
  }
}

// Initialize sample data generator
document.addEventListener('DOMContentLoaded', () => {
  window.sampleData = new SampleDataGenerator();
});

// Global function for HTML onclick
function loadSampleData() {
  enterDashboard();
  
  setTimeout(() => {
    if (window.sampleData) {
      window.sampleData.loadSampleData();
    }
  }, 600);
}