import React from 'react';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WishlistPage() {
  const { wishlist } = useWishlist();
  const navigate = useNavigate();

  if (wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Heart className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <h2 className="font-display font-black text-xl sm:text-2xl mb-2">Your Wishlist is Empty</h2>
        <p className="text-xs text-slate-500 mb-6">Save your favorite items here to shop them later.</p>
        <button
          onClick={() => navigate('/shop')}
          className="bg-karviyam-primary text-white font-extrabold text-xs uppercase tracking-wider px-8 py-3 rounded-full shadow-lg"
        >
          Discover Catalog →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-8 py-6 sm:py-12">
      <h1 className="font-display font-black text-xl sm:text-3xl text-slate-900 mb-4 sm:mb-8 px-1 sm:px-0">
        My Saved Wishlist ({wishlist.length})
      </h1>
      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-6">
        {wishlist.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
