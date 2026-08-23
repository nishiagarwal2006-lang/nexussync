/**
 * NexusSync AI - Landing Page Logic
 * Handles landing page interactions and fast transitions
 */

class LandingPage {
  constructor() {
    this.landingPage = document.getElementById('landingPage');
    this.dashboard = document.getElementById('dashboard');
    this.initialize();
  }

  /**
   * Initialize landing page
   */
  initialize() {
    this.animateHeroElements();
    this.initializeFeatureCards();
    this.initializeScrollAnimations();
  }

  /**
   * Animate hero elements on load
   */
  animateHeroElements() {
    const elements = document.querySelectorAll('.hero-content > *');
    elements.forEach((element, index) => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        element.style.transition = 'all 0.5s ease-out';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  /**
   * Initialize feature cards with hover effects
   */
  initializeFeatureCards() {
    const cards = document.querySelectorAll('.feature-card');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.transition = 'all 0.4s ease-out';
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      
      cards.forEach(card => observer.observe(card));
    }
  }

  /**
   * Initialize scroll animations
   */
  initializeScrollAnimations() {
    const scrollElements = document.querySelectorAll('.features-section');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      
      scrollElements.forEach(element => observer.observe(element));
    }
  }
}

/**
 * Force the window to scroll to top instantly
 */
function forceScrollTop() {
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;

  html.style.scrollBehavior = 'auto';

  window.scrollTo(0, 0);
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const content = document.querySelector('.dashboard-content');
  if (content) content.scrollTop = 0;

  html.style.scrollBehavior = previous || '';
}

/**
 * Enter dashboard view (Fast 150ms transition)
 */
function enterDashboard() {
  const landingPage = document.getElementById('landingPage');
  const dashboard = document.getElementById('dashboard');
  if (!landingPage || !dashboard) return;

  landingPage.style.opacity = '0';
  landingPage.style.transform = 'scale(0.98)';
  landingPage.style.transition = 'all 0.15s ease-in-out';

  setTimeout(() => {
    landingPage.classList.add('hidden');
    dashboard.classList.remove('hidden');

    forceScrollTop();

    dashboard.style.opacity = '0';
    dashboard.style.transform = 'scale(0.98)';

    requestAnimationFrame(() => {
      dashboard.style.transition = 'all 0.15s ease-in-out';
      dashboard.style.opacity = '1';
      dashboard.style.transform = 'scale(1)';
    });

    if (window.dashboard && typeof window.dashboard.initialize === 'function') {
      window.dashboard.initialize();
    }
  }, 150);
}

/**
 * Return to landing page
 */
function backToLanding() {
  const landingPage = document.getElementById('landingPage');
  const dashboard = document.getElementById('dashboard');
  if (!landingPage || !dashboard) return;

  dashboard.style.opacity = '0';
  dashboard.style.transform = 'scale(0.98)';
  dashboard.style.transition = 'all 0.15s ease-in-out';

  setTimeout(() => {
    dashboard.classList.add('hidden');
    landingPage.classList.remove('hidden');

    forceScrollTop();

    landingPage.style.opacity = '0';
    landingPage.style.transform = 'scale(0.98)';

    requestAnimationFrame(() => {
      landingPage.style.transition = 'all 0.15s ease-in-out';
      landingPage.style.opacity = '1';
      landingPage.style.transform = 'scale(1)';
    });
  }, 150);
}

/**
 * Load sample data handler
 */
function loadSampleData() {
  enterDashboard();
  setTimeout(() => {
    if (window.sampleData && typeof window.sampleData.loadSampleData === 'function') {
      window.sampleData.loadSampleData();
    }
  }, 200);
}

// Attach globally
window.enterDashboard = enterDashboard;
window.backToLanding = backToLanding;
window.loadSampleData = loadSampleData;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.landingPage = new LandingPage();
});