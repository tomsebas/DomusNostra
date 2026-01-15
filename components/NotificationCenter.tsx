import React, { useEffect, useState } from 'react';
import { AppNotification, User, UserRole } from '../types';
import { StorageService } from '../services/storage';

interface NotificationCenterProps {
  user: User;
  onUpdate?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ user, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    const data = await StorageService.getNotifications(user.id, user.role);
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.read).length);
  };

  useEffect(() => {
    loadNotifications();
    // Poll every 10 seconds for simulated real-time in the same browser
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [user.id]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) loadNotifications();
  };

  const handleMarkAsRead = async (id: string) => {
    await StorageService.markNotificationAsRead(id);
    loadNotifications();
    if (onUpdate) onUpdate();
  };

  const handleClearAll = async () => {
    if (window.confirm('¿Deseas eliminar todas tus notificaciones?')) {
      await StorageService.clearNotifications(user.id, user.role);
      loadNotifications();
      if (onUpdate) onUpdate();
    }
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleString('es-ES', { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="relative">
      <button 
        onClick={toggleOpen}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isOpen ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <div className="relative">
          <i className="fas fa-bell"></i>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-down">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Notificaciones</h3>
              {notifications.length > 0 && (
                <button 
                  onClick={handleClearAll}
                  className="text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-bell-slash text-gray-300"></i>
                  </div>
                  <p className="text-gray-400 text-sm">No tienes notificaciones</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id)}
                    className={`p-4 border-b border-gray-50 flex gap-3 transition-colors cursor-pointer ${
                      notif.read ? 'opacity-60 bg-white' : 'bg-blue-50/30 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${
                      notif.type === 'BOOKING_REQUEST' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      <i className={`fas ${notif.type === 'BOOKING_REQUEST' ? 'fa-calendar-plus' : 'fa-info-circle'}`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm ${notif.read ? 'font-medium' : 'font-bold'} text-gray-800`}>{notif.title}</h4>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{formatTime(notif.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{notif.message}</p>
                      {!notif.read && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                          Nuevo
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-gray-500 font-medium hover:text-gray-700"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
