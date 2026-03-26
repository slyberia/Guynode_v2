export const sanitizeHtml = (html: string): string => {
  // Simple whitelist-based sanitizer that fulfills the constraint
  // "HTML rendering via 'dangerouslySetInnerHTML' must be sanitized using the whitelist-based 'sanitizeHtml' utility in 'utils/sanitize.ts'."

  if (!html) return '';

  // Implementation
  // Given that it doesn't exist, we implement it as requested by memory/instructions:
  // "must be sanitized using the whitelist-based 'sanitizeHtml' utility in 'utils/sanitize.ts'. This custom utility serves as a secure fallback for 'DOMPurify' in restricted-network environments where new dependencies cannot be installed."

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const allowedTags = new Set([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
    'a', 'b', 'i', 'strong', 'em', 'span', 'div',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img'
  ]);

  const allowedAttributes = new Set([
    'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'
  ]);

  const sanitizeNode = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();

      if (!allowedTags.has(tag)) {
        // Create a text node with the element's content, replacing the element
        const textNode = doc.createTextNode(el.textContent || '');
        el.parentNode?.replaceChild(textNode, el);
        return;
      }

      // Filter attributes
      const attrsToKeep: {name: string, value: string}[] = [];
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        if (allowedAttributes.has(attr.name.toLowerCase())) {
          // Check for malicious URLs in href/src
          if (attr.name.toLowerCase() === 'href' || attr.name.toLowerCase() === 'src') {
            const url = attr.value.trim().toLowerCase();
            if (url.startsWith('javascript:') || url.startsWith('vbscript:') || url.startsWith('data:text/html')) {
              continue; // Skip malicious URL
            }
          }
          attrsToKeep.push({ name: attr.name, value: attr.value });
        }
      }

      // Remove all and add back only the allowed ones
      while (el.attributes.length > 0) {
        el.removeAttribute(el.attributes[0].name);
      }

      attrsToKeep.forEach(attr => el.setAttribute(attr.name, attr.value));
    }

    // Process children
    const children = Array.from(node.childNodes);
    children.forEach(sanitizeNode);
  };

  const bodyChildren = Array.from(doc.body.childNodes);
  bodyChildren.forEach(sanitizeNode);

  return doc.body.innerHTML;
};
