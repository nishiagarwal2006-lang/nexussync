/**
 * NexusSync AI - Knowledge Graph Visualization
 * Interactive force-directed graph using Canvas API
 */

class KnowledgeGraph {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.nodes = [];
    this.edges = [];
    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.hoveredNode = null;
    this.selectedNode = null;
    this.animationFrame = null;
    this.frameCount = 0;
    this.initialized = false;
    // Don't initialize immediately - wait until canvas is needed
  }

  /**
   * Initialize knowledge graph (lazy initialization)
   */
  initialize() {
    if (this.initialized) return;
    
    this.canvas = document.getElementById('knowledgeGraph');
    if (!this.canvas) {
      console.warn('Knowledge graph canvas not found');
      return;
    }
    
    // Make sure it's a canvas element
    if (this.canvas.tagName !== 'CANVAS') {
      console.error('Knowledge graph element is not a canvas');
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      console.error('Failed to get 2D context');
      return;
    }
    
    this.setupEventListeners();
    this.resizeCanvas();
    this.initialized = true;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
  }

  /**
   * Resize canvas to container
   */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height || 500;
  }

  /**
   * Render knowledge graph
   * @param {HTMLElement} container - Container element
   * @param {Object} graphData - Graph data
   */
  render(container, graphData) {
    // Ensure initialization
    if (!this.initialized) {
      this.initialize();
    }
    
    if (!this.canvas || !this.ctx || !graphData) {
      console.warn('Cannot render knowledge graph - canvas or data missing');
      return;
    }
    
    this.nodes = graphData.nodes.map(node => ({
      ...node,
      x: node.x || Math.random() * this.canvas.width,
      y: node.y || Math.random() * this.canvas.height,
      vx: 0,
      vy: 0
    }));
    
    this.edges = graphData.edges || [];
    this.frameCount = 0;
    
    this.startAnimation();
  }

  /**
   * Start animation loop
   */
  startAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.animate();
  }

  /**
   * Animation loop
   */
  animate() {
    if (this.frameCount < 100) {
      this.simulateForces();
      this.frameCount++;
    }
    
    this.draw();
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  /**
   * Simulate force-directed layout
   */
  simulateForces() {
    const repulsionForce = CONFIG.GRAPH.REPULSION_FORCE;
    const attractionForce = CONFIG.GRAPH.ATTRACTION_FORCE;
    const centeringForce = CONFIG.GRAPH.CENTERING_FORCE;
    const maxDisplacement = CONFIG.GRAPH.MAX_DISPLACEMENT;
    const damping = CONFIG.GRAPH.DAMPING;
    
    // Repulsion between all nodes
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[j].x - this.nodes[i].x;
        const dy = this.nodes[j].y - this.nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = repulsionForce / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        this.nodes[i].vx -= fx;
        this.nodes[i].vy -= fy;
        this.nodes[j].vx += fx;
        this.nodes[j].vy += fy;
      }
    }
    
    // Attraction along edges
    this.edges.forEach(edge => {
      const source = this.nodes.find(n => n.id === edge.source);
      const target = this.nodes.find(n => n.id === edge.target);
      
      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = dist * attractionForce;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }
    });
    
    // Centering force
    this.nodes.forEach(node => {
      node.vx += (this.canvas.width / 2 - node.x) * centeringForce;
      node.vy += (this.canvas.height / 2 - node.y) * centeringForce;
      
      // Apply damping
      node.vx *= damping;
      node.vy *= damping;
      
      // Limit displacement
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > maxDisplacement) {
        node.vx = (node.vx / speed) * maxDisplacement;
        node.vy = (node.vy / speed) * maxDisplacement;
      }
      
      node.x += node.vx;
      node.y += node.vy;
    });
  }

  /**
   * Draw the graph
   */
  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply zoom and offset
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.zoom, this.zoom);
    
    // Draw edges
    this.edges.forEach(edge => {
      const source = this.nodes.find(n => n.id === edge.source);
      const target = this.nodes.find(n => n.id === edge.target);
      
      if (source && target) {
        const isSelected = this.selectedNode && 
          (source.id === this.selectedNode.id || target.id === this.selectedNode.id);
        
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = isSelected 
          ? 'rgba(56, 189, 248, 0.8)' 
          : 'rgba(129, 140, 248, 0.4)';
        ctx.lineWidth = isSelected ? 2 : Math.max(0.5, edge.weight || 1);
        ctx.stroke();
      }
    });
    
    // Draw nodes
    this.nodes.forEach(node => {
      const isSelected = this.selectedNode && node.id === this.selectedNode.id;
      const isHovered = this.hoveredNode && node.id === this.hoveredNode.id;
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size || 8, 0, Math.PI * 2);
      
      const color = node.color || '#38BDF8';
      ctx.fillStyle = isSelected 
        ? 'rgba(56, 189, 248, 0.9)' 
        : isHovered 
          ? 'rgba(56, 189, 248, 0.7)' 
          : color;
      ctx.fill();
      
      // Node border
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();
      
      // Glow effect for selected/hovered
      if (isSelected || isHovered) {
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      // Node label
      if (node.size > 6 || isHovered || isSelected) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `${isSelected ? 'bold ' : ''}11px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(
          node.label || node.id, 
          node.x, 
          node.y - (node.size || 8) - 5
        );
      }
    });
    
    ctx.restore();
  }

  /**
   * Handle mouse move
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offsetX) / this.zoom;
    const y = (e.clientY - rect.top - this.offsetY) / this.zoom;
    
    // Check for node hover
    let foundNode = null;
    for (const node of this.nodes) {
      const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      if (dist < (node.size || 8) + 5) {
        foundNode = node;
        break;
      }
    }
    
    this.hoveredNode = foundNode;
    this.canvas.style.cursor = foundNode ? 'pointer' : 'default';
    
    if (this.isDragging) {
      this.offsetX += e.clientX - this.dragStartX;
      this.offsetY += e.clientY - this.dragStartY;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    }
  }

  /**
   * Handle mouse down
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseDown(e) {
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
  }

  /**
   * Handle mouse up
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseUp(e) {
    this.isDragging = false;
    
    // Check for node selection
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offsetX) / this.zoom;
    const y = (e.clientY - rect.top - this.offsetY) / this.zoom;
    
    for (const node of this.nodes) {
      const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      if (dist < (node.size || 8) + 5) {
        this.selectedNode = node;
        this.onNodeSelect(node);
        break;
      }
    }
  }

  /**
   * Handle mouse leave
   */
  handleMouseLeave() {
    this.hoveredNode = null;
    this.isDragging = false;
  }

  /**
   * Handle wheel zoom
   * @param {WheelEvent} e - Wheel event
   */
  handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoom = Math.max(0.3, Math.min(3, this.zoom * delta));
  }

  /**
   * Handle node selection
   * @param {Object} node - Selected node
   */
  onNodeSelect(node) {
    if (window.dashboard && node.data) {
      window.dashboard.setSelectedEntity(node.data);
    }
  }

  /**
   * Zoom in
   */
  zoomIn() {
    this.zoom = Math.min(3, this.zoom * 1.2);
  }

  /**
   * Zoom out
   */
  zoomOut() {
    this.zoom = Math.max(0.3, this.zoom / 1.2);
  }

  /**
   * Reset view
   */
  resetView() {
    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.selectedNode = null;
  }
}

// Initialize knowledge graph
document.addEventListener('DOMContentLoaded', () => {
  window.knowledgeGraph = new KnowledgeGraph();
});