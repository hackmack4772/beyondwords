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


const App = () => {
    const [isAuthResolved, setAuthResolved] = useState(false);
    const dispatch = useDispatch();
    const currentUser = useSelector((state) => state?.user?.currentUser);

    useEffect(() => {
        const unSub = onAuthStateChanged(auth, (user) => {
            if (user) {
                dispatch(fetchUserInfo(user.uid)).then(() => {
                    setAuthResolved(true);
                });
            } else {
                dispatch(fetchUserInfo(user)).then(() => {
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
                </Loading>      </Container>
        );
    }

    return (
        <Container initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
    );
};

export default App;
