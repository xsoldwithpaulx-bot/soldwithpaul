/* ============================================
   SOLD WITH PAUL — App JavaScript
   ============================================ */

(function () {
  'use strict';

  // ---- Navbar Scroll Behavior ----
  const navbar = document.getElementById('navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  // ---- Mobile Menu ----
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileOverlay = document.getElementById('mobileOverlay');

  function openMobileMenu() {
    hamburger.classList.add('open');
    mobileMenu.classList.add('open');
    mobileOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    mobileOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (hamburger) {
    hamburger.addEventListener('click', function () {
      if (mobileMenu.classList.contains('open')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', closeMobileMenu);
  }

  // Close mobile menu on link click
  var mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
  mobileLinks.forEach(function (link) {
    link.addEventListener('click', closeMobileMenu);
  });

  // ---- Fade-in on Scroll (Intersection Observer) ----
  var fadeElements = document.querySelectorAll('.fade-in');

  if ('IntersectionObserver' in window) {
    var fadeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    fadeElements.forEach(function (el) {
      fadeObserver.observe(el);
    });
  } else {
    // Fallback: show all elements
    fadeElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // ---- Contact Form Handling ----
  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Gather form data
      var name = document.getElementById('name').value.trim();
      var email = document.getElementById('email').value.trim();
      var phone = document.getElementById('phone').value.trim();
      var message = document.getElementById('message').value.trim();

      // Basic validation
      if (!name || !email || !message) {
        return;
      }

      // Build mailto link as fallback
      var subject = encodeURIComponent('Website Inquiry from ' + name);
      var body = encodeURIComponent(
        'Name: ' + name + '\n' +
        'Email: ' + email + '\n' +
        'Phone: ' + (phone || 'Not provided') + '\n\n' +
        'Message:\n' + message
      );

      // Open mailto
      window.open('mailto:paul@soldwithpaul.com?subject=' + subject + '&body=' + body, '_blank');

      // Show success message
      contactForm.style.display = 'none';
      if (formSuccess) {
        formSuccess.classList.add('show');
      }
    });
  }

  // ---- Scroll Indicator Click (Home page) ----
  var scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    scrollIndicator.style.cursor = 'pointer';
    scrollIndicator.addEventListener('click', function () {
      var hero = document.querySelector('.hero');
      if (hero && hero.nextElementSibling) {
        hero.nextElementSibling.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ---- FAQ Accordion ----
  var faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = this.parentElement;
      var isActive = item.classList.contains('active');

      // Close all items
      document.querySelectorAll('.faq-item').forEach(function (el) {
        el.classList.remove('active');
        el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      // Open clicked item if it wasn't already open
      if (!isActive) {
        item.classList.add('active');
        this.setAttribute('aria-expanded', 'true');
      }
    });
  });

})();
