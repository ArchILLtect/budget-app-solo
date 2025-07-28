import { useState, useEffect, useRef } from 'react';
import {
  Box, Button, FormControl, FormLabel, Heading, Input, Checkbox, Text,
  VStack, useToast
} from '@chakra-ui/react';
import { useNavigate, Link } from 'react-router-dom';
import { useBudgetStore } from '../state/budgetStore';
import { getCurrentUser, roleHierarchy, login } from '../utils/auth';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const API_BASE_URL = "https://xuvfgfgsm5.execute-api.us-east-2.amazonaws.com/dev";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const toast = useToast();
  const navigate = useNavigate();
  const setUser = useBudgetStore((s) => s.setUser);

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();
      if (user) {
        setUser(user);
        navigate('/planner');
      }
    };
    init();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const attemptLogin = async (ip) => {

    const response = await axios.post(`${API_BASE_URL}/login2`, {
      ...formData,
      ip
    });

    const token = response.data.jwt;
    const user = response.data.user;

    login(token, user);
    setUser(user);
    if (window.opener) {
      window.opener.postMessage({ type: 'loginSuccess' }, window.location.origin);
      window.close(); // Close popup
    }

    toast({ title: 'Logged in!', status: 'success', duration: 2000 });

    const userLevel = user?.role ? roleHierarchy[user.role] ?? 0 : 0;

    if (userLevel >= roleHierarchy.admin ) {
      navigate('/planner');
    } else {
      navigate('/planner');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const start = Date.now();

    const ipResponse = await fetch("https://api.ipify.org?format=json");
    const { ip } = await ipResponse.json();

    try {
      setLoading(true);
      await attemptLogin(ip);
    } catch (error) {
      const isServerError = error.response?.status === 500;

      if (isServerError) {
        toast({ title: "Server issue. Retrying login...", status: "warning", duration: 2000 });
        setTimeout(async () => {
          try {
            await attemptLogin(ip);
          } catch (retryErr) {
            toast({ title: "Retry failed. Try again later.", status: "error", duration: 2000 });
            console.error("Retry login failed:", retryErr);
          } finally {
            const elapsed = Date.now() - start;
            const remaining = Math.max(0, 500 - elapsed);
            setTimeout(() => setLoading(false), remaining);
          }
        }, 1000);
      } else {
        toast({
          title: error.response?.data?.message || "Login failed",
          status: "error",
          duration: 3000,
        });
        console.error("Login failed:", error);
      }
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 500 - elapsed);
      setTimeout(() => setLoading(false), remaining);
    }
  };

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Box maxW="md" mx="auto" mt={20} p={6} borderWidth={1} borderRadius="lg" bg="white" shadow="md">
      <Heading size="lg" mb={4} textAlign="center" color="gray.700">
        Login
      </Heading>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <VStack spacing={4} align="stretch" as="form" onSubmit={handleLogin}>
          <FormControl>
            <FormLabel>Username</FormLabel>
            <Input
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              isRequired
            />
          </FormControl>

          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              id="password"
              ref={passwordRef}
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              isRequired
            />
            <Checkbox
              id='show-password'
              mt={2}
              isChecked={showPassword}
              onChange={togglePassword}
              colorScheme="blue"
            >
              {showPassword ? "Hide Password" : "Show Password"}
            </Checkbox>
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            isDisabled={loading}
          >
            Login
          </Button>
        </VStack>
      )}

      <Text mt={4} textAlign="center" fontSize="sm" color="gray.600">
        Don’t have an account?{" "}
        <Link to="/register">
          <Text as="span" color="blue.500" fontWeight="semibold" _hover={{ textDecoration: "underline" }}>
            Register here
          </Text>
        </Link>
      </Text>
    </Box>
  );
};
