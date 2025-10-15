import { parseDocument } from 'yaml';

export interface YamlFrontMatterResult {
  yaml: { [key: string]: any } | null;
  text: string;
}

export function parseYamlFrontMatter(text: string): YamlFrontMatterResult {
  const firstDash = text.indexOf('---');
  const secondDash = text.indexOf('---', firstDash + 3);
  
  if (firstDash === -1 || secondDash === -1) {
    return { yaml: null, text };
  }
  
  const yamlText = text.substring(firstDash + 3, secondDash).trim();
  const markdownText = text.substring(secondDash + 3).trim();
  
  try {
    const doc = parseDocument(yamlText);
    const yaml = doc.toJS();
    return { 
      yaml: yaml && typeof yaml === 'object' ? yaml : null, 
      text: markdownText 
    };
  } catch (error) {
    console.error('YAML parsing error:', error);
    return { yaml: null, text: markdownText };
  }
}

export function parsePartialYaml(yamlText: string): { [key: string]: any } | null {
  try {
    const doc = parseDocument(yamlText);
    return doc.toJS();
  } catch (error) {
    return null;
  }
}

export const doesResponseContainFrontMatterYaml = (responseStream: string) => {
  return responseStream.indexOf('---') !== -1;
};

export const isFrontMatterYamlReceived = (responseStream: string) => {
  const firstDash = responseStream.indexOf('---');
  const secondDash = responseStream.indexOf('---', firstDash + 3);
  return firstDash !== -1 && secondDash !== -1;
};

export const getYamlEndIndex = (responseStream: string) => {
  const firstDash = responseStream.indexOf('---');
  const secondDash = responseStream.indexOf('---', firstDash + 3);
  return secondDash !== -1 ? secondDash + 3 : -1;
};

export const getTextAfterYaml = (responseStream: string) => {
  if (isFrontMatterYamlReceived(responseStream)) {
    const yamlEndIndex = getYamlEndIndex(responseStream);
    return responseStream.substring(yamlEndIndex).trim();
  }
  return '';
};
