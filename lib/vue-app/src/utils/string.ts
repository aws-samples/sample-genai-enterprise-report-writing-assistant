export function formatCategory(text: string) {
    const words = text.split("-");
    words.forEach((word, index) => words[index] = word.charAt(0).toUpperCase() + word.slice(1));
    return words.join(" ");
}
