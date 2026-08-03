import React from 'react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-6 md:p-8 bg-gradient-to-tr from-[#050608] via-[#0A0B0E] to-[#12151c] text-white font-sans overflow-hidden select-none relative">
      {/* Background Decorative Glows */}
      <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] rounded-full bg-[#c09e75]/2 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-blue-500/2 blur-[140px] pointer-events-none" />
      
      {/* Subtle technical background grid to keep the engineering theme but extremely clean and subtle */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10">
        {/* Main glassmorphic card */}
        <div className="w-full bg-[#0D0E12]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-8 md:p-10 shadow-[0_0_50px_rgba(192,158,117,0.03),0_20px_40px_-15px_rgba(0,0,0,0.5)] relative">
          
          {/* Custom Golden SVG Isometric Wireframe Cube Logo */}
          <div className="flex justify-center mb-6">
            <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#DFBA8A" />
                  <stop offset="50%" stopColor="#C49B6D" />
                  <stop offset="100%" stopColor="#8E673E" />
                </linearGradient>
              </defs>
              {/* Outer Isometric Hexagon */}
              <path d="M50 15 L85 35 L85 65 L50 85 L15 65 L15 35 Z" stroke="url(#gold-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Inner Cube Edges */}
              <path d="M50 15 L50 50" stroke="url(#gold-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M85 35 L50 50" stroke="url(#gold-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 35 L50 50" stroke="url(#gold-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Inner Center Cube */}
              <path d="M50 35 L63 42.5 L63 57.5 L50 65 L37 57.5 L37 42.5 Z" stroke="url(#gold-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
              <path d="M50 35 L50 50" stroke="url(#gold-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
              <path d="M63 42.5 L50 50" stroke="url(#gold-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
              <path d="M37 42.5 L50 50" stroke="url(#gold-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
            </svg>
          </div>

          {/* Render child form pages */}
          {children}

        </div>
      </div>

      {/* Global Footer */}
      <div className="mt-8 text-center text-xs text-gray-600 z-10">
        <p>© 2026 BizPulse. All rights reserved.</p>
      </div>
    </div>
  );
}
