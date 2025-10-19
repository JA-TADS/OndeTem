import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import { MapPin, Check, X } from 'lucide-react';

interface MapLocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  onCancel: () => void;
  initialLocation?: { lat: number; lng: number };
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  onLocationSelect,
  onCancel,
  initialLocation
}) => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setSelectedLocation({ lat, lng });
      }
    });
    return null;
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation.lat, selectedLocation.lng);
    }
  };

  // Ícone personalizado para localização selecionada
  const selectedIcon = new Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 m-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Selecionar Localização da Quadra</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-gray-600 mb-4">
            Clique no mapa para selecionar a localização da quadra
          </p>
          
          <div className="h-96 w-full rounded-lg overflow-hidden border">
            <MapContainer
              center={selectedLocation || [-23.5505, -46.6333]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
              scrollWheelZoom={true}
              doubleClickZoom={true}
              dragging={true}
              touchZoom={true}
            >
              <TileLayer
                url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                maxZoom={20}
              />
              
              <MapClickHandler />
              
              {selectedLocation && (
                <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={selectedIcon}>
                </Marker>
              )}
            </MapContainer>
          </div>
          
          {selectedLocation && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center text-green-700">
                <MapPin className="h-5 w-5 mr-2" />
                <span className="font-medium">Localização selecionada:</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 p-4 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirmar Localização
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapLocationPicker;
