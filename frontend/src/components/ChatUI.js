import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  CircularProgress,
  IconButton,
  Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import MessageList from './MessageList';

const ChatUI = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const latestMessageRef = useRef(null);
  
  // Use relative URL for API when deployed
  const apiUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api';

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToLatestMessage();
  }, [messages]);

  // Auto-greet on first load
  useEffect(() => {
    if (messages.length === 0) {
      sendGreeting();
    }
  }, []);

  const scrollToLatestMessage = () => {
    // First try to scroll to the latest message
    if (latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Fall back to scrolling to the bottom if ref not available
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    // Auto-greet again after clearing
    setTimeout(() => {
      sendGreeting();
    }, 100);
  };

  // Create a properly formatted message history for the API
  const getMessageHistory = (msgs) => {
    // Use all messages except the newest user message (which will be sent separately)
    // This ensures the full conversation context is included
    return msgs.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  };

  const sendGreeting = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Send an empty message to get a greeting
      // No history for the initial greeting
      const response = await axios.post(`${apiUrl}/chat`, { 
        message: 'Hello', 
        history: [] 
      });
      
      const responseData = response.data;
      
      setMessages([{ 
        role: 'assistant', 
        content: responseData.response || 'Hi there! I\'m DompeAssist, your IT support assistant. How can I help you today?'
      }]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching greeting:', error);
      setLoading(false);
      setError('Could not connect to the chatbot. Please try again later.');
    }
  };

  const sendMessage = async () => {
    if (input.trim() === '') return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    
    try {
      setLoading(true);
      setError(null);
      
      // Get response from server - include full conversation history
      const response = await axios.post(`${apiUrl}/chat`, { 
        message: input, 
        history: getMessageHistory(messages) // Send previous messages as history
      });
      
      const responseData = response.data;
      
      // Process regular response
      if (responseData.response) {
        // Add assistant's response to the messages
        setMessages([
          ...updatedMessages,
          { 
            role: 'assistant', 
            content: responseData.response
          }
        ]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
      
      // Add error message to chat
      setMessages([
        ...updatedMessages,
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error while processing your request. Please try again later.'
        }
      ]);
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
    >
      <Box sx={{ 
        p: 2, 
        backgroundColor: '#f5f9fd', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Typography variant="h6" color="primary">
          Chat with DompeAssist
        </Typography>
        <IconButton 
          color="primary" 
          onClick={handleClearChat}
          size="small"
          title="Start new conversation"
        >
          <DeleteIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          width: '100%',
          pb: 4 // Add padding at the bottom to ensure messages aren't cut off
        }}>
          {messages.map((msg, index) => {
            const isLatestMessage = index === messages.length - 1;
            return (
              <React.Fragment key={index}>
                {/* Use ref for the latest message to scroll to */}
                <div ref={isLatestMessage ? latestMessageRef : null}>
                  <MessageList messages={[msg]} />
                </div>
              </React.Fragment>
            );
          })}
        </Box>
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {error && (
          <Paper 
            sx={{ 
              p: 2, 
              mb: 2, 
              backgroundColor: '#fdeaea',
              borderLeft: '4px solid #f44336'
            }}
          >
            <Typography color="error">{error}</Typography>
          </Paper>
        )}
        
        <div ref={messagesEndRef} />
      </Box>
      
      <Divider />
      
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        backgroundColor: '#f5f9fd',
      }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={loading}
          multiline
          maxRows={4}
          InputProps={{
            sx: { backgroundColor: '#fff' }
          }}
        />
        <IconButton 
          color="primary" 
          onClick={sendMessage}
          disabled={loading || input.trim() === ''}
          sx={{ ml: 1 }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ChatUI; 