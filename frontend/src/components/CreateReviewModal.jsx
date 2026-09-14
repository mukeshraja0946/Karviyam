import React, { useState, useEffect } from 'react';
import { X, Star, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import ImageUploadCropperModal from './ImageUploadCropperModal';

export default function CreateReviewModal({ isOpen, onClose, productId, product, order, onSuccess }) {
  const [overallRating, setOverallRating] = useState(5);
  const [featureRatings, setFeatureRatings] = useState({
    giftable: 0,
    durability: 0,
    valueForMoney: 0
  });
  const [headline, setHeadline] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [cropperFile, setCropperFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [productDetails, setProductDetails] = useState({
    name: product?.name || product?.productName || 'Product',
    image: product?.image || product?.imageUrl || product?.productImage || '',
    sku: product?.sku || '',
    variant: product?.selectedSize ? `Size: ${product.selectedSize}${product.selectedColor ? ` | Color: ${product.selectedColor}` : ''}` : ''
  });

  useEffect(() => {
    if (!isOpen) return;

    // Reset form states
    setOverallRating(5);
    setFeatureRatings({ giftable: 0, durability: 0, valueForMoney: 0 });
    setHeadline('');
    setReviewText('');
    setUploadedMedia([]);
    setCropperFile(null);

    // If product details provided via props
    if (product || order) {
      const itemImg = product?.image || product?.imageUrl || product?.productImage || '';
      const itemName = product?.name || product?.productName || 'Product';
      const itemSku = product?.sku || '';
      const itemVariant = product?.selectedSize ? `Size: ${product.selectedSize}${product.selectedColor ? ` | Color: ${product.selectedColor}` : ''}` : '';
      setProductDetails({ name: itemName, image: itemImg, sku: itemSku, variant: itemVariant });
    }

    // Fetch product details if productId is available and product name is missing
    if (productId && (!product?.name && !product?.productName)) {
      api.get(`/products/${productId}`)
        .then(res => {
          const data = res.data?.data || res.data;
          if (data) {
            setProductDetails(prev => ({
              ...prev,
              name: data.name || prev.name,
              image: data.imageUrl || data.image || prev.image,
              sku: data.sku || prev.sku
            }));
          }
        })
        .catch(err => {
          console.error('Error fetching product for review:', err);
        });
    }
  }, [isOpen, productId, product, order]);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    setCropperFile(file);
    e.target.value = '';
  };

  const handleCropConfirm = (croppedBase64) => {
    if (uploadedMedia.length >= 5) {
      toast.error('Maximum 5 media items allowed');
      return;
    }
    setUploadedMedia(prev => [...prev, croppedBase64]);
    setCropperFile(null);
    toast.success('Photo added!');
  };

  const handleRemoveMedia = (idx) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!overallRating || overallRating < 1 || overallRating > 5) {
      toast.error('Please select an overall rating (1 to 5 stars)');
      return;
    }

    if (!headline.trim() && !reviewText.trim()) {
      toast.error('Please enter a headline or review text');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        productId: productId || product?.id || product?.productId,
        rating: overallRating,
        title: headline.trim(),
        comment: reviewText.trim(),
        images: uploadedMedia,
        featureRatings
      };

      const res = await api.post('/reviews', payload);
      const msg = res.data?.message || 'Review submitted successfully!';

      toast.success(msg);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting review:', err);
      const errMsg = err.response?.data?.message || 'Failed to submit review. Please try again.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-20 sm:pb-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden border border-slate-200 font-sans text-left max-h-[82vh] sm:max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150 my-auto">
        
        {/* Header (Sticky Top) */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <h2 className="font-extrabold text-base sm:text-lg text-slate-900 leading-none">Create Review</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Element wrapping scrollable content & footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 text-slate-900">
          
          {/* Scrollable Form Body */}
          <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
            
            {/* Product Information Row */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <div className="w-12 h-12 rounded border border-slate-200 overflow-hidden shrink-0 bg-white p-0.5 flex items-center justify-center">
                <img
                  src={resolveImageUrl(productDetails.image, productId)}
                  alt={productDetails.name}
                  onError={(e) => handleImageError(e, productId)}
                  className="max-w-full max-h-full object-contain rounded"
                />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                  {productDetails.name}
                </h3>
                {(productDetails.variant || productDetails.sku) && (
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    {productDetails.variant || `SKU: ${productDetails.sku}`}
                  </p>
                )}
              </div>
            </div>

            {/* Overall Rating Section */}
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Overall rating</h4>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    className="p-0.5 cursor-pointer transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                    title={`${star} out of 5 stars`}
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= overallRating
                          ? 'text-[#FFA41C] fill-[#FFA41C]'
                          : 'text-slate-300 stroke-[1.5]'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Rate Features Section */}
            <div className="space-y-1.5 pt-2.5 border-t border-slate-200">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Rate features</h4>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-0.5">
                {[
                  { key: 'giftable', label: 'Giftable' },
                  { key: 'durability', label: 'Durability' },
                  { key: 'valueForMoney', label: 'Value for money' }
                ].map((feat) => (
                  <div key={feat.key} className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-800 truncate">{feat.label}</span>
                      {featureRatings[feat.key] > 0 && (
                        <button
                          type="button"
                          onClick={() => setFeatureRatings(prev => ({ ...prev, [feat.key]: 0 }))}
                          className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer px-1"
                          title="Clear feature rating"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setFeatureRatings(prev => ({ ...prev, [feat.key]: st }))}
                          className="p-0.5 cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                              st <= (featureRatings[feat.key] || 0)
                                ? 'text-[#FFA41C] fill-[#FFA41C]'
                                : 'text-slate-300 stroke-[1.5]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Photo or Video Section */}
            <div className="space-y-1.5 pt-2.5 border-t border-slate-200">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Add a photo or video</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-normal">
                Shoppers find images and videos more helpful than text alone.
              </p>

              <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                {uploadedMedia.map((media, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded border border-slate-200 overflow-hidden bg-slate-50 p-0.5 shadow-2xs group">
                    <img src={resolveImageUrl(media)} alt="Media Preview" className="w-full h-full object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(idx)}
                      className="absolute top-0.5 right-0.5 bg-slate-900/80 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 cursor-pointer transition-colors"
                      title="Remove photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Dotted Upload Box */}
                <label className="w-16 h-16 rounded border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/80 hover:bg-amber-50/30 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-amber-600">
                  <Plus className="w-5 h-5 stroke-[2.2]" />
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </label>
              </div>
            </div>

            {/* Add a Headline Section */}
            <div className="space-y-1 pt-2.5 border-t border-slate-200">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Add a headline</h4>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="What's most important to know?"
                className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded px-3 py-1.5 text-xs font-semibold outline-none transition-colors shadow-2xs"
                maxLength={150}
              />
            </div>

            {/* Write your review Section */}
            <div className="space-y-1 pt-2.5 border-t border-slate-200">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Write your review</h4>
              <textarea
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you like or dislike? What did you use this product for?"
                className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded p-2.5 text-xs font-medium outline-none transition-colors shadow-2xs resize-y"
              />
            </div>

          </div>

          {/* Sticky Submit Footer Bar (Always Visible at Bottom Right) */}
          <div className="px-4 sm:px-5 py-2.5 bg-[#F8F9FA] border-t border-slate-200 flex items-center justify-end shrink-0">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#FFD814] hover:bg-[#F7CA00] text-slate-900 border border-[#FCD200] font-bold text-xs px-6 py-1.5 rounded shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-800" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit</span>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* Image Cropper Modal */}
      {cropperFile && (
        <ImageUploadCropperModal
          isOpen={!!cropperFile}
          onClose={() => setCropperFile(null)}
          imageFile={cropperFile}
          configType="category"
          onConfirmCrop={handleCropConfirm}
        />
      )}
    </div>
  );
}
