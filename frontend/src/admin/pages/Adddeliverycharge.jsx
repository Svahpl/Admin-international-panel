import React, { useState, useEffect } from 'react';
import { Plane, Ship, Save, RefreshCw, DollarSign, X, CheckCircle, AlertCircle } from 'lucide-react';

// Normal React Toast Component - Top Center
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
            <div className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg max-w-md w-full
                transform transition-all duration-300 ease-in-out
                ${type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-green-50 border border-green-200 text-green-800'
                }
            `}>
                <div className="flex-shrink-0">
                    {type === 'error' ? (
                        <AlertCircle className="text-red-500" size={20} />
                    ) : (
                        <CheckCircle className="text-green-500" size={20} />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className={`
                        flex-shrink-0 p-1 rounded-full transition-colors
                        ${type === 'error'
                            ? 'hover:bg-red-100 text-red-400 hover:text-red-600'
                            : 'hover:bg-green-100 text-green-400 hover:text-green-600'
                        }
                    `}
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

function Adddeliverycharge() {
    const [charges, setCharges] = useState({
        air: '',
        ship: ''
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [toast, setToast] = useState(null);

    // Fetch default charges on component mount
    useEffect(() => {
        fetchCharges();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const closeToast = () => {
        setToast(null);
    };

    const fetchCharges = async () => {
        try {
            setLoading(true);
            const response = await fetch('${import.meta.env.VITE_BACKEND_URL}/api/charge/getcharge');

            if (!response.ok) {
                throw new Error('Failed to fetch charges');
            }

            const data = await response.json();

            // Handle the correct API response structure
            if (data.delcharge && data.delcharge.length > 0) {
                const chargeData = data.delcharge[0];
                setCharges({
                    air: chargeData.aircharge || '',
                    ship: chargeData.shipcharge || ''
                });
            } else {
                // If no data found, set empty values
                setCharges({
                    air: '',
                    ship: ''
                });
            }

            // Don't show toast on initial load
        } catch (error) {
            console.error('Error fetching charges:', error);
            showToast('Failed to load default charges', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (type, value) => {
        // Only allow positive numbers
        if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
            setCharges(prev => ({
                ...prev,
                [type]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!charges.air || !charges.ship) {
            showToast('Please fill in both air and ship charges', 'error');
            return;
        }

        if (isNaN(charges.air) || isNaN(charges.ship)) {
            showToast('Please enter valid numbers for charges', 'error');
            return;
        }

        if (parseFloat(charges.air) < 0 || parseFloat(charges.ship) < 0) {
            showToast('Charges cannot be negative', 'error');
            return;
        }

        try {
            setUpdating(true);

            // Fixed: Send data with correct property names that match backend expectation
            const requestData = {
                aircharge: parseFloat(charges.air),
                shipcharge: parseFloat(charges.ship)
            };

            console.log('Sending data:', requestData); // Debug log

            const response = await fetch('${import.meta.env.VITE_BACKEND_URL}/api/charge/update-deliverycharge', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            console.log('Response status:', response.status); // Debug log

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Response error:', errorData);
                throw new Error(`Failed to update charges: ${response.status}`);
            }

            const result = await response.json();
            console.log('Update result:', result); // Debug log

            showToast('Delivery charges updated successfully!');

        } catch (error) {
            console.error('Error updating charges:', error);
            showToast('Failed to update delivery charges. Please try again.', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleRefresh = () => {
        fetchCharges();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="flex flex-col items-center space-y-3 text-center">
                    <RefreshCw className="animate-spin" size={28} />
                    <span className="text-gray-600 text-sm sm:text-base">Loading charges...</span>
                </div>
            </div>
        );
    }

    return (
        <div id='stock' className="min-h-screen mt-7 bg-gray-50 p-2 sm:p-4 lg:p-6">
            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={closeToast}
                />
            )}

            <div  className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                <DollarSign className="text-blue-600" size={20} />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Delivery Charges</h1>
                                <p className="text-sm sm:text-base text-gray-600">Manage air and ship delivery pricing</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors self-start sm:self-auto"
                            title="Refresh charges"
                        >
                            <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                        {/* Input Fields Container */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                            {/* Air Charge */}
                            <div>
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                    <Plane className="text-blue-500 flex-shrink-0" size={16} />
                                    <span>Air Delivery Charge</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="text-gray-400" size={16} />
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={charges.air}
                                        onChange={(e) => handleInputChange('air', e.target.value)}
                                        className="block w-full pl-9 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Enter air charge"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Ship Charge */}
                            <div>
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                                    <Ship className="text-green-500 flex-shrink-0" size={16} />
                                    <span>Ship Delivery Charge</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="text-gray-400" size={16} />
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={charges.ship}
                                        onChange={(e) => handleInputChange('ship', e.target.value)}
                                        className="block w-full pl-9 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        placeholder="Enter ship charge"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2 sm:pt-4">
                            <button
                                onClick={handleSubmit}
                                disabled={updating}
                                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2.5 sm:py-3 px-4 text-sm sm:text-base rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {updating ? (
                                    <>
                                        <RefreshCw className="animate-spin flex-shrink-0" size={16} />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="flex-shrink-0" size={16} />
                                        <span>Update Delivery Charges</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Current Charges Display */}
                    <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Current Charges</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Plane className="text-blue-600 flex-shrink-0" size={18} />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-blue-600 font-medium">Air Delivery</p>
                                        <p className="text-lg sm:text-xl font-bold text-blue-900 truncate">
                                            ${charges.air || '0.00'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Ship className="text-green-600 flex-shrink-0" size={18} />
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-green-600 font-medium">Ship Delivery</p>
                                        <p className="text-lg sm:text-xl font-bold text-green-900 truncate">
                                            ${charges.ship || '0.00'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Adddeliverycharge;