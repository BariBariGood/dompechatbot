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
import SearchResultDisplay from './SearchResultDisplay';

const ChatUI = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-greet on first load
  useEffect(() => {
    if (messages.length === 0) {
      sendGreeting();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const getMessageHistory = (msgs) => {
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
      const response = await axios.post(`${apiUrl}/api/chat`, { message: 'Hello', history: [] });
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
    const updatedMessages = [...messages, { role: 'user', content: input }];
    setMessages(updatedMessages);
    setInput('');
    
    try {
      setLoading(true);
      setError(null);
      
      // Get response from server
      const response = await axios.post(`${apiUrl}/api/chat`, { message: input, history: getMessageHistory(updatedMessages) });
      const responseData = response.data;
      
      // Process regular response
      if (responseData.response) {
        setMessages([
          ...updatedMessages,
          { 
            role: 'assistant', 
            content: responseData.response,
            searchResult: responseData.searchResult || null
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
          content: 'Sorry, I encountered an error while processing your request. Please try again later.',
          searchResult: {
            source: 'error',
            abstractText: 'There was a problem connecting to the search service. This could be due to network issues or the search service being temporarily unavailable.',
            relatedTopics: [
              { 
                text: 'If this problem persists, please contact your IT department or try again later.', 
                url: null 
              }
            ]
          }
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
          {messages.map((msg, index) => (
            <React.Fragment key={index}>
              <MessageList messages={[msg]} />
              
              {/* Display search results immediately after assistant messages */}
              {msg.role === 'assistant' && msg.searchResult && (
                <Box sx={{ 
                  alignSelf: 'flex-start', 
                  ml: { xs: 2, sm: 5 }, 
                  width: '90%', 
                  maxWidth: '800px',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word'
                }}>
                  <SearchResultDisplay result={msg.searchResult} />
                </Box>
              )}
            </React.Fragment>
          ))}
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
          size="small"
          sx={{ 
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              backgroundColor: '#ffffff',
            }
          }}
        />
        <Button
          variant="contained"
          color="primary"
          disableElevation
          disabled={loading || !input.trim()}
          onClick={sendMessage}
          endIcon={<SendIcon />}
          sx={{ borderRadius: '20px', px: 3 }}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default ChatUI; 