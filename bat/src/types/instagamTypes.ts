export interface GraphqlResponce {
  data: {
    hashtag: HashTag;
  };
  status: string;
}

export interface HashTag {
  id: string;
  name: string;
  edge_hashtag_to_media: {
    count: number;
    page_info: {
      has_next_page: boolean;
      end_cursor: string;
    };
    edges: Media[];
  };
}

export interface Media {
  node: {
    id: string;
    edge_media_to_caption: {
      edges: Caption[];
    };
    shortcode: string;
    taken_at_timestamp: number;
    dimensions: {
      height: number;
      width: number;
    };
    display_url: string;
    thumbnail_src: string;
    edge_liked_by: {
      count: number;
    };
    owner: {
      id: string;
    };
    is_video: boolean;
  };
}

export interface Caption {
  node: {
    text: string;
  };
}
