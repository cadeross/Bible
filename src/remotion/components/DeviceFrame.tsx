import React from 'react';

export const DeviceFrame: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
    return (
        <div
            className={`relative bg-white rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border-[8px] border-white ring-1 ring-black/5 ${className}`}
            style={{ aspectRatio: '9/19.5' }}
        >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-2xl z-20 pointer-events-none opacity-0" /> {/* Hidden notch for "bezel-less" look, or we can make it purely clean */}

            {/* Actual Content Area */}
            <div className="w-full h-full bg-[#fcfcfc] overflow-hidden relative">
                {children}
            </div>
        </div>
    );
};
