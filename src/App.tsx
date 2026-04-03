// Main Application Component
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  Home, 
  PlusSquare, 
  MessageCircle, 
  User, 
  Heart, 
  MessageSquare, 
  Share2, 
  MapPin, 
  Star, 
  ChevronLeft, 
  MoreVertical, 
  Send, 
  Bell, 
  Settings, 
  LogOut, 
  Camera, 
  CheckCircle2, 
  X,
  Plus,
  Filter,
  Calendar,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Menu,
  HelpCircle,
  FileText,
  LifeBuoy,
  Shield,
  Grid,
  Wrench,
  Sparkles,
  Scissors,
  Paintbrush,
  MoreHorizontal,
  ShoppingBag,
  Phone,
  Image as ImageIcon,
  ZoomIn,
  Mail,
  AlertTriangle,
  Check,
  CheckCircle,
  Flame,
  Trophy,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './supabase';

import SettingsScreen from './components/SettingsScreen';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type View = 
  | 'splash' 
  | 'onboarding' 
  | 'auth' 
  | 'feed' 
  | 'marketplace' 
  | 'explore' 
  | 'notifications' 
  | 'chat' 
  | 'profile' 
  | 'panel'
  | 'reservations'
  | 'service-detail' 
  | 'create-post' 
  | 'create-service' 
  | 'settings' 
  | 'support' 
  | 'public-profile'
  | 'verification'
  | 'category-view';

interface Profile {
  id: string;
  name: string;
  displayName: string | null;
  email: string;
  photoUrl: string;
  photoURL: string | null;
  bio: string | null;
  category: string | null;
  location: string | null;
  verified: boolean;
  verificationStatus: string;
  plan: string;
  created_at: string;
  role: string;
  terms_accepted: boolean;
  followers_count?: number;
  following_count?: number;
}

interface Post {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  profiles: Profile;
  has_liked?: boolean;
  category?: string;
  location?: string;
  available_hours?: string;
  phone_number?: string;
}

interface Service {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  description: string;
  price: string;
  image_url: string;
  category: string;
  location: string;
  rating?: number;
  reviews_count?: number;
  profiles: Profile;
}

interface Comment {
  id: string;
  created_at: string;
  user_id: string;
  post_id: string;
  content: string;
  parent_id?: string;
  profiles: Profile;
}

// --- Components ---

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative flex flex-col items-center"
      >
        {/* Logo increased size */}
        <img 
          src="https://mevdfyahjuxwdfxwqtov.supabase.co/storage/v1/object/public/services/c7f8d6d0-ca82-43cf-934a-32c7f773b611/avatar-1774531380126.jpg" 
          alt="Logo" 
          className="w-40 h-40 object-contain"
          referrerPolicy="no-referrer"
        />
        {/* 4-dot loading animation */}
        <div className="flex gap-1 mt-6">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-600 rounded-full"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
      {/* Footer app name */}
      <div className="absolute bottom-8 w-full text-center">
        <p className="text-sm font-bold text-blue-600">Serviços Já</p>
      </div>
    </div>
  );
};

const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[100]">
    <div className="bg-white p-4 rounded-[3px] shadow-xl flex flex-col items-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-2 text-sm font-medium text-gray-600">Carregando...</p>
    </div>
  </div>
);

const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center w-full py-1.5 transition-colors rounded-[3px]",
      active ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
    )}
  >
    <Icon size={20} strokeWidth={3} />
    <span className="text-[9px] mt-0.5 font-bold">{label}</span>
  </button>
);

