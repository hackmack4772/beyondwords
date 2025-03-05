import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./components/Login/Login";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import { useSelector, useDispatch } from "react-redux";
import { fetchUserInfo } from "./features/user-data/usersdata";
import List from "./components/chatwindow/List";
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

const PublicRoutes = ({ element }) => {
    const currentUser = useSelector((state) => state?.user?.currentUser)
    return currentUser ? <Navigate to="/" /> : element;
}

const PrivateRoutes = ({ element }) => {
    const currentUser = useSelector((state) => state?.user?.currentUser)
    return !currentUser ? <Navigate to="/login" /> : element;
}


const App = () => {
    const currentUser = useSelector((state) => state?.user?.currentUser);
    const dispatch = useDispatch();
    useEffect(() => {
        const unSub = onAuthStateChanged(auth, (user) => {

            if (user) {
                dispatch(fetchUserInfo(user.uid));
            }
        });

        return () => unSub();
    }, [dispatch]);

    return (
        <Container initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

     {   currentUser ?<Routes>
            <Route path="/login" element={<PublicRoutes element={<Login />} />} />
            <Route path="/" element={<PrivateRoutes element={<List/>} />} />
        </Routes>:<Loading/>}
        </Container>
    );
};

export default App;
