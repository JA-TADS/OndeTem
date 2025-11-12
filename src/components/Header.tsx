import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Settings, User, LogIn, UserPlus, Trophy } from 'lucide-react';

const Header: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 shadow-lg fixed top-0 left-0 right-0 z-[1000] border-b-4 border-green-700">
      <div className="w-full py-3">
        <div className="flex justify-between items-center px-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center hover:opacity-90 transition-all cursor-pointer group"
            title="Voltar para o mapa"
          >
            <div className="relative">
              <Trophy className="h-10 w-10 text-yellow-300 mr-3 group-hover:scale-110 transition-transform drop-shadow-lg" />
            </div>
            <h1 className="text-3xl font-sport text-white drop-shadow-lg tracking-wide">OndeTem</h1>
          </button>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg font-bold uppercase tracking-wide transform hover:scale-105"
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    Admin
                  </button>
                )}

                <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-white font-semibold">Olá, {user.name}</span>
                  
                  {/* Avatar/Perfil */}
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-green-600 hover:bg-green-50 transition-all shadow-lg hover:scale-110 border-2 border-white"
                    title="Perfil"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center text-white hover:text-yellow-200 px-4 py-2 rounded-lg hover:bg-white/20 transition-all font-semibold"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Entrar
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center bg-white text-green-600 px-6 py-2 rounded-xl hover:bg-yellow-50 transition-all shadow-lg font-bold uppercase tracking-wide transform hover:scale-105"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Cadastrar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
