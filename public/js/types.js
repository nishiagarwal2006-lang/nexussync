/**
 * NexusSync AI - Type Definitions
 * JavaScript type definitions and validation utilities
 */

/**
 * Product Entity Type
 * @typedef {Object} ProductEntity
 * @property {string} id - Unique entity identifier
 * @property {string} name - Product name
 * @property {string} entity_type - Type of entity (product)
 * @property {Array<ExtractedAttribute>} attributes - Entity attributes
 * @property {Array<Object>} relationships - Entity relationships
 * @property {number} confidence_score - Overall confidence (0-1)
 * @property {string} validation_status - Validation status
 * @property {string} source - Source file name
 * @property {boolean} enriched - Whether entity is enriched
 */

/**
 * Extracted Attribute Type
 * @typedef {Object} ExtractedAttribute
 * @property {string} id - Unique attribute identifier
 * @property {string} key - Attribute key/name
 * @property {*} value - Attribute value
 * @property {string} data_type - Data type (string/number/boolean)
 * @property {string|null} unit - Measurement unit
 * @property {number} confidence_score - Attribute confidence (0-1)
 * @property {string} validation_status - Validation status
 * @property {Array<SourceReference>} sources - Source citations
 */

/**
 * Source Reference Type
 * @typedef {Object} SourceReference
 * @property {string} source_type - Type of source
 * @property {string} file_name - Original file name
 * @property {string} excerpt - Relevant excerpt
 */

/**
 * Knowledge Graph Node
 * @typedef {Object} GraphNode
 * @property {string} id - Node identifier
 * @property {string} label - Display label
 * @property {string} type - Node type
 * @property {number} size - Node size
 * @property {string} color - Node color
 * @property {number} confidence - Confidence score
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} vx - X velocity
 * @property {number} vy - Y velocity
 */

/**
 * Knowledge Graph Edge
 * @typedef {Object} GraphEdge
 * @property {string} id - Edge identifier
 * @property {string} source - Source node ID
 * @property {string} target - Target node ID
 * @property {string} label - Edge label
 * @property {number} weight - Edge weight
 */

/**
 * Agent Log Entry
 * @typedef {Object} AgentLog
 * @property {string} agent - Agent name
 * @property {string} message - Log message
 * @property {string} level - Log level
 * @property {number} timestamp - Unix timestamp
 */

// Validation Status Constants
const VALIDATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_REVIEW: 'needs_review',
  AUTO_VALIDATED: 'auto_validated'
};

// Log Level Constants
const LOG_LEVELS = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  THINKING: 'thinking',
  START: 'start'
};

// Confidence Level Constants
const CONFIDENCE_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  VERY_LOW: 'very_low'
};

// Export constants
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VALIDATION_STATUS,
    LOG_LEVELS,
    CONFIDENCE_LEVELS
  };
}