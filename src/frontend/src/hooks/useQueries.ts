import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useGetReviews(toolId: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["reviews", toolId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReviewsByTool(toolId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      toolId,
      rating,
      comment,
    }: {
      toolId: string;
      rating: number;
      comment: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.submitReview(toolId, BigInt(rating), comment);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", variables.toolId],
      });
    },
  });
}
