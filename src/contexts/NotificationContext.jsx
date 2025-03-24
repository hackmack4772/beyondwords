import React, { createContext, useContext, useState } from 'react';
import styles from './Notification.module.css';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = (message, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(notification => notification.id !== id));
        }, 3000);
    };

    const showSuccess = (message) => addNotification(message, 'success');
    const showError = (message) => addNotification(message, 'error');
    const showInfo = (message) => addNotification(message, 'info');

    return (
        <NotificationContext.Provider value={{ showSuccess, showError, showInfo }}>
            {children}
            <div className={styles.notificationContainer}>
                {notifications.map(({ id, message, type }) => (
                    <div key={id} className={`${styles.notification} ${styles[type]}`}>
                        {message}
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}; 