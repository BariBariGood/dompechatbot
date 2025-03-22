import React from 'react';
import { Box, Paper, Typography, Link, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LaunchIcon from '@mui/icons-material/Launch';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';

const SearchResultDisplay = ({ result }) => {
  if (!result) return null;

  // Determine source icon and color based on the source
  const getSourceDetails = (source) => {
    if (source === 'DuckDuckGo' || source === 'DuckDuckGo Related Topics') {
      return { 
        icon: <SearchIcon fontSize="small" />, 
        color: '#1976d2',
        name: source
      };
    } else if (source === 'AI Knowledge') {
      return { 
        icon: <InfoIcon fontSize="small" />, 
        color: '#2e7d32',
        name: 'AI Knowledge Base'
      };
    } else if (source === 'error') {
      return { 
        icon: <ErrorIcon fontSize="small" />, 
        color: '#d32f2f',
        name: 'Search Error'
      };
    } else {
      return { 
        icon: <SearchIcon fontSize="small" />, 
        color: '#ed6c02',
        name: 'Web Search'
      };
    }
  };

  const sourceDetails = getSourceDetails(result.source);

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        borderRadius: 2,
        backgroundColor: '#f8f9fa',
        border: '1px solid #e0e0e0',
        mt: 1,
        mb: 4,
        width: '100%',
        overflowWrap: 'break-word',
        wordBreak: 'break-word'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2,
        gap: 1
      }}>
        <SearchIcon color="action" fontSize="small" />
        <Typography variant="subtitle2" color="text.secondary">
          Search Results from {result.source}
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Typography 
        variant="body1" 
        sx={{ 
          mb: 3,
          overflowWrap: 'break-word',
          wordBreak: 'break-word' 
        }}
      >
        {result.abstractText}
        {result.abstractURL && (
          <Link 
            href={result.abstractURL} 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ 
              display: 'block', 
              mt: 1,
              overflowWrap: 'break-word',
              wordBreak: 'break-word' 
            }}
          >
            Source: {result.abstractURL}
          </Link>
        )}
      </Typography>
      
      {result.relatedTopics && result.relatedTopics.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Related Topics:
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 2
          }}>
            {result.relatedTopics.map((topic, index) => (
              <Paper 
                key={index} 
                variant="outlined" 
                sx={{ 
                  mb: 1, 
                  p: 2,
                  borderColor: '#e0e0e0',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: sourceDetails.color,
                    bgcolor: 'rgba(0, 0, 0, 0.01)'
                  }
                }}
              >
                <Typography variant="body2" sx={{ 
                  mb: 1,
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word'
                }}>
                  {topic.text}
                </Typography>
                
                {topic.url && (
                  <Link 
                    href={topic.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontSize: '0.85rem',
                      mt: 1,
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word'
                    }}
                  >
                    {topic.url}
                    <LaunchIcon sx={{ ml: 0.5, fontSize: '0.85rem' }} />
                  </Link>
                )}
              </Paper>
            ))}
          </Box>
        </>
      )}
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, fontStyle: 'italic' }}>
        Information provided as a best effort based on available sources. Consider verifying from official channels for business-critical information.
      </Typography>
    </Paper>
  );
};

export default SearchResultDisplay; 