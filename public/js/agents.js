/**
 * NexusSync AI - Agent System
 * Manages AI agent lifecycle and communication
 */

class AgentSystem {
  constructor() {
    this.agents = new Map();
    this.activeJobs = new Map();
    this.initialize();
  }

  /**
   * Initialize agent system
   */
  initialize() {
    this.registerAgent('extraction', {
      name: 'Extraction Agent',
      description: 'Parses unstructured text and extracts product entities',
      icon: '📄',
      color: '#38BDF8',
      status: 'idle'
    });
    
    this.registerAgent('validation', {
      name: 'Validation Agent',
      description: 'Cross-references against schema templates',
      icon: '✅',
      color: '#34D399',
      status: 'idle'
    });
    
    this.registerAgent('enrichment', {
      name: 'Enrichment Agent',
      description: 'Generates descriptions and classifications',
      icon: '✨',
      color: '#818CF8',
      status: 'idle'
    });
    
    this.registerAgent('orchestrator', {
      name: 'Orchestrator',
      description: 'Coordinates the entire pipeline',
      icon: '🎯',
      color: '#FBBF24',
      status: 'idle'
    });
  }

  /**
   * Register an agent
   * @param {string} id - Agent ID
   * @param {Object} config - Agent configuration
   */
  registerAgent(id, config) {
    this.agents.set(id, {
      id,
      ...config,
      logs: []
    });
  }

  /**
   * Get agent by ID
   * @param {string} id - Agent ID
   * @returns {Object} Agent object
   */
  getAgent(id) {
    return this.agents.get(id);
  }

  /**
   * Update agent status
   * @param {string} id - Agent ID
   * @param {string} status - New status
   */
  updateAgentStatus(id, status) {
    const agent = this.agents.get(id);
    if (agent) {
      agent.status = status;
      this.emitAgentUpdate(agent);
    }
  }

  /**
   * Add log to agent
   * @param {string} id - Agent ID
   * @param {string} message - Log message
   * @param {string} level - Log level
   */
  logAgentActivity(id, message, level = 'info') {
    const agent = this.agents.get(id);
    if (agent) {
      const log = {
        agent: id,
        agentName: agent.name,
        message,
        level,
        timestamp: Date.now()
      };
      
      agent.logs.push(log);
      this.emitLog(log);
    }
  }

  /**
   * Emit agent update event
   * @param {Object} agent - Updated agent
   */
  emitAgentUpdate(agent) {
    if (window.activityFeed) {
      window.activityFeed.updateAgentStatus(agent);
    }
  }

  /**
   * Emit log event
   * @param {Object} log - Log entry
   */
  emitLog(log) {
    if (window.activityFeed) {
      window.activityFeed.addLog(log);
    }
    
    if (window.dashboard) {
      window.dashboard.addAgentLog(log);
    }
  }

  /**
   * Start a new job
   * @param {string} type - Job type
   * @returns {string} Job ID
   */
  startJob(type) {
    const jobId = Utils.generateId('job');
    this.activeJobs.set(jobId, {
      id: jobId,
      type,
      status: 'running',
      startedAt: Date.now(),
      logs: []
    });
    
    return jobId;
  }

  /**
   * Complete a job
   * @param {string} jobId - Job ID
   * @param {Object} result - Job result
   */
  completeJob(jobId, result) {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.completedAt = Date.now();
      job.result = result;
    }
  }

  /**
   * Fail a job
   * @param {string} jobId - Job ID
   * @param {Error} error - Error object
   */
  failJob(jobId, error) {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.completedAt = Date.now();
      job.error = error.message;
    }
  }

  /**
   * Get all agents
   * @returns {Array<Object>} Array of agents
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get active jobs
   * @returns {Array<Object>} Array of active jobs
   */
  getActiveJobs() {
    return Array.from(this.activeJobs.values()).filter(job => job.status === 'running');
  }
}

// Initialize agent system
document.addEventListener('DOMContentLoaded', () => {
  window.agentSystem = new AgentSystem();
});