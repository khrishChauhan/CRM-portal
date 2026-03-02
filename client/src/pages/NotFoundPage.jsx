import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <h1 className="text-9xl font-bold text-slate-200">404</h1>
            <div className="text-center mt-[-4rem]">
                <h2 className="text-3xl font-bold text-slate-800">Page Not Found</h2>
                <p className="text-slate-500 mt-4 max-w-md">
                    Sorry, the page you are looking for doesn't exist or has been moved.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-8 inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Home className="w-5 h-5" />
                    <span>Back to Home</span>
                </button>
            </div>
        </div>
    );
};

export default NotFoundPage;
