/**
 * File: LoadingSpinner.jsx
 * Author: Nick Hanson
 * Created On: July 17, 2024
 * Last Updated: July 17, 2025
 * Description: A modal component that displays a spinner during loading.
 * 
 * Props:
 * - None
 * 
 * Notes:
 * - Uses Tailwind CSS classes for styling.
 * - Responsive design included for mobile and desktop views.
 * 
 * Dependencies:
 * - React
 * 
 */

import { Center, Spinner } from '@chakra-ui/react';

const LoadingSpinner = () => {
  return (
    <Center h="48">
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="blue.500"
        size="xl"
      />
    </Center>
  );
};

export default LoadingSpinner;