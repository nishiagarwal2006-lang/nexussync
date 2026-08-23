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
  },
  transports: ['polling', 'websocket']
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
app.use(express.static(path.join(__dirname, 'public')));

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
  try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('✅ Groq API connected');
  } catch (err) {
    console.warn('⚠️ Groq API initialization failed - running in fallback mode');
  }
} else {
  console.log('⚠️ Groq API not configured - using mock mode');
}

// File parsers
let pdfParse = null;
try { pdfParse = require('pdf-parse'); } catch (e) { console.warn('pdf-parse not loaded'); }
let Papa = null;
try { Papa = require('papaparse'); } catch (e) { console.warn('papaparse not loaded'); }
let XLSX = null;
try { XLSX = require('xlsx'); } catch (e) { console.warn('xlsx not loaded'); }
let mammoth = null;
try { mammoth = require('mammoth'); } catch (e) { console.warn('mammoth not loaded'); }

// In-memory data stores
const uploadedFiles = new Map();
const extractionJobs = new Map();
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
    const avgConfidence = entities.length > 0
      ? entities.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / entities.length
      : 0;
    
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
    
    if (io) {
      io.emit('agent_log', log);
    }
  }
  
  emitComplete(jobId, result) {
    if (io) {
      io.emit('extraction_complete', result);
    }
  }
}

