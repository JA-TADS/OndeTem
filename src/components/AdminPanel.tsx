import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quadra } from '../types';
import { storageService } from '../services/storage';
import { firebaseService } from '../services/firebase';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Eye, EyeOff, MapPin, ArrowLeft, Camera, X, Clock, MessageCircle, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import MapLocationPicker from './MapLocationPicker';
import ChatSystem from './ChatSystem';
import OperatingHoursManager from './OperatingHoursManager';
import AdminBookingView from './AdminBookingView';
import AdminReservationsManager from './AdminReservationsManager';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingQuadra, setEditingQuadra] = useState<Quadra | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    lat: '',
    lng: '',
    price: '',
    amenities: [] as string[],
    isActive: true,
    photos: [] as string[],
    operatingHours: {
      monday: { open: '08:00', close: '22:00', isOpen: true },
      tuesday: { open: '08:00', close: '22:00', isOpen: true },
      wednesday: { open: '08:00', close: '22:00', isOpen: true },
      thursday: { open: '08:00', close: '22:00', isOpen: true },
      friday: { open: '08:00', close: '22:00', isOpen: true },
      saturday: { open: '08:00', close: '22:00', isOpen: true },
      sunday: { open: '08:00', close: '22:00', isOpen: true }
    }
  });

  // Comodidades organizadas por categoria
  const amenitiesCategories = {
    infraestrutura: [
      'Cobertura',
      'Alambrado ou rede de proteção',
      'Marcação de linhas oficiais',
      'Placar eletrônico ou manual',
      'Arquibancada'
    ],
    tiposPiso: [
      'Grama sintética',
      'Cimento',
      'Areia',
      'Madeira'
    ],
    esportes: [
      'Futsal',
      'Futebol',
      'Basquete',
      'Volei',
      'Tenis',
      'Handebol'
    ],
    conforto: [
      'Vestiários com chuveiro',
      'Banheiros',
      'Bebedouro',
      'Estacionamento',
      'Armários',
      'Climatização (ventiladores, ar-condicionado)'
    ]
  };

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'quadras' | 'funcionamento' | 'reservas' | 'chat'>('quadras');
  const [selectedQuadraForOperatingHours, setSelectedQuadraForOperatingHours] = useState<Quadra | null>(null);
  const [selectedQuadraForBookingView, setSelectedQuadraForBookingView] = useState<Quadra | null>(null);
  const [expandedInfraestrutura, setExpandedInfraestrutura] = useState(false);
  const [expandedConforto, setExpandedConforto] = useState(false);
  const [expandedPiso, setExpandedPiso] = useState(false);
  const [expandedEsportes, setExpandedEsportes] = useState(false);

  useEffect(() => {
    loadQuadras();
  }, [user?.id]);

  const loadQuadras = async () => {
    try {
      const allQuadras = await storageService.getQuadras();
      // Filtrar apenas quadras do admin logado
      const userQuadras = allQuadras.filter(quadra => quadra.ownerId === user?.id);
      setQuadras(userQuadras);
    } catch (error) {
      console.error('Erro ao carregar quadras:', error);
      setQuadras([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações obrigatórias
    // 1. Esporte
    const esportesSelecionados = formData.amenities.filter(a => a.startsWith('Esporte: '));
    if (esportesSelecionados.length === 0) {
      alert('Por favor, selecione pelo menos um esporte.');
      return;
    }
    
    // 2. Nome
    if (!formData.name.trim()) {
      alert('Por favor, preencha o nome da quadra.');
      return;
    }
    
    // 3. Endereço
    if (!formData.address.trim()) {
      alert('Por favor, preencha o endereço da quadra.');
      return;
    }
    
    // 4. Selecionar no mapa
    if (!formData.lat || !formData.lng) {
      alert('Por favor, selecione a localização da quadra no mapa.');
      return;
    }
    
    if (!user?.id) {
      alert('Erro: Usuário não identificado. Por favor, faça login novamente.');
      return;
    }

    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);
    const price = parseFloat(formData.price);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Coordenadas inválidas. Por favor, selecione a localização novamente.');
      return;
    }

    if (isNaN(price) || price <= 0) {
      alert('Por favor, informe um preço válido.');
      return;
    }
    
    // Preparar dados da quadra (sem createdAt para novas quadras, o Firebase cria automaticamente)
    const quadraData: any = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      address: formData.address.trim(),
      coordinates: {
        lat: lat,
        lng: lng
      },
      price: price,
      photos: formData.photos.length > 0 ? formData.photos : (editingQuadra?.photos || []),
      rating: editingQuadra?.rating || 0,
      reviews: editingQuadra?.reviews || [],
      amenities: formData.amenities,
      ownerId: user.id,
      isActive: formData.isActive,
      operatingHours: formData.operatingHours
    };

    // Adicionar ID apenas se estiver editando
    if (editingQuadra?.id) {
      quadraData.id = editingQuadra.id;
    }

    try {
      console.log('Salvando quadra:', quadraData);
      
      // Limpar cache antes de salvar
      storageService.clearCache();
      
      // Salvar diretamente no Firebase usando firebaseService
      const quadraId = await firebaseService.saveQuadra(quadraData);
      console.log('Quadra salva com sucesso! ID:', quadraId);
      
      // Limpar cache novamente após salvar
      storageService.clearCache();
      
      // Recarregar apenas as quadras do admin logado
      await loadQuadras();
      resetForm();
      
      alert(editingQuadra ? 'Quadra atualizada com sucesso!' : 'Quadra criada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar quadra:', error);
      let errorMessage = 'Erro ao salvar quadra.';
      
      if (error?.code === 'permission-denied') {
        errorMessage = 'Erro de permissão. Verifique se você tem permissão para criar/editar quadras.';
      } else if (error?.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      lat: '',
      lng: '',
      price: '',
      amenities: [],
      isActive: true,
      photos: [],
      operatingHours: {
        monday: { open: '08:00', close: '22:00', isOpen: true },
        tuesday: { open: '08:00', close: '22:00', isOpen: true },
        wednesday: { open: '08:00', close: '22:00', isOpen: true },
        thursday: { open: '08:00', close: '22:00', isOpen: true },
        friday: { open: '08:00', close: '22:00', isOpen: true },
        saturday: { open: '08:00', close: '22:00', isOpen: true },
        sunday: { open: '08:00', close: '22:00', isOpen: true }
      }
    });
    setEditingQuadra(null);
    setShowForm(false);
  };

  const handleEdit = (quadra: Quadra) => {
    setEditingQuadra(quadra);
    setFormData({
      name: quadra.name,
      description: quadra.description,
      address: quadra.address,
      lat: quadra.coordinates.lat.toString(),
      lng: quadra.coordinates.lng.toString(),
      price: quadra.price.toString(),
      amenities: quadra.amenities || [],
      isActive: quadra.isActive,
      photos: quadra.photos,
      operatingHours: quadra.operatingHours || {
        monday: { open: '08:00', close: '22:00', isOpen: true },
        tuesday: { open: '08:00', close: '22:00', isOpen: true },
        wednesday: { open: '08:00', close: '22:00', isOpen: true },
        thursday: { open: '08:00', close: '22:00', isOpen: true },
        friday: { open: '08:00', close: '22:00', isOpen: true },
        saturday: { open: '08:00', close: '22:00', isOpen: true },
        sunday: { open: '08:00', close: '22:00', isOpen: true }
      }
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta quadra?')) {
      try {
        // Deletar do Firebase diretamente
        const { firebaseService } = await import('../services/firebase');
        await firebaseService.deleteQuadra(id);
        
        // Limpar cache para garantir que a exclusão seja refletida
        storageService.clearCache();
        
        // Recarregar apenas as quadras do admin logado
        await loadQuadras();
        
        alert('Quadra excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao deletar quadra:', error);
        alert('Erro ao excluir quadra. Por favor, tente novamente.');
      }
    }
  };

  const toggleActive = async (id: string) => {
    try {
      const allQuadras = await storageService.getQuadras();
      const updatedQuadras = allQuadras.map(q => 
        q.id === id ? { ...q, isActive: !q.isActive } : q
      );
      await storageService.saveQuadras(updatedQuadras);
      // Recarregar apenas as quadras do admin logado
      await loadQuadras();
    } catch (error) {
      console.error('Erro ao alterar status da quadra:', error);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData({ ...formData, lat: lat.toString(), lng: lng.toString() });
    setShowLocationPicker(false);
  };

  const handleLocationCancel = () => {
    setShowLocationPicker(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }

      try {
        // Criar preview local primeiro
        const previewUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        });

        // Adicionar preview temporário
        setFormData(prev => ({ ...prev, photos: [...(prev.photos || []), previewUrl] }));

        // Fazer upload para Cloudinary
        console.log('Fazendo upload da imagem para Cloudinary...');
        const cloudinaryUrl = await uploadImageToCloudinary(file, `quadras/${user?.id || 'default'}`);
        console.log('Upload bem-sucedido:', cloudinaryUrl);

        // Substituir preview pela URL do Cloudinary
        setFormData(prev => {
          const photos = [...prev.photos];
          // Encontrar e substituir o preview pela URL do Cloudinary
          const previewIndex = photos.findIndex(p => p === previewUrl);
          if (previewIndex !== -1) {
            photos[previewIndex] = cloudinaryUrl;
          } else {
            // Se não encontrou o preview, adicionar no final
            photos.push(cloudinaryUrl);
          }
          return { ...prev, photos };
        });
      } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        alert('Erro ao fazer upload da imagem. Por favor, tente novamente.');
        // Remover preview em caso de erro
        setFormData(prev => {
          const photos = [...prev.photos];
          // Remover apenas se ainda houver preview (base64)
          const filtered = photos.filter(p => !p.startsWith('data:image'));
          return { ...prev, photos: filtered };
        });
      }
    }
    
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleRemovePhoto = (photoIndex: number) => {
    const updatedPhotos = (formData.photos || []).filter((_, index) => index !== photoIndex);
    setFormData({ ...formData, photos: updatedPhotos });
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-4 flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors z-10"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Voltar ao Mapa
      </button>
      <button
        onClick={() => setShowForm(true)}
        className="absolute top-8 right-20 flex items-center bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-500 transition-colors z-10"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nova Quadra
      </button>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          </div>
        </div>

        {/* Abas de navegação */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('quadras')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'quadras'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Quadras
            </button>
            <button
              onClick={() => setActiveTab('funcionamento')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'funcionamento'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="h-4 w-4 mr-2 inline" />
              Funcionamento
            </button>
            <button
              onClick={() => setActiveTab('reservas')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'reservas'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2 inline" />
              Reservas
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageCircle className="h-4 w-4 mr-2 inline" />
              Chat
            </button>
          </div>
        </div>


        {/* Conteúdo baseado na aba ativa */}
        {activeTab === 'quadras' && (
          <>
            {/* Formulário */}
            {showForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    {editingQuadra ? 'Editar Quadra' : 'Nova Quadra'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    title="Fechar"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Campo Esportes */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedEsportes(!expandedEsportes)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={amenitiesCategories.esportes.some(esporte => formData.amenities.includes(`Esporte: ${esporte}`))}
                          onChange={(e) => {
                            // Não fazer nada aqui, apenas para mostrar estado visual
                            e.stopPropagation();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                          readOnly
                        />
                        <span className="text-sm font-semibold text-gray-800">Esportes <span className="text-red-500">*</span></span>
                      </div>
                      {expandedEsportes ? (
                        <ChevronUp className="h-5 w-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                    {expandedEsportes && (
                      <div className="p-4 bg-white border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {amenitiesCategories.esportes.map((esporte) => {
                            const esporteValue = `Esporte: ${esporte}`;
                            return (
                              <label key={esporte} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                  type="checkbox"
                                  checked={formData.amenities.includes(esporteValue)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        amenities: [...formData.amenities, esporteValue]
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        amenities: formData.amenities.filter(a => a !== esporteValue)
                                      });
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{esporte}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="border rounded px-3 py-2 w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preço (R$/hora)
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="border rounded px-3 py-2 w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="border rounded px-3 py-2 w-full resize-none"
                      rows={3}
                      required
                      style={{ resize: 'none' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="border rounded px-3 py-2 w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Localização <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={formData.lat && formData.lng ? `${formData.lat}, ${formData.lng}` : ''}
                        className="border rounded px-3 py-2 flex-1"
                        placeholder="Clique em 'Selecionar no Mapa' para escolher a localização"
                        readOnly
                      />
                      <button
                        type="button"
                        onClick={() => setShowLocationPicker(true)}
                        className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-500 flex items-center"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Selecionar no Mapa
                      </button>
                    </div>
                    {formData.lat && formData.lng && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ Localização selecionada: {parseFloat(formData.lat).toFixed(6)}, {parseFloat(formData.lng).toFixed(6)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Comodidades
                    </label>
                    
                    {/* Infraestrutura da quadra */}
                    <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedInfraestrutura(!expandedInfraestrutura)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <span className="mr-2">⚽</span>
                          <span className="text-sm font-semibold text-gray-800">Infraestrutura da quadra</span>
                        </div>
                        {expandedInfraestrutura ? (
                          <ChevronUp className="h-5 w-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-600" />
                        )}
                      </button>
                      {expandedInfraestrutura && (
                        <div className="p-4 bg-white">
                          <p className="text-xs text-gray-500 mb-3">Estrutura da quadra:</p>
                          
                          {/* Campo Piso expansível */}
                          <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setExpandedPiso(!expandedPiso)}
                              className="w-full flex items-center justify-between p-2 bg-white hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={amenitiesCategories.tiposPiso.some(tipo => formData.amenities.includes(`Piso: ${tipo}`))}
                                  onChange={(e) => {
                                    // Não fazer nada aqui, apenas para mostrar estado visual
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                                  readOnly
                                />
                                <span className="text-sm font-medium text-gray-800">Piso</span>
                              </div>
                              {expandedPiso ? (
                                <ChevronUp className="h-4 w-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                              )}
                            </button>
                            {expandedPiso && (
                              <div className="p-3 bg-gray-50 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {amenitiesCategories.tiposPiso.map((tipoPiso) => {
                                    const pisoValue = `Piso: ${tipoPiso}`;
                                    return (
                                      <label key={tipoPiso} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded">
                                        <input
                                          type="checkbox"
                                          checked={formData.amenities.includes(pisoValue)}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              // Remover outros tipos de piso antes de adicionar o novo
                                              const outrosPisos = amenitiesCategories.tiposPiso
                                                .map(tp => `Piso: ${tp}`)
                                                .filter(p => p !== pisoValue);
                                              const amenitiesSemPisos = formData.amenities.filter(a => !outrosPisos.includes(a));
                                              setFormData({
                                                ...formData,
                                                amenities: [...amenitiesSemPisos, pisoValue]
                                              });
                                            } else {
                                              setFormData({
                                                ...formData,
                                                amenities: formData.amenities.filter(a => a !== pisoValue)
                                              });
                                            }
                                          }}
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">{tipoPiso}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Outras opções de infraestrutura */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {amenitiesCategories.infraestrutura.map((amenity) => (
                              <label key={amenity} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                  type="checkbox"
                                  checked={formData.amenities.includes(amenity)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        amenities: [...formData.amenities, amenity]
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        amenities: formData.amenities.filter(a => a !== amenity)
                                      });
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{amenity}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Conforto e apoio */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedConforto(!expandedConforto)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <span className="mr-2">🏀</span>
                          <span className="text-sm font-semibold text-gray-800">Conforto e apoio</span>
                        </div>
                        {expandedConforto ? (
                          <ChevronUp className="h-5 w-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-600" />
                        )}
                      </button>
                      {expandedConforto && (
                        <div className="p-4 bg-white">
                          <p className="text-xs text-gray-500 mb-3">Comodidades que melhoram a experiência dos jogadores:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {amenitiesCategories.conforto.map((amenity) => (
                              <label key={amenity} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                  type="checkbox"
                                  checked={formData.amenities.includes(amenity)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        amenities: [...formData.amenities, amenity]
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        amenities: formData.amenities.filter(a => a !== amenity)
                                      });
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{amenity}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seção de Fotos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fotos da Quadra
                    </label>
                    
                    {/* Fotos existentes */}
                    {formData.photos.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {formData.photos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(index)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Botão para adicionar fotos */}
                    <label className="inline-flex items-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-500 cursor-pointer">
                      <Camera className="h-4 w-4 mr-2" />
                      Adicionar Fotos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Quadra ativa
                    </label>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="submit"
                      className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                    >
                      {editingQuadra ? 'Atualizar' : 'Criar'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de quadras */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold">Suas Quadras ({quadras.length})</h2>
                {quadras.length === 0 && (
                  <p className="text-gray-600 text-sm mt-1">
                    Você ainda não possui quadras cadastradas. Clique em "Nova Quadra" para começar.
                  </p>
                )}
              </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endereço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quadras.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                          <Plus className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm">Nenhuma quadra cadastrada</p>
                        <p className="text-xs text-gray-400">Clique em "Nova Quadra" para começar</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  quadras.map((quadra) => (
                  <tr key={quadra.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{quadra.name}</div>
                      <div className="text-sm text-gray-500">{quadra.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {quadra.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {quadra.price}/hora
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        quadra.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {quadra.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(quadra)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setSelectedQuadraForBookingView(quadra)}
                          className="text-green-600 hover:text-green-900"
                          title="Ver Horários"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(quadra.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title={quadra.isActive ? "Desativar" : "Ativar"}
                        >
                          {quadra.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(quadra.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}


        {activeTab === 'funcionamento' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Selecionar Quadra para Gerenciar Horários de Funcionamento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quadras.map((quadra) => (
                  <div
                    key={quadra.id}
                    onClick={() => setSelectedQuadraForOperatingHours(quadra)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedQuadraForOperatingHours?.id === quadra.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-semibold">{quadra.name}</h3>
                    <p className="text-sm text-gray-600">{quadra.address}</p>
                    <p className="text-sm text-green-600 font-medium">R$ {quadra.price}/hora</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedQuadraForOperatingHours && (
              <OperatingHoursManager
                quadraId={selectedQuadraForOperatingHours.id}
                quadraName={selectedQuadraForOperatingHours.name}
              />
            )}
          </div>
        )}

        {activeTab === 'reservas' && (
          <AdminReservationsManager />
        )}

        {activeTab === 'chat' && (
          <ChatSystem isAdmin={true} />
        )}
      </div>
      
      {showLocationPicker && (
        <MapLocationPicker
          onLocationSelect={handleLocationSelect}
          onCancel={handleLocationCancel}
          initialLocation={formData.lat && formData.lng ? 
            { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) } : 
            undefined
          }
        />
      )}

      {/* Admin Booking View */}
      {selectedQuadraForBookingView && (
        <AdminBookingView
          quadraId={selectedQuadraForBookingView.id}
          quadraName={selectedQuadraForBookingView.name}
          isOpen={!!selectedQuadraForBookingView}
          onClose={() => setSelectedQuadraForBookingView(null)}
        />
      )}
    </div>
  );
};

export default AdminPanel;
