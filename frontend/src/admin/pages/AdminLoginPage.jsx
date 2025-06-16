import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "../pages/page.css"
import { Link } from "react-router-dom";

const AdminLoginPage = () => {
    const navigate = useNavigate();

    // Add fallback for backend URL
    const backendUrl = import.meta.env.VITE_BACKEND || 'http://localhost:5000';

    // Debug: Log environment variables
    console.log("All env vars:", import.meta.env);
    console.log("VITE_BACKEND:", import.meta.env.VITE_BACKEND);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginLoading(true);

        // Clean the backend URL and ensure proper format
        const cleanBackendUrl = backendUrl?.replace(/\/+$/, ''); // Remove trailing slashes
        const loginUrl = `${cleanBackendUrl}/api/auth/login`;

        console.log("Backend URL:", backendUrl);
        console.log("Clean Backend URL:", cleanBackendUrl);
        console.log("Login URL:", loginUrl);
        console.log("Sending data:", { Email: email, Password: password });

        try {
            // First, let's try a simple GET request to check if the backend is accessible
            console.log("Testing backend connectivity...");

            // Try the request with lowercase field names first
            let res;
            try {
                res = await axios.post(
                    loginUrl,
                    {
                        email: email,        // Try lowercase field names
                        password: password   // Try lowercase field names
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        timeout: 30000,
                        withCredentials: false
                    }
                );
            } catch (firstError) {
                console.log("First attempt (lowercase) failed, trying uppercase...");
                // If lowercase fails, try uppercase field names
                res = await axios.post(
                    loginUrl,
                    {
                        Email: email,        // Try uppercase field names
                        Password: password   // Try uppercase field names
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        timeout: 30000,
                        withCredentials: false
                    }
                );
            }

            if (res.status === 200) {
                toast.success("Login Successful!");

                // Store data in localStorage
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("userId", res.data.userId);
                localStorage.setItem("isAdmin", res.data.isAdmin);

                console.log("Token stored:", localStorage.getItem("token"));
                console.log("Response data:", res.data);

                // Navigate based on admin status
                if (res.data.isAdmin === "true" || res.data.isAdmin === true) {
                    navigate("/admin-dashboard");
                } else {
                    navigate("/");
                }
            }

        } catch (error) {
            console.error("Full error object:", error);

            if (error.response) {
                // Server responded with error status
                const status = error.response.status;
                const message = error.response.data?.msg || error.response.data?.message || "Server error";

                console.log("Error response:", error.response.data);

                if (status === 400) {
                    toast.error(message || "Bad request - please check your input");
                } else if (status === 401) {
                    toast.error(message || "Invalid credentials");
                } else if (status === 404) {
                    toast.error("Login endpoint not found - check your backend URL");
                } else if (status === 502 || status === 503) {
                    toast.error("Backend server is temporarily unavailable");
                } else if (status === 500) {
                    toast.error("Internal server error");
                } else {
                    toast.error(`Server error: ${status} - ${message}`);
                }
            } else if (error.request) {
                // Network error - no response received
                console.log("Network error:", error.request);
                toast.error("Cannot connect to server. Please check if the backend is running.");
            } else if (error.code === 'ECONNABORTED') {
                // Timeout error
                toast.error("Request timeout. Please try again.");
            } else {
                // Other errors
                console.log("Other error:", error.message);
                toast.error("An unexpected error occurred!");
            }
        } finally {
            setLoginLoading(false);
        }
    };

    return (
        <div id="login" className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
            <ToastContainer position="top-center" autoClose={3000} />
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 m-4">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-green-800 mb-1">
                        Shree Venkateswara
                    </h1>
                    <h2 className="text-xl font-semibold text-green-700 mb-3">
                        Agros and Herbs
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Access premium agricultural products and herbal solutions
                    </p>
                </div>

                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
                        <strong>Debug:</strong> Backend URL: {backendUrl}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label
                            htmlFor="email"
                            className="block text-gray-700 font-medium mb-2"
                        >
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-5">
                        <label
                            htmlFor="password"
                            className="block text-gray-700 font-medium mb-2"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <Link
                            to="/password-auth"
                            className="text-green-600 text-sm font-medium hover:text-green-700 hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-700 text-white py-3 rounded-md font-medium uppercase tracking-wide hover:bg-green-800 transition duration-200 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loginLoading || googleLoading}
                    >
                        {loginLoading ? "Processing..." : "Login"}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <span className="text-gray-600 text-sm">
                        Don't have an account?
                    </span>
                    <Link
                        to="/signup"
                        className="text-green-600 text-sm font-medium ml-1 hover:text-green-700 hover:underline"
                    >
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;