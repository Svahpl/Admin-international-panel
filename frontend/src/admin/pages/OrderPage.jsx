import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Truck, Check, CreditCard, Calendar, Loader, X, Filter, ChevronRight, Leaf, ShoppingCart, User, Hash, Image } from 'lucide-react';
import Swal from 'sweetalert2';
import "../pages/page.css"

const OrdersList = () => {
    // State for orders data
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrderStatus, setSelectedOrderStatus] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortBy, setSortBy] = useState('Recent'); // 'Recent' or 'Oldest'
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);

    // Create api instance
    const api = axios.create({
        baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`
    });

    // Set up authentication and fetch data
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Get token from localStorage
                const storedToken = localStorage.getItem("token");

                if (!storedToken) {
                    throw new Error("No authentication token found");
                }

                // Set the token in the axios instance
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                setLoading(true);

                // Fetch orders data using the updated API endpoint
                const ordersResponse = await api.get('/order/getOrders');
                const ordersData = ordersResponse.data;

                console.log('Orders API Response:', ordersData); // Debug log

                // Handle different response structures
                let ordersArray = [];
                if (Array.isArray(ordersData)) {
                    ordersArray = ordersData;
                } else if (ordersData && Array.isArray(ordersData.orders)) {
                    ordersArray = ordersData.orders;
                } else if (ordersData && Array.isArray(ordersData.data)) {
                    ordersArray = ordersData.data;
                } else if (ordersData && ordersData.success && Array.isArray(ordersData.orders)) {
                    ordersArray = ordersData.orders;
                } else if (ordersData && ordersData.success && Array.isArray(ordersData.data)) {
                    ordersArray = ordersData.data;
                } else {
                    console.log('Unexpected response structure:', ordersData);
                    // If ordersData is an object but not an array, try to extract array from any property
                    const possibleArrays = Object.values(ordersData).filter(value => Array.isArray(value));
                    if (possibleArrays.length > 0) {
                        ordersArray = possibleArrays[0];
                    } else {
                        ordersArray = [];
                    }
                }

                // Ensure ordersArray is actually an array before processing
                if (!Array.isArray(ordersArray)) {
                    console.error('Could not extract orders array from response:', ordersData);
                    ordersArray = [];
                }

                // Process orders to ensure orderId is properly set and calculate totalAmount
                const processedOrders = ordersArray.map(order => {
                    // Calculate total amount if not present
                    let calculatedTotal = order.totalAmount || 0;

                    if (!calculatedTotal && order.items && Array.isArray(order.items)) {
                        calculatedTotal = order.items.reduce((sum, item) => {
                            const itemPrice = item.price || item.product?.price || 0;
                            const itemQuantity = item.quantity || 1;
                            return sum + (itemPrice * itemQuantity);
                        }, 0);
                    }

                    return {
                        ...order,
                        orderId: order._id || order.orderId || `ORDER_${Date.now()}`,
                        orderDate: new Date(order.orderDate || order.createdAt || Date.now()),
                        totalAmount: calculatedTotal,
                        // Ensure customer info is available
                        customerName: order.userName || order.name || order.customerName || order.user?.name || 'N/A',
                        customerEmail: order.userEmail || order.email || order.customerEmail || order.user?.email || 'N/A',
                        customerPhone: order.phoneNumber || order.phone || order.user?.phone || 'N/A',
                        shippingAddress: order.shippingAddress || order.address || order.user?.address || 'N/A'
                    };
                });

                setOrders(processedOrders);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError(err.response?.data?.message || err.message);
                setLoading(false);

                // Show error alert for fetch failure
                Swal.fire({
                    title: 'Error!',
                    text: `Failed to load orders: ${err.response?.data?.message || err.message}`,
                    icon: 'error',
                    confirmButtonText: 'OK',
                    customClass: {
                        confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700'
                    }
                });
            }
        };

        fetchOrders();
    }, []);

    // Function to get last 6 digits of order ID
    const getLastSixDigits = (orderId) => {
        if (!orderId) return 'N/A';
        const orderIdStr = orderId.toString();
        return orderIdStr.length > 6 ? orderIdStr.slice(-6) : orderIdStr;
    };

    // Get status color and icon - Updated with green theme (removed Processing)
    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
            case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending': return <Calendar size={16} />;
            case 'Shipped': return <Truck size={16} />;
            case 'Delivered': return <Check size={16} />;
            case 'Paid': return <CreditCard size={16} />;
            default: return <ShoppingCart size={16} />;
        }
    };

    // Filter and sort orders
    const filteredOrders = orders.filter(order => {
        if (filterStatus === 'All') return true;
        return order.orderStatus === filterStatus;
    });

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (sortBy === 'Recent') {
            return b.orderDate - a.orderDate;
        } else {
            return a.orderDate - b.orderDate;
        }
    });

    // Handle order click - show modal
    const handleOrderClick = (order) => {
        setSelectedOrder(order);
        setSelectedOrderStatus(order.orderStatus || 'Pending');
        setShowModal(true);
        setShowSidebar(false); // Close sidebar when opening modal on mobile
    };

    // Handle status update
    const handleStatusUpdate = (newStatus) => {
        setSelectedOrderStatus(newStatus);
    };

    // Save status changes - FIXED API implementation

    // Save status changes - FIXED API implementation
    const handleSaveChanges = async () => {
        if (!selectedOrder || selectedOrder.orderStatus === selectedOrderStatus) {
            setShowModal(false);
            return;
        }

        setUpdatingStatus(true);

        try {
            // Get token from localStorage
            const storedToken = localStorage.getItem("token");

            if (!storedToken) {
                throw new Error("No authentication token found");
            }

            // Use the MongoDB _id for the API call
            const updateId = selectedOrder._id || selectedOrder.orderId;

            console.log('Updating order with ID:', updateId);
            console.log('New status:', selectedOrderStatus);

            // Make API call to update order status - FIXED to match backend expectation
            const response = await api.put(`/order/orderstatus/${updateId}`, {
                status: selectedOrderStatus  
            }, {
                headers: {
                    'Authorization': `Bearer ${storedToken}`,
                }
            });

            console.log('API Response:', response.data);

            if (response.data.success || response.status === 200) {
                // Update the order in the local state using the correct identifier
                setOrders(prevOrders =>
                    prevOrders.map(order =>
                        (order._id === selectedOrder._id || order.orderId === selectedOrder.orderId)
                            ? { ...order, orderStatus: selectedOrderStatus }
                            : order
                    )
                );

                // Update the selected order
                setSelectedOrder(prev => ({ ...prev, orderStatus: selectedOrderStatus }));

                // Show success message
                Swal.fire({
                    title: 'Success!',
                    text: `Order status updated to ${selectedOrderStatus}`,
                    icon: 'success',
                    confirmButtonText: 'OK',
                    customClass: {
                        confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700'
                    }
                });

                setShowModal(false);
            } else {
                throw new Error(response.data.message || 'Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating order status:', error);

            // Show error message
            Swal.fire({
                title: 'Error!',
                text: `Failed to update order status: ${error.response?.data?.message || error.message}`,
                icon: 'error',
                confirmButtonText: 'OK',
                customClass: {
                    confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700'
                }
            });
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Toggle sidebar on mobile
    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    if (loading) {
        return (
            <div className="w-full max-w-6xl mx-auto p-4 flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <Leaf className="animate-pulse h-8 w-8 text-green-600 mr-2" />
                        <Loader className="animate-spin h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-green-700 font-medium">Loading your orders...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-6xl mx-auto p-4 text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center justify-center mb-2">
                        <X className="h-6 w-6 text-red-600" />
                    </div>
                    <p className="text-red-700 font-medium">Error loading orders</p>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div id='orderview' className="w-full max-w-7xl mx-auto p-2 sm:p-4 bg-gradient-to-br from-green-50 to-white min-h-screen">
            {/* Header Section */}
            <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-2">
                    <Leaf className="h-8 w-8 text-green-600 mr-2" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-green-800">Shree Venkateswara Agros & Herbs</h1>
                </div>
                <p className="text-green-600 font-medium">Orders Management System</p>
            </div>

            {/* Mobile Filter Button */}
            <div className="md:hidden mb-4">
                <button
                    onClick={toggleSidebar}
                    className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg text-green-700 font-medium shadow-sm border border-green-200"
                >
                    <div className="flex items-center gap-2">
                        <Filter size={18} />
                        <span>Filter & Sort Orders</span>
                    </div>
                    <span className="text-sm bg-green-100 px-2 py-1 rounded-full">
                        {filterStatus !== 'All' ? filterStatus : 'All Orders'}
                    </span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                {/* Sidebar - Updated filter options (removed Processing) */}
                <div className={`
                    md:w-64 md:flex-shrink-0 md:block
                    fixed md:static top-0 left-0 h-full md:h-auto z-40 w-3/4 sm:w-72
                    transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
                    transition-transform duration-300 ease-in-out
                `}>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full md:h-auto border border-green-100">
                        {/* Mobile sidebar header */}
                        <div className="md:hidden p-4 bg-green-50 border-b border-green-100 flex justify-between items-center">
                            <h3 className="font-semibold text-green-700 flex items-center gap-2">
                                <Leaf size={16} />
                                Filters & Sorting
                            </h3>
                            <button
                                onClick={toggleSidebar}
                                className="text-green-700 hover:text-green-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Filter by status */}
                        <div className="p-4 border-b border-green-100 bg-green-50">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-green-800">
                                <Filter size={16} /> Filter Orders
                            </h3>
                        </div>
                        <div className="p-2">
                            {['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                                <button
                                    key={status}
                                    className={`w-full text-left px-4 py-3 rounded-md transition-colors ${filterStatus === status
                                        ? 'bg-green-50 text-green-700 font-medium border-l-4 border-green-500'
                                        : 'hover:bg-green-50 text-gray-700'
                                        }`}
                                    onClick={() => {
                                        setFilterStatus(status);
                                        setShowSidebar(false);
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        {status !== 'All' && getStatusIcon(status)}
                                        {status}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Sort by */}
                        <div className="p-4 border-t border-green-100">
                            <h3 className="text-md font-semibold mb-2 text-green-800">Sort by Date</h3>
                            <div className="flex flex-col gap-2">
                                <button
                                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${sortBy === 'Recent'
                                        ? 'bg-green-50 text-green-700 font-medium'
                                        : 'hover:bg-green-50 text-gray-700'
                                        }`}
                                    onClick={() => {
                                        setSortBy('Recent');
                                        setShowSidebar(false);
                                    }}
                                >
                                    Recent First
                                </button>
                                <button
                                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${sortBy === 'Oldest'
                                        ? 'bg-green-50 text-green-700 font-medium'
                                        : 'hover:bg-green-50 text-gray-700'
                                        }`}
                                    onClick={() => {
                                        setSortBy('Oldest');
                                        setShowSidebar(false);
                                    }}
                                >
                                    Oldest First
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overlay for mobile sidebar */}
                {showSidebar && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
                        onClick={() => setShowSidebar(false)}
                    ></div>
                )}

                {/* Orders List */}
                <div className="flex-1">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-green-100">
                        {/* Headers - Hidden on small screens */}
                        <div className="hidden sm:grid sm:grid-cols-4 gap-2 p-4 bg-green-50 border-b border-green-200 font-medium text-green-800">
                            <div>Order ID</div>
                            <div>Date</div>
                            <div>Status</div>
                            <div>Total Amount</div>
                        </div>

                        {/* Order Items */}
                        <div className="divide-y divide-green-100">
                            {sortedOrders.length > 0 ? (
                                sortedOrders.map((order) => (
                                    <div
                                        key={order.orderId}
                                        className="p-3 sm:p-4 hover:bg-green-50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-green-300"
                                        onClick={() => handleOrderClick(order)}
                                    >
                                        {/* Mobile layout */}
                                        <div className="sm:hidden">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="font-medium text-green-700 flex items-center gap-2">
                                                    <Package size={16} />
                                                    #{getLastSixDigits(order.orderId)}
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(order.orderStatus)}`}>
                                                    {getStatusIcon(order.orderStatus)}
                                                    {order.orderStatus || 'Pending'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-gray-600 text-sm mb-1">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {order.orderDate.toLocaleDateString()}
                                                </div>
                                                <div className="font-medium text-green-600">
                                                    ${order.totalAmount?.toFixed(2) || '0.00'}
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <ChevronRight size={16} className="text-green-400" />
                                            </div>
                                        </div>

                                        {/* Desktop layout */}
                                        <div className="hidden sm:grid sm:grid-cols-4 gap-2 items-center">
                                            <div className="font-medium text-green-600 flex items-center gap-2">
                                                <Package size={16} />
                                                #{getLastSixDigits(order.orderId)}
                                            </div>
                                            <div className="text-gray-700">
                                                {order.orderDate.toLocaleDateString()}
                                            </div>
                                            <div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1 ${getStatusColor(order.orderStatus)}`}>
                                                    {getStatusIcon(order.orderStatus)}
                                                    {order.orderStatus || 'Pending'}
                                                </span>
                                            </div>
                                            <div className="font-medium text-green-600">
                                                ＄{order.totalAmount?.toFixed(2) || '0.00'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Package className="h-12 w-12 text-gray-300" />
                                        <p>No orders found with the selected filter</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Detail Modal */}
            {showModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-green-200">
                        <div className="p-3 sm:p-4 border-b border-green-200 flex justify-between items-center bg-green-50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <Leaf className="h-6 w-6 text-green-600" />
                                <h2 className="text-lg sm:text-xl font-semibold text-green-700">
                                    Order #{getLastSixDigits(selectedOrder.orderId)}
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 shadow-sm"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Customer Information */}
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <h3 className="text-lg font-medium text-green-700 mb-3 flex items-center gap-2">
                                        <User size={18} />
                                        Customer Information
                                    </h3>
                                    <div className="space-y-2">
                                        <div><span className="text-green-600 font-medium">Name: </span>{selectedOrder.customerName}</div>
                                        <div><span className="text-green-600 font-medium">Email: </span>{selectedOrder.customerEmail}</div>
                                        <div><span className="text-green-600 font-medium">Phone: </span>{selectedOrder.customerPhone}</div>
                                        <div><span className="text-green-600 font-medium">Address: </span>{selectedOrder.shippingAddress}</div>
                                    </div>
                                </div>

                                {/* Order Details */}
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <h3 className="text-lg font-medium text-blue-700 mb-3 flex items-center gap-2">
                                        <Calendar size={18} />
                                        Order Details
                                    </h3>
                                    <div className="space-y-2">
                                        <div><span className="text-blue-600 font-medium">Order Date: </span>{selectedOrder.orderDate.toLocaleDateString()}</div>
                                        <div><span className="text-blue-600 font-medium">Payment Status: </span>{selectedOrder.paymentStatus || 'N/A'}</div>
                                        <div><span className="text-blue-600 font-medium">Expected Delivery: </span>{selectedOrder.expectedDelivery ? new Date(selectedOrder.expectedDelivery).toLocaleDateString() : 'N/A'}</div>
                                        <div><span className="text-blue-600 font-medium">Total Amount: </span>＄{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Products Information - FIXED image display */}
                            <div className="mt-6">
                                <h3 className="text-lg font-medium text-green-700 mb-3 flex items-center gap-2">
                                    <Package size={18} />
                                    Products Ordered
                                </h3>
                                <div className="bg-white border border-green-200 rounded-lg overflow-hidden">
                                    <div className="space-y-0">
                                        {selectedOrder.items && Array.isArray(selectedOrder.items) ? (
                                            selectedOrder.items.map((item, index) => (
                                                <div key={index} className="p-4 border-b border-green-100 last:border-b-0 hover:bg-green-50">
                                                    <div className="flex items-start gap-4">
                                                        {/* Product Images - FIXED */}
                                                        <div className="flex-shrink-0">
                                                            {(() => {
                                                                // Try to get images from different possible locations
                                                                let images = [];

                                                                if (item.product?.images && Array.isArray(item.product.images)) {
                                                                    images = item.product.images;
                                                                } else if (item.images && Array.isArray(item.images)) {
                                                                    images = item.images;
                                                                } else if (item.product?.image) {
                                                                    images = [item.product.image];
                                                                } else if (item.image) {
                                                                    images = [item.image];
                                                                }

                                                                if (images.length > 0) {
                                                                    return (
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {images.slice(0, 2).map((imageUrl, imgIndex) => (
                                                                                <div key={imgIndex} className="relative">
                                                                                    <img
                                                                                        src={imageUrl}
                                                                                        alt={`${item.title || item.product?.name || 'Product'} ${imgIndex + 1}`}
                                                                                        className="h-16 w-16 object-cover rounded-lg border border-green-200 shadow-sm"
                                                                                        onError={(e) => {
                                                                                            e.target.style.display = 'none';
                                                                                            if (e.target.nextElementSibling) {
                                                                                                e.target.nextElementSibling.style.display = 'flex';
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                    <div className="h-16 w-16 bg-green-100 rounded-lg border border-green-200 flex items-center justify-center" style={{ display: 'none' }}>
                                                                                        <Image className="h-6 w-6 text-green-400" />
                                                                                    </div>
                                                                                    {images.length > 1 && imgIndex === 0 && (
                                                                                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                                                            {images.length}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <div className="h-16 w-16 bg-green-100 rounded-lg border border-green-200 flex items-center justify-center">
                                                                            <Image className="h-6 w-6 text-green-400" />
                                                                        </div>
                                                                    );
                                                                }
                                                            })()}
                                                        </div>

                                                        {/* Product Details */}
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <div className="font-medium text-gray-800 mb-1">
                                                                        {item.title || item.product?.name || item.productName || item.name || 'Product Name'}
                                                                    </div>
                                                                    <div className="text-sm text-gray-600 space-y-1">
                                                                        <div>
                                                                            <span className="font-medium">Quantity:</span> {item.quantity || 1}
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-medium">Price:</span> ＄{(item.price || item.product?.price || 0).toFixed(2)}
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-medium">Total:</span> ＄{((item.price || item.product?.price || 0) * (item.quantity || 1)).toFixed(2)}
                                                                        </div>
                                                                        {(item.product?.description || item.description) && (
                                                                            <div className="mt-2">
                                                                                <span className="font-medium">Description:</span>
                                                                                <span className="text-xs text-gray-500 ml-1">
                                                                                    {(item.product?.description || item.description).substring(0, 100)}
                                                                                    {(item.product?.description || item.description).length > 100 && '...'}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-semibold text-green-600">
                                                                        ＄{((item.price || item.product?.price || 0) * (item.quantity || 1)).toFixed(2)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Package className="h-8 w-8 text-gray-300" />
                                                    <p>No items found in this order</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Order Status Update Section */}
                            <div className="mt-6">
                                <h3 className="text-lg font-medium text-green-700 mb-3 flex items-center gap-2">
                                    <Truck size={18} />
                                    Update Order Status
                                </h3>
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        {['Pending', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                                            <button
                                                key={status}
                                                className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-all ${selectedOrderStatus === status
                                                        ? 'bg-green-500 text-white shadow-md transform scale-105'
                                                        : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200'
                                                    }`}
                                                onClick={() => handleStatusUpdate(status)}
                                                disabled={updatingStatus}
                                            >
                                                {getStatusIcon(status)}
                                                <span className="hidden sm:inline">{status}</span>
                                                <span className="sm:hidden">{status.slice(0, 3)}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {selectedOrderStatus !== selectedOrder.orderStatus && (
                                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-center gap-2 text-amber-700">
                                                <Calendar size={16} />
                                                <span className="text-sm font-medium">
                                                    Status will change from "{selectedOrder.orderStatus}" to "{selectedOrderStatus}"
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Additional Order Information */}
                            {(selectedOrder.notes || selectedOrder.specialInstructions) && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-medium text-green-700 mb-3 flex items-center gap-2">
                                        <Hash size={18} />
                                        Additional Information
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="space-y-2">
                                            {selectedOrder.notes && (
                                                <div>
                                                    <span className="font-medium text-gray-700">Notes: </span>
                                                    <span className="text-gray-600">{selectedOrder.notes}</span>
                                                </div>
                                            )}
                                            {selectedOrder.specialInstructions && (
                                                <div>
                                                    <span className="font-medium text-gray-700">Special Instructions: </span>
                                                    <span className="text-gray-600">{selectedOrder.specialInstructions}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Order Summary */}
                            <div className="mt-6">
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-semibold text-green-700">Order Total</h3>
                                            <p className="text-sm text-green-600">
                                                {selectedOrder.items?.length || 0} item(s) • Order #{getLastSixDigits(selectedOrder.orderId)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-green-700">
                                                ＄{selectedOrder.totalAmount?.toFixed(2) || '0.00'}
                                            </div>
                                            <p className="text-sm text-green-600">
                                                {selectedOrder.paymentStatus === 'Paid' ? 'Paid' : 'Payment Pending'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors border border-gray-300"
                                    disabled={updatingStatus}
                                >
                                    Cancel
                                </button>

                                {selectedOrderStatus !== selectedOrder.orderStatus && (
                                    <button
                                        onClick={handleSaveChanges}
                                        disabled={updatingStatus}
                                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {updatingStatus ? (
                                            <>
                                                <Loader className="animate-spin h-4 w-4" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={16} />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Orders Summary Stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-md border border-green-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Total Orders</div>
                            <div className="text-xl font-bold text-blue-600">{orders.length}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-md border border-green-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Pending</div>
                            <div className="text-xl font-bold text-amber-600">
                                {orders.filter(order => order.orderStatus === 'Pending').length}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-md border border-green-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Check className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Delivered</div>
                            <div className="text-xl font-bold text-green-600">
                                {orders.filter(order => order.orderStatus === 'Delivered').length}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-md border border-green-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <CreditCard className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Total Revenue</div>
                            <div className="text-xl -ml-3 font-bold text-emerald-600">
                                ＄{orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-gray-500 text-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Leaf className="h-4 w-4 text-green-500" />
                    <span>Shree Venkateswara Agros & Herbs</span>
                </div>
                <p>Orders Management System • {new Date().getFullYear()}</p>
            </div>
        </div>
    );
};

export default OrdersList;