import AlertType from "@/models/types/AlertType";

class Alert {
  id: number;
  type: AlertType;
  text: string;

  constructor(id: number, type: AlertType, text: string) {
    this.id = id;
    this.type = type;
    this.text = text;
  }
}

export default Alert;
