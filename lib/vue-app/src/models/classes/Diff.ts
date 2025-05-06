import DiffMatchPatch from "diff-match-patch";

class Diff {
  beforeText: string;
  afterText: string;
  beforeHtml: string;
  afterHtml: string;

  constructor(beforeText: string = "", afterText: string = "") {
    this.beforeText = beforeText;
    this.afterText = afterText;
    this.beforeHtml = "";
    this.afterHtml = "";
  }

  shouldRender() {
    return this.afterText && this.afterText.trim() !== this.beforeText.trim();
  }

  compare() {
    const diff = new DiffMatchPatch().diff_main(
      this.beforeText,
      this.afterText
    );
    this.beforeHtml = this.generateHtml(diff, "removed");
    this.afterHtml = this.generateHtml(diff, "added");
  }

  generateHtml(diff: any, type: string) {
    // diffType dictates if we highlight 'removed' or 'added' chars
    const diffType = type === "removed" ? -1 : 1;
    // diffClass specifies the CSS class to handle the highlighting in the HTML
    const diffClass =
      type === "removed" ? "diff-text-removed" : "diff-text-added";
    let diffHtml = "";

    // Diff the before and after strings and build the requested HTML from the results
    diff.forEach((diffArray: [number, string]) => {
      // diff is an array, of arrays of [number, string], where number is:
      //   -1 for removed text
      //    0 for unchanged text
      //    1 for added text
      // string is the text itself.

      // If the number (diffArray[0]) matches our diffType (removed or added),
      // add the string to our HTML with the desired CSS class
      if (diffArray[0] === diffType) {
        diffHtml +=
          '<span class="' + diffClass + '">' + diffArray[1] + "</span>";
      }
      // If not, we don't want to apply a CSS class, so we just add the string
      else if (diffArray[0] == 0) {
        diffHtml += diffArray[1];
      }
    });
    return diffHtml;
  }
}

export default Diff;
