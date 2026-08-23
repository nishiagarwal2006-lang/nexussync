/**
 * NexusSync AI - Particle Background System
 * Creates animated particle effects for the landing page
 */

class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.colors = ['#38BDF8', '#818CF8', '#34D399', '#FBBF24', '#F87171'];
    this.animationFrame = null;
    this.isRunning = false;
    
    this.init();
  }

  /**
   * Initialize particle system
   */
  init() {
    this.resizeCanvas();
    this.createParticles();
    this.startAnimation();
    
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.createParticles();
    });
  }

  /**
   * Resize canvas to window size
   */
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Create initial particles
   */
  createParticles() {
    this.particles = [];
    const count = Math.min(
      Math.floor((this.canvas.width * this.canvas.height) / 15000),
      CONFIG.UI.PARTICLE_COUNT
    );
    
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  /**
   * Create a single particle
   * @returns {Object} Particle object
   */
  createParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      life: 0,
      maxLife: Math.random() * 300 + 100
    };
  }

  /**
   * Start animation loop
   */
  startAnimation() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  /**
   * Stop animation loop
   */
  stopAnimation() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isRunning) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles.forEach((particle, index) => {
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.life++;
      
      // Wrap around edges
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;
      
      // Calculate opacity with fade in/out
      let alpha = particle.opacity;
      if (particle.life < 50) {
        alpha = particle.opacity * (particle.life / 50);
      }
      if (particle.life > particle.maxLife - 50) {
        alpha = particle.opacity * ((particle.maxLife - particle.life) / 50);
      }
      
      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.globalAlpha = Math.max(0, alpha);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
      
      // Add glow effect
      if (particle.size > 2) {
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
      
      // Reset particle if life exceeded
      if (particle.life >= particle.maxLife) {
        this.particles[index] = this.createParticle();
      }
    });
    
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }
}

// Initialize particles when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const particleSystem = new ParticleSystem('particleCanvas');
  window.particleSystem = particleSystem;
});