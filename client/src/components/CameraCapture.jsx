import { useState, useRef } from 'react';
import { Camera, Image, X, RotateCcw } from 'lucide-react';

export default function CameraCapture({ onCapture, onSkip }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview({ url: reader.result, file });
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', preview.file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      onCapture(data.path);
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold mb-1">Receipt Photo</h2>
        <p className="text-slate-400 text-sm">Take a photo or select from gallery</p>
      </div>

      {preview ? (
        <div className="w-full space-y-4">
          <div className="relative">
            <img src={preview.url} alt="Receipt" className="w-full max-h-80 object-contain rounded-2xl border border-slate-700" />
            <button onClick={reset} className="absolute top-2 right-2 bg-slate-900/80 rounded-full p-2">
              <RotateCcw size={18} />
            </button>
          </div>
          <button
            onClick={handleConfirm}
            disabled={uploading}
            className="btn-primary w-full"
          >
            {uploading ? 'Uploading...' : 'Use This Photo'}
          </button>
        </div>
      ) : (
        <div className="w-full space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            id="camera-input"
          />
          <label
            htmlFor="camera-input"
            className="btn-primary w-full cursor-pointer flex items-center justify-center gap-2"
          >
            <Camera size={22} />
            Take Photo
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            id="gallery-input"
          />
          <label
            htmlFor="gallery-input"
            className="btn-secondary w-full cursor-pointer flex items-center justify-center gap-2"
          >
            <Image size={22} />
            Choose from Gallery
          </label>
        </div>
      )}

      <button onClick={onSkip} className="btn-ghost w-full text-slate-400">
        Skip — No Receipt
      </button>
    </div>
  );
}
