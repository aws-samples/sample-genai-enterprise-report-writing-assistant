import { defineStore } from "pinia";
import Alert from "@/models/classes/Alert";
import AlertType from "@/models/types/AlertType"

export const useUiStore = defineStore("uiStore", {
  state: () => ({
    isSideNavOpen: false,
    isHelpPanelOpen: false,
    showCombinedSubmissionsDialog: false,
    showGenAiInsights: false,
    showRephraseDiff: true,
    alerts: [] as Alert[],
  }),

  actions: {
    async addAlert(type: AlertType, text: string) {
      const index =
        this.alerts.length > 0 ? this.alerts[this.alerts.length - 1].id + 1 : 0;
      const alert = new Alert(index, type, text);
      this.alerts.push(alert);
      // To close alerts automatically after n seconds, comment out the next two lines
      // await new Promise((resolve) => setTimeout(resolve, 6000));
      // this.removeAlert(alert.id);
    },

    removeAlert(id: number) {
      const index = this.alerts.findIndex((i) => {
        return i.id === id;
      });
      this.alerts.splice(index, 1);
    },

    scrollToBottom(delay: number = 0) {
      setTimeout(() => {
        window.scroll({ top: document.body.scrollHeight, behavior: "smooth" });
      }, delay);
    },
  },
});
