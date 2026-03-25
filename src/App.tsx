/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { 
  Menu, 
  Search, 
  LayoutGrid, 
  Scissors,
  Cpu,
  Palette,
  Sparkles,
  Wrench,
  MoreVertical,
  PlusCircle,
  Home,
  Calendar,
  Compass,
  MessageSquare,
  Bell,
  User as UserIcon,
  LogOut,
  Camera,
  CheckCircle2,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Globe,
  MoreHorizontal,
  X,
  ThumbsUp,
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Grid,
  UserPlus,
  Users,
  TrendingUp,
  Loader2,
  Check,
  Info,
  Star,
  ArrowLeft,
  Settings,
  Headphones,
  HelpCircle,
  Clock,
  ClipboardList,
  Plus,
  ChevronRight,
  Filter,
  Send,
  Image as ImageIcon,
  AlertCircle,
  Droplets,
  ChevronDown,
  CheckCheck,
  Tag,
  Video,
  Phone,
  Mic,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

// --- Components ---
import BookingModal from './components/BookingModal';
import BookingsScreen from './components/BookingsScreen';
import SettingsScreen from './components/SettingsScreen';
import SupportScreen from './components/SupportScreen';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  verified: boolean;
  verificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  plan: 'free' | 'pro';
  role?: 'user' | 'admin';
  created_at: any;
}

interface Service {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  provider_id: string;
  images: string[];
  rating: number;
  created_at: any;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  providerName: string;
  providerPhoto: string;
}

interface Booking {
  id: string;
  client_id: string;
  provider_id: string;
  service_id: string;
  date: string;
  time: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  message: string;
  created_at: any;
  // UI helper
  serviceTitle?: string;
  clientName?: string;
  providerName?: string;
}

interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: any;
}

interface Verification {
  id: string;
  user_id: string;
  biFront: string;
  biBack: string;
  selfie: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: any;
}

interface Post {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
  // UI helpers
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  userName?: string;
  userPhoto?: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: any;
}

// --- Components ---

