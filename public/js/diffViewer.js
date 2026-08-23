/**
 * NexusSync AI - Diff Viewer
 * Side-by-side comparison of raw vs enriched data
 */

class DiffViewer {
  constructor() {
    this.modal = null;
    this.initialize();
  }

  /**
   * Initialize diff viewer modal container
   */
  initialize() {
    let container = document.getElementById('modalContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'modalContainer';
      document.body.appendChild(container);
    }
    
    // Create diff modal root if not present
    let modal = document.getElementById('diffModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'diffModal';
      modal.className = 'diff-modal-backdrop hidden';
      modal.innerHTML = `
        <div class="diff-modal-dialog glass-card">
          <div class="diff-header">
            <div class="diff-title-wrap">
              <span class="badge badge-primary">Entity Comparison</span>
              <h3 id="diffEntityTitle">Raw vs. Enriched Data</h3>
            </div>
            <button class="btn btn-ghost btn-sm diff-close-btn" onclick="window.diffViewer.close()" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div class="diff-content" id="diffContentBody"></div>
          
          <div class="diff-summary" id="diffSummaryFooter"></div>
        </div>
      `;
      
      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.close();
        }
      });
      
      container.appendChild(modal);
    }
    
    this.modal = modal;
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
        this.close();
      }
    });
  }

  /**
   * Show diff between original and enriched entity
   */
  showDiff(entity) {
    if (!this.modal) this.initialize();
    if (!entity) return;
    
    const titleEl = document.getElementById('diffEntityTitle');
    if (titleEl) {
      titleEl.textContent = entity.name || 'Entity Comparison';
    }
    
    const attributes = entity.attributes || [];
    
    // Identify raw vs enriched attributes
    const rawAttrs = attributes.filter(a => !a.sources?.some(s => s.source_type === 'ai_generated' || s.source_type === 'ai_enrichment'));
    const enrichedAttrs = attributes;
    
    const contentBody = document.getElementById('diffContentBody');
    if (contentBody) {
      contentBody.innerHTML = `
        <div class="diff-columns-grid">
          <div class="diff-column original-col">
            <div class="column-header">
              <h5>Raw Extracted (${rawAttrs.length})</h5>
              <span class="column-subtext">Direct from source document</span>
            </div>
            <div class="diff-items-list">
              ${rawAttrs.length > 0 ? rawAttrs.map(attr => this.renderDiffItem(attr, false)).join('') : '<p class="empty-text">No raw attributes found</p>'}
            </div>
          </div>
          
          <div class="diff-column enriched-col">
            <div class="column-header">
              <h5>AI Enriched & Validated (${enrichedAttrs.length})</h5>
              <span class="column-subtext">Standardized schema & normalized units</span>
            </div>
            <div class="diff-items-list">
              ${enrichedAttrs.length > 0 ? enrichedAttrs.map(attr => this.renderDiffItem(attr, true)).join('') : '<p class="empty-text">No enriched attributes found</p>'}
            </div>
          </div>
        </div>
      `;
    }
    
    const summaryFooter = document.getElementById('diffSummaryFooter');
    if (summaryFooter) {
      const avgConfidence = Utils.average ? Utils.average(attributes.map(a => a.confidence_score || 0)) : 0.85;
      summaryFooter.innerHTML = `
        <div class="summary-chips">
          <span class="summary-chip">
            <strong>${attributes.length}</strong> Total Attributes
          </span>
          <span class="summary-chip">
            <strong>${(avgConfidence * 100).toFixed(0)}%</strong> Avg Confidence
          </span>
          <span class="summary-chip status-${entity.validation_status || 'pending'}">
            Status: ${(entity.validation_status || 'Pending').toUpperCase()}
          </span>
        </div>
        <button class="btn btn-outline btn-sm" onclick="window.diffViewer.close()">Close Preview</button>
      `;
    }
    
    this.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Render diff item
   */
  renderDiffItem(attr, isEnriched = false) {
    const confidenceColor = Utils.getConfidenceColor(attr.confidence_score || 0);
    const scorePct = ((attr.confidence_score || 0) * 100).toFixed(0);
    
    return `
      <div class="diff-item ${isEnriched ? 'is-enriched' : ''}">
        <div class="diff-item-main">
          <span class="diff-key">${Utils.escapeHtml(attr.key)}</span>
          <span class="diff-value">${Utils.escapeHtml(String(attr.value))}</span>
          ${attr.unit ? `<span class="diff-unit-tag">${Utils.escapeHtml(attr.unit)}</span>` : ''}
        </div>
        <div class="diff-item-meta">
          <span class="diff-confidence-tag" style="color: ${confidenceColor};">
            ${scorePct}%
          </span>
          ${isEnriched && attr.validation_status ? `
            <span class="diff-status-tag status-${attr.validation_status}">${attr.validation_status}</span>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Close diff viewer
   */
  close() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
    document.body.style.overflow = '';
  }
}

// Initialize diff viewer
document.addEventListener('DOMContentLoaded', () => {
  window.diffViewer = new DiffViewer();
});