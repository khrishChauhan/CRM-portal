import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ImageViewer = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const imageUrl = location.state?.imageUrl;

    // Strict scroll disable
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    // Safety redirect
    useEffect(() => {
        if (!imageUrl) {
            navigate(-1, { replace: true });
        }
    }, [imageUrl, navigate]);

    if (!imageUrl) return null;

    return (
        <div 
            className="fixed inset-0 bg-black overflow-hidden animate-in fade-in duration-300"
            style={{ height: '100dvh', zIndex: 99999 }}
            onClick={() => navigate(-1)}
        >
            <img
                src={imageUrl}
                alt="Full View"
                className="w-full h-full object-contain animate-in zoom-in-95 duration-300"
            />
            
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(-1);
                }}
                className="absolute top-4 right-4 z-10 text-white text-4xl leading-none font-light opacity-80 hover:opacity-100"
            >
                &times;
            </button>
        </div>
    );
};

export default ImageViewer;
