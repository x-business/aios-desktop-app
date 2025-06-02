// Simple focused script to hide Next.js dev tools button
(function() {
  function hideDevTools() {
    // Target only the specific elements we need to hide
    const devToolsSelectors = [
      // Bottom buttons
      'button[aria-label="Next.js development tools"]',
      'div[style*="position: fixed"][style*="bottom"][style*="left"]',
      'div[style*="position: fixed"][style*="bottom"][style*="right"]',
      // Preferences panel
      'div[role="dialog"]:has(h2:contains("Preferences"))',
    ];
    
    // Apply simple CSS to hide these elements
    const style = document.createElement('style');
    style.innerHTML = `
      button[aria-label="Next.js development tools"],
      [role="dialog"]:has(h2:contains("Preferences")),
      /* Bottom right button */
      div[style*="position: fixed"][style*="bottom: 0"][style*="right: 0"],
      /* Bottom left button */
      div[style*="position: fixed"][style*="bottom: 0"][style*="left: 0"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(style);
    
    // Use DOM mutation observer for dynamic elements
    const observer = new MutationObserver(function() {
      // Find fixed position elements at bottom corners
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach(el => {
        try {
          // Skip non-element nodes
          if (el.nodeType !== 1) return;
          
          // Skip if already set to display none
          const computedStyle = window.getComputedStyle(el);
          if (computedStyle.display === 'none') return;
          
          // Dev tools button detection
          const rect = el.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const windowWidth = window.innerWidth;
          
          // Check if element is at bottom corner
          if (
            (rect.bottom > windowHeight - 20) && 
            ((rect.right > windowWidth - 20) || (rect.left < 20)) && 
            (el.tagName === 'BUTTON' || el.tagName === 'DIV')
          ) {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
          }
          
          // Check for dialog elements with preferences
          if (
            el.getAttribute('role') === 'dialog' && 
            el.textContent && 
            el.textContent.includes('Preferences')
          ) {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
          }
          
          // Check for specific aria-label
          if (
            el.getAttribute('aria-label') === 'Next.js development tools' ||
            el.getAttribute('aria-label') === 'Open Next.js development tools'
          ) {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
          }
        } catch (e) {}
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    // Run check immediately
    observer.takeRecords();
  }
  
  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideDevTools);
  } else {
    hideDevTools();
  }
  
  // Also run when page is fully loaded
  window.addEventListener('load', hideDevTools);
})(); 