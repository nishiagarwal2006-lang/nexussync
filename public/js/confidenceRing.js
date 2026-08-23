/**
 * NexusSync AI - Confidence Ring Visualization
 * Animated circular progress indicators
 */

class ConfidenceRing {
  constructor() {
    this.rings = [];
    this.initialize();
  }

  /**
   * Initialize confidence ring module
   */
  initialize() {
    // Animation timing function
    this.easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  }

  /**
   * Render confidence rings
   * @param {HTMLElement} container - Container element
   * @param {Array<Object>} entities - Entities to visualize
   */
  renderRings(container, entities) {
    if (!container) return;
    
    if (entities.length === 0) {
      container.innerHTML = '<p class="text-muted">No data available</p>';
      return;
    }
    
    container.innerHTML = entities.map((entity, index) => {
      const confidence = entity.confidence_score || 0;
      const color = Utils.getConfidenceColor(confidence);
      
      return `
        <div class="confidence-ring-container" data-entity-id="${entity.id}">
          <svg width="80" height="80" viewBox="0 0 80 80" class="confidence-ring">
            <circle cx="40" cy="40" r="32" fill="none" 
                    stroke="rgba(255,255,255,0.1)" stroke-width="6"/>
            <circle cx="40" cy="40" r="32" fill="none" 
                    stroke="${color}" stroke-width="6" stroke-linecap="round"
                    stroke-dasharray="${2 * Math.PI * 32}"
                    stroke-dashoffset="${2 * Math.PI * 32 * (1 - confidence)}"
                    transform="rotate(-90 40 40)"
                    class="ring-progress"
                    style="transition: stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1);
                           filter: drop-shadow(0 0 8px ${color});"/>
          </svg>
          <div class="ring-label">
            <span class="ring-value" style="color: ${color}">
              ${(confidence * 100).toFixed(0)}%
            </span>
            <span class="ring-name">${Utils.truncateText(entity.name, 15)}</span>
          </div>
        </div>
      `;
    }).join('');
    
    // Animate rings after render
    requestAnimationFrame(() => {
      this.animateRings(container);
    });
  }

  /**
   * Animate confidence rings
   * @param {HTMLElement} container - Container element
   */
  animateRings(container) {
    const rings = container.querySelectorAll('.ring-progress');
    
    rings.forEach((ring, index) => {
      const targetOffset = parseFloat(ring.getAttribute('stroke-dashoffset'));
      ring.style.strokeDashoffset = ring.getAttribute('stroke-dasharray');
      
      setTimeout(() => {
        ring.style.strokeDashoffset = targetOffset;
      }, index * 100);
    });
  }

  /**
   * Render a single confidence ring
   * @param {HTMLElement} container - Container element
   * @param {number} confidence - Confidence score (0-1)
   * @param {string} label - Ring label
   * @param {number} size - Ring size in pixels
   */
  renderSingleRing(container, confidence, label, size = 100) {
    const color = Utils.getConfidenceColor(confidence);
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - confidence);
    
    container.innerHTML = `
      <div class="single-ring-container">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none"
                  stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
          <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none"
                  stroke="${color}" stroke-width="8" stroke-linecap="round"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${circumference}"
                  transform="rotate(-90 ${size/2} ${size/2})"
                  class="single-ring-progress"
                  style="transition: stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1);
                         filter: drop-shadow(0 0 10px ${color});"/>
        </svg>
        <div class="single-ring-label">
          <span class="single-ring-value" style="color: ${color}">
            ${(confidence * 100).toFixed(0)}%
          </span>
          ${label ? `<span class="single-ring-name">${Utils.escapeHtml(label)}</span>` : ''}
        </div>
      </div>
    `;
    
    requestAnimationFrame(() => {
      const ring = container.querySelector('.single-ring-progress');
      if (ring) {
        ring.style.strokeDashoffset = offset;
      }
    });
  }
}

// Initialize confidence ring module
document.addEventListener('DOMContentLoaded', () => {
  window.confidenceRing = new ConfidenceRing();
});