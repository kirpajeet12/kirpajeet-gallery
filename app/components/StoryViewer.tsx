'use client';

import { useEffect, useRef, useState } from 'react';
import { getUrl } from 'aws-amplify/storage';
import type { Memory } from '@/lib/client';

const SLIDE_MS = 6000;

export default function StoryViewer({
  memories,
  startIndex,
  onClose,
}: {
  memories: Memory[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [imgUrl, setImgUrl] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = memories[index];

  // Load the image + music for the current slide
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const img = await getUrl({ path: current.imageKey });
      if (!cancelled) setImgUrl(img.url.toString());

      if (current.musicKey) {
        const music = await getUrl({ path: current.musicKey });
        if (!cancelled && audioRef.current) {
          audioRef.current.src = music.url.toString();
          audioRef.current.play().catch(() => {});
        }
      } else if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [index, current]);

  // Auto-advance
  useEffect(() => {
    const t = setTimeout(() => next(), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index]);

  function next() {
    if (index < memories.length - 1) setIndex(index + 1);
    else onClose();
  }
  function prev() {
    if (index > 0) setIndex(index - 1);
  }

  return (
    <div className="story">
      <div className="bars">
        {memories.map((_, i) => (
          <div className="bar" key={i}>
            <span
              className={`fill ${i < index ? 'done' : ''} ${
                i === index ? 'active' : ''
              }`}
              style={{ ['--dur' as any]: `${SLIDE_MS}ms` }}
            />
          </div>
        ))}
      </div>

      <div className="tag">
        {current.musicKey ? <span>♪ playing</span> : null}
      </div>

      <button className="close" onClick={onClose} aria-label="close">
        ×
      </button>

      {imgUrl && <img src={imgUrl} alt={current.caption ?? ''} />}

      {current.caption && <div className="caption">{current.caption}</div>}

      <button className="nav left" onClick={prev} aria-label="previous" />
      <button className="nav right" onClick={next} aria-label="next" />

      <audio ref={audioRef} loop />
    </div>
  );
}
