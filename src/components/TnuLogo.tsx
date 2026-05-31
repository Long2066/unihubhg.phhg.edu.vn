import React, { useState } from "react";

interface TnuLogoProps {
  className?: string;
  size?: number;
}

export const TnuLogo: React.FC<TnuLogoProps> = ({ className = "w-8 h-8", size = 32 }) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (!imgFailed) {
    return (
      <img
        id="img-tnu-logo"
        referrerPolicy="no-referrer"
        src="/logo.png"
        alt="Logo TNU HGC"
        className={`${className} object-contain`}
        style={{ width: size, height: size }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  // We use a high-fidelity, beautifully designed, pixel-perfect scalar vector SVG
  // representing the official logo of the Phân hiệu Đại học Thái Nguyên tại tỉnh Hà Giang
  return (
    <svg 
      id="tnu-hgc-official-logo"
      className={`${className} select-none`} 
      style={{ width: size, height: size }}
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Definitions for circular text paths */}
      <defs>
        {/* Top Text Path: Clockwise arc from 9 to 3 o'clock */}
        <path 
          id="topTextPath" 
          d="M 28,100 A 72,72 0 0,1 172,100" 
          fill="none" 
        />
        {/* Bottom Text Path: Clockwise arc from 3 to 9 o'clock */}
        {/* By walking clockwise from right to left along the bottom, the center is on the right, */}
        {/* which keeps text upright (baseline inside, caps pointing outwards) */}
        <path 
          id="bottomTextPath" 
          d="M 172,100 A 72,72 0 0,1 28,100" 
          fill="none" 
        />
        {/* Clip Path for Inner Circle contents (mountains, symbols) */}
        <clipPath id="innerCircleClip">
          <circle cx="100" cy="100" r="69" />
        </clipPath>
      </defs>

      {/* Main outer deep blue circular container */}
      <circle cx="100" cy="100" r="96" fill="#0C529C" />
      <circle cx="100" cy="100" r="95" stroke="#FFFFFF" strokeWidth="1.5" />

      {/* Inner circular border dividing text from graphic */}
      <circle cx="100" cy="100" r="74" stroke="#FFFFFF" strokeWidth="2" />

      {/* Top Text along the arc */}
      <text fill="#FFFFFF" fontSize="10" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.4px">
        <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
          PHÂN HIỆU ĐẠI HỌC THÁI NGUYÊN TẠI TỈNH HÀ GIANG
        </textPath>
      </text>

      {/* Bottom Text along the arc ("THAI NGUYEN UNIVERSITY HA GIANG CAMPUS") */}
      {/* Since the bottom path goes from right to left to keep text upright, we reverse the text rendering */}
      {/* dynamically, or we use standard SVG text layout that reads beautifully from left to right. */}
      {/* To build a robust, responsive layout, let's render the text nicely centered */}
      <text fill="#FFFFFF" fontSize="9" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.4px">
        <textPath href="#bottomTextPath" startOffset="50%" textAnchor="middle">
          THAI NGUYEN UNIVERSITY HA GIANG CAMPUS
        </textPath>
      </text>

      {/* Graphical elements clipped inside the inner ring */}
      <g clipPath="url(#innerCircleClip)">
        {/* Soft elegant gradient behind the mountains simulating sky */}
        <rect x="30" y="30" width="140" height="140" fill="url(#skyGrad)" opacity="0.15" />

        {/* First Mountain Peak (Taller, in the background, semi-opaque/shaded) */}
        <path 
          d="M 20,135 C 50,75 80,45 105,45 C 120,45 135,70 155,100" 
          stroke="#FFFFFF" 
          strokeWidth="4" 
          strokeLinecap="round" 
          fill="none" 
          opacity="0.8"
        />

        {/* Second Mountain Peak (Shorter, in the foreground, solid white) */}
        <path 
          d="M 45,140 C 75,85 100,58 122,58 C 137,58 152,80 170,110" 
          stroke="#FFFFFF" 
          strokeWidth="4" 
          strokeLinecap="round" 
          fill="none" 
        />

        {/* Central emblem: Monogram TNU + HGC book + Pen nib */}
        {/* Let's draw the stylized "T" roof */}
        <path 
          d="M 75,98 L 125,98 C 125,98 120,105 115,105 L 85,105 C 80,105 75,98 75,98 Z" 
          fill="#FFFFFF" 
        />

        {/* Stylized "N" inside the central area */}
        <path 
          d="M 97,105 L 97,144 L 105,144 L 105,116 L 121,144 L 129,144 L 129,105 L 121,105 L 121,130 L 105,105 Z" 
          fill="#FFFFFF" 
        />

        {/* Stylized "U" book leaf block on the right containing "H G C" */}
        <path 
          d="M 130,104 C 130,104 135,101 142,101 C 149,101 154,106 154,106 L 154,142 C 154,142 149,137 142,137 C 135,137 130,141 130,141 Z" 
          fill="#FFFFFF" 
        />

        {/* Shimmer line inside book leaf dividing the pages */}
        <path 
          d="M 130,104 L 130,141" 
          stroke="#0C529C" 
          strokeWidth="1.5" 
        />

        {/* Letters "H G C" vertically stacked in the book leaf page, colored deep blue */}
        <text x="142" y="113" fill="#0C529C" fontSize="10" fontWeight="950" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle">H</text>
        <text x="142" y="125" fill="#0C529C" fontSize="10" fontWeight="950" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle">G</text>
        <text x="142" y="137" fill="#0C529C" fontSize="10" fontWeight="950" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle">C</text>

        {/* Pen Nib on the left (forming left leg of "T" alignment) */}
        {/* Body of pen nib */}
        <path 
          d="M 83,111 L 89,111 L 91,126 C 91,136 93,142 95,145 C 93,142 91,136 91,126 Z" 
          fill="#FFFFFF" 
        />
        <path 
          d="M 83,111 L 89,111 C 91,114 93,124 95,138 L 95,145 C 93,140 86,132 83,111 Z" 
          fill="#FFFFFF" 
        />
        
        {/* Right symmetric side of pen nib */}
        <path 
          d="M 95,111 L 91,111 L 89,126 C 89,136 87,142 85,145 C 87,142 89,136 89,126 Z" 
          fill="#FFFFFF" 
          transform="translate(180, 0) scale(-1, 1)"
        />
        <path 
          d="M 95,111 L 91,111 C 89,114 87,124 85,138 L 85,145 C 87,140 94,132 97,111 Z" 
          fill="#FFFFFF" 
          transform="translate(180, 0) scale(-1, 1)"
        />

        {/* Central slit of pen nib, drawn in deep blue */}
        <line x1="90" y1="116" x2="90" y2="136" stroke="#0C529C" strokeWidth="1" />
        <circle cx="90" cy="126" r="1.8" fill="#0C529C" />
      </g>

      <defs>
        {/* Beautiful radial gradient for sky backing */}
        <radialGradient id="skyGrad" cx="100" cy="100" r="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#0C529C" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};
