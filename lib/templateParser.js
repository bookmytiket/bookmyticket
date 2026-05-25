export const parseEmailTemplate = (template, variables = {}) => {
  if (!template) return "";
  
  // Single-pass replacement for all {{placeholder}} patterns
  // Supports whitespace inside braces like {{ name }}
  return template.replace(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g, (match, key) => {
    // Handle nested dot notation keys if needed (e.g., event.name)
    const keys = key.split('.');
    let val = variables;
    for (const k of keys) {
      if (val === undefined || val === null) break;
      val = val[k];
    }
    
    // Check if the final value is defined and not null
    if (val !== undefined && val !== null && val !== "") {
      return String(val);
    }
    return "N/A";
  });
};
