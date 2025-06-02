// Script to remove Next.js development tools
(function() {
  function removeDevTools() {
    // Target specific elements that might be the dev tools
    const selectors = [
      // Bottom right dev tools button
      'button[data-testid="dev-tools-button"]',
      'button[role="button"][aria-label="Next.js development tools button"]',
      'div[style*="position: fixed; bottom: 0; right: 0"]',
      'div[data-listening-to-keys][style*="position: fixed; bottom: 0px; right: 0px"]',
      'div[data-nextjs-devtools-button]',
      
      // General Next.js UI elements
      '[data-nextjs-dialog]',
      '[data-nextjs-toast]',
      '#nextjs-toast',
      '#__next-build-watcher',
      '[aria-label="Open dev overlay"]',
      '[aria-label="Open Next.js overlay"]',
      '[data-nextjs-dev-overlay]',
      '#__next-route-announcer'
    ];
    
    // Try to remove each matching element
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.style.display = 'none';
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          el.remove();
        });
      } catch (e) {
        // Ignore errors
      }
    });
    
    // Also try direct element removal via recursion for bottom-right fixed elements
    function findAndRemoveDevTools(node) {
      if (!node || !node.tagName) return;
      
      try {
        // Check if this is a button or div at the bottom right
        const style = window.getComputedStyle(node);
        if (
          (node.tagName === 'BUTTON' || node.tagName === 'DIV') && 
          style.position === 'fixed' && 
          (style.bottom === '0px' || parseInt(style.bottom) < 20) && 
          (style.right === '0px' || parseInt(style.right) < 20)
        ) {
          node.style.display = 'none';
          node.style.opacity = '0';
          node.style.visibility = 'hidden';
          node.remove();
          return;
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Recursively check all child nodes
      try {
        Array.from(node.children).forEach(findAndRemoveDevTools);
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Start recursive check from body
    try {
      findAndRemoveDevTools(document.body);
    } catch (e) {
      // Ignore errors
    }
  }
  
  // Run immediately
  try {
    removeDevTools();
  } catch (e) {
    // Ignore errors
  }
  
  // Run after a delay to catch late-loading elements
  setTimeout(removeDevTools, 1000);
  setTimeout(removeDevTools, 2000);
  
  // Run on DOM changes
  try {
    const observer = new MutationObserver(function(mutations) {
      removeDevTools();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } catch (e) {
    // Ignore errors
  }
  
  // Run periodically
  setInterval(removeDevTools, 3000);
})(); 