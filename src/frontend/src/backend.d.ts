import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Review {
    comment: string;
    toolId: string;
    timestamp: bigint;
    rating: bigint;
}
export interface backendInterface {
    getAllReviewsByTool(toolId: string): Promise<Array<Review>>;
    getReview(id: bigint): Promise<Review>;
    submitReview(toolId: string, rating: bigint, comment: string): Promise<bigint>;
}
