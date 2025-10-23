import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quadra } from '../types';
import { storageService } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Eye, EyeOff, MapPin, ArrowLeft, Camera, X, Clock, MessageCircle, Calendar } from 'lucide-react';
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
    amenities: '',
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
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'quadras' | 'funcionamento' | 'reservas' | 'chat'>('quadras');
  const [selectedQuadraForOperatingHours, setSelectedQuadraForOperatingHours] = useState<Quadra | null>(null);
  const [selectedQuadraForBookingView, setSelectedQuadraForBookingView] = useState<Quadra | null>(null);

  useEffect(() => {
    loadQuadras();
  }, [user?.id]);

  const loadQuadras = () => {
    const allQuadras = storageService.getQuadras();
    // Filtrar apenas quadras do admin logado
    const userQuadras = allQuadras.filter(quadra => quadra.ownerId === user?.id);
    setQuadras(userQuadras);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quadraData: Quadra = {
      id: editingQuadra?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      address: formData.address,
      coordinates: {
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng)
      },
      price: parseFloat(formData.price),
      photos: formData.photos.length > 0 ? formData.photos : (editingQuadra?.photos || []),
      rating: editingQuadra?.rating || 0,
      reviews: editingQuadra?.reviews || [],
      amenities: formData.amenities.split(',').map(a => a.trim()).filter(a => a),
      ownerId: user?.id || '1', // ID do admin logado
      isActive: formData.isActive,
      createdAt: editingQuadra?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const allQuadras = storageService.getQuadras();
    let updatedQuadras;

    if (editingQuadra) {
      updatedQuadras = allQuadras.map(q => q.id === editingQuadra.id ? quadraData : q);
    } else {
      updatedQuadras = [...allQuadras, quadraData];
    }

    storageService.saveQuadras(updatedQuadras);
    // Recarregar apenas as quadras do admin logado
    loadQuadras();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      lat: '',
      lng: '',
      price: '',
      amenities: '',
      isActive: true
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
      amenities: quadra.amenities.join(', '),
      isActive: quadra.isActive,
      photos: quadra.photos
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta quadra?')) {
      const allQuadras = storageService.getQuadras();
      const updatedQuadras = allQuadras.filter(q => q.id !== id);
      storageService.saveQuadras(updatedQuadras);
      // Recarregar apenas as quadras do admin logado
      loadQuadras();
    }
  };

  const toggleActive = (id: string) => {
    const allQuadras = storageService.getQuadras();
    const updatedQuadras = allQuadras.map(q => 
      q.id === id ? { ...q, isActive: !q.isActive } : q
    );
    storageService.saveQuadras(updatedQuadras);
    // Recarregar apenas as quadras do admin logado
    loadQuadras();
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData({ ...formData, lat: lat.toString(), lng: lng.toString() });
    setShowLocationPicker(false);
  };

  const handleLocationCancel = () => {
    setShowLocationPicker(false);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      const reader = new FileReader();
      reader.onload = (e) => {
        const photoUrl = e.target?.result as string;
        setFormData({ ...formData, photos: [...(formData.photos || []), photoUrl] });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (photoIndex: number) => {
    const updatedPhotos = (formData.photos || []).filter((_, index) => index !== photoIndex);
    setFormData({ ...formData, photos: updatedPhotos });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar ao Mapa
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Quadra
          </button>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome
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
                      className="border rounded px-3 py-2 w-full h-20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço
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
                      Localização
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
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comodidades (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      value={formData.amenities}
                      onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                      className="border rounded px-3 py-2 w-full"
                      placeholder="Ex: Gramado sintético, Vestiários, Estacionamento"
                    />
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
                    <label className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">
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
                    <p className="text-sm text-gray-500 mt-1">
                      Máximo 5MB por imagem. Formatos aceitos: JPG, PNG, GIF
                    </p>
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

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      {editingQuadra ? 'Atualizar' : 'Criar'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
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
