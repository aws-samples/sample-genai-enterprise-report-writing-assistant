import { v4 as uuidv4 } from "uuid";
import { defineStore } from "pinia";
import router from "@/router";
import { useUiStore } from "@/store/ui";
import Message from "@/models/classes/Message";
import WebSocketTimeout from "@/utils/websocket-timeout";
import SubmissionStep from "@/models/enums/SubmissionStep";
import {
  extractCustomerApi,
  chatApi,
  saveSubmissionApi,
} from "@/services/api-service";
import {
  getExtractCustomerResponse,
  getRephraseInstructions,
  getSaveInstructions,
  getStartMessage,
} from "@/utils/messages";
import { fetchUserAttributes } from "aws-amplify/auth";

const maxRetries = 5;
const baseRetryDelay = 1;

// Configure state references
const uiStore = useUiStore();
const { addAlert } = uiStore;

/**
 * Helper functions
 */

const isXmlTagStartOfJson = (tag: string) => {
  const startTags = ["<JSON>", "<JSON"]
  return startTags.some(word => tag.includes(word));
};
const isXmlTagEndOfJson = (tag: string) => {
  const startTags = ["</JSON>", "</"," </JSON"]
  return startTags.some(word => tag.includes(word));
};
const isTokenStartOfCodeBlock = (
  isReceivingRephrasedText: boolean,
  text: string
) => {
  return !isReceivingRephrasedText && text.includes("```");
};
const isTokenEndOfCodeBlock = (
  isReceivingRephrasedText: boolean,
  text: string
) => {
  return isReceivingRephrasedText && text.includes("```");
};
const doesMessageHaveRephrasedText = (message: Message) => {
  return (
    message.diff && message.diff.afterText && message.diff.afterText.length > 0
  );
};
const didMessagePassValidation = (message: Message) => {
  return message.validation && message.validation.isValid();
};
const isModelResponseCompleted = (text: string) => {
  return text.includes("<END>");
};
const isModelResponseAnErrorMessage = (text: string) => {
  return text.startsWith("<ERROR>");
};

/**
 * Create new state
 */
const createState = (submissionType: string) => {
  return {
    submissionType: submissionType,
    conversationId: uuidv4(),
    messages: [] as Message[],
    submissionStep: SubmissionStep.VALIDATE,
    submissionText: "",
    customer: "",
    isSubmissionValidated: false,
    hasExtractedCustomerName: false,
    isLoadingChatMessage: false,
    isLoadingExtractCustomer: false,
    isLoadingQueryModel: false,
    isLoadingSaveButton: false,
    isReceivingRephrasedText: false,
    isReceivingValidationJson: false,
    submissionTimestamp: "",
    websocketTimeout: new WebSocketTimeout(),
  };
};

/**
 * Define state functions
 */
