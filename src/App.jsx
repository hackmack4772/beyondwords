import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./components/Login/Login";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import { useSelector, useDispatch } from "react-redux";
import { fetchUserInfo } from "./features/user-data/usersdata";
import List from "./components/chatwindow/chat-layout/List";
import styled from "styled-components";
import { motion } from "framer-motion";
import { NotificationProvider } from './contexts/NotificationContext';

const Container = styled(motion.div)`
  width: 100vw;
  height: 100vh;
  background-color: ${({ theme }) => theme.bg};
  backdrop-filter: blur(19px) saturate(180%);
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.border};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow};
  transition: all 0.3s ease-in-out;
`;

const Loading = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background-color: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text};
  font-size: 24px;
  font-weight: 600;
  border-radius: 12px;
  text-align: center;

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid ${({ theme }) => theme.text};
    border-top: 4px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-top: 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const NotificationBanner = styled(motion.div)`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${({ theme }) => theme.bg};
  padding: 15px 25px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9999;
  
  button {
    background-color: #128C7E;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
`;

const App = () => {
    const [isAuthResolved, setAuthResolved] = useState(false);
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
    const dispatch = useDispatch();
    const currentUser = useSelector((state) => state?.user?.currentUser);

    useEffect(() => {
        const checkNotificationPermission = () => {
            if ('Notification' in window) {
                if (Notification.permission === 'default' && currentUser) {
                    setShowNotificationPrompt(true);
                }
            }
        };
        
        checkNotificationPermission();
    }, [currentUser]);

    const handleRequestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setShowNotificationPrompt(false);
            console.log('Notification permission:', permission);
        }
    };

    useEffect(() => {
        const unSub = onAuthStateChanged(auth, (user) => {
            if (user) {
                dispatch(fetchUserInfo(user.uid)).then(() => {
                    setAuthResolved(true);
                });
            } else {
                dispatch(fetchUserInfo(null)).then(() => {
                    setAuthResolved(true);
                });
            }
        });

        return () => unSub();
    }, [dispatch]);

    if (!isAuthResolved) {
        return (
            <Container initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Loading initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="spinner" />
                </Loading>
            </Container>
        );
    }

    return (
        <NotificationProvider>
            <Container initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {showNotificationPrompt && (
                    <NotificationBanner 
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <span>Enable notifications to stay updated with new messages and calls</span>
                        <button onClick={handleRequestNotificationPermission}>
                            Enable
                        </button>
                    </NotificationBanner>
                )}

                <Routes>
                    <Route
                        path="/login"
                        element={!currentUser ? <Login /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/"
                        element={currentUser ? <List /> : <Navigate to="/login" />}
                    />
                </Routes>
            </Container>
        </NotificationProvider>
    );
};

export default App;
