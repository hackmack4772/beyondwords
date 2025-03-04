import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import upload from "../../lib/upload";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Background = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
  background: transparent;
`;

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80%;
  max-width: 500px;
  padding: 30px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  animation: ${fadeIn} 0.6s ease-in-out;
  text-align: center;
`;

const Logo = styled.h1`
  color: #ff758c;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
`;

const Slogan = styled.p`
  color: #fff;
  font-size: 14px;
  margin-bottom: 20px;
`;

const FormWrapper = styled.div`
  width: 100%;
  overflow: hidden;
`;

const Form = styled(motion.form)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: none;
  border-bottom: 2px solid rgba(255, 255, 255, 0.5);
  background: transparent;
  color: #fff;
  font-size: 16px;
  outline: none;
  transition: 0.3s;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  &:focus {
    border-bottom: 2px solid #ff758c;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #ff758c, #ff7eb3);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: 0.3s;

  &:hover {
    background: linear-gradient(135deg, #ff7eb3, #ff758c);
  }

  &:disabled {
    cursor: not-allowed;
    background: gray;
  }
`;

const ToggleButton = styled.p`
  color: #ff758c;
  cursor: pointer;
  font-weight: bold;
  margin-top: 15px;
  transition: 0.3s;
  &:hover {
    text-decoration: underline;
  }
`;

const Login = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleToggle = () => setIsSignIn(!isSignIn);

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);

    const { username, email, password } = Object.fromEntries(formData);

    // VALIDATE INPUTS
    if (!username || !email || !password)
      return toast.warn("Please enter inputs!");
    // if (!avatar.file) return toast.warn("Please upload an avatar!");

    // VALIDATE UNIQUE USERNAME
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return toast.warn("Select another username");
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      // const imgUrl = await upload(avatar.file);

      await setDoc(doc(db, "users", res.user.uid), {
        username,
        email,
        // avatar: imgUrl,
        id: res.user.uid,
        blocked: [],
      });

      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: [],
      });

      toast.success("Account created! You can login now!");
    } catch (err) {
      console.log(err);
      toast.error("Registration error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful! Redirecting...");
    } catch (err) {
      console.error(err);
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Background>
      <Container>
        <Logo>Emotalks</Logo>
        <Slogan>Express. Connect. Engage.</Slogan>
        <FormWrapper>
          <AnimatePresence mode="wait">
            {isSignIn ? (
              <Form
                key="signin"
                onSubmit={handleLogin}
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Input type="text" placeholder="Email" name="email" />
                <Input type="password" placeholder="Password" name="password" />
                <Button disabled={loading}>{loading ? "Loading..." : "Sign In"}</Button>
              </Form>
            ) : (
              <Form
                key="signup"
                onSubmit={handleRegister}

                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Input type="text" placeholder="Username" name="username" />
                <Input type="text" placeholder="Email" name="email" />
                <Input type="password" placeholder="Password" name="password" />
                <Button disabled={loading}>{loading ? "Loading..." : "Sign Up"}</Button>
              </Form>
            )}
          </AnimatePresence>
        </FormWrapper>
        <ToggleButton onClick={handleToggle}>
          {isSignIn ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </ToggleButton>
      </Container>
    </Background>
  );
};

export default Login;