import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Header from "../components/Header";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const PasswordAuth = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isPasswordReset, setIsPasswordReset] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [error, setError] = useState("");
    const inputRefs = useRef([]);
    const navigate = useNavigate();

    // Create axios instance with timeout and common headers
    const axiosInstance = axios.create({
        timeout: 10000, 
        headers: {
            'Content-Type': 'application/json'
        }
    });

    // Get backend URL from environment variables
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

    // Check if backend URL is configured properly
    useEffect(() => {
        if (!backendUrl) {
            console.error("Backend URL environment variable is missing");
            toast.warning("Application configuration incomplete. Some features may not work properly.");
        }
    }, [backendUrl]);

    // Handle countdown timer for OTP resend
    useEffect(() => {
        let interval = null;
        if (isOtpSent && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timer, isOtpSent]);

    // Handle network errors consistently
    const handleNetworkError = (error, defaultMessage = "An error occurred") => {
        console.error("API Error:", error);

        // Check if it's a network connectivity issue
        if (error.message === "Network Error" || !error.response) {
            setError("Network error. Please check your internet connection and try again.");
            toast.error("Network error. Please check your internet connection and try again.");
            return;
        }

        // Handle timeout errors
        if (error.code === "ECONNABORTED") {
            setError("Request timed out. Server may be experiencing issues.");
            toast.error("Request timed out. Server may be experiencing issues.");
            return;
        }

        // Handle server errors
        if (error.response) {
            // Get specific error message from API if available
            const errorMessage = error.response.data?.message ||
                (error.response.status === 500 ? "Server error. Please try again later." : defaultMessage);
            setError(errorMessage);
            toast.error(errorMessage);
            return;
        }

        // Fallback for any other errors
        setError(defaultMessage);
        toast.error(defaultMessage);
    };

    // Check prerequisites before making API calls
    const checkPrerequisites = () => {
        if (!backendUrl) {
            toast.error("Application configuration error. Please contact support.");
            return false;
        }
        return true;
    };

    const handleSendOtp = async () => {
        if (!email || !email.includes("@")) {
            toast.error("Please enter a valid email");
            return;
        }

        if (!checkPrerequisites()) return;

        setIsLoading(true);
        setError("");

        try {
            const otpResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/otp-for-password`, { Email : email });

            if (otpResponse && otpResponse.data) {
                setIsOtpSent(true);
                setTimer(30);
                localStorage.setItem("email", email);
                toast.success("OTP sent successfully!");

                if (inputRefs.current[0]) {
                    inputRefs.current[0].focus();
                }
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (error) {
            handleNetworkError(error, "Failed to send OTP. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = () => {
        setOtp(["", "", "", ""]);
        handleSendOtp();
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(0, 1);
        setOtp(newOtp);
        if (value && index < 3 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleSubmitOtp = async () => {
        const otpString = otp.join("");

        if (otpString.length !== 4) {
            toast.error("Please enter all 4 digits");
            return;
        }

        if (!checkPrerequisites()) return;

        setIsLoading(true);
        setError("");

        try {
            const verifyOtpResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-email`, {
                Email : email,
                userOtp: otpString,
            });

            if (verifyOtpResponse && verifyOtpResponse.data) {
                if (verifyOtpResponse.data.success) {
                    setIsVerified(true);
                    toast.success("OTP verified successfully!");
                } else {
                    setError(verifyOtpResponse.data.message || "Invalid OTP. Please try again.");
                    toast.error(verifyOtpResponse.data.message || "Invalid OTP. Please try again.");
                }
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (error) {
            handleNetworkError(error, "Failed to verify OTP. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        // Password validation
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (!checkPrerequisites()) return;

        setIsLoading(true);
        setError("");

        try {
            const resetResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/reset-password`, {
                Email :email,
                newPassword,
            });

            if (resetResponse && resetResponse.data) {
                if (resetResponse.data.success) {
                    setIsPasswordReset(true);
                    toast.success("Password reset successfully!");
                } else {
                    setError(resetResponse.data.message || "Failed to reset password. Please try again.");
                    toast.error(resetResponse.data.message || "Failed to reset password. Please try again.");
                }
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (error) {
            handleNetworkError(error, "Failed to reset password. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    // Component for showing network error with retry button
    const NetworkErrorMessage = ({ message, onRetry, isRetrying }) => (
        <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200 shadow-sm">
            <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold text-red-700">Connection Issue</span>
            </div>
            <p className="text-sm text-red-600 mb-4">{message || "Unable to connect to the server. Please check your internet connection."}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="w-full flex justify-center items-center py-2.5 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm font-medium border border-red-200">
                    {isRetrying ? (
                        <>
                            <span className="inline-block w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin mr-2"></span>
                            Retrying...
                        </>
                    ) : "Retry Connection"}
                </button>
            )}
        </div>
    );

    // Function to retry the current operation
    const handleRetry = () => {
        setError("");
        if (isVerified) {
            handleResetPassword();
        } else if (isOtpSent) {
            handleSubmitOtp();
        } else {
            handleSendOtp();
        }
    };

    // Check if we have a network error
    const hasNetworkError = error.includes("Network error") ||
        error.includes("timed out") ||
        error.includes("connection");

    return (
        <div id="stock" className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
            <Header />
            <main className="flex-1 flex flex-col justify-center items-center py-8 px-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300 border border-green-100 relative overflow-hidden">
                    {/* Header with gradient bar and leaf pattern */}
                    <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>

                    {/* Brand Header */}
                    <div className="text-center mb-8 mt-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white mb-4 shadow-lg">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h1 className="text-lg font-bold text-green-700 mb-1">Shree Vencateswara</h1>
                        <p className="text-sm text-green-600 font-medium">Agros & Herbs</p>

                        <div className="mt-6">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                                {isPasswordReset ? "Password Updated" : isVerified ? "New Password" : isOtpSent ? "Verify Code" : "Reset Password"}
                            </h2>
                            <p className="text-gray-600 text-sm sm:text-base">
                                {isPasswordReset
                                    ? "Your account password has been successfully updated"
                                    : isVerified
                                        ? "Create a secure password for your account"
                                        : isOtpSent
                                            ? "Enter the 4-digit verification code sent to your email"
                                            : "Enter your registered email to receive verification code"}
                            </p>
                        </div>
                    </div>

                    {/* Network Error Display */}
                    {hasNetworkError && (
                        <NetworkErrorMessage
                            message={error}
                            onRetry={handleRetry}
                            isRetrying={isLoading}
                        />
                    )}

                    {/* Email Input Step */}
                    {!isOtpSent && !isVerified && !isPasswordReset && (
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your registered email"
                                    className="w-full px-4 py-3.5 pl-11 rounded-xl border border-gray-300 focus:outline-none focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 text-gray-700"
                                    disabled={isLoading}
                                />
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* Send OTP Button */}
                    {!isOtpSent && !isVerified && !isPasswordReset && (
                        <button
                            onClick={handleSendOtp}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 sm:py-4 rounded-xl font-semibold tracking-wide hover:from-green-600 hover:to-emerald-700 focus:ring-4 focus:ring-green-200 focus:outline-none transition-all duration-300 flex justify-center items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            {isLoading && (
                                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                            )}
                            {isLoading ? "Sending Code..." : "Send Verification Code"}
                        </button>
                    )}

                    {/* OTP Verification Step */}
                    {isOtpSent && !isVerified && (
                        <>
                            <div className="flex justify-center gap-3 mb-6">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        className="w-14 sm:w-16 h-14 sm:h-16 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-3 focus:ring-green-200 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        disabled={isLoading}
                                    />
                                ))}
                            </div>

                            {error && !hasNetworkError && (
                                <div className="text-red-600 text-sm text-center mb-4 bg-red-50 py-3 px-4 rounded-xl border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-between items-center mb-6 text-sm">
                                <span className="text-gray-600">
                                    {timer > 0 ? `Resend code in ${timer}s` : "Didn't receive the code?"}
                                </span>
                                <button
                                    onClick={handleResendOtp}
                                    className={`font-semibold ${timer > 0
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-green-600 hover:text-green-700 hover:underline"
                                        }`}
                                    disabled={timer > 0 || isLoading}
                                >
                                    Resend Code
                                </button>
                            </div>

                            <button
                                onClick={handleSubmitOtp}
                                disabled={otp.join("").length !== 4 || isLoading}
                                className={`w-full py-3.5 sm:py-4 rounded-xl font-semibold tracking-wide transition-all duration-300 flex justify-center items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${otp.join("").length === 4 && !isLoading
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:ring-4 focus:ring-green-200"
                                    : "bg-gray-200 text-gray-500 cursor-not-allowed transform-none shadow-sm"
                                    }`}
                            >
                                {isLoading && (
                                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                )}
                                {isLoading ? "Verifying..." : "Verify Code"}
                            </button>
                        </>
                    )}

                    {/* Password Reset Step */}
                    {isVerified && !isPasswordReset && (
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-semibold text-gray-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="new-password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Create a strong password"
                                        className="w-full px-4 py-3.5 pl-11 rounded-xl border border-gray-300 focus:outline-none focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200"
                                        disabled={isLoading}
                                    />
                                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <p className="text-xs text-gray-500 mt-1.5">Password must be at least 8 characters long</p>
                            </div>

                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm your password"
                                        className="w-full px-4 py-3.5 pl-11 rounded-xl border border-gray-300 focus:outline-none focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200"
                                        disabled={isLoading}
                                    />
                                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>

                            {error && !hasNetworkError && (
                                <div className="text-red-600 text-sm text-center mb-4 bg-red-50 py-3 px-4 rounded-xl border border-red-200">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleResetPassword}
                                disabled={!newPassword || !confirmPassword || isLoading}
                                className={`w-full py-3.5 sm:py-4 rounded-xl font-semibold tracking-wide transition-all duration-300 flex justify-center items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${newPassword && confirmPassword && !isLoading
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:ring-4 focus:ring-green-200"
                                    : "bg-gray-200 text-gray-500 cursor-not-allowed transform-none shadow-sm"
                                    }`}
                            >
                                {isLoading && (
                                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                )}
                                {isLoading ? "Updating Password..." : "Update Password"}
                            </button>
                        </div>
                    )}

                    {/* Success Step */}
                    {isPasswordReset && (
                        <div className="mt-4 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 text-green-600 mb-6 shadow-lg">
                                <svg
                                    className="w-10 h-10"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">Password Updated Successfully!</h3>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                Your password has been reset successfully. You can now access your Shree Vencateswara Agros & Herbs account with your new password.
                            </p>
                            <button
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                onClick={() => navigate("/adminlogin")}
                            >
                                Continue to Login
                            </button>
                        </div>
                    )}

                    {/* Decorative elements */}
                    <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full opacity-20"></div>
                    <div className="absolute -top-2 -left-2 w-16 h-16 bg-gradient-to-br from-teal-200 to-green-200 rounded-full opacity-20"></div>
                </div>
            </main>
        </div>
    );
};

export default PasswordAuth;