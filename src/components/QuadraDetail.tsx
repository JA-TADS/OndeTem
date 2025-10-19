import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Quadra, Review } from '../types';
import { storageService } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { Star, MapPin, Clock, DollarSign, Camera, MessageCircle, ThumbsUp } from 'lucide-react';
import ChatSystem from './ChatSystem';
import SimpleBookingSystemV2 from './SimpleBookingSystemV2';

const QuadraDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quadra, setQuadra] = useState<Quadra | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'reservas' | 'chat'>('info');

  useEffect(() => {
    if (id) {
      const quadraData = storageService.getQuadraById(id);
      if (quadraData) {
        setQuadra(quadraData);
        setReviews(quadraData.reviews);
      }
    }
  }, [id]);

  const handleAddReview = () => {
    if (!quadra || !newReview.comment.trim() || !user) return;

    const review: Review = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      rating: newReview.rating,
      comment: newReview.comment,
      createdAt: new Date().toISOString()
    };

    const updatedReviews = [...reviews, review];
    setReviews(updatedReviews);

    // Atualizar quadra com nova review
    // Calcular rating apenas com avaliações (rating > 0), excluindo comentários
    const avaliacoes = updatedReviews.filter(r => r.rating > 0);
    const novaRating = avaliacoes.length > 0 
      ? avaliacoes.reduce((acc, r) => acc + r.rating, 0) / avaliacoes.length 
      : 0;

    const updatedQuadra = {
      ...quadra,
      reviews: updatedReviews,
      rating: novaRating
    };

    // Salvar no storage
    const allQuadras = storageService.getQuadras();
    const updatedQuadras = allQuadras.map(q => q.id === quadra.id ? updatedQuadra : q);
    storageService.saveQuadras(updatedQuadras);

    setQuadra(updatedQuadra);
    setNewReview({ rating: 5, comment: '' });
    setShowReviewForm(false);
  };

  const handleAddComment = () => {
    if (!quadra || !newComment.trim() || !user) return;

    const comment: Review = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      rating: 0, // Comentário sem avaliação
      comment: newComment,
      createdAt: new Date().toISOString()
    };

    const updatedReviews = [...reviews, comment];
    setReviews(updatedReviews);

    // Atualizar quadra
    const updatedQuadra = {
      ...quadra,
      reviews: updatedReviews
    };

    // Salvar no storage
    const allQuadras = storageService.getQuadras();
    const updatedQuadras = allQuadras.map(q => q.id === quadra.id ? updatedQuadra : q);
    storageService.saveQuadras(updatedQuadras);

    setQuadra(updatedQuadra);
    setNewComment('');
    setShowCommentForm(false);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && quadra && user) {
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
        const updatedQuadra = {
          ...quadra,
          photos: [...quadra.photos, photoUrl]
        };

        // Salvar no storage
        const allQuadras = storageService.getQuadras();
        const updatedQuadras = allQuadras.map(q => q.id === quadra.id ? updatedQuadra : q);
        storageService.saveQuadras(updatedQuadras);

        setQuadra(updatedQuadra);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (photoIndex: number) => {
    if (!quadra || !user) return;
    
    // Verificar se o usuário é admin
    const isAdmin = user.role === 'admin';
    if (!isAdmin) {
      alert('Apenas administradores podem remover fotos.');
      return;
    }
    
    const updatedPhotos = quadra.photos.filter((_, index) => index !== photoIndex);
    const updatedQuadra = {
      ...quadra,
      photos: updatedPhotos
    };

    // Salvar no storage
    const allQuadras = storageService.getQuadras();
    const updatedQuadras = allQuadras.map(q => q.id === quadra.id ? updatedQuadra : q);
    storageService.saveQuadras(updatedQuadras);

    setQuadra(updatedQuadra);
  };

  if (!quadra) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Quadra não encontrada</h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Voltar ao mapa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{quadra.name}</h1>
              <p className="text-gray-600 mt-2">{quadra.description}</p>
              <div className="flex items-center mt-4 space-x-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="ml-1 font-semibold">{quadra.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5" />
                  <span className="ml-1">{quadra.address}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <DollarSign className="h-5 w-5" />
                  <span className="ml-1">R$ {quadra.price}/hora</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Voltar ao mapa
            </button>
          </div>
        </div>

        {/* Abas de navegação */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'info'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Informações
            </button>
            <button
              onClick={() => setActiveTab('reservas')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'reservas'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="h-4 w-4 mr-2 inline" />
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
        {activeTab === 'info' && (
          <>
            {/* Fotos */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Fotos ({quadra.photos.length})</h2>
            {user && (
              <label className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer flex items-center">
                <Camera className="h-4 w-4 mr-2" />
                Adicionar Foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          
          {quadra.photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quadra.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg shadow-md"
                  />
                  {user && user.role === 'admin' && (
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover foto (apenas admin)"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Nenhuma foto adicionada ainda</p>
              {user && (
                <p className="text-sm">Clique em "Adicionar Foto" para começar</p>
              )}
            </div>
          )}
        </div>

        {/* Comodidades */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Comodidades</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {quadra.amenities.map((amenity, index) => (
              <div key={index} className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                {amenity}
              </div>
            ))}
          </div>
        </div>

        {/* Avaliações e Comentários */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Avaliações e Comentários ({reviews.length})</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Comentar
              </button>
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
              >
                <Star className="h-4 w-4 mr-2" />
                Avaliar
              </button>
            </div>
          </div>

          {showCommentForm && (
            <div className="border rounded-lg p-4 mb-4 bg-green-50">
              <h3 className="font-semibold mb-2 flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                Deixe um comentário
              </h3>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comentário
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="border rounded px-3 py-2 w-full h-20"
                  placeholder="Compartilhe sua experiência com esta quadra..."
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddComment}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Enviar Comentário
                </button>
                <button
                  onClick={() => setShowCommentForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {showReviewForm && (
            <div className="border rounded-lg p-4 mb-4 bg-blue-50">
              <h3 className="font-semibold mb-2 flex items-center">
                <Star className="h-4 w-4 mr-2" />
                Deixe sua avaliação
              </h3>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avaliação
                </label>
                <select
                  value={newReview.rating}
                  onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                  className="border rounded px-3 py-2 w-full"
                >
                  {[5, 4, 3, 2, 1].map(rating => (
                    <option key={rating} value={rating}>
                      {rating} estrelas
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comentário
                </label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="border rounded px-3 py-2 w-full h-20"
                  placeholder="Conte sua experiência..."
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddReview}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Enviar Avaliação
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className={`border-b pb-4 last:border-b-0 ${
                review.rating > 0 ? 'bg-blue-50 p-3 rounded-lg' : 'bg-green-50 p-3 rounded-lg'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="font-semibold">{review.userName}</span>
                    {review.rating > 0 && (
                      <div className="flex ml-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      review.rating > 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {review.rating > 0 ? 'Avaliação' : 'Comentário'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-gray-700">{review.comment}</p>
                {review.rating > 0 && (
                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    <span>Avaliação: {review.rating}/5 estrelas</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
          </>
        )}

        {activeTab === 'reservas' && (
          <SimpleBookingSystemV2
            quadraId={quadra.id}
            quadraName={quadra.name}
            quadraPrice={quadra.price}
          />
        )}

        {activeTab === 'chat' && (
          <ChatSystem isAdmin={false} />
        )}
      </div>
    </div>
  );
};

export default QuadraDetail;
