import { useEffect } from "react";
import styled, { ThemeProvider } from "styled-components";
import { motion } from "framer-motion";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import List from "./components/list/List";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";
import { darkTheme, lightTheme } from "./theme";
import { useThemeStore } from "./lib/themeStore";

const Container = styled(motion.div)`
  width: 100vw;
  height: 100vh;
  background-color: ${({ theme }) => theme.bg};
  backdrop-filter: blur(19px) saturate(180%);
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.border};
  display: flex;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow};
  transition: all 0.3s ease-in-out;
`;

const Loading = styled.div`
  padding: 50px;
  font-size: 36px;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text};
  text-align: center;
`;

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });

    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  if (isLoading) return <Loading>Loading...</Loading>;

  return (
    <ThemeProvider theme={theme === "dark" ? darkTheme : lightTheme}>
      <Container initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {currentUser ? (
          <>
            <List />
            {chatId && <Chat />}
            {chatId && <Detail />}
          </>
        ) : (
          <Login />
        )}
        <Notification />
      </Container>
    </ThemeProvider>
  );
};

export default App;
