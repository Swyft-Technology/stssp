import React, { useEffect, useState, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface AddressAutocompleteProps {
  onSelect: (address: string) => void;
  value: string;
  className?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ 
  onSelect, 
  value,
  className 
}) => {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [service, setService] = useState<google.maps.places.AutocompleteService | null>(null);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 1. Initialize Google Maps Service
  useEffect(() => {
    const init = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return;

      try {
        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places"], // Loads the Standard Places API
          region: "AU",
          language: "en-AU"
        });

        await loader.importLibrary("places");
        
        // Initialize the Standard Service
        // This is the most reliable method for custom styling right now
        setService(new google.maps.places.AutocompleteService());
      } catch (error) {
        console.error("Maps load error", error);
      }
    };
    init();
  }, []);

  // 2. Fetch Predictions when user types
  useEffect(() => {
    if (!service || !value) {
      setPredictions([]);
      return;
    }

    // Only search if user is actively typing
    if (value.length > 2 && showDropdown) {
      const displaySuggestions = (
        predictions: google.maps.places.AutocompletePrediction[] | null,
        status: google.maps.places.PlacesServiceStatus
      ) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions);
        } else {
          setPredictions([]);
        }
      };

      // We use the Standard API request (Safe & Reliable)
      service.getPlacePredictions({
        input: value,
        componentRestrictions: { country: 'au' },
        locationBias: { radius: 1500, center: { lat: -33.7995, lng: 151.0055 } } 
      }, displaySuggestions);
    }
  }, [value, service, showDropdown]);

  // 3. Handle Click Outside (Close Dropdown)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    // Standard API returns the description directly
    onSelect(prediction.description);
    setShowDropdown(false);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelect(e.target.value);
    setShowDropdown(true);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* STANDARD INPUT */}
      <input 
        type="text" 
        className={className} 
        placeholder="Delivery Address"
        value={value}
        onChange={handleInput}
        onFocus={() => value.length > 2 && setShowDropdown(true)}
        autoComplete="off" 
      />

      {/* CUSTOM DROPDOWN LIST */}
      {showDropdown && predictions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {predictions.map((prediction) => (
            <li 
              key={prediction.place_id}
              onClick={() => handleSelect(prediction)}
              className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 text-sm text-gray-700 dark:text-gray-200 flex flex-col"
            >
              <span className="font-medium">{prediction.structured_formatting.main_text}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{prediction.structured_formatting.secondary_text}</span>
            </li>
          ))}
          
          <li className="px-4 py-1 flex justify-end">
             <img src="https://developers.google.com/static/maps/documentation/images/powered_by_google_on_white.png" alt="Powered by Google" className="h-4 opacity-70" />
          </li>
        </ul>
      )}
    </div>
  );
};