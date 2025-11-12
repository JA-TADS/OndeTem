import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Quadra, Review } from '../types';
import { storageService } from '../services/storage';
import { firebaseService, auth } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Star, MapPin, Clock, DollarSign, Camera, X, MessageCircle } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'info' | 'reservas' | 'chat'>('info');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [hasConfirmedBooking, setHasConfirmedBooking] = useState(false);
  const [editingReview, setEditingReview] = useState(false);

  useEffect(() => {
    const loadQuadra = async () => {
      if (id) {
        setLoading(true);
        try {
          // Limpar cache para garantir dados atualizados
          storageService.clearCache();
          const quadraData = await storageService.getQuadraById(id);
          if (quadraData) {
            setQuadra(quadraData);
            
            // Carregar reviews da coleção reviews do Firebase
            try {
              const reviewsFromFirebase = await firebaseService.getReviewsByQuadraId(id);
              // Filtrar apenas avaliações (rating > 0)
              const avaliacoes = reviewsFromFirebase.filter(r => r.rating > 0);
              setReviews(avaliacoes);
              
              // Verificar se o usuário já tem uma avaliação
              if (user) {
                const existingReview = avaliacoes.find(r => r.userId === user.id);
                if (existingReview) {
                  setUserReview(existingReview);
                  setNewReview({ rating: existingReview.rating, comment: existingReview.comment || '' });
                } else {
                  setUserReview(null);
                }
                
                // Verificar se o usuário tem reservas confirmadas nesta quadra
                const allBookings = await storageService.getBookings();
                const userBookings = allBookings.filter(
                  booking => booking.userId === user.id && 
                             booking.quadraId === id && 
                             booking.status === 'confirmed'
                );
                setHasConfirmedBooking(userBookings.length > 0);
              }
              
              // Calcular rating baseado nas avaliações
              const novoRating = avaliacoes.length > 0 
                ? avaliacoes.reduce((acc, r) => acc + r.rating, 0) / avaliacoes.length 
                : 0;
              
              // Atualizar rating da quadra se mudou
              if (Math.abs(quadraData.rating - novoRating) > 0.01) {
                const quadraAtualizada = {
                  ...quadraData,
                  rating: novoRating
                };
                setQuadra(quadraAtualizada);
                // Atualizar no Firebase (apenas o rating, se possível)
                try {
                  await firebaseService.updateQuadraRating(id, novoRating);
                } catch (error) {
                  console.warn('Não foi possível atualizar o rating no Firebase (apenas admins podem):', error);
                }
              }
            } catch (error) {
              console.error('Erro ao carregar reviews:', error);
              // Se houver erro ao carregar reviews, usar reviews da quadra
              setReviews(quadraData.reviews?.filter(r => r.rating > 0) || []);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar quadra:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadQuadra();
  }, [id, user]);

  const handleAddReview = async () => {
    if (!quadra || !user) {
      alert('Você precisa fazer login para avaliar. Por favor, faça login primeiro.');
      return;
    }
    
    // Verificar se o usuário tem reservas confirmadas
    if (!hasConfirmedBooking) {
      alert('Você só pode avaliar quadras onde já fez pelo menos uma reserva confirmada.');
      return;
    }
    
    if (!newReview.rating || newReview.rating < 1 || newReview.rating > 5) {
      alert('Por favor, selecione uma avaliação de 1 a 5 estrelas.');
      return;
    }

    // Verificar autenticação do Firebase antes de tentar salvar
    if (!auth.currentUser) {
      console.error('Usuário não autenticado no Firebase Auth');
      alert('Sua sessão expirou. Por favor, faça login novamente.');
      navigate('/login');
      return;
    }

    try {
      let savedReview: Review;
      
      if (userReview && editingReview) {
        // Atualizar avaliação existente
        const updatedReview: Review = {
          ...userReview,
          rating: newReview.rating,
          comment: newReview.comment
        };
        
        await firebaseService.updateReview(userReview.id, updatedReview);
        savedReview = updatedReview;
        
        // Atualizar na lista de reviews
        const updatedReviews = reviews.map(r => r.id === userReview.id ? savedReview : r);
        setReviews(updatedReviews);
        setUserReview(savedReview);
      } else {
        // Criar nova avaliação
        const review: Omit<Review, 'id' | 'createdAt'> = {
          userId: user.id,
          userName: user.name,
          rating: newReview.rating,
          comment: newReview.comment,
          quadraId: quadra.id
        };

        // Salvar review individualmente no Firebase (Firebase gerará o ID)
        const reviewId = await firebaseService.saveReview(review);
        
        // Criar review completo com o ID retornado pelo Firebase
        savedReview = {
          ...review,
          id: reviewId,
          createdAt: new Date().toISOString() // Adicionar createdAt para exibição
        };

        const updatedReviews = [...reviews, savedReview];
        setReviews(updatedReviews);
        setUserReview(savedReview);
      }

      // Calcular novo rating baseado em todas as avaliações
      const allReviews = userReview && editingReview 
        ? reviews.map(r => r.id === userReview.id ? savedReview : r)
        : [...reviews, savedReview];
      
      const novaRating = allReviews.length > 0 
        ? allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length 
        : 0;

      const updatedQuadra = {
        ...quadra,
        rating: novaRating
      };

      // Atualizar localmente
      setQuadra(updatedQuadra);
      
      // Tentar atualizar o rating no Firebase (apenas o campo rating)
      try {
        await firebaseService.updateQuadraRating(quadra.id, novaRating);
        console.log('Rating atualizado no Firebase com sucesso');
      } catch (error) {
        console.warn('Não foi possível atualizar o rating no Firebase:', error);
      }

      setNewReview({ rating: 5, comment: '' });
      setShowReviewForm(false);
      setEditingReview(false);
      alert(editingReview ? 'Avaliação atualizada com sucesso!' : 'Avaliação enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar avaliação:', error);
      console.error('Código do erro:', error?.code);
      console.error('Mensagem do erro:', error?.message);
      
      if (error?.code === 'permission-denied') {
        alert('Erro de permissão: Verifique se você está logado e se as regras do Firestore permitem criação de avaliações.');
      } else {
        alert(`Erro ao salvar avaliação: ${error?.message || 'Erro desconhecido'}. Por favor, tente novamente.`);
      }
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Carregando detalhes da quadra...</p>
        </div>
      </div>
    );
  }

  if (!quadra) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-orange-50">
        <div className="text-center">
          <h2 className="text-3xl font-sport text-gray-900 mb-2">Quadra não encontrada</h2>
          <p className="text-gray-600 mb-4">A quadra que você está procurando não existe ou foi removida.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-600 font-bold uppercase tracking-wide transform hover:scale-105 transition-all shadow-lg"
          >
            Voltar ao mapa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-orange-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden">
          {quadra.photos && quadra.photos.length > 0 && (
            <img 
              src={quadra.photos[0]} 
              alt={quadra.name}
              className="w-full h-64 object-cover"
              style={{ borderRadius: 0 }}
              onError={(e) => {
                // Se a imagem falhar ao carregar, ocultar
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-sport text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 mb-2">{quadra.name}</h1>
              <p className="text-gray-600 mt-2 font-medium">{quadra.description}</p>
              <div className="flex items-center mt-4 space-x-6">
                <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="ml-1 font-bold text-gray-900">{quadra.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center text-gray-700 font-medium">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span className="ml-1">{quadra.address}</span>
                </div>
                <div className="flex items-center bg-green-50 px-3 py-1 rounded-full">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="ml-1 font-bold text-gray-900">R$ {quadra.price}/hora</span>
                </div>
              </div>
              </div>
              <button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-2 rounded-xl hover:from-gray-700 hover:to-gray-800 font-bold uppercase tracking-wide transform hover:scale-105 transition-all shadow-lg"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>

        {/* Abas de navegação */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-lg border-2 border-gray-200">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-all uppercase tracking-wide ${
                activeTab === 'info'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Informações
            </button>
            <button
              onClick={() => setActiveTab('reservas')}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-all uppercase tracking-wide ${
                activeTab === 'reservas'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Clock className="h-4 w-4 mr-2 inline" />
              Reservas
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-all uppercase tracking-wide ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
          <div className="mb-4">
            <h2 className="text-xl font-bold">Fotos ({quadra.photos.length})</h2>
          </div>
          
          {quadra.photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quadra.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedPhoto(photo)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Nenhuma foto adicionada ainda</p>
            </div>
          )}
        </div>

        {/* Comodidades */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Comodidades</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {quadra.amenities.map((amenity, index) => (
              <div key={index} className="text-gray-700">
                {amenity}
              </div>
            ))}
          </div>
        </div>

        {/* Avaliações */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Avaliações ({reviews.length})</h2>
            {user && hasConfirmedBooking && (
              <button
                onClick={() => {
                  if (userReview) {
                    // Se já tem avaliação, abrir para edição
                    setEditingReview(true);
                    setNewReview({ rating: userReview.rating, comment: userReview.comment || '' });
                  } else {
                    // Se não tem avaliação, abrir para criar
                    setEditingReview(false);
                    setNewReview({ rating: 5, comment: '' });
                  }
                  setShowReviewForm(!showReviewForm);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
              >
                <Star className="h-4 w-4 mr-2" />
                {userReview ? 'Editar Avaliação' : 'Avaliar'}
              </button>
            )}
            {user && !hasConfirmedBooking && (
              <span className="text-sm text-gray-500 italic">
                Faça uma reserva para poder avaliar
              </span>
            )}
            {!user && (
              <button
                onClick={() => {
                  alert('Você precisa fazer login para avaliar. Por favor, faça login primeiro.');
                  navigate('/login');
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 flex items-center"
              >
                <Star className="h-4 w-4 mr-2" />
                Avaliar
              </button>
            )}
          </div>

          {showReviewForm && (
            <div className="border rounded-lg p-4 mb-4 bg-blue-50">
              <h3 className="font-semibold mb-2 flex items-center">
                <Star className="h-4 w-4 mr-2" />
                {editingReview ? 'Editar sua avaliação' : 'Deixe sua avaliação'}
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
                  Comentário (opcional)
                </label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="border rounded px-3 py-2 w-full h-20"
                  placeholder="Conte sua experiência (opcional)..."
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddReview}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {editingReview ? 'Atualizar Avaliação' : 'Enviar Avaliação'}
                </button>
                <button
                  onClick={() => {
                    setShowReviewForm(false);
                    setEditingReview(false);
                    if (userReview) {
                      setNewReview({ rating: userReview.rating, comment: userReview.comment || '' });
                    } else {
                      setNewReview({ rating: 5, comment: '' });
                    }
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Nenhuma avaliação ainda</p>
                <p className="text-sm">Seja o primeiro a avaliar esta quadra!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className={`border-b pb-4 last:border-b-0 p-3 rounded-lg ${
                  user && review.userId === user.id ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="font-semibold">
                        {review.userName}
                        {user && review.userId === user.id && (
                          <span className="ml-2 text-xs text-gray-500">(Você)</span>
                        )}
                      </span>
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
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 mt-2">{review.comment}</p>
                  )}
                </div>
              ))
            )}
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
          <ChatSystem isAdmin={false} quadraId={quadra.id} />
        )}
      </div>

      {/* Modal de Zoom da Foto */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] p-4">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 rounded-full p-2 hover:bg-gray-200 transition-colors z-10"
              title="Fechar"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selectedPhoto}
              alt="Foto ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuadraDetail;
