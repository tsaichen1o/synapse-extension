import toast, { Toaster, ToastBar } from 'react-hot-toast';

export function CustomToaster() {
    return (
        <Toaster
            position="top-center"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#fff',
                    color: '#374151',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                },
                success: {
                    iconTheme: {
                        primary: '#9333ea',
                        secondary: '#fff',
                    },
                    style: {
                        background: 'linear-gradient(to right, #f3e8ff, #fce7f3)',
                        borderLeft: '4px solid #9333ea',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#dc2626',
                        secondary: '#fff',
                    },
                    style: {
                        background: '#fef2f2',
                        borderLeft: '4px solid #dc2626',
                    },
                },
            }}
        >
            {(t) => (
                <ToastBar toast={t}>
                    {({ icon, message }) => (
                        <>
                            {icon}
                            <div className="flex-1">{message}</div>
                            {t.type !== 'loading' && (
                                <button
                                    className="p-1 rounded-full hover:bg-black/10 transition-colors"
                                    onClick={() => toast.dismiss(t.id)}
                                    title="Dismiss"
                                >
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </>
                    )}
                </ToastBar>
            )}
        </Toaster>
    );
}
