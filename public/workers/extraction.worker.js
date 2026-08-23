/**
 * NexusSync AI - Extraction Worker
 * Web Worker for background text processing
 */

// Worker context
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'extract':
      const entities = extractEntities(data.text);
      self.postMessage({ type: 'extraction_complete', entities });
      break;
    
    case 'parse':
      const parsed = parseText(data.text);
      self.postMessage({ type: 'parse_complete', parsed });
      break;
    
    default:
      self.postMessage({ type: 'error', message: 'Unknown command' });
  }
};

/**
 * Extract entities from text
 * @param {string} text - Text to extract from
 * @returns {Array<Object>} Extracted entities
 */
function extractEntities(text) {
  const entities = [];
  const lines = text.split('\n').filter(l => l.trim());
  let currentEntity = null;
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Detect new entity
    if (trimmed && !trimmed.includes(':') && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
      if (currentEntity && currentEntity.attributes.length > 0) {
        entities.push(currentEntity);
      }
      
      currentEntity = {
        id: `entity-${Date.now()}-${entities.length}`,
        name: trimmed.substring(0, 100),
        entity_type: 'product',
        attributes: [],
        relationships: [],
        confidence_score: 0,
        validation_status: 'pending'
      };
    } else if (currentEntity && trimmed.includes(':')) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      
      if (key && value) {
        const attrKey = key.trim().toLowerCase().replace(/\s+/g, '_');
        const isNumeric = !isNaN(parseFloat(value)) && isFinite(value);
        
        currentEntity.attributes.push({
          id: `attr-${Date.now()}-${entities.length}-${currentEntity.attributes.length}`,
          key: attrKey,
          value: isNumeric ? parseFloat(value) : value,
          data_type: isNumeric ? 'number' : 'string',
          unit: detectUnit(value),
          confidence_score: 0.7 + Math.random() * 0.25,
          validation_status: 'pending'
        });
      }
    }
  });
  
  if (currentEntity && currentEntity.attributes.length > 0) {
    entities.push(currentEntity);
  }
  
  // Calculate entity confidence
  entities.forEach(e => {
    e.confidence_score = e.attributes.reduce((sum, a) => sum + a.confidence_score, 0) / e.attributes.length;
  });
  
  return entities;
}

/**
 * Parse text content
 * @param {string} text - Text to parse
 * @returns {Object} Parsed data
 */
function parseText(text) {
  return {
    charCount: text.length,
    lineCount: text.split('\n').length,
    wordCount: text.split(/\s+/).filter(w => w).length,
    entities: extractEntities(text)
  };
}

/**
 * Detect unit from value
 * @param {string} value - Value to check
 * @returns {string|null} Detected unit
 */
function detectUnit(value) {
  const unitPatterns = {
    'mm': /(\d+\.?\d*)\s*mm/i,
    'cm': /(\d+\.?\d*)\s*cm/i,
    'kg': /(\d+\.?\d*)\s*kg/i,
    'kN': /(\d+\.?\d*)\s*kN/i,
    'RPM': /(\d+\.?\d*)\s*RPM/i,
    '°C': /(\d+\.?\d*)\s*°?C/i,
    'PSI': /(\d+\.?\d*)\s*PSI/i,
    'bar': /(\d+\.?\d*)\s*bar/i,
    'kW': /(\d+\.?\d*)\s*kW/i,
    'V': /(\d+\.?\d*)\s*V/i
  };
  
  for (const [unit, pattern] of Object.entries(unitPatterns)) {
    if (pattern.test(value)) return unit;
  }
  
  return null;
}