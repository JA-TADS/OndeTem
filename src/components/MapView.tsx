import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Quadra } from '../types';
import { storageService } from '../services/storage';
import { Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// Componente interno para controlar o mapa
const MapController: React.FC<{ userLocation: [number, number] }> = ({ userLocation }) => {
  const map = useMap();

  useEffect(() => {
    // Centralizar o mapa na localização do usuário
    map.setView(userLocation, 15);
  }, [map, userLocation]);

  return null;
};

const MapView: React.FC = () => {
  const navigate = useNavigate();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number]>([-23.5505, -46.6333]);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    // Carregar quadras
    const allQuadras = storageService.getQuadras();
    setQuadras(allQuadras);

    // Obter localização do usuário
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newLocation);
          // Forçar atualização do mapa
          setMapKey(prev => prev + 1);
        },
        (error) => {
          console.log('Erro ao obter localização:', error);
          // Forçar atualização mesmo sem localização
          setMapKey(prev => prev + 1);
        }
      );
    } else {
      // Forçar atualização mesmo sem geolocalização
      setMapKey(prev => prev + 1);
    }
  }, []);


  // Ícone personalizado para os marcadores
  const customIcon = new Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });

  const userIcon = new Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  const goToUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newLocation);
          setMapKey(prev => prev + 1);
        },
        (error) => {
          console.log('Erro ao obter localização:', error);
          alert('Não foi possível obter sua localização. Verifique se a geolocalização está habilitada.');
        }
      );
    } else {
      alert('Geolocalização não é suportada neste navegador.');
    }
  };

  const handleViewDetails = (quadraId: string) => {
    console.log('Navegando para quadra:', quadraId);
    navigate(`/quadra/${quadraId}`);
  };

  return (
    <div className="h-screen w-full relative pt-16">
      <MapContainer
        key={mapKey}
        center={userLocation}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        touchZoom={true}
      >
        <MapController userLocation={userLocation} />
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
          maxZoom={20}
        />
        
        {/* Marcador da localização do usuário */}
        <Marker position={userLocation} icon={userIcon}>
          <Popup>
            <div className="text-center">
              <strong>Sua localização</strong>
            </div>
          </Popup>
        </Marker>

        {/* Marcadores das quadras */}
        {quadras.map((quadra) => (
          <Marker
            key={quadra.id}
            position={[quadra.coordinates.lat, quadra.coordinates.lng]}
            icon={customIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg">{quadra.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{quadra.description}</p>
                <p className="text-sm">
                  <strong>Endereço:</strong> {quadra.address}
                </p>
                <p className="text-sm">
                  <strong>Preço:</strong> R$ {quadra.price}/hora
                </p>
                <p className="text-sm">
                  <strong>Avaliação:</strong> ⭐ {quadra.rating.toFixed(1)}
                </p>
                <div className="mt-2">
                  <button 
                    onClick={() => handleViewDetails(quadra.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 cursor-pointer transition-colors"
                    style={{ cursor: 'pointer' }}
                  >
                    Ver detalhes
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Botão flutuante para voltar à localização do usuário - SEMPRE VISÍVEL */}
      <button
        onClick={goToUserLocation}
        className="absolute top-20 right-4 z-[1000] bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 hover:shadow-xl"
        title="Minha Localização"
        style={{
          position: 'absolute',
          top: '5rem',
          right: '1rem',
          zIndex: 1000,
          backgroundColor: 'white',
          borderRadius: '50%',
          padding: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          minWidth: '48px',
          minHeight: '48px'
        }}
      >
        <Navigation className="h-5 w-5" />
      </button>
    </div>
  );
};

export default MapView;
