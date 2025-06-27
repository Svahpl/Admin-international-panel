import React, { useState } from 'react';
import { X, Upload, Leaf, Sparkles } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';

const AddItemsPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    subcategory: '',
    price: '',
    quantity: '',
    description: '',
    KeyIngredients: '' // Changed to match backend expectation
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Normal SweetAlert2 notification system
  const showNotification = (type, title, message) => {
    Swal.fire({
      icon: type,
      title: title,
      text: message
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Product name is required';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.subcategory) newErrors.subcategory = 'Please select a subcategory';
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) newErrors.price = 'Price must be greater than 0';
    if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) newErrors.quantity = 'Quantity cannot be negative';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (images.length === 0) newErrors.images = 'At least one image is required';

    // Validate images
    images.forEach((img, index) => {
      if (!img.file || !(img.file instanceof File)) {
        newErrors.images = `Image ${index + 1} is not a valid file`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validImages = files.filter(file => {
      const isValidType = ['image/png', 'image/jpeg'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    const newImages = validImages.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random()
    }));

    setImages(prev => [...prev, ...newImages].slice(0, 5));
    if (errors.images) setErrors(prev => ({ ...prev, images: '' }));
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
    showNotification('success', 'Image Removed', 'Product image has been removed successfully.');
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showNotification('error', 'Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for API submission
      const formDataForSubmit = new FormData();
      formDataForSubmit.append('title', formData.title.trim());
      formDataForSubmit.append('category', formData.category);
      formDataForSubmit.append('subcategory', formData.subcategory);
      formDataForSubmit.append('description', formData.description.trim());
      formDataForSubmit.append('price', formData.price.toString());
      formDataForSubmit.append('quantity', formData.quantity.toString());
      formDataForSubmit.append('KeyIngredients', formData.KeyIngredients.trim());

      // Append images
      images.forEach((img, index) => {
        formDataForSubmit.append('images', img.file, img.file.name);
      });

      // Make actual API call
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/product/add`,
        formDataForSubmit, 
        {
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token'), 
          }
        }
      );
      
      const result = response.data;

      if (!result) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }


      // Success notification
      showNotification('success', 'Product Added Successfully!', 'Your agricultural product has been added to the inventory.');

      // Reset form
      setFormData({
        title: '',
        category: '',
        subcategory: '',
        price: '',
        quantity: '',
        description: '',
        KeyIngredients: ''
      });
      setImages([]);
      setErrors({});

    } catch (error) {
      console.error('Error adding product:', error);

      let errorMessage = 'Something went wrong while adding your product. Please try again.';

      // Error notification
      showNotification('error', 'Failed to Add Product', errorMessage);

      setErrors(prev => ({
        ...prev,
        submit: errorMessage
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cool and Simple Loader Component
  const CoolSimpleLoader = () => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-green-100 p-8 max-w-sm mx-4">
        {/* Central Animation */}
        <div className="flex flex-col items-center">
          {/* Rotating Leaf with Gentle Glow */}
          <div className="relative mb-6">
            <div className="animate-spin duration-3000">
              <Leaf size={64} className="text-green-500" />
            </div>

            {/* Subtle Sparkle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={32} className="text-yellow-400 animate-pulse" />
            </div>

            {/* Gentle Pulsing Ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 border-2 border-green-200 rounded-full animate-ping opacity-40"></div>
            </div>
          </div>

          {/* Simple Progress Bar */}
          <div className="w-48 h-1 bg-green-100 rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
          </div>

          {/* Loading Text */}
          <div className="text-center">
            <p className="text-lg font-semibold text-green-700 mb-1">
              Adding Product
            </p>
            <p className="text-green-600 text-sm">
              Please wait...
            </p>
          </div>

          {/* Animated Dots */}
          <div className="flex space-x-1 mt-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '0.8s'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div id='additem' className=" min-h-screen   bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto  px-4 py-6 max-w-4xl">
        {/* Header - Mobile Optimized */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-green-800 mb-2 px-2">
            🌿 Shree Venkatesawra Agros and Herbs 🌿
          </h1>
          <p className="text-green-600 text-sm md:text-base">Add New Agricultural Product</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-green-200 overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-6">
              {/* Form Fields - Mobile First Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Product Name */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter product name"
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>

                {/* Category */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="e.g., Seeds, Fertilizers, Tools"
                  />
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>

                {/* Subcategory */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Subcategory *
                  </label>
                  <input
                    type="text"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="e.g., Vegetable Seeds, Organic Fertilizer"
                  />
                  {errors.subcategory && <p className="text-red-500 text-xs mt-1">{errors.subcategory}</p>}
                </div>

                {/* Price */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter price"
                    min="0.01"
                    step="0.01"
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>

                {/* Quantity */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter stock quantity"
                    min="0"
                    step="1"
                  />
                  {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                </div>

                {/* Key Ingredients */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Key Ingredients
                  </label>
                  <input
                    type="text"
                    name="KeyIngredients"
                    value={formData.KeyIngredients}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="e.g., Neem, Turmeric, Organic Matter"
                  />
                </div>
              </div>

              {/* Description - Full Width */}
              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                  placeholder="Enter detailed product description, benefits, and usage instructions"
                ></textarea>
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              {/* Images - Mobile Optimized */}
              <div>
                <label className="block text-sm font-medium text-green-700 mb-3">
                  Product Images * (Max 5)
                </label>

                {/* Image Preview Grid - Responsive */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                    {images.map((img) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.preview}
                          alt="Preview"
                          className="h-20 sm:h-24 w-full object-cover rounded-lg border-2 border-green-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-80 hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Area */}
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-green-300 rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:bg-green-50 transition-colors min-h-[120px]">
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={images.length >= 5}
                  />
                  <Upload className="h-10 w-10 text-green-400 mb-3" />
                  <span className="text-sm text-green-600 font-medium">
                    {images.length >= 5 ? 'Maximum of 5 images reached' : 'Click to upload product images'}
                  </span>
                  <p className="text-xs text-green-500 mt-1">
                    PNG, JPEG up to 5MB each
                  </p>
                </label>
                {errors.images && <p className="text-red-500 text-xs mt-2">{errors.images}</p>}
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button - Mobile Optimized */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full sm:w-auto sm:min-w-[200px] px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 font-medium transition-all duration-200 text-base sm:ml-auto sm:block disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <Leaf className="animate-spin mr-2" size={20} />
                      Adding Product...
                    </span>
                  ) : (
                    '🌿 Add Product'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cool Simple Loader */}
      {isSubmitting && <CoolSimpleLoader />}
    </div>
  );
};

export default AddItemsPage;
