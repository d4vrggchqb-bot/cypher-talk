
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});

// Optional: Add scroll effect to header
let lastScroll = 0;
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll <= 0) {
    header.style.boxShadow = '0 0 20px rgba(0, 255, 159, 0.5)';
    return;
  }

  if (currentScroll > lastScroll) {
    // Scrolling down - enhance glow
    header.style.boxShadow = '0 0 30px rgba(0, 255, 159, 0.7)';
  } else {
    // Scrolling up
    header.style.boxShadow = '0 0 20px rgba(0, 255, 159, 0.5)';
  }

  lastScroll = currentScroll;
});

// Add animation on scroll for feature cards
// Add animation on scroll for feature cards
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe all feature cards
document.querySelectorAll('.feature-card').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
  observer.observe(card);
});

// Observe all feature cards
document.querySelectorAll('.feature-card').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
  observer.observe(card);
});

// Optional: Add glitch effect to logo on hover
const logo = document.querySelector('.logo');
if (logo) {
  logo.addEventListener('mouseenter', () => {
    logo.style.animation = 'glitch 0.3s infinite';
  });

  logo.addEventListener('mouseleave', () => {
    logo.style.animation = 'none';
  });
}

// Console message (optional easter egg)
console.log('%c🔐 CypherTalks', 'color: #00ff9f; font-size: 20px; font-weight: bold; text-shadow: 0 0 10px rgba(0, 255, 159, 0.8);');
console.log('%cKeeping conversation private and in secret.', 'color: #00ccff; font-size: 14px;');