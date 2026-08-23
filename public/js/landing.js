/**
 * NexusSync AI - Landing Page Logic
 * Handles landing page interactions and transitions
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
      element.style.transform = 'translateY(30px)';
      
      setTimeout(() => {
        element.style.transition = 'all 0.8s ease-out';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, index * 200);
    });
  }

  /**
   * Initialize feature cards with hover effects
   */
  initializeFeatureCards() {
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      
      // Intersection Observer for scroll animations
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              card.style.transition = 'all 0.6s ease-out';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, index * 150);
            observer.unobserve(card);
          }
        });
      }, { threshold: 0.2 });
      
      observer.observe(card);
    });
  }

  /**
   * Initialize scroll animations
   */
  initializeScrollAnimations() {
    const scrollElements = document.querySelectorAll('.features-section');
    
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

/**
 * Force the window (and any main scroll containers) to the very top.
 * Temporarily disables CSS smooth-scrolling so the jump is instantaneous.
 */
function forceScrollTop() {
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;

  html.style.scrollBehavior = 'auto';

  // Classic + modern APIs
  window.scrollTo(0, 0);
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;               // Safari / older WebKit

  // Dashboard internal scroller (if present)
  const content = document.querySelector('.dashboard-content');
  if (content) content.scrollTop = 0;

  // Restore whatever the page had before
  html.style.scrollBehavior = previous || '';
}

/**
 * Enter dashboard view
 */
function enterDashboard() {
  const landingPage = document.getElementById('landingPage');
  const dashboard   = document.getElementById('dashboard');

  // Fade-out landing
  landingPage.style.opacity    = '0';
  landingPage.style.transform  = 'scale(0.95)';
  landingPage.style.transition = 'all 0.5s ease-in-out';

  setTimeout(() => {
    // Swap visibility
    landingPage.classList.add('hidden');
    dashboard.classList.remove('hidden');

    // Reset scroll *after* the layout change
    forceScrollTop();

    // Prepare dashboard for fade-in
    dashboard.style.opacity    = '0';
    dashboard.style.transform  = 'scale(0.95)';

    // Extra safety: re-assert scroll on the next two frames
    // (covers any reflow caused by the scale/opacity styles)
    requestAnimationFrame(() => {
      forceScrollTop();
      requestAnimationFrame(forceScrollTop);
    });

    // Fade-in
    setTimeout(() => {
      dashboard.style.transition = 'all 0.5s ease-in-out';
      dashboard.style.opacity    = '1';
      dashboard.style.transform  = 'scale(1)';
    }, 50);

    // Initialize dashboard logic
    if (window.dashboard) {
      window.dashboard.initialize();
    }
  }, 500);
}

/**
 * Return to landing page
 */
function backToLanding() {
  const landingPage = document.getElementById('landingPage');
  const dashboard   = document.getElementById('dashboard');

  // Fade-out dashboard
  dashboard.style.opacity    = '0';
  dashboard.style.transform  = 'scale(0.95)';
  dashboard.style.transition = 'all 0.5s ease-in-out';

  setTimeout(() => {
    // Swap visibility
    dashboard.classList.add('hidden');
    landingPage.classList.remove('hidden');

    // Reset scroll
    forceScrollTop();

    // Prepare landing for fade-in
    landingPage.style.opacity    = '0';
    landingPage.style.transform  = 'scale(0.95)';

    // Extra safety frames
    requestAnimationFrame(() => {
      forceScrollTop();
      requestAnimationFrame(forceScrollTop);
    });

    // Fade-in
    setTimeout(() => {
      landingPage.style.transition = 'all 0.5s ease-in-out';
      landingPage.style.opacity    = '1';
      landingPage.style.transform  = 'scale(1)';
    }, 50);
  }, 500);
}

// Initialize landing page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.landingPage = new LandingPage();
});