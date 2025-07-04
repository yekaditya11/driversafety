/**
 * Unified Insights Panel Component
 * Combines AI insights with chat functionality in a side panel
 * Integrates with chart manager for adding charts to dashboard
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Divider,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
  Tooltip,
  Slide
} from '@mui/material';
import {
  Close as CloseIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Psychology as InsightsIcon,
  Chat as ChatIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Stop as StopIcon
} from '@mui/icons-material';
// Note: framer-motion removed due to React 19 compatibility

import apiService from '../../services/apiService';
import chartManager from '../../services/chartManager';
import ChartRenderer from '../ChartRenderer';

const UnifiedInsightsPanel = ({
  aiAnalysis,
  aiLoading,
  aiError,
  insightFeedback,
  loadingMoreInsights,
  selectedModule,
  onClose,
  onFeedback,
  onGenerateMore,
  onRemoveInsight
}) => {
  // Chat state
  const [activeTab, setActiveTab] = useState(0); // 0 = AI Insights, 1 = Chat
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [typingMessageId, setTypingMessageId] = useState(null);

  // Voice functionality state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  // Initialize voice functionality
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;

    if (SpeechRecognition && speechSynthesis) {
      setVoiceSupported(true);
      recognitionRef.current = new SpeechRecognition();
      speechSynthesisRef.current = speechSynthesis;
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat session when switching to chat tab
  useEffect(() => {
    if (activeTab === 1 && messages.length === 0) {
      initializeChat();
    }
  }, [activeTab]);

  const initializeChat = async () => {
    try {
      const response = await apiService.startChatSession();
      setSessionId(response.session_id);
      
      // Add welcome message
      const welcomeMessage = {
        id: Date.now(),
        message: "Hi! I'm your Driver Safety Assistant. I can help you analyze data and create charts. What would you like to know?",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      setTypingMessageId(welcomeMessage.id);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setError('Failed to start chat session');
    }
  };

  // Handle sending chat message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      message: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.sendChatMessage(inputMessage, sessionId);

      const botMessageId = Date.now() + 1;
      const botMessage = {
        id: botMessageId,
        message: response.response || 'I apologize, but I encountered an issue processing your request.',
        isBot: true,
        timestamp: new Date(),
        chartConfig: response.chart_config || null,
      };

      setTypingMessageId(botMessageId);
      setMessages(prev => [...prev, botMessage]);

      // Speak response if enabled
      if (speechEnabled && response.response) {
        setTimeout(() => {
          speakText(response.response);
        }, 500);
      }

      if (response.session_id) {
        setSessionId(response.session_id);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message);

      const errorMessage = {
        id: Date.now() + 1,
        message: `I'm sorry, I'm having trouble connecting to the server right now. Please try again.\n\nError: ${err.message}`,
        isBot: true,
        timestamp: new Date(),
      };

      setTypingMessageId(errorMessage.id);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding chart to dashboard
  const handleAddChartToDashboard = async (chartConfig) => {
    try {
      console.log('Adding chart to dashboard:', chartConfig);

      await chartManager.addChart({
        title: (typeof chartConfig?.title === 'string' ? chartConfig.title :
                typeof chartConfig?.title?.text === 'string' ? chartConfig.title.text : 'AI Generated Chart'),
        description: chartConfig.description || null,
        chartData: chartConfig.chartConfig || chartConfig,
        source: 'insights_chat'
      });

      // Add success message to chat
      const successMessage = {
        id: Date.now(),
        message: "✅ Chart added to your custom dashboard successfully! You can view and organize your charts in the AI Dashboard.",
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      console.error('Error adding chart to dashboard:', error);
      
      const errorMessage = {
        id: Date.now(),
        message: "❌ Failed to add chart to dashboard. Please try again.",
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Voice functions
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const speakText = (text) => {
    if (speechSynthesisRef.current && speechEnabled && text) {
      speechSynthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesisRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    if (isSpeaking) {
      stopSpeaking();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleTypingComplete = (messageId) => {
    if (messageId === typingMessageId) {
      setTypingMessageId(null);
    }
  };

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '450px',
      height: '100vh',
      zIndex: 1300,
      transform: 'translateX(0)',
      transition: 'transform 0.3s ease-in-out'
    }}>
      <Paper
        elevation={8}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '0',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            backgroundColor: 'primary.main',
            color: 'white',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            AI Insights & Chat
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {voiceSupported && activeTab === 1 && (
              <IconButton
                onClick={isSpeaking ? stopSpeaking : toggleSpeech}
                size="small"
                sx={{ color: 'white', opacity: 0.8 }}
              >
                {isSpeaking ? <StopIcon /> : speechEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
              </IconButton>
            )}
            <IconButton onClick={onClose} size="small" sx={{ color: 'white', opacity: 0.8 }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<InsightsIcon />} label="AI Insights" />
          <Tab icon={<ChatIcon />} label="Chat" />
        </Tabs>

        {/* Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* AI Insights Tab */}
          {activeTab === 0 && (
            <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {aiLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
                  <CircularProgress size={32} sx={{ color: 'primary.main' }} />
                  <Typography sx={{ color: 'text.secondary', textAlign: 'center' }}>
                    AI is analyzing...
                  </Typography>
                </Box>
              ) : aiError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {aiError}
                </Alert>
              ) : aiAnalysis ? (
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    AI Analysis Results
                  </Typography>
                  {/* Display AI insights here */}
                  <Typography variant="body2" color="text.secondary">
                    AI insights will be displayed here based on the analysis results.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
                  <InsightsIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                  <Typography variant="h6" color="text.secondary">
                    No AI Analysis Available
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    Generate AI insights to see analysis results here.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Chat Tab */}
          {activeTab === 1 && (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Messages Area */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isTyping={msg.isBot && msg.id === typingMessageId}
                    onTypingComplete={() => handleTypingComplete(msg.id)}
                    onAddToDashboard={handleAddChartToDashboard}
                    isSpeaking={msg.isBot && isSpeaking}
                  />
                ))}

                {isLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      <BotIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[0, 1, 2].map((index) => (
                        <Box
                          key={index}
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            animation: `pulse 1.5s ease-in-out infinite`,
                            animationDelay: `${index * 0.2}s`,
                            '@keyframes pulse': {
                              '0%, 100%': { opacity: 0.5 },
                              '50%': { opacity: 1 },
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <div ref={messagesEndRef} />
              </Box>

              {/* Input Area */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading || isListening}
                    variant="outlined"
                    size="small"
                    placeholder={isListening ? "Listening..." : "Type your message..."}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: isListening ? 'action.hover' : 'background.paper',
                      },
                    }}
                  />

                  {voiceSupported && (
                    <IconButton
                      onClick={isListening ? stopListening : startListening}
                      disabled={isLoading}
                      sx={{
                        backgroundColor: isListening ? 'error.main' : 'action.hover',
                        color: isListening ? 'white' : 'text.secondary',
                        '&:hover': {
                          backgroundColor: isListening ? 'error.dark' : 'action.selected',
                        },
                      }}
                    >
                      {isListening ? <StopIcon /> : <MicIcon />}
                    </IconButton>
                  )}

                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading || isListening}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': { backgroundColor: 'primary.dark' },
                      '&:disabled': { backgroundColor: 'action.disabledBackground' },
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

