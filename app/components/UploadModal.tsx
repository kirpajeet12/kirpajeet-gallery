'use client';

import { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { client } from '@/lib/client';

export default function UploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [music, setMusic] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (!photo) {
      setStatus('Pick a photo first.');
      return;
    }
    setBusy(true);
    try {
      const stamp = Date.now();
      const photoKey = `photos/${stamp}-${photo.name}`;
      setStatus('Uploading photo…');
      await uploadData({ path: photoKey, data: photo }).result;

      let musicKey: string | undefined;
      if (music) {
        musicKey = `music/${stamp}-${music.name}`;
        setStatus('Uploading music…');
        await uploadData({ path: musicKey, data: music }).result;
      }

      setStatus('Saving…');
      await client.models.Memory.create({
        imageKey: photoKey,
        musicKey,
        caption: caption || undefined,
        order: stamp,
      });

      setStatus('Done ✓');
      onUploaded();
      onClose();
    } catch (e: any) {
      setStatus('Error: ' + (e?.message ?? 'upload failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add a moment</h2>

        <div className="field">
          <label>Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="field">
          <label>Music (optional)</label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setMusic(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="field">
          <label>Caption (optional)</label>
          <input
            type="text"
            value={caption}
            placeholder="A line about this moment…"
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        <div className="status">{status}</div>

        <div className="row">
          <button className="btn" onClick={handleSave} disabled={busy}>
            {busy ? 'Working…' : 'Save'}
          </button>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
