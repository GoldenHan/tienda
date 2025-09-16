'use server'
import { suggestReorderPoints, type SuggestReorderPointsInput, type SuggestReorderPointsOutput } from '@/ai/flows/suggest-reorder-points'

export async function getReorderSuggestion(input: SuggestReorderPointsInput): Promise<SuggestReorderPointsOutput | { error: string }> {
  try {
    const result = await suggestReorderPoints(input);
    return result;
  } catch (error) {
    console.error('Error getting reorder suggestion:', error);
    return { error: 'An unexpected error occurred while generating the suggestion. Please try again.' };
  }
}