// Chat Message Component
const ChatMessage = ({ message, isTyping, onTypingComplete, onAddToDashboard, isSpeaking }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    if (message.isBot && isTyping) {
      // Typing animation
      let index = 0;
      const timer = setInterval(() => {
        if (index < message.message.length) {
          setDisplayedText(message.message.slice(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
          if (onTypingComplete) onTypingComplete();
          if (message.chartConfig) {
            setTimeout(() => setShowChart(true), 500);
          }
        }
      }, 20);

      return () => clearInterval(timer);
    } else {
      setDisplayedText(message.message);
      if (message.chartConfig) {
        setShowChart(true);
      }
    }
  }, [message, isTyping, onTypingComplete]);

  return (
    <Box sx={{ mb: 3, display: 'flex', justifyContent: message.isBot ? 'flex-start' : 'flex-end' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', maxWidth: '85%', gap: 1 }}>
        {message.isBot && (
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            <BotIcon sx={{ fontSize: 18 }} />
          </Avatar>
        )}

        <Box>
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              bgcolor: message.isBot ? 'grey.50' : 'primary.main',
              color: message.isBot ? 'text.primary' : 'white',
              borderRadius: 2,
              borderTopLeftRadius: message.isBot ? 0.5 : 2,
              borderTopRightRadius: message.isBot ? 2 : 0.5,
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {displayedText}
            </Typography>

            {message.timestamp && (
              <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {message.isBot && isSpeaking && ' • Speaking...'}
              </Typography>
            )}
          </Paper>

          {/* Render chart if available */}
          {message.chartConfig && message.isBot && showChart && (
            <Box sx={{ mt: 2 }}>
              <ChartRenderer
                chartConfig={message.chartConfig}
                height={300}
                showToolbar={true}
                showAddButton={true}
                onAddToDashboard={() => onAddToDashboard({
                  title: (typeof message.chartConfig?.title === 'string' ? message.chartConfig.title :
                          typeof message.chartConfig?.title?.text === 'string' ? message.chartConfig.title.text : 'AI Generated Chart'),
                  chartConfig: message.chartConfig
                })}
              />
            </Box>
          )}
        </Box>

        {!message.isBot && (
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.600' }}>
            <PersonIcon sx={{ fontSize: 18 }} />
          </Avatar>
        )}
      </Box>
    </Box>
  );
};

export default UnifiedInsightsPanel;
