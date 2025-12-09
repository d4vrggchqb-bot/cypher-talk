// cypher-talk/features-page/features.js (No changes needed)

document.addEventListener('DOMContentLoaded', () => {
  // Basic function to highlight the current page in the navigation
  const navLinks = document.querySelectorAll('nav a');
  const currentPath = window.location.pathname;

  navLinks.forEach(link => {
    // Simple check to see if the link's href is in the current URL path
    if (currentPath.includes(link.getAttribute('href'))) {
      link.classList.add('active-link');
    }
  });
});