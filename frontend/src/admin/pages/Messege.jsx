import React, { useState, useEffect } from 'react';
import { Search, User, MapPin, Phone, Calendar, Package, Sprout, Weight, IndianRupee, MessageSquare, AlertCircle, RefreshCw, Filter, Wheat, Clock } from 'lucide-react';

const SalesDashboard = () => {
    const [salesData, setSalesData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterBy, setFilterBy] = useState('all');

    useEffect(() => {
        fetchSalesData();
    }, []);

    useEffect(() => {
        filterData();
    }, [salesData, searchTerm, filterBy]);

    const fetchSalesData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get token from localStorage
            const token = typeof window !== 'undefined' ? window.localStorage?.getItem('token') || '' : '';

            const response = await fetch('${import.meta.env.VITE_BACKEND_URL}/api/sale/getsale', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched sales data:', data);

            // Handle the API response structure
            if (data && data.sale && Array.isArray(data.sale)) {
                // If data comes as array in 'sale' property
                setSalesData(data.sale);
            } else if (data && data.data) {
                // If data comes as single object in 'data' property
                setSalesData([data.data]);
            } else if (Array.isArray(data)) {
                // If data comes as direct array
                setSalesData(data);
            } else {
                // If no data found
                setSalesData([]);
            }

        } catch (err) {
            console.error('Error fetching sales data:', err);
            setError(err.message || 'Failed to fetch sales data. Please check your internet connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        let filtered = [...salesData];

        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.farmerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.cropName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.mandal?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterBy !== 'all') {
            filtered = filtered.filter(item => {
                switch (filterBy) {
                    case 'organic':
                        return item.farmingMethod?.toLowerCase().includes('organic');
                    case 'natural':
                        return item.farmingMethod?.toLowerCase().includes('natural');
                    case 'fresh':
                        return item.productCondition?.toLowerCase() === 'fresh';
                    case 'dried':
                        return item.productCondition?.toLowerCase() === 'dried';
                    default:
                        return true;
                }
            });
        }

        setFilteredData(filtered);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getFarmingMethodColor = (method) => {
        if (method?.toLowerCase().includes('organic')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (method?.toLowerCase().includes('natural')) return 'bg-blue-50 text-blue-700 border-blue-200';
        return 'bg-slate-50 text-slate-700 border-slate-200';
    };

    const getConditionColor = (condition) => {
        if (condition?.toLowerCase() === 'fresh') return 'bg-green-50 text-green-700 border-green-200';
        if (condition?.toLowerCase() === 'dried') return 'bg-amber-50 text-amber-700 border-amber-200';
        return 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const SalesCard = ({ sale }) => (
        <div  className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group">
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20"></div>
                <div className="relative flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                            <User className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-1">{sale.farmerName}</h3>
                            <p className="text-white/70 text-sm font-medium">Patta: {sale.pattaNumber}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-green-400">₹{sale.pricePerKg}</div>
                        <div className="text-white/70 text-sm font-medium">per kg</div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div  className="p-6 space-y-5">
                {/* Product Info Card */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                <Wheat className="w-5 h-5 text-green-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg">{sale.productName}</h4>
                        </div>
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getConditionColor(sale.productCondition)}`}>
                            {sale.productCondition}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                            <Package className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-700">{sale.productForm}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Weight className="w-4 h-4 text-gray-500" />
                            <span className="font-bold text-gray-900">{sale.quantity}</span>
                        </div>
                    </div>
                </div>

                {/* Farming Method */}
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                        <Sprout className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-700">Farming Method</span>
                    </div>
                    <span className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getFarmingMethodColor(sale.farmingMethod)}`}>
                        {sale.farmingMethod}
                    </span>
                </div>

                {/* Location Card */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-sm">
                            <div className="font-bold text-blue-900 mb-1">{sale.revenueVillage}, {sale.mandal}</div>
                            <div className="text-blue-700 font-medium">{sale.state} - {sale.pincode}</div>
                        </div>
                    </div>
                </div>

                {/* Contact & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <Phone className="w-4 h-4 text-gray-600" />
                        <a href={`tel:${sale.mobileNumber}`} className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                            {sale.mobileNumber}
                        </a>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-700 font-medium text-sm">
                            {formatDate(sale.harvestingDate)}
                        </span>
                    </div>
                </div>

                {/* Message */}
                {sale.message && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                            <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-amber-800 font-medium leading-relaxed">{sale.message}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div id='stock' className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
                <div className="flex flex-col items-center space-y-6 text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-200">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
                        <Wheat className="absolute inset-0 m-auto text-green-600" size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Sales Data</h3>
                        <p className="text-gray-600">Please wait while we fetch the latest information...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Unable to Load Data</h2>
                    <p className="text-red-600 mb-8 leading-relaxed">{error}</p>
                    <button
                        onClick={fetchSalesData}
                        className="bg-red-600 text-white px-8 py-3 rounded-xl hover:bg-red-700 transition-all duration-200 inline-flex items-center space-x-3 font-semibold"
                    >
                        <RefreshCw className="w-5 h-5" />
                        <span>Retry</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div id='stock' className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center space-x-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center">
                            <Wheat className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900">Sales Dashboard</h1>
                    </div>
                    <p className="text-gray-600 text-lg font-medium">Premium agricultural products from verified farmers</p>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-3xl shadow-sm p-6 mb-8 border border-gray-200">
                    <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center">
                        {/* Search */}
                        <div className="relative flex-1 max-w-lg">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by farmer, crop, or location..."
                                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all text-sm font-medium bg-gray-50 focus:bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-3">
                            {[
                                { key: 'all', label: 'All Products', icon: Filter },
                                { key: 'organic', label: 'Organic', icon: Sprout },
                                { key: 'natural', label: 'Natural', icon: Wheat },
                                { key: 'fresh', label: 'Fresh', icon: Clock },
                                { key: 'dried', label: 'Processed', icon: Package }
                            ].map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilterBy(key)}
                                    className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 border-2 ${filterBy === key
                                        ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-200'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sales Grid */}
                {filteredData.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Wheat className="w-16 h-16 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-700 mb-3">No Products Found</h3>
                        <p className="text-gray-500 text-lg">Try adjusting your search criteria or filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredData.map((sale) => (
                            <SalesCard key={sale._id} sale={sale} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesDashboard;