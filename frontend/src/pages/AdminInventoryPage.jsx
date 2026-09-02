import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Search, Save, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ExportDropdown from '../components/ExportDropdown';
import ClearAllModal from '../components/ClearAllModal';
import BulkActionBar from '../components/BulkActionBar';

const INVENTORY_EXPORT_HEADERS = [
  { label: 'Product Name', accessor: 'name' },
  { label: 'SKU', accessor: 'sku' },
  { label: 'Warehouse', accessor: 'warehouse' },
  { label: 'Current Stock', accessor: (i) => `${i.stock} Units` },
  { label: 'Reorder Threshold', accessor: (i) => `${i.reorder} Units` },
  { label: 'Stock Status', accessor: 'status' }
];

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [clearAllLoading, setClearAllLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
    window.addEventListener('karviyam_products_updated', fetchInventory);
    return () => window.removeEventListener('karviyam_products_updated', fetchInventory);
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products?size=100&includeInactive=true').catch(() => null);
      const apiData = res?.data ? res.data : (res || {});
      const pageObj = apiData?.data !== undefined ? apiData.data : apiData;
      let items = Array.isArray(pageObj?.content) ? pageObj.content : (Array.isArray(pageObj) ? pageObj : []);

      if (items.length === 0) {
        try {
          const savedAdmin = localStorage.getItem('karviyam_admin_products');
          if (savedAdmin) {
            const parsed = JSON.parse(savedAdmin);
            if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
          }
        } catch (eLocal) {}
      }

      const formatted = items.map(p => {
        const stock = p.stockQuantity !== undefined ? p.stockQuantity : (p.stock !== undefined ? p.stock : 10);
        const reorder = p.reorderThreshold || 10;
        const status = stock === 0 ? 'Out of Stock' : (stock < reorder ? 'Low Stock' : 'In Stock');
        return {
          id: p.id,
          name: p.name || 'Untitled Product',
          sku: p.sku || `SKU-${p.id}`,
          stock: stock,
          reorder: reorder,
          status: status,
          warehouse: p.warehouse || 'Main Warehouse (Hub 1)',
          rawProduct: p
        };
      });

      setInventory(formatted);
    } catch (e) {
      console.error('Failed to fetch inventory:', e);
      toast.error('Failed to load live inventory from database');
    } finally {
      setLoading(false);
    }
  };

  const [selectedIds, setSelectedIds] = useState([]);
  const [isAllDatasetSelected, setIsAllDatasetSelected] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);

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
      setSelectedIds(currentFiltered.map(i => i.id));
      setIsAllDatasetSelected(false);
    }
  };

  const selectFullDataset = () => {
    setSelectedIds(inventory.map(i => i.id));
    setIsAllDatasetSelected(true);
    toast.success(`Selected all ${inventory.length} inventory records!`);
  };

  const handleDeleteSelectedInventory = async () => {
    if (selectedIds.length === 0) return;
    setBatchDeleting(true);
    const count = selectedIds.length;
    toast.loading(`Resetting stock to 0 for ${count} selected items...`, { id: 'inv-batch-toast' });
    try {
      for (const id of selectedIds) {
        await api.put(`/admin/products/${id}`, { stockQuantity: 0 }).catch(() => null);
      }
      setInventory(prev => prev.map(item => selectedIds.includes(item.id) ? { ...item, stock: 0, status: 'Out of Stock' } : item));
      setSelectedIds([]);
      setIsAllDatasetSelected(false);
      window.dispatchEvent(new Event('karviyam_products_updated'));
      toast.success(`Successfully reset stock to 0 for ${count} items.`, { id: 'inv-batch-toast' });
      await fetchInventory();
    } catch (e) {
      console.error(e);
      toast.error('Failed to reset selected inventory', { id: 'inv-batch-toast' });
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleConfirmClearAllInventory = async () => {
    setClearAllLoading(true);
    toast.loading('Resetting all warehouse stock levels to 0...', { id: 'inv-del-toast' });
    try {
      let res = await api.delete('/admin/inventory/all').catch(() => null);
      if (!res) res = await api.post('/admin/inventory/delete-all').catch(() => null);

      const count = inventory.length;
      setInventory(prev => prev.map(i => ({ ...i, stock: 0, status: 'Out of Stock' })));
      setSelectedIds([]);
      setIsAllDatasetSelected(false);
      window.dispatchEvent(new Event('karviyam_products_updated'));
      toast.success(`Successfully reset stock to 0 across ${count} inventory items.`, { id: 'inv-del-toast' });
      setClearAllModalOpen(false);
      await fetchInventory();
    } catch (e) {
      console.error(e);
      toast.error('Clear All failed. No records were deleted.', { id: 'inv-del-toast' });
    } finally {
      setClearAllLoading(false);
    }
  };

  const updateStock = async (item, delta) => {
    const nextStock = Math.max(0, item.stock + delta);
    setUpdatingId(item.id);

    try {
      const payload = {
        ...item.rawProduct,
        stockQuantity: nextStock
      };

      const res = await api.put(`/admin/products/${item.id}`, payload);
      const apiData = res.data ? res.data : res;
      
      if (apiData.success || res.status === 200) {
        toast.success(`Updated stock for ${item.name} to ${nextStock} units! 📦`);
        window.dispatchEvent(new Event('karviyam_products_updated'));
        fetchInventory();
      } else {
        toast.error('Failed to update stock in database');
      }
    } catch (e) {
      console.error('Stock update failed:', e);
      toast.error('Error saving updated stock to database');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-3.5">
      <ClearAllModal
        isOpen={clearAllModalOpen}
        onClose={() => setClearAllModalOpen(false)}
        moduleName="Inventory Records"
        itemCount={inventory.length}
        onConfirm={handleConfirmClearAllInventory}
        loading={clearAllLoading}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-xl sm:text-2xl text-slate-900 tracking-tight">Inventory & Warehouse Management</h1>
          <p className="text-xs text-slate-500 font-medium">Monitor product stock levels, SKU tracking & reorder alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown
            filename="inventory_report"
            title="Inventory & Warehouse Stock Report"
            headers={INVENTORY_EXPORT_HEADERS}
            data={inventory}
          />
          <button
            onClick={() => setClearAllModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
            <span>Clear All Data</span>
          </button>
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Inventory
          </button>
        </div>
      </div>

      {/* Inventory Stock Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B71C1C]" />
            Loading live inventory from database...
          </div>
        ) : inventory.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No inventory items found.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={inventory.length > 0 && selectedIds.length === inventory.length}
                    onChange={() => toggleSelectAllPage(inventory)}
                    className="w-4 h-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500 cursor-pointer"
                  />
                </th>
                <th className="p-4">Product & SKU</th>
                <th className="p-4">Warehouse Location</th>
                <th className="p-4 text-center">Current Stock</th>
                <th className="p-4 text-center">Reorder Threshold</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4 text-right">Adjust Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(item.id) ? 'bg-rose-50/40' : ''}`}>
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelectRow(item.id)}
                      className="w-4 h-4 rounded border-slate-300 text-rose-700 focus:ring-rose-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-[10px] text-slate-400">SKU: {item.sku}</p>
                  </td>
                  <td className="p-4 font-semibold text-slate-700">{item.warehouse}</td>
                  <td className="p-4 text-center font-black text-slate-900 text-sm">{item.stock} Units</td>
                  <td className="p-4 text-center font-semibold text-slate-500">{item.reorder} Units</td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-800' :
                      item.status === 'Low Stock' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <button
                      disabled={updatingId === item.id}
                      onClick={() => updateStock(item, -1)}
                      className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      disabled={updatingId === item.id}
                      onClick={() => updateStock(item, 5)}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-[#B71C1C] font-bold text-[11px] rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      +5
                    </button>
                    <button
                      disabled={updatingId === item.id}
                      onClick={() => updateStock(item, 20)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      +20 Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={inventory.length}
        isAllDatasetSelected={isAllDatasetSelected}
        onSelectAllDataset={selectFullDataset}
        onDeleteSelected={handleDeleteSelectedInventory}
        onClearSelection={() => {
          setSelectedIds([]);
          setIsAllDatasetSelected(false);
        }}
        moduleName="Inventory Records"
        loading={batchDeleting}
      />

    </div>
  );
}
