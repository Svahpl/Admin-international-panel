import React, { useState, useEffect } from 'react';
import { Search, Filter, User, Building, Mail, Phone, Globe, MapPin, Clock, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

const Message = () => {
    const [salesData, setSalesData] = useState([]);
    const [requirementData, setRequirementData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterData();
    }, [salesData, requirementData, activeFilter, searchTerm]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            setDebugInfo(null);

            // Get token from localStorage
            const token = localStorage.getItem("token");

            console.log('Token found:', !!token);
            console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'No token');

            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            const headers = {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            console.log('Making API requests with headers:', headers);

            // Try to fetch sales data first
            let salesResponse, requirementResponse;

            try {
                console.log('Fetching sales data...');
                // Since the API expects form data, we'll send an empty object or required fields
                salesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/form/getsalse`, { headers });
                console.log('Sales response:', salesResponse.status, salesResponse.data);
            } catch (salesError) {
                console.error('Sales API error:', salesError.response?.data || salesError.message);
                setDebugInfo(prev => ({
                    ...prev,
                    salesError: {
                        status: salesError.response?.status,
                        message: salesError.response?.data?.message || salesError.message,
                        data: salesError.response?.data
                    }
                }));
            }

            try {
                console.log('Fetching requirements data...');
                // Since the API expects form data, we'll send an empty object or required fields
                requirementResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/form/getrequirement`, { headers });
                console.log('Requirements response:', requirementResponse.status, requirementResponse.data);
            } catch (reqError) {
                console.error('Requirements API error:', reqError.response?.data || reqError.message);
                setDebugInfo(prev => ({
                    ...prev,
                    requirementsError: {
                        status: reqError.response?.status,
                        message: reqError.response?.data?.message || reqError.message,
                        data: reqError.response?.data
                    }
                }));
            }

            setSalesData(
                (salesResponse?.data?.salse || []).map(item => ({
                    ...item,
                    salesDetails: item.SalesDetails || '',
                }))
            );

            setRequirementData(
                (requirementResponse?.data?.requirements || []).map(item => ({
                    ...item,
                    requirements: item.requirements || '',
                }))
            );
            

            // If both APIs failed, throw error
            if (!salesResponse && !requirementResponse) {
                throw new Error('Both API endpoints failed. Please check your server and authentication.');
            }

        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message || 'Failed to fetch data');
            setDebugInfo(prev => ({
                ...prev,
                generalError: err.response?.data || err.message
            }));
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        let combined = [];

        if (activeFilter === 'all' || activeFilter === 'sales') {
            combined = [...combined, ...salesData.map(item => ({ ...item, type: 'sales' }))];
        }

        if (activeFilter === 'all' || activeFilter === 'requirements') {
            combined = [...combined, ...requirementData.map(item => ({ ...item, type: 'requirements' }))];
        }

        if (searchTerm) {
            combined = combined.filter(item =>
                item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.companyEmail?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredData(combined);
    };

    const handleRetry = () => {
        fetchData();
    };

    const MessageCard = ({ item }) => (
        <div  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="p-6">
                {/* Header */}
                <div  className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{item.fullName || 'N/A'}</h3>
                            <p className="text-sm text-gray-500 flex items-center">
                                <Building className="w-4 h-4 mr-1" />
                                {item.companyName || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.type === 'sales'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                        {item.type === 'sales' ? 'Sales' : 'Requirement'}
                    </span>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 mt-1 h-4 mr-2 text-gray-400" />
                        <a href={`mailto:${item.companyEmail}`} className="hover:text-blue-600 transition-colors">
                            {item.companyEmail || 'N/A'}
                        </a>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{item.country || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 mt-1  h-4 mr-2 text-gray-400" />
                        <a href={`tel:${item.code}${item.number}`} className="hover:text-blue-600 transition-colors">
                            {item.code} {item.number || 'N/A'}
                        </a>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4  h-4 mr-2 text-gray-400" />
                        <span>{item.companyAddress || 'N/A'}, {item.country || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <Globe className="w-4 mt-1  h-4 mr-2 text-gray-400" />
                        <a href={item.websiteLink} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                            {item.websiteLink || 'N/A'}
                        </a>
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {item.type === 'sales' ? 'Sales Details' : 'Requirements'}
                        </h4>
                        <p className="text-sm text-gray-600">
                            {item.salesDetails || item.requirements || 'No details provided'}
                        </p>
                    </div>

                    {item.additionalMessage && (
                        <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-700 mb-2">Additional Message</h4>
                            <p className="text-sm text-blue-600">{item.additionalMessage}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div id='stock' className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading messages...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="text-center mb-6">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">API Error</h2>
                            <p className="text-red-600 mb-4">{error}</p>
                            <button
                                onClick={handleRetry}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </button>
                        </div>

                        {debugInfo && (
                            <div className="bg-gray-50 rounded-lg p-4 text-left">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Information</h3>

                                {debugInfo.salesError && (
                                    <div className="mb-4">
                                        <h4 className="font-medium text-red-700 mb-2">Sales API Error:</h4>
                                        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                                            <p><strong>Status:</strong> {debugInfo.salesError.status}</p>
                                            <p><strong>Message:</strong> {debugInfo.salesError.message}</p>
                                            {debugInfo.salesError.data && (
                                                <div className="mt-2">
                                                    <strong>Response Data:</strong>
                                                    <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto text-xs">
                                                        {JSON.stringify(debugInfo.salesError.data, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {debugInfo.requirementsError && (
                                    <div className="mb-4">
                                        <h4 className="font-medium text-red-700 mb-2">Requirements API Error:</h4>
                                        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                                            <p><strong>Status:</strong> {debugInfo.requirementsError.status}</p>
                                            <p><strong>Message:</strong> {debugInfo.requirementsError.message}</p>
                                            {debugInfo.requirementsError.data && (
                                                <div className="mt-2">
                                                    <strong>Response Data:</strong>
                                                    <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto text-xs">
                                                        {JSON.stringify(debugInfo.requirementsError.data, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="text-xs text-gray-600 mt-4">
                                    <p><strong>Common Solutions:</strong></p>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Check if your backend server is running on localhost:8000</li>
                                        <li>Verify your authentication token is valid</li>
                                        <li>Check if the API endpoints exist and accept GET requests</li>
                                        <li>Ensure CORS is properly configured on your backend</li>
                                        <li>Check browser console for additional error details</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div id='stock' className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-green-900 mb-2">Message Dashboard</h1>
                    <p className="text-gray-600">Manage your sales inquiries and requirements</p>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name, company, or email..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex items-center space-x-2">
                            <div className="flex space-x-2">
                                {['all', 'sales', 'requirements'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === filter
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-center mt-4 space-x-8 text-sm text-gray-600">
                        <span>Total: {filteredData.length}</span>
                        <span>Sales: {salesData.length}</span>
                        <span>Requirements: {requirementData.length}</span>
                    </div>
                </div>

                {/* Messages Grid */}
                {filteredData.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No messages found</p>
                        <p className="text-gray-400">Try adjusting your search or filter criteria</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredData.map((item) => (
                            <MessageCard key={item._id} item={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Message;
