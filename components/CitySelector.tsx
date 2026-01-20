import React from 'react';
import { CityData } from '../types';

interface CitySelectorProps {
  cities: CityData[];
  selectedCity: CityData;
  onSelect: (city: CityData) => void;
}

const CitySelector: React.FC<CitySelectorProps> = ({ cities, selectedCity, onSelect }) => {
  return (
    <div className="relative w-full group">
      <select
        value={selectedCity.id}
        onChange={(e) => {
          const city = cities.find((c) => c.id === e.target.value);
          if (city) onSelect(city);
        }}
        className="w-full appearance-none bg-white/20 backdrop-blur-xl text-white px-6 py-3 rounded-2xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-center font-medium shadow-lg cursor-pointer"
      >
        {cities.map((city) => (
          <option key={city.id} value={city.id} className="text-black">
            {city.name}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/70">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </div>
  );
};

export default CitySelector;
