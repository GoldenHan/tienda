// use server'

/**
 * @fileOverview Flow for suggesting reorder points for products based on historical sales data and current inventory levels.
 *
 * - suggestReorderPoints - A function that suggests reorder points for products.
 * - SuggestReorderPointsInput - The input type for the suggestReorderPoints function.
 * - SuggestReorderPointsOutput - The return type for the suggestReorderPoints function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestReorderPointsInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productId: z.string().describe('The ID of the product.'),
  historicalSalesData: z.string().describe('Historical sales data for the product, including dates and quantities sold.'),
  currentInventoryLevel: z.number().describe('The current inventory level of the product.'),
  leadTime: z.number().describe('The lead time in days for reordering the product.'),
  averageDailySales: z.number().describe('The average daily sales of product'),
});
export type SuggestReorderPointsInput = z.infer<typeof SuggestReorderPointsInputSchema>;

const SuggestReorderPointsOutputSchema = z.object({
  reorderPoint: z.number().describe('The suggested reorder point for the product.'),
  reorderQuantity: z.number().describe('The suggested reorder quantity for the product.'),
  reasoning: z.string().describe('The reasoning behind the suggested reorder point and quantity.'),
});
export type SuggestReorderPointsOutput = z.infer<typeof SuggestReorderPointsOutputSchema>;

export async function suggestReorderPoints(input: SuggestReorderPointsInput): Promise<SuggestReorderPointsOutput> {
  return suggestReorderPointsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestReorderPointsPrompt',
  input: {schema: SuggestReorderPointsInputSchema},
  output: {schema: SuggestReorderPointsOutputSchema},
  prompt: `You are an expert inventory management system. Based on the historical sales data, current inventory level, and lead time for reordering, suggest a reorder point and reorder quantity for the product.

Product Name: {{{productName}}}
Product ID: {{{productId}}}
Historical Sales Data: {{{historicalSalesData}}}
Current Inventory Level: {{{currentInventoryLevel}}}
Lead Time (days): {{{leadTime}}}
Average Daily Sales: {{{averageDailySales}}}

Considerations:
- The reorder point should be high enough to cover demand during the lead time.
- The reorder quantity should be sufficient to avoid frequent reorders but not so high that it leads to excess inventory.
- Take into account average daily sales and safety stock to determine these values.

Provide a brief explanation of your reasoning.
`,
});

const suggestReorderPointsFlow = ai.defineFlow(
  {
    name: 'suggestReorderPointsFlow',
    inputSchema: SuggestReorderPointsInputSchema,
    outputSchema: SuggestReorderPointsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