const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center">
    <Loader2 className="w-8 h-8 text-zinc-900 animate-spin" />
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentView, setCurrentView] = useState<'marketplace' | 'bookings' | 'profile' | 'messages' | 'create-service' | 'create-post' | 'verification' | 'chat-detail' | 'service-detail' | 'notifications' | 'public-profile' | 'login' | 'register' | 'settings' | 'help' | 'terms' | 'find-people'>('marketplace');
  const [isLoading, setIsLoading] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Hash Routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '') || 'marketplace';
      const validViews = ['marketplace', 'bookings', 'profile', 'messages', 'create-service', 'create-post', 'verification', 'chat-detail', 'service-detail', 'notifications', 'public-profile', 'login', 'register', 'settings', 'help', 'terms', 'find-people'];
      if (validViews.includes(hash)) {
        setCurrentView(hash as any);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Initial sync
    const initialHash = window.location.hash.replace('#/', '');
    if (initialHash) {
      handleHashChange();
    } else {
      window.history.replaceState(null, '', `#/${currentView}`);
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (window.location.hash.replace('#/', '') !== currentView) {
      window.history.pushState(null, '', `#/${currentView}`);
    }
  }, [currentView]);

  // Data States
  const [services, setServices] = useState<Service[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [followers, setFollowers] = useState<string[]>([]); // List of following_ids
  const [followingCount, setFollowingCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [userPostsCount, setUserPostsCount] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const handleOnboardingComplete = (toLogin: boolean) => {
    setShowOnboarding(false);
    if (toLogin) {
      setCurrentView('login');
    }
  };

  // Protected routes and missing data redirects
  useEffect(() => {
    if (isAuthReady && !user) {
      const protectedViews = ['bookings', 'profile', 'messages', 'create-service', 'create-post', 'verification', 'chat-detail', 'notifications'];
      if (protectedViews.includes(currentView)) {
        setCurrentView('login');
      }
    }

    if (currentView === 'service-detail' && !selectedService) {
      setCurrentView('marketplace');
    }
    if (currentView === 'public-profile' && !selectedUser) {
      setCurrentView('marketplace');
    }
    if (currentView === 'chat-detail' && !selectedChat) {
      setCurrentView('messages');
    }
  }, [currentView, user, isAuthReady, selectedService, selectedUser, selectedChat]);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        syncProfile(session.user);
      } else {
        setIsAuthReady(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        syncProfile(session.user);
      } else {
        setProfile(null);
        setIsAuthReady(true);
        const protectedViews = ['bookings', 'profile', 'messages', 'create-service', 'verification', 'chat-detail', 'notifications'];
        if (protectedViews.includes(currentView)) {
          setCurrentView('login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isSyncingProfile = useRef(false);

  const syncProfile = async (supabaseUser: User) => {
    if (isSyncingProfile.current) return;
    isSyncingProfile.current = true;
    try {
      let uploadedAvatarUrl = null;
      const pendingAvatar = localStorage.getItem('pending_avatar');
      if (pendingAvatar) {
        try {
          const res = await fetch(pendingAvatar);
          const blob = await res.blob();
          const filePath = `${supabaseUser.id}/avatar-${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage.from('services').upload(filePath, blob, { upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('services').getPublicUrl(filePath);
            uploadedAvatarUrl = urlData.publicUrl;
            await supabase.auth.updateUser({ data: { avatar_url: uploadedAvatarUrl } });
          }
        } catch (e) {
          console.error("Failed to upload pending avatar", e);
        }
        localStorage.removeItem('pending_avatar');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      if (data) {
        if (uploadedAvatarUrl && data.photoUrl !== uploadedAvatarUrl) {
          await supabase.from('profiles').update({ photoUrl: uploadedAvatarUrl }).eq('id', supabaseUser.id);
          setProfile({ ...data, photoUrl: uploadedAvatarUrl });
        } else {
          setProfile(data);
        }
      } else if (error && error.code === 'PGRST116') {
        const newProfile: UserProfile = {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || 'Usuário',
          email: supabaseUser.email || '',
          photoUrl: uploadedAvatarUrl || supabaseUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
          verified: false,
          verificationStatus: 'none',
          plan: 'free',
          role: supabaseUser.email === 'dakfildbanze3@gmail.com' ? 'admin' : 'user',
          created_at: new Date().toISOString()
        };
        await supabase.from('profiles').insert([newProfile]);
        setProfile(newProfile);
      }

      // Fetch and apply settings
      const { data: settingsData } = await supabase.from('user_settings').select('*').eq('id', supabaseUser.id).single();
      if (settingsData) {
        if (settingsData.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        if (settingsData.primaryColor) {
          document.documentElement.style.setProperty('--color-primary', settingsData.primaryColor);
        }
      }
    } catch (error) {
      console.error("Error syncing profile:", error);
    } finally {
      setIsAuthReady(true);
      isSyncingProfile.current = false;
    }
  };

  // Helper for retrying fetches on lock errors
  const safeFetch = async (fetchFn: () => Promise<any>, retries = 3, delay = 500) => {
    for (let i = 0; i < retries; i++) {
      try {
        await fetchFn();
        return;
      } catch (error: any) {
        if (error?.message?.includes('Lock broken') || error?.message?.includes('steal')) {
          console.warn(`Fetch lock error, retrying (${i + 1}/${retries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.message.includes('Lock broken')) throw error;
        console.error("Erro ao buscar serviços:", error);
        return;
      }
      
      if (data) setServices(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Lock broken')) throw err;
      console.error("Erro inesperado ao buscar serviços:", err);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (name, photoUrl)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.message.includes('Lock broken')) throw error;
        console.error("Erro ao buscar posts:", error);
        return;
      }

      if (data) {
        const formattedPosts = data.map((p: any) => ({
          ...p,
          userName: p.profiles?.name || 'Usuário',
          userPhoto: p.profiles?.photoUrl || ''
        }));
        setPosts(formattedPosts);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Lock broken')) throw err;
      console.error("Erro inesperado ao buscar posts:", err);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .or(`client_id.eq.${user.id},provider_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.message.includes('Lock broken')) throw error;
        console.error("Erro ao buscar agendamentos:", error);
        return;
      }
      if (data) setBookings(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Lock broken')) throw err;
      console.error("Erro inesperado ao buscar agendamentos:", err);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.message.includes('Lock broken')) throw error;
        console.error("Erro ao buscar notificações:", error);
        return;
      }
      if (data) setNotifications(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Lock broken')) throw err;
      console.error("Erro inesperado ao buscar notificações:", err);
    }
  };

  const fetchChats = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [user.id])
        .order('updated_at', { ascending: false });
      
      if (error) {
        if (error.message.includes('Lock broken')) throw error;
        console.error("Erro ao buscar conversas:", error);
        return;
      }
      if (data) setChats(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Lock broken')) throw err;
      console.error("Erro inesperado ao buscar conversas:", err);
    }
  };

  const fetchSocial = async () => {
    if (!user) return;
    try {
      const { count: following, error: err1 } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);
      if (err1?.message?.includes('Lock broken')) throw err1;
      
      const { count: followers, error: err2 } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
      if (err2?.message?.includes('Lock broken')) throw err2;
      
      const { data: followingData, error: err3 } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
      if (err3?.message?.includes('Lock broken')) throw err3;
      
      const { count: postsCount, error: err4 } = await supabase.from('services').select('*', { count: 'exact', head: true }).eq('provider_id', user.id);
      if (err4?.message?.includes('Lock broken')) throw err4;
      
      setFollowingCount(following || 0);
      setFollowerCount(followers || 0);
      setFollowers(followingData?.map(d => d.following_id) || []);
      setUserPostsCount(postsCount || 0);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Lock broken')) throw err;
      console.error("Erro ao buscar dados sociais:", err);
    }
  };

  // Centralized data fetcher
  const fetchAllData = async () => {
    if (!isAuthReady || isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setIsLoading(true);
    
    try {
      // Small delay to allow Supabase schema cache to stabilize after SQL changes
      await new Promise(resolve => setTimeout(resolve, 800));

      const promises = [
        safeFetch(fetchServices),
        safeFetch(fetchPosts),
      ];
      
      if (user) {
        promises.push(
          safeFetch(fetchBookings),
          safeFetch(fetchNotifications),
          safeFetch(fetchChats),
          safeFetch(fetchSocial)
        );
      }
      
      await Promise.all(promises);
    } catch (error) {
      console.error("Error fetching all data:", error);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    if (isAuthReady) {
      fetchAllData();
    }
  }, [isAuthReady, user?.id]);

  // Real-time Listeners
  useEffect(() => {
    if (!isAuthReady) return;

    // Categories
    setCategories([
      { id: 'all', nome: 'Todos', icon: 'LayoutGrid', color: 'bg-black' },
      { id: 'barbers', nome: 'Barbeiros', icon: 'Scissors', color: 'bg-red-800' },
      { id: 'tech', nome: 'Tecnicos', icon: 'Cpu', color: 'bg-blue-900' },
      { id: 'cleaning', nome: 'Limpesas', icon: 'Sparkles', color: 'bg-teal-800' },
      { id: 'mechanics', nome: 'Mecanicos', icon: 'Wrench', color: 'bg-orange-800' },
      { id: 'plumbing', nome: 'Canalizadores', icon: 'Droplets', color: 'bg-indigo-900' },
    ]);

    let channels: any[] = [];

    // Global Subscriptions
    const servicesSub = supabase.channel('services_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        if (!isFetchingRef.current) fetchServices();
      })
      .subscribe();
    
    const postsSub = supabase.channel('posts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        if (!isFetchingRef.current) fetchPosts();
      })
      .subscribe();

    channels = [servicesSub, postsSub];

    if (user) {
      const bookingsSub = supabase.channel('bookings_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
          if (!isFetchingRef.current) fetchBookings();
        })
        .subscribe();
        
      const notificationsSub = supabase.channel('notifications_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
          if (!isFetchingRef.current) fetchNotifications();
        })
        .subscribe();

      const chatsSub = supabase.channel('conversations_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
          if (!isFetchingRef.current) fetchChats();
        })
        .subscribe();

      const followsSub = supabase.channel('follows_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, () => {
          if (!isFetchingRef.current) fetchSocial();
        })
        .subscribe();

      channels.push(bookingsSub, notificationsSub, chatsSub, followsSub);
    }

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [isAuthReady, user?.id]);

  const handleStartChat = async (otherUserId: string) => {
    if (!user) {
      setCurrentView('login');
      return;
    }
    if (user.id === otherUserId) return;

    try {
      // Check if conversation already exists
      const { data: existingChats, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [user.id, otherUserId]);

      if (fetchError) throw fetchError;

      if (existingChats && existingChats.length > 0) {
        const existingChat = existingChats[0];
        // Fetch other profile for UI
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();
        
        setSelectedChat({ ...existingChat, otherProfile });
        setCurrentView('chat-detail');
      } else {
        // Get other user profile
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();

        const newConv = {
          participants: [user.id, otherUserId],
          last_message: '',
          participant_names: {
            [user.id]: profile?.name || 'Usuário',
            [otherUserId]: otherProfile?.name || 'Profissional'
          },
          participant_photos: {
            [user.id]: profile?.photoUrl || '',
            [otherUserId]: otherProfile?.photoUrl || ''
          }
        };
        const { data: docRef, error: insertError } = await supabase
          .from('conversations')
          .insert([newConv])
          .select()
          .single();
          
        if (insertError) throw insertError;
        setSelectedChat({ ...docRef, otherProfile });
        setCurrentView('chat-detail');
      }
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const handleFollow = async (user_id_to_follow: string) => {
    if (!user) {
      setCurrentView('login');
      return;
    }
    try {
      const { error } = await supabase.from('follows').insert([
        { follower_id: user.id, following_id: user_id_to_follow }
      ]);
      if (error) throw error;
      setFollowers(prev => [...prev, user_id_to_follow]);
      setFollowingCount(prev => prev + 1);
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleUnfollow = async (user_id_to_unfollow: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', user_id_to_unfollow);
      if (error) throw error;
      setFollowers(prev => prev.filter(id => id !== user_id_to_unfollow));
      setFollowingCount(prev => prev - 1);
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  const handleLogin = async (email?: string) => {
    setIsLoading(true);
    setLoginErrorMessage(null);
    try {
      if (email) {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        alert("Enviamos um link mágico para o seu email. Verifique sua caixa de entrada para acessar sua conta.");
      } else {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.message?.toLowerCase().includes('rate limit') || error.message?.toLowerCase().includes('after')) {
        setLoginErrorMessage("Muitas tentativas. Por favor, aguarde cerca de 1 minuto antes de tentar novamente.");
      } else {
        setLoginErrorMessage(error.message || "Erro ao entrar.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (name: string, email: string, avatarFile: File | null) => {
    setIsLoading(true);
    setLoginErrorMessage(null);
    try {
      if (avatarFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          localStorage.setItem('pending_avatar', reader.result as string);
        };
        reader.readAsDataURL(avatarFile);
      }

      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          data: {
            name: name
          }
        }
      });
      if (error) throw error;
      
      alert("Enviamos um link mágico para o seu email. Verifique sua caixa de entrada para acessar sua conta.");
      setCurrentView('login');
    } catch (error: any) {
      console.error("Register error:", error);
      if (error.message?.toLowerCase().includes('rate limit') || error.message?.toLowerCase().includes('after')) {
        setLoginErrorMessage("Muitas tentativas. Por favor, aguarde cerca de 1 minuto antes de tentar novamente.");
      } else {
        setLoginErrorMessage(error.message || "Erro ao cadastrar.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setCurrentView('marketplace');
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthReady) return <LoadingOverlay />;

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
        {isLoading && currentView !== 'login' && currentView !== 'register' && <LoadingOverlay />}
        {showOnboarding && <OnboardingView onComplete={handleOnboardingComplete} isAuthenticated={!!user} />}
        
        {/* Top Header */}
        {currentView === 'marketplace' && (
          <header className="fixed top-0 left-0 right-0 bg-blue-600 text-white z-50 shadow-lg">
            <div className="px-6 py-4 flex items-center">
              {isSearching ? (
                <div className="flex items-center w-full gap-3 bg-white/10 rounded-full px-4 py-2">
                  <Search className="w-5 h-5 text-white/70" />
                  <input
                    type="text"
                    placeholder="Pesquisar serviços..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder:text-white/70 outline-none text-sm font-medium"
                    autoFocus
                  />
                  <button onClick={() => { setIsSearching(false); setSearchQuery(''); }}>
                    <X className="w-5 h-5 text-white/70 hover:text-white transition-colors" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 relative">
                    <Menu 
                      className="w-6 h-6 cursor-pointer stroke-[3]" 
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                    />
                    
                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsMenuOpen(false)}
                        />
                        <div className="absolute top-10 left-0 w-56 bg-white rounded-[3px] shadow-xl z-50 overflow-hidden border border-zinc-100">
                          <div className="py-2">
                            <button 
                              onClick={() => { setIsMenuOpen(false); setCurrentView('settings'); }}
                              className="w-full px-4 py-3 flex items-center gap-3 text-zinc-600 hover:bg-zinc-50 transition-colors text-left"
                            >
                              <Settings className="w-5 h-5 text-zinc-500" />
                              <span className="text-sm font-bold">Definições</span>
                            </button>
                            <button 
                              onClick={() => { 
                                setIsMenuOpen(false); 
                                window.open('https://wa.me/258855767005?text=Olá,%20preciso%20de%20suporte%20com%20o%20aplicativo%20Biscato.', '_blank'); 
                              }}
                              className="w-full px-4 py-3 flex items-center gap-3 text-zinc-600 hover:bg-zinc-50 transition-colors text-left"
                            >
                              <Headphones className="w-5 h-5 text-zinc-500" />
                              <span className="text-sm font-bold">Suporte</span>
                            </button>
                            <button 
                              onClick={() => { setIsMenuOpen(false); setCurrentView('help'); }}
                              className="w-full px-4 py-3 flex items-center gap-3 text-zinc-600 hover:bg-zinc-50 transition-colors text-left"
                            >
                              <HelpCircle className="w-5 h-5 text-zinc-500" />
                              <span className="text-sm font-bold">Ajuda</span>
                            </button>
                            <button 
                              onClick={() => { setIsMenuOpen(false); setCurrentView('terms'); }}
                              className="w-full px-4 py-3 flex items-center gap-3 text-zinc-600 hover:bg-zinc-50 transition-colors text-left"
                            >
                              <ClipboardList className="w-5 h-5 text-zinc-500" />
                              <span className="text-sm font-bold">Termos e Privacidade</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    <h1 className="text-xl font-bold tracking-tight">Serviiços</h1>
                  </div>
                  
                  {user ? (
                    <button 
                      onClick={() => setCurrentView('create-service')}
                      className="ml-auto mr-4 bg-blue-100 text-blue-600 px-4 py-2 rounded-[30px] font-bold text-sm transition-transform active:scale-95 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Publicar agora...
                    </button>
                  ) : (
                    <button 
                      onClick={() => setCurrentView('login')}
                      className="ml-auto mr-4 bg-blue-100 text-blue-600 px-4 py-2 rounded-[30px] font-bold text-sm transition-transform active:scale-95 flex items-center gap-2"
                    >
                      Entrar
                    </button>
                  )}
                  
                  <div>
                    <Search className="w-6 h-6 cursor-pointer stroke-[3]" onClick={() => setIsSearching(true)} />
                  </div>
                </>
              )}
            </div>

            {/* Categories Bar */}
            <div className="px-1 pb-4 flex items-start gap-0 overflow-x-auto no-scrollbar">
              {categories.map((cat) => {
                const IconComponent = (cat.icon === 'LayoutGrid' ? LayoutGrid : 
                                       cat.icon === 'Scissors' ? Scissors : 
                                       cat.icon === 'Cpu' ? Cpu : 
                                       cat.icon === 'Sparkles' ? Sparkles : 
                                       cat.icon === 'Wrench' ? Wrench : 
                                       cat.icon === 'Droplets' ? Droplets : LayoutGrid);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex flex-col items-center gap-1 min-w-[20%] shrink-0 relative group"
                  >
                    {/* Icon Background - Larger Round */}
                    <div className={cn(
                      "w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all",
                      cat.color || 'bg-zinc-800',
                      "opacity-100"
                    )}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Category Name (Outside) */}
                    <span className={cn(
                      "text-[11px] font-bold italic text-white text-center leading-tight transition-all",
                      selectedCategory === cat.id ? "opacity-100" : "opacity-80"
                    )}>
                      {cat.nome || cat.name}
                    </span>

                    {/* Selection Indicator (Thick Line matching text width) */}
                    {selectedCategory === cat.id && (
                      <div className="w-full h-1 bg-white rounded-full mt-0.5" />
                    )}
                  </button>
                );
              })}
              
              {/* "Mais" Button */}
              <button className="flex flex-col items-center gap-1 min-w-[20%] shrink-0 group">
                <div className="w-[44px] h-[44px] rounded-full bg-blue-500/50 flex items-center justify-center opacity-100">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-[11px] font-bold italic text-white text-center leading-tight opacity-80">
                  Mais
                </span>
              </button>
            </div>
          </header>
        )}

        {/* Navigation Rail / Bottom Bar */}
        {currentView !== 'login' && currentView !== 'register' && currentView !== 'settings' && currentView !== 'help' && currentView !== 'terms' && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-2 py-3 z-50 flex items-center justify-around">
            <NavItem icon={Home} label="Home" active={currentView === 'marketplace'} onClick={() => setCurrentView('marketplace')} />
            <NavItem icon={Calendar} label="Reservas" active={currentView === 'bookings'} onClick={() => user ? setCurrentView('bookings') : setCurrentView('login')} />
            <NavItem icon={Bell} label="Notificações" active={currentView === 'notifications'} onClick={() => user ? setCurrentView('notifications') : setCurrentView('login')} />
            <NavItem icon={MessageSquare} label="Mensagens" active={currentView === 'messages'} onClick={() => user ? setCurrentView('messages') : setCurrentView('login')} />
            <NavItem icon={UserIcon} label="Perfil" active={currentView === 'profile'} onClick={() => user ? setCurrentView('profile') : setCurrentView('login')} />
          </nav>
        )}

        {/* Content Area */}
        <main className={cn(
          "pb-32 px-0 max-w-2xl mx-auto",
          currentView === 'marketplace' ? "pt-[145px]" : "pt-6"
        )}>
          <AnimatePresence mode="wait">
            {!user && currentView === 'login' && (
              <LoginView 
                backgroundImage={services[0]?.images[0]}
                onLogin={handleLogin}
                onSwitchToRegister={() => setCurrentView('register')}
                isLoading={isLoading}
                errorMessage={loginErrorMessage}
              />
            )}

            {!user && currentView === 'register' && (
              <RegisterView 
                backgroundImage={services[1]?.images[0] || services[0]?.images[0]}
                onRegister={handleRegister}
                onSwitchToLogin={() => setCurrentView('login')}
                onLoginWithGoogle={() => handleLogin()}
                isLoading={isLoading}
                errorMessage={loginErrorMessage}
              />
            )}

            {currentView === 'marketplace' && (
              <motion.div 
                key="marketplace"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-0"
              >
                {/* New Gradient Text Section with Lines - Now inside scrollable content */}
                <div className="px-6 py-2 flex items-center gap-3 bg-white border-b border-zinc-100 mb-[2px] mt-1">
                  <div className="flex-1 h-[2px] bg-blue-600 rounded-full"></div>
                  <span className="text-[10px] font-black italic uppercase tracking-tighter text-zinc-900 whitespace-nowrap">
                    Encontre os melhores profissionais perto de si
                  </span>
                  <div className="flex-1 h-[2px] bg-blue-600 rounded-full"></div>
                </div>

                <div className="flex overflow-x-auto gap-[2px] no-scrollbar px-[2px]">
                  {services
                    .filter(s => {
                      const query = searchQuery.toLowerCase();
                      const matchesSearch = query === '' || 
                        s.title.toLowerCase().includes(query) || 
                        s.description.toLowerCase().includes(query) ||
                        (s.providerName || '').toLowerCase().includes(query);
                      
                      if (!matchesSearch) return false;

                      if (selectedCategory === 'all') return true;
                      const cat = (s.category || '').toLowerCase();
                      const sel = selectedCategory.toLowerCase();
                      return cat.includes(sel);
                    })
                    .map(service => (
                    <ServiceCard 
                      key={service.id} 
                      service={service} 
                      onClick={() => {
                        setSelectedService(service);
                        setCurrentView('service-detail');
                      }}
                    />
                  ))}
                  {services.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-6 h-6 text-zinc-200" />
                      </div>
                      <p className="text-zinc-400 font-medium">Nenhum serviço encontrado.</p>
                    </div>
                  )}
                </div>

                <div className="px-6">
                  <div className="h-[3px] bg-zinc-400 w-full" />
                </div>

                <div className="flex flex-col">
                  {services
                    .filter(s => {
                      const query = searchQuery.toLowerCase();
                      const matchesSearch = query === '' || 
                        s.title.toLowerCase().includes(query) || 
                        s.description.toLowerCase().includes(query) ||
                        (s.providerName || '').toLowerCase().includes(query);
                      
                      if (!matchesSearch) return false;

                      if (selectedCategory === 'all') return true;
                      const cat = (s.category || '').toLowerCase();
                      const sel = selectedCategory.toLowerCase();
                      return cat.includes(sel);
                    })
                    .map(service => (
                    <VerticalServiceCard 
                      key={`vertical-${service.id}`} 
                      service={service} 
                      onClick={() => {
                        setSelectedService(service);
                        setCurrentView('service-detail');
                      }}
                    />
                  ))}

                  {/* Feed Section removed per user request */}
                </div>
              </motion.div>
            )}

            {currentView === 'service-detail' && selectedService && (
              <ServiceDetail 
                service={selectedService} 
                onBack={() => setCurrentView('marketplace')}
                onBook={() => setCurrentView('bookings')}
                currentUser={user}
                onRequireLogin={() => setCurrentView('login')}
                onMessage={() => handleStartChat(selectedService.provider_id)}
                onViewProfile={async (user_id) => {
                  const { data } = await supabase.from('profiles').select('*').eq('id', user_id).single();
                  if (data) {
                    setSelectedUser({
                      id: data.id,
                      name: data.displayName || data.name || 'Usuário',
                      email: data.email || '',
                      photoUrl: data.photoURL || data.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
                      verified: data.verified || false,
                      verificationStatus: data.verificationStatus || 'none',
                      plan: data.plan || 'free',
                      created_at: data.created_at
                    });
                    setCurrentView('public-profile');
                  }
                }}
              />
            )}

            {currentView === 'create-service' && (
              <CreateService 
                onBack={() => setCurrentView('marketplace')} 
                onSuccess={() => {
                  setCurrentView('marketplace');
                  fetchServices();
                  fetchPosts();
                }}
                user_id={user?.id || ''}
                profile={profile}
              />
            )}

            {currentView === 'create-post' && (
              <CreatePost 
                onBack={() => setCurrentView('marketplace')} 
                onSuccess={() => {
                  setCurrentView('marketplace');
                  fetchPosts();
                }}
                user_id={user?.id || ''}
                profile={profile}
              />
            )}

            {currentView === 'bookings' && (
              <BookingsScreen 
                onBack={() => setCurrentView('marketplace')} 
              />
            )}

            {currentView === 'profile' && (
              <ProfileView 
                profile={profile} 
                onBack={() => setCurrentView('marketplace')}
                onLogout={handleLogout} 
                onVerify={() => setCurrentView('verification')}
                onViewProfile={(u) => {
                  setSelectedUser(u);
                  setCurrentView('public-profile');
                }}
                followerCount={followerCount}
                followingCount={followingCount}
                postCount={userPostsCount}
                followers={followers}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                onFindPeople={() => setCurrentView('find-people')}
                onEditProfile={() => setCurrentView('settings')}
              />
            )}

            {currentView === 'find-people' && (
              <FindPeopleView 
                onBack={() => setCurrentView('profile')}
                onViewProfile={(u) => {
                  setSelectedUser(u);
                  setCurrentView('public-profile');
                }}
                onFollow={handleFollow}
                followers={followers}
                currentUser={user}
              />
            )}

            {currentView === 'verification' && user && (
              <VerificationView 
                user_id={user.id} 
                onBack={() => setCurrentView('profile')} 
                onSuccess={() => setCurrentView('profile')}
              />
            )}

            {currentView === 'messages' && (
              <ChatList 
                chats={chats}
                currentUser={user}
                onBack={() => setCurrentView('marketplace')} 
                onSelectChat={(chat) => {
                  setSelectedChat(chat);
                  setCurrentView('chat-detail');
                }}
              />
            )}

            {currentView === 'chat-detail' && selectedChat && (
              <ChatDetail 
                chat={selectedChat}
                currentUser={user}
                onBack={() => setCurrentView('messages')}
              />
            )}

            {currentView === 'notifications' && (
              <NotificationsList notifications={notifications} onBack={() => setCurrentView('marketplace')} />
            )}

            {currentView === 'settings' && (
              <SettingsScreen onBack={() => setCurrentView('marketplace')} />
            )}

            {currentView === 'help' && (
              <SupportScreen onBack={() => setCurrentView('marketplace')} />
            )}

            {currentView === 'terms' && (
              <SupportScreen onBack={() => setCurrentView('marketplace')} />
            )}

            {currentView === 'public-profile' && selectedUser && (
              <PublicProfileView 
                profile={selectedUser} 
                onBack={() => setCurrentView('marketplace')} 
                onMessage={() => handleStartChat(selectedUser.id)}
                followers={followers}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    );
}

// --- Sub-Components ---

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

function LoginView({ onLogin, onSwitchToRegister, backgroundImage, isLoading, errorMessage }: { onLogin: (email?: string) => void, onSwitchToRegister: () => void, backgroundImage?: string, isLoading?: boolean, errorMessage?: string | null }) {
  const [email, setEmail] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex flex-col items-center justify-center p-8 space-y-8 relative overflow-hidden bg-white"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 z-0 opacity-5">
        <img 
          src={backgroundImage || "https://picsum.photos/seed/service/1200/800"} 
          className="w-full h-full object-cover blur-md"
          alt="background"
        />
      </div>

      <div className="relative z-10 text-center space-y-3">
        <h1 className="text-3xl font-black tracking-tighter uppercase italic text-blue-600">Acesso Restrito</h1>
        <p className="text-zinc-500 text-xs font-medium max-w-[250px] mx-auto leading-relaxed">
          Entre para gerenciar seus serviços e conectar-se com os melhores profissionais.
        </p>
      </div>

      <div className="relative z-10 w-full max-w-xs space-y-5">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-widest p-3 rounded-[3px]">
            {errorMessage}
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email Profissional</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.nome@exemplo.com"
              className="w-full bg-white border border-zinc-200 rounded-[3px] p-3 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all shadow-sm"
            />
          </div>
        </div>
        
        <button 
          onClick={() => onLogin(email)}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-[3px] text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-blue-700 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Aguarde...
            </>
          ) : (
            "Acessar Conta"
          )}
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200"></div>
          </div>
          <div className="relative flex justify-center text-[9px] uppercase font-black tracking-widest">
            <span className="bg-white px-3 text-zinc-400">Ou</span>
          </div>
        </div>

        <button 
          onClick={() => onLogin()}
          disabled={isLoading}
          className="w-full bg-transparent border border-zinc-200 text-zinc-700 py-3 rounded-[3px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-50 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          Continuar com Google
        </button>
      </div>

      <p className="relative z-10 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4">
        Ainda não faz parte? {' '}
        <button onClick={onSwitchToRegister} className="text-blue-600 font-black hover:underline underline-offset-2">Cadastre-se</button>
      </p>
    </motion.div>
  );
}

function RegisterView({ onRegister, onSwitchToLogin, onLoginWithGoogle, backgroundImage, isLoading, errorMessage }: { 
  onRegister: (name: string, email: string, avatarFile: File | null) => void, 
  onSwitchToLogin: () => void, 
  onLoginWithGoogle: () => void,
  backgroundImage?: string,
  isLoading?: boolean,
  errorMessage?: string | null
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex flex-col items-center justify-center p-8 space-y-8 relative overflow-hidden bg-white"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 z-0 opacity-5">
        <img 
          src={backgroundImage || "https://picsum.photos/seed/register/1200/800"} 
          className="w-full h-full object-cover blur-md"
          alt="background"
        />
      </div>

      <div className="relative z-10 text-center space-y-3">
        <h1 className="text-3xl font-black tracking-tighter uppercase italic text-blue-600">Junte-se à Elite</h1>
        <p className="text-zinc-500 text-xs font-medium max-w-[250px] mx-auto leading-relaxed">
          Crie sua conta para acessar os melhores profissionais e serviços exclusivos.
        </p>
      </div>

      <div className="relative z-10 w-full max-w-xs space-y-5">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-widest p-3 rounded-[3px]">
            {errorMessage}
          </div>
        )}
        
        {/* Avatar Upload */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-zinc-50 border-2 border-dashed border-zinc-300 flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-8 h-8 text-zinc-300" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
              <Upload className="w-3 h-3" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Foto de Perfil</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nome Completo</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como devemos te chamar?"
              className="w-full bg-white border border-zinc-200 rounded-[3px] p-3 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all shadow-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email Profissional</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.nome@exemplo.com"
              className="w-full bg-white border border-zinc-200 rounded-[3px] p-3 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all shadow-sm"
            />
          </div>
        </div>
        
        <button 
          onClick={() => onRegister(name, email, avatarFile)}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-[3px] text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-blue-700 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Aguarde...
            </>
          ) : (
            "Continuar com Email"
          )}
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200"></div>
          </div>
          <div className="relative flex justify-center text-[9px] uppercase font-black tracking-widest">
            <span className="bg-white px-3 text-zinc-400">Ou</span>
          </div>
        </div>

        <button 
          onClick={onLoginWithGoogle}
          disabled={isLoading}
          className="w-full bg-transparent border border-zinc-200 text-zinc-700 py-3 rounded-[3px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-50 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          Continuar com Google
        </button>
      </div>

      <p className="relative z-10 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4">
        Já faz parte da elite? {' '}
        <button onClick={onSwitchToLogin} className="text-blue-600 font-black hover:underline underline-offset-2">Entrar</button>
      </p>
    </motion.div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all active:scale-90",
        active ? "text-zinc-900" : "text-zinc-400"
      )}
    >
      <Icon className={cn("w-[20px] h-[20px] stroke-[3]", active ? "text-zinc-900" : "text-zinc-400")} />
      <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function ServiceCard({ service, onClick }: { service: Service, onClick: () => void, key?: any }) {
  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group bg-white border border-zinc-100 rounded-[3px] overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-zinc-100 transition-all min-w-[280px] sm:min-w-[320px]"
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-zinc-100">
        <img 
          src={service.images?.[0] || `https://picsum.photos/seed/${service.id}/800/600`} 
          alt={service.title} 
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-zinc-900">
          MT {service.price.toLocaleString()}
        </div>
        <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest text-white">
          {service.category}
        </div>
      </div>
      <div className="p-3 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-xs font-bold text-zinc-900 truncate">{service.title}</h3>
          <div className="flex items-center gap-0.5 text-zinc-900 shrink-0">
            <Star className="w-2.5 h-2.5 fill-zinc-900" />
            <span className="text-[10px] font-black">{service.rating.toFixed(1)}</span>
          </div>
        </div>
        <p className="text-zinc-500 text-[10px] line-clamp-1 leading-tight">{service.description}</p>
      </div>
    </motion.div>
  );
}

function PostCard({ post }: { post: Post, key?: any }) {
  return (
    <div className="bg-white border-b border-zinc-100">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden border border-zinc-100">
            <img src={post.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`} alt="User" className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 leading-none">{post.userName || 'Profissional'}</h4>
            <p className="text-[10px] text-zinc-500 mt-1">{format(new Date(post.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
          </div>
        </div>
        <button className="p-2 text-zinc-400 hover:bg-zinc-50 rounded-full">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      
      <div className="px-4 pb-3">
        <h3 className="text-sm font-bold text-zinc-900 mb-1">{post.title}</h3>
        <p className="text-xs text-zinc-600 leading-relaxed">{post.description}</p>
      </div>

      <div className="aspect-square bg-zinc-50 overflow-hidden">
        <img 
          src={post.image_url} 
          alt={post.title} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 group">
            <Heart className="w-6 h-6 text-zinc-900 group-hover:text-red-500 transition-colors" />
            <span className="text-xs font-bold text-zinc-900">{post.likesCount || 0}</span>
          </button>
          <button className="flex items-center gap-1.5 group">
            <MessageCircle className="w-6 h-6 text-zinc-900 group-hover:text-blue-500 transition-colors" />
            <span className="text-xs font-bold text-zinc-900">{post.commentsCount || 0}</span>
          </button>
          <button className="flex items-center gap-1.5 group">
            <Send className="w-6 h-6 text-zinc-900 group-hover:text-green-500 transition-colors" />
            <span className="text-xs font-bold text-zinc-900">{post.sharesCount || 0}</span>
          </button>
        </div>
        <button>
          <Tag className="w-6 h-6 text-zinc-900" />
        </button>
      </div>
    </div>
  );
}

function VerticalServiceCard({ service, onClick }: { service: Service, onClick: () => void, key?: any }) {
  return (
    <div className="bg-white">
      <div className="pb-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200">
              <img src={service.providerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${service.provider_id}`} alt="Provider" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-zinc-900 leading-none">{service.providerName || 'Profissional'}</span>
              <span className="text-[10px] text-zinc-500">{service.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-blue-500 text-white px-4 py-1.5 rounded-[4px] text-xs font-bold">Seguir</button>
            <MoreVertical className="w-5 h-5 text-zinc-900" />
          </div>
        </div>

      {/* Image */}
      <div className="w-full aspect-[4/5] bg-zinc-100 relative cursor-pointer" onClick={onClick}>
        <img 
          src={service.images?.[0] || `https://picsum.photos/seed/${service.id}/800/1000`} 
          alt={service.title} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {/* Price tag */}
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white">
          MT {service.price.toLocaleString()}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1.5 rounded-[3px] transition-colors hover:bg-zinc-200">
            <Heart className="w-5 h-5 text-zinc-900" />
            <span className="text-xs font-bold text-zinc-900">{service.likesCount || 0}</span>
          </button>
          <button className="flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1.5 rounded-[3px] transition-colors hover:bg-zinc-200">
            <MessageCircle className="w-5 h-5 text-zinc-900" />
            <span className="text-xs font-bold text-zinc-900">{service.commentsCount || 0}</span>
          </button>
          <button className="flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1.5 rounded-[3px] transition-colors hover:bg-zinc-200">
            <Send className="w-5 h-5 text-zinc-900" />
            <span className="text-xs font-bold text-zinc-900">{service.sharesCount || 0}</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1.5 rounded-[3px]">
          <Star className="w-5 h-5 fill-zinc-900 text-zinc-900" />
          <span className="text-xs font-bold text-zinc-900">{service.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Caption */}
      <div className="px-4 space-y-1 pb-4">
        <p className="text-sm">
          <span className="font-bold mr-2">{service.providerName || 'Profissional'}</span>
          {service.title}
        </p>
        <p className="text-xs text-zinc-500 line-clamp-2">{service.description}</p>
        <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-2 cursor-pointer">Ver todos os comentários</p>
      </div>
      </div>

      {/* Division Bar */}
      <div className="px-6 pb-2">
        <div className="h-[3px] bg-zinc-400 w-full" />
      </div>
    </div>
  );
}

function ServiceDetail({ service, onBack, onBook, currentUser, onRequireLogin, onMessage, onViewProfile }: { service: Service, onBack: () => void, onBook: () => void, currentUser: User | null, onRequireLogin: () => void, onMessage: () => void, onViewProfile: (user_id: string) => void }) {
  const [showBookingModal, setShowBookingModal] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <header className="sticky top-0 bg-white z-10 shadow-sm -mx-4 px-4 py-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-zinc-900">Detalhes do serviço</h2>
        </div>
        <button 
          onClick={onMessage}
          className="p-2 bg-zinc-50 rounded-full text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </header>

      <div className="aspect-video rounded-3xl overflow-hidden bg-zinc-100 shadow-2xl shadow-zinc-100">
        <img 
          src={service.images?.[0] || `https://picsum.photos/seed/${service.id}/1200/800`} 
          alt={service.title} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-zinc-900">{service.title}</h1>
          <div className="text-2xl font-black text-zinc-900">MT {service.price.toLocaleString()}</div>
        </div>

        <div 
          onClick={() => onViewProfile(service.provider_id)}
          className="flex items-center gap-3 cursor-pointer hover:bg-zinc-50 p-2 rounded-lg transition-colors -mx-2"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200">
            <img src={service.providerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${service.provider_id}`} alt="Provider" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-bold text-zinc-900">{service.providerName || 'Profissional'}</div>
            <div className="text-xs text-zinc-500">Ver perfil</div>
          </div>
        </div>

        <p className="text-zinc-500 leading-relaxed text-lg">{service.description}</p>

        <div className="p-8 bg-zinc-50 rounded-3xl space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Pronto para começar?</h3>
          <p className="text-sm text-zinc-500">Agende agora mesmo e receba o melhor atendimento profissional.</p>
          <button 
            onClick={() => {
              if (!currentUser) {
                onRequireLogin();
              } else {
                setShowBookingModal(true);
              }
            }}
            className="w-full bg-zinc-900 text-white py-5 rounded-[3px] font-black uppercase tracking-widest text-sm shadow-xl shadow-zinc-200 transition-transform active:scale-95"
          >
            {!currentUser ? 'Entrar para Reservar' : 'Reservar Agora'}
          </button>
        </div>
      </div>

      {showBookingModal && (
        <BookingModal 
          service={service} 
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            onBook();
          }}
        />
      )}
    </motion.div>
  );
}

function CreatePost({ onBack, onSuccess, user_id, profile }: { onBack: () => void, onSuccess: () => void, user_id: string, profile: UserProfile | null }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !imageFile) {
      alert("Preencha todos os campos e adicione uma imagem.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Get User
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Usuário não autenticado");

      // 2. Upload Image to "posts" bucket
      const filePath = `${user.id}/${imageFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Erro: O bucket "posts" não foi encontrado no Supabase. Por favor, crie um bucket público chamado "posts" no seu painel do Supabase.');
        }
        throw uploadError;
      }

      // 3. Get Public URL
      const { data } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      const imageUrl = data.publicUrl;

      // 4. Insert into "posts" table
      const { error: insertError } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          title: title,
          description: description,
          image_url: imageUrl,
          created_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      alert("Publicado com sucesso!");
      onSuccess();
    } catch (error: any) {
      console.error("Create post error:", error);
      alert(error.message || "Erro ao publicar post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 px-6"
    >
      <header className="sticky top-0 bg-white z-10 shadow-sm -mx-6 px-6 py-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-blue-600">Novo Post</h2>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mt-1">Partilhe algo com a comunidade</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div 
          onClick={() => document.getElementById('post-image')?.click()}
          className="aspect-square bg-zinc-50 rounded-[3px] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-100 transition-all overflow-hidden relative"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <Camera className="w-8 h-8" />
              <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Foto</span>
            </div>
          )}
          <input 
            id="post-image"
            type="file" 
            accept="image/*" 
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Título do Post</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="O que está a acontecer?"
            className="w-full bg-zinc-50 border border-zinc-100 rounded-[3px] p-3 text-xs font-bold focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Descrição</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Escreva uma legenda para o seu post..."
            className="w-full bg-zinc-50 border border-zinc-100 rounded-[3px] p-3 text-xs font-bold focus:ring-2 focus:ring-blue-600 transition-all min-h-[120px]"
          />
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2.5 rounded-[3px] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Publicando...
            </>
          ) : 'Publicar Post'}
        </button>
      </form>
    </motion.div>
  );
}

function CreateService({ onBack, onSuccess, user_id, profile }: { onBack: () => void, onSuccess: () => void, user_id: string, profile: UserProfile | null }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Barbeiro');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !price || !imageFile) {
      alert("Preencha todos os campos e adicione uma imagem.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Get current user to be absolutely sure of the ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Usuário não autenticado");

      // 2. Upload Image
      const filePath = `${user.id}/${imageFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from('services')
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Erro: O bucket "services" não foi encontrado. Crie um bucket público chamado "services".');
        }
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('services')
        .getPublicUrl(filePath);

      const imageUrl = data.publicUrl;

      // 3. Insert into Services
      const newService = {
        title,
        category,
        description,
        price: Number(price),
        provider_id: user.id,
        user_id: user.id, // Adding user_id just in case RLS policy expects it
        images: [imageUrl],
        rating: 5.0,
        providerName: profile?.name || 'Profissional',
        providerPhoto: profile?.photoUrl || '',
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('services')
        .insert([newService]);

      if (insertError) throw insertError;

      // 4. Insert into Posts (Feed)
      await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          title: title,
          description: description,
          image_url: imageUrl,
          created_at: new Date().toISOString()
        }]);

      alert("Serviço publicado com sucesso!");
      onSuccess();
    } catch (error: any) {
      console.error("Create service error:", error);
      alert(error.message || "Erro ao publicar serviço.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 px-6"
    >
      <header className="sticky top-0 bg-white z-10 shadow-sm -mx-6 px-6 py-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-blue-600 italic uppercase">Novo Serviço</h2>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Anuncie o seu talento</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Area */}
        <div 
          onClick={() => document.getElementById('service-image')?.click()}
          className="aspect-video bg-zinc-50 rounded-[3px] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-100 transition-all overflow-hidden relative group"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-400 group-hover:text-blue-500 transition-colors">
              <Camera className="w-10 h-10" />
              <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Foto do Trabalho</span>
            </div>
          )}
          <input 
            id="service-image"
            type="file" 
            accept="image/*" 
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Categoria</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-[3px] p-3 text-xs font-bold focus:ring-2 focus:ring-blue-600 appearance-none"
            >
              <option>Barbeiro</option>
              <option>Técnico</option>
              <option>Limpeza</option>
              <option>Mecânico</option>
              <option>Canalizador</option>
              <option>Outro</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Preço (MT)</label>
            <input 
              type="number" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-zinc-50 border border-zinc-100 rounded-[3px] p-3 text-xs font-bold focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Título do Serviço</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Corte de Cabelo Moderno"
            className="w-full bg-zinc-50 border border-zinc-100 rounded-[3px] p-3 text-xs font-bold focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Descrição Detalhada</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o que está incluído no seu serviço..."
            className="w-full bg-zinc-50 border border-zinc-100 rounded-[3px] p-3 text-xs font-bold focus:ring-2 focus:ring-blue-600 min-h-[120px]"
          />
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-4 rounded-[3px] text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Confirmar Publicação
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}

function ProfileView({ profile, onBack, onLogout, onVerify, onViewProfile, followerCount, followingCount, postCount, followers, onFollow, onUnfollow, onFindPeople, onEditProfile }: { profile: UserProfile | null, onBack: () => void, onLogout: () => void, onVerify: () => void, onViewProfile: (user: UserProfile) => void, followerCount: number, followingCount: number, postCount: number, followers: string[], onFollow: (id: string) => void, onUnfollow: (id: string) => void, onFindPeople: () => void, onEditProfile: () => void }) {
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const fetchSuggested = async () => {
      if (!profile) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', profile.id)
        .limit(10);
      
      if (data) {
        // Filter out users we are already following
        const filtered = data.filter(u => !followers.includes(u.id));
        setSuggestedUsers(filtered.map(p => ({
          id: p.id,
          name: p.displayName || 'Usuário',
          photoUrl: p.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
          verified: p.verified || false,
          verificationStatus: p.verificationStatus || 'none',
          plan: p.plan || 'free',
          email: '',
          created_at: null
        })));
      }
    };
    fetchSuggested();
  }, [profile, followers]);

  if (!profile) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <header className="sticky top-0 bg-white z-10 shadow-sm -mx-4 px-4 py-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black tracking-tighter text-zinc-900">Perfil</h2>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onLogout} className="p-2 bg-zinc-100 rounded-full text-zinc-900">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Header with Username and Stats */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-200">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-blue-500" />
              )}
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-sm font-bold">{postCount}</div>
              <div className="text-[10px] text-zinc-500">posts</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold">{followerCount}</div>
              <div className="text-[10px] text-zinc-500">seguidores</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold">{followingCount}</div>
              <div className="text-[10px] text-zinc-500">seguindo</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2">
        <h2 className="text-sm font-bold">{(profile.name || '').toLowerCase()}</h2>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 px-2">
        <button onClick={onEditProfile} className="flex-1 bg-blue-500 text-white py-2 rounded-[3px] text-xs font-bold">
          Editar perfil
        </button>
        <button className="flex-1 bg-zinc-800 text-white py-2 rounded-[3px] text-xs font-bold">
          Compartilhar perfil
        </button>
        <button onClick={onFindPeople} className="bg-zinc-800 text-white p-2 rounded-[3px]">
          <UserPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Find People Section */}
      {suggestedUsers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold">Encontrar pessoas</h3>
            <button onClick={onFindPeople} className="text-blue-500 text-xs font-bold">Ver tudo</button>
          </div>
          <div className="flex overflow-x-auto gap-3 px-2 no-scrollbar pb-4">
            {suggestedUsers.map((person, i) => (
              <div 
                key={i} 
                onClick={() => onViewProfile(person)}
                className="min-w-[140px] border border-zinc-200 rounded-[3px] p-4 flex flex-col items-center text-center space-y-3 relative cursor-pointer"
              >
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setSuggestedUsers(prev => prev.filter(u => u.id !== person.id));
                  }}
                  className="absolute top-2 right-2 text-zinc-400"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="w-16 h-16 rounded-full overflow-hidden border border-zinc-100">
                  <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-[10px] font-bold truncate w-full">{person.name}</div>
                  <div className="text-[8px] text-zinc-400">Sugestões para você</div>
                </div>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onFollow(person.id);
                  }}
                  className="w-full bg-blue-500 text-white py-1.5 rounded-[3px] text-[10px] font-bold"
                >
                  Seguir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-t border-zinc-100">
        <button className="flex-1 py-3 flex justify-center border-b-2 border-zinc-900">
          <LayoutGrid className="w-5 h-5" />
        </button>
        <button className="flex-1 py-3 flex justify-center text-zinc-400">
          <UserIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Empty State */}
      <div className="py-12 text-center space-y-4">
        <h3 className="text-lg font-bold">Capture o momento com um amigo</h3>
        <button className="bg-zinc-800 text-white px-6 py-2 rounded-[3px] text-xs font-bold">
          Crie seu primeiro post
        </button>
      </div>

      <div className="pt-10">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          Sair da Conta
        </button>
      </div>
    </motion.div>
  );
}

function FindPeopleView({ onBack, onViewProfile, onFollow, followers, currentUser }: { onBack: () => void, onViewProfile: (user: UserProfile) => void, onFollow: (id: string) => void, followers: string[], currentUser: User | null }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(50);
      
      if (!error && data) {
        const unfollowed = data.filter(u => !followers.includes(u.id) && u.id !== currentUser?.id);
        setUsers(unfollowed.map(p => ({
          id: p.id,
          name: p.displayName || p.name || 'Usuário',
          email: p.email || '',
          photoUrl: p.photoURL || p.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
          verified: p.verified || false,
          verificationStatus: p.verificationStatus || 'none',
          plan: p.plan || 'free',
          created_at: p.created_at
        })));
      }
      setLoading(false);
    };
    fetchUsers();
  }, [followers, currentUser]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed inset-0 bg-white z-[60] overflow-y-auto"
    >
      <header className="sticky top-0 bg-white border-b border-zinc-100 px-4 py-3 flex items-center gap-3 z-10 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="font-bold text-zinc-900">Encontrar pessoas</h2>
      </header>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-sm">
            Nenhuma sugestão no momento.
          </div>
        ) : (
          users.map(person => (
            <div key={person.id} className="flex items-center justify-between bg-zinc-50 p-3 rounded-[3px]">
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => onViewProfile(person)}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-200">
                  <img src={person.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.id}`} alt={person.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-900">{person.name}</div>
                  <div className="text-[10px] text-zinc-500">Sugestão para você</div>
                </div>
              </div>
              <button 
                onClick={() => onFollow(person.id)}
                className="bg-blue-500 text-white px-4 py-1.5 rounded-[3px] text-xs font-bold"
              >
                Seguir
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function PublicProfileView({ profile, onBack, onMessage, followers, onFollow, onUnfollow }: { profile: UserProfile, onBack: () => void, onMessage: () => void, followers: string[], onFollow: (id: string) => void, onUnfollow: (id: string) => void }) {
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const isFollowing = followers.includes(profile.id);

  useEffect(() => {
    const fetchStats = async () => {
      const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id);
      const { count: followersCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id);
      const { count: posts } = await supabase.from('services').select('*', { count: 'exact', head: true }).eq('provider_id', profile.id);
      
      setFollowingCount(following || 0);
      setFollowerCount(followersCount || 0);
      setPostCount(posts || 0);
    };
    fetchStats();
  }, [profile.id]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed inset-0 bg-white z-[60] overflow-y-auto"
    >
      <header className="sticky top-0 bg-white border-b border-zinc-100 px-4 py-3 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="font-bold text-zinc-900">{profile.name}</h2>
        </div>
        <div className="flex items-center gap-4 text-zinc-600">
          <Bell className="w-6 h-6" />
          <MoreVertical className="w-6 h-6" />
        </div>
      </header>

      <div className="p-4 space-y-6">
        <div className="flex items-center gap-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-zinc-100">
              <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[8px] font-black px-2 py-0.5 rounded-sm">
              NEW
            </div>
          </div>
          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <div className="text-sm font-bold">{postCount}</div>
              <div className="text-[10px] text-zinc-500">posts</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold">{followerCount}</div>
              <div className="text-[10px] text-zinc-500">seguidores</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold">{followingCount}</div>
              <div className="text-[10px] text-zinc-500">seguindo</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold">{profile.name}</h3>
        </div>

        <div className="flex gap-2">
          {isFollowing ? (
            <button 
              onClick={() => {
                onUnfollow(profile.id);
                setFollowerCount(prev => prev - 1);
              }}
              className="flex-1 bg-zinc-800 text-white py-2 rounded-[3px] text-xs font-bold flex items-center justify-center gap-1"
            >
              Seguindo <ChevronDown className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={() => {
                onFollow(profile.id);
                setFollowerCount(prev => prev + 1);
              }}
              className="flex-1 bg-blue-500 text-white py-2 rounded-[3px] text-xs font-bold flex items-center justify-center gap-1"
            >
              Seguir
            </button>
          )}
          <button 
            onClick={onMessage}
            className="flex-1 bg-zinc-800 text-white py-2 rounded-[3px] text-xs font-bold"
          >
            Mensagem
          </button>
        </div>

        <div className="flex border-t border-zinc-100">
          <button className="flex-1 py-3 flex justify-center border-b-2 border-zinc-900">
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button className="flex-1 py-3 flex justify-center text-zinc-400">
            <UserIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1">
          <div className="aspect-square bg-zinc-100">
            <img src={profile.photoUrl} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileButton({ icon: Icon, label, sub, onClick }: { icon: any, label: string, sub?: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-6 bg-white border border-zinc-100 rounded-3xl hover:bg-zinc-50 transition-all group active:scale-[0.98]"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-all">
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <div className="font-black uppercase tracking-widest text-xs text-zinc-900">{label}</div>
          {sub && <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{sub}</div>}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-zinc-200" />
    </button>
  );
}

function VerificationView({ user_id, onBack, onSuccess }: { user_id: string, onBack: () => void, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biFront, setBiFront] = useState<File | null>(null);
  const [biBack, setBiBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!biFront || !biBack || !selfie) {
      alert("Por favor, carregue todos os documentos.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload Images
      const uploadImage = async (file: File, path: string) => {
        const { error } = await supabase.storage
          .from('verifications')
          .upload(path, file);
        if (error) {
          if (error.message.includes('Bucket not found')) {
            throw new Error('Erro: O bucket "verifications" não foi encontrado no Supabase. Por favor, crie um bucket público chamado "verifications" no seu painel do Supabase.');
          }
          throw error;
        }
        const { data } = supabase.storage
          .from('verifications')
          .getPublicUrl(path);
        return data.publicUrl;
      };

      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadImage(biFront, `${user_id}/bi-front.jpg`),
        uploadImage(biBack, `${user_id}/bi-back.jpg`),
        uploadImage(selfie, `${user_id}/selfie.jpg`)
      ]);

      const { error: insertError } = await supabase.from('verifications').insert([{
        user_id,
        biFront: frontUrl,
        biBack: backUrl,
        selfie: selfieUrl,
        status: 'pending'
      }]);

      if (insertError) throw insertError;

      // Update user status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ verificationStatus: 'pending' })
        .eq('id', user_id);

      if (updateError) throw updateError;

      alert("Pedido de verificação enviado!");
      onSuccess();
    } catch (error) {
      console.error("Verification error:", error);
      alert("Erro ao enviar verificação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="sticky top-0 bg-white z-10 shadow-sm -mx-4 px-4 py-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black tracking-tighter text-zinc-900">Verificar</h2>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <DocUpload label="BI Frente" onChange={setBiFront} />
        <DocUpload label="BI Verso" onChange={setBiBack} />
        <DocUpload label="Selfie com BI" onChange={setSelfie} />

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-zinc-900 text-white py-5 rounded-[3px] font-black uppercase tracking-widest text-sm shadow-xl shadow-zinc-200 transition-transform active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Documentos'}
        </button>
      </form>
    </motion.div>
  );
}

function DocUpload({ label, onChange }: { label: string, onChange: (file: File) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">{label}</label>
      <div 
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
              onChange(file);
              setPreview(URL.createObjectURL(file));
            }
          };
          input.click();
        }}
        className="aspect-video bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-100 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-100 transition-all overflow-hidden relative"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-6 h-6 text-zinc-200" />
        )}
      </div>
    </div>
  );
}

const MOCK_CHATS = [
  { id: 1, name: '+258 84 066 4285', message: 'Tudo bem Grança?', time: '20:42', unread: 1, avatar: 'https://picsum.photos/seed/chat1/100/100' },
  { id: 2, name: '+258 84 555 8656', message: 'Normal mulher itu', time: '20:41', unread: 1, avatar: 'https://picsum.photos/seed/chat2/100/100' },
  { id: 3, name: 'Jully Mulhope', message: '✓✓ Obrigad', time: '20:39', unread: 0, avatar: 'https://picsum.photos/seed/chat3/100/100' },
  { id: 4, name: 'Foco no Aprendizado', message: 'Foi removido/a por +258 84 027 3176', time: '20:42', unread: 1, avatar: 'https://picsum.photos/seed/chat4/100/100' },
  { id: 5, name: '+258 85 018 3795', message: '✓ Oi', time: '20:14', unread: 0, avatar: 'https://picsum.photos/seed/chat5/100/100' },
];

function ChatList({ chats, currentUser, onBack, onSelectChat }: { chats: any[], currentUser: User | null, onBack: () => void, onSelectChat: (chat: any) => void }) {
  const [chatProfiles, setChatProfiles] = useState<{[key: string]: UserProfile}>({});

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchProfiles = async () => {
      const newProfiles: {[key: string]: UserProfile} = {};
      for (const chat of chats) {
        const otherId = chat.participants.find((p: string) => p !== currentUser.id);
        if (otherId && !chatProfiles[otherId]) {
          const { data } = await supabase.from('profiles').select('*').eq('id', otherId).single();
          if (data) {
            newProfiles[otherId] = data;
          }
        }
      }
      if (Object.keys(newProfiles).length > 0) {
        setChatProfiles(prev => ({ ...prev, ...newProfiles }));
      }
    };

    fetchProfiles();
  }, [chats, currentUser]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white pb-20"
    >
      <header className="sticky top-0 bg-white z-10 px-4 py-3 space-y-4 border-b border-zinc-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black tracking-tighter text-zinc-900">Mensagens</h2>
        </div>
      </header>
      
      <div className="divide-y divide-zinc-50">
        {chats.map(chat => {
          const otherId = chat.participants.find((p: string) => p !== currentUser?.id);
          const otherProfile = chatProfiles[otherId || ''];
          
          return (
            <div 
              key={chat.id} 
              onClick={() => onSelectChat({ ...chat, otherProfile })}
              className="flex items-center gap-4 p-4 hover:bg-zinc-50 cursor-pointer transition-colors active:bg-zinc-100"
            >
              <div className="w-14 h-14 rounded-full bg-zinc-100 overflow-hidden shrink-0">
                {otherProfile?.photoUrl ? (
                  <img src={otherProfile.photoUrl} alt={otherProfile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <UserIcon className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-zinc-900 truncate">{otherProfile?.name || 'Carregando...'}</h3>
                  <span className="text-xs font-bold text-zinc-400 shrink-0">
                    {chat.updated_at ? format(new Date(chat.updated_at), "HH:mm") : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold text-zinc-500 truncate">{chat.last_message || 'Sem mensagens'}</p>
                </div>
              </div>
            </div>
          );
        })}
        {chats.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6 text-zinc-200" />
            </div>
            <p className="text-zinc-400 font-medium">Nenhuma conversa iniciada.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function NotificationsList({ notifications, onBack }: { notifications: any[], onBack: () => void }) {
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white pb-20"
    >
      <header className="sticky top-0 bg-white z-10 px-4 py-3 flex items-center justify-between border-b border-zinc-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-black tracking-tight text-zinc-900">Notificações</h2>
        </div>
      </header>
      
      <div className="px-4 py-3">
        <div className="space-y-0">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={cn(
                "flex gap-3 py-4 border-b border-zinc-50 transition-colors",
                !notif.read && "bg-blue-50/30"
              )}
              onClick={() => !notif.read && markAsRead(notif.id)}
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center overflow-hidden">
                  {notif.fromPhoto ? (
                    <img src={notif.fromPhoto} alt={notif.fromName} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center",
                  notif.type === 'like' ? "bg-red-500" :
                  notif.type === 'comment' ? "bg-blue-500" :
                  notif.type === 'booking' ? "bg-emerald-500" :
                  "bg-zinc-500"
                )}>
                  {notif.type === 'like' && <Heart className="w-2 h-2 text-white fill-white" />}
                  {notif.type === 'comment' && <MessageCircle className="w-2 h-2 text-white" />}
                  {notif.type === 'booking' && <Calendar className="w-2 h-2 text-white" />}
                  {notif.type === 'follow' && <UserPlus className="w-2 h-2 text-white" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-900 leading-tight">
                  <span className="font-bold">{notif.fromName}</span> {notif.message}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {notif.created_at ? format(new Date(notif.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR }) : 'Recentemente'}
                </p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 bg-blue-600 rounded-full self-center shrink-0" />
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6 text-zinc-200" />
              </div>
              <p className="text-zinc-400 font-medium">Nenhuma notificação.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ChatDetail({ chat, currentUser, onBack }: { chat: any, currentUser: User | null, onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chat.id) return;
    
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', chat.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    const subscription = supabase.channel(`messages_${chat.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${chat.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await supabase.from('messages').insert([{
        conversation_id: chat.id,
        sender_id: currentUser.id,
        text
      }]);

      await supabase.from('conversations').update({
        last_message: text,
        updated_at: new Date().toISOString()
      }).eq('id', chat.id);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 bg-zinc-50 z-50 flex flex-col"
    >
      <header className="bg-white border-b border-zinc-100 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden">
            {chat.otherProfile?.photoUrl ? (
              <img src={chat.otherProfile.photoUrl} alt={chat.otherProfile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <UserIcon className="w-5 h-5" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900">{chat.otherProfile?.name || 'Conversa'}</h2>
            <p className="text-[10px] font-bold text-blue-600">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-blue-600">
          <Video className="w-5 h-5" />
          <Phone className="w-5 h-5" />
          <MoreVertical className="w-5 h-5 text-zinc-600" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex items-end gap-2",
              msg.sender_id === currentUser?.id ? "justify-end" : "justify-start"
            )}
          >
            {msg.sender_id !== currentUser?.id && (
              <div className="w-6 h-6 rounded-full bg-zinc-100 overflow-hidden shrink-0">
                {chat.otherProfile?.photoUrl && (
                  <img src={chat.otherProfile.photoUrl} alt="Other" className="w-full h-full object-cover" />
                )}
              </div>
            )}
            <div className={cn(
              "px-4 py-2 max-w-[75%] shadow-sm",
              msg.sender_id === currentUser?.id 
                ? "bg-blue-600 text-white rounded-2xl rounded-br-none" 
                : "bg-white border border-zinc-100 rounded-2xl rounded-bl-none text-zinc-900"
            )}>
              <p className="text-sm font-medium">{msg.text}</p>
              <div className={cn(
                "flex items-center gap-1 mt-1",
                msg.sender_id === currentUser?.id ? "justify-end" : "justify-start"
              )}>
                <span className={cn("text-[10px] font-bold", msg.sender_id === currentUser?.id ? "text-blue-200" : "text-zinc-400")}>
                  {msg.created_at ? format(new Date(msg.created_at), "HH:mm") : '...'}
                </span>
                {msg.sender_id === currentUser?.id && <CheckCheck className="w-3 h-3 text-blue-200" />}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="bg-white border-t border-zinc-100 p-3 shrink-0">
        <div className="flex items-center gap-2 bg-zinc-100 rounded-full px-4 py-2">
          <button type="button" className="text-zinc-400 hover:text-blue-600 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Mensagem" 
            className="flex-1 bg-transparent text-sm font-medium text-zinc-900 placeholder:text-zinc-500 focus:outline-none px-2"
          />
          <button type="submit" className={cn("transition-colors", newMessage.trim() ? "text-blue-600" : "text-zinc-400")}>
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function OnboardingView({ onComplete, isAuthenticated }: { onComplete: (toLogin: boolean) => void, isAuthenticated: boolean }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = () => {
    onComplete(!isAuthenticated);
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto text-zinc-900 selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-[3px] flex items-center justify-center font-black text-white italic">S</div>
          <span className="font-bold tracking-tight text-xl text-zinc-900">Serviços Pro</span>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors hidden sm:block">Serviços</button>
          <button className="p-2 hover:bg-zinc-100 rounded-[3px] transition-colors">
            <Menu className="w-6 h-6 text-zinc-600" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-12 md:pt-20 pb-20 md:pb-32 overflow-hidden bg-white">
        <div className="relative max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-tight md:leading-[1.1] text-zinc-900 italic uppercase">
            Sua carreira <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">profissional</span> começa aqui
          </h1>
          
          <div className="max-w-2xl mx-auto">
            <p className="text-base md:text-2xl font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500">
              O Serviços Pro é a ferramenta definitiva para quem busca excelência. 
              Conectamos talentos a oportunidades reais, automatizando sua gestão.
            </p>
          </div>

          <div className="pt-4 md:pt-8 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <button 
              onClick={handleAction}
              className="w-full sm:w-auto min-w-[140px] bg-blue-600 text-white px-6 py-3 rounded-[3px] font-bold uppercase tracking-wider text-[10px] shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
            >
              Começar Agora
            </button>
            <button 
              onClick={handleAction}
              className="w-full sm:w-auto min-w-[140px] bg-blue-600 text-white px-6 py-3 rounded-[3px] font-bold uppercase tracking-wider text-[10px] shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
            >
              Entrar
            </button>
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="px-4 md:px-6 py-12 md:py-20 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[3px] overflow-hidden border border-zinc-200 shadow-lg">
            <img 
              src="https://picsum.photos/seed/app-preview/1200/800?grayscale" 
              alt="App Preview" 
              className="w-full h-auto"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-6 py-16 md:py-32 max-w-4xl mx-auto space-y-12 md:space-y-20">
        <div className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-zinc-900">Como funciona</h2>
          <div className="h-1 w-12 md:w-16 bg-blue-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="flex gap-4 md:block md:space-y-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-[3px] flex items-center justify-center text-blue-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="space-y-1 md:space-y-4">
              <h3 className="text-base md:text-lg font-bold text-zinc-900">Crie seu Perfil</h3>
              <p className="text-zinc-500 text-[10px] md:text-xs leading-relaxed">
                Destaque suas habilidades com um perfil profissional completo.
              </p>
            </div>
          </div>

          <div className="flex gap-4 md:block md:space-y-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-[3px] flex items-center justify-center text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="space-y-1 md:space-y-4">
              <h3 className="text-base md:text-lg font-bold text-zinc-900">Gerencie Agendas</h3>
              <p className="text-zinc-500 text-[10px] md:text-xs leading-relaxed">
                Organize seu dia com nosso sistema de agendamento inteligente.
              </p>
            </div>
          </div>

          <div className="flex gap-4 md:block md:space-y-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-[3px] flex items-center justify-center text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="space-y-1 md:space-y-4">
              <h3 className="text-base md:text-lg font-bold text-zinc-900">Cresça seu Negócio</h3>
              <p className="text-zinc-500 text-[10px] md:text-xs leading-relaxed">
                Acompanhe seu desempenho e atraia clientes qualificados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Terms & Info */}
      <section className="px-6 py-16 md:py-32 bg-white border-t border-zinc-100">
        <div className="max-w-4xl mx-auto space-y-8 md:space-y-12">
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-lg md:text-xl font-bold text-zinc-900">Termos e Compromissos</h2>
            <p className="text-zinc-400 text-[10px] md:text-xs leading-relaxed">
              Ao utilizar o Serviços Pro, você concorda em manter um padrão de excelência. 
              Garantimos a segurança dos seus dados e a transparência.
            </p>
          </div>

          <div className="pt-8 md:pt-12 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 bg-zinc-900 rounded-[3px] flex items-center justify-center text-[10px] font-black text-white italic">S</div>
              <span className="font-bold text-[10px] md:text-xs text-zinc-900">Serviços Pro © 2026</span>
            </div>
            <button 
              onClick={handleAction}
              className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
            >
              Entrar no App →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

