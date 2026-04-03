// Settings Screen Component
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Camera, 
  Key, 
  LogOut, 
  Trash2, 
  Bell, 
  Moon, 
  Sun, 
  Palette, 
  Globe, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  UserX, 
  CreditCard, 
  MessageCircle, 
  HelpCircle, 
  FileText, 
  AlertTriangle, 
  Star, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  ArrowLeft,
  Check,
  X,
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';

interface SettingsScreenProps {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateName = async () => {
    if (!newName) return;
    setIsUpdatingName(true);
    await updateProfileData({ full_name: newName });
    setNewName('');
    setIsUpdatingName(false);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showFeedback("A senha deve ter pelo menos 6 caracteres.", 'error');
      return;
    }
    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) showFeedback(error.message, 'error');
    else showFeedback("Senha alterada!", 'success');
    setNewPassword('');
    setIsUpdatingPassword(false);
  };

  // Real-time data
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [privacy, setPrivacy] = useState<any>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [legal, setLegal] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Profile
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) setProfile(profileData);

      // Settings
      const { data: settingsData } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
      if (settingsData) setSettings(settingsData);

      // Privacy
      const { data: privacyData } = await supabase.from('user_privacy').select('*').eq('user_id', user.id).single();
      if (privacyData) setPrivacy(privacyData);

      // FAQs
      const { data: faqData } = await supabase.from('faq').select('*');
      if (faqData) setFaqs(faqData);

      // Legal
      const { data: legalData } = await supabase.from('legal').select('*');
      if (legalData) setLegal(legalData);
    };

    fetchData();

    // Subscriptions
    const profileSub = supabase.channel(`profiles_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
        setProfile(payload.new);
      }).subscribe();

    const settingsSub = supabase.channel(`user_settings_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${user.id}` }, (payload) => {
        setSettings(payload.new);
      }).subscribe();

    const privacySub = supabase.channel(`user_privacy_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_privacy', filter: `user_id=eq.${user.id}` }, (payload) => {
        setPrivacy(payload.new);
      }).subscribe();

    return () => {
      supabase.removeChannel(profileSub);
      supabase.removeChannel(settingsSub);
      supabase.removeChannel(privacySub);
    };
  }, [user]);

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onBack();
    } catch (error: any) {
      showFeedback(error.message, 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm("Tem certeza que deseja excluir sua conta? Esta ação é irreversível.")) return;

    setLoading(true);
    try {
      // Delete from Database (Supabase handles cascading deletes if configured, otherwise manual)
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.from('user_settings').delete().eq('id', user.id);
      await supabase.from('user_privacy').delete().eq('id', user.id);
      
      // Delete user from Auth (Requires admin privileges or specific RPC in Supabase, often handled via a secure edge function or trigger)
      // For this client-side implementation, we'll just sign out after deleting data.
      await supabase.auth.signOut();
      onBack();
    } catch (error: any) {
      showFeedback("Erro ao excluir conta.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = async (data: any) => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
      if (error) throw error;
      showFeedback("Perfil atualizado com sucesso!", 'success');
    } catch (error: any) {
      showFeedback(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateSettingsData = async (data: any) => {
    if (!user) return;
    try {
      const newSettings = { ...settings, ...data };
      setSettings(newSettings); // Optimistic update
      
      // Apply theme immediately
      if (data.theme) {
        if (data.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      // Apply primary color immediately (using CSS variables if supported, or just show feedback)
      if (data.primaryColor) {
        document.documentElement.style.setProperty('--color-primary', data.primaryColor);
        showFeedback("Cor principal atualizada!", 'success');
      }

      if (data.language) {
        showFeedback(`Idioma alterado para ${data.language === 'pt' ? 'Português' : 'Inglês'}.`, 'success');
      }

      const { error } = await supabase.from('user_settings').upsert({ ...newSettings, user_id: user.id });
      if (error) throw error;
    } catch (error: any) {
      showFeedback(error.message, 'error');
    }
  };

  const updatePrivacyData = async (data: any) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('user_privacy').upsert({ ...privacy, ...data, user_id: user.id });
      if (error) throw error;
    } catch (error: any) {
      showFeedback(error.message, 'error');
    }
  };

  const SectionHeader = ({ title, icon: Icon, id }: { title: string; icon: any; id: string }) => (
    <button 
      onClick={() => setActiveSection(activeSection === id ? null : id)}
      className="w-full flex items-center justify-between p-4 bg-white border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-zinc-100 rounded-[3px]">
          <Icon className="w-5 h-5 text-zinc-600" />
        </div>
        <span className="font-bold text-zinc-800">{title}</span>
      </div>
      {activeSection === id ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 px-4 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-zinc-100 rounded-[3px] transition-colors">
          <ArrowLeft className="w-6 h-6 text-zinc-800" />
        </button>
        <h1 className="text-xl font-bold text-zinc-900">Configurações e Suporte</h1>
      </header>

      {/* Feedback Toast */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-[3px] shadow-lg text-white font-bold text-sm ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto mt-2 space-y-0 px-0">
        
        {/* 👤 CONTA */}
        <div className="bg-white border-b border-zinc-100">
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-sm bg-zinc-50">
                <img 
                  src={profile?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
                  className="w-full h-full object-cover"
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button 
                onClick={() => {
                  const url = window.prompt("Insira a URL da nova foto de perfil:");
                  if (url) updateProfileData({ photoUrl: url });
                }}
                className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-[3px] shadow-lg hover:bg-indigo-700 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div>
              <h3 className="text-base font-bold text-zinc-900">{profile?.name || "Usuário"}</h3>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>
          </div>

          <div className="divide-y divide-zinc-50">
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-bold text-zinc-700">Alterar Nome</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={profile?.name || "Novo nome"}
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-[3px] px-3 py-2 text-sm outline-none"
                />
                <button 
                  onClick={handleUpdateName}
                  disabled={isUpdatingName}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-[3px] text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isUpdatingName ? '...' : 'Salvar'}
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-bold text-zinc-700">Alterar Senha</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha (min. 6 caracteres)"
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-[3px] px-3 py-2 text-sm outline-none"
                />
                <button 
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-[3px] text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isUpdatingPassword ? '...' : 'Salvar'}
                </button>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-amber-600">Sair da Conta</span>
              </div>
            </button>

            <button 
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-between p-4 hover:bg-rose-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-bold text-rose-600">Excluir Conta</span>
              </div>
            </button>
          </div>
        </div>

        {/* 🛠️ MODO PRESTADOR */}
        <div className="bg-white border-b border-zinc-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-[3px]">
              <Wrench className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Modo Prestador</p>
              <p className="text-[10px] text-zinc-500">Ative para oferecer seus serviços</p>
            </div>
          </div>
          <button 
            onClick={() => updateProfileData({ is_provider: !profile?.is_provider })}
            disabled={loading}
            className={`w-12 h-6 rounded-[3px] relative transition-colors duration-300 ${profile?.is_provider ? 'bg-indigo-600' : 'bg-zinc-200'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-[3px] transition-transform duration-300 ${profile?.is_provider ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* 💰 PLANO */}
        <div className="bg-white border-b border-zinc-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-[3px]">
              <CreditCard className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900">Plano Atual</p>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">{profile?.plan || 'Free'}</p>
            </div>
          </div>
          <button 
            onClick={() => updateProfileData({ plan: profile?.plan === 'pro' ? 'free' : 'pro' })}
            className="px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-bold rounded-[3px] hover:bg-zinc-800 transition-colors"
          >
            {profile?.plan === 'pro' ? 'Downgrade' : 'Atualizar para PRO'}
          </button>
        </div>

        {/* 🔔 NOTIFICAÇÕES */}
        <div className="bg-white border-b border-zinc-100">
          <div className="p-4 bg-zinc-50/50">
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Notificações</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {[
              { id: 'notifications_followers', label: 'Seguidores', icon: User },
              { id: 'notifications_messages', label: 'Mensagens', icon: MessageCircle },
              { id: 'notifications_promotions', label: 'Promoções', icon: Star }
            ].map(item => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-bold text-zinc-700">{item.label}</span>
                </div>
                <button 
                  onClick={() => updateSettingsData({ [item.id]: !settings?.[item.id] })}
                  className={`w-10 h-5 rounded-[3px] transition-colors relative ${settings?.[item.id] ? 'bg-indigo-600' : 'bg-zinc-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-[3px] transition-all ${settings?.[item.id] ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 🎨 APARÊNCIA */}
        <div className="bg-white border-b border-zinc-100">
          <div className="p-4 bg-zinc-50/50">
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Aparência</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings?.theme === 'dark' ? <Moon className="w-4 h-4 text-zinc-400" /> : <Sun className="w-4 h-4 text-zinc-400" />}
                <span className="text-sm font-bold text-zinc-700">Modo Escuro</span>
              </div>
              <button 
                onClick={() => updateSettingsData({ theme: settings?.theme === 'dark' ? 'light' : 'dark' })}
                className={`w-10 h-5 rounded-[3px] transition-colors relative ${settings?.theme === 'dark' ? 'bg-indigo-600' : 'bg-zinc-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-[3px] transition-all ${settings?.theme === 'dark' ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-bold text-zinc-700">Cor Principal</span>
              </div>
              <div className="flex gap-2">
                {['#4f46e5', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                  <button 
                    key={color}
                    onClick={() => updateSettingsData({ primaryColor: color })}
                    className={`w-5 h-5 rounded-full border-2 ${settings?.primaryColor === color ? 'border-zinc-900' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 🌍 IDIOMA */}
        <div className="bg-white border-b border-zinc-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-bold text-zinc-700">Idioma do App</span>
          </div>
          <select 
            value={settings?.language || 'pt'}
            onChange={(e) => updateSettingsData({ language: e.target.value })}
            className="bg-zinc-50 border border-zinc-200 rounded-[3px] px-2 py-1 text-[10px] font-bold text-zinc-700 outline-none"
          >
            <option value="pt">Português</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* 🔒 PRIVACIDADE */}
        <div className="bg-white border-b border-zinc-100">
          <div className="p-4 bg-zinc-50/50">
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Privacidade</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {privacy?.isPublic ? <Eye className="w-4 h-4 text-zinc-400" /> : <EyeOff className="w-4 h-4 text-zinc-400" />}
                <span className="text-sm font-bold text-zinc-700">Perfil Público</span>
              </div>
              <button 
                onClick={() => updatePrivacyData({ isPublic: !privacy?.isPublic })}
                className={`w-10 h-5 rounded-[3px] transition-colors relative ${privacy?.isPublic ? 'bg-indigo-600' : 'bg-zinc-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-[3px] transition-all ${privacy?.isPublic ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-bold text-zinc-700">Mostrar Telefone</span>
              </div>
              <button 
                onClick={() => updatePrivacyData({ showPhone: !privacy?.showPhone })}
                className={`w-10 h-5 rounded-[3px] transition-colors relative ${privacy?.showPhone ? 'bg-indigo-600' : 'bg-zinc-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-[3px] transition-all ${privacy?.showPhone ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>
            <button 
              onClick={() => showFeedback("Nenhum usuário bloqueado no momento.", "success")}
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <UserX className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-bold text-zinc-700">Usuários Bloqueados</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400">{privacy?.blockedUsers?.length || 0}</span>
                <ChevronRight className="w-4 h-4 text-zinc-300" />
              </div>
            </button>
          </div>
        </div>

        <div className="text-center pt-8 pb-12">
          <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Versão 1.0.0</p>
          <p className="text-[10px] text-zinc-400 mt-1">© 2026 Marketplace de Serviços</p>
        </div>
      </div>
    </div>
  );
}
