/**
 * NexusSync AI - Enterprise Grade Backend Server
 * Multi-Agent Product Intelligence Platform
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const compression = require('compression');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.csv', '.xlsx', '.xls', '.docx', '.json', '.xml', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowedTypes.join(', ')}`));
    }
  }
});

// Initialize Groq client
let groq = null;
if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here') {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log('✅ Groq API connected');
} else {
  console.log('⚠️  Groq API not configured - using mock mode');
}

// File parsers
const pdfParse = require('pdf-parse');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const mammoth = require('mammoth');

// In-memory data stores
const uploadedFiles = new Map();
const extractionJobs = new Map();
const activeAgents = new Map();
const webSocketClients = new Set();

// ==================== AGENT SYSTEM ====================

class AgentSystem {
  constructor() {
    this.agents = {
      extraction: new ExtractionAgent(),
      validation: new ValidationAgent(),
      enrichment: new EnrichmentAgent(),
      orchestrator: new OrchestratorAgent()
    };
  }
  
  async processDocuments(documents) {
    const jobId = `job-${uuidv4()}`;
    const logs = [];
    
    // Initialize job
    extractionJobs.set(jobId, {
      status: 'processing',
      startedAt: Date.now(),
      documents: documents.length,
      logs: []
    });
    
    // Phase 1: Extraction
    this.emitLog(jobId, 'orchestrator', 'Starting extraction pipeline...', 'start');
    
    const entities = [];
    for (const doc of documents) {
      this.emitLog(jobId, 'extraction', `Parsing ${doc.name}...`, 'thinking');
      const extracted = await this.agents.extraction.extract(doc.text, doc.name);
      entities.push(...extracted);
      this.emitLog(jobId, 'extraction', `Extracted ${extracted.length} entities from ${doc.name}`, 'success');
    }
    
    // Deduplicate
    const uniqueEntities = this.deduplicateEntities(entities);
    this.emitLog(jobId, 'orchestrator', `Deduplicated to ${uniqueEntities.length} unique entities`, 'info');
    
    // Phase 2: Validation
    this.emitLog(jobId, 'validation', 'Cross-referencing schema templates...', 'thinking');
    const validatedEntities = await this.agents.validation.validate(uniqueEntities);
    this.emitLog(jobId, 'validation', `Validated ${validatedEntities.length} entities`, 'success');
    
    // Phase 3: Enrichment
    this.emitLog(jobId, 'enrichment', 'Building knowledge graph...', 'thinking');
    const enriched = await this.agents.enrichment.enrich(validatedEntities);
    const knowledgeGraph = this.buildKnowledgeGraph(enriched);
    this.emitLog(jobId, 'enrichment', `Knowledge graph: ${knowledgeGraph.nodes.length} nodes, ${knowledgeGraph.edges.length} edges`, 'success');
    
    // Complete job
    const result = {
      jobId,
      status: 'completed',
      entities: enriched,
      knowledgeGraph,
      logs,
      summary: this.generateSummary(enriched),
      completedAt: Date.now()
    };
    
    extractionJobs.set(jobId, result);
    this.emitComplete(jobId, result);
    
    return result;
  }
  
  deduplicateEntities(entities) {
    const seen = new Map();
    const unique = [];
    
    for (const entity of entities) {
      const partNumber = entity.attributes?.find(a => 
        a.key?.toLowerCase().includes('part') || 
        a.key?.toLowerCase().includes('sku')
      )?.value;
      
      const key = `${entity.name?.toLowerCase()}:${partNumber || ''}`;
      
      if (!seen.has(key)) {
        seen.set(key, true);
        unique.push(entity);
      } else {
        // Merge attributes
        const existing = unique.find(e => e.name?.toLowerCase() === entity.name?.toLowerCase());
        if (existing && entity.attributes) {
          const existingKeys = new Set(existing.attributes.map(a => a.key));
          entity.attributes.forEach(attr => {
            if (!existingKeys.has(attr.key)) {
              existing.attributes.push(attr);
            }
          });
        }
      }
    }
    
    return unique;
  }
  
  buildKnowledgeGraph(entities) {
    const nodes = [];
    const edges = [];
    const nodeIds = new Set();
    
    entities.forEach((entity, entityIndex) => {
      const entityId = entity.id || `entity-${entityIndex}`;
      
      // Add entity node
      if (!nodeIds.has(entityId)) {
        nodeIds.add(entityId);
        nodes.push({
          id: entityId,
          label: entity.name?.substring(0, 30) || 'Unknown',
          type: 'product',
          size: 10 + (entity.confidence_score || 0.5) * 15,
          color: this.getEntityColor(entity.validation_status),
          confidence: entity.confidence_score || 0.5,
          data: entity
        });
      }
      
      // Add attribute nodes
      entity.attributes?.forEach((attr, attrIndex) => {
        const attrId = attr.id || `attr-${entityIndex}-${attrIndex}`;
        
        if (!nodeIds.has(attrId)) {
          nodeIds.add(attrId);
          nodes.push({
            id: attrId,
            label: attr.key?.substring(0, 20) || `Attr ${attrIndex}`,
            type: 'attribute',
            size: 4 + (attr.confidence_score || 0.5) * 8,
            color: this.getConfidenceColor(attr.confidence_score || 0.5),
            confidence: attr.confidence_score || 0.5,
            data: attr
          });
        }
        
        edges.push({
          id: `edge-${entityId}-${attrId}`,
          source: entityId,
          target: attrId,
          label: 'has_attribute',
          weight: attr.confidence_score || 0.5
        });
      });
      
      // Add relationship edges
      entity.relationships?.forEach((rel, relIndex) => {
        const targetId = rel.target;
        const targetNode = entities.find(e => e.name === rel.target);
        
        if (targetNode) {
          edges.push({
            id: `rel-${entityId}-${relIndex}`,
            source: entityId,
            target: targetNode.id || `entity-${entities.indexOf(targetNode)}`,
            label: rel.relation || 'related_to',
            weight: 0.7
          });
        }
      });
    });
    
    return { nodes, edges };
  }
  
  getEntityColor(status) {
    const colors = {
      'approved': '#34D399',
      'auto_validated': '#38BDF8',
      'needs_review': '#FBBF24',
      'pending': '#A78BFA',
      'rejected': '#F87171'
    };
    return colors[status] || '#38BDF8';
  }
  
  getConfidenceColor(confidence) {
    if (confidence >= 0.85) return '#34D399';
    if (confidence >= 0.60) return '#38BDF8';
    if (confidence >= 0.40) return '#FBBF24';
    return '#F87171';
  }
  
  generateSummary(entities) {
    const totalAttributes = entities.reduce((sum, e) => sum + (e.attributes?.length || 0), 0);
    const avgConfidence = entities.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / entities.length;
    
    return {
      totalEntities: entities.length,
      totalAttributes,
      averageConfidence: avgConfidence.toFixed(2),
      approved: entities.filter(e => e.validation_status === 'approved').length,
      needsReview: entities.filter(e => e.validation_status === 'needs_review').length,
      rejected: entities.filter(e => e.validation_status === 'rejected').length
    };
  }
  
  emitLog(jobId, agent, message, level) {
    const log = {
      jobId,
      agent,
      message,
      level,
      timestamp: Date.now()
    };
    
    const job = extractionJobs.get(jobId);
    if (job) {
      job.logs.push(log);
    }
    
    // Emit via WebSocket
    io.emit('agent_log', log);
  }
  
  emitComplete(jobId, result) {
    io.emit('extraction_complete', result);
  }
}

// Individual Agent Classes
class ExtractionAgent {
  async extract(text, sourceFile) {
    if (!groq) return this.mockExtract(text, sourceFile);
    
    const systemPrompt = `You are an expert industrial product data extraction AI.
Extract ALL product entities and their attributes from the given text.
Return a JSON array where each entity has:
- name: Product name
- entity_type: Always "product"
- attributes: Array of {key, value, data_type, unit, confidence_score}
- relationships: Array of {target, relation}

Guidelines:
1. Extract ALL relevant attributes (part numbers, materials, dimensions, specs)
2. Assign confidence scores (0.0-1.0) based on data clarity
3. Include units where applicable (mm, kg, kN, RPM, etc.)
4. Normalize values to standard formats
5. Never fabricate information
6. If uncertain, assign lower confidence

Return ONLY valid JSON. No explanations.`;
    
    try {
      const completion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract product data from:\n\n${text.substring(0, 12000)}` }
        ],
        temperature: 0.2,
        max_tokens: 6000,
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(completion.choices[0].message.content);
      const entities = Array.isArray(result) ? result : (result.entities || []);
      
      return entities.map((e, i) => ({
        ...e,
        id: `entity-${Date.now()}-${i}`,
        confidence_score: this.calculateEntityConfidence(e),
        validation_status: 'pending',
        source: sourceFile,
        extracted_at: new Date().toISOString(),
        attributes: (e.attributes || []).map((a, j) => ({
          ...a,
          id: `attr-${Date.now()}-${i}-${j}`,
          confidence_score: a.confidence_score || 0.7,
          validation_status: 'pending',
          sources: [{
            source_type: 'extraction',
            file_name: sourceFile,
            excerpt: text.substring(0, 200)
          }]
        }))
      }));
      
    } catch (error) {
      console.error('Groq extraction error:', error);
      return this.mockExtract(text, sourceFile);
    }
  }
  
  calculateEntityConfidence(entity) {
    const attrs = entity.attributes || [];
    if (attrs.length === 0) return 0.5;
    return attrs.reduce((sum, a) => sum + (a.confidence_score || 0.5), 0) / attrs.length;
  }
  
  mockExtract(text, sourceFile) {
    const entities = [];
    const lines = text.split('\n').filter(l => l.trim());
    let currentEntity = null;
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Detect new entity (lines without colons that aren't continuation)
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
          validation_status: 'pending',
          source: sourceFile
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
            unit: this.detectUnit(value),
            confidence_score: 0.7 + Math.random() * 0.25,
            validation_status: 'pending',
            sources: [{
              source_type: 'text_parse',
              file_name: sourceFile,
              excerpt: trimmed.substring(0, 150)
            }]
          });
        }
      }
    });
    
    if (currentEntity && currentEntity.attributes.length > 0) {
      entities.push(currentEntity);
    }
    
    // If no entities found, create from text
    if (entities.length === 0) {
      entities.push({
        id: `entity-${Date.now()}-0`,
        name: this.extractProductName(text) || 'Unknown Product',
        entity_type: 'product',
        attributes: [{
          id: `attr-${Date.now()}-0-0`,
          key: 'description',
          value: text.substring(0, 300),
          data_type: 'string',
          unit: null,
          confidence_score: 0.6,
          validation_status: 'needs_review',
          sources: [{
            source_type: 'text_parse',
            file_name: sourceFile,
            excerpt: text.substring(0, 150)
          }]
        }],
        relationships: [],
        validation_status: 'pending',
        source: sourceFile
      });
    }
    
    // Calculate entity confidence
    entities.forEach(e => {
      e.confidence_score = e.attributes.reduce((sum, a) => sum + a.confidence_score, 0) / e.attributes.length;
    });
    
    return entities;
  }
  
  extractProductName(text) {
    const patterns = [
      /([A-Z][a-zA-Z0-9-]+(?:\s+[A-Z][a-zA-Z0-9-]+){1,5})/,
      /Product[:\s]+([^\n]+)/i,
      /Name[:\s]+([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    
    return null;
  }
  
  detectUnit(value) {
    const unitPatterns = {
      'mm': /(\d+\.?\d*)\s*mm/i,
      'cm': /(\d+\.?\d*)\s*cm/i,
      'm': /(\d+\.?\d*)\s*m\b/i,
      'kg': /(\d+\.?\d*)\s*kg/i,
      'g': /(\d+\.?\d*)\s*g\b/i,
      'kN': /(\d+\.?\d*)\s*kN/i,
      'N': /(\d+\.?\d*)\s*N\b/i,
      'RPM': /(\d+\.?\d*)\s*RPM/i,
      '°C': /(\d+\.?\d*)\s*°?C/i,
      '°F': /(\d+\.?\d*)\s*°?F/i,
      'PSI': /(\d+\.?\d*)\s*PSI/i,
      'bar': /(\d+\.?\d*)\s*bar/i,
      'kW': /(\d+\.?\d*)\s*kW/i,
      'W': /(\d+\.?\d*)\s*W\b/i,
      'V': /(\d+\.?\d*)\s*V\b/i,
      'A': /(\d+\.?\d*)\s*A\b/i,
      'MPa': /(\d+\.?\d*)\s*MPa/i,
      'GPa': /(\d+\.?\d*)\s*GPa/i
    };
    
    for (const [unit, pattern] of Object.entries(unitPatterns)) {
      if (pattern.test(value)) return unit;
    }
    
    return null;
  }
}

class ValidationAgent {
  async validate(entities) {
    const schema = this.getSchema();
    
    return entities.map(entity => {
      const issues = [];
      const suggestions = [];
      
      // Check required attributes
      const requiredAttrs = schema.required_attributes;
      const entityKeys = (entity.attributes || []).map(a => a.key?.toLowerCase());
      
      requiredAttrs.forEach(required => {
        if (!entityKeys.includes(required.toLowerCase())) {
          issues.push(`Missing required attribute: ${required}`);
        }
      });
      
      // Validate confidence scores
      entity.attributes?.forEach(attr => {
        if (attr.confidence_score < 0.4) {
          issues.push(`Low confidence for ${attr.key}: ${(attr.confidence_score * 100).toFixed(0)}%`);
        }
        
        if (attr.confidence_score >= 0.85) {
          attr.validation_status = 'approved';
        } else if (attr.confidence_score >= 0.6) {
          attr.validation_status = 'approved';
        } else if (attr.confidence_score >= 0.4) {
          attr.validation_status = 'needs_review';
          suggestions.push(`Review ${attr.key} - confidence: ${(attr.confidence_score * 100).toFixed(0)}%`);
        } else {
          attr.validation_status = 'rejected';
          issues.push(`Rejected ${attr.key} - very low confidence`);
        }
      });
      
      // Set entity validation status
      if (issues.length === 0) {
        entity.validation_status = 'approved';
      } else if (issues.length <= 2) {
        entity.validation_status = 'needs_review';
      } else {
        entity.validation_status = 'needs_review';
      }
      
      entity.validation = {
        issues,
        suggestions,
        validated_at: new Date().toISOString(),
        schema_version: schema.version
      };
      
      return entity;
    });
  }
  
  getSchema() {
    return {
      version: '1.0',
      name: 'industrial_product',
      required_attributes: [
        'name', 'part_number', 'material', 
        'manufacturer', 'category'
      ],
      optional_attributes: [
        'description', 'specifications', 'dimensions',
        'weight', 'price', 'lead_time', 
        'certifications', 'applications'
      ],
      validation_rules: {
        part_number: {
          pattern: /^[A-Z0-9\-_]+$/,
          min_length: 3
        }
      }
    };
  }
}

class EnrichmentAgent {
  async enrich(entities) {
    return entities.map(entity => {
      // Add enrichment metadata
      entity.enriched = true;
      entity.enriched_at = new Date().toISOString();
      
      // Generate description if missing
      if (!entity.attributes?.find(a => a.key === 'description')) {
        entity.attributes.push({
          id: `attr-${Date.now()}-desc`,
          key: 'description',
          value: this.generateDescription(entity),
          data_type: 'string',
          unit: null,
          confidence_score: 0.75,
          validation_status: 'auto_validated',
          sources: [{
            source_type: 'ai_generated',
            file_name: 'AI Enrichment'
          }]
        });
      }
      
      // Classify category if missing
      if (!entity.attributes?.find(a => a.key === 'category')) {
        entity.attributes.push({
          id: `attr-${Date.now()}-cat`,
          key: 'category',
          value: this.classifyCategory(entity),
          data_type: 'string',
          unit: null,
          confidence_score: 0.8,
          validation_status: 'auto_validated',
          sources: [{
            source_type: 'ai_classification',
            file_name: 'AI Classification'
          }]
        });
      }
      
      return entity;
    });
  }
  
  generateDescription(entity) {
    const name = entity.name || 'Product';
    const material = entity.attributes?.find(a => a.key === 'material')?.value || 'high-quality materials';
    const category = entity.attributes?.find(a => a.key === 'category')?.value || 'industrial component';
    
    return `${name} is a premium ${category} manufactured from ${material}. Designed for industrial applications requiring reliability and performance. This component meets rigorous quality standards and is suitable for various manufacturing environments.`;
  }
  
  classifyCategory(entity) {
    const name = (entity.name || '').toLowerCase();
    const attributes = (entity.attributes || []).map(a => `${a.key}:${a.value}`.toLowerCase()).join(' ');
    
    if (name.includes('bearing') || attributes.includes('bearing')) return 'Bearings';
    if (name.includes('valve') || attributes.includes('valve')) return 'Valves';
    if (name.includes('motor') || attributes.includes('motor')) return 'Motors';
    if (name.includes('pump') || attributes.includes('pump')) return 'Pumps';
    if (name.includes('gear') || attributes.includes('gear')) return 'Gears';
    if (name.includes('actuator') || attributes.includes('actuator')) return 'Actuators';
    if (name.includes('sensor') || attributes.includes('sensor')) return 'Sensors';
    if (name.includes('fastener') || attributes.includes('fastener')) return 'Fasteners';
    if (name.includes('cylinder') || attributes.includes('cylinder')) return 'Cylinders';
    if (name.includes('coupling') || attributes.includes('coupling')) return 'Couplings';
    
    return 'Industrial Component';
  }
}

class OrchestratorAgent {
  async orchestrate(documents) {
    // This would be the main pipeline coordinator
    // For now, implemented in AgentSystem class
    return documents;
  }
}

// Instantiate agent system
const agentSystem = new AgentSystem();

// ==================== FILE PARSING ====================

async function parseFile(buffer, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  
  try {
    switch (ext) {
      case '.pdf':
        const pdfData = await pdfParse(buffer);
        return {
          text: pdfData.text,
          metadata: {
            pages: pdfData.numpages,
            info: pdfData.info
          }
        };
      
      case '.txt':
      case '.md':
        return {
          text: buffer.toString('utf-8'),
          metadata: { encoding: 'utf-8' }
        };
      
      case '.csv':
        const csvText = buffer.toString('utf-8');
        const csvResult = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        return {
          text: JSON.stringify(csvResult.data, null, 2),
          metadata: {
            rows: csvResult.data.length,
            columns: csvResult.meta.fields
          }
        };
      
      case '.xlsx':
      case '.xls':
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheets = {};
        workbook.SheetNames.forEach(name => {
          sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
        });
        return {
          text: JSON.stringify(sheets, null, 2),
          metadata: {
            sheets: workbook.SheetNames
          }
        };
      
      case '.docx':
        const docxResult = await mammoth.extractRawText({ buffer });
        return {
          text: docxResult.value,
          metadata: {
            messages: docxResult.messages
          }
        };
      
      case '.json':
        return {
          text: buffer.toString('utf-8'),
          metadata: { format: 'json' }
        };
      
      case '.xml':
        return {
          text: buffer.toString('utf-8'),
          metadata: { format: 'xml' }
        };
      
      default:
        return {
          text: buffer.toString('utf-8'),
          metadata: { format: 'text' }
        };
    }
  } catch (error) {
    console.error(`Parse error for ${fileName}:`, error);
    return {
      text: buffer.toString('utf-8') || '',
      metadata: { error: error.message }
    };
  }
}

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    groq_configured: !!groq,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    active_jobs: extractionJobs.size,
    uptime: process.uptime()
  });
});

// Upload files
app.post('/api/upload', upload.array('files'), async (req, res) => {
  try {
    const files = req.files || [];
    const parsedFiles = [];
    
    for (const file of files) {
      const parsed = await parseFile(file.buffer, file.originalname);
      
      const fileData = {
        id: `file-${uuidv4()}`,
        name: file.originalname,
        size: file.size,
        type: path.extname(file.originalname).toLowerCase(),
        text: parsed.text,
        metadata: parsed.metadata,
        preview: parsed.text.substring(0, 300),
        uploaded_at: new Date().toISOString()
      };
      
      uploadedFiles.set(fileData.id, fileData);
      parsedFiles.push({
        ...fileData,
        text: undefined // Don't send full text to client
      });
    }
    
    res.json({
      success: true,
      files: parsedFiles,
      message: `Uploaded ${parsedFiles.length} file(s)`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Extract data
app.post('/api/extract', async (req, res) => {
  try {
    const { fileIds, schemaTemplate } = req.body;
    
    // Get documents
    const documents = [];
    fileIds?.forEach(fileId => {
      const fileData = uploadedFiles.get(fileId);
      if (fileData) {
        documents.push({
          id: fileData.id,
          name: fileData.name,
          text: fileData.text
        });
      }
    });
    
    // If no file IDs, use text from request
    if (documents.length === 0 && req.body.text) {
      documents.push({
        id: `text-${uuidv4()}`,
        name: req.body.fileName || 'text_input.txt',
        text: req.body.text
      });
    }
    
    if (documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No documents to process'
      });
    }
    
    // Process through agent pipeline
    const result = await agentSystem.processDocuments(documents);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Validate entities
app.post('/api/validate', async (req, res) => {
  try {
    const { entities } = req.body;
    const validationAgent = agentSystem.agents.validation;
    const validated = await validationAgent.validate(entities);
    
    res.json({
      success: true,
      entities: validated,
      summary: agentSystem.generateSummary(validated)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export data
app.post('/api/export', (req, res) => {
  try {
    const { entities, format, includeCitations } = req.body;
    
    let exportData;
    let mimeType;
    let fileName;
    
    switch (format) {
      case 'csv':
        exportData = generateCSV(entities);
        mimeType = 'text/csv';
        fileName = `nexussync-export-${Date.now()}.csv`;
        break;
      
      case 'pim':
        exportData = generatePIM(entities, includeCitations);
        mimeType = 'application/json';
        fileName = `nexussync-pim-${Date.now()}.json`;
        break;
      
      default:
        exportData = generateJSON(entities, includeCitations);
        mimeType = 'application/json';
        fileName = `nexussync-export-${Date.now()}.json`;
    }
    
    res.json({
      success: true,
      data: exportData,
      format,
      fileName,
      mimeType,
      size: Buffer.byteLength(exportData)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

function generateCSV(entities) {
  const headers = ['name', 'part_number', 'material', 'manufacturer', 'category', 'confidence_score', 'validation_status'];
  const rows = [headers.join(',')];
  
  entities.forEach(e => {
    const row = [
      `"${(e.name || '').replace(/"/g, '""')}"`,
      `"${e.attributes?.find(a => a.key === 'part_number')?.value || ''}"`,
      `"${e.attributes?.find(a => a.key === 'material')?.value || ''}"`,
      `"${e.attributes?.find(a => a.key === 'manufacturer')?.value || ''}"`,
      `"${e.attributes?.find(a => a.key === 'category')?.value || ''}"`,
      (e.confidence_score || 0).toFixed(2),
      `"${e.validation_status || 'pending'}"`
    ];
    rows.push(row.join(','));
  });
  
  return rows.join('\n');
}

function generateJSON(entities, includeCitations) {
  const exportData = {
    schema_version: '1.0',
    export_id: `export-${uuidv4()}`,
    exported_at: new Date().toISOString(),
    product_count: entities.length,
    products: entities.map(e => {
      const product = {
        id: e.id,
        name: e.name,
        entity_type: e.entity_type,
        validation_status: e.validation_status,
        confidence_score: e.confidence_score,
        attributes: {}
      };
      
      e.attributes?.forEach(a => {
        product.attributes[a.key] = {
          value: a.value,
          data_type: a.data_type,
          unit: a.unit,
          confidence_score: a.confidence_score,
          validation_status: a.validation_status
        };
        
        if (includeCitations && a.sources) {
          product.attributes[a.key].citations = a.sources;
        }
      });
      
      return product;
    })
  };
  
  return JSON.stringify(exportData, null, 2);
}

function generatePIM(entities, includeCitations) {
  const pimData = {
    schema: 'PIM-1.0',
    export_id: `pim-${uuidv4()}`,
    timestamp: new Date().toISOString(),
    products: entities.map(e => ({
      sku: e.attributes?.find(a => a.key === 'part_number')?.value || e.id,
      name: e.name,
      category: e.attributes?.find(a => a.key === 'category')?.value || 'Uncategorized',
      manufacturer: e.attributes?.find(a => a.key === 'manufacturer')?.value,
      material: e.attributes?.find(a => a.key === 'material')?.value,
      specifications: e.attributes
        ?.filter(a => !['name', 'part_number', 'category', 'manufacturer', 'material'].includes(a.key))
        ?.reduce((acc, a) => {
          acc[a.key] = {
            value: a.value,
            unit: a.unit,
            confidence: a.confidence_score
          };
          return acc;
        }, {}),
      data_quality: {
        score: e.confidence_score,
        status: e.validation_status
      }
    }))
  };
  
  return JSON.stringify(pimData, null, 2);
}

// Download export
app.get('/api/download/:format', (req, res) => {
  // This would serve the exported file
  res.json({ message: 'Use POST /api/export to generate data' });
});

// Get schemas
app.get('/api/schemas/:name', (req, res) => {
  try {
    const { name } = req.params;
    const allowedSchemas = ['technical-spec', 'industrial-product', 'commerce-ready'];
    
    if (!allowedSchemas.includes(name)) {
      return res.status(400).json({ error: 'Invalid schema name' });
    }
    
    const schemaPath = path.join(__dirname, 'data', 'schemas', `${name}.json`);
    
    // Check if file exists
    if (!fs.existsSync(schemaPath)) {
      // Return default schema
      return res.json(getDefaultSchema(name));
    }
    
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    res.json(JSON.parse(schemaContent));
  } catch (error) {
    console.error('Schema endpoint error:', error);
    res.status(500).json({ error: 'Failed to load schema' });
  }
});

// Get all available schemas
app.get('/api/schemas', (req, res) => {
  try {
    const schemas = {};
    const schemaDir = path.join(__dirname, 'data', 'schemas');
    
    if (fs.existsSync(schemaDir)) {
      const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.json'));
      files.forEach(file => {
        const name = file.replace('.json', '');
        const filePath = path.join(schemaDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        schemas[name] = JSON.parse(content);
      });
    }
    
    // Ensure default schemas exist
    if (!schemas['industrial-product']) {
      schemas['industrial-product'] = getDefaultSchema('industrial-product');
    }
    if (!schemas['technical-spec']) {
      schemas['technical-spec'] = getDefaultSchema('technical-spec');
    }
    if (!schemas['commerce-ready']) {
      schemas['commerce-ready'] = getDefaultSchema('commerce-ready');
    }
    
    res.json(schemas);
  } catch (error) {
    console.error('Schemas list error:', error);
    res.status(500).json({ error: 'Failed to load schemas' });
  }
});

function getDefaultSchema(name) {
  const schemas = {
    'industrial-product': {
      version: '1.0',
      name: 'industrial_product',
      description: 'Industrial product information schema',
      required_fields: ['name', 'part_number', 'manufacturer', 'category'],
      optional_fields: ['description', 'specifications', 'dimensions', 'material', 'weight', 'price'],
      field_types: {
        name: 'string',
        part_number: 'string',
        manufacturer: 'string',
        category: 'string',
        description: 'string',
        specifications: 'object',
        dimensions: 'object',
        material: 'string',
        weight: 'number',
        price: 'number'
      }
    },
    'technical-spec': {
      version: '1.0',
      name: 'technical_specification',
      description: 'Technical specifications schema',
      required_fields: ['spec_name', 'value', 'unit', 'tolerance'],
      optional_fields: ['description', 'source', 'verified_on'],
      field_types: {
        spec_name: 'string',
        value: 'string',
        unit: 'string',
        tolerance: 'string',
        description: 'string',
        source: 'string',
        verified_on: 'date'
      }
    },
    'commerce-ready': {
      version: '1.0',
      name: 'commerce_ready',
      description: 'Commerce-ready product data schema',
      required_fields: ['product_id', 'title', 'price', 'availability'],
      optional_fields: ['description', 'images', 'categories', 'tags', 'reviews', 'ratings'],
      field_types: {
        product_id: 'string',
        title: 'string',
        description: 'string',
        price: 'number',
        availability: 'boolean',
        images: 'array',
        categories: 'array',
        tags: 'array',
        reviews: 'array',
        ratings: 'number'
      }
    }
  };
  
  return schemas[name] || {};
}

// WebSocket connection
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  webSocketClients.add(socket.id);
  
  socket.emit('connected', {
    message: 'Connected to NexusSync AI',
    groq_configured: !!groq,
    timestamp: Date.now()
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    webSocketClients.delete(socket.id);
  });
  
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
});

// Serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 NexusSync AI - Industrial Product Intelligence');
  console.log('='.repeat(60));
  console.log(`📍 Server:      http://localhost:${PORT}`);
  console.log(`🔌 WebSocket:   ws://localhost:${PORT}`);
  console.log(`🤖 Groq API:    ${groq ? '✅ Connected' : '⚠️  Mock Mode'}`);
  console.log(`📦 Model:       ${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'}`);
  console.log('='.repeat(60) + '\n');
});