import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { toast } from "react-toastify";
import styled, { keyframes } from "styled-components"
import { auth, db } from "../../config/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail
} from "firebase/auth";
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';

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
  width: 100%;
  max-width: 500px;
  gap:20px;
  padding: 30px;
  border-radius: 10px;
  background: rgba(53, 48, 46, 0.1);
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

const IconWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
`;

const Icon = styled.span`
  position: absolute;
  left: 10px;
  color: rgba(255, 255, 255, 0.7);
`;

const InputWithIcon = styled(Input)`
  padding-left: 35px;
`;

const ForgotPassword = styled.p`
  color: #ff758c;
  cursor: pointer;
  font-size: 14px;
  align-self: flex-end;
  margin-top: -10px;
  &:hover {
    text-decoration: underline;
  }
`;

const Login = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleToggle = () => {
    setIsSignIn(prev => !prev);
  };

  const getFormData = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    return Object.fromEntries(formData);
  };

  const handleForgotPassword = async (email) => {
    if (!email) {
      toast.warn("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Please check your inbox.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    try {
      setLoading(true);
      const { username, email, password } = getFormData(e);

      // Validate inputs 
      if (!username || !email || !password) {
        toast.warn("Please fill in all fields");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.warn("Please enter a valid email address");
        return;
      }

      // Validate password strength
      if (password.length < 6) {
        toast.warn("Password must be at least 6 characters long");
        return;
      }

      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast.warn("Username already taken. Please choose another one.");
        return;
      }

      const res = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", res.user.uid), {
        username,
        email,
        avatar: "/avatar.png",
        id: res.user.uid,
        blocked: [],
        about: "Hey there! I'm using Emotalks",
        createdAt: new Date(),
        lastSeen: new Date()
      });

      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: []
      });

      toast.success("Account created successfully! You can now log in.");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    try {
      setLoading(true);
      const { email, password } = getFormData(e);

      if (!email || !password) {
        toast.warn("Please enter both email and password");
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful!");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please check your credentials.");
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
                <IconWrapper>
                  <Icon><FaEnvelope /></Icon>
                  <InputWithIcon 
                    type="email" 
                    placeholder="Email" 
                    name="email" 
                    required
                  />
                </IconWrapper>
                <IconWrapper>
                  <Icon><FaLock /></Icon>
                  <InputWithIcon 
                    type="password" 
                    placeholder="Password" 
                    name="password" 
                    required
                  />
                </IconWrapper>
                <ForgotPassword onClick={() => {
                  const email = document.querySelector('input[name="email"]').value;
                  handleForgotPassword(email);
                }}>
                  Forgot Password?
                </ForgotPassword>
                <Button disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
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
                <IconWrapper>
                  <Icon><FaUser /></Icon>
                  <InputWithIcon 
                    type="text" 
                    placeholder="Username" 
                    name="username" 
                    required
                  />
                </IconWrapper>
                <IconWrapper>
                  <Icon><FaEnvelope /></Icon>
                  <InputWithIcon 
                    type="email" 
                    placeholder="Email" 
                    name="email" 
                    required
                  />
                </IconWrapper>
                <IconWrapper>
                  <Icon><FaLock /></Icon>
                  <InputWithIcon 
                    type="password" 
                    placeholder="Password" 
                    name="password" 
                    required
                    minLength="6"
                  />
                </IconWrapper>
                <Button disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
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