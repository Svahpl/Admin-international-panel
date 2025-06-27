import React, { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, Search, Trash2, Edit, Image, ChevronLeft, ChevronRight, X, Filter, Download } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';

const ProductManagementPage = () => {
  const [products, setProducts] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [activeImageIndexes, setActiveImageIndexes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // State for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [imagePreviewIndex, setImagePreviewIndex] = useState(0);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  // Leaf Loader Component
  const LeafLoader = ({ message = "🌱 Processing..." }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-xl text-center max-w-sm mx-4">
        <div className="relative mb-4">
          <div className="flex justify-center space-x-2 mb-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 bg-green-500 rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
          <div className="text-6xl animate-pulse mb-2">🌿</div>
          <div className="absolute inset-0 flex justify-center items-center">
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin opacity-30"></div>
          </div>
        </div>
        <p className="text-gray-700 font-medium">{message}</p>
        <div className="mt-2 text-sm text-green-600">Shree Venkatesawra Agros</div>
      </div>
    </div>
  );

  // Get unique categories for the filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(product => product.category))];
    return uniqueCategories.sort();
  }, [products]);

  const storedToken = localStorage.getItem("token");

  // Fetch products from the API
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/product/get-all`,{
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      });
      console.log('API Response:', response.data);

      let productData = [];
      if (Array.isArray(response.data)) {
        productData = response.data;
      }
      else if (response.data && Array.isArray(response.data.data)) {
        productData = response.data.data;
      }
      else if (response.data && response.data.products && Array.isArray(response.data.products)) {
        productData = response.data.products;
      }

      const processedProducts = productData.map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images : [],
        sizes: Array.isArray(product.sizes) ? product.sizes : []
      }));

      setProducts(processedProducts);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
      setIsLoading(false);
    }
  };

  // Delete product function with SweetAlert2
  const deleteProduct = async (id) => {
    try {
      const result = await Swal.fire({
        title: '🌿 Delete Product?',
        text: "This action cannot be undone!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#16a34a',
        confirmButtonText: '🗑️ Yes, Delete',
        cancelButtonText: '🌱 Cancel',
        customClass: {
          popup: 'swal2-popup',
          title: 'swal2-title',
          content: 'swal2-content'
        },
        background: '#fefefe',
        backdrop: 'rgba(0,0,0,0.4)'
      });

      if (!result.isConfirmed) return;

      setIsDeleting(id);

      // Show deleting progress
      Swal.fire({
        title: '🌱 Deleting Product...',
        html: 'Please wait while we remove the product from inventory',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/product/delete-product/${id}`,{
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      });

      setProducts(prevProducts => prevProducts.filter(product =>
        (product._id !== id && product.id !== id)
      ));

      await Swal.fire({
        title: '🌿 Success!',
        text: 'Product deleted successfully!',
        icon: 'success',
        confirmButtonColor: '#16a34a',
        confirmButtonText: '✨ Great!'
      });

    } catch (error) {
      console.error('Error deleting product:', error);
      await Swal.fire({
        title: '❌ Error!',
        text: 'Failed to delete product. Please try again.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: '🔄 Try Again'
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle image selection for preview
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setProductImages(files);

      const newPreviewUrls = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviewUrls.push(reader.result);
          if (newPreviewUrls.length === files.length) {
            setImagePreviewUrls(newPreviewUrls);
            setImagePreview(newPreviewUrls[0]);
            setImagePreviewIndex(0);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Navigation between image previews
  const handlePrevPreviewImage = () => {
    if (imagePreviewUrls.length <= 1) return;
    const newIndex = (imagePreviewIndex - 1 + imagePreviewUrls.length) % imagePreviewUrls.length;
    setImagePreviewIndex(newIndex);
    setImagePreview(imagePreviewUrls[newIndex]);
  };

  const handleNextPreviewImage = () => {
    if (imagePreviewUrls.length <= 1) return;
    const newIndex = (imagePreviewIndex + 1) % imagePreviewUrls.length;
    setImagePreviewIndex(newIndex);
    setImagePreview(imagePreviewUrls[newIndex]);
  };

  // Update product with proper API and SweetAlert2
  const updateProduct = async () => {
    setIsUpdating(true);
    setUpdateError(null);

    try {
      const productId = editingProduct.id || editingProduct._id;

      // Prepare form data for the API
      const formData = new FormData();
      formData.append('title', editingProduct.title);
      formData.append('description', editingProduct.description || '');
      formData.append('price', parseFloat(editingProduct.price));
      formData.append('category', editingProduct.category);
      formData.append('subcategory', editingProduct.subcategory || '');
      formData.append('KeyIngredients', editingProduct.KeyIngredients || '');
      formData.append('quantity', parseInt(editingProduct.quantity, 10) || 0);

      // Add new images if selected
      if (productImages.length > 0) {
        productImages.forEach((image, index) => {
          formData.append('images', image);
        });
      }

      // Call the update API
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/product/update-product/${productId}`,
        formData,
        {
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
        }
      );

      // Update local state with the response data
      setProducts(prevProducts =>
        prevProducts.map(product => {
          if ((product._id === productId) || (product.id === productId)) {
            return {
              ...product,
              ...response.data.product, // Use the updated product from API response
              lastUpdated: new Date()
            };
          }
          return product;
        })
      );

      await Swal.fire({
        title: '🌿 Success!',
        text: 'Product updated successfully!',
        icon: 'success',
        confirmButtonColor: '#16a34a',
        confirmButtonText: '✨ Awesome!'
      });

      setShowEditModal(false);
      setEditingProduct(null);
      setProductImages([]);
      setImagePreview(null);
      setImagePreviewUrls([]);
    } catch (error) {
      console.error('Error updating product:', error);
      setUpdateError('Failed to update product. Please try again.');

      await Swal.fire({
        title: '❌ Update Failed!',
        text: 'Something went wrong while updating the product.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: '🔄 Try Again'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Initialize active image indexes
  useEffect(() => {
    const initialIndexes = {};
    products.forEach(product => {
      initialIndexes[product.id || product._id] = 0;
    });
    setActiveImageIndexes(initialIndexes);
  }, [products]);

  // Handle edit modal opening
  const handleEditProduct = (productId) => {
    const product = products.find(p => p.id === productId || p._id === productId);
    if (product) {
      setEditingProduct({ ...product });
      if (product.images && product.images.length > 0) {
        setImagePreviewUrls(product.images);
        setImagePreview(product.images[0]);
        setImagePreviewIndex(0);
      } else {
        setImagePreviewUrls([]);
        setImagePreview(null);
      }
      setProductImages([]);
      setShowEditModal(true);
    }
  };

  // Handle input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Sorting and filtering logic
  const sortedAndFilteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm) {
      result = result.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory !== 'all') {
      result = result.filter(product => product.category === filterCategory);
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [products, sortConfig, searchTerm, filterCategory]);

  // Image navigation functions
  const handlePrevImage = (productId, e) => {
    if (e) e.preventDefault();
    const product = products.find(p => p.id === productId || p._id === productId);
    if (!product || !Array.isArray(product.images) || product.images.length <= 1) return;

    setActiveImageIndexes(prev => {
      const currentIndex = prev[productId] || 0;
      const imageCount = product.images.length;
      const newIndex = (currentIndex - 1 + imageCount) % imageCount;
      return { ...prev, [productId]: newIndex };
    });
  };

  const handleNextImage = (productId, e) => {
    if (e) e.preventDefault();
    const product = products.find(p => p.id === productId || p._id === productId);
    if (!product || !Array.isArray(product.images) || product.images.length <= 1) return;

    setActiveImageIndexes(prev => {
      const currentIndex = prev[productId] || 0;
      const imageCount = product.images.length;
      const newIndex = (currentIndex + 1) % imageCount;
      return { ...prev, [productId]: newIndex };
    });
  };

  // Export report function
  const exportReport = async () => {
    try {
      const result = await Swal.fire({
        title: '📊 Export Report?',
        text: 'Download product inventory as CSV file?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '📥 Download',
        cancelButtonText: '❌ Cancel'
      });

      if (!result.isConfirmed) return;

      const csv = [
        ['Name', 'Price', 'Category', 'Subcategory', 'Key Ingredients', 'Quantity', 'Last Updated'],
        ...products.map(product => [
          product.title,
          product.price,
          product.category || '',
          product.subcategory || '',
          product.KeyIngredients || '',
          product.quantity || '0',
          product.lastUpdated
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shree-vankatesawra-product-inventory.csv';
      a.click();

      await Swal.fire({
        title: '✅ Success!',
        text: 'Report downloaded successfully!',
        icon: 'success',
        confirmButtonColor: '#16a34a',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      await Swal.fire({
        title: '❌ Error!',
        text: 'Failed to export report.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  return (
    <div id='stock' className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* Leaf Loader */}
      {isUpdating && <LeafLoader message="🌿 Updating product..." />}

      {/* Dashboard Header with Agricultural Theme */}
      <div className="flex flex-col space-y-4 mb-4 sm:mb-6">
        <div className="bg-gradient-to-r from-green-800 to-emerald-700 rounded-lg shadow-xl p-3 sm:p-6 mb-3 sm:mb-4">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl mb-2">🌿 🌱 🌾</div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-wide">
              SHREE VANKATESAWRA AGROS & HERBS
            </h1>
            <p className="text-green-100 text-sm sm:text-base mt-1">Product Management System</p>
            <div className="w-16 sm:w-24 h-1 bg-yellow-400 mx-auto mt-2 rounded-full"></div>
          </div>
        </div>

        {/* Search Controls */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          <div className="relative flex flex-col sm:col-span-2">
            <div className="flex w-full">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search agricultural products..."
                  className="pl-10 pr-4 py-2 border rounded-l-md w-full focus:ring-2 focus:ring-green-300 focus:border-green-300 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 transition duration-150"
                onClick={() => console.log('Searching for:', searchTerm)}
              >
                🔍
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-2 sm:col-span-1 lg:col-span-2">
            <div className="relative w-full sm:w-auto">
              <button
                className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition duration-150 flex items-center justify-center w-full sm:w-auto"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <Filter size={16} className="mr-2" />
                <span className="truncate">{filterCategory === 'all' ? 'All Categories' : filterCategory}</span>
              </button>

              {showFilterDropdown && (
                <div className="absolute z-10 mt-1 w-full sm:w-48 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                  <div className="py-1">
                    <button
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterCategory === 'all' ? 'bg-green-50 text-green-700 font-medium' : ''}`}
                      onClick={() => {
                        setFilterCategory('all');
                        setShowFilterDropdown(false);
                      }}
                    >
                      All Categories
                    </button>
                    {categories.map(category => (
                      <button
                        key={category}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterCategory === category ? 'bg-green-50 text-green-700 font-medium' : ''}`}
                        onClick={() => {
                          setFilterCategory(category);
                          setShowFilterDropdown(false);
                        }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-150 flex items-center justify-center w-full sm:w-auto"
              onClick={exportReport}
            >
              <Download size={16} className="mr-2" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">📊 Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-bounce">🌱</div>
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-green-600">Loading products...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-lg text-center">
          <AlertTriangle size={32} className="mx-auto mb-2" />
          <p>{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150"
            onClick={fetchProducts}
          >
            🔄 Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {sortedAndFilteredProducts.length > 0 ? sortedAndFilteredProducts.map(product => {
            const productId = product.id || product._id;
            const activeImageIndex = activeImageIndexes[productId] || 0;
            const hasImages = Array.isArray(product.images) && product.images.length > 0;
            const activeImage = hasImages ? product.images[activeImageIndex] : null;

            return (
              <div key={productId} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transform transition-transform duration-200 hover:shadow-xl hover:scale-102 border-t-4 border-green-500">
                <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-b from-green-50 to-gray-100">
                  {activeImage ? (
                    <div className="h-full w-full">
                      <img
                        src={activeImage}
                        alt={`${product.title || 'Agricultural Product'}`}
                        className="w-full h-full object-cover"
                      />

                      {Array.isArray(product.images) && product.images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => handlePrevImage(productId, e)}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 sm:p-2 hover:bg-gray-100 transition duration-150 shadow-md z-10"
                          >
                            <ChevronLeft size={16} className="sm:hidden" />
                            <ChevronLeft size={20} className="hidden sm:block" />
                          </button>
                          <button
                            onClick={(e) => handleNextImage(productId, e)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 sm:p-2 hover:bg-gray-100 transition duration-150 shadow-md z-10"
                          >
                            <ChevronRight size={16} className="sm:hidden" />
                            <ChevronRight size={20} className="hidden sm:block" />
                          </button>

                          <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1 sm:space-x-2">
                            {product.images.map((_, index) => (
                              <button
                                key={index}
                                className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full transition-colors duration-200 ${index === activeImageIndex ? 'bg-green-600' : 'bg-gray-300 hover:bg-gray-400'}`}
                                onClick={() => setActiveImageIndexes(prev => ({ ...prev, [productId]: index }))}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🌿</div>
                        <Image size={32} className="text-gray-400 mx-auto sm:hidden" />
                        <Image size={48} className="text-gray-400 mx-auto hidden sm:block" />
                        <p className="text-gray-400 mt-2 text-sm sm:text-base">No images</p>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-2 right-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded-full font-semibold shadow-sm">
                      🌱 {product.category || 'Agro Product'}
                    </span>
                  </div>
                </div>

                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h2 className="text-base sm:text-lg font-semibold mb-1 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent line-clamp-1">
                        {product.title}
                      </h2>
                      <div className="text-base sm:text-lg font-bold text-green-600 ml-2 flex-shrink-0">
                        ${product.price?.toFixed(2) || '0.00'}
                      </div>
                    </div>

                    <div className="mb-2 sm:mb-3">
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                        {product.description || 'Premium agricultural product'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2 text-xs sm:text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Qty:</span>
                        <p className="font-semibold">{product.quantity || 0}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Subcategory:</span>
                        <p className="truncate">{product.subcategory || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-gray-500">Key Ingredients:</span>
                        <p className="truncate">{product.KeyIngredients || 'Natural'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-3 sm:mt-4">
                    <button
                      className="flex items-center justify-center px-2 sm:px-3 py-1.5 border border-green-600 text-green-600 rounded hover:bg-green-50 text-xs sm:text-sm w-1/2 mr-2 transition duration-150"
                      onClick={() => handleEditProduct(productId)}
                      disabled={isDeleting === productId}
                    >
                      <Edit size={14} className="mr-1" />
                      ✏️ Edit
                    </button>
                    <button
                      className={`flex items-center justify-center px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm w-1/2 transition duration-150 ${isDeleting === productId
                          ? 'bg-red-400 text-white cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      onClick={() => deleteProduct(productId)}
                      disabled={isDeleting === productId}
                    >
                      {isDeleting === productId ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          Deleting...
                        </div>
                      ) : (
                        <>
                          <Trash2 size={14} className="mr-1" />
                          🗑️ Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🌾</div>
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-green-800 flex items-center">
                  🌿 Edit Product
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                    setProductImages([]);
                    setImagePreview(null);
                    setImagePreviewUrls([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition duration-150"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {updateError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  <AlertTriangle size={16} className="inline mr-2" />
                  {updateError}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Product Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🏷️ Product Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={editingProduct.title || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-300 focus:border-green-300 outline-none"
                      placeholder="Enter product title..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📝 Description
                    </label>
                    <textarea
                      name="description"
                      value={editingProduct.description || ''}
                      onChange={handleEditInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-300 focus:border-green-300 outline-none resize-none"
                      placeholder="Enter product description..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        💰 Price ($) *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={editingProduct.price || ''}
                        onChange={handleEditInputChange}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-300 focus:border-green-300 outline-none"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📦 Quantity
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={editingProduct.quantity || ''}
                        onChange={handleEditInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-300 focus:border-green-300 outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🌱 Category *
                      </label>
                      <select
                        name="category"
                        value={editingProduct.category || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-300 focus:border-green-300 outline-none"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📋 Subcategory
                      </label>
                      <input
                        type="text"
                        name="subcategory"
                        value={editingProduct.subcategory || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-300 focus:border-green-300 outline-none"
                        placeholder="Enter subcategory..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🧪 Key Ingredients
                    </label>
                    <input
                      type="text"
                      name="KeyIngredients"
                      value={editingProduct.KeyIngredients || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-300 focus:border-green-300 outline-none"
                      placeholder="Enter key ingredients..."
                    />
                  </div>
                </div>

                {/* Right Column - Image Management */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📸 Product Images
                    </label>

                    {/* Current/Preview Images */}
                    {(imagePreviewUrls.length > 0 || imagePreview) && (
                      <div className="mb-4">
                        <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '200px' }}>
                          <img
                            src={imagePreview || imagePreviewUrls[imagePreviewIndex]}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                          />

                          {imagePreviewUrls.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={handlePrevPreviewImage}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 hover:bg-gray-100 transition duration-150 shadow-md"
                              >
                                <ChevronLeft size={20} />
                              </button>
                              <button
                                type="button"
                                onClick={handleNextPreviewImage}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 hover:bg-gray-100 transition duration-150 shadow-md"
                              >
                                <ChevronRight size={20} />
                              </button>

                              <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                                {imagePreviewUrls.map((_, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    className={`h-3 w-3 rounded-full transition-colors duration-200 ${index === imagePreviewIndex
                                        ? 'bg-green-600'
                                        : 'bg-gray-300 hover:bg-gray-400'
                                      }`}
                                    onClick={() => {
                                      setImagePreviewIndex(index);
                                      setImagePreview(imagePreviewUrls[index]);
                                    }}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* File Input */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-300 transition duration-150">
                      <input
                        type="file"
                        id="product-images"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="product-images"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Image size={48} className="text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          Click to upload new images
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          PNG, JPG, JPEG up to 10MB each
                        </span>
                      </label>
                    </div>

                    {productImages.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-700 font-medium">
                          📁 {productImages.length} new image(s) selected
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          These will replace existing images when you save
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                    setProductImages([]);
                    setImagePreview(null);
                    setImagePreviewUrls([]);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-150 w-full sm:w-auto"
                  disabled={isUpdating}
                >
                  ❌ Cancel
                </button>
                <button
                  type="button"
                  onClick={updateProduct}
                  disabled={isUpdating || !editingProduct.title || !editingProduct.price || !editingProduct.category}
                  className={`px-6 py-2 rounded-md transition duration-150 w-full sm:w-auto ${isUpdating || !editingProduct.title || !editingProduct.price || !editingProduct.category
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                  {isUpdating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    '💾 Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagementPage;

