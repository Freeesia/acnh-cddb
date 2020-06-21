import { Tweet } from "@core/models/twitterTypes";

export interface SearchResponse {
  statuses: Tweet[];
  search_metadata: {
    max_id_str: string;
    next_results?: string;
    count: number;
    since_id_str: string;
  };
}
