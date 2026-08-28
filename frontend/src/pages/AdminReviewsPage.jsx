import React, { useEffect, useState } from 'react';
import { Star, CheckCircle, XCircle, MessageSquare, ThumbsUp, ThumbsDown, Filter, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ClearAllModal from '../components/ClearAllModal';
import BulkActionBar from '../components/BulkActionBar';

const INITIAL_MOCK_REVIEWS = [
  {
    id: 1,
    userName: 'Ravi Kumar',
    productId: 101,
    productName: 'Karviyam Cyberpunk Tee',
    rating: 5,
    comment: 'The fabric quality and oversized fit are unmatched! Express delivery was super fast within 2 days.',
    status: 'Approved',
    createdAt: '2026-08-05T14:20:00'
  },
  {
    id: 2,
    userName: 'Priya Sharma',
    productId: 102,
    productName: 'Royal Emerald Silver Pendant',
    rating: 5,
    comment: 'Royal Emerald Silver Pendant looks stunning in real life. Genuine 925 sterling silver finish with hallmark certificate.',
    status: 'Pending',
    createdAt: '2026-08-04T18:45:00'
  },
  {
    id: 3,
    userName: 'Amit Singh',
    productId: 103,
    productName: 'Apex Stealth Sneakers',
    rating: 4,
    comment: 'Sneakers are extremely lightweight and comfortable for daily streetwear. Great cushioning!',
    status: 'Approved',
    createdAt: '2026-08-03T11:15:00'
  },
  {
    id: 4,
    userName: 'Neha Patel',
    productId: 104,
    productName: 'Urban Linen Casual Shirt',
    rating: 5,
    comment: 'Urban Linen Casual Shirt fabric is super breathable and premium. Highly recommended!',
    status: 'Pending',
    createdAt: '2026-08-02T09:30:00'
  },
  {
    id: 5,
    userName: 'Vikram Joshi',
    productId: 105,
    productName: 'Vintage Anime Graphic Hoodie',
    rating: 2,
    comment: 'Sizing was slightly larger than expected. Submitted a size exchange request.',
    status: 'Rejected',
    createdAt: '2026-08-01T16:00:00'
  }
];

const STATUS_TABS = [
  { id: 'ALL', label: 'All Reviews' },
  { id: 'Pending', label: 'Pending Moderation' },
  { id: 'Approved', label: 'Approved' },
  { id: 'Rejected', label: 'Rejected' },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('karviyam_admin_reviews');
      return saved ? JSON.parse(saved) : INITIAL_MOCK_REVIEWS;
    } catch (e) {
      return INITIAL_MOCK_REVIEWS;
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews/admin');
      const apiData = res.data?.data || res.data;
      if (Array.isArray(apiData)) {
        setReviews(apiData);
        try { localStorage.setItem('karviyam_admin_reviews', JSON.stringify(apiData)); } catch (e) {}
      } else {
        loadStoredOrMock();
      }
    } catch (err) {
      console.error('[Admin Reviews Fetch Error]:', err);
      loadStoredOrMock();
    } finally {
      setLoading(false);
    }
  };

  const loadStoredOrMock = () => {
    const saved = localStorage.getItem('karviyam_admin_reviews');
    if (saved) {
      try {
        setReviews(JSON.parse(saved));
      } catch (e) {
        setReviews([]);
      }
    } else {
      setReviews([]);
    }
  };

  const handleModerate = async (id, newStatus) => {
    try {
      await api.put(`/reviews/admin/${id}/status`, { status: newStatus });
      toast.success(`Review #${id} set to ${newStatus}!`);

      setReviews((prev) => {
        const updated = prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r));
        try { localStorage.setItem('karviyam_admin_reviews', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      window.dispatchEvent(new Event('karviyam_products_updated'));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update review status');
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'ALL') return true;
    return (r.status || 'Pending').toLowerCase() === activeTab.toLowerCase();
  });

  const getBadgeCount = (tabId) => {
    if (tabId === 'ALL') return reviews.length;
    return reviews.filter((r) => (r.status || 'Pending').toLowerCase() === tabId.toLowerCase()).length;
  };

  const [selectedIds, setSelectedIds] = useState([]);
  const [isAllDatasetSelected, setIsAllDatasetSelected] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [clearAllLoading, setClearAllLoading] = useState(false);

  const toggleSelectRow = (id) => {
    setIsAllDatasetSelected(false);
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPage = (currentFiltered) => {
    if (selectedIds.length === currentFiltered.length && currentFiltered.length > 0) {
      setSelectedIds([]);
      setIsAllDatasetSelected(false);
    } else {
      setSelectedIds(currentFiltered.map(r => r.id));
      setIsAllDatasetSelected(false);
    }
  };

  const selectFullDataset = () => {
    setSelectedIds(reviews.map(r => r.id));
    setIsAllDatasetSelected(true);
    toast.success(`Selected all ${reviews.length} reviews in dataset!`);
  };

  const handleDeleteSelectedReviews = async () => {
    if (selectedIds.length === 0) return;
    setBatchDeleting(true);
    const count = selectedIds.length;
    toast.loading(`Deleting ${count} selected reviews...`, { id: 'rev-batch-toast' });
    try {
      if (isAllDatasetSelected || selectedIds.length >= reviews.length) {
        let res = await api.delete('/admin/reviews/all').catch(() => null);
        if (!res) await api.post('/admin/reviews/delete-all').catch(() => null);
      } else {
        for (const id of selectedIds) {
          await api.delete(`/admin/reviews/${id}`).catch(() => null);
        }
      }

      setReviews(prev => prev.filter(r => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      setIsAllDatasetSelected(false);
      try { localStorage.setItem('karviyam_admin_reviews', JSON.stringify(reviews.filter(r => !selectedIds.includes(r.id)))); } catch (e) {}
      toast.success(`Successfully deleted ${count} selected product reviews.`, { id: 'rev-batch-toast' });
      await fetchReviews();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete selected reviews', { id: 'rev-batch-toast' });
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleConfirmClearAllReviews = async () => {
    setClearAllLoading(true);
    toast.loading('Purging all customer reviews...', { id: 'rev-toast' });
    try {
      let res = await api.delete('/admin/reviews/all').catch(() => null);
      if (!res) res = await api.post('/admin/reviews/delete-all').catch(() => null);

      const count = reviews.length;
      setReviews([]);
      setSelectedIds([]);
      setIsAllDatasetSelected(false);
      try { localStorage.removeItem('karviyam_admin_reviews'); } catch (e) {}
      toast.success(`Successfully deleted ${count} product reviews.`, { id: 'rev-toast' });
      setClearAllModalOpen(false);
      await fetchReviews();
    } catch (e) {
      toast.error('Clear All failed. No records were deleted.', { id: 'rev-toast' });
    } finally {
      setClearAllLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-[#B71C1C]" />
            <span>Product Review Moderation</span>
          </h1>
          <p className="text-xs text-slate-500">Approve, reject, and moderate customer product ratings & feedback</p>
        </div>

        <button
          onClick={() => setClearAllModalOpen(true)}
          className="flex items-center gap-2 bg-rose-700 hover:bg-rose-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
        >
          <XCircle className="w-4 h-4 text-white" />
          <span>Clear All Data</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = getBadgeCount(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#B71C1C] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Reviews List */}
      {selectedIds.length > 0 && selectedIds.length === filteredReviews.length && reviews.length > filteredReviews.length && !isAllDatasetSelected && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
          <span>All {filteredReviews.length} reviews on this page are selected.</span>
          <button
            type="button"
            onClick={selectFullDataset}
            className="text-rose-700 hover:text-rose-900 font-extrabold underline cursor-pointer"
          >
            Select all {reviews.length} reviews in dataset
          </button>
        </div>
      )}

      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
        <label className="flex items-center gap-2 font-bold text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={filteredReviews.length > 0 && selectedIds.length === filteredReviews.length}
            onChange={() => toggleSelectAllPage(filteredReviews)}
            className="w-4 h-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500 cursor-pointer"
          />
          <span>Select All Listed Reviews ({filteredReviews.length})</span>
        </label>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl text-center text-xs text-slate-500 font-medium border border-slate-200">
          Loading customer reviews...
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center text-xs text-slate-500 font-medium border border-slate-200">
              No product reviews found under <span className="font-bold text-slate-800">{activeTab}</span>.
            </div>
          ) : (
            filteredReviews.map((rev) => {
              const statusDisplay = rev.status || 'Pending';
              const isApproved = statusDisplay.toLowerCase() === 'approved';
              const isRejected = statusDisplay.toLowerCase() === 'rejected';

              return (
                <div
                  key={rev.id}
                  className={`bg-white p-5 rounded-2xl border ${selectedIds.includes(rev.id) ? 'border-rose-300 ring-2 ring-rose-200 bg-rose-50/20' : 'border-slate-200'} shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-300`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(rev.id)}
                      onChange={() => toggleSelectRow(rev.id)}
                      className="w-4 h-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500 cursor-pointer mt-1 shrink-0"
                    />
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold text-slate-900 text-sm">{rev.userName || 'Customer'}</span>
                      
                      {/* Star Rating */}
                      <div className="flex text-amber-400 items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : isRejected
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {statusDisplay}
                      </span>
                    </div>

                    <p className="text-slate-700 text-xs font-medium italic">"{rev.comment}"</p>
                    
                    <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-2">
                      <span className="text-[#B71C1C]">Product: {rev.productName || `#${rev.productId}`}</span>
                      {rev.createdAt && (
                        <span className="text-slate-400">• {new Date(rev.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleModerate(rev.id, 'Approved')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isApproved
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{isApproved ? 'Approved' : 'Approve'}</span>
                    </button>

                    <button
                      onClick={() => handleModerate(rev.id, 'Rejected')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isRejected
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isRejected ? 'Rejected' : 'Reject'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <ClearAllModal
        isOpen={clearAllModalOpen}
        onClose={() => setClearAllModalOpen(false)}
        moduleName="Product Reviews"
        itemCount={reviews.length}
        onConfirm={handleConfirmClearAllReviews}
        loading={clearAllLoading}
      />
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={reviews.length}
        isAllDatasetSelected={isAllDatasetSelected}
        onSelectAllDataset={selectFullDataset}
        onDeleteSelected={handleDeleteSelectedReviews}
        onClearSelection={() => {
          setSelectedIds([]);
          setIsAllDatasetSelected(false);
        }}
        moduleName="Product Reviews"
        loading={batchDeleting}
      />
    </div>
  );
}
