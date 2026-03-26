/**
 * Client-side UI Regression Utility
 * Checks for the presence of critical DOM elements in the current view.
 */

export const checkCriticalUIComponents = (): { component: string, found: boolean }[] => {
  const checks = [
    { id: 'navigation-bar', selector: 'nav' },
    { id: 'footer-section', selector: 'footer' },
    { id: 'admin-console-header', selector: 'header h1' }, // Specific to Admin Console view
  ];

  return checks.map(c => ({
    component: c.id,
    found: document.querySelector(c.selector) !== null
  }));
};

export const checkLayoutClasses = (): { check: string, pass: boolean, advice?: string }[] => {
  // Check if tailwind container classes are generally being used
  const containers = document.querySelectorAll('.max-w-7xl');
  const grids = document.querySelectorAll('.grid');

  return [
    { check: 'Container Usage', pass: containers.length > 0, advice: 'Ensure max-w constraints are applied' },
    { check: 'Grid System', pass: grids.length > 0, advice: 'Ensure grid layouts are active' }
  ];
};
