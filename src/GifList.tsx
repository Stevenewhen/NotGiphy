import { useRef, useState } from 'react';

interface Gif {
  id: string;
  title: string;
  mp4Url: string;
  stillUrl: string;
}

interface GifListProps {
  gifs: Gif[];
  onCopy: (url: string) => void;
}

function GifTile({ gif, onCopy }: { gif: Gif; onCopy: (url: string) => void }) {
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      await navigator.clipboard.writeText(gif.mp4Url);
      onCopy(gif.mp4Url);
    } catch {
      // Clipboard API can fail (e.g. no permissions/insecure context) — fail silently for now.
    }
  };

  return (
    <div
      className="gif-list__item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
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
