import { useEffect, useRef, useState } from 'react';

/**
 * Hook to detect if text content is truncated and apply appropriate font size
 * @returns {Object} - ref to attach to element and CSS classes to apply
 */
export const useTruncatedText = () => {
  const elementRef = useRef(null);
  const [cssClasses, setCssClasses] = useState('table-cell-auto-fit');

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const checkTruncation = () => {
      if (!element) return;

      // Check if content is wider than container
      const isTruncated = element.scrollWidth > element.clientWidth;
      
      if (isTruncated) {
        // Check if it's very long content (more than 2x the width)
        const isVeryLong = element.scrollWidth > (element.clientWidth * 2);
        
        if (isVeryLong) {
          setCssClasses('table-cell-auto-fit data-truncated="true" data-very-long="true"');
        } else {
          setCssClasses('table-cell-auto-fit data-truncated="true"');
        }
      } else {
        setCssClasses('table-cell-auto-fit');
      }
    };

    // Initial check
    checkTruncation();

    // Setup ResizeObserver to detect changes
    const resizeObserver = new ResizeObserver(() => {
      checkTruncation();
    });

    resizeObserver.observe(element);

    // Also check when content changes
    const mutationObserver = new MutationObserver(() => {
      setTimeout(checkTruncation, 0); // Small delay to ensure DOM is updated
    });

    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return {
    ref: elementRef,
    className: cssClasses
  };
};
