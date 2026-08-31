import React, { useState, useEffect } from 'react';
import {
  Star,
  ThumbsUp,
  Flag,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Loader2,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { resolveImageUrl } from '../utils/imageUtils';
import ImageUploadCropperModal from './ImageUploadCropperModal';

export default function ProductReviewsSection({ productId, onRatingUpdated }) {
  const [reviewsData, setReviewsData] = useState({
    avgRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    ratingPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: []
  });
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('top');
  const [selectedStarFilter, setSelectedStarFilter] = useState(null);

  // Review Submission Modal State
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [cropperFile, setCropperFile] = useState(null);

  // Lightbox Modal State
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId, sortOption, selectedStarFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let url = `/reviews/product/${productId}?sort=${sortOption}`;
      if (selectedStarFilter) {
        url += `&star=${selectedStarFilter}`;
      }
      const res = await api.get(url);
      const data = res.data?.data || res.data || {};
      
      setReviewsData({
        avgRating: Number(data.avgRating || 0),
        totalReviews: Number(data.totalReviews || 0),
        ratingDistribution: data.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        ratingPercentages: data.ratingPercentages || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        reviews: Array.isArray(data.reviews) ? data.reviews : []
      });

      if (onRatingUpdated) {
        onRatingUpdated({
          rating: Number(data.avgRating || 0),
          reviewsCount: Number(data.totalReviews || 0)
        });
      }
    } catch (err) {
      console.error('[Fetch Reviews Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    setCropperFile(file);
    e.target.value = '';
  };

  const handleCropConfirm = (croppedBase64) => {
    setUploadedImages(prev => [...prev, croppedBase64]);
    setCropperFile(null);
    toast.success('Customer review photo added! 📸');
  };

  const handleRemovePhoto = (idx) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!userRating || userRating < 1 || userRating > 5) {
      toast.error('Please select a star rating between 1 and 5');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reviews', {
        productId,
        rating: userRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
        images: uploadedImages
      });

      toast.success('Your review has been published! 🎉');
      setWriteModalOpen(false);
      setReviewTitle('');
      setReviewComment('');
      setUploadedImages([]);
      setUserRating(5);

      await fetchReviews();
      window.dispatchEvent(new Event('karviyam_products_updated'));
    } catch (err) {
      console.error('[Submit Review Error]:', err);
      toast.error(err.response?.data?.message || 'Please log in to submit a review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteHelpful = async (reviewId) => {
    try {
      const res = await api.post(`/reviews/${reviewId}/helpful`);
      const isHelpful = res.data?.data?.helpful;

      setReviewsData(prev => ({
        ...prev,
        reviews: prev.reviews.map(r => {
          if (r.id === reviewId) {
            return {
              ...r,
              hasVoted: isHelpful,
              helpfulCount: isHelpful ? r.helpfulCount + 1 : Math.max(0, r.helpfulCount - 1)
            };
          }
          return r;
        })
      }));

      toast.success(isHelpful ? 'Marked review as helpful! 👍' : 'Vote removed');
    } catch (err) {
      toast.error('Please log in to vote on customer reviews');
    }
  };

  const handleReportReview = async (reviewId) => {
    try {
      await api.post(`/reviews/${reviewId}/report`);
      toast.success('Thank you. Review reported for admin inspection.');
    } catch (err) {
      toast.error('Failed to report review');
    }
  };

  const openLightbox = (imgs, index) => {
    setLightboxImages(imgs);
    setLightboxIndex(index);
  };

  return (
    <div id="reviews-section" className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-8 space-y-8 text-left font-sans">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="font-display font-black text-xl sm:text-2xl text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#B71C1C]" />
            <span>Customer Ratings & Reviews</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Genuine verified ratings & customer feedback for this product
          </p>
        </div>

        <button
          onClick={() => setWriteModalOpen(true)}
          className="bg-slate-900 hover:bg-[#B71C1C] text-white text-xs font-extrabold px-5 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>Write a Customer Review</span>
        </button>
      </div>

      {/* AMAZON-STYLE SUMMARY & STAR BREAKDOWN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-slate-50/70 rounded-2xl border border-slate-200/80 p-5 sm:p-6">
        
        {/* Left Column: Big Rating Display */}
        <div className="lg:col-span-4 space-y-3 text-center sm:text-left border-b lg:border-b-0 lg:border-r border-slate-200/80 pb-6 lg:pb-0 lg:pr-8">
          {reviewsData.totalReviews > 0 ? (
            <>
              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight">
                  {reviewsData.avgRating.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-slate-500">out of 5</span>
              </div>

              {/* Dynamic Stars */}
              <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(reviewsData.avgRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 fill-slate-100'
                    }`}
                  />
                ))}
              </div>

              <p className="text-xs text-slate-600 font-bold">
                {reviewsData.totalReviews} global ratings
              </p>
            </>
          ) : (
            <div className="space-y-2 py-4">
              <span className="text-lg font-black text-slate-800 block">No ratings yet</span>
              <p className="text-xs text-slate-500 font-medium">Be the first customer to rate and review this product!</p>
              <button
                onClick={() => setWriteModalOpen(true)}
                className="text-xs font-bold text-[#B71C1C] hover:underline"
              >
                + Submit first review
              </button>
            </div>
          )}
        </div>

        {/* Right Column: 5★ to 1★ Progress Bars */}
        <div className="lg:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const pct = reviewsData.ratingPercentages[star] || 0;
            const count = reviewsData.ratingDistribution[star] || 0;
            const isSelected = selectedStarFilter === star;

            return (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedStarFilter(isSelected ? null : star)}
                className={`w-full flex items-center gap-3 p-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer group ${
                  isSelected ? 'bg-amber-100/70 border border-amber-300' : 'hover:bg-slate-100/80'
                }`}
              >
                <span className="w-12 text-right shrink-0 text-slate-700 group-hover:text-[#B71C1C] flex items-center justify-end gap-1">
                  <span>{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                </span>

                {/* Progress Bar Container */}
                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <span className="w-12 text-right text-slate-500 shrink-0 font-mono text-[11px]">
                  {pct}%
                </span>
                <span className="w-12 text-right text-slate-400 shrink-0 text-[10px]">
                  ({count})
                </span>
              </button>
            );
          })}

          {selectedStarFilter && (
            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedStarFilter(null)}
                className="text-xs font-bold text-[#B71C1C] hover:underline flex items-center gap-1 ml-auto"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Star Filter ({selectedStarFilter}★)</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* FILTER & SORT ROW */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
        <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span>Customer Reviews ({reviewsData.reviews.length})</span>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Sort by:</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl outline-none focus:border-[#B71C1C] cursor-pointer"
          >
            <option value="top">Top Reviews</option>
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* REVIEWS LIST */}
      {loading ? (
        <div className="py-12 text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#B71C1C] mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading customer reviews...</p>
        </div>
      ) : reviewsData.reviews.length === 0 ? (
        <div className="py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2.5">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No customer reviews match criteria</p>
          <button
            onClick={() => setWriteModalOpen(true)}
            className="bg-[#B71C1C] text-white text-xs font-extrabold px-4 py-2 rounded-xl"
          >
            Write the First Review
          </button>
        </div>
      ) : (
        <div className="space-y-6 divide-y divide-slate-100">
          {reviewsData.reviews.map((r) => (
            <div key={r.id} className="pt-6 space-y-3">
              
              {/* Customer Avatar & Name Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center uppercase shadow-2xs">
                    {(r.userName || 'C')[0]}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{r.userName}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Reviewed on {new Date(r.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Verified Purchase Pill */}
                {r.verifiedPurchase && (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified Purchase</span>
                  </span>
                )}
              </div>

              {/* Star Rating & Headline */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-400 text-xs">
                    {[1, 2, 3, 4, 5].map((st) => (
                      <Star
                        key={st}
                        className={`w-3.5 h-3.5 ${st <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                  {r.title && (
                    <h4 className="font-extrabold text-xs text-slate-900">
                      {r.title}
                    </h4>
                  )}
                </div>

                {/* Review Text */}
                {r.comment && (
                  <p className="text-xs text-slate-700 leading-relaxed font-normal pt-1">
                    {r.comment}
                  </p>
                )}
              </div>

              {/* Customer Uploaded Photo Thumbnails */}
              {Array.isArray(r.images) && r.images.length > 0 && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {r.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => openLightbox(r.images, i)}
                      className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-1 hover:border-[#B71C1C] transition-all cursor-pointer shadow-2xs group"
                    >
                      <img
                        src={resolveImageUrl(img)}
                        alt="Customer Photo"
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Bottom Actions: Helpful & Report */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleVoteHelpful(r.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                      r.hasVoted
                        ? 'bg-rose-50 text-[#B71C1C] border-rose-200'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>Helpful {r.helpfulCount > 0 ? `(${r.helpfulCount})` : ''}</span>
                  </button>

                  <button
                    onClick={() => handleReportReview(r.id)}
                    className="text-slate-400 hover:text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Flag className="w-3 h-3" />
                    <span>Report</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* WRITE CUSTOMER REVIEW MODAL                                */}
      {/* ========================================================= */}
      {writeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-6">
            
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="font-display font-black text-base flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>Write a Customer Review</span>
                </h3>
                <p className="text-[10.5px] text-slate-400">Share your honest feedback & photos with other buyers</p>
              </div>
              <button
                onClick={() => setWriteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              
              {/* Star Rating Picker */}
              <div className="space-y-1.5 text-center bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">Overall Rating *</label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setUserRating(st)}
                      className="p-1 cursor-pointer transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-8 h-8 ${st <= userRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-black text-amber-600 block">
                  {userRating === 5 ? '★★★★★ (5/5 - Excellent)' :
                   userRating === 4 ? '★★★★☆ (4/5 - Good)' :
                   userRating === 3 ? '★★★☆☆ (3/5 - Average)' :
                   userRating === 2 ? '★★☆☆☆ (2/5 - Fair)' : '★☆☆☆☆ (1/5 - Poor)'}
                </span>
              </div>

              {/* Review Headline */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">Add a Headline / Title</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Very good quality and comfortable!"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#B71C1C] focus:bg-white"
                />
              </div>

              {/* Written Review */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">Written Review</label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="What did you like or dislike? How was the fit and quality?"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-medium outline-none focus:border-[#B71C1C] focus:bg-white"
                />
              </div>

              {/* Upload Customer Photos */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-800">Add Customer Photos (Optional)</label>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-1">
                      <img src={resolveImageUrl(img)} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-0.5 right-0.5 bg-slate-900 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#B71C1C] bg-slate-50 hover:bg-red-50/30 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-[#B71C1C]">
                    <Upload className="w-5 h-5" />
                    <span className="text-[9px] font-bold mt-0.5">+ Photo</span>
                    <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWriteModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CUSTOMER PHOTO LIGHTBOX MODAL                             */}
      {/* ========================================================= */}
      {lightboxImages.length > 0 && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <button
            onClick={() => setLightboxImages([])}
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full cursor-pointer z-10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-4xl max-h-[85vh] flex items-center justify-center">
            <img
              src={resolveImageUrl(lightboxImages[lightboxIndex])}
              alt="Customer Review Photo"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />

            {lightboxImages.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length)}
                  className="absolute left-2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={() => setLightboxIndex((prev) => (prev + 1) % lightboxImages.length)}
                  className="absolute right-2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Standard Image Cropper for Customer Review Photos */}
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
