import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, RefreshCw, Check, AlertTriangle, Image as ImageIcon, UploadCloud, Loader2 } from 'lucide-react';
import { IMAGE_CONFIG } from '../utils/imageConfig';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ImageUploadCropperModal({
  isOpen,
  onClose,
  imageFile,
  configType = 'productGallery',
  onConfirmCrop
}) {
  const config = IMAGE_CONFIG[configType] || IMAGE_CONFIG.productGallery;
  
  const [imageObj, setImageObj] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    if (!imageFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImageObj(img);
        setOriginalDimensions({ width: img.width, height: img.height });
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  if (!isOpen || !imageFile) return null;

  const isLowResolution = originalDimensions.width > 0 &&
    (originalDimensions.width < config.width * 0.7 || originalDimensions.height < config.height * 0.7);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleConfirmCrop = async () => {
    if (!imageObj) return;
    setUploading(true);
    toast.loading('Processing & cropping image...', { id: 'cropper-toast' });

    try {
      // 1. Create high-resolution Canvas with exact target dimensions
      const canvas = document.createElement('canvas');
      canvas.width = config.width;
      canvas.height = config.height;
      const ctx = canvas.getContext('2d');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 2. Clear canvas
      ctx.clearRect(0, 0, config.width, config.height);

      // 3. Draw cropped image with zoom, rotation and offset
      ctx.save();
      ctx.translate(config.width / 2, config.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // Scale calculations
      const scaleX = config.width / originalDimensions.width;
      const scaleY = config.height / originalDimensions.height;
      const baseScale = Math.max(scaleX, scaleY);
      const totalScale = baseScale * zoom;

      const drawWidth = originalDimensions.width * totalScale;
      const drawHeight = originalDimensions.height * totalScale;

      const drawX = position.x * (config.width / 320) - drawWidth / 2;
      const drawY = position.y * (config.height / 320) - drawHeight / 2;

      ctx.drawImage(imageObj, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      // 4. Export canvas to Blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
      });

      if (blob) {
        // 5. Upload cropped blob to server API endpoint
        const formData = new FormData();
        const fileName = `cropped-${configType}-${Date.now()}.jpg`;
        formData.append('file', blob, fileName);

        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).catch(() => null);

        const apiData = uploadRes?.data ? uploadRes.data : uploadRes;
        const uploadedUrl = apiData?.data?.url || apiData?.url;

        if (uploadedUrl) {
          toast.success(`Cropped to ${config.width} × ${config.height} px!`, { id: 'cropper-toast' });
          onConfirmCrop(uploadedUrl);
          onClose();
          return;
        }
      }

      // Base64 Fallback if API upload fails
      const base64Data = canvas.toDataURL('image/jpeg', 0.90);
      toast.success(`Cropped to ${config.width} × ${config.height} px!`, { id: 'cropper-toast' });
      onConfirmCrop(base64Data);
      onClose();

    } catch (err) {
      console.error('[Cropper Error]:', err);
      toast.error('Failed to crop image. Please try again.', { id: 'cropper-toast' });
    } finally {
      setUploading(false);
    }
  };

  // Preview Box dimensions (responsive container with exact aspect ratio)
  const previewBoxWidth = 340;
  const previewBoxHeight = Math.round(340 / config.aspectRatio);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[10px] font-black uppercase text-[#B71C1C] tracking-widest block mb-0.5">
              STANDARDIZED IMAGE CROPPER
            </span>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Crop & Adjust {config.label}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resolution Info Bar */}
        <div className="bg-slate-900 text-white p-3 px-5 text-xs flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Original:</span>
            <span className="font-mono font-bold text-amber-400">
              {originalDimensions.width} × {originalDimensions.height} px
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Required Size:</span>
            <span className="font-mono font-bold text-emerald-400">
              {config.width} × {config.height} px
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Aspect Ratio:</span>
            <span className="font-mono font-bold text-sky-400 bg-slate-800 px-2 py-0.5 rounded">
              {config.aspectRatioLabel}
            </span>
          </div>
        </div>

        {/* Low Resolution Warning */}
        {isLowResolution && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 px-5 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Image Resolution Warning</p>
              <p className="text-[11px] text-amber-700">
                Image is {originalDimensions.width}×{originalDimensions.height} px. Required is {config.width}×{config.height} px. Upscaling low-res images may reduce sharpness.
              </p>
            </div>
          </div>
        )}

        {/* Interactive Crop Preview Area */}
        <div className="p-6 bg-slate-100 flex flex-col items-center justify-center overflow-auto flex-1 min-h-[300px]">
          
          <p className="text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <span>Drag image to position inside crop box</span>
          </p>

          <div
            ref={containerRef}
            style={{ width: previewBoxWidth, height: Math.min(previewBoxHeight, 360) }}
            className="relative border-4 border-[#B71C1C] rounded-2xl shadow-xl overflow-hidden bg-slate-900 cursor-move select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Background Croppable Image */}
            {imageObj && (
              <img
                src={imageObj.src}
                alt="Crop preview"
                draggable={false}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
                className="w-full h-full pointer-events-none transition-transform duration-75"
              />
            )}

            {/* Grid Overlay Lines */}
            <div className="absolute inset-0 border border-white/30 pointer-events-none grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-b border-white/20"></div>
              <div className="border-r border-white/20"></div>
              <div className="border-r border-white/20"></div>
              <div></div>
            </div>

            {/* Crop Ratio Badge */}
            <span className="absolute top-2 left-2 bg-[#B71C1C] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs pointer-events-none">
              FIXED {config.aspectRatioLabel}
            </span>
          </div>

          {/* Controls Bar (Zoom & Rotate) */}
          <div className="mt-5 w-full max-w-md bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* Zoom Slider */}
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[#B71C1C] cursor-pointer"
              />

              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <span className="font-mono font-bold text-slate-700 text-[11px] min-w-[40px] text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Rotate & Reset */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] cursor-pointer"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] cursor-pointer"
                title="Reset Crop"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium">
            Final Output: <strong className="text-slate-900">{config.width} × {config.height} px ({config.aspectRatioLabel})</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmCrop}
              disabled={uploading}
              className="flex items-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white px-5 py-2 rounded-xl font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm & Save Crop</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
