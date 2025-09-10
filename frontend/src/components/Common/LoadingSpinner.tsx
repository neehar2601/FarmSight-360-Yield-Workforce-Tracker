const LoadingSpinner = ({ size = 'medium', message }: { size?: 'small' | 'medium' | 'large'; message?: string }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-primary-600 ${sizeClasses[size]}`}></div>
      {message && <p className="mt-4 text-gray-600 text-sm">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
