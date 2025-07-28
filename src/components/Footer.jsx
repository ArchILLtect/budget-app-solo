import React from "react";
import { Box,
  Flex, Text, Button, useToast, useColorModeValue
} from '@chakra-ui/react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Footer = () => {

    const { isLoggedIn, logoutUser } = useAuth();
    const currentYear = new Date().getFullYear();
    const navigate = useNavigate();
    const toast = useToast();

    const handleLogout = () => {
        logoutUser();
        toast({ title: 'Logged out', status: 'info', duration: 2000 });
        navigate("/login");
    };

    return (
        <Box position={"fixed"} bottom="0" zIndex="1000" bg={useColorModeValue('teal.500', 'teal.700')} px={4} py={3} shadow="md" w={"100%"}>
            <Flex h={8} alignItems={'center'} justifyContent={'space-between'}>
                <Text>&copy; {currentYear} Nick Hanson Sr.</Text>
                {/* Login/Logout Button */}
                <>
                    {isLoggedIn ? (
                        <Button
                            onClick={handleLogout}
                            className="hover:bg-gray-300 text-white hover:font-medium hover:text-gray-800 px-5 py-0.5 no-underline hover:text-lg flex gap-2 items-center"
                        >
                            Logout
                            <svg
                                stroke="currentColor"
                                fill="currentColor"
                                strokeWidth="0"
                                viewBox="0 0 16 16"
                                className="text-xl"
                                height="1em"
                                width="1em"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                            <path
                                fillRule="evenodd"
                                d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"
                            ></path>
                            <path
                                fillRule="evenodd"
                                d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0z"
                            ></path>
                            </svg>
                        </Button>
                    ) : ("")}
                </>
            </Flex>
        </Box>
    );
};

export default Footer;