const PostCard: React.FC<{ post: Post, onLike: (id: string) => void | Promise<void>, onComment: (post: Post) => void, onProfileClick: (id: string) => void, onPostClick?: (post: Post) => void, isDetail?: boolean }> = ({ post, onLike, onComment, onProfileClick, onPostClick, isDetail }) => {
  const [isExpanded, setIsExpanded] = useState(isDetail || false);
  const [showOptions, setShowOptions] = useState(false);
  const authorName = post.profiles?.name || 'Usuário';
  const authorAvatar = post.profiles?.photoUrl || `https://ui-avatars.com/api/?name=${authorName}`;
  const isLongDescription = post.description && post.description.length > 200;

  return (
    <div className="bg-white border-b-[2.5px] border-[#D1D5DB]">
      {/* Header - Minimalist on white */}
      <div className="p-4 flex items-center justify-between relative">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onProfileClick(post.user_id)}>
          <img 
            src={authorAvatar} 
            className="w-[40px] h-[40px] rounded-[3px] object-cover border border-[#D1D5DB]"
            alt={authorName}
          />
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              {authorName}
              {post.profiles?.verified && <CheckCircle2 size={12} className="text-blue-500 fill-blue-500" />}
            </h3>
            <div className="flex items-center gap-1.5">
              <p className="text-[9px] text-gray-500 font-medium">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}</p>
              {post.location && (
                <>
                  <span className="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
                  <p className="text-[9px] text-gray-500 font-bold flex items-center gap-0.5">
                    <MapPin size={8} />
                    {post.location}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">{post.title}</span>
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowOptions(!showOptions); }}
              className="text-gray-400 p-1 hover:bg-gray-50 rounded-[3px] transition-colors"
            >
              <MoreVertical size={18} strokeWidth={3} />
            </button>

            {/* Options Dropdown */}
            {showOptions && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowOptions(false)}
                />
                <div className="absolute right-0 mt-2 w-40 bg-white border border-[#D1D5DB] rounded-[3px] shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setShowOptions(false);
                      /* Handle report logic */
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <AlertTriangle size={16} strokeWidth={3} />
                    <span className="text-xs font-black uppercase tracking-widest">Denunciar</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image with Vertical Actions */}
      <div className="relative group">
        {post.image_url && (
          <div 
            className={cn("w-full bg-gray-50 flex items-center justify-center", onPostClick && "cursor-pointer")} 
            onClick={() => onPostClick?.(post)}
          >
            <img 
              src={post.image_url} 
              className="w-full h-auto object-contain max-h-[500px]" 
              alt={post.title}
            />
          </div>
        )}

        {/* Vertical Actions Overlay - Adaptive using mix-blend-mode */}
        <div className="absolute right-3 bottom-6 flex flex-col items-center gap-5 z-10 mix-blend-difference">
          <button 
            onClick={(e) => { e.stopPropagation(); onLike(post.id); }}
            className={cn(
              "flex flex-col items-center gap-1 transition-all active:scale-90",
              post.has_liked ? "text-red-500" : "text-white"
            )}
          >
            <Heart size={28} fill={post.has_liked ? "currentColor" : "none"} strokeWidth={2.5} />
            <span className="text-[10px] font-black text-white">{(Number(post.likes_count) || 0).toLocaleString('pt-BR')}</span>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onComment(post); }}
            className="flex flex-col items-center gap-1 text-white transition-all active:scale-90"
          >
            <MessageSquare size={28} strokeWidth={2.5} />
            <span className="text-[10px] font-black text-white">{(Number(post.comments_count) || 0).toLocaleString('pt-BR')}</span>
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); }}
            className="flex flex-col items-center gap-1 text-white transition-all active:scale-90"
          >
            <Share2 size={28} strokeWidth={2.5} />
            <span className="text-[10px] font-black text-white">{(Number(post.shares_count) || 0).toLocaleString('pt-BR')}</span>
          </button>
        </div>
      </div>

      {/* Follow Button - Below image, right aligned */}
      <div className="mt-2 px-4 flex justify-end">
        <button 
          className="bg-blue-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-[3px] active:scale-95 transition-transform shadow-sm"
          onClick={(e) => { e.stopPropagation(); }}
        >
          Seguir
        </button>
      </div>

      {/* Description Only */}
      <div className="px-4 pt-[4px] pb-4">
        <p 
          className={cn(
            "text-xs text-gray-900 font-medium leading-relaxed",
            !isExpanded && "line-clamp-4",
            onPostClick && "cursor-pointer"
          )}
          onClick={() => onPostClick?.(post)}
        >
          {post.description}
        </p>
        {isLongDescription && !isExpanded && (
          <div className="mt-1">
            <button 
              onClick={() => setIsExpanded(true)}
              className="text-gray-500 text-[10px] font-bold"
            >
              ...ver mais
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ServiceCard: React.FC<{ service: Service, onClick: () => void }> = ({ service, onClick }) => {
  const authorName = service.profiles?.name || 'Usuário';
  const authorAvatar = service.profiles?.photoUrl || `https://ui-avatars.com/api/?name=${authorName}`;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-[3px] overflow-hidden border border-[#D1D5DB] cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="aspect-[4/3] relative">
        <img 
          src={service.image_url || 'https://picsum.photos/seed/service/400/300'} 
          className="w-full h-full object-cover"
          alt={service.title}
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-[3px] flex items-center gap-1 border border-[#D1D5DB] shadow-sm">
          <Star size={10} className="text-yellow-500 fill-yellow-500" />
          <span className="text-[9px] font-bold text-gray-900">{service.rating || '4.8'}</span>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-[2px] uppercase tracking-wider">
            {service.category}
          </span>
        </div>
        <h3 className="text-xs font-bold text-gray-900 line-clamp-1 mb-1">{service.title}</h3>
        <div className="flex items-center gap-1 text-gray-500 mb-2">
          <MapPin size={10} />
          <span className="text-[9px]">{service.location}</span>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t-[2.5px] border-[#D1D5DB]">
          <p className="text-xs font-black text-blue-600">{service.price}</p>
          <div className="flex items-center gap-1.5">
            <img 
              src={authorAvatar} 
              className="w-[24px] h-[24px] rounded-[3px] object-cover border border-[#D1D5DB]"
              alt={authorName}
            />
            <span className="text-[9px] text-gray-600 font-bold">{authorName.split(' ')[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CommentsView = ({ post, onClose, userProfile }: { post: Post, onClose: () => void, userProfile: Profile | null }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(*)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userProfile) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: userProfile.id,
          content: newComment.trim()
        })
        .select('*, profiles(*)')
        .single();

      if (error) throw error;
      setComments([...comments, data]);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-white z-[70] flex flex-col"
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <MessageSquare size={20} />
          Comentários
        </h2>
        <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:bg-gray-50 rounded-[3px] transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare size={48} className="mx-auto text-gray-200 mb-2" />
            <p className="text-gray-500 font-medium">Nenhum comentário ainda.</p>
            <p className="text-xs text-gray-400">Seja o primeiro a comentar!</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <img 
                src={comment.profiles.photoUrl || `https://ui-avatars.com/api/?name=${comment.profiles.name}`} 
                className="w-8 h-8 rounded-[3px] object-cover"
                alt={comment.profiles.name}
              />
              <div className="flex-1">
                <div className="bg-gray-50 p-3 rounded-[3px] rounded-tl-none border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-900 mb-1">{comment.profiles.name}</h4>
                  <p className="text-sm text-gray-700 font-medium">{comment.content}</p>
                </div>
                <div className="flex items-center gap-4 mt-1.5 ml-1">
                  <span className="text-[10px] font-bold text-gray-400">
                    {formatDistanceToNow(new Date(comment.created_at), { locale: ptBR })}
                  </span>
                  {(userProfile?.id === comment.user_id || userProfile?.id === post.user_id) && (
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      className="text-[10px] text-red-500 font-bold rounded-[3px] px-1.5 py-0.5 hover:bg-red-50 transition-colors"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="fixed bottom-0 left-0 right-0 p-4 border-t border-gray-100 flex items-center gap-3 bg-white z-20 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <img 
          src={userProfile?.photoUrl || `https://ui-avatars.com/api/?name=${userProfile?.name}`} 
          className="w-10 h-10 rounded-[3px] object-cover"
          alt="Seu avatar"
        />
        <div className="flex-1 relative">
          <input 
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicione um comentário..."
            className="w-full bg-gray-50 border border-gray-200 rounded-[3px] py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <button 
          disabled={!newComment.trim()}
          className="bg-blue-600 text-white font-bold text-sm disabled:opacity-50 rounded-[3px] px-4 py-3 hover:bg-blue-700 transition-colors active:scale-95 flex items-center justify-center"
        >
          <Send size={18} />
        </button>
      </form>
    </motion.div>
  );
};

const PostDetailView = ({ post, onClose, userProfile, onLike, onProfileClick, onCommentClick, onChatClick, onBookClick, onPostClick }: { post: Post, onClose: () => void, userProfile: Profile | null, onLike: (id: string) => void | Promise<void>, onProfileClick: (id: string) => void, onCommentClick: () => void, onChatClick: (userId: string) => void, onBookClick: (post: Post) => void, onPostClick?: (post: Post) => void }) => {
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRelated = async () => {
      setLoadingRelated(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*, profiles(*)')
          .eq('category', post.category)
          .neq('id', post.id)
          .limit(5);

        if (error) throw error;
        setRelatedPosts(data || []);
      } catch (err) {
        console.error('Error fetching related posts:', err);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelated();
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [post.id, post.category]);

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-gray-50 z-[60] flex flex-col"
    >
      <div className="bg-white p-4 border-b-[2.5px] border-[#D1D5DB] flex items-center justify-between sticky top-0 z-10">
        <button onClick={onClose} className="p-1.5 -ml-2 rounded-[3px] hover:bg-gray-50 text-gray-900">
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <h2 className="text-lg font-black text-gray-900">Detalhes do Anúncio</h2>
        <div className="w-10" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-20 bg-white">
        {/* Title & Meta */}
        <div className="p-4 border-b-[2.5px] border-[#D1D5DB]">
          <h1 className="text-xl font-bold text-gray-900 leading-tight mb-2">
            {post.title || 'Publicação'}
          </h1>
          <div className="text-xs text-gray-500 flex items-center gap-2 mb-4">
            <span>Adicionado {format(new Date(post.created_at), 'MMM dd, yyyy', { locale: ptBR })}</span>
            <span>|</span>
            <span>Visualizações: {Math.floor(Math.random() * 500) + 50}</span>
          </div>
          <button className="w-full bg-[#1b4b6b] text-white text-sm font-bold py-3 rounded-[3px] mb-2">
            Informar-me quando o preço baixar!
          </button>
        </div>

        {/* Image */}
        {post.image_url && (
          <div className="relative w-full bg-gray-100 aspect-square">
            <img src={post.image_url} alt={post.title} className="w-full h-full object-contain" />
            <button className="absolute bottom-4 right-4 bg-black/50 p-2 rounded-[3px] text-white">
              <ZoomIn size={20} />
            </button>
          </div>
        )}

        {/* Attributes Grid */}
        <div className="p-4 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
            <div>
              <span className="text-gray-500 block mb-1">Localização:</span>
              <span className="text-gray-900 font-medium">{post.location || 'Não informada'}</span>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">Categoria:</span>
              <span className="text-gray-900 font-medium">{post.category || 'Geral'}</span>
            </div>
            {post.available_hours && (
              <div>
                <span className="text-gray-500 block mb-1">Horário:</span>
                <span className="text-gray-900 font-medium">{post.available_hours}</span>
              </div>
            )}
            {post.phone_number && (
              <div>
                <span className="text-gray-500 block mb-1">Telefone:</span>
                <span className="text-gray-900 font-medium">{post.phone_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">Descrição</h3>
          <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
            {post.description}
          </p>
        </div>

        {/* Author Card */}
        <div className="p-4 bg-gray-50">
          <div className="bg-white border border-gray-200 rounded-[3px] p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <img 
                  src={post.profiles?.photoUrl || `https://ui-avatars.com/api/?name=${post.profiles?.name}`} 
                  className="w-12 h-12 rounded-[3px] object-cover"
                  alt={post.profiles?.name}
                />
                {post.profiles?.verified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-0.5 rounded-full border-2 border-white">
                    <Check size={10} strokeWidth={4} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1">
                  {post.profiles?.name}
                  {post.profiles?.verified && <CheckCircle size={16} className="text-blue-500" />}
                </h3>
                <p className="text-xs text-gray-500">Utilizador desde: {format(new Date(post.profiles?.created_at || new Date()), 'MMM dd, yyyy', { locale: ptBR })}</p>
                <button 
                  onClick={() => { onClose(); onProfileClick(post.user_id); }}
                  className="text-blue-600 text-xs font-medium mt-1 hover:underline"
                >
                  Ver todos anúncios »
                </button>
              </div>
            </div>

            {/* Contact Buttons */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button 
                  onClick={() => post.phone_number ? window.location.href = `tel:${post.phone_number}` : alert('Telefone não disponível')}
                  className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-[4px] flex items-center justify-center gap-2 text-sm active:scale-[0.98] transition-transform"
                >
                  <Phone size={16} />
                  Chamar
                </button>
                <button 
                  onClick={() => onChatClick(post.user_id)}
                  className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-[4px] flex items-center justify-center gap-2 text-sm active:scale-[0.98] transition-transform"
                >
                  <MessageCircle size={16} />
                  Mensagem
                </button>
              </div>
              <button 
                onClick={() => onBookClick(post)}
                className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-[4px] flex items-center justify-center gap-2 text-sm active:scale-[0.98] transition-transform shadow-md shadow-blue-200"
              >
                <Calendar size={16} />
                Reservar
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-2 rounded-[3px] flex items-center justify-center gap-1.5 text-xs">
                <Share2 size={14} />
                Recomendar
              </button>
              <button className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-2 rounded-[3px] flex items-center justify-center gap-1.5 text-xs">
                <AlertTriangle size={14} />
                Denunciar
              </button>
              <button 
                onClick={() => onLike(post.id)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-2 rounded-[3px] flex items-center justify-center gap-1.5 text-xs"
              >
                <Heart size={14} className={post.has_liked ? "fill-red-500 text-red-500" : ""} />
                Favoritos
              </button>
            </div>
          </div>
        </div>

        {/* Related Services */}
        <div className="p-4 border-t-[2.5px] border-[#D1D5DB] mt-4">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Serviços Relacionados</h3>
          {loadingRelated ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-20 h-20 bg-gray-100 rounded-[3px]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : relatedPosts.length > 0 ? (
            <div className="space-y-4">
              {relatedPosts.map(related => (
                <div 
                  key={related.id} 
                  className="flex gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => onPostClick?.(related)}
                >
                  <img 
                    src={related.image_url || 'https://picsum.photos/seed/rel/200/200'} 
                    className="w-20 h-20 rounded-[3px] object-cover bg-gray-50"
                    alt={related.title}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{related.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{related.description}</p>
                    <p className="text-xs font-bold text-blue-600 mt-1">{related.location}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Nenhum serviço relacionado encontrado.</p>
          )}
        </div>
        
        {/* Interaction Bar (Like/Comment) */}
        <div className="p-4 bg-white border-t-[2.5px] border-[#D1D5DB] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onLike(post.id)}
              className="flex items-center gap-1.5 text-gray-600"
            >
              <Heart size={20} className={post.has_liked ? "fill-red-500 text-red-500" : ""} />
              <span className="text-sm font-medium">{post.likes_count || 0}</span>
            </button>
            <button 
              onClick={onCommentClick}
              className="flex items-center gap-1.5 text-gray-600"
            >
              <MessageSquare size={20} />
              <span className="text-sm font-medium">{post.comments_count || 0}</span>
            </button>
          </div>
          <button className="text-gray-600">
            <Share2 size={20} />
          </button>
        </div>

      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<View>('splash');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Profile[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showDirectChat, setShowDirectChat] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState<Post | null>(null);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [envError, setEnvError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const authInitialized = useRef(false);

  useEffect(() => {
    // Check for required environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setEnvError('As variáveis de ambiente do Supabase estão faltando. Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
      setLoading(false);
      return;
    }
  }, []);

  useEffect(() => {
    if (activeCategory === 'find' && view === 'category-view') {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [activeCategory, view]);
  const fetchingProfileId = useRef<string | null>(null);

  const categories = [
    { id: 'find', name: 'Encontrar', icon: Search },
    { id: 'popular', name: 'Populares', icon: Flame },
    { id: 'nearby', name: 'Perto', icon: MapPin },
    { id: 'top', name: 'Top', icon: Trophy },
    { id: 'categories', name: 'Categorias', icon: LayoutGrid },
  ];

  const fetchProfile = useCallback(async (userId: string, metadata?: any) => {
    if (fetchingProfileId.current === userId) return;
    fetchingProfileId.current = userId;

    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Get metadata from either the passed metadata or the current user state
      const userMetadata = metadata;
      
      // Google often uses 'name' and 'picture' instead of 'name' and 'photoUrl'
      const name = userMetadata?.full_name || userMetadata?.name || 'Usuário';
      const photoUrl = userMetadata?.avatar_url || userMetadata?.photoUrl || userMetadata?.picture || '';

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...');
          // Profile doesn't exist, create it
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({ 
              id: userId, 
              name: name, 
              photoUrl: photoUrl,
              email: userMetadata?.email || '',
              role: 'user',
              plan: 'free',
              verified: false,
              verificationStatus: 'none',
              terms_accepted: true
            })
            .select('*')
            .single();
          
          if (createError) throw createError;
          console.log('New profile created:', newProfile);
          setProfile(newProfile);
        } else {
          throw error;
        }
      } else {
        console.log('Profile found:', data);
        
        // If profile exists but name/avatar is missing, update it from metadata
        let updatedData: any = {};
        let shouldUpdate = false;

        if ((!data.name || data.name === 'Usuário') && name !== 'Usuário') {
           updatedData.name = name;
           shouldUpdate = true;
        }
        if (!data.photoUrl && photoUrl) {
           updatedData.photoUrl = photoUrl;
           shouldUpdate = true;
        }

        if (shouldUpdate) {
           console.log('Updating existing profile with metadata:', updatedData);
           const { data: updatedProfile } = await supabase
             .from('profiles')
             .update(updatedData)
             .eq('id', userId)
             .select('*')
             .single();
           
           if (updatedProfile) {
             setProfile(updatedProfile);
             return;
           }
        }
        
        setProfile(data);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    } finally {
      fetchingProfileId.current = null;
    }
  }, []);

  // Auth Listener
  useEffect(() => {
    if (authInitialized.current) return;
    authInitialized.current = true;

    const initAuth = async () => {
      try {
        // Use getUser() instead of getSession() for better security
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          // If there's an error, it might just mean no session
          setUser(null);
          setProfile(null);
        } else if (user) {
          setUser(user);
          await fetchProfile(user.id, user.user_metadata);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (currentUser) {
          await fetchProfile(currentUser.id, currentUser.user_metadata);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Hash Routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const validViews: View[] = ['feed', 'marketplace', 'explore', 'notifications', 'chat', 'profile', 'settings', 'support'];
        if (validViews.includes(hash as View)) {
          setView(prev => {
            // Do not override splash or onboarding screens
            if (prev === 'splash' || prev === 'onboarding') return prev;
            return prev !== hash ? (hash as View) : prev;
          });
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Do not call handleHashChange() on mount to ensure splash screen always shows first
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []); // Run only once on mount

  useEffect(() => {
    const hashViews: View[] = ['feed', 'marketplace', 'explore', 'notifications', 'chat', 'profile', 'settings', 'support'];
    if (hashViews.includes(view)) {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash !== view) {
        window.location.hash = view;
      }
    }
  }, [view]);

  // Data Fetching
  useEffect(() => {
    fetchPosts();
    fetchServices();
    fetchProfessionals();
  }, [user]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Check likes for current user
      if (user) {
        const { data: userLikes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id);
        
        const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
        const postsWithLikes = data?.map(p => ({
          ...p,
          has_liked: likedPostIds.has(p.id)
        })) || [];
        setPosts(postsWithLikes);
      } else {
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*, profiles!provider_id(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'provider')
        .limit(20);

      if (error) throw error;
      setProfessionals(data || []);
    } catch (err) {
      console.error('Error fetching professionals:', err);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiking = !post.has_liked;

    // Optimistic update
    setPosts(posts.map(p => p.id === postId ? {
      ...p,
      has_liked: isLiking,
      likes_count: isLiking ? p.likes_count + 1 : p.likes_count - 1
    } : p));

    try {
      if (isLiking) {
        await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
      } else {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Rollback
      setPosts(posts.map(p => p.id === postId ? post : p));
    }
  };

  const handleLogout = React.useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setView('onboarding');
  }, []);

  const handleSettings = React.useCallback(() => setView('settings'), []);
  const handleBackToProfile = React.useCallback(() => setView('profile'), []);

  const handleSplashComplete = React.useCallback(() => {
    setView('onboarding');
  }, []);

  const handleAuthComplete = React.useCallback(() => setView('feed'), []);

  if (view === 'splash') return <SplashScreen onComplete={handleSplashComplete} />;

  if (envError) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Erro de Configuração</h1>
        <p className="text-gray-600 text-sm max-w-xs">
          {envError}
        </p>
        <div className="mt-6 p-4 bg-gray-50 rounded-[3px] text-left text-[10px] font-mono text-gray-500 border border-gray-200">
          Dica: No GitHub/Vercel/Netlify, adicione as variáveis de ambiente nas configurações do projeto.
        </div>
      </div>
    );
  }

  if (loading) return <LoadingOverlay />;

  if (view === 'onboarding') {
    return (
      <div className="min-h-screen bg-white flex flex-col p-6">
        {/* Top: Logo on the left */}
        <div className="flex justify-start pt-8 pb-4">
          <img 
            src="https://mevdfyahjuxwdfxwqtov.supabase.co/storage/v1/object/public/services/c7f8d6d0-ca82-43cf-934a-32c7f773b611/avatar-1774531380126.jpg" 
            alt="Logo" 
            className="w-16 h-16 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl font-black mb-4 tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent leading-tight">
              A plataforma mais segura para contratar e oferecer serviços.
            </h1>
            <p className="text-gray-500 text-base leading-relaxed mb-10">
              Encontre os melhores profissionais ou ofereça seus serviços para milhares de clientes na sua região.
            </p>
          </motion.div>
        </div>

        <div className="space-y-3 pb-8">
          <button 
            onClick={() => setView(user ? 'feed' : 'auth')}
            className="w-full bg-blue-600 text-white py-3 rounded-[4px] font-bold text-sm shadow-md shadow-blue-200 active:scale-[0.98] transition-transform flex items-center justify-center"
          >
            {user ? 'Continuar para o App' : 'Entrar'}
          </button>
          {!user && (
            <button 
              onClick={() => setView('feed')}
              className="w-full bg-white border border-blue-600 text-blue-600 py-3 rounded-[4px] font-bold text-sm active:scale-[0.98] transition-transform flex items-center justify-center"
            >
              Explorar como Visitante
            </button>
          )}
        </div>
      </div>
    );
  }

  if (view === 'auth') {
    return <AuthView onComplete={handleAuthComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Side Menu */}
      <AnimatePresence>
        {showSideMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSideMenu(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: 280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 280, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-4 top-16 bottom-4 w-[280px] bg-white z-[60] shadow-2xl flex flex-col overflow-hidden border border-[#D1D5DB]"
              style={{ borderRadius: '3px' }}
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                <button onClick={() => setShowSideMenu(false)} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-[3px]">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-2">
                <button 
                  onClick={() => { setView('settings'); setShowSideMenu(false); }}
                  className="w-full flex items-center gap-4 p-3 rounded-[3px] hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <Settings size={18} className="text-gray-400" />
                  <span className="text-sm font-medium">Definições</span>
                </button>
                <button 
                  onClick={() => { 
                    window.open('https://wa.me/855767005?text=Olá,%20gostaria%20de%20suporte%20no%20aplicativo%20Serviços.', '_blank');
                    setShowSideMenu(false); 
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-[3px] hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <LifeBuoy size={18} className="text-gray-400" />
                  <span className="text-sm font-medium">Suporte</span>
                </button>
                <button 
                  onClick={() => { 
                    window.open('https://wa.me/855767005?text=Olá,%20gostaria%20de%20ajuda%20no%20aplicativo%20Serviços.', '_blank');
                    setShowSideMenu(false); 
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-[3px] hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <HelpCircle size={18} className="text-gray-400" />
                  <span className="text-sm font-medium">Ajuda</span>
                </button>
                <button 
                  onClick={() => { setView('terms'); setShowSideMenu(false); }}
                  className="w-full flex items-center gap-4 p-3 rounded-[3px] hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <FileText size={18} className="text-gray-400" />
                  <span className="text-sm font-medium">Termos e Privacidade</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header & Categories - Unified Sticky Block */}
      {view === 'feed' && (
        <>
          <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-[2.5px] border-[#D1D5DB] shadow-sm">
            <header className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-[50px] font-black bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent tracking-tighter leading-none">
                  Serviços
                </h1>
              </div>
              
              <div className="flex items-center" style={{ gap: '12px' }}>
                <button 
                  onClick={() => setView('create-post')}
                  className="bg-gray-100 text-gray-900 px-4 py-2 rounded-[30px] font-black text-[10px] uppercase tracking-tighter active:scale-95 transition-all whitespace-nowrap flex items-center gap-1.5"
                >
                  <PlusSquare size={16} strokeWidth={3} />
                  Publicar agora
                </button>
                <button onClick={() => setShowSideMenu(true)} className="p-1 text-gray-900 active:scale-90 transition-transform">
                  <Menu size={24} strokeWidth={3} />
                </button>
              </div>
            </header>

            {/* Categories Bar */}
            <div className="py-2 bg-white">
              <div className="px-4 flex items-center justify-between">
                <div className="flex items-center w-full justify-between overflow-x-auto no-scrollbar gap-4">
                  {categories.map((cat) => (
                    <button 
                      key={cat.id} 
                      onClick={() => { setActiveCategory(cat.id); setView('category-view'); setSearchQuery(''); }}
                      className="flex flex-col items-center gap-1 transition-transform active:scale-95 flex-shrink-0"
                    >
                      <div className={cn(
                        "w-11 h-11 flex items-center justify-center rounded-[14px] transition-all duration-300",
                        activeCategory === cat.id 
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}>
                        <cat.icon 
                          size={22} 
                          strokeWidth={3} 
                        />
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold transition-colors",
                        activeCategory === cat.id ? "text-blue-600" : "text-gray-400"
                      )}>
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Cards Section - Gray Background Style */}
          <div className="overflow-x-auto no-scrollbar pt-[5px] pb-[5px] bg-gray-100">
            <div className="flex px-1 gap-[6px]">
              {posts.slice(0, 6).map((post) => (
                <div 
                  key={`promo-${post.id}`}
                  onClick={() => { setSelectedPost(post); setShowPostDetail(true); }}
                  className="flex-[0_0_calc(50%-7px)] sm:flex-[0_0_250px] group active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className="h-[250px] w-full overflow-hidden rounded-[10px] bg-gray-50/30 relative">
                    <img 
                      src={post.image_url || `https://picsum.photos/seed/${post.id}/800/450`} 
                      alt="Promo" 
                      className="w-full h-full object-cover transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3">
                      <p className="text-white font-bold text-[11px] leading-tight line-clamp-2">
                        {post.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {posts.length === 0 && [1, 2, 3, 4].map((i) => (
                <div 
                  key={`skeleton-${i}`}
                  className="flex-[0_0_calc(50%-7px)] sm:flex-[0_0_250px] h-[250px] rounded-[10px] bg-gray-200 animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="h-[2.5px] w-full bg-[#D1D5DB]" />
        </>
      )}

      {/* Main Content */}
      <main className="max-w-xl mx-auto pb-24">
        {view === 'feed' && (
          <div className="animate-in fade-in duration-500">
            <div className="space-y-0">
              {posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onLike={handleLike} 
                  onComment={(p) => { setSelectedPost(p); setShowComments(true); }}
                  onPostClick={(p) => { setSelectedPost(p); setShowPostDetail(true); }}
                  onProfileClick={(id) => { setSelectedProfileId(id); setView('public-profile'); }}
                />
              ))}
            </div>
          </div>
        )}

        {view === 'category-view' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white min-h-screen">
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-[2.5px] border-[#D1D5DB] shadow-sm">
              {/* Search Bar */}
              <div className="px-4 pt-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Pesquisar serviços, profissionais..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-100 border-none rounded-[10px] py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Categories Bar in Category View */}
              <div className="py-3 bg-white">
                <div className="px-4 flex items-center justify-between">
                  <div className="flex items-center w-full justify-between overflow-x-auto no-scrollbar gap-4">
                    {categories.map((cat) => (
                      <button 
                        key={cat.id} 
                        onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
                        className="flex flex-col items-center gap-1 transition-transform active:scale-95 flex-shrink-0"
                      >
                        <div className={cn(
                          "w-11 h-11 flex items-center justify-center rounded-[14px] transition-all duration-300",
                          activeCategory === cat.id 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        )}>
                          <cat.icon 
                            size={22} 
                            strokeWidth={3} 
                          />
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold transition-colors",
                          activeCategory === cat.id ? "text-blue-600" : "text-gray-400"
                        )}>
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-0">
              {posts.filter(p => {
                const matchesCategory = p.category === activeCategory || activeCategory === 'all' || activeCategory === 'find';
                const matchesSearch = !searchQuery || 
                  p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (p.profiles?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
                return matchesCategory && matchesSearch;
              }).map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onLike={handleLike} 
                  onComment={(p) => { setSelectedPost(p); setShowComments(true); }}
                  onPostClick={(p) => { setSelectedPost(p); setShowPostDetail(true); }}
                  onProfileClick={(id) => { setSelectedProfileId(id); setView('public-profile'); }}
                />
              ))}
              {posts.filter(p => {
                const matchesCategory = p.category === activeCategory || activeCategory === 'all' || activeCategory === 'find';
                const matchesSearch = !searchQuery || 
                  p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (p.profiles?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
                return matchesCategory && matchesSearch;
              }).length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="text-gray-300" size={32} />
                  </div>
                  <p className="text-gray-500 font-bold text-sm">Nenhum resultado encontrado para sua busca.</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                    className="mt-4 text-blue-600 text-xs font-black uppercase tracking-widest"
                  >
                    Limpar Filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'marketplace' && (
          <div className="p-4 animate-in fade-in duration-500">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Mercado de Serviços</h2>
            <div className="space-y-0 -mx-4">
              {services.map((service, index) => (
                <React.Fragment key={service.id}>
                  <div className="px-4">
                    <ServiceCard 
                      service={service} 
                      onClick={() => { setSelectedPost(service as any); setShowPostDetail(true); }} 
                    />
                  </div>
                  {index < services.length - 1 && (
                    <div className="h-[16px] w-full bg-black my-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {view === 'explore' && <ExploreView professionals={professionals} />}
        {view === 'create-post' && <CreatePostView onBack={() => setView('feed')} userProfile={profile} />}
        {view === 'notifications' && <NotificationsView />}
        {view === 'panel' && <PanelView userProfile={profile} />}
        {view === 'reservations' && <ReservationsView userProfile={profile} />}
        {view === 'chat' && <ChatView />}
        {view === 'profile' && (
          <ProfileView 
            profile={profile} 
            userEmail={user?.email} 
            onLogout={handleLogout} 
            onSettings={handleSettings} 
            onUpdateProfile={(data) => setProfile(prev => prev ? { ...prev, ...data } : null)}
            onRefresh={() => user && fetchProfile(user.id)}
            onPostClick={(p) => { setSelectedPost(p); setShowPostDetail(true); }}
            onCommentClick={(p) => { setSelectedPost(p); setShowComments(true); }}
          />
        )}
        {view === 'public-profile' && selectedProfileId && (
          <PublicProfileView 
            profileId={selectedProfileId} 
            onBack={() => setView('feed')} 
            onPostClick={(p) => { setSelectedPost(p); setShowPostDetail(true); }}
            onCommentClick={(p) => { setSelectedPost(p); setShowComments(true); }}
          />
        )}
        {view === 'settings' && <SettingsScreen onBack={handleBackToProfile} />}
        {view === 'terms' && <TermsView onBack={() => setView('feed')} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-[2.5px] border-[#D1D5DB] px-2 py-1 flex items-center justify-around z-40 safe-area-bottom">
        <NavItem icon={Home} label="Início" active={view === 'feed'} onClick={() => setView('feed')} />
        <NavItem icon={Bell} label="Notificações" active={view === 'notifications'} onClick={() => setView('notifications')} />
        {profile?.role === 'provider' ? (
          <NavItem icon={Grid} label="Painel" active={view === 'panel'} onClick={() => setView('panel')} />
        ) : (
          <NavItem icon={Calendar} label="Reservas" active={view === 'reservations'} onClick={() => setView('reservations')} />
        )}
        <NavItem icon={MessageCircle} label="Chat" active={view === 'chat'} onClick={() => setView('chat')} />
        <NavItem icon={User} label="Perfil" active={view === 'profile'} onClick={() => setView('profile')} />
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {showPostDetail && selectedPost && (
          <PostDetailView 
            post={selectedPost} 
            userProfile={profile} 
            onLike={handleLike}
            onProfileClick={(id) => { setSelectedProfileId(id); setView('public-profile'); }}
            onClose={() => setShowPostDetail(false)} 
            onCommentClick={() => setShowComments(true)}
            onPostClick={(p) => setSelectedPost(p)}
            onChatClick={(userId) => {
              setShowDirectChat(userId);
            }}
            onBookClick={(post) => {
              setShowBookingModal(post);
            }}
          />
        )}
        {showComments && selectedPost && (
          <CommentsView 
            post={selectedPost} 
            userProfile={profile} 
            onClose={() => setShowComments(false)} 
          />
        )}

        {showDirectChat && (
          <DirectChatView 
            userId={showDirectChat} 
            onClose={() => setShowDirectChat(null)} 
          />
        )}

        {showBookingModal && (
          <BookingModal 
            post={showBookingModal} 
            onClose={() => setShowBookingModal(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const CreatePostView = ({ onBack, userProfile }: { onBack: () => void, userProfile: Profile | null }) => {
  const [publishType, setPublishType] = useState<'post' | 'service'>('post');
  const [description, setDescription] = useState('');
  const [province, setProvince] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [productName, setProductName] = useState('');
  const [availableHours, setAvailableHours] = useState('');
  const [category, setCategory] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files) as File[];
      setImages(prev => [...prev, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const uploadImages = async (files: File[], bucket: string) => {
    const uploadedUrls = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userProfile?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setLoading(true);

    try {
      const bucket = publishType === 'post' ? 'posts' : 'services';
      const uploadedUrls = await uploadImages(images, bucket);
      const imageUrl = uploadedUrls[0] || null;

      if (publishType === 'post') {
        const { error } = await supabase
          .from('posts')
          .insert({
            user_id: userProfile.id,
            title: productName,
            description: description,
            category: category,
            location: `${province}, ${neighborhood}`,
            available_hours: availableHours,
            phone_number: phoneNumber,
            image_url: imageUrl,
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert({
            user_id: userProfile.id,
            title: productName,
            description: description,
            price: price,
            category: category,
            location: `${province}, ${neighborhood}`,
            image_url: imageUrl,
          });
        if (error) throw error;
      }

      onBack();
    } catch (err: any) {
      console.error('Error creating:', err);
      alert('Erro ao publicar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 animate-in slide-in-from-bottom-4 duration-500 pb-24 max-w-2xl mx-auto bg-white min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-900 hover:bg-gray-100 rounded-[3px] transition-colors">
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <h2 className="text-xl font-black text-gray-900 tracking-tighter">Publicar agora</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo de Publicação */}
        {userProfile?.role === 'provider' && (
          <div className="flex gap-2 p-1 bg-gray-100 rounded-[3px]">
            <button
              type="button"
              onClick={() => setPublishType('post')}
              className={cn(
                "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-[3px] transition-all",
                publishType === 'post' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
              )}
            >
              Publicação
            </button>
            <button
              type="button"
              onClick={() => setPublishType('service')}
              className={cn(
                "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-[3px] transition-all",
                publishType === 'service' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
              )}
            >
              Serviço
            </button>
          </div>
        )}
        {/* 4. Nome do produto ou serviço */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
            <ShoppingBag size={14} className="text-blue-600" strokeWidth={3} />
            Nome do produto ou serviço
          </label>
          <input 
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="O que você está oferecendo?"
            className="w-full bg-gray-50 border border-gray-200 rounded-[3px] p-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            required
          />
        </div>

        {/* 1. Descrição */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
            <FileText size={14} className="text-blue-600" strokeWidth={3} />
            Descrição
          </label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva seu serviço ou produto em detalhes..."
            className="w-full bg-gray-50 border border-gray-200 rounded-[3px] p-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none min-h-[100px] transition-all"
            required
          />
        </div>

        {/* 2. Adicionar imagens */}
        <div className="space-y-3">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors"
          >
            <ImageIcon size={18} className="text-blue-600" strokeWidth={3} />
            <span className="font-black text-[11px] uppercase tracking-tight">Adicionar imagens</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            multiple 
            accept="image/*" 
            className="hidden" 
          />
          
          {imagePreviews.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {imagePreviews.map((preview, i) => (
                <div key={`preview-${i}`} className="relative flex-shrink-0">
                  <img src={preview} className="w-16 h-16 rounded-[3px] object-cover border border-gray-200" alt="" />
                  <button 
                    type="button"
                    onClick={() => {
                      setImagePreviews(prev => prev.filter((_, index) => index !== i));
                      setImages(prev => prev.filter((_, index) => index !== i));
                    }}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-[3px] p-0.5 shadow-sm"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Província e Bairro */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
              <MapPin size={14} className="text-blue-600" strokeWidth={3} />
              Província
            </label>
            <input 
              type="text"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="Ex: Luanda"
              className="w-full bg-gray-50 border border-gray-200 rounded-[3px] p-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
              <MapPin size={14} className="text-blue-600" strokeWidth={3} />
              Bairro
            </label>
            <input 
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Ex: Talatona"
              className="w-full bg-gray-50 border border-gray-200 rounded-[3px] p-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>
        </div>

        {/* 5. Horas disponíveis */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
            <Calendar size={14} className="text-blue-600" strokeWidth={3} />
            Horas disponíveis
          </label>
          <input 
            type="text"
            value={availableHours}
            onChange={(e) => setAvailableHours(e.target.value)}
            placeholder="Ex: Seg-Sex, 08:00 - 18:00"
            className="w-full bg-gray-50 border border-gray-200 rounded-[3px] p-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            required
          />
        </div>

        {/* 6. Categorias */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
            <Grid size={14} className="text-blue-600" strokeWidth={3} />
            Categorias
          </label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-[3px] p-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none"
            required
          >
            <option value="">Selecione uma categoria...</option>
            <option value="Limpeza">Limpeza</option>
            <option value="Reformas">Reformas</option>
            <option value="Beleza">Beleza</option>
            <option value="Aulas">Aulas</option>
            <option value="Tecnologia">Tecnologia</option>
            <option value="Eventos">Eventos</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        {/* 7. Número de celular */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
            <Phone size={14} className="text-blue-600" strokeWidth={3} />
            Número de celular
          </label>
          <input 
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Ex: 923 000 000"
            className="w-full bg-gray-50 border border-gray-200 rounded-[3px] p-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            required
          />
        </div>

        {/* Preço (apenas para serviços) */}
        {publishType === 'service' && (
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
              <Sparkles size={14} className="text-blue-600" strokeWidth={3} />
              Preço (Kz)
            </label>
            <input 
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex: 5.000"
              className="w-full bg-gray-50 border border-gray-200 rounded-[3px] p-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3.5 rounded-[3px] font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-[0.98] transition-all disabled:opacity-50 mt-8"
        >
          {loading ? 'Publicando...' : 'Publicar Agora'}
        </button>
      </form>
    </div>
  );
}

// --- Sub-Views ---

const AuthView = ({ onComplete }: { onComplete: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { name: fullName }
          }
        });
        if (error) throw error;
        alert('Cadastro realizado! Verifique seu e-mail para confirmar.');
      }
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
          <p className="text-gray-500">Acesse a melhor rede de serviços do Brasil</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-start gap-2">
            <X size={18} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Nome Completo</label>
              <input 
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-gray-50 border-gray-100 rounded-[3px] py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Como você quer ser chamado?"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">E-mail</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border-gray-100 rounded-[3px] py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Senha</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border-gray-100 rounded-[3px] py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-[3px] font-bold text-base shadow-md shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-gray-400 font-bold">Ou continue com</span></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-[3px] font-bold text-xs flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          Google
        </button>

        <p className="text-center mt-8 text-sm text-gray-500">
          {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="ml-1 text-blue-600 font-bold"
          >
            {isLogin ? 'Cadastre-se' : 'Faça login'}
          </button>
        </p>
      </div>
    </div>
  );
};

const ProfileView = ({ profile, onLogout, onSettings, onUpdateProfile, userEmail, onRefresh, onPostClick, onCommentClick }: { profile: Profile | null, onLogout: () => void, onSettings: () => void, onUpdateProfile: (data: Partial<Profile>) => void, userEmail?: string, onRefresh?: () => void, onPostClick?: (post: Post) => void, onCommentClick?: (post: Post) => void }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchUserPosts();
    }
  }, [profile?.id]);

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUserPosts(data || []);
    } catch (err) {
      console.error('Error fetching user posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setIsUpdating(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photoUrl: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      onUpdateProfile({ photoUrl: publicUrl });
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      alert('Erro ao carregar avatar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleProviderMode = async () => {
    if (!profile) return;
    setIsUpdating(true);
    try {
      const newRole = profile.role === 'provider' ? 'user' : 'provider';
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profile.id);
      
      if (error) throw error;
      onUpdateProfile({ role: newRole });
    } catch (err: any) {
      console.error('Error toggling provider mode:', err);
      alert('Erro ao ativar modo prestador: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 pb-24 bg-gray-50 min-h-screen">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleAvatarUpload} 
      />
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 pt-12 pb-8">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6 group">
              <div className="absolute inset-0 bg-blue-600 rounded-[3px] blur-xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <img 
                src={profile?.photoUrl || `https://ui-avatars.com/api/?name=${profile?.name}`} 
                className="w-32 h-32 rounded-[3px] object-cover border-4 border-white shadow-2xl relative z-10"
                alt={profile?.name}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdating}
                className="absolute bottom-1 right-1 bg-blue-600 text-white p-2.5 rounded-[3px] shadow-lg border-4 border-white z-20 active:scale-90 transition-transform disabled:opacity-50"
              >
                {isUpdating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={16} />}
              </button>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-black text-gray-900 flex items-center justify-center gap-2 tracking-tight">
                {profile?.name || 'Usuário'}
                {profile?.verified && (
                  <div className="bg-blue-50 p-1 rounded-[3px]">
                    <CheckCircle2 size={20} className="text-blue-600 fill-blue-600/10" />
                  </div>
                )}
              </h2>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">{profile?.role === 'provider' ? 'Prestador Profissional' : 'Cliente Premium'}</p>
              <p className="text-gray-500 text-sm mt-4 max-w-md leading-relaxed font-medium italic">
                "{profile?.bio || 'Sua história começa aqui. Adicione uma bio para se conectar com o mundo.'}"
              </p>
            </div>

            <div className="flex items-center gap-3 w-full max-w-sm">
              <button 
                onClick={onSettings}
                className="flex-1 bg-gray-900 text-white py-3 rounded-[3px] font-bold text-sm shadow-xl shadow-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Settings size={18} />
                Editar Perfil
              </button>
              <button 
                onClick={onRefresh}
                className="p-3 bg-white border border-gray-200 text-gray-400 rounded-[3px] hover:bg-gray-50 active:rotate-180 transition-all duration-500"
              >
                <Sparkles size={20} />
              </button>
              <button 
                onClick={onLogout}
                className="p-3 bg-red-50 text-red-500 rounded-[3px] hover:bg-red-100 active:scale-95 transition-all"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-t border-gray-50 bg-gray-50/30">
          <div className="max-w-2xl mx-auto grid grid-cols-3 divide-x divide-gray-100">
            <div className="py-6 text-center">
              <p className="text-xl font-black text-gray-900">{(Number(profile?.followers_count) || 0).toLocaleString('pt-BR')}</p>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Seguidores</p>
            </div>
            <div className="py-6 text-center">
              <p className="text-xl font-black text-gray-900">{(Number(profile?.following_count) || 0).toLocaleString('pt-BR')}</p>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Seguindo</p>
            </div>
            <div className="py-6 text-center">
              <p className="text-xl font-black text-gray-900">{(Number(userPosts.length) || 0).toLocaleString('pt-BR')}</p>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Posts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* User Posts Grid */}
        <div className="grid grid-cols-3 gap-1">
          {loadingPosts ? (
            <div className="col-span-3 py-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Carregando publicações...</div>
          ) : userPosts.length === 0 ? (
            <div className="col-span-3 py-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Nenhuma publicação ainda</div>
          ) : (
            userPosts.map(post => (
              <div 
                key={post.id} 
                className={cn("aspect-square bg-gray-200 overflow-hidden group relative rounded-[3px]", onPostClick && "cursor-pointer")}
                onClick={() => onPostClick?.(post)}
              >
                <img 
                  src={post.image_url} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  alt="" 
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Heart size={20} className="text-white fill-white" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Verification Card */}
        {!profile?.verified && (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3px] p-6 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <ShieldCheck size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-blue-200" />
                <h4 className="font-black text-lg">Selo de Verificação</h4>
              </div>
              <p className="text-sm text-blue-100 mb-6 max-w-[240px] leading-snug">
                Destaque-se na comunidade e transmita confiança total para seus clientes.
              </p>
              <button className="bg-white text-blue-600 px-6 py-2.5 rounded-[3px] text-xs font-black shadow-lg hover:bg-blue-50 active:scale-95 transition-all">
                SOLICITAR AGORA
              </button>
            </div>
          </div>
        )}

        {/* Professional Mode Toggle */}
        <div className="bg-white rounded-[3px] p-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-[3px] transition-colors",
              profile?.role === 'provider' ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"
            )}>
              <Grid size={24} />
            </div>
            <div>
              <h4 className="text-base font-black text-gray-900">Modo Profissional</h4>
              <p className="text-xs text-gray-500 font-medium">Habilite ferramentas de prestador</p>
            </div>
          </div>
          <button 
            onClick={toggleProviderMode}
            disabled={isUpdating}
            className={cn(
              "w-14 h-8 rounded-[3px] relative transition-all duration-500 p-1",
              profile?.role === 'provider' ? "bg-blue-600" : "bg-gray-200"
            )}
          >
            <div className={cn(
              "w-6 h-6 bg-white rounded-[3px] shadow-md transition-transform duration-500",
              profile?.role === 'provider' ? "translate-x-6" : "translate-x-0"
            )} />
          </button>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-[3px] p-6 shadow-sm border border-gray-100">
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Shield size={16} className="text-gray-400" />
            Segurança & Conta
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-[3px] flex items-center justify-center text-gray-400">
                  <Calendar size={14} />
                </div>
                <span className="text-sm font-bold text-gray-500">Membro desde</span>
              </div>
              <span className="text-sm font-black text-gray-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-[3px] flex items-center justify-center text-gray-400">
                  <FileText size={14} />
                </div>
                <span className="text-sm font-bold text-gray-500">ID da Conta</span>
              </div>
              <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-[3px]">
                {profile?.id?.substring(0, 12).toUpperCase()}...
              </span>
            </div>
          </div>
        </div>

        {/* Developer Tools (Hidden by default) */}
        <button 
          onClick={() => setShowRawData(!showRawData)}
          className="w-full py-4 text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] hover:text-gray-400 transition-colors"
        >
          {showRawData ? 'Ocultar Metadados' : 'Visualizar Metadados do Sistema'}
        </button>

        <AnimatePresence>
          {showRawData && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gray-900 rounded-[3px] p-6 font-mono text-[10px] text-blue-400 overflow-x-auto shadow-2xl">
                <p className="text-gray-500 mb-4">// System Profile Data</p>
                <pre>{JSON.stringify(profile, null, 2)}</pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const PublicProfileView = ({ profileId, onBack, onPostClick, onCommentClick }: { profileId: string, onBack: () => void, onPostClick?: (post: Post) => void, onCommentClick?: (post: Post) => void }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        const { data: profData, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();

        if (profError) throw profError;
        setProfile(profData);

        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*, profiles(*)')
          .eq('user_id', profileId)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;
        setPosts(postsData || []);
      } catch (err) {
        console.error('Error fetching public profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [profileId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 pb-24 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 pt-12 pb-8">
          <div className="flex flex-col items-center text-center">
            <button 
              onClick={onBack}
              className="absolute top-6 left-6 p-2 bg-white border border-gray-100 text-gray-400 rounded-[3px] hover:bg-gray-50 active:scale-95 transition-all"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="relative mb-6 group">
              <div className="absolute inset-0 bg-blue-600 rounded-[3px] blur-xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <img 
                src={profile?.photoUrl || `https://ui-avatars.com/api/?name=${profile?.name}`} 
                className="w-32 h-32 rounded-[3px] object-cover border-4 border-white shadow-2xl relative z-10"
                alt={profile?.name}
              />
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-black text-gray-900 flex items-center justify-center gap-2 tracking-tight">
                {profile?.name || 'Usuário'}
                {profile?.verified && (
                  <div className="bg-blue-50 p-1 rounded-[3px]">
                    <CheckCircle2 size={20} className="text-blue-600 fill-blue-600/10" />
                  </div>
                )}
              </h2>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">{profile?.role === 'provider' ? 'Prestador Profissional' : 'Cliente Premium'}</p>
              <p className="text-gray-500 text-sm mt-4 max-w-md leading-relaxed font-medium italic">
                "{profile?.bio || 'Sem biografia disponível.'}"
              </p>
            </div>

            <div className="flex items-center gap-3 w-full max-w-sm">
              <button className="flex-1 bg-blue-600 text-white py-3 rounded-[3px] font-bold text-sm shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                Seguir
              </button>
              <button className="flex-1 bg-gray-900 text-white py-3 rounded-[3px] font-bold text-sm shadow-xl shadow-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                Mensagem
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-t border-gray-50 bg-gray-50/30">
          <div className="max-w-2xl mx-auto grid grid-cols-3 divide-x divide-gray-100">
            <div className="py-6 text-center">
              <p className="text-xl font-black text-gray-900">{(Number(profile?.followers_count) || 0).toLocaleString('pt-BR')}</p>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Seguidores</p>
            </div>
            <div className="py-6 text-center">
              <p className="text-xl font-black text-gray-900">{(Number(profile?.following_count) || 0).toLocaleString('pt-BR')}</p>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Seguindo</p>
            </div>
            <div className="py-6 text-center">
              <p className="text-xl font-black text-gray-900">{(Number(posts.length) || 0).toLocaleString('pt-BR')}</p>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Posts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Public Posts Grid */}
        <div className="grid grid-cols-3 gap-1">
          {posts.length === 0 ? (
            <div className="col-span-3 py-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Nenhuma publicação ainda</div>
          ) : (
            posts.map(post => (
              <div 
                key={post.id} 
                className={cn("aspect-square bg-gray-200 overflow-hidden group relative rounded-[3px]", onPostClick && "cursor-pointer")}
                onClick={() => onPostClick?.(post)}
              >
                <img 
                  src={post.image_url} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  alt="" 
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Heart size={20} className="text-white fill-white" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const ExploreView = ({ professionals }: { professionals: Profile[] }) => (
  <div className="p-4 space-y-6 animate-in fade-in duration-500">
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input 
        type="text" 
        placeholder="Buscar profissionais ou serviços..."
        className="w-full bg-gray-100 border-none rounded-[3px] py-2.5 pl-12 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>

    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Categorias Populares</h3>
        <button className="text-xs font-bold text-blue-600">Ver todas</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { name: 'Limpeza' },
          { name: 'Reformas' },
          { name: 'Beleza' },
          { name: 'Aulas' }
        ].map(cat => (
          <button key={cat.name} className="bg-gray-100 p-2 rounded-[3px] border border-gray-200 flex items-center gap-3 hover:border-blue-200 transition-colors">
            <div className="w-8 h-8 flex items-center justify-center text-black border-2 border-black rounded-[16px]">
              <Star size={16} strokeWidth={3} />
            </div>
            <span className="text-[11px] font-bold text-black">{cat.name}</span>
          </button>
        ))}
      </div>
    </section>

    <section>
      <h3 className="font-bold text-gray-900 mb-4">Profissionais em Destaque</h3>
      <div className="space-y-0 -mx-4">
        {professionals.map((prof, index) => (
          <React.Fragment key={prof.id}>
            <div className="px-4">
              <div className="bg-white p-4 rounded-[3px] border border-gray-100 flex items-center gap-4 shadow-sm">
                <div className="relative">
                  <img 
                    src={prof.photoUrl || `https://ui-avatars.com/api/?name=${prof.name}`} 
                    className="w-16 h-16 rounded-[3px] object-cover" 
                    alt={prof.name} 
                  />
                  {prof.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-[3px] p-1 shadow-sm border border-gray-50">
                      <CheckCircle2 size={12} className="text-blue-500 fill-blue-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                    {prof.name}
                    {prof.verified && <CheckCircle2 size={16} className="text-blue-500 fill-blue-500" />}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-1">{prof.bio || 'Profissional qualificado'}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-gray-900">4.9</span>
                    <span className="text-[10px] text-gray-400 font-medium">(128 avaliações)</span>
                  </div>
                </div>
                <button className="text-blue-600 p-2 bg-blue-50 rounded-[3px] active:scale-90 transition-transform">
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
            {index < professionals.length - 1 && (
              <div className="h-[16px] w-full bg-black my-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  </div>
);

const NotificationsView = () => (
  <div className="p-4 space-y-4 animate-in slide-in-from-right-4 duration-500">
    <h2 className="text-xl font-bold text-gray-900 mb-6">Notificações</h2>
    {[1, 2, 3, 4].map(i => (
      <div key={`notif-${i}`} className="bg-white p-4 rounded-[3px] border border-gray-100 flex gap-4 items-start">
        <div className={cn(
          "w-10 h-10 rounded-[3px] flex items-center justify-center shrink-0",
          i % 2 === 0 ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-500"
        )}>
          {i % 2 === 0 ? <CheckCircle2 size={20} /> : <Heart size={20} />}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-800">
            <span className="font-bold">Maria Oliveira</span> {i % 2 === 0 ? 'confirmou o agendamento para amanhã.' : 'curtiu sua publicação.'}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">Há {i * 5} minutos</p>
        </div>
      </div>
    ))}
  </div>
);

const DirectChatView = ({ userId, onClose }: { userId: string, onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-gray-50 z-[70] flex flex-col"
    >
      <div className="bg-white p-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={onClose} className="p-1.5 -ml-2 rounded-[3px] hover:bg-gray-50 text-gray-900">
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={`https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff`} className="w-10 h-10 rounded-full object-cover border border-gray-200" alt="Avatar" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">Conversa</h2>
            <span className="text-xs text-green-600 font-medium">Online</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="text-center text-xs text-gray-400 my-2 font-medium">Hoje</div>
        <div className="self-start bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm">
          <p className="text-sm text-gray-800">Olá! Vi o seu anúncio e tenho interesse. Podemos conversar?</p>
          <span className="text-[10px] text-gray-400 mt-1 block text-right">14:20</span>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3 pb-safe">
        <button className="text-gray-400 hover:text-blue-600 transition-colors">
          <PlusSquare size={24} />
        </button>
        <input 
          type="text" 
          placeholder="Digite uma mensagem..." 
          className="flex-1 bg-gray-100 border-transparent rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" 
        />
        <button className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md shadow-blue-200 active:scale-95 transition-transform shrink-0">
          <Send size={18} className="ml-1" />
        </button>
      </div>
    </motion.div>
  );
};

const BookingModal = ({ post, onClose }: { post: Post, onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[80] flex items-end sm:items-center justify-center"
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white w-full sm:w-[400px] sm:rounded-[8px] rounded-t-[16px] p-6 flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Reservar Serviço</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-1">{post.title}</h3>
            <p className="text-sm text-gray-500">{post.profiles?.name}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Desejada</label>
              <input type="date" className="w-full border border-gray-300 rounded-[4px] p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
              <input type="time" className="w-full border border-gray-300 rounded-[4px] p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem (Opcional)</label>
              <textarea rows={3} placeholder="Detalhes adicionais..." className="w-full border border-gray-300 rounded-[4px] p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <button 
            onClick={() => {
              alert('Reserva solicitada com sucesso!');
              onClose();
            }}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-[4px] shadow-md shadow-blue-200 active:scale-[0.98] transition-transform"
          >
            Confirmar Reserva
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ChatView = () => (
  <div className="p-4 space-y-4 animate-in slide-in-from-right-4 duration-500">
    <h2 className="text-xl font-bold text-gray-900 mb-6">Mensagens</h2>
    {[1, 2, 3].map(i => (
      <div key={`chat-${i}`} className="bg-white p-4 rounded-[3px] border border-gray-100 flex gap-4 items-center cursor-pointer active:bg-gray-50 transition-colors">
        <div className="relative">
          <img src={`https://i.pravatar.cc/150?u=chat${i}`} className="w-14 h-14 rounded-[3px] object-cover" alt="Avatar" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-[3px]"></span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <h4 className="text-sm font-bold text-gray-900">Carlos Lima</h4>
            <span className="text-[10px] text-gray-400">14:20</span>
          </div>
          <p className="text-xs text-gray-500 line-clamp-1">Olá! Gostaria de saber mais sobre o serviço de pintura...</p>
        </div>
        {i === 1 && <div className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-[3px] flex items-center justify-center">2</div>}
      </div>
    ))}
  </div>
);

const SettingsView = ({ onBack }: { onBack: () => void }) => (
  <div className="p-4 animate-in slide-in-from-right-4 duration-500">
    <div className="flex items-center gap-4 mb-8">
      <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
        <ChevronLeft size={24} />
      </button>
      <h2 className="text-xl font-bold text-gray-900">Configurações</h2>
    </div>

    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Conta</h3>
        <div className="bg-white rounded-[3px] border border-gray-100 overflow-hidden">
          <button className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50 rounded-[3px]">
            <div className="flex items-center gap-3">
              <User size={18} className="text-gray-400" />
              <span className="text-xs font-medium">Editar Perfil</span>
            </div>
            <ArrowRight size={14} className="text-gray-300" />
          </button>
          <button className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-[3px]">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-gray-400" />
              <span className="text-xs font-medium">Segurança</span>
            </div>
            <ArrowRight size={14} className="text-gray-300" />
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Preferências</h3>
        <div className="bg-white rounded-[3px] border border-gray-100 overflow-hidden">
          <button className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50 rounded-[3px]">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-gray-400" />
              <span className="text-xs font-medium">Notificações</span>
            </div>
            <ArrowRight size={14} className="text-gray-300" />
          </button>
          <button className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-[3px]">
            <div className="flex items-center gap-3">
              <ImageIcon size={18} className="text-gray-400" />
              <span className="text-xs font-medium">Aparência</span>
            </div>
            <ArrowRight size={14} className="text-gray-300" />
          </button>
        </div>
      </section>

      <button className="w-full p-2.5 bg-red-50 text-red-600 rounded-[3px] font-bold text-xs flex items-center justify-center gap-2">
        <Trash2 size={18} />
        Excluir Conta
      </button>
    </div>
  </div>
);

const PanelView = ({ userProfile }: { userProfile: Profile | null }) => {
  const [stats, setStats] = useState({ earnings: 0, services: 0 });
  const [nextBookings, setNextBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPanelData = async () => {
      if (!userProfile) return;
      try {
        // Fetch services count
        const { count: servicesCount } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('provider_id', userProfile.id);

        // Fetch bookings for earnings (simplified)
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('total_price')
          .eq('status', 'completed'); // In a real app, filter by provider's services

        const totalEarnings = bookingsData?.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0) || 0;

        setStats({ earnings: totalEarnings, services: servicesCount || 0 });

        // Fetch next bookings
        const { data: nextData } = await supabase
          .from('bookings')
          .select('*, services(*)')
          .eq('status', 'pending')
          .order('booking_date', { ascending: true })
          .limit(3);

        setNextBookings(nextData || []);
      } catch (err) {
        console.error('Error fetching panel data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPanelData();
  }, [userProfile]);

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando painel...</div>;

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-900">Painel do Prestador</h2>
        <div className="w-10 h-10 bg-blue-600 rounded-[3px] flex items-center justify-center text-white shadow-lg shadow-blue-100">
          <Grid size={20} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-[3px] border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Ganhos</p>
          <p className="text-xl font-black text-gray-900">Kz {stats.earnings.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-[3px] border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Serviços</p>
          <p className="text-xl font-black text-gray-900">{stats.services}</p>
        </div>
      </div>

      <section>
        <h3 className="font-bold text-gray-900 mb-4">Próximos Agendamentos</h3>
        <div className="space-y-3">
          {nextBookings.length > 0 ? nextBookings.map((booking, i) => (
            <div key={booking.id} className="bg-white p-4 rounded-[3px] border border-gray-100 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-[3px] flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-blue-600 uppercase">
                  {new Date(booking.booking_date).toLocaleDateString('pt-BR', { month: 'short' })}
                </span>
                <span className="text-sm font-black text-gray-900">
                  {new Date(booking.booking_date).getDate()}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900">{booking.services?.title || 'Serviço'}</h4>
                <p className="text-xs text-gray-500">Status: {booking.status}</p>
              </div>
              <button className="p-1.5 text-blue-600 bg-blue-50 rounded-[3px]">
                <ArrowRight size={16} />
              </button>
            </div>
          )) : (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum agendamento pendente.</p>
          )}
        </div>
      </section>
    </div>
  );
};

const ReservationsView = ({ userProfile }: { userProfile: Profile | null }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!userProfile) return;
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*, services(*)')
          .eq('user_id', userProfile.id)
          .order('booking_date', { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userProfile]);

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando reservas...</div>;

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-900">Minhas Reservas</h2>
        <div className="w-10 h-10 bg-blue-600 rounded-[3px] flex items-center justify-center text-white shadow-lg shadow-blue-100">
          <Calendar size={20} />
        </div>
      </div>

      <div className="space-y-4">
        {bookings.length > 0 ? bookings.map((booking) => (
          <div key={booking.id} className="bg-white p-5 rounded-[3px] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-900">{booking.services?.title || 'Serviço'}</h3>
                <p className="text-xs text-gray-500">Categoria: {booking.services?.category || 'Geral'}</p>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-3 py-1 rounded-[3px] uppercase",
                booking.status === 'completed' ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
              )}>
                {booking.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{new Date(booking.booking_date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <span>{booking.services?.rating || '0.0'}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-gray-50 text-gray-700 rounded-[3px] font-bold text-[10px]">Detalhes</button>
              <button className="flex-1 py-2 bg-blue-600 text-white rounded-[3px] font-bold text-[10px] shadow-md shadow-blue-100">Mensagem</button>
            </div>
          </div>
        )) : (
          <p className="text-sm text-gray-500 text-center py-8">Você ainda não tem reservas.</p>
        )}
      </div>
    </div>
  );
};

const TermsView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="min-h-screen bg-white animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b-[2.5px] border-[#D1D5DB] px-4 py-4 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center text-black hover:bg-gray-100 rounded-[12px] transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Termos e Condições</h2>
      </div>

      <div className="p-6 space-y-8 max-w-2xl mx-auto">
        <section>
          <h3 className="text-lg font-black text-blue-600 mb-3 uppercase tracking-tighter">1. Aceitação dos Termos</h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            Ao utilizar a plataforma <span className="font-bold text-gray-900">Serviços</span>, você concorda integralmente com as diretrizes aqui estabelecidas. Este ecossistema foi projetado para fomentar conexões profissionais seguras e eficientes entre prestadores e clientes.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-black text-blue-600 mb-3 uppercase tracking-tighter">2. Responsabilidade Profissional</h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            Os prestadores de serviços cadastrados assumem total responsabilidade técnica e ética pelas atividades desempenhadas. A plataforma atua como facilitadora de visibilidade, não garantindo resultados específicos, mas promovendo a transparência através de avaliações reais.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-black text-blue-600 mb-3 uppercase tracking-tighter">3. Privacidade e Dados</h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            Seus dados são tratados com o mais alto rigor de segurança. Utilizamos criptografia de ponta para proteger informações sensíveis e garantimos que sua privacidade é nossa prioridade absoluta. Nunca compartilhamos dados com terceiros sem consentimento explícito.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-black text-blue-600 mb-3 uppercase tracking-tighter">4. Conduta na Comunidade</h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            Prezamos pelo respeito mútuo. Comportamentos abusivos, spam ou tentativas de fraude resultarão no banimento imediato e permanente da conta, visando preservar a integridade e a qualidade da nossa rede profissional.
          </p>
        </section>

        <div className="pt-8 border-t border-gray-100 italic text-[10px] text-gray-400 text-center">
          Última atualização: Abril de 2026. Todos os direitos reservados à plataforma Serviços.
        </div>
      </div>
    </div>
  );
};
