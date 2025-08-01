/* ========================================
   🎭 TRADEBRO INTERACTIVE ANIMATIONS
   Card swap and magnetic effects
   ======================================== */

class TradeBroAnimations {
  constructor() {
    this.init();
  }

  init() {
    this.initCardSwap();
    this.initMagneticElements();
    this.initTypingAnimation();
    this.initScrollAnimations();
    this.initVoiceButton();
  }

  /* ========================================
     🔄 CARD SWAP ANIMATION
     ======================================== */
  initCardSwap() {
    const cardSwaps = document.querySelectorAll('.card-swap');
    
    cardSwaps.forEach(card => {
      let isFlipped = false;
      
      // Auto-flip every 5 seconds
      const autoFlip = setInterval(() => {
        card.classList.toggle('flipped');
        isFlipped = !isFlipped;
      }, 5000);
      
      // Manual flip on click
      card.addEventListener('click', () => {
        clearInterval(autoFlip);
        card.classList.toggle('flipped');
        isFlipped = !isFlipped;
        
        // Restart auto-flip after manual interaction
        setTimeout(() => {
          const newAutoFlip = setInterval(() => {
            card.classList.toggle('flipped');
            isFlipped = !isFlipped;
          }, 5000);
        }, 3000);
      });
      
      // Pause auto-flip on hover
      card.addEventListener('mouseenter', () => {
        clearInterval(autoFlip);
      });
    });
  }

  /* ========================================
     🧲 MAGNETIC HOVER EFFECTS
     ======================================== */
  initMagneticElements() {
    const magneticElements = document.querySelectorAll('.magnetic-element');
    
    magneticElements.forEach(element => {
      element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        const moveX = x * 0.1;
        const moveY = y * 0.1;
        
        element.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;
        element.classList.add('magnetic-active');
      });
      
      element.addEventListener('mouseleave', () => {
        element.style.transform = 'translate(0px, 0px) scale(1)';
        element.classList.remove('magnetic-active');
      });
    });
  }

  /* ========================================
     ⌨️ TYPING ANIMATION
     ======================================== */
  initTypingAnimation() {
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;
    
    const messages = [
      "Hello! I'm Saytrix, your AI trading assistant.",
      "I can help you analyze market trends and data.",
      "Ask me about stocks, portfolios, or market news.",
      "Let's make smart trading decisions together!"
    ];
    
    let messageIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    const typeSpeed = 100;
    const deleteSpeed = 50;
    const pauseTime = 2000;
    
    function type() {
      const currentMessage = messages[messageIndex];
      
      if (isDeleting) {
        typingElement.textContent = currentMessage.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typingElement.textContent = currentMessage.substring(0, charIndex + 1);
        charIndex++;
      }
      
      let speed = isDeleting ? deleteSpeed : typeSpeed;
      
      if (!isDeleting && charIndex === currentMessage.length) {
        speed = pauseTime;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        messageIndex = (messageIndex + 1) % messages.length;
      }
      
      setTimeout(type, speed);
    }
    
    type();
  }

  /* ========================================
     📜 SCROLL ANIMATIONS
     ======================================== */
  initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);
    
    // Observe elements with reveal animations
    const revealElements = document.querySelectorAll(
      '.reveal-up, .reveal-down, .reveal-left, .reveal-right, .reveal-scale'
    );
    
    revealElements.forEach(element => {
      observer.observe(element);
    });
    
    // Stagger animation for command cards
    const staggerContainers = document.querySelectorAll('.stagger-container');
    staggerContainers.forEach(container => {
      const items = container.querySelectorAll('.stagger-item');
      
      const staggerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            items.forEach((item, index) => {
              setTimeout(() => {
                item.classList.add('animate-in');
              }, index * 100);
            });
          }
        });
      }, observerOptions);
      
      staggerObserver.observe(container);
    });
  }

  /* ========================================
     🎤 VOICE BUTTON ANIMATION
     ======================================== */
  initVoiceButton() {
    const voiceButton = document.querySelector('.voice-command-btn');
    if (!voiceButton) return;
    
    let isListening = false;
    
    voiceButton.addEventListener('click', () => {
      isListening = !isListening;
      
      if (isListening) {
        voiceButton.classList.add('listening');
        voiceButton.style.animation = 'pulseGlow 1s ease-in-out infinite';
        
        // Simulate voice recognition
        setTimeout(() => {
          isListening = false;
          voiceButton.classList.remove('listening');
          voiceButton.style.animation = '';
          
          // Show response animation
          this.showVoiceResponse();
        }, 3000);
      }
    });
  }

  showVoiceResponse() {
    // Create temporary response indicator
    const response = document.createElement('div');
    response.className = 'voice-response';
    response.innerHTML = `
      <div class="response-icon">🤖</div>
      <div class="response-text">Processing your request...</div>
    `;
    
    response.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-elevated);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl);
      padding: var(--space-xl);
      box-shadow: var(--shadow-2xl);
      z-index: var(--z-modal);
      display: flex;
      align-items: center;
      gap: var(--space-md);
      animation: scaleIn 0.3s ease-out;
    `;
    
    document.body.appendChild(response);
    
    setTimeout(() => {
      response.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => {
        document.body.removeChild(response);
      }, 300);
    }, 2000);
  }

  /* ========================================
     🎨 THEME TOGGLE
     ======================================== */
  static initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Update button icon
      themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
      
      // Add rotation animation
      themeToggle.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        themeToggle.style.transform = '';
      }, 300);
    });
    
    // Set initial icon
    themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }
}

  /* ========================================
     🎪 COMMAND CARD INTERACTIONS
     ======================================== */
  initCommandCards() {
    const commandCards = document.querySelectorAll('.command-card');

    commandCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        // Add glow effect to nearby cards
        commandCards.forEach(otherCard => {
          if (otherCard !== card) {
            otherCard.style.opacity = '0.7';
            otherCard.style.transform = 'scale(0.95)';
          }
        });
      });

      card.addEventListener('mouseleave', () => {
        // Reset all cards
        commandCards.forEach(otherCard => {
          otherCard.style.opacity = '';
          otherCard.style.transform = '';
        });
      });

      // Click animation
      card.addEventListener('click', () => {
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          card.style.transform = '';
        }, 150);

        // Trigger action based on card type
        const cardType = card.dataset.action;
        this.handleCardAction(cardType);
      });
    });
  }

  handleCardAction(action) {
    const actions = {
      portfolio: () => console.log('Opening portfolio...'),
      news: () => console.log('Loading market news...'),
      analysis: () => console.log('Starting analysis...'),
      trading: () => console.log('Opening trading interface...')
    };

    if (actions[action]) {
      actions[action]();
    }
  }
}

/* ========================================
   🚀 INITIALIZE ANIMATIONS
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {
  new TradeBroAnimations();
  TradeBroAnimations.initThemeToggle();
});

// Add CSS for additional animations
const additionalStyles = `
  @keyframes fadeOut {
    from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    to { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
  }

  .voice-command-btn.listening {
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.8) !important;
  }

  .animate-in {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

export default TradeBroAnimations;