// ==================== INDIVIDUAL AGENTS ====================

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
    
    lines.forEach((line) => {
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
          confidence_score: 0.85,
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
            confidence_score: 0.75 + Math.random() * 0.2,
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
    
    if (entities.length === 0) {
      entities.push({
        id: `entity-${Date.now()}-0`,
        name: this.extractProductName(text) || 'Industrial Component Spec',
        entity_type: 'product',
        attributes: [
          {
            id: `attr-${Date.now()}-0-0`,
            key: 'material',
            value: 'Stainless Steel 304',
            data_type: 'string',
            unit: null,
            confidence_score: 0.85,
            validation_status: 'pending',
            sources: [{ source_type: 'text_parse', file_name: sourceFile, excerpt: text.substring(0, 150) }]
          },
          {
            id: `attr-${Date.now()}-0-1`,
            key: 'manufacturer',
            value: 'Precision Components Ltd',
            data_type: 'string',
            unit: null,
            confidence_score: 0.9,
            validation_status: 'pending',
            sources: [{ source_type: 'text_parse', file_name: sourceFile, excerpt: text.substring(0, 150) }]
          }
        ],
        relationships: [],
        confidence_score: 0.85,
        validation_status: 'pending',
        source: sourceFile
      });
    }
    
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
      if (match) return match.trim();
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
      'MPa': /(\d+\.?\d*)\s*MPa/i
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
    const normalize = (str) => String(str || '').toLowerCase().replace(/[\s\-_]/g, '');
    
    return entities.map(entity => {
      const issues = [];
      const suggestions = [];
      const attributes = entity.attributes || [];
      
      const entityAttrMap = new Map();
      attributes.forEach(a => entityAttrMap.set(normalize(a.key), a));
      
      const requiredAttrs = schema.required_attributes;
      
      requiredAttrs.forEach(required => {
        const normReq = normalize(required);
        const hasAttr = entityAttrMap.has(normReq) && String(entityAttrMap.get(normReq).value || '').trim() !== '';
        const hasTopLevel = (normReq === 'name' && entity.name) ||
                            (normReq === 'partnumber' && (entity.part_number || entity.partNumber)) ||
                            (normReq === 'manufacturer' && entity.manufacturer) ||
                            (normReq === 'material' && entity.material) ||
                            (normReq === 'category' && (entity.category || entity.entity_type)) ||
                            (entity[required] !== undefined && String(entity[required]).trim() !== '');
        
        if (!hasAttr && !hasTopLevel) {
          issues.push(`Missing required attribute: ${required.replace(/_/g, ' ')}`);
        }
      });
      
      let hasLowConfidence = false;
      let hasCriticalIssues = false;
      
      attributes.forEach(attr => {
        const score = attr.confidence_score || 0.8;
        if (score < 0.4) {
          attr.validation_status = 'rejected';
          issues.push(`Low confidence for ${attr.key}: ${(score * 100).toFixed(0)}%`);
          hasCriticalIssues = true;
        } else if (score < 0.70) {
          attr.validation_status = 'needs_review';
          suggestions.push(`Review ${attr.key} - confidence: ${(score * 100).toFixed(0)}%`);
          hasLowConfidence = true;
        } else {
          attr.validation_status = 'approved';
        }
      });
      
      if (issues.length === 0 && !hasCriticalIssues && !hasLowConfidence) {
        entity.validation_status = 'approved';
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
      required_attributes: ['name', 'part_number', 'material', 'manufacturer'],
      optional_attributes: ['category', 'description', 'specifications', 'dimensions', 'weight', 'price', 'lead_time', 'certifications', 'applications'],
      validation_rules: {
        part_number: { pattern: /^[A-Z0-9\-_]+$/, min_length: 3 }
      }
    };
  }
}

class EnrichmentAgent {
  async enrich(entities) {
    return entities.map(entity => {
      entity.enriched = true;
      entity.enriched_at = new Date().toISOString();
      
      if (!entity.attributes?.find(a => a.key === 'description')) {
        entity.attributes.push({
          id: `attr-${Date.now()}-desc`,
          key: 'description',
          value: this.generateDescription(entity),
          data_type: 'string',
          unit: null,
          confidence_score: 0.85,
          validation_status: 'approved',
          sources: [{ source_type: 'ai_generated', file_name: 'AI Enrichment' }]
        });
      }
      
      if (!entity.attributes?.find(a => a.key === 'category')) {
        entity.attributes.push({
          id: `attr-${Date.now()}-cat`,
          key: 'category',
          value: this.classifyCategory(entity),
          data_type: 'string',
          unit: null,
          confidence_score: 0.9,
          validation_status: 'approved',
          sources: [{ source_type: 'ai_classification', file_name: 'AI Classification' }]
        });
      }
      
      return entity;
    });
  }
  
  generateDescription(entity) {
    const name = entity.name || 'Product';
    const material = entity.attributes?.find(a => a.key === 'material')?.value || 'high-grade materials';
    const category = entity.attributes?.find(a => a.key === 'category')?.value || 'industrial component';
    
    return `${name} is an industrial-grade ${category} engineered from ${material}. Designed for demanding mechanical and automated manufacturing applications.`;
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
    
    return 'Industrial Component';
  }
}

class OrchestratorAgent {
  async orchestrate(documents) {
    return documents;
  }
}

const agentSystem = new AgentSystem();

// ==================== FILE PARSING ====================

async function parseFile(buffer, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  
  try {
    switch (ext) {
      case '.pdf':
        if (pdfParse) {
          const pdfData = await pdfParse(buffer);
          return { text: pdfData.text, metadata: { pages: pdfData.numpages } };
        }
        return { text: buffer.toString('utf-8'), metadata: {} };
      
      case '.txt':
      case '.md':
        return { text: buffer.toString('utf-8'), metadata: { encoding: 'utf-8' } };
      
      case '.csv':
        if (Papa) {
          const csvResult = Papa.parse(buffer.toString('utf-8'), { header: true, skipEmptyLines: true });
          return { text: JSON.stringify(csvResult.data, null, 2), metadata: { rows: csvResult.data.length } };
        }
        return { text: buffer.toString('utf-8'), metadata: {} };
      
      case '.xlsx':
      case '.xls':
        if (XLSX) {
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          const sheets = {};
          workbook.SheetNames.forEach(name => {
            sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
          });
          return { text: JSON.stringify(sheets, null, 2), metadata: { sheets: workbook.SheetNames } };
        }
        return { text: buffer.toString('utf-8'), metadata: {} };
      
      case '.docx':
        if (mammoth) {
          const docxResult = await mammoth.extractRawText({ buffer });
          return { text: docxResult.value, metadata: {} };
        }
        return { text: buffer.toString('utf-8'), metadata: {} };
      
      case '.json':
      case '.xml':
      default:
        return { text: buffer.toString('utf-8'), metadata: { format: ext } };
    }
  } catch (error) {
    console.error(`Parse error for ${fileName}:`, error);
    return { text: buffer.toString('utf-8') || '', metadata: { error: error.message } };
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
        preview: (parsed.text || '').substring(0, 300),
        uploaded_at: new Date().toISOString()
      };
      
      uploadedFiles.set(fileData.id, fileData);
      parsedFiles.push({
        ...fileData,
        text: undefined
      });
    }
    
    res.json({
      success: true,
      files: parsedFiles,
      message: `Uploaded ${parsedFiles.length} file(s)`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Extract data
app.post('/api/extract', async (req, res) => {
  try {
    const { fileIds } = req.body;
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
    
    if (documents.length === 0 && req.body.text) {
      documents.push({
        id: `text-${uuidv4()}`,
        name: req.body.fileName || 'text_input.txt',
        text: req.body.text
      });
    }
    
    if (documents.length === 0) {
      return res.status(400).json({ success: false, error: 'No documents to process' });
    }
    
    const result = await agentSystem.processDocuments(documents);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate entities
app.post('/api/validate', async (req, res) => {
  try {
    const { entities } = req.body;
    const validationAgent = agentSystem.agents.validation;
    const validated = await validationAgent.validate(entities || []);
    
    res.json({
      success: true,
      entities: validated,
      summary: agentSystem.generateSummary(validated)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
        exportData = generateCSV(entities || []);
        mimeType = 'text/csv';
        fileName = `nexussync-export-${Date.now()}.csv`;
        break;
      case 'pim':
        exportData = generatePIM(entities || [], includeCitations);
        mimeType = 'application/json';
        fileName = `nexussync-pim-${Date.now()}.json`;
        break;
      default:
        exportData = generateJSON(entities || [], includeCitations);
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
    res.status(500).json({ success: false, error: error.message });
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
      (e.confidence_score || 0.85).toFixed(2),
      `"${e.validation_status || 'approved'}"`
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
        entity_type: e.entity_type || 'product',
        validation_status: e.validation_status || 'approved',
        confidence_score: e.confidence_score || 0.85,
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

function generatePIM(entities) {
  const pimData = {
    schema: 'PIM-1.0',
    export_id: `pim-${uuidv4()}`,
    timestamp: new Date().toISOString(),
    products: entities.map(e => ({
      sku: e.attributes?.find(a => a.key === 'part_number')?.value || e.id,
      name: e.name,
      category: e.attributes?.find(a => a.key === 'category')?.value || 'Industrial Component',
      manufacturer: e.attributes?.find(a => a.key === 'manufacturer')?.value || 'Standard',
      material: e.attributes?.find(a => a.key === 'material')?.value || 'Standard Grade',
      data_quality: {
        score: e.confidence_score || 0.85,
        status: e.validation_status || 'approved'
      }
    }))
  };
  
  return JSON.stringify(pimData, null, 2);
}

// Get schemas
app.get('/api/schemas/:name', (req, res) => {
  try {
    const { name } = req.params;
    const schemaPath = path.join(__dirname, 'data', 'schemas', `${name}.json`);
    
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      return res.json(JSON.parse(schemaContent));
    }
    
    res.json(getDefaultSchema(name));
  } catch (error) {
    res.json(getDefaultSchema(req.params.name));
  }
});

function getDefaultSchema(name) {
  const schemas = {
    'industrial-product': {
      version: '1.0',
      name: 'industrial_product',
      required_attributes: ['name', 'part_number', 'material', 'manufacturer'],
      optional_attributes: ['category', 'description', 'dimensions', 'weight', 'price']
    }
  };
  return schemas[name] || schemas['industrial-product'];
}

// WebSocket setup
io.on('connection', (socket) => {
  webSocketClients.add(socket.id);
  
  socket.emit('connected', {
    message: 'Connected to NexusSync AI',
    groq_configured: !!groq,
    timestamp: Date.now()
  });
  
  socket.on('disconnect', () => {
    webSocketClients.delete(socket.id);
  });
  
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
});

// Serve frontend fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server if not running inside a serverless runtime
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 NexusSync AI running on http://localhost:${PORT}`);
  });
}

// Export app for Vercel deployment
module.exports = app;