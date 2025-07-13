import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { theme as chakraTheme } from '@chakra-ui/react' // Import built-in theme

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider theme={chakraTheme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
)