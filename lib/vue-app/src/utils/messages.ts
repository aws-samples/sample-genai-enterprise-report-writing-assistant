import { formatCategory } from "@/utils/string";
import { SubmissionType } from "@/models/enums/SubmissionType";

export const getStartMessage = (submissionType: string) => {
  switch (submissionType) {
    case SubmissionType.ACHIEVEMENT:
      return (
        "Let's get started!\n\nBegin writing your achievement below and I will provide feedback and validate that it meets guidelines. " +
        'Clearly state the "Accomplishment" and "Impact", of your achievement.\n\nYou ' +
        "can also ask me writing-related questions."
      );
    case SubmissionType.CHALLENGE:
      return (
        "Let's get started! Begin writing your challenge below and submit it for feedback.\n\n" +
        'Clearly state the "Challenge" and "Impact"'
      );
    default:
      return "";
  }
};

export const getRephraseInstructions = (submissionType: string) => {
  return (
    `Excellent! Your ${submissionType.replace(
      "-",
      " "
    )} meets the guidelines. Now, if you'd like me to rewrite it for you following best writing practices, select "Rephrase". ` +
    `When you're ready to continue, select "Next".`
  );
};

export const getAfterDiffInstructions = () => {
  return (
    "You can continue to edit your submission below or attempt to " +
    'rephrase it again. If you are ready to save and submit it, click "Next".'
  );
};

export const getExtractCustomerResponse = (
  submissionType: string,
  customer: string
) => {
  return customer
    ? `I found the customer name "${customer}" in your ${submissionType}. Please verify it below and edit it if needed.`
    : `I couldn't find the customer name in your ${submissionType}. Please enter it below.`;
};

export const getSaveInstructions = (
  submissionType: string,
  customer: string
) => {
  const noCustomer = "Enter the customer name";
  const hasCustomer = `Verify that "${customer}" is the correct customer name`;
  return (
    `Okay! Please review your submission below. ${
      customer ? hasCustomer : noCustomer
    } ` +
    `and click "Save" to save your ${submissionType}.`
  );
};

export const getSaveSuccessMessage = (
  submissionType: string,
  customer: string
) => {
  return (
    "Your " +
    submissionType +
    " for " +
    customer +
    " " +
    "has been saved. NOTE: This tool is not connected to official databases or Quip docs. Please manually copy and paste your entry into your team's current workflow."
  );
};
