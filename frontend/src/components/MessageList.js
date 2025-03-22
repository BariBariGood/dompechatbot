import React, { useRef, useEffect } from 'react';
import { Box, Avatar, Paper, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PersonIcon from '@mui/icons-material/Person';

const MessageList = ({ messages, renderMessage }) => {
  const messagesEndRef = useRef(null);
  
  // Scroll to the bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  return (
    <Box sx={{ 
      flex: 1, 
      overflowY: 'visible', 
      p: 2, 
      display: 'flex', 
      flexDirection: 'column',
      gap: 1,
      width: '100%'
    }}>
      {messages.map((message, index) => (
        renderMessage ? renderMessage(message, index) : (
          <Message key={index} message={message} />
        )
      ))}
      <div ref={messagesEndRef} />
    </Box>
  );
};

const Message = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
        width: '100%'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          maxWidth: { xs: '90%', sm: '85%' },
          width: 'auto'
        }}
      >
        <Avatar
          sx={{
            bgcolor: isUser ? 'secondary.main' : 'primary.main',
            [isUser ? 'ml' : 'mr']: 1,
            width: 36,
            height: 36,
            flexShrink: 0
          }}
        >
          {isUser ? <PersonIcon fontSize="small" /> : <SupportAgentIcon fontSize="small" />}
        </Avatar>

        <Paper
          elevation={1}
          sx={{
            p: 2,
            bgcolor: isUser ? '#e3f2fd' : '#ffffff',
            color: 'text.primary',
            borderRadius: 2,
            maxWidth: '100%',
            width: 'auto',
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
          }}
        >
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: 1.6,
              width: '100%'
            }}
          >
            {message.content}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default MessageList; 