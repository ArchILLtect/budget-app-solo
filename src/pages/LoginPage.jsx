import { useState, useEffect, useRef } from 'react';
import {
  Box, Button, FormControl, FormLabel, Heading, Input, Checkbox, Text,
  Flex, VStack, useToast
} from '@chakra-ui/react';
import { useNavigate, Link } from 'react-router-dom';
import { useBudgetStore } from '../state/budgetStore';
import { getCurrentUser, roleHierarchy, login } from '../utils/auth';
import { seedDemoState } from '../utils/demoUtils';
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
  const setIsDemoUser = useBudgetStore((s) => s.setIsDemoUser);

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

  async function retryLoginRequest(ip, maxRetries = 3, delay = 500) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await axios.post(`${API_BASE_URL}/login2`, {
          ...formData,
          ip,
        });

        return response.data; // ✅ success path
      } catch (err) {
        const is502 = err.response?.status === 502;
        if (!is502 || attempt === maxRetries - 1) throw err;

        // Optional: Show user-friendly message for retry
        toast({
          title: `Login attempt ${attempt + 1} failed. Retrying...`,
          description: "AWS may be waking up. Please wait...",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });

        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const start = Date.now();

    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const { ip } = await ipResponse.json();

      const { jwt: token, user } = await retryLoginRequest(ip);

      login(token, user);
      setUser(user);

      if (window.opener) {
        window.opener.postMessage({ type: 'loginSuccess' }, window.location.origin);
        window.close();
      }

      toast({ title: "Logged in!", status: "success", duration: 2000 });

      const userLevel = user?.role ? roleHierarchy[user.role] ?? 0 : 0;
      navigate(userLevel >= roleHierarchy.admin ? "/planner" : "/planner");
    } catch (error) {
      toast({
        title: error.response?.data?.message || "Login failed",
        status: "error",
        duration: 3000,
      });
      console.error("Login failed:", error);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 500 - elapsed);
      setIsDemoUser(false);
      setTimeout(() => setLoading(false), remaining);
    }
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      const demoUser = {
        id: "demo",
        username: "demo",
        role: "user",
        email: "sample@email.com"
      };

      login("demo-token", demoUser);
      setUser(demoUser);
      seedDemoState(useBudgetStore.setState); // ✅ Seed the app state
      setIsDemoUser(true);

      toast({ title: "Logged in as demo user", status: "success", duration: 2000 });
      navigate("/planner");
      setLoading(false);
    }, 800);
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
          <Flex
            pos="fixed"
            top={0}
            left={0}
            w="100vw"
            h="100vh"
            zIndex="modal"
            bg="rgba(0,0,0,0.4)"
            justify="center"
            align="center"
          >
            <LoadingSpinner />
          </Flex>
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
          <Button
            onClick={handleDemoLogin}
            mt={2}
            colorScheme="green"
            isDisabled={loading}
          >
            Try Demo Mode
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
