import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Mail, MapPin, Camera, Lock, ExternalLink } from 'lucide-react';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F5F7FA] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[800px] mx-auto bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                {/* Header Section */}
                <div className="p-6 sm:p-10 border-b border-gray-50 bg-white">
                    <button 
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back to Login</span>
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 p-1">
                            <img src="/logo.png" alt="KT Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1A1A1A]">
                                Privacy Policy
                            </h1>
                            <p className="text-blue-600 font-semibold tracking-wide text-sm uppercase">
                                KhushiTech
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6 sm:p-10 space-y-10">
                    {/* Introduction Section */}
                    <div className="animate-reveal">
                        <p className="text-[#4B5563] leading-relaxed text-[16px] font-medium italic">
                            This Privacy Policy applies to KhushiTech and explains how user data is collected, used, and protected within the application.
                        </p>
                    </div>

                    <section className="animate-reveal">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck className="w-5 h-5 text-blue-500" />
                            <h2 className="text-xl font-bold text-[#1A1A1A]">1. Information We Collect</h2>
                        </div>
                        <p className="text-[#4B5563] leading-relaxed text-[15px]">
                            We collect user data such as name, email, and project-related information. We may also collect images and location data when users upload updates or queries.
                        </p>
                    </section>

                    <section className="animate-reveal" style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <ExternalLink className="w-5 h-5 text-blue-500" />
                            <h2 className="text-xl font-bold text-[#1A1A1A]">2. How We Use Information</h2>
                        </div>
                        <p className="text-[#4B5563] leading-relaxed text-[15px]">
                            We use collected data to manage projects, provide updates, verify activities, and improve the platform experience.
                        </p>
                    </section>

                    <section className="animate-reveal" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <Camera className="w-5 h-5 text-blue-500" />
                            <h2 className="text-xl font-bold text-[#1A1A1A]">3. Camera and Location Usage</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-2xl">
                                <Camera className="w-5 h-5 text-gray-400 mt-1" />
                                <p className="text-[#4B5563] text-[15px]">
                                    <span className="font-bold text-gray-700">Camera:</span> Used to capture project-related images for verification and progress updates.
                                </p>
                            </div>
                            <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-2xl">
                                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                                <p className="text-[#4B5563] text-[15px]">
                                    <span className="font-bold text-gray-700">Location:</span> Used to attach accurate site information to updates and queries to ensure data integrity.
                                </p>
                            </div>
                            <p className="text-[#6B7280] text-sm italic pl-4">
                                This data is only used within the platform and not shared externally.
                            </p>
                        </div>
                    </section>

                    <section className="animate-reveal" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="w-5 h-5 text-blue-500" />
                            <h2 className="text-xl font-bold text-[#1A1A1A]">4. Data Security</h2>
                        </div>
                        <p className="text-[#4B5563] leading-relaxed text-[15px]">
                            We take reasonable steps to protect user data and ensure secure access through encryption and industry-standard security protocols.
                        </p>
                    </section>

                    <section className="animate-reveal" style={{ animationDelay: '0.4s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <UsersIcon className="w-5 h-5 text-blue-500" />
                            <h2 className="text-xl font-bold text-[#1A1A1A]">5. Third-Party Services</h2>
                        </div>
                        <p className="text-[#4B5563] leading-relaxed text-[15px]">
                            We may use secure third-party services for storage, authentication (such as Google OAuth), and email communication to provide a reliable service.
                        </p>
                    </section>

                </div>

                {/* Footer section */}
                <div className="p-6 bg-gray-50 text-center border-t border-gray-100">
                    <p className="text-gray-400 text-xs font-medium">
                        © {new Date().getFullYear()} Khushi Technology. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

// Helper component for Users icon
const UsersIcon = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export default PrivacyPolicy;
