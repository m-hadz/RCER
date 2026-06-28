import React, { useState } from "react";

interface ImageCarouselProps {
  imagenes?: { url: string }[];
}

export default function ImageCarousel({ imagenes }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!imagenes || imagenes.length === 0) {
    return (
      <section className="mt-8 animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Galería</h2>
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
          No hay imágenes del centro
        </div>
      </section>
    );
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? imagenes.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === imagenes.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="mt-8 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Galería</h2>
      <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden group shadow-md border border-gray-200">
        <img
          src={imagenes[currentIndex].url}
          alt={`Imagen ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        {imagenes.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 px-2 py-1 rounded-full">
              {imagenes.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/80'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
