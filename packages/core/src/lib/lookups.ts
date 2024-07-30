const RevertMessageToUserError = {
  "[OverrideSystem] Incorrect payment.": "Price for this action has changed. Please try again.",
};

export const getFriendlyErrorMessage = (message: string) => {
  const key = message.replace("Execution reverted with reason: revert: ", "");
  if (!(key in RevertMessageToUserError)) {
    return message;
  }

  return RevertMessageToUserError[key as keyof typeof RevertMessageToUserError];
};
