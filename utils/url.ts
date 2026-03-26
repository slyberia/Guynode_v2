/**
 * Validates and safely parses a URL string.
 * Enforces http or https protocols.
 * Returns the valid URL string, or null if invalid.
 */
export const safeUrl = (url: string | undefined | null): string | null => {
  if (!url) return null;

  // Remove control characters (ASCII 0-31, 127) and whitespace using character code filtering
  let sanitizedUrl = '';
  for (let i = 0; i < url.length; i++) {
    const code = url.charCodeAt(i);
    // Ignore control characters (0-31, 127) and whitespace (32)
    if (code > 32 && code !== 127) {
      sanitizedUrl += url.charAt(i);
    }
  }

  try {
    // Attempt to parse the sanitized URL
    const parsed = new URL(sanitizedUrl);

    // Enforce http/https protocol
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }

    console.error('safeUrl: Invalid protocol rejected', parsed.protocol);
    return null;
  } catch {
    // If it's a relative path, we might want to allow it depending on usecase.
    // For local assets, let's allow paths starting with '/'
    if (sanitizedUrl.startsWith('/')) {
        return sanitizedUrl;
    }

    console.error('safeUrl: Failed to parse URL', url);
    return null;
  }
};
