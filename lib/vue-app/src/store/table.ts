import { defineStore } from "pinia";
import v3 from "murmurhash";
import { parse, ARR, STR, OBJ } from "partial-json";
import { useUiStore } from "@/store/ui";
import WebSocketTimeout from "@/utils/websocket-timeout";
import TableItem from "@/models/types/TableItem";
import {
  combineSubmissionsApi,
  recommendSubmissionsApi,
  viewAssociateApi,
  viewManagerApi,
} from "@/services/api-service";
import {
  cleanJsonString,
  getQueryPayload,
  getRecommendationPayload,
  getCombineSubmissionsPayload,
} from "@/utils/table";
import { fetchUserAttributes } from "aws-amplify/auth";

// Configure state references
const uiStore = useUiStore();
const { addAlert } = uiStore;

type CachedRecommendation = {
  rowNums: number[];
  text: string;
  explanations: string[];
};

// Helper function to handle errors
function handleError(err: any) {
  console.error(err);
  addAlert("error", "There was an error with your request. Please retry.");
}

export const useTableStore = (tableType: string) =>
  defineStore(`tableStore/${tableType}`, {
    state: () => ({
      tableType: tableType,
      items: [] as TableItem[],
      selectedItems: [] as number[],
      itemsHash: 0,
      isLoadingItems: false,
      itemsPerPage: 10,
      totalPages: 1,
      currentPage: 1,
      month: null as number | null,
      category: null as string | null,
      name: "" as string | undefined,
      customer: "",
      cachedRecommendations: new Map<number, CachedRecommendation>(),
      recommendationResponseStreams: {} as { [key: number]: any },
      isLoadingRecommendations: false,
      combinedSubmissions: "",
      isLoadingCombinedSubmissions: false,
      websocketTimeout: new WebSocketTimeout(),
    }),

    getters: {
      getCurrentRecommendation: (state) => {
        return state.cachedRecommendations.get(state.itemsHash);
      },
      getItemCount: (state) => state.items.length,
      getSelectedItemCount: (state) => state.selectedItems.length,

      // Sort the list of items by date (ascending)
      getItemsSortedByDate: () => (items: TableItem[]) =>
        items.sort((a, b) => {
          const dateA = new Date(a.submission_ts).getTime();
          const dateB = new Date(b.submission_ts).getTime();
          return dateB - dateA; // Sort in descending order
        }),

      // Sort the list of items by GenAI recommendations
      getItemsSortedByRecommendation: (state) => (items: TableItem[]) => {
        const currentRecommendation = state.cachedRecommendations.get(
          state.itemsHash
        );
        if (currentRecommendation) {
          const recommendationItems = currentRecommendation.rowNums.flatMap(
            (rowNum: number) => items.filter((item) => item.row_num === rowNum)
          );
          const otherItems = items.filter(
            (item) => !currentRecommendation.rowNums.includes(item.row_num)
          );
          return [...recommendationItems, ...otherItems];
        } else {
          return items;
        }
      },

      // Add row numbers to items (used by genAI recommendations)
      getItemsWithRowNums: () => (items: any[]) =>
        items.map((item, index) => ({
          row_num: index + 1,
          submission_ts: item.submission_ts,
          name: item.name,
          customer: item.customer,
          category: item.category,
          "text": item["text"],
        })),

      // Check if the item list has changed
      isItemListUpdated: (state) => (newResults: any[]) => {
        const newHash = v3(JSON.stringify(newResults));
        return newHash !== state.itemsHash;
      },
    },

    actions: {
      // Reset the list of items (to clean up the UI)
      clearTableItems() {
        this.items = [];
        this.selectedItems = [];
        this.itemsHash = 0;
        this.totalPages = 1;
        this.currentPage = 1;
      },

      // Fetch combined submissions
      async fetchCombinedSubmissions() {
        this.isLoadingCombinedSubmissions = true;
        this.combinedSubmissions = "";
        try {
          // map the selectedItems array to get the text of each submission
          const payload = getCombineSubmissionsPayload(
            this.tableType,
            this.selectedItems.map((row_num) => this.items.find((item) => item.row_num === row_num ))
          );
          await combineSubmissionsApi(payload);
            this.websocketTimeout.start(() => {
              this.isLoadingCombinedSubmissions = false;
              uiStore.showCombinedSubmissionsDialog = false;
              handleError("WebSocket timeout");
            });
        } catch (err: any) {
          this.websocketTimeout.clear();
          this.isLoadingCombinedSubmissions = false;
          uiStore.showCombinedSubmissionsDialog = false;
          handleError(err);
        }
      },

      // Fetch GenAI Recommendations based on current item set's hash value
      async fetchGenAiRecommendations() {
        this.recommendationResponseStreams[this.itemsHash] = "";
        try {
          // Fetch recommendation if not yet cached
          if (!this.cachedRecommendations.has(this.itemsHash)) {
            this.isLoadingRecommendations = true;
            const payload = getRecommendationPayload(
              this.tableType,
              this.items,
              this.itemsHash
            );
            await recommendSubmissionsApi(payload);
            this.websocketTimeout.start(() => {
              this.isLoadingRecommendations = false;
              uiStore.showGenAiInsights = false;
              handleError("WebSocket timeout");
            });
          } else {
            // Recommendation is cached, sort items by recommendation
            this.sortItemsByRecommendation();
          }
        } catch (err: any) {
          this.websocketTimeout.clear();
          this.isLoadingRecommendations = false;
          handleError(err);
        }
      },

      // Fetch the table items from DynamoDB based on the query criteria
      async fetchTableItems() {
        if (tableType === 'associate') {
          const { name } = await fetchUserAttributes();
          this.name = name;  
        }
        const query = getQueryPayload(
          this.tableType,
          this.month,
          this.category,
          this.name,
          this.customer
        );
        try {
          this.isLoadingItems = true;
          this.clearTableItems();
          const queryApi =
            this.tableType === "associate" ? viewAssociateApi : viewManagerApi;
          await queryApi(query)
            .then((data: any) => {
              if (data.data.length > 0) {
                const formattedData = this.getItemsWithRowNums(data.data);
                this.setTableItems(formattedData);
                // Fetch GenAI recommendations
                if (uiStore.showGenAiInsights) {
                  this.fetchGenAiRecommendations();
                }
              }
            })
            .catch((err: any) => {
              handleError(err);
            });
        } catch (err: any) {
          handleError(err);
        }
        this.isLoadingItems = false;
      },

      // Receive LLM response for GenAI Recommendations and Combined Submissions
      async receiveModelResponse(msgId: string | number, token: string) {
        // Message is not yet complete. Process response stream.
        if (token !== "<END>") {
          // We can assume that msg id of number type is for genAI recommendations
          if (typeof(msgId) === "number") {
            this.recommendationResponseStreams[msgId] += token;
            try {
              // Parse the partial JSON response
              const cleanJson = cleanJsonString(this.recommendationResponseStreams[msgId]);
              const partialJson = parse(cleanJson, ARR | STR | OBJ);
              // Cache the recommendation response
              this.writeGenAiRecommendationToCache(msgId, {
                rowNums:
                  "submission_nos" in partialJson ? partialJson.submission_nos : [],
                text: "preamble" in partialJson ? partialJson.preamble : "",
                explanations:
                  "explanations" in partialJson ? partialJson.explanations : [],
              });
            }
            catch(_) {
              // Continue
            }
          } else if (msgId === "combine_submissions") {
            // Else we can assume the msg is for combined submissions
            this.combinedSubmissions += token;
          }
        }
        // Else we've received <END> token and message is complete
        else {
          this.websocketTimeout.clear();
          // We can assume that msg id of number type is for genAI recommendations
          if (typeof(msgId) === "number") {
            this.isLoadingRecommendations = false;
            // Convert result to JSON
            try {
              const cleanJson = cleanJsonString(this.recommendationResponseStreams[msgId]);
              const jsonResponse = JSON.parse(cleanJson);
              // Cache the recommendation response
              this.writeGenAiRecommendationToCache(msgId, {
                rowNums: jsonResponse.submission_nos,
                text: jsonResponse.preamble,
                explanations: jsonResponse.explanations,
              });
              // Sort the table items by recommendation
              if (msgId === this.itemsHash) {
                this.sortItemsByRecommendation();
              }
            }
            catch (err: any) {
              handleError(err);
            }
          } else if (msgId === "combine_submissions") {
            // Else we can assume the msg is for combined submissions
            this.isLoadingCombinedSubmissions = false;
          }
        }
      },

      // Set a list of items into state memory
      setTableItems(items: TableItem[]) {
        const sortedItems = this.getItemsSortedByDate(items);
        // Updated items and related state
        this.items = sortedItems;
        this.itemsHash = v3(JSON.stringify(this.items));
        this.totalPages = Math.ceil(this.items.length / this.itemsPerPage);
        this.currentPage = 1;
      },

      // Sort items by date
      sortItemsByDate() {
        this.items = this.getItemsSortedByDate(this.items);
      },

      // Sort items by recommendation
      sortItemsByRecommendation() {
        this.items = this.getItemsSortedByRecommendation(this.items);
      },

      // Cache the GenAI recommendations for the current item set
      // Write the retrieved recommendations into our in-memory cache
      writeGenAiRecommendationToCache(
        itemsHash: number,
        recommendationData: {
          rowNums: number[];
          text: string;
          explanations: string[];
        }
      ) {
        this.cachedRecommendations.set(itemsHash, recommendationData);
      },
    },
  })();
