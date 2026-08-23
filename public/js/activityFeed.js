/**
 * NexusSync AI - Agent Activity Feed
 * Real-time streaming log display
 */

class ActivityFeed {
  constructor() {
    this.logs = [];
    this.container = null;
    this.maxLogs = 100;
    this.initialize();
  }

  /**
   * Initialize activity feed
   */
  initialize() {
    this.container = document.getElementById('activityFeed');
    this.renderEmptyState();
  }

  /**
   * Add a log entry
   */
  addLog(log) {
    if (!this.container) this.container = document.getElementById('activityFeed');
    
    const formattedLog = {
      ...log,
      timestamp: log.timestamp || Date.now()
    };
    
    this.logs.push(formattedLog);
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    this.renderLog(formattedLog);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    this.renderEmptyState();
  }

  /**
   * Render empty state
   */
  renderEmptyState() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="feed-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4B5563" stroke-width="1.5">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        <p>No agent activity yet</p>
        <p class="sub-text">Upload documents or load data to start</p>
      </div>
    `;
  }

  /**
   * Render single log entry
   */
  renderLog(log) {
    if (!this.container) return;
    
    const emptyState = this.container.querySelector('.feed-empty');
    if (emptyState) {
      this.container.innerHTML = '';
    }
    
    const logElement = document.createElement('div');
    logElement.className = `feed-entry feed-${log.level || 'info'}`;
    
    const icon = this.getLogIcon(log.level);
    const agentName = this.getAgentName(log.agent);
    const time = Utils.formatDate ? Utils.formatDate(log.timestamp) : new Date(log.timestamp).toLocaleTimeString();
    
    logElement.innerHTML = `
      <div class="feed-icon">${icon}</div>
      <div class="feed-content">
        <div class="feed-header">
          <span class="feed-agent">${agentName}</span>
          <span class="feed-time">${time}</span>
        </div>
        <p class="feed-message">${Utils.escapeHtml(log.message)}</p>
      </div>
    `;
    
    this.container.appendChild(logElement);
    this.container.scrollTop = this.container.scrollHeight;
  }

  /**
   * Get icon SVG based on log level
   */
  getLogIcon(level) {
    const icons = {
      'success': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>',
      'warning': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      'error': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      'thinking': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818CF8" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/></svg>',
      'start': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>'
    };
    
    return icons[level] || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
  }

  /**
   * Get agent display name
   */
  getAgentName(agentId) {
    const agents = {
      'extraction': 'Extraction Agent',
      'validation': 'Validation Agent',
      'enrichment': 'Enrichment Agent',
      'orchestrator': 'Orchestrator'
    };
    
    return agents[agentId] || agentId || 'Agent';
  }
}

// Initialize activity feed
document.addEventListener('DOMContentLoaded', () => {
  window.activityFeed = new ActivityFeed();
});