export interface ValidationProps {
  [key: string]: boolean;
}

class Validation {
  json: ValidationProps | null;

  constructor() {
    this.json = null;
  }

  setFromYaml(yamlData: any) {
    if (yamlData && typeof yamlData === 'object') {
      this.json = {};
      for (const key in yamlData) {
        this.json[key] = yamlData[key] === true;
      }
    }
  }

  isValid() {
    return this.json &&
      Object.values(this.json).every((value) => value === true)
      ? true
      : false;
  }

  getProperKeyName(key: string) {
    key = key.replace(/([A-Z])/g, " $1");
    key = key.replace(/\(required\)/g, "")
      .replace(/guideline/g, "")
      .replace(/</g, "")
      .replace(/>/g, "")
      .trim();
    return key.charAt(0).toUpperCase() + key.slice(1);
  }
}

export default Validation;
