import React, { useState } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

interface ImageComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  altText?: string;
  className?: string;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  beforeImage,
  afterImage,
  altText = "Comparação de imagens",
  className = ""
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isHovering, setIsHovering] = useState(false);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <div 
      className={`relative overflow-hidden select-none group w-full h-full ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Background Image (After / Generated) */}
      <img
        src={afterImage}
        alt={`Depois - ${altText}`}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Foreground Image (Before / Original) - Clipped */}
      <img
        src={beforeImage}
        alt={`Antes - ${altText}`}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
        }}
      />

      {/* Slider Handle Line */}
      <div
        className="absolute inset-y-0 w-1 bg-white/80 backdrop-blur-sm cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Handle Circle Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-indigo-600 transition-transform duration-200 hover:scale-110">
          <ChevronsLeftRight size={18} />
        </div>
      </div>

      {/* Labels (Visible on hover or interaction) */}
      <div 
        className={`absolute top-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md transition-opacity duration-300 pointer-events-none z-10 ${
          isHovering || sliderPosition < 10 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Original
      </div>
      <div 
        className={`absolute top-4 right-4 bg-indigo-600/80 text-white text-xs px-2 py-1 rounded backdrop-blur-md transition-opacity duration-300 pointer-events-none z-10 ${
          isHovering || sliderPosition > 90 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Envelhecida
      </div>

      {/* Invisible Range Input for Interaction */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={handleSliderChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30 touch-none"
        aria-label="Slider de comparação antes e depois"
      />
    </div>
  );
};