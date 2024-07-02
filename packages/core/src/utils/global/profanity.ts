import { englishDataset, englishRecommendedTransformers, RegExpMatcher, TextCensor } from "obscenity";

const censor = new TextCensor();
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

/**
 * Checks if the given text contains profanity.
 * @param text - The text to check.
 * @returns True if the text contains profanity, otherwise false.
 */
export const isProfane = (text: string): boolean => {
  return matcher.hasMatch(text);
};

/**
 * Censors profanity in the given text.
 * @param text - The text to censor.
 * @returns The censored text.
 */
export const censorText = (text: string): string => {
  const matches = matcher.getAllMatches(text.toString());
  return censor.applyTo(text, matches);
};
