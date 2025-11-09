import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Quadra } from '../types';
import { storageService } from '../services/storage';
import { Navigation, Filter, X } from 'lucide-react';
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
  const [allQuadras, setAllQuadras] = useState<Quadra[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number]>([-23.5505, -46.6333]);
  const [mapKey, setMapKey] = useState(0);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  const esportesDisponiveis = ['Futsal', 'Futebol', 'Basquete', 'Volei', 'Tenis', 'Handebol'];
  
  // Comodidades disponíveis para filtro (todas as comodidades exceto esportes e piso)
  const comodidadesDisponiveis = [
    'Cobertura',
    'Alambrado ou rede de proteção',
    'Marcação de linhas oficiais',
    'Placar eletrônico ou manual',
    'Arquibancada',
    'Vestiários com chuveiro',
    'Banheiros',
    'Bebedouro',
    'Estacionamento',
    'Armários',
    'Climatização (ventiladores, ar-condicionado)'
  ];

  const loadActiveQuadras = async () => {
    try {
      console.log('=== INÍCIO: Carregando quadras ===');
      console.log('Usuário logado?', 'Verificando...');
      
      // Limpar cache antes de carregar para garantir dados atualizados
      storageService.clearCache();
      
      // Carregar apenas quadras ativas
      console.log('Chamando storageService.getQuadras()...');
      const allQuadras = await storageService.getQuadras();
      
      // Verificar se allQuadras é válido
      if (!allQuadras || !Array.isArray(allQuadras)) {
        console.error('❌ Erro: getQuadras() retornou valor inválido:', allQuadras);
        setQuadras([]);
        return;
      }
      
      console.log('✅ Quadras carregadas do Firebase:', allQuadras.length);
      
      if (allQuadras.length === 0) {
        console.warn('⚠️ Nenhuma quadra encontrada no Firebase. Verifique:');
        console.warn('1. Se há quadras cadastradas no Firestore');
        console.warn('2. Se as regras do Firestore permitem leitura pública (allow read: if true;)');
      }
      
      const activeQuadras = allQuadras.filter(quadra => quadra.isActive !== false);
      console.log('✅ Quadras ativas filtradas:', activeQuadras.length);
      console.log('=== FIM: Carregamento de quadras ===');
      
      setAllQuadras(activeQuadras);
      applyFilter(activeQuadras, selectedSports, selectedAmenities);
    } catch (error: any) {
      console.error('❌ ERRO ao carregar quadras:', error);
      console.error('Código do erro:', error?.code);
      console.error('Mensagem do erro:', error?.message);
      console.error('Stack trace:', error?.stack);
      
      // Se o erro for de permissão, mostrar mensagem amigável
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        console.error('❌ PERMISSÃO NEGADA: As regras do Firestore estão bloqueando a leitura.');
        console.error('📝 SOLUÇÃO: Acesse Firebase Console → Firestore → Regras');
        console.error('📝 Atualize para: allow read: if true; na coleção quadras');
        alert('Erro de permissão ao carregar quadras. Verifique o console para mais detalhes.');
      }
      
      setQuadras([]);
      setAllQuadras([]);
    }
  };

  const applyFilter = (quadrasToFilter: Quadra[], sports: string[], amenities: string[]) => {
    let filtered = quadrasToFilter;

    // Filtrar por esportes - a quadra deve ter TODOS os esportes selecionados
    if (sports.length > 0) {
      filtered = filtered.filter(quadra => {
        const quadraEsportes = quadra.amenities
          .filter(a => a.startsWith('Esporte: '))
          .map(a => a.replace('Esporte: ', ''));
        
        // Verificar se a quadra tem TODOS os esportes selecionados
        return sports.every(sport => quadraEsportes.includes(sport));
      });
    }

    // Filtrar por comodidades - a quadra deve ter TODAS as comodidades selecionadas
    if (amenities.length > 0) {
      filtered = filtered.filter(quadra => {
        // Verificar se a quadra tem TODAS as comodidades selecionadas
        return amenities.every(amenity => quadra.amenities.includes(amenity));
      });
    }

    setQuadras(filtered);
  };

  const handleSportToggle = (sport: string) => {
    const newSelected = selectedSports.includes(sport)
      ? selectedSports.filter(s => s !== sport)
      : [...selectedSports, sport];
    
    setSelectedSports(newSelected);
    applyFilter(allQuadras, newSelected, selectedAmenities);
  };

  const handleAmenityToggle = (amenity: string) => {
    const newSelected = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter(a => a !== amenity)
      : [...selectedAmenities, amenity];
    
    setSelectedAmenities(newSelected);
    applyFilter(allQuadras, selectedSports, newSelected);
  };

  const clearFilter = () => {
    setSelectedSports([]);
    setSelectedAmenities([]);
    applyFilter(allQuadras, [], []);
  };

  useEffect(() => {
    loadActiveQuadras();

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

  // Recarregar quadras quando a página ganha foco ou quando volta para o mapa
  useEffect(() => {
    const handleFocus = () => {
      loadActiveQuadras();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadActiveQuadras();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
    <div className="h-[calc(100vh-4rem)] w-full relative">
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

        {/* Marcadores das quadras ativas */}
        {quadras.map((quadra) => (
          <Marker
            key={quadra.id}
            position={[quadra.coordinates.lat, quadra.coordinates.lng]}
            icon={customIcon}
          >
            <Popup>
              <div className="p-0 overflow-hidden relative">
                {quadra.photos && quadra.photos.length > 0 && (
                  <img 
                    src={quadra.photos[0]} 
                    alt={quadra.name}
                    className="w-full h-32 object-cover"
                    style={{ display: 'block' }}
                    onError={(e) => {
                      // Se a imagem falhar ao carregar, ocultar
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
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
                      className="bg-blue-700 text-white px-3 py-1 rounded text-sm hover:bg-blue-500 cursor-pointer transition-colors"
                      style={{ cursor: 'pointer' }}
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Botão de Filtro - Canto superior direito */}
      <button
        onClick={() => setShowFilterModal(true)}
        className="absolute top-20 right-4 z-[1000] bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 hover:shadow-xl"
        title="Filtros"
        style={{
          position: 'absolute',
          top: '5rem',
          right: '1rem',
          zIndex: 1000,
          backgroundColor: 'white',
          borderRadius: '50%',
          padding: '0.75rem',
          width: '3rem',
          height: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          cursor: 'pointer'
        }}
      >
        <Filter className="h-5 w-5" />
        {(selectedSports.length > 0 || selectedAmenities.length > 0) && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {selectedSports.length + selectedAmenities.length}
          </span>
        )}
      </button>

      {/* Botão flutuante para voltar à localização do usuário - SEMPRE VISÍVEL (abaixo do botão de filtro) */}
      <button
        onClick={goToUserLocation}
        className="absolute top-40 right-4 z-[1000] bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 hover:shadow-xl"
        title="Minha Localização"
        style={{
          position: 'absolute',
          top: '10rem',
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

      {/* Modal de Filtros */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100]" onClick={() => setShowFilterModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Filter className="h-5 w-5 text-blue-500 mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">Filtros de Busca</h2>
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Filtro de Esportes */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Esportes</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {esportesDisponiveis.map((esporte) => (
                    <label key={esporte} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedSports.includes(esporte)}
                        onChange={() => handleSportToggle(esporte)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{esporte}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtro de Comodidades */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Comodidades</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {comodidadesDisponiveis.map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(amenity)}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Contador e Botões */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {selectedSports.length + selectedAmenities.length > 0 ? (
                    <span>
                      <strong>{quadras.length}</strong> quadra(s) encontrada(s)
                    </span>
                  ) : (
                    <span>Todas as quadras serão exibidas</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  {(selectedSports.length > 0 || selectedAmenities.length > 0) && (
                    <button
                      onClick={clearFilter}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Limpar Filtros
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
