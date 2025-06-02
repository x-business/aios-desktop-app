// Ultra-minimal script to hide dev tools buttons
(function() {
  // Wait until page has loaded
  window.addEventListener('load', function() {
    // Add CSS only (no DOM manipulation)
    try {
      const style = document.createElement('style');
      style.textContent = `
        /* Hide bottom corner dev tools buttons */
        button[aria-label*="Next.js"],
        div[role="button"][aria-label*="Next.js"],
        div[style*="position: fixed"][style*="bottom: 0"][style*="left: 0"],
        div[style*="position: fixed"][style*="bottom: 0"][style*="right: 0"] {
          display: none !important;
          visibility: hidden !important;
        }
      `;
      document.head.appendChild(style);
    } catch (e) {
      // Silently fail
    }
  });
})(); 