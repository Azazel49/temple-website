/**
 * =====================================================
 * SRI DIVINE TEMPLE - Main JavaScript
 * Modern Indian Temple Website Functionality
 * =====================================================
 */

// =====================================================
// APPLICATION STATE & CONFIGURATION
// =====================================================
const TempleApp = {
  // Configuration
  config: {
    apiBaseUrl: '/api', // Placeholder for backend integration
    currency: '₹',
    defaultLanguage: 'en',
    toastDuration: 4000,
    scrollThreshold: 100,
    debounceDelay: 300
  },

  // State management
  state: {
    isMenuOpen: false,
    isScrolled: false,
    selectedPaymentMethod: null,
    selectedDonationAmount: null,
    currentModal: null
  }
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================
const Utils = {
  /**
   * Debounce function to limit function calls
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function for scroll events
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Format currency
   */
  formatCurrency(amount) {
    return `${TempleApp.config.currency}${amount.toLocaleString('en-IN')}`;
  },

  /**
   * Generate unique ID
   */
  generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number (Indian format)
   */
  isValidPhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  /**
   * Get current date in ISO format
   */
  getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  },

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  },

  /**
   * Smooth scroll to element
   */
  scrollToElement(element, offset = 80) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  },

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  }
};

// =====================================================
// TOAST NOTIFICATION SYSTEM
// =====================================================
const Toast = {
  container: null,

  init() {
    this.createContainer();
  },

  createContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = TempleApp.config.toastDuration) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${this.getIcon(type)}</span>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close notification">&times;</button>
    `;

    // Add close functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.remove(toast));

    // Auto remove after duration
    const autoRemove = setTimeout(() => this.remove(toast), duration);

    // Remove from DOM when animation ends
    toast.addEventListener('animationend', () => {
      if (toast.classList.contains('removing')) {
        toast.remove();
      }
    });

    this.container.appendChild(toast);
    return toast;
  },

  remove(toast) {
    toast.classList.add('removing');
    toast.style.animation = 'slideInRight 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  },

  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  },

  success(message) {
    return this.show(message, 'success');
  },

  error(message) {
    return this.show(message, 'error');
  },

  warning(message) {
    return this.show(message, 'warning');
  },

  info(message) {
    return this.show(message, 'info');
  }
};

// =====================================================
// MODAL SYSTEM
// =====================================================
const Modal = {
  activeModals: [],

  open(modalId) {
    const overlay = document.getElementById(modalId);
    if (!overlay) return;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.activeModals.push(modalId);

    // Focus first focusable element
    const modal = overlay.querySelector('.modal');
    if (modal) {
      const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) focusable.focus();
    }

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close(modalId);
    });

    // Close on escape key
    document.addEventListener('keydown', this.handleEscape);
  },

  close(modalId) {
    const overlay = document.getElementById(modalId);
    if (!overlay) return;

    overlay.classList.remove('active');
    this.activeModals = this.activeModals.filter(id => id !== modalId);

    if (this.activeModals.length === 0) {
      document.body.style.overflow = '';
    }

    document.removeEventListener('keydown', this.handleEscape);
  },

  closeAll() {
    this.activeModals.forEach(modalId => this.close(modalId));
  },

  handleEscape(e) {
    if (e.key === 'Escape' && Modal.activeModals.length > 0) {
      Modal.close(Modal.activeModals[Modal.activeModals.length - 1]);
    }
  }
};

// =====================================================
// NAVIGATION CONTROLLER
// =====================================================
const Navigation = {
  init() {
    this.setupMobileMenu();
    this.setupScrollBehavior();
    this.setupSmoothScrolling();
    this.setupActiveLinkHighlighting();
  },

  setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (!menuToggle || !navMenu) return;

    menuToggle.addEventListener('click', () => {
      TempleApp.state.isMenuOpen = !TempleApp.state.isMenuOpen;
      menuToggle.classList.toggle('active');
      navMenu.classList.toggle('active');

      // Update ARIA attributes
      const expanded = menuToggle.classList.contains('active');
      menuToggle.setAttribute('aria-expanded', expanded);
    });

    // Close menu when clicking on a link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
        TempleApp.state.isMenuOpen = false;
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (TempleApp.state.isMenuOpen && !navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
        TempleApp.state.isMenuOpen = false;
      }
    });
  },

  setupScrollBehavior() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const handleScroll = Utils.throttle(() => {
      const scrolled = window.scrollY > TempleApp.config.scrollThreshold;
      if (scrolled !== TempleApp.state.isScrolled) {
        TempleApp.state.isScrolled = scrolled;
        navbar.classList.toggle('scrolled', scrolled);
      }
    }, 100);

    window.addEventListener('scroll', handleScroll);
  },

  setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          Utils.scrollToElement(target);
        }
      });
    });
  },

  setupActiveLinkHighlighting() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (sections.length === 0 || navLinks.length === 0) return;

    const handleScroll = Utils.throttle(() => {
      const scrollPosition = window.scrollY + 100;

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, 150);

    window.addEventListener('scroll', handleScroll);
  }
};

// =====================================================
// SCROLL ANIMATIONS
// =====================================================
const ScrollAnimations = {
  init() {
    this.setupIntersectionObserver();
  },

  setupIntersectionObserver() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll, .link-card, .event-card, .testimonial-card, .timing-card');

    if (animatedElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          // Add staggered animation delay for cards
          if (entry.target.classList.contains('link-card') ||
              entry.target.classList.contains('event-card') ||
              entry.target.classList.contains('testimonial-card')) {
            const index = Array.from(entry.target.parentElement.children).indexOf(entry.target);
            entry.target.style.animationDelay = `${index * 0.1}s`;
          }

          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
  }
};

// =====================================================
// FORM HANDLING & VALIDATION
// =====================================================
const Forms = {
  init() {
    this.setupFormValidation();
    this.setupPaymentMethods();
    this.setupDonationAmounts();
  },

  setupFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');

    forms.forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isValid = this.validateForm(form);
        if (isValid) {
          await this.handleSubmit(form);
        }
      });

      // Real-time validation
      form.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('blur', () => this.validateField(field));
        field.addEventListener('input', Utils.debounce(() => {
          if (field.classList.contains('error')) {
            this.validateField(field);
          }
        }, 300));
      });
    });
  },

  validateForm(form) {
    let isValid = true;
    const fields = form.querySelectorAll('[required], [data-validation]');

    fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  },

  validateField(field) {
    const value = field.value.trim();
    const validationType = field.dataset.validation || field.type;
    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    }

    // Type-specific validation
    if (isValid && value) {
      switch (validationType) {
        case 'email':
          if (!Utils.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
          }
          break;
        case 'phone':
          if (!Utils.isValidPhone(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid 10-digit phone number';
          }
          break;
        case 'number':
          if (isNaN(value) || value <= 0) {
            isValid = false;
            errorMessage = 'Please enter a valid number';
          }
          break;
        case 'date':
          if (isNaN(Date.parse(value))) {
            isValid = false;
            errorMessage = 'Please enter a valid date';
          }
          break;
      }
    }

    // Update field state
    this.updateFieldState(field, isValid, errorMessage);
    return isValid;
  },

  updateFieldState(field, isValid, errorMessage) {
    const formGroup = field.closest('.form-group');
    const existingError = formGroup?.querySelector('.form-error');

    if (existingError) {
      existingError.remove();
    }

    if (isValid) {
      field.classList.remove('error');
    } else {
      field.classList.add('error');
      if (formGroup) {
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        errorEl.textContent = errorMessage;
        formGroup.appendChild(errorEl);
      }
    }
  },

  async handleSubmit(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner" style="width:20px;height:20px;border-width:2px;"></span> Processing...';

    try {
      // Simulate API call (replace with actual API integration)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show success message
      Toast.success('Your submission was successful! We will contact you soon.');

      // Reset form
      form.reset();

      // Close modal if open
      const modalOverlay = form.closest('.modal-overlay');
      if (modalOverlay) {
        Modal.close(modalOverlay.id);
      }
    } catch (error) {
      Toast.error('An error occurred. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  },

  setupPaymentMethods() {
    const paymentMethods = document.querySelectorAll('.payment-method');

    paymentMethods.forEach(method => {
      method.addEventListener('click', () => {
        // Remove selection from all methods
        paymentMethods.forEach(m => m.classList.remove('selected'));

        // Select clicked method
        method.classList.add('selected');
        TempleApp.state.selectedPaymentMethod = method.dataset.method;
      });
    });
  },

  setupDonationAmounts() {
    const amountBtns = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.querySelector('input[name="custom-amount"]');

    amountBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove selection from all buttons
        amountBtns.forEach(b => b.classList.remove('selected'));

        // Select clicked button
        btn.classList.add('selected');
        TempleApp.state.selectedDonationAmount = parseInt(btn.dataset.amount);

        // Update custom amount input if exists
        if (customAmountInput) {
          customAmountInput.value = btn.dataset.amount;
        }
      });
    });

    // Handle custom amount input
    if (customAmountInput) {
      customAmountInput.addEventListener('input', () => {
        amountBtns.forEach(b => b.classList.remove('selected'));
        TempleApp.state.selectedDonationAmount = parseInt(customAmountInput.value) || 0;
      });
    }
  }
};

// =====================================================
// PAYMENT GATEWAY DEMO INTEGRATION
// =====================================================
const PaymentGateway = {
  // Demo payment methods configuration
  methods: {
    razorpay: {
      name: 'Razorpay',
      icon: '💳',
      supported: ['card', 'upi', 'netbanking', 'wallet']
    },
    phonepe: {
      name: 'PhonePe',
      icon: '📱',
      supported: ['upi', 'card']
    },
    paytm: {
      name: 'Paytm',
      icon: '💰',
      supported: ['wallet', 'upi', 'card']
    },
    googlepay: {
      name: 'Google Pay',
      icon: '🔵',
      supported: ['upi']
    }
  },

  async initiatePayment(amount, method, details) {
    // Show loading state
    Toast.info('Initiating payment...');

    try {
      // Simulate payment gateway API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate mock order ID
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

      // Simulate success (90% success rate for demo)
      if (Math.random() > 0.1) {
        return {
          success: true,
          orderId: orderId,
          amount: amount,
          method: method,
          message: `Payment of ${Utils.formatCurrency(amount)} successful via ${this.methods[method]?.name || method}`
        };
      } else {
        throw new Error('Payment failed. Please try again.');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Demo payment modal
  showPaymentModal(amount, purpose = 'Donation') {
    const modalContent = `
      <div class="modal" role="dialog" aria-labelledby="payment-modal-title">
        <button class="modal-close" onclick="Modal.close('payment-modal')">&times;</button>
        <h3 id="payment-modal-title">${purpose}</h3>
        <div class="payment-amount-display">
          <span class="amount">${Utils.formatCurrency(amount)}</span>
        </div>
        <div class="payment-methods">
          ${Object.entries(this.methods).map(([key, method]) => `
            <div class="payment-method" data-method="${key}">
              <div class="icon">${method.icon}</div>
              <div class="name">${method.name}</div>
            </div>
          `).join('')}
        </div>
        <div class="form-group">
          <label for="payer-name">Your Name</label>
          <input type="text" id="payer-name" required placeholder="Enter your name">
        </div>
        <div class="form-group">
          <label for="payer-email">Email Address</label>
          <input type="email" id="payer-email" required placeholder="Enter your email">
        </div>
        <div class="form-group">
          <label for="payer-phone">Phone Number</label>
          <input type="tel" id="payer-phone" required placeholder="Enter your phone number">
        </div>
        <button class="btn btn-primary btn-large" onclick="PaymentGateway.processPayment(${amount})" style="width:100%">
          Proceed to Pay
        </button>
        <p class="secure-notice" style="text-align:center;margin-top:1rem;font-size:0.875rem;color:var(--text-light);">
          🔒 Secured by SSL Encryption
        </p>
      </div>
    `;

    // Create or update modal
    let modal = document.getElementById('payment-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'payment-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }
    modal.innerHTML = modalContent;

    // Re-initialize payment method selection
    Forms.setupPaymentMethods();

    Modal.open('payment-modal');
  },

  async processPayment(amount) {
    const name = document.getElementById('payer-name')?.value;
    const email = document.getElementById('payer-email')?.value;
    const phone = document.getElementById('payer-phone')?.value;
    const method = TempleApp.state.selectedPaymentMethod;

    // Validate inputs
    if (!name || !email || !phone) {
      Toast.error('Please fill in all fields');
      return;
    }

    if (!Utils.isValidEmail(email)) {
      Toast.error('Please enter a valid email address');
      return;
    }

    if (!Utils.isValidPhone(phone)) {
      Toast.error('Please enter a valid phone number');
      return;
    }

    if (!method) {
      Toast.error('Please select a payment method');
      return;
    }

    // Process payment
    const result = await PaymentGateway.initiatePayment(amount, method, { name, email, phone });

    if (result.success) {
      Modal.close('payment-modal');
      Toast.success(result.message);

      // Show receipt modal
      this.showReceipt(result);
    } else {
      Toast.error(result.error);
    }
  },

  showReceipt(paymentDetails) {
    const receiptContent = `
      <div class="modal" role="dialog" aria-labelledby="receipt-modal-title">
        <button class="modal-close" onclick="Modal.close('receipt-modal')">&times;</button>
        <div style="text-align:center;padding:2rem 0;">
          <div style="font-size:4rem;margin-bottom:1rem;">✅</div>
          <h3 id="receipt-modal-title">Payment Successful!</h3>
          <p style="color:var(--text-medium);margin-bottom:2rem;">Thank you for your generous contribution</p>

          <div style="background:var(--bg-light);padding:1.5rem;border-radius:var(--radius-md);margin-bottom:2rem;">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
              <span style="color:var(--text-light);">Order ID</span>
              <span style="font-weight:600;">${paymentDetails.orderId}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
              <span style="color:var(--text-light);">Amount</span>
              <span style="font-weight:600;color:var(--primary-color);font-size:1.25rem;">${Utils.formatCurrency(paymentDetails.amount)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
              <span style="color:var(--text-light);">Payment Method</span>
              <span style="font-weight:600;">${this.methods[paymentDetails.method]?.name || paymentDetails.method}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-light);">Date</span>
              <span style="font-weight:600;">${Utils.formatDate(new Date().toISOString())}</span>
            </div>
          </div>

          <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
            <button class="btn btn-outline" onclick="this.closest('.modal-overlay').querySelector('.modal').querySelector('button').click();window.print();">
              📄 Download Receipt
            </button>
            <button class="btn btn-primary" onclick="Modal.close('receipt-modal')">
              Done
            </button>
          </div>
        </div>
      </div>
    `;

    let modal = document.getElementById('receipt-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'receipt-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }
    modal.innerHTML = receiptContent;
    Modal.open('receipt-modal');
  }
};

// =====================================================
// COUNTDOWN TIMER
// =====================================================
const Countdown = {
  timers: [],

  init() {
    this.setupEventCountdowns();
  },

  setupEventCountdowns() {
    const countdownElements = document.querySelectorAll('.countdown');

    countdownElements.forEach(countdown => {
      const targetDate = countdown.dataset.target;
      if (targetDate) {
        this.createTimer(countdown, new Date(targetDate));
      }
    });
  },

  createTimer(element, targetDate) {
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        element.innerHTML = '<div class="countdown-item"><span class="countdown-value">Event Started!</span></div>';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      element.innerHTML = `
        <div class="countdown-item">
          <span class="countdown-value">${days}</span>
          <span class="countdown-label">Days</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-value">${hours}</span>
          <span class="countdown-label">Hours</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-value">${minutes}</span>
          <span class="countdown-label">Minutes</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-value">${seconds}</span>
          <span class="countdown-label">Seconds</span>
        </div>
      `;
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    this.timers.push(interval);
  }
};

// =====================================================
// TEMPLE TIMINGS STATUS
// =====================================================
const TempleStatus = {
  init() {
    this.updateStatus();
    // Update every minute
    setInterval(() => this.updateStatus(), 60000);
  },

  updateStatus() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const day = now.getDay(); // 0 = Sunday

    // Temple timings (in minutes from midnight)
    const timings = {
      morning: { start: 5 * 60 + 30, end: 12 * 60 }, // 5:30 AM - 12:00 PM
      evening: { start: 18 * 60, end: 19 * 60 + 30 } // 6:00 PM - 7:30 PM
    };

    const isOpen = (currentTime >= timings.morning.start && currentTime <= timings.morning.end) ||
                   (currentTime >= timings.evening.start && currentTime <= timings.evening.end);

    // Update timing cards
    const timingCards = document.querySelectorAll('.timing-card');
    timingCards.forEach(card => {
      card.classList.remove('open');
      const title = card.querySelector('h3')?.textContent;

      if (title === 'Darshan Hours' && isOpen) {
        card.classList.add('open');
      }
    });

    // Update status in hero or header if exists
    const statusElement = document.querySelector('.temple-status');
    if (statusElement) {
      statusElement.textContent = isOpen ? '🟢 Temple is Open' : '🔴 Temple is Closed';
      statusElement.className = `temple-status ${isOpen ? 'open' : 'closed'}`;
    }
  }
};

// =====================================================
// ACCORDION FUNCTIONALITY
// =====================================================
const Accordion = {
  init() {
    const accordions = document.querySelectorAll('.accordion');

    accordions.forEach(accordion => {
      const headers = accordion.querySelectorAll('.accordion-header');

      headers.forEach(header => {
        header.addEventListener('click', () => {
          const item = header.parentElement;
          const content = item.querySelector('.accordion-content');
          const isActive = item.classList.contains('active');

          // Close all items in this accordion
          accordion.querySelectorAll('.accordion-item').forEach(i => {
            i.classList.remove('active');
            i.querySelector('.accordion-content').style.maxHeight = null;
          });

          // Open clicked item if it wasn't active
          if (!isActive) {
            item.classList.add('active');
            content.style.maxHeight = content.scrollHeight + 'px';
          }
        });
      });
    });
  }
};

// =====================================================
// LAZY LOADING FOR IMAGES
// =====================================================
const LazyLoad = {
  init() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            imageObserver.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    } else {
      // Fallback for older browsers
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
      });
    }
  }
};

// =====================================================
// PARTICLE EFFECTS (Hero Section)
// =====================================================
const Particles = {
  init() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Create floating particles
    for (let i = 0; i < 20; i++) {
      this.createParticle(hero);
    }
  },

  createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = (15 + Math.random() * 10) + 's';
    container.appendChild(particle);
  }
};

// =====================================================
// ACCESSIBILITY ENHANCEMENTS
// =====================================================
const Accessibility = {
  init() {
    this.setupKeyboardNavigation();
    this.setupSkipLinks();
    this.setupAriaLabels();
  },

  setupKeyboardNavigation() {
    // Handle tab key for custom components
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  },

  setupSkipLinks() {
    // Add skip to main content link if not present
    if (!document.querySelector('.skip-link')) {
      const skipLink = document.createElement('a');
      skipLink.href = '#main-content';
      skipLink.className = 'skip-link sr-only';
      skipLink.textContent = 'Skip to main content';
      skipLink.setAttribute('aria-label', 'Skip to main content');
      document.body.insertBefore(skipLink, document.body.firstChild);
    }
  },

  setupAriaLabels() {
    // Add aria-labels to icon-only buttons
    document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(btn => {
      if (!btn.textContent.trim() && btn.querySelector('svg, i, span')) {
        btn.setAttribute('aria-label', 'Button');
      }
    });
  }
};

// =====================================================
// SERVICE WORKER REGISTRATION (PWA Support)
// =====================================================
const ServiceWorker = {
  init() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('ServiceWorker registration successful');
          })
          .catch(err => {
            console.log('ServiceWorker registration failed:', err);
          });
      });
    }
  }
};

// =====================================================
// ANALYTICS (Placeholder for integration)
// =====================================================
const Analytics = {
  trackEvent(category, action, label, value) {
    // Placeholder for Google Analytics or similar
    console.log('Analytics Event:', { category, action, label, value });

    // Example: gtag('event', action, { event_category: category, event_label: label, value: value });
  },

  trackPageView(pageName) {
    this.trackEvent('Navigation', 'page_view', pageName);
  }
};

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  Toast.init();
  Navigation.init();
  ScrollAnimations.init();
  Forms.init();
  Countdown.init();
  TempleStatus.init();
  Accordion.init();
  LazyLoad.init();
  Particles.init();
  Accessibility.init();

  // Log initialization
  console.log('🏛️ Sri Divine Temple Website Initialized');
  console.log('Version: 1.0.0 (Frontend Demo)');

  // Track page view
  Analytics.trackPageView(window.location.pathname);
});

// Handle page visibility changes (pause animations when tab is hidden)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause heavy animations
    document.body.classList.add('reduced-motion');
  } else {
    document.body.classList.remove('reduced-motion');
  }
});

// Handle window resize
window.addEventListener('resize', Utils.debounce(() => {
  // Re-initialize components that depend on viewport size
  // This is handled automatically by CSS media queries
}, 250));

// Expose global functions for inline event handlers
window.Modal = Modal;
window.PaymentGateway = PaymentGateway;
window.Toast = Toast;
window.Utils = Utils;
window.TempleApp = TempleApp;