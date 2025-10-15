// Custom markdown converter for LLM responses
// Handles specific patterns we need without the bloat of full markdown libraries
// Optimized for streaming token-by-token processing

// Pre-compiled regexes for better performance
const ORDERED_LIST_REGEX = /(\n|^)(\d+\. .+(?:\n(?!\n*(?:#|- |\n|[^\s]))[^\n]*)*(?:\n\n?(?=\d+\. )\d+\. .+(?:\n(?!\n*(?:#|- |\n|[^\s]))[^\n]*)*)*)/g;
const UNORDERED_LIST_REGEX = /(\n|^)(- .+(?:\n(?!\n*(?:#|\d+\. |\n|[^\s]))[^\n]*)*(?:\n\n?(?=- )- .+(?:\n(?!\n*(?:#|\d+\. |\n|[^\s]))[^\n]*)*)*)/g;
const HEADER_REGEX_H3 = /^### (.*$)/gm;
const HEADER_REGEX_H2 = /^## (.*$)/gm;
const HEADER_REGEX_H1 = /^# (.*$)/gm;
const BOLD_REGEX = /\*\*(.*?)\*\*/g;
const ITALIC_REGEX = /\*(.*?)\*/g;
const CODE_REGEX = /`([^`]+)`/g;

export function convertOrderedList(text: string): string {
  if (!text.includes('. ')) return text;
  
  ORDERED_LIST_REGEX.lastIndex = 0;
  return text.replace(ORDERED_LIST_REGEX, (match, prefix, listContent) => {
    const lines = listContent.split('\n');
    const items: string[] = [];
    let currentItem = '';
    
    for (const line of lines) {
      const itemMatch = line.match(/^(\d+)\. (.+)$/);
      if (itemMatch) {
        if (currentItem) items.push(`<li>${currentItem.trim()}</li>`);
        currentItem = itemMatch[2];
      } else if (line.trim() && currentItem) {
        currentItem += ' ' + line.trim();
      }
    }
    if (currentItem) items.push(`<li>${currentItem.trim()}</li>`);
    
    return `${prefix}<ol style="margin: 10px 0; padding-left: 20px;">${items.join('')}</ol>`;
  });
}

export function convertUnorderedList(text: string): string {
  if (!text.includes('- ')) return text;
  
  UNORDERED_LIST_REGEX.lastIndex = 0;
  return text.replace(UNORDERED_LIST_REGEX, (match, prefix, listContent) => {
    const lines = listContent.split('\n');
    const items: string[] = [];
    let currentItem = '';
    
    for (const line of lines) {
      const itemMatch = line.match(/^- (.+)$/);
      if (itemMatch) {
        if (currentItem) items.push(`<li>${currentItem.trim()}</li>`);
        currentItem = itemMatch[1];
      } else if (line.trim() && currentItem && !line.match(/^[^-\s]/)) {
        currentItem += ' ' + line.trim();
      }
    }
    if (currentItem) items.push(`<li>${currentItem.trim()}</li>`);
    
    return `${prefix}<ul style="margin: 10px 0; padding-left: 20px;">${items.join('')}</ul>`;
  });
}

export function convertHeaders(text: string): string {
  if (!text.includes('#')) return text;
  
  HEADER_REGEX_H3.lastIndex = 0;
  HEADER_REGEX_H2.lastIndex = 0;
  HEADER_REGEX_H1.lastIndex = 0;
  
  return text
    .replace(HEADER_REGEX_H3, '<h3 style="font-size: 14px; font-weight: 600; margin: 6px 0 6px 0; color: #333;">$1</h3>')
    .replace(HEADER_REGEX_H2, '<h2 style="font-size: 16px; font-weight: 600; margin: 8px 0 8px 0; color: #333;">$1</h2>')
    .replace(HEADER_REGEX_H1, '<h1 style="font-size: 18px; font-weight: 700; margin: 10px 0 10px 0; color: #333;">$1</h1>');
}

export function convertBold(text: string): string {
  if (!text.includes('**')) return text;
  BOLD_REGEX.lastIndex = 0;
  return text.replace(BOLD_REGEX, '<strong>$1</strong>');
}

export function convertItalic(text: string): string {
  if (!text.includes('*')) return text;
  ITALIC_REGEX.lastIndex = 0;
  return text.replace(ITALIC_REGEX, '<em>$1</em>');
}

export function convertInlineCode(text: string): string {
  if (!text.includes('`')) return text;
  CODE_REGEX.lastIndex = 0;
  return text.replace(CODE_REGEX, '<code style="background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');
}

export function convertNewlines(text: string): string {
  return text.replace(/\n/g, '<br>');
}

export function cleanupSpacing(text: string): string {
  return text
    .replace(/<br><br>/g, '<p class="mt-2">')
    .replace(/<\/(ol|ul)><br>/g, '</$1>')
    .replace(/<\/(h[1-6])><br>/g, '</$1>');
}

export function markdownToHtml(text: string | null): string {
  if (!text) return '';
  
  let result = text;
  
  result = convertHeaders(result);
  result = convertOrderedList(result);
  result = convertUnorderedList(result);
  result = convertBold(result);
  result = convertItalic(result);
  result = convertInlineCode(result);
  result = convertNewlines(result);
  result = cleanupSpacing(result);
  
  return result;
}
