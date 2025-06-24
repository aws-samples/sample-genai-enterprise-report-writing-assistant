export interface ValidationProps {
  [key: string]: boolean;
}

class Validation {
  responseString: string;
  json: ValidationProps | null;

  constructor() {
    this.responseString = "";
    this.json = null;
  }

  parseResponseString() {
    let responseString = this.responseString;

    // Check if the string ends with a closing brace
    if (!responseString.trim().endsWith('}') && !responseString.trim().endsWith('>')) {
      // If not, add it
      responseString += '}';
    }

    // Extract content between curly braces using regex
    const matches = responseString.match(/{[\s\S]*}/);
    if (!matches) {
      throw new Error(`No valid JSON object found in curly braces: ${this.responseString}`);
    }

    const jsonString = matches[0];

    // Parse the response string into a JSON object
    const parsedResponse = JSON.parse(
      jsonString.replace(/\\"/g, '"')
    );

    // Map the parsed response to our validation key-value pairs
    this.json = {};
    for (const parsedKey in parsedResponse) {
      const jsonKey =
        parsedKey === "ALL"
          ? "all"
          : parsedKey.charAt(0).toLowerCase() + parsedKey.slice(1);
      this.json[jsonKey] = parsedResponse[parsedKey] === "TRUE";
  }
}


  isValid() {
    // Return true if all values in validation JSON are true
    return this.json &&
      Object.values(this.json).every((value) => value === true)
      ? true
      : false;
  }

  getProperKeyName(key: string) {
    // insert a space in front of any capital letter in the string
    key = key.replace(/([A-Z])/g, " $1");
    // Remove unwanted text and characters
    key = key.replace(/\(required\)/g, "")
      .replace(/guideline/g, "")
      .replace(/</g, "")
      .replace(/>/g, "")
      .trim();
    // Capitalize the first character and return
    return key.charAt(0).toUpperCase() + key.slice(1);
  }
}

export default Validation;
