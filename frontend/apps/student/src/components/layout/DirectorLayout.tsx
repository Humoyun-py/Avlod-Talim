import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const DirectorLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const { info } = useToast();
  const { logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    setLogoutModalOpen(false);
    logout();
    info(
      language === 'uz' ? 'Chiqish bajarildi' : language === 'ru' ? 'Выход выполнен' : 'Signed out',
      language === 'uz' ? 'Direktor sessiyasi xavfsiz yakunlandi.' : language === 'ru' ? 'Сессия директора успешно завершена.' : 'Director session securely ended.'
    );
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F8F8FC] flex text-[#1E1B39]">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogoutClick={() => setLogoutModalOpen(true)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Topbar */}
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          onLogoutClick={() => setLogoutModalOpen(true)}
        />

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmationModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title={
          language === 'uz'
            ? 'Tizimdan chiqishni tasdiqlaysizmi?'
            : language === 'ru'
            ? 'Вы действительно хотите выйти из системы?'
            : 'Confirm system logout?'
        }
        message={
          language === 'uz'
            ? 'Direktor panelidan chiqasiz. Qayta kirish uchun login va parolni kiritishingiz lozim bo‘ladi.'
            : language === 'ru'
            ? 'Вы выйдете из панели директора. Для повторного входа потребуется ввести логин и пароль.'
            : 'You will be logged out of the Director panel. You will need to log in again to continue.'
        }
        confirmText={t('topbar.logout')}
        cancelText={t('common.cancel')}
        variant="warning"
        icon={LogOut}
      />
    </div>
  );
};
