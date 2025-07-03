import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "../pages/page.css"
import { Link } from "react-router-dom";
const AdminSignupPage = () => {
    const navigate = useNavigate();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [signupLoading, setSignupLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if passwords match
        if (password !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        setSignupLoading(true);

        // Use environment variable for signup URL
        const signupUrl = `${import.meta.env.VITE_BACKEND_URL}/api/auth/adminSignup`;

        console.log("Backend URL:", backendUrl);
        console.log("Signup URL:", signupUrl);
        console.log("Sending data:", { FullName: fullName, Email: email, Password: password });

        try {
            const res = await axios.post(
                signupUrl,
                {
                    FullName: fullName,    // Match backend expectation
                    Email: email,          // Match backend expectation
                    Password: password     // Match backend expectation
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.status === 200) {
                toast.success("Signup Successful! Please login to continue.");

                // Clear form fields
                setFullName("");
                setEmail("");
                setPassword("");
                setConfirmPassword("");

                    navigate("/adminlogin");

            }

        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data.msg || error.response.data.message;

                if (status === 400) {
                    toast.error(message || "User already exists or invalid data");
                } else {
                    toast.error("Something went wrong!");
                }
            } else if (error.request) {
                toast.error("Network error. Please check your connection.");
            } else {
                toast.error("Internal Server Error!");
            }
            console.log(`Error during signup: ${error}`);
        } finally {
            setSignupLoading(false);
        }
    };

    return (
        <div id="stock"  className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
            <ToastContainer position="top-center" autoClose={3000} />
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 m-4">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-green-800 mb-1">
                        Sri Venkateswara
                    </h1>
                    <h2 className="text-xl font-semibold text-green-700 mb-3">
                        Agros and Herbs
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Create your account to access premium agricultural products
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label
                            htmlFor="fullName"
                            className="block text-gray-700 font-medium mb-2"
                        >
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-4">
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

                    <div className="mb-4">
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
                            minLength="6"
                        />
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="confirmPassword"
                            className="block text-gray-700 font-medium mb-2"
                        >
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength="6"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-700 text-white py-3 rounded-md font-medium uppercase tracking-wide hover:bg-green-800 transition duration-200 flex justify-center items-center"
                        disabled={signupLoading}
                    >
                        {signupLoading ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <span className="text-gray-600 text-sm">
                        Already have an account?
                    </span>
                    <Link
                        to="/adminlogin"
                        className="text-green-600 text-sm font-medium ml-1 hover:text-green-700 hover:underline"
                    >
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminSignupPage;
