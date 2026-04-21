export const parseEmailTemplate = (template, variables = {}) => {
  if (!template) return "";
  
  // Single-pass replacement for all {{placeholder}} patterns
  // Supports whitespace inside braces like {{ name }}
  return template.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
};
