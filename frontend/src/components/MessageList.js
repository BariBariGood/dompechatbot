import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PersonIcon from '@mui/icons-material/Person';

// Styled components
const StyledPaper = styled(Paper)(({ theme, role }) => ({
  padding: theme.spacing(2),
  maxWidth: '85%',
  borderRadius: role === 'assistant' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
  backgroundColor: role === 'assistant' ? '#f0f7ff' : '#f5f5f5',
  boxShadow: 'none',
  border: role === 'assistant' ? '1px solid #e0ebfd' : '1px solid #e0e0e0'
}));

const StyledAvatar = styled(Avatar)(({ theme, role }) => ({
  backgroundColor: role === 'assistant' ? '#1976d2' : '#757575',
  width: 36,
  height: 36
}));

// Custom styles for markdown
const markdownStyles = {
  p: {
    margin: '0.5em 0',
    lineHeight: '1.5'
  },
  h3: {
    margin: '1em 0 0.5em 0',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#1976d2'
  },
  h4: {
    margin: '0.8em 0 0.4em 0',
    fontSize: '1.1rem',
    fontWeight: 'bold'
  },
  ul: {
    margin: '0.5em 0',
    paddingLeft: '2em'
  },
  ol: {
    margin: '0.5em 0',
    paddingLeft: '2em'
  },
  li: {
    margin: '0.2em 0'
  },
  code: {
    backgroundColor: '#f0f0f0',
    padding: '0.2em 0.4em',
    borderRadius: '3px',
    fontFamily: 'monospace',
    fontSize: '0.9em'
  },
  pre: {
    backgroundColor: '#f0f0f0',
    padding: '0.8em',
    borderRadius: '5px',
    overflowX: 'auto',
    margin: '0.8em 0'
  }
};

const MessageList = ({ messages }) => {
  return (
    <>
      {messages.map((message, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            justifyContent: message.role === 'assistant' ? 'flex-start' : 'flex-end',
            mb: 2,
            gap: 1,
            alignItems: 'flex-start'
          }}
        >
          {message.role === 'assistant' && (
            <StyledAvatar role="assistant">
              <SupportAgentIcon fontSize="small" />
            </StyledAvatar>
          )}
          
          <StyledPaper role={message.role}>
            {message.role === 'assistant' ? (
              <ReactMarkdown components={{
                p: ({ node, ...props }) => <Typography variant="body1" style={markdownStyles.p} {...props} />,
                h3: ({ node, ...props }) => <Typography variant="h6" style={markdownStyles.h3} {...props} />,
                h4: ({ node, ...props }) => <Typography variant="subtitle1" style={markdownStyles.h4} {...props} />,
                ul: ({ node, ...props }) => <ul style={markdownStyles.ul} {...props} />,
                ol: ({ node, ...props }) => <ol style={markdownStyles.ol} {...props} />,
                li: ({ node, ...props }) => <li style={markdownStyles.li} {...props} />,
                code: ({ node, inline, ...props }) => 
                  inline ? 
                    <code style={markdownStyles.code} {...props} /> : 
                    <pre style={markdownStyles.pre}><code {...props} /></pre>,
              }}>
                {message.content}
              </ReactMarkdown>
            ) : (
              <Typography variant="body1">{message.content}</Typography>
            )}
          </StyledPaper>
          
          {message.role === 'user' && (
            <StyledAvatar role="user">
              <PersonIcon fontSize="small" />
            </StyledAvatar>
          )}
        </Box>
      ))}
    </>
  );
};

export default MessageList; 