import Validation from "./Validation";
import Diff from "./Diff";

class Message {
  id: number;
  sender: string;
  text: string;
  validation: Validation;
  diff: Diff;
  isLoading: boolean;
  error: any;
  retries: number;

  constructor(
    id: number,
    sender: string,
    text: string = "",
    isLoading: boolean = false
  ) {
    this.id = id;
    this.sender = sender;
    this.text = text;
    this.validation = new Validation();
    this.diff = new Diff();
    this.isLoading = isLoading;
    this.error = null;
    this.retries = 0;
  }

  async fakeStream(text: string) {
    this.isLoading = true;
    await new Promise((resolve) => setTimeout(resolve, 300));
    const fakeTokens = text.split(" ");
    for (let i = 0; i < fakeTokens.length; i++) {
      this.text += fakeTokens[i] + " ";
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    this.isLoading = false;
  }
}

export default Message;
