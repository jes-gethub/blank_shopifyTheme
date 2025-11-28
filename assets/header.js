/**
 * Header JavaScript
 * Handles sticky header, mobile menu, dropdowns, search popup,
 * cart updates, and announcement bar dismiss functionality
 * 
 * Uses vanilla JavaScript for optimal performance
 */

(function() {
  'use strict';

  /* ============================================
     Configuration
     ============================================ */
  const CONFIG = {
    scrollThreshold: 50,
    debounceDelay: 10,
    cookieExpiry: 7, // days
    cookieName: 'announcement_dismissed',
    cartUpdateEvent: 'cart:updated',
    transitionDuration: 300
  };

  /* ============================================
     DOM Elements
     ============================================ */
  const elements = {
    header: null,
    announcementBar: null,
    announcementClose: null,
    mobileMenuToggle: null,
    mobileNav: null,
    mobileMenuOverlay: null,
    searchToggle: null,
    searchPopup: null,
    searchOverlay: null,
    searchClose: null,
    searchInput: null,
    cartCount: null,
    dropdownToggles: null,
    mobileDropdownToggles: null
  };

  /* ============================================
     Utility Functions
     ============================================ */
  
  /**
   * Debounce function to limit how often a function runs
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Set a cookie with expiry
   */
  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = 'expires=' + date.toUTCString();
    document.cookie = name + '=' + value + ';' + expires + ';path=/;SameSite=Lax';
  }

  /**
   * Get a cookie value
   */
  function getCookie(name) {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length);
      }
    }
    return null;
  }

  /**
   * Trap focus within an element (for modals/popups)
   */
  function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    function handleTabKey(e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }

    element.addEventListener('keydown', handleTabKey);
    return () => element.removeEventListener('keydown', handleTabKey);
  }

  /* ============================================
     Sticky Header
     ============================================ */
  function initStickyHeader() {
    if (!elements.header || !elements.header.classList.contains('header--sticky')) {
      return;
    }

    const handleScroll = debounce(() => {
      const scrollY = window.scrollY || window.pageYOffset;
      
      if (scrollY > CONFIG.scrollThreshold) {
        elements.header.classList.add('header--scrolled');
      } else {
        elements.header.classList.remove('header--scrolled');
      }
    }, CONFIG.debounceDelay);

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();
  }

  /* ============================================
     Announcement Bar Dismiss
     ============================================ */
  function initAnnouncementBar() {
    if (!elements.announcementBar) return;

    // Check if already dismissed
    if (getCookie(CONFIG.cookieName) === 'true') {
      elements.announcementBar.classList.add('announcement-bar--hidden');
      return;
    }

    if (elements.announcementClose) {
      elements.announcementClose.addEventListener('click', dismissAnnouncement);
    }
  }

  function dismissAnnouncement() {
    if (!elements.announcementBar) return;
    
    elements.announcementBar.classList.add('announcement-bar--hidden');
    setCookie(CONFIG.cookieName, 'true', CONFIG.cookieExpiry);
  }

  /* ============================================
     Mobile Menu
     ============================================ */
  function initMobileMenu() {
    if (!elements.mobileMenuToggle || !elements.mobileNav) return;

    let removeTrapFocus = null;

    elements.mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    
    if (elements.mobileMenuOverlay) {
      elements.mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen()) {
        closeMobileMenu();
      }
    });

    function toggleMobileMenu() {
      const isOpen = isMobileMenuOpen();
      
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    }

    function openMobileMenu() {
      elements.mobileMenuToggle.setAttribute('aria-expanded', 'true');
      elements.mobileNav.setAttribute('aria-hidden', 'false');
      
      if (elements.mobileMenuOverlay) {
        elements.mobileMenuOverlay.classList.add('mobile-menu-overlay--visible');
      }
      
      document.body.style.overflow = 'hidden';
      
      // Trap focus in mobile menu
      removeTrapFocus = trapFocus(elements.mobileNav);
      
      // Focus first menu item
      const firstLink = elements.mobileNav.querySelector('a, button');
      if (firstLink) {
        setTimeout(() => firstLink.focus(), CONFIG.transitionDuration);
      }
    }

    function closeMobileMenu() {
      elements.mobileMenuToggle.setAttribute('aria-expanded', 'false');
      elements.mobileNav.setAttribute('aria-hidden', 'true');
      
      if (elements.mobileMenuOverlay) {
        elements.mobileMenuOverlay.classList.remove('mobile-menu-overlay--visible');
      }
      
      document.body.style.overflow = '';
      
      if (removeTrapFocus) {
        removeTrapFocus();
        removeTrapFocus = null;
      }
      
      // Return focus to toggle button
      elements.mobileMenuToggle.focus();
    }

    function isMobileMenuOpen() {
      return elements.mobileMenuToggle.getAttribute('aria-expanded') === 'true';
    }
  }

  /* ============================================
     Dropdown Menus (Desktop)
     ============================================ */
  function initDropdowns() {
    // Desktop dropdowns - handle via hover and keyboard
    if (elements.dropdownToggles) {
      elements.dropdownToggles.forEach((toggle) => {
        // Click to toggle for accessibility
        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
          closeAllDropdowns();
          
          if (!isExpanded) {
            toggle.setAttribute('aria-expanded', 'true');
          }
        });

        // Keyboard navigation
        toggle.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle.click();
          } else if (e.key === 'Escape') {
            toggle.setAttribute('aria-expanded', 'false');
            toggle.focus();
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const dropdown = toggle.nextElementSibling;
            if (dropdown) {
              const firstLink = dropdown.querySelector('a, button');
              if (firstLink) firstLink.focus();
            }
          }
        });
      });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header__menu-item')) {
        closeAllDropdowns();
      }
    });

    function closeAllDropdowns() {
      if (elements.dropdownToggles) {
        elements.dropdownToggles.forEach((toggle) => {
          toggle.setAttribute('aria-expanded', 'false');
        });
      }
    }
  }

  /* ============================================
     Mobile Dropdown Toggles
     ============================================ */
  function initMobileDropdowns() {
    if (!elements.mobileDropdownToggles) return;

    elements.mobileDropdownToggles.forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
      });
    });
  }

  /* ============================================
     Search Popup
     ============================================ */
  function initSearch() {
    if (!elements.searchToggle || !elements.searchPopup) return;

    let removeTrapFocus = null;

    elements.searchToggle.addEventListener('click', openSearch);
    
    if (elements.searchClose) {
      elements.searchClose.addEventListener('click', closeSearch);
    }
    
    if (elements.searchOverlay) {
      elements.searchOverlay.addEventListener('click', closeSearch);
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isSearchOpen()) {
        closeSearch();
      }
    });

    function openSearch() {
      elements.searchPopup.setAttribute('aria-hidden', 'false');
      elements.searchToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      
      // Trap focus in search popup
      removeTrapFocus = trapFocus(elements.searchPopup);
      
      // Focus search input
      if (elements.searchInput) {
        setTimeout(() => elements.searchInput.focus(), CONFIG.transitionDuration);
      }
    }

    function closeSearch() {
      elements.searchPopup.setAttribute('aria-hidden', 'true');
      elements.searchToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      
      if (removeTrapFocus) {
        removeTrapFocus();
        removeTrapFocus = null;
      }
      
      // Return focus to toggle button
      elements.searchToggle.focus();
    }

    function isSearchOpen() {
      return elements.searchPopup.getAttribute('aria-hidden') === 'false';
    }
  }

  /* ============================================
     Cart Count Updates
     ============================================ */
  function initCartCount() {
    if (!elements.cartCount) return;

    // Listen for Shopify cart events
    document.addEventListener(CONFIG.cartUpdateEvent, updateCartCount);
    
    // Also listen for custom cart update events
    window.addEventListener('cart:refresh', fetchCartCount);
    
    // Shopify's native cart update event
    if (window.Shopify && window.Shopify.onCartUpdate) {
      window.Shopify.onCartUpdate = function(cart) {
        updateCartCountValue(cart.item_count);
      };
    }
  }

  function updateCartCount(event) {
    if (event.detail && typeof event.detail.itemCount !== 'undefined') {
      updateCartCountValue(event.detail.itemCount);
    }
  }

  function updateCartCountValue(count) {
    if (!elements.cartCount) return;
    
    const currentCount = parseInt(elements.cartCount.dataset.count || 0);
    
    if (count !== currentCount) {
      elements.cartCount.textContent = count;
      elements.cartCount.dataset.count = count;
      
      // Add animation class
      elements.cartCount.classList.add('header__cart-count--updated');
      
      // Update aria-label on cart link
      const cartLink = elements.cartCount.closest('.header__cart');
      if (cartLink) {
        cartLink.setAttribute('aria-label', `Cart (${count} items)`);
      }
      
      // Remove animation class after animation completes
      setTimeout(() => {
        elements.cartCount.classList.remove('header__cart-count--updated');
      }, 500);
    }
  }

  function fetchCartCount() {
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        updateCartCountValue(cart.item_count);
      })
      .catch(error => {
        console.error('Error fetching cart:', error);
      });
  }

  /* ============================================
     Accessibility: Keyboard Navigation
     ============================================ */
  function initKeyboardNavigation() {
    // Add keyboard navigation for main menu
    const menuItems = document.querySelectorAll('.header__menu > .header__menu-item');
    
    menuItems.forEach((item, index) => {
      const link = item.querySelector('.header__menu-link');
      
      if (link) {
        link.addEventListener('keydown', (e) => {
          switch (e.key) {
            case 'ArrowRight':
              e.preventDefault();
              focusMenuItem(menuItems, index + 1);
              break;
            case 'ArrowLeft':
              e.preventDefault();
              focusMenuItem(menuItems, index - 1);
              break;
            case 'Home':
              e.preventDefault();
              focusMenuItem(menuItems, 0);
              break;
            case 'End':
              e.preventDefault();
              focusMenuItem(menuItems, menuItems.length - 1);
              break;
          }
        });
      }
    });

    function focusMenuItem(items, index) {
      if (index < 0) index = items.length - 1;
      if (index >= items.length) index = 0;
      
      const link = items[index].querySelector('.header__menu-link');
      if (link) link.focus();
    }
  }

  /* ============================================
     Skip Link Focus Management
     ============================================ */
  function initSkipLinks() {
    // Handle skip link focus
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    
    skipLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus();
          target.addEventListener('blur', () => {
            target.removeAttribute('tabindex');
          }, { once: true });
        }
      });
    });
  }

  /* ============================================
     Initialize All Components
     ============================================ */
  function init() {
    // Cache DOM elements
    elements.header = document.getElementById('main-header');
    elements.announcementBar = document.getElementById('announcement-bar');
    elements.announcementClose = document.getElementById('announcement-close');
    elements.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    elements.mobileNav = document.getElementById('mobile-nav');
    elements.mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    elements.searchToggle = document.getElementById('search-toggle');
    elements.searchPopup = document.getElementById('search-popup');
    elements.searchOverlay = document.getElementById('search-overlay');
    elements.searchClose = document.getElementById('search-close');
    elements.searchInput = document.getElementById('search-input');
    elements.cartCount = document.getElementById('cart-count');
    elements.dropdownToggles = document.querySelectorAll('.header__menu-link--dropdown');
    elements.mobileDropdownToggles = document.querySelectorAll(
      '.header__mobile-menu-link--dropdown, .header__mobile-dropdown-link--nested'
    );

    // Initialize components
    initStickyHeader();
    initAnnouncementBar();
    initMobileMenu();
    initDropdowns();
    initMobileDropdowns();
    initSearch();
    initCartCount();
    initKeyboardNavigation();
    initSkipLinks();
  }

  /* ============================================
     Public API
     ============================================ */
  window.ThemeHeader = {
    updateCartCount: updateCartCountValue,
    refreshCart: fetchCartCount,
    dismissAnnouncement: dismissAnnouncement
  };

  /* ============================================
     Run Initialization
     ============================================ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
