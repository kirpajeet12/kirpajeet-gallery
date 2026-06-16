'use client';

import { useEffect, useState, useCallback } from 'react';
import { getUrl } from 'aws-amplify/storage';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { client, type Memory } from '@/lib/client';
import UploadModal from './components/UploadModal';
import StoryViewer from './components/StoryViewer';

type TileData = Memory & { url: string };

function GalleryApp() {
  const { authStatus, signOut } = useAuthenticator((c) => [c.authStatus]);
  const isOwner = authStatus === 'authenticated';

  const [tiles, setTiles] = useState<TileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [storyAt, setStoryAt] = useState<number | null>(null);

  // Auto-close login overlay once authenticated
  useEffect(() => {
    if (isOwner) setShowLogin(false);
  }, [isOwner]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await client.models.Memory.list();
    const sorted = [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const withUrls = await Promise.all(
      sorted.map(async (m) => {
        const u = await getUrl({ path: m.imageKey });
        return { ...m, url: u.url.toString() };
      })
    );
    setTiles(withUrls);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="topbar">
        {isOwner ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" onClick={() => setShowUpload(true)}>
              + Add moment
            </button>
            <button className="btn btn-ghost" onClick={signOut}>
              Sign out
            </button>
          </div>
        ) : (
          <button className="btn btn-ghost" onClick={() => setShowLogin(true)}>
            Login
          </button>
        )}
      </div>

      <header className="header">
        <h1>
          Kirpajeet <span className="accent">Singh Gill</span>
        </h1>
        <p>A gallery of moments — tap any photo to play the story.</p>
      </header>

      <main className="gallery">
        {loading && <div className="empty">Loading…</div>}
        {!loading && tiles.length === 0 && (
          <div className="empty">
            No moments yet. {isOwner ? 'Add your first one.' : ''}
          </div>
        )}
        {tiles.map((t, i) => (
          <div className="tile" key={t.id} onClick={() => setStoryAt(i)}>
            <img src={t.url} alt={t.caption ?? ''} />
            {(t.caption || t.musicKey) && (
              <div className="meta">
                {t.musicKey && <span className="note">♪</span>}
                <span>{t.caption}</span>
              </div>
            )}
          </div>
        ))}
      </main>

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={load} />
      )}

      {showLogin && !isOwner && (
        <div className="overlay" onClick={() => setShowLogin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <Authenticator />
          </div>
        </div>
      )}

      {storyAt !== null && tiles.length > 0 && (
        <StoryViewer
          memories={tiles}
          startIndex={storyAt}
          onClose={() => setStoryAt(null)}
        />
      )}
    </>
  );
}

export default function Page() {
  return (
    <Authenticator.Provider>
      <GalleryApp />
    </Authenticator.Provider>
  );
}