export const useChatStore = (submissionType: string) =>
  defineStore(`chatStore/${submissionType}`, {
    state: () => createState(submissionType),

    getters: {
      /**
       * Returns true if there is a chat session in progress.
       */
      hasActiveSession(state) {
        return state.messages.length > 1;
      },
    },

    actions: {
      /**
       * Adds a new message to the chat history.
       */
      async createNewMessage(
        sender: string,
        text?: string,
        isLoading?: boolean
      ) {
        this.isLoadingChatMessage = true;
        const msgText = sender === "human" ? text : "";
        const message = new Message(
          this.messages.length,
          sender,
          msgText,
          isLoading
        );
        this.messages.push(message);

        if (sender === "assistant") {
          const newMessage = this.messages[this.messages.length - 1];
          // If we provided text, it is a fake assistant message, so fake stream it.
          if (text) {
            await newMessage.fakeStream(text);
            this.isLoadingChatMessage = false;
          }
          // Else if it is an LLM message waiting for a response, start error timeout.
          else {
            this.websocketTimeout.start(() => {
              const err = "Response timeout";
              this.handleMessageError(newMessage, err);
            });
          }
        }
        return message;
      },

      /**
       * Calls the LLM to extract the customer name.
       */
      async extractCustomerName(isManualRequest: boolean = false) {
        this.customer = "";
        this.isLoadingExtractCustomer = true;
        const payload = {
          query: this.submissionText,
          conversation_id: this.conversationId,
        };

        const handleError = async (err: any) => {
          console.error(err);
          const responseMessage = getExtractCustomerResponse(
            this.submissionType,
            ""
          );
          await this.createNewMessage("assistant", responseMessage);
        };

        try {
          await extractCustomerApi(payload).then(async (data) => {
            if (data && this.submissionStep === SubmissionStep.SAVE) {
              this.isLoadingExtractCustomer = false;
              if (typeof data === "string" || data instanceof String) {
                const response = String(data)
                  .replace(/</g, "")
                  .replace(/>/g, "")
                  .trim();
                this.customer = !response.includes("Enter customer name")
                  ? response
                  : "";
                const responseMessage = isManualRequest
                  ? getExtractCustomerResponse(
                      this.submissionType,
                      this.customer
                    )
                  : getSaveInstructions(this.submissionType, this.customer);
                if (!this.hasExtractedCustomerName) {
                  await this.createNewMessage("assistant", responseMessage);
                  this.hasExtractedCustomerName = true;
                }
              } else {
                handleError(data);
              }
            }
          });
        } catch (err: any) {
          handleError(err);
        }
        this.isLoadingExtractCustomer = false;
      },

      /**
       * Returns the message matching the message id.
       */
      findMessageById(messageId: number) {
        return this.messages.find((msg: Message) => msg.id === messageId);
      },

      /**
       * Handle message errors.
       */
      handleMessageError(msg: Message, err: any) {
        // If validation or rephrase step and we've received a throttling error, do a
        // simplistic backoff and retry. This is WIP attempt to resolve Bedrock issues.
        const message = this.findMessageById(msg.id) as Message;
        if (
          [SubmissionStep.VALIDATE, SubmissionStep.REPHRASE].includes(
            this.submissionStep
          ) &&
          (String(err).includes("throttlingException") ||
            String(err).includes("modelStreamErrorException")) &&
          message.retries < maxRetries
        ) {
          const retryDelay = baseRetryDelay * 2 ** message.retries;
          setTimeout(() => {
            message.retries += 1;
            console.warn(
              `Throttling exception. Retry attempt #${message.retries} with ${retryDelay} second delay.`
            );
            this.queryModel(this.submissionText, true, message);
          }, retryDelay * 1000);
        } else {
          console.error(err);
          this.websocketTimeout.clear();
          message.error = err;
          message.isLoading = false;
          this.isLoadingChatMessage = false;
          this.isLoadingQueryModel = false;
        }
      },

      /**
       * Navigates to next submission step.
       */
      navigateToNextSubmissionStep() {
        this.submissionStep += 1;
        // If this is the save submission step and the customer name is not
        // populated, query LLM for customer name.
        if (this.submissionStep === SubmissionStep.SAVE && !this.customer) {
          this.extractCustomerName();
        }
      },

      /**
       * Navigates to previous submission step.
       */
      navigateToPrevSubmissionStep() {
        this.submissionStep -= 1;
      },

      /**
       * Navigates to associate view page to show saved submission.
       */
      navigateToViewSavedSubmission(submissionTimestamp: string) {
        router.push({
          path: "/associate/view-submissions",
          query: { saved_ts: submissionTimestamp },
        }).then(() => {
          this.resetChatSession();
        });
      },

      /**
       * Query the LLM for validation and rephrasing.
       * Parameters:
       * - humanInput: The user's input.
       * - retry: Whether this is a retry.
       * - message: If this is a retry, the message to retry.
       */
      async queryModel(
        humanInput: string,
        retry: boolean = false,
        message?: Message
      ) {
        this.isLoadingQueryModel = true;
        // Add new messages in the UI
        if (!retry) {
          const humanMessage =
            this.submissionStep === SubmissionStep.REPHRASE
              ? "Please rephrase my submission."
              : humanInput;
          this.createNewMessage("human", humanMessage);
        }
        const assistantMessage = message
          ? message
          : await this.createNewMessage("assistant", "", true);

        // Create the query payload
        const action = this.submissionType;
        const payload: { [k: string]: any } = {
          conversation_id: this.conversationId,
          action: action,
          query: humanInput,
          message_id: assistantMessage.id,
        };

        // Determine which API endpoint to call
        let apiResource: string;
        if (this.submissionStep === SubmissionStep.REPHRASE) {
          apiResource = "rephrase";
        } else {
          apiResource = this.submissionType;
        }

        // Call the message API for asyncronous request. Response will come from WebSocket.
        try {
          await chatApi(apiResource, payload).catch((err: any) => {
            this.handleMessageError(assistantMessage, err);
          });
        } catch (err: any) {
          console.error(err);
          this.handleMessageError(assistantMessage, err);
        }
      },

      /**
       * Process completed LLM Response
       */
      processCompletedModelResponse(message: Message) {
        this.websocketTimeout.clear();
        message.text = message.text.trim();

        if (!message || !message.isLoading) {
          return;
        }

        // If user is on validation step
        if (this.submissionStep === SubmissionStep.VALIDATE) {
          // If the user's submission has passed validation
          if (didMessagePassValidation(message)) {
            this.isSubmissionValidated = true;
            // Advance user to rephrase step
            this.navigateToNextSubmissionStep();
            // Display next step instructions to the user
            const rephraseInstructions = getRephraseInstructions(
              this.submissionType
            );
            this.createNewMessage("assistant", rephraseInstructions);
          }
          // If there was no validation data in the response, it was a question
          if (!message.validation.json) {
            this.submissionText = "";
          }
        }
        // If user is on rephrase step
        else if (this.submissionStep === SubmissionStep.REPHRASE) {
          // If the message contains rephrased text
          if (doesMessageHaveRephrasedText(message)) {
            // Set the user's imput text as the before text
            message.diff.beforeText = this.submissionText.trim();
            // Replace the user's input text with the rephrased text
            this.submissionText = message.diff.afterText;
            // Start the diff comparison
            message.diff.compare();
          }
        }
        // Turn off "isLoading" flags
        message.isLoading = false;
        this.isLoadingQueryModel = false;
        this.isLoadingChatMessage = false;
      },

      /**
       * Process incomplete LLM response
       */
      processIncompleteModelResponse(message: Message, text: string) {
        // If user is in Validation step
        if (this.submissionStep === SubmissionStep.VALIDATE) {
          // Start of JSON
          if (isXmlTagStartOfJson(text)) {
            this.isReceivingValidationJson = true;
            message.validation.responseString += text;

          }
          // End of JSON
          else if (isXmlTagEndOfJson(text)) {
            this.isReceivingValidationJson = false;
            message.validation.responseString += text;
            message.validation.parseResponseString();

          }
          // Part of JSON
          else if (this.isReceivingValidationJson === true){
            message.validation.responseString += text;
          }
          // Else receiving other assistant response text
          else {
            message.text += text;
            message.text = message.text.trimStart();
          }
        }
        // If user is in Rephrase step
        else if (this.submissionStep === SubmissionStep.REPHRASE) {
          // Received start of code block (```)
          if (isTokenStartOfCodeBlock(this.isReceivingRephrasedText, text)) {
            this.isReceivingRephrasedText = true;
          }
          // Received end of code block (```)
          else if (isTokenEndOfCodeBlock(this.isReceivingRephrasedText, text)) {
            this.isReceivingRephrasedText = false;
          }
          // Currently receiving pieces of the rephrased text
          else if (this.isReceivingRephrasedText) {
            message.diff.afterText += text;
            message.diff.afterText = message.diff.afterText.trimStart();
          }
          // Else receiving other assistant response text
          else {
            message.text += text;
            message.text = message.text.trimStart();
          }
        }
      },

      /**
       * Processes LLM responses that arrive on the WebSocket connection.
       */
      async receiveModelResponse(messageId: number, text: string) {
        const message = this.findMessageById(messageId);
        if (message) {
          if (isModelResponseAnErrorMessage(text)) {
            const err = text.replace("<ERROR>", "");
            this.handleMessageError(message, err);
          } else if (isModelResponseCompleted(text)) {
            this.processCompletedModelResponse(message);
          } else {
            this.processIncompleteModelResponse(message, text);
          }  
        }
      },

      /**
       * Resets the chat session/history.
       */
      resetChatSession() {
        this.conversationId = uuidv4();
        this.customer = "";
        this.messages = [];
        this.submissionStep = SubmissionStep.VALIDATE;
        this.submissionText = "";
        this.isSubmissionValidated = false;
        this.hasExtractedCustomerName = false;
        this.submissionTimestamp = "";

        this.createNewMessage("assistant", getStartMessage(submissionType));
      },

      /**
       * Saves the user's completed submission to DynamoDB table
       */
      async saveSubmission() {
        const handleError = (err: any) => {
          console.error(err);
          addAlert(
            "error",
            "There was an error saving your submission. Please retry."
          );
          this.isLoadingSaveButton = false;
        };
        if (this.submissionTimestamp === "") {
          this.submissionTimestamp =
            new Date().toISOString().replace(/\.\d+Z$/, "") + ".000000";
        }
        const { name } = await fetchUserAttributes();
        const payload = {
          category: this.submissionType,
          customer: this.customer,
          text: this.submissionText,
          name: name,
          role: "associate",
          submission_ts: this.submissionTimestamp,
        };
        try {
          this.isLoadingSaveButton = true;
          await saveSubmissionApi(payload)
            .then(async () => {
              this.navigateToViewSavedSubmission(this.submissionTimestamp);
            })
            .catch((err: any) => {
              handleError(err);
            });
        } catch (err: any) {
          handleError(err);
        } finally {
          this.isLoadingSaveButton = false;
        }
      },
    },
  })();
