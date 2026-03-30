import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useGetReviews, useSubmitReview } from "@/hooks/useQueries";
import { Loader2, MessageSquare, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ReviewModalProps {
  toolId: string;
  toolName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReviewModal({
  toolId,
  toolName,
  open,
  onOpenChange,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const submitReview = useSubmitReview();
  const { data: reviews } = useGetReviews(toolId);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    try {
      await submitReview.mutateAsync({ toolId, rating, comment });
      toast.success("Review submitted! Thank you.");
      setRating(0);
      setComment("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to submit review. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-ocid="review.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Leave a Review — {toolName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {reviews && reviews.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {reviews.length} review{reviews.length !== 1 ? "s" : ""} so far
            </p>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Your Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110"
                  data-ocid={`review.star.${star}` as never}
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= (hovered || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Comment (optional)</p>
            <Textarea
              placeholder="Share your experience with this tool..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              data-ocid="review.textarea"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="review.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitReview.isPending}
            className="rounded-full"
            data-ocid="review.submit_button"
          >
            {submitReview.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-2 h-4 w-4" />
            )}
            {submitReview.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
