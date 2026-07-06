export interface Gif {
  id: string;
  title: string;
  mp4Url: string;
  gifUrl: string;
  stillUrl: string;
}

interface GiphyApiGif {
  id: string;
  title: string;
  images: {
    fixed_height: { mp4: string; url: string };
    fixed_height_still: { url: string };
  };
}

interface GiphyApiResponse {
  data: GiphyApiGif[];
}

export class GiphyRateLimitError extends Error {
  constructor() {
    super("Giphy API rate limit reached");
    this.name = "GiphyRateLimitError";
  }
}

function mapGifs(data: GiphyApiGif[]): Gif[] {
  return data.map((gif) => ({
    id: gif.id,
    title: gif.title,
    mp4Url: gif.images.fixed_height.mp4,
    gifUrl: gif.images.fixed_height.url,
    stillUrl: gif.images.fixed_height_still.url,
  }));
}

export interface GiphyClientOptions {
  apiKey: string;
  // Called once per network request, e.g. to feed useRequestBudget.
  onRequest?: () => void;
}

export interface SearchOptions {
  limit: number;
  offset: number;
}

export interface TrendingOptions {
  limit: number;
  rating?: string;
}

export interface RandomOptions {
  rating?: string;
}

export class GiphyClient {
  private readonly apiKey: string;
  private readonly onRequest?: () => void;
  private readonly baseUrl = "https://api.giphy.com/v1/gifs";

  constructor({ apiKey, onRequest }: GiphyClientOptions) {
    this.apiKey = apiKey;
    this.onRequest = onRequest;
  }

  private async request(path: string, params: Record<string, string>): Promise<Gif[]> {
    const searchParams = new URLSearchParams({ api_key: this.apiKey, ...params });
    const response = await fetch(`${this.baseUrl}/${path}?${searchParams.toString()}`);
    this.onRequest?.();

    if (response.status === 429) {
      throw new GiphyRateLimitError();
    }
    if (!response.ok) {
      throw new Error(`Giphy API error: ${response.status}`);
    }

    const data: GiphyApiResponse = await response.json();
    return mapGifs(data.data);
  }

  search(query: string, { limit, offset }: SearchOptions): Promise<Gif[]> {
    return this.request("search", {
      q: query,
      limit: String(limit),
      offset: String(offset),
    });
  }

  trending({ limit, rating }: TrendingOptions): Promise<Gif[]> {
    return this.request("trending", {
      limit: String(limit),
      ...(rating ? { rating } : {}),
    });
  }

  async random({ rating }: RandomOptions = {}): Promise<Gif> {
    const searchParams = new URLSearchParams({
      api_key: this.apiKey,
      ...(rating ? { rating } : {}),
    });
    const response = await fetch(`${this.baseUrl}/random?${searchParams.toString()}`);
    this.onRequest?.();

    if (response.status === 429) {
      throw new GiphyRateLimitError();
    }
    if (!response.ok) {
      throw new Error(`Giphy API error: ${response.status}`);
    }

    const { data }: { data: GiphyApiGif } = await response.json();
    return mapGifs([data])[0];
  }
}
