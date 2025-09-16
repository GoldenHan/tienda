"use client"

import { useState } from "react"
import { Product } from "@/lib/types"
import { getReorderSuggestion } from "@/app/actions"
import { SuggestReorderPointsOutput } from "@/ai/flows/suggest-reorder-points"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ReorderSuggestionModalProps {
  product: Product
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function ReorderSuggestionModal({
  product,
  isOpen,
  onOpenChange,
}: ReorderSuggestionModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<SuggestReorderPointsOutput | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateSuggestion = async () => {
    setIsLoading(true)
    setError(null)
    setSuggestion(null)

    // Mocked data for the AI flow
    const input = {
      productName: product.name,
      productId: product.id,
      historicalSalesData: "Sold 5 units last week, 8 units the week before.",
      currentInventoryLevel: product.quantity,
      leadTime: 7, // days
      averageDailySales: 1.5,
    }

    const result = await getReorderSuggestion(input)

    if ("error" in result) {
      setError(result.error)
    } else {
      setSuggestion(result)
    }
    setIsLoading(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setSuggestion(null)
      setError(null)
      setIsLoading(false)
    }, 300)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            Reorder Suggestion
          </DialogTitle>
          <DialogDescription>
            Use AI to get a reorder point suggestion for "{product.name}".
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {suggestion ? (
            <div className="space-y-4">
              <Alert variant="default" className="bg-accent/50 border-accent">
                <CheckCircle className="h-4 w-4 text-accent-foreground" />
                <AlertTitle className="text-accent-foreground">Suggestion Generated</AlertTitle>
                <AlertDescription className="text-accent-foreground/80">
                  {suggestion.reasoning}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-sm text-muted-foreground">Reorder Point</p>
                  <p className="text-2xl font-bold font-headline">{suggestion.reorderPoint}</p>
                  <p className="text-xs text-muted-foreground">units</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-sm text-muted-foreground">Reorder Quantity</p>
                  <p className="text-2xl font-bold font-headline">{suggestion.reorderQuantity}</p>
                   <p className="text-xs text-muted-foreground">units</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-8 bg-secondary/50 rounded-lg">
              Click the button below to generate an AI-powered reorder suggestion.
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          {suggestion ? (
            <Button variant="ghost" onClick={handleGenerateSuggestion} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                "Regenerate"
              )}
            </Button>
          ) : (
             <Button className="w-full" onClick={handleGenerateSuggestion} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Suggestion
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
