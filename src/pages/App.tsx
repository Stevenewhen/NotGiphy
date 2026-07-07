import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import SearchBar from "../components/SearchBar";
import GifList from "../components/GifList";
import Toast from "../components/Toast";
import ApiLimitBadge from "../components/ApiLimitBadge";
import { useRequestBudget } from "../hooks/useRequestBudget";
import { GiphyClient, GiphyRateLimitError } from "../api/giphyClient";
import type { Gif } from "../api/giphyClient";
import "./styles.css";

const RESULTS_PER_PAGE = 24;
const API_KEY = import.meta.env.VITE_GIPHY_API_KEY;
// Giphy's free/Beta API key is capped at 100 requests/hour per Google.
const HOURLY_LIMIT = 100;
const WARNING_RATIO = 0.85;

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

  const giphyClient = useMemo(
    () => new GiphyClient({ apiKey: API_KEY, onRequest: recordRequest }),
    [recordRequest]
  );

  useEffect(() => {
    const nearLimit = used >= Math.ceil(limit * WARNING_RATIO);
    if (nearLimit && !hasWarnedRef.current) {
      hasWarnedRef.current = true;
      setIsLimitWarningVisible(true);
    } else if (!nearLimit) {
      hasWarnedRef.current = false;
    }
  }, [used, limit]);

  useEffect(() => {
    if (getQueryFromUrl()) return;

    const loadPreview = async () => {
      try {
        // Requirements wanted 3 but I have 4 columns.
        const results = await Promise.all([
          giphyClient.random({ rating: 'g' }),
          giphyClient.random({ rating: 'g' }),
          giphyClient.random({ rating: 'g' }),
          giphyClient.random({ rating: 'g' }),
        ]);
        setGifs(results);
      } catch (err) {
        if (err instanceof GiphyRateLimitError) {
          setIsRateLimited(true);
        }

      }
    };

    loadPreview();

  }, [giphyClient]);

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
        const results = await giphyClient.search(trimmed, {
          limit: RESULTS_PER_PAGE,
          offset: currentOffset,
        });

        setIsRateLimited(false);
        setGifs((prev) => (isNewSearch ? results : [...prev, ...results]));
        setHasMore(results.length === RESULTS_PER_PAGE);
        setOffset(currentOffset + results.length);

        if (isNewSearch) {
          const url = new URL(window.location.href);
          url.searchParams.set('q', trimmed);
          window.history.pushState({}, '', url);
        }
      } catch (err) {
        if (err instanceof GiphyRateLimitError) {
          // Keep whatever gifs are already on screen — don't wipe them out.
          setIsRateLimited(true);
          return;
        }
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [offset, giphyClient]
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
