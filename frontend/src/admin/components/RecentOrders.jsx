import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, User, CreditCard, Package, Leaf, Phone, Mail, ShoppingBag, Clock } from 'lucide-react';
import "../pages/page.css"

const RecentOrders = () => {
  // State management for orders, loading state, and errors
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Unified API endpoint - use the same endpoint for both initial fetch and retry
  const API_ENDPOINT = `${import.meta.env.VITE_BACKEND_URL}/api/order/getOrders`;
  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Get the authentication token from local storage
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      // Use the unified API endpoint
      const response = await axios.get(API_ENDPOINT, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Orders fetched:', response.data);

      // Handle different response structures
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setOrders(response.data.data);
      } else if (response.data && Array.isArray(response.data.orders)) {
        setOrders(response.data.orders);
      } else if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Unexpected data format received from server');
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);

      if (err.response) {
        // Handle specific error codes
        if (err.response.status === 401) {
          setError('Your session has expired. Please log in again.');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('token');
        } else if (err.response.status === 403) {
          setError('You do not have permission to view orders.');
        } else if (err.response.status === 404) {
          setError('Orders endpoint not found. Please contact support.');
        } else {
          setError(`Server error: ${err.response.status}. ${err.response.data?.message || 'Please try again later.'}`);
        }
      } else if (err.request) {
        setError('No response from server. Please check your internet connection.');
      } else {
        setError(`Failed to fetch orders: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Retry function - now uses the same fetchOrders function
  const handleRetry = () => {
    setError(null);
    setOrders([]);
    fetchOrders();
  };

  // Function to handle login redirect
  const handleLogin = () => {
    window.location.href = '/adminlogin';
  };

  // Function to format date string
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Enhanced status colors for agro/herbs business
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';

    if (statusLower === 'delivered' || statusLower === 'success' || statusLower === 'completed') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (statusLower === 'shipped' || statusLower === 'dispatched' || statusLower === 'in-transit') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (statusLower === 'pending' || statusLower === 'processing' || statusLower === 'confirmed') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (statusLower === 'failed' || statusLower === 'cancelled' || statusLower === 'rejected') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (statusLower === 'packed' || statusLower === 'ready') {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Function to get product category icon
  const getProductIcon = (products) => {
    if (!products || !Array.isArray(products)) return <Package size={14} />;

    const hasHerbs = products.some(p =>
      p.category?.toLowerCase().includes('herb') ||
      p.name?.toLowerCase().includes('herb') ||
      p.type?.toLowerCase().includes('herb')
    );

    return hasHerbs ? <Leaf size={14} /> : <Package size={14} />;
  };

  return (
    <div   className= " mobo bg-white rounded-lg shadow-lg overflow-hidden border border-green-100 ">
      <div className="p-3 sm:p-4 border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center space-x-2">
          <Leaf className="text-green-600 flex-shrink-0" size={20} />
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate">Recent Orders - Shree Venkateswara Agros & Herbs</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Agricultural products and herbal supplements</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-3"></div>
          <span className="text-sm text-gray-600 text-center">Loading orders...</span>
        </div>
      )}

      {error && (
        <div className="p-3 sm:p-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-3 rounded-lg relative mb-4">
            <div className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm leading-relaxed break-words">{error}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:justify-end">
            <button
              onClick={handleRetry}
              className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors shadow-sm"
            >
              Retry
            </button>
            {error.includes('log in') && (
              <button
                onClick={handleLogin}
                className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors shadow-sm"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-12 px-4">
          <Leaf className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-base sm:text-lg">No orders found.</p>
          <p className="text-gray-400 text-xs sm:text-sm mt-2">Orders will appear here once customers place them.</p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          {/* Desktop view - table format */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full  bg-white">
              <thead className="bg-green-50">
                <tr>
                  <th className="py-3 px-2 sm:px-4 border-b border-green-200 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Order ID</th>
                  <th className="py-3 px-2 sm:px-4 border-b border-green-200 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Customer</th>
                  <th className="py-3 px-2 sm:px-4 border-b border-green-200 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Products</th>
                  <th className="py-3 px-2 sm:px-4 border-b border-green-200 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-2 sm:px-4 border-b border-green-200 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Amount</th>
                  <th className="py-3 px-2 sm:px-4 border-b border-green-200 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Order Status</th>
                  <th className="py-3 px-2 sm:px-4 border-b border-green-200 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order, index) => (
                  <tr key={order.orderId || order._id || index} className="hover:bg-green-50 transition-colors">
                    <td className="py-3 px-2 sm:px-4 uppercase whitespace-nowrap font-mono text-xs sm:text-sm">
                      #{order.orderId ? `${order.orderId.slice(-8)}` : `${order._id?.slice(-8) || `ORD${index.toString().padStart(3, '0')}`}`}
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className="font-medium text-gray-900 text-sm">{order.userName || order.name}</div>
                      <div className="text-xs text-gray-500 mb-1 truncate max-w-[150px]">{order.userEmail || order.email}</div>
                      {order.phoneNumber && (
                      <div className="text-xs text-gray-500">{order.phoneNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex items-center">
                        {getProductIcon(order.products || order.items)}
                        <span className="ml-1 text-xs sm:text-sm">
                          {order.products?.length || order.items?.length || 0} item(s)
                        </span>
                      </div>
                      {order.products?.[0]?.name && (
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-[120px]">
                          {order.products[0].name}
                          {order.products.length > 1 && ` +${order.products.length - 1} more`}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 sm:px-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {formatDate(order.createdAt || order.orderDate)}
                    </td>
                    <td className="py-3 px-2 sm:px-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      ${order.totalAmount.toFixed(2) || order.total || 0}
                    </td>
                    <td className="py-3 px-2 sm:px-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(order.orderStatus || order.status)}`}>
                        {order.orderStatus || order.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(order.paymentStatus || order.payment?.status)}`}>
                        {order.paymentStatus || order.payment?.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile and Tablet view - card format */}
          <div className="lg:hidden">
            <div className="divide-y divide-gray-200">
              {orders.map((order, index) => (
                <div key={order.orderId || order._id || index} className="px-4 py-4 sm:px-6 sm:py-4 hover:bg-green-50 transition-colors">
                  <div className="order-2 sm:order-1 mb-3">
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded-full">
                      #{order.orderId ? order.orderId.slice(-8) : order._id?.slice(-8) || `ORD${index.toString().padStart(3, '0')}`}
                    </span>
                  </div>

                  {/* Header row with Order ID and Status */}
                  <div className="flex  flex-col sm:flex-row sm:justify-between sm:items-start mb-3 space-y-2 sm:space-y-0">
                    <div className="order-1  sm:order-2 flex flex-wrap gap-5">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.orderStatus || order.status)}`}>
                        <span className="text-blue-600 text-md">order status:</span> {order.orderStatus || order.status || 'Pending'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.paymentStatus || order.payment?.status)}`}>
                        <span className="text-purple-600 text-md">Payment status:</span> {order.paymentStatus || order.payment?.status || 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Beautiful Divider */}
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gradient-to-r from-transparent via-green-200 to-transparent"></div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="flex items-start mb-3">
                    <div className="min-w-0 flex-1 ">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        <span className="text-emerald-600 text-md">customerName:</span> {order.userName || order.name}
                      </div>
                      <div className="font-medium text-sm text-gray-900 truncate">
                        <span className="text-emerald-600 text-md">Email:</span> {order.userEmail || order.name}
                      </div>
                      <div className="font-medium text-sm text-gray-900 truncate">
                        <span className="text-emerald-600 text-md">Phone:</span> {order.phoneNumber || order.name}
                      </div>
                    </div>
                  </div>

                  {/* Beautiful Divider */}
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
                    </div>
                  </div>

                  {/* Product Information */}
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0 mr-2">
                      {getProductIcon(order.products || order.items)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-gray-600">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          <span className="text-emerald-600 text-md">totalProduct :</span>{(order.products?.length || order.items?.length || 0)} item(s)
                        </div>
                      </span>
                      {order.products?.[0]?.name && (
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          <span className="text-indigo-600">{order.products[0].name}</span>
                          {order.products.length > 1 && ` +${order.products.length - 1} more`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Beautiful Divider */}
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gradient-to-r from-transparent via-purple-200 to-transparent"></div>
                    </div>
                  </div>

                  {/* Date and Amount Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center text-gray-500">
                      <Calendar size={14} className="mr-2 flex-shrink-0 text-blue-500" />
                      <div className="font-medium text-sm text-gray-900 truncate">
                        <span className="text-emerald-600 text-md">orderdate :</span>{formatDate(order.createdAt || order.orderDate)}
                      </div>
                    </div>

                    <div className="flex items-center font-medium text-sm">
                      <CreditCard size={14} className="mr-2 flex-shrink-0 text-green-500" />
                      <div className="font-medium text-sm text-gray-900 truncate">
                        <span className="text-emerald-600 text-md">totalAmount :</span>${order.totalAmount || order.name}
                      </div>
                    </div>
                  </div>

                  {/* Bottom decorative border */}
                  <div className="mt-4 h-1 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RecentOrders;
