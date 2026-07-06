import { useEffect, useState, useCallback } from 'react'
import SearchBar from "./SearchBar";
import GifList from "./GifList";
import Toast from "./Toast";
import "./styles.css";

interface Gif {
  id: string;
  title: string;
  mp4Url: string;
  stillUrl: string;
}

const RESULTS_PER_PAGE = 25;
const API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

function mapGifs(data: any[]): Gif[] {
  return data.map((gif: any) => ({
    id: gif.id,
    title: gif.title,
    mp4Url: gif.images.fixed_height.mp4,
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
  }, []);

  const searchGifs = useCallback(
    async (searchQuery: string, isNewSearch: boolean) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      isNewSearch ? setIsLoading(true) : setIsLoadingMore(true);
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
      <h1>NotGiphy</h1>
      <h2>Start searching for gifs!</h2>
      <SearchBar onSearch={handleSearch} isLoading={isLoading} initialQuery={query} />

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
    </div>
  )
}

export default App
