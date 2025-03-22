import React from 'react';
import { Box } from '@mui/material';

// SVG version of the Dompé logo (red hexagon with white D)
const Logo = () => {
  return (
    <Box
      component="svg"
      width="50px"
      height="50px"
      viewBox="0 0 100 100"
      sx={{
        filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.2))',
      }}
    >
      {/* Hexagon background */}
      <polygon 
        points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" 
        fill="#E30613" // Dompé red color
      />
      
      {/* White D letter */}
      <path 
        d="M30,25 H55 C65,25 75,35 75,50 C75,65 65,75 55,75 H30 V25 Z M40,35 V65 H55 C60,65 65,60 65,50 C65,40 60,35 55,35 H40 Z" 
        fill="white"
      />
    </Box>
  );
};

export default Logo; 