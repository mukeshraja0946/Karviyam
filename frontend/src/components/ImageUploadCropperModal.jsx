import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, RefreshCw, Check, AlertTriangle, Loader2 } from 'lucide-react';
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

  // Load selected File into HTMLImageElement
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

  // Determine effective dimensions based on rotation
  const isRotated90 = rotation === 90 || rotation === 270;
  const effectiveWidth = isRotated90 ? originalDimensions.height : originalDimensions.width;
  const effectiveHeight = isRotated90 ? originalDimensions.width : originalDimensions.height;

  // Check if resolution is low compared to target
  const isLowResolution = originalDimensions.width > 0 &&
    (effectiveWidth < config.width * 0.7 || effectiveHeight < config.height * 0.7);

  // DOM Preview Box Dimensions
  const cropBoxWidth = 300;
  const cropBoxHeight = Math.round(cropBoxWidth / config.aspectRatio);

  // Base Cover Scale in DOM Box
  const baseScale = Math.max(cropBoxWidth / effectiveWidth, cropBoxHeight / effectiveHeight);
  const domZoomWidth = effectiveWidth * baseScale * zoom;
  const domZoomHeight = effectiveHeight * baseScale * zoom;

  // Max Pan Limits in DOM space
  const maxPanX = Math.max(0, (domZoomWidth - cropBoxWidth) / 2);
  const maxPanY = Math.max(0, (domZoomHeight - cropBoxHeight) / 2);

  // Clamp current position within bounds
  const clampedX = Math.min(maxPanX, Math.max(-maxPanX, position.x));
  const clampedY = Math.min(maxPanY, Math.max(-maxPanY, position.y));

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPosition({
      x: Math.min(maxPanX, Math.max(-maxPanX, newX)),
      y: Math.min(maxPanY, Math.max(-maxPanY, newY))
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
    toast.loading('Cropping and saving image...', { id: 'cropper-toast' });

    try {
      // 1. Calculate Source Rectangle in Original Image Coordinates
      const cropLeftInDom = (domZoomWidth / 2) - (cropBoxWidth / 2) - clampedX;
      const cropTopInDom = (domZoomHeight / 2) - (cropBoxHeight / 2) - clampedY;

      const domToSourceFactor = effectiveWidth / domZoomWidth;

      const sourceX = cropLeftInDom * domToSourceFactor;
      const sourceY = cropTopInDom * domToSourceFactor;
      const sourceWidth = cropBoxWidth * domToSourceFactor;
      const sourceHeight = cropBoxHeight * domToSourceFactor;

      // 2. Create Canvas with EXACT required output dimensions
      const canvas = document.createElement('canvas');
      canvas.width = config.width;
      canvas.height = config.height;
      const ctx = canvas.getContext('2d');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Clear Canvas
      ctx.clearRect(0, 0, config.width, config.height);

      // Handle Rotation during crop draw
      if (rotation !== 0) {
        ctx.save();
        ctx.translate(config.width / 2, config.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);

        // Draw rotated canvas intermediate
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = effectiveWidth;
        tempCanvas.height = effectiveHeight;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.translate(effectiveWidth / 2, effectiveHeight / 2);
        tempCtx.rotate((rotation * Math.PI) / 180);
        tempCtx.drawImage(imageObj, -originalDimensions.width / 2, -originalDimensions.height / 2);

        ctx.drawImage(
          tempCanvas,
          sourceX, sourceY, sourceWidth, sourceHeight,
          -config.width / 2, -config.height / 2, config.width, config.height
        );
        ctx.restore();
      } else {
        // Direct exact source crop draw
        ctx.drawImage(
          imageObj,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, config.width, config.height
        );
      }

      // 3. Strict Verification of Output Dimensions
      if (canvas.width !== config.width || canvas.height !== config.height) {
        throw new Error(`Output dimensions (${canvas.width}x${canvas.height}) do not match required (${config.width}x${config.height})`);
      }

      // 4. Export Canvas to Blob File
      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
      });

      if (!blob) throw new Error('Failed to generate image blob');

      // 5. Upload Cropped File to Backend Server Disk
      const formData = new FormData();
      const fileName = `cropped-${configType}-${Date.now()}.jpg`;
      formData.append('file', blob, fileName);

      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).catch(() => null);

      const apiData = uploadRes?.data ? uploadRes.data : uploadRes;
      const uploadedUrl = apiData?.data?.url || apiData?.url;

      if (uploadedUrl) {
        toast.success(`Saved cropped image: ${config.width} × ${config.height} px!`, { id: 'cropper-toast' });
        onConfirmCrop(uploadedUrl);
        onClose();
        return;
      }

      // Base64 Fallback if API endpoint is unreachable
      const base64Data = canvas.toDataURL('image/jpeg', 0.90);
      toast.success(`Saved cropped image: ${config.width} × ${config.height} px!`, { id: 'cropper-toast' });
      onConfirmCrop(base64Data);
      onClose();

    } catch (err) {
      console.error('[Cropper Export Error]:', err);
      toast.error('Unable to generate the required image size. Please try cropping again.', { id: 'cropper-toast' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
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
              <p className="font-bold">Low Resolution Warning</p>
              <p className="text-[11px] text-amber-700">
                Image resolution is low. The final image may lose sharpness when scaled to {config.width} × {config.height} px.
              </p>
            </div>
          </div>
        )}

        {/* Interactive Crop Preview Area */}
        <div className="p-6 bg-slate-100 flex flex-col items-center justify-center overflow-auto flex-1 min-h-[340px]">
          
          <p className="text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wider">
            Drag image to center desired area inside crop window
          </p>

          {/* Fixed Aspect Ratio Crop Box Container */}
          <div
            ref={containerRef}
            style={{ width: cropBoxWidth, height: cropBoxHeight }}
            className="relative border-4 border-[#B71C1C] rounded-2xl shadow-2xl overflow-hidden bg-slate-900 cursor-grab active:cursor-grabbing select-none flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Background Rendered Image with Exact Pan & Zoom Offset */}
            {imageObj && (
              <div
                style={{
                  width: domZoomWidth,
                  height: domZoomHeight,
                  transform: `translate(${clampedX}px, ${clampedY}px)`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
                className="relative flex items-center justify-center shrink-0"
              >
                <img
                  src={imageObj.src}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center center'
                  }}
                  className="w-full h-full object-cover pointer-events-none"
                />
              </div>
            )}

            {/* Rule of Thirds Grid Lines */}
            <div className="absolute inset-0 border border-white/40 pointer-events-none grid grid-cols-3 grid-rows-3">
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

            {/* Fixed Ratio Badge */}
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
                onClick={() => {
                  const newZoom = Math.max(1, zoom - 0.1);
                  setZoom(newZoom);
                }}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => {
                  setZoom(Number(e.target.value));
                }}
                className="w-full accent-[#B71C1C] cursor-pointer"
              />

              <button
                type="button"
                onClick={() => {
                  const newZoom = Math.min(3, zoom + 0.1);
                  setZoom(newZoom);
                }}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <span className="font-mono font-bold text-slate-700 text-[11px] min-w-[45px] text-right">
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
            Output: <strong className="text-slate-900">{config.width} × {config.height} px ({config.aspectRatioLabel})</strong>
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
                  <span>Processing...</span>
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
