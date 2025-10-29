import React from 'react';
import Spinner from './Spinner';

interface ImageDisplayProps {
  title: string;
  imageSrc: string | null;
  isLoading: boolean;
  placeholderText: string;
  loadingText: string;
  onDownload?: () => void;
}

const PhotoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const ImageDisplay: React.FC<ImageDisplayProps> = ({ title, imageSrc, isLoading, placeholderText, loadingText, onDownload }) => {
  return (
    <div className="flex-1 flex flex-col bg-gray-800/50 rounded-2xl shadow-2xl overflow-hidden border border-gray-700 min-h-[300px] md:min-h-[400px] lg:min-h-[500px]">
      <div className="flex items-center justify-between py-3 px-4 bg-gray-900/40 border-b border-gray-700">
        <div className="w-8"></div> {/* Spacer */}
        <h2 className="text-center text-lg md:text-xl font-semibold text-gray-300">{title}</h2>
        <div className="w-8">
            {imageSrc && !isLoading && onDownload && (
                <button onClick={onDownload} title="Download Image" className="text-gray-400 hover:text-white transition-colors">
                    <DownloadIcon />
                </button>
            )}
        </div>
      </div>
      <div className="flex-grow flex items-center justify-center p-4">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 text-gray-400">
            <Spinner className="w-12 h-12"/>
            <p className="text-center">{loadingText}</p>
          </div>
        ) : imageSrc ? (
          <img src={imageSrc} alt={title} className="max-w-full max-h-full object-contain rounded-lg" />
        ) : (
          <div className="text-center text-gray-500 flex flex-col items-center gap-4">
            <PhotoIcon />
            <p>{placeholderText}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageDisplay;
