import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useDebounce } from '../hooks/useDebounce';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  initialQuery?: string;
}

export default function SearchBar({
  onSearch,
  isLoading = false,
  placeholder = 'Search GIFs...',
  initialQuery = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  }, [debouncedQuery]);

  // Enter/submit searches immediately, bypassing the debounce wait.
  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search GIFs"
        className="search-bar__input"
      />
      <button
        type="submit"
        className="search-bar__button"
        disabled={isLoading || !query.trim()}
      >
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
}
