import { useEffect, useState, useCallback, useRef } from 'react'
import SearchBar from "./SearchBar";
import GifList from "./GifList";
import Toast from "./Toast";
import ApiLimitBadge from "./ApiLimitBadge";
import { useRequestBudget } from "./useRequestBudget";
import "./styles.css";

interface Gif {
  id: string;
  title: string;
  mp4Url: string;
  gifUrl: string;
  stillUrl: string;
}

const RESULTS_PER_PAGE = 24;
const API_KEY = import.meta.env.VITE_GIPHY_API_KEY;
// Giphy's free/Beta API key is capped at 42 requests/hour.
const HOURLY_LIMIT = 42;
const WARNING_RATIO = 0.85;

interface GiphyApiGif {
  id: string;
  title: string;
  images: {
    fixed_height: { mp4: string; url: string };
    fixed_height_still: { url: string };
  };
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

function getQueryFromUrl(): string {
  return new URLSearchParams(window.location.search).get('q') || '';
}

function App() {
  const [query, setQuery] = useState(getQueryFromUrl);
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isLimitWarningVisible, setIsLimitWarningVisible] = useState(false);
  const hasWarnedRef = useRef(false);

  const { used, limit, recordRequest } = useRequestBudget(HOURLY_LIMIT);

  useEffect(() => {
    const nearLimit = used >= Math.ceil(limit * WARNING_RATIO);
    if (nearLimit && !hasWarnedRef.current) {
      hasWarnedRef.current = true;
      setIsLimitWarningVisible(true);
    } else if (!nearLimit) {
      hasWarnedRef.current = false;
    }
  }, [used, limit]);

  // Load 3 random-ish gifs to show before the user has searched at all.
  useEffect(() => {
    if (getQueryFromUrl()) return; // a shared/bookmarked search link takes priority

    const loadPreview = async () => {
      try {
        const params = new URLSearchParams({
          api_key: API_KEY,
          limit: '3',
          rating: 'g',
        });
        const response = await fetch(
          `https://api.giphy.com/v1/gifs/trending?${params.toString()}`
        );
        recordRequest();
        if (response.status === 429) {
          setIsRateLimited(true);
          return;
        }
        if (!response.ok) return;
        const data = await response.json();
        setGifs(mapGifs(data.data));
      } catch {
        // Non-critical — just skip the preview if it fails.
      }
    };

    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchGifs = useCallback(
    async (searchQuery: string, isNewSearch: boolean) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      if (isNewSearch) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const currentOffset = isNewSearch ? 0 : offset;

      try {
        const params = new URLSearchParams({
          api_key: API_KEY,
          q: trimmed,
          limit: String(RESULTS_PER_PAGE),
          offset: String(currentOffset),
        });
        const response = await fetch(
          `https://api.giphy.com/v1/gifs/search?${params.toString()}`
        );
        recordRequest();

        if (response.status === 429) {
          // Keep whatever gifs are already on screen — don't wipe them out.
          setIsRateLimited(true);
          return;
        }

        if (!response.ok) {
          throw new Error(`Giphy API error: ${response.status}`);
        }

        setIsRateLimited(false);
        const data = await response.json();
        const results = mapGifs(data.data);

        setGifs((prev) => (isNewSearch ? results : [...prev, ...results]));
        setHasMore(data.data.length === RESULTS_PER_PAGE);
        setOffset(currentOffset + data.data.length);

        if (isNewSearch) {
          const url = new URL(window.location.href);
          url.searchParams.set('q', trimmed);
          window.history.pushState({}, '', url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [offset]
  );

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    searchGifs(searchQuery, true);
  };

  const handleLoadMore = () => {
    searchGifs(query, false);
  };

  const handleCopy = () => {
    setIsToastVisible(true);
  };

  return (
    <div className="App">
      <ApiLimitBadge used={used} limit={limit} />
      <div className="app-header">
        <h1>
          <a href="/" className="app-title">NotGiphy</a>
        </h1>
        <h2>Start searching for gifs!</h2>
        <SearchBar onSearch={handleSearch} isLoading={isLoading} initialQuery={query} />
      </div>

      {isRateLimited && (
        <p className="warning">
          Giphy's API limit has been reached. Showing previously loaded results
          until it resets.
        </p>
      )}
      {error && <p className="error">{error}</p>}

      {gifs.length > 0 && <GifList gifs={gifs} onCopy={handleCopy} />}

      {gifs.length > 0 && hasMore && !isRateLimited && (
        <button
          className="load-more"
          onClick={handleLoadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? 'Loading...' : 'Load more'}
        </button>
      )}

      <Toast
        message="Gif URL copied!"
        isVisible={isToastVisible}
        onDismiss={() => setIsToastVisible(false)}
      />
      <Toast
        message={`Approaching Giphy's hourly limit (${used}/${limit})`}
        isVisible={isLimitWarningVisible}
        onDismiss={() => setIsLimitWarningVisible(false)}
        duration={3500}
      />
    </div>
  )
}

export default App
