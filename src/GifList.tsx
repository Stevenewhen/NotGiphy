import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

interface Gif {
  id: string;
  title: string;
  mp4Url: string;
  gifUrl: string;
  stillUrl: string;
}

interface GifListProps {
  gifs: Gif[];
  onCopy: (url: string) => void;
}

function GifTile({ gif, onCopy }: { gif: Gif; onCopy: (url: string) => void }) {
  const [isHovering, setIsHovering] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovering(true);
    videoRef.current?.play().catch(() => {
      // Autoplay can be blocked in some browsers even when muted; safe to ignore.
    });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(gif.gifUrl);
      onCopy(gif.gifUrl);
      navigator.vibrate?.(50);
      setIsCopied(true);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setIsCopied(false), 1500);
    } catch {
      // Clipboard API can fail (e.g. no permissions/insecure context) — fail silently for now.
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="gif-list__item"
      role="button"
      tabIndex={0}
      aria-label={`Copy link for ${gif.title || 'this GIF'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {!isHovering && (
        <img src={gif.stillUrl} alt={gif.title || 'GIF'} loading="lazy" />
      )}
      <video
        ref={videoRef}
        src={gif.mp4Url}
        muted
        loop
        playsInline
        preload="none"
        style={{ display: isHovering ? 'block' : 'none' }}
      />
      <span className="gif-list__hint">{isCopied ? 'Copied link' : 'Copy link'}</span>
    </div>
  );
}

export default function GifList({ gifs, onCopy }: GifListProps) {
  return (
    <div className="gif-list">
      {gifs.map((gif) => (
        <GifTile key={gif.id} gif={gif} onCopy={onCopy} />
      ))}
    </div>
  );
}
