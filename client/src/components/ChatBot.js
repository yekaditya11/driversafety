import React, { useState, useRef, useEffect } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  TextField,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  Slide,
} from '@mui/material';
import {
  SmartToy as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Fullscreen as ExpandIcon,
  FullscreenExit as CollapseIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import apiService from '../services/apiService';
import ChartRenderer from './ChartRenderer';
import chartManager from '../services/chartManager';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Typing animation component
const TypingText = ({ text, speed = 25, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      // Adjust speed based on character type for more natural typing
      let charSpeed = speed;
      const currentChar = text[currentIndex];

      if (currentChar === ' ') {
        charSpeed = speed * 0.5; // Faster for spaces
      } else if (currentChar === '.' || currentChar === '!' || currentChar === '?') {
        charSpeed = speed * 3; // Slower for sentence endings
      } else if (currentChar === ',' || currentChar === ';') {
        charSpeed = speed * 2; // Slower for pauses
      }

      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, charSpeed);

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentIndex, text, speed, onComplete, isComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  return (
    <Typography
      variant="body2"
      sx={{
        whiteSpace: 'pre-wrap',
        lineHeight: 1.5,
        fontSize: '0.95rem',
      }}
    >
      {displayedText}
      {!isComplete && (
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            width: '2px',
            height: '1.2em',
            backgroundColor: 'currentColor',
            marginLeft: '1px',
            animation: 'blink 1s infinite',
            '@keyframes blink': {
              '0%, 50%': { opacity: 1 },
              '51%, 100%': { opacity: 0 },
            },
          }}
        />
      )}
    </Typography>
  );
};

const ChatMessage = ({ message, isBot, timestamp, chartConfig, onAddToDashboard, isTyping = false, onTypingComplete, isSpeaking = false }) => {
  const [showChart, setShowChart] = useState(!isTyping && !!chartConfig);

  const handleTypingComplete = () => {
    if (onTypingComplete) {
      onTypingComplete();
    }
    if (chartConfig) {
      // Small delay before showing chart
      setTimeout(() => setShowChart(true), 500);
    }
  };

  // Show chart immediately if not typing
  React.useEffect(() => {
    if (!isTyping && chartConfig) {
      setShowChart(true);
    }
  }, [isTyping, chartConfig]);

  return (
    <Box
      sx={{
        display: 'flex',
        mb: 3,
        justifyContent: isBot ? 'flex-start' : 'flex-end',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          maxWidth: chartConfig ? '95%' : '85%',
          flexDirection: isBot ? 'row' : 'row-reverse',
          gap: 1,
        }}
      >
        {/* Avatar */}
        <Avatar
          sx={{
            bgcolor: isBot ? 'primary.main' : 'grey.600',
            width: 36,
            height: 36,
            flexShrink: 0,
            mt: 0.5,
          }}
        >
          {isBot ? <BotIcon sx={{ fontSize: 20 }} /> : <PersonIcon sx={{ fontSize: 20 }} />}
        </Avatar>

        {/* Message Content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isBot ? 'flex-start' : 'flex-end',
            width: '100%',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: isBot ? 'grey.50' : 'primary.main',
              color: isBot ? 'text.primary' : 'white',
              borderRadius: 3,
              borderTopLeftRadius: isBot ? 1 : 3,
              borderTopRightRadius: isBot ? 3 : 1,
              maxWidth: '100%',
              border: isBot ? '1px solid' : 'none',
              borderColor: isBot ? 'grey.200' : 'transparent',
              boxShadow: isBot ? 'none' : '0 2px 8px rgba(9, 47, 87, 0.2)',
            }}
          >
            {isBot && isTyping ? (
              <TypingText
                text={message}
                speed={20}
                onComplete={handleTypingComplete}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
                  fontSize: '0.95rem',
                }}
              >
                {message}
              </Typography>
            )}
            {timestamp && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.6,
                    fontSize: '0.75rem',
                  }}
                >
                  {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                {isBot && isSpeaking && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <VolumeUpIcon sx={{ fontSize: 12, opacity: 0.6 }} />
                    <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.7rem' }}>
                      Speaking...
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Paper>

          {/* Render chart if available */}
          {chartConfig && isBot && showChart && (
            <Box sx={{
              width: '100%',
              mt: 2,
              animation: 'fadeInUp 0.5s ease-out',
              '@keyframes fadeInUp': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(20px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}>
              <ChartRenderer
                chartConfig={chartConfig}
                height={350}
                showToolbar={true}
                showAddButton={true}
                onAddToDashboard={onAddToDashboard}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [typingMessageId, setTypingMessageId] = useState(null);

  // Voice functionality state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTypingComplete = (messageId) => {
    if (messageId === typingMessageId) {
      setTypingMessageId(null);
    }
  };

  // Initialize voice functionality
  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;

    if (SpeechRecognition && speechSynthesis) {
      setVoiceSupported(true);

      // Initialize speech recognition
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access to use voice input.');
        } else if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.');
        } else {
          setError('Speech recognition error. Please try again.');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      // Initialize speech synthesis
      speechSynthesisRef.current = speechSynthesis;
    } else {
      setVoiceSupported(false);
      console.warn('Speech recognition or synthesis not supported in this browser');
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

  // Start voice recognition
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setError('Failed to start voice recognition. Please try again.');
      }
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  // Speak text using text-to-speech
  const speakText = (text) => {
    if (speechSynthesisRef.current && speechEnabled && text) {
      // Cancel any ongoing speech
      speechSynthesisRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsSpeaking(false);
      };

      speechSynthesisRef.current.speak(utterance);
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Toggle speech enabled/disabled
  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    if (isSpeaking) {
      stopSpeaking();
    }
  };

  const handleAddToDashboard = async (chartData) => {
    try {
      // Use the chart manager to add the chart
      await chartManager.addChart({
        title: (typeof chartData?.title === 'string' ? chartData.title :
               typeof chartData?.title?.text === 'string' ? chartData.title.text : 'AI Generated Chart'),
        description: chartData.description || null,
        chartData: chartData.chartConfig || chartData,
        source: 'chat'
      });

      // Show success message
      const chartTitle = (typeof chartData?.title === 'string' ? chartData.title :
                         typeof chartData?.title?.text === 'string' ? chartData.title.text : 'AI Generated Chart');
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        message: `✅ Chart "${chartTitle}" has been added to your AI Dashboard!`,
        isBot: true,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Error saving chart:', error);
      // Show error message
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        message: `❌ Failed to add chart to dashboard. Please try again.`,
        isBot: true,
        timestamp: new Date(),
      }]);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClickOpen = async () => {
    setOpen(true);
    if (messages.length === 0) {
      // Start with welcome message
      const welcomeMessageId = 1;
      setMessages([
        {
          id: welcomeMessageId,
          message: "Hi! I'm Driver Safety Assistant. How can I help you?",
          isBot: true,
          timestamp: new Date(),
        },
      ]);

      // Set welcome message as typing
      setTypingMessageId(welcomeMessageId);

      // Start chat session
      try {
        const response = await apiService.startChatSession();
        setSessionId(response.data?.session_id);
      } catch (err) {
        console.error('Failed to start chat session:', err);
      }
    }
  };

  const handleClose = () => {
    // Stop any ongoing speech or listening
    if (isListening) {
      stopListening();
    }
    if (isSpeaking) {
      stopSpeaking();
    }
    setOpen(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      message: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
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

      // Set this message as the typing message
      setTypingMessageId(botMessageId);
      setMessages(prev => [...prev, botMessage]);

      // Speak the bot response if speech is enabled
      if (speechEnabled && response.response) {
        // Wait a bit for typing animation to start, then speak
        setTimeout(() => {
          speakText(response.response);
        }, 500);
      }

      // Update session ID if provided
      if (response.session_id) {
        setSessionId(response.session_id);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message);

      const errorMessageId = Date.now() + 1;
      const errorMessage = {
        id: errorMessageId,
        message: `I'm sorry, I'm having trouble connecting to the server right now. Please make sure the server is running and try again.\n\nError: ${err.message}`,
        isBot: true,
        timestamp: new Date(),
      };

      // Set this message as the typing message
      setTypingMessageId(errorMessageId);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  };

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Fab
        color="primary"
        aria-label="Driver Safety Assistant"
        onClick={handleClickOpen}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          width: 64,
          height: 64,
          boxShadow: '0 6px 20px rgba(9, 47, 87, 0.3)',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 8px 25px rgba(9, 47, 87, 0.4)',
          },
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <ChatIcon sx={{ fontSize: 32 }} />
      </Fab>

      {/* Chat Dialog */}
      <Dialog
        open={open}
        slots={{ transition: Transition }}
        keepMounted
        onClose={handleClose}
        maxWidth={isExpanded ? "xl" : "sm"}
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            position: 'fixed',
            bottom: isExpanded ? 20 : 100,
            right: isExpanded ? 20 : 24,
            top: isExpanded ? 20 : 'auto',
            left: isExpanded ? 20 : 'auto',
            margin: 0,
            width: isExpanded ? 'calc(100vw - 40px)' : '650px',
            maxWidth: isExpanded ? 'calc(100vw - 40px)' : '95vw',
            height: isExpanded ? 'calc(100vh - 40px)' : '700px',
            maxHeight: isExpanded ? 'calc(100vh - 40px)' : '85vh',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out',
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'primary.main',
            color: 'white',
            py: 1.5,
            px: 3,
            flexShrink: 0,
            borderRadius: '12px 12px 0 0',
            minHeight: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BotIcon sx={{ mr: 2, fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Driver Safety Assistant
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Speaker Toggle in Header */}
            {voiceSupported && (
              <IconButton
                onClick={isSpeaking ? stopSpeaking : toggleSpeech}
                size="small"
                sx={{
                  opacity: 0.9,
                  color: speechEnabled ? (isSpeaking ? 'warning.light' : 'success.light') : 'grey.300',
                  '&:hover': {
                    opacity: 1,
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
                title={isSpeaking ? "Stop speaking" : speechEnabled ? "Disable voice output" : "Enable voice output"}
              >
                {isSpeaking ? <StopIcon sx={{ fontSize: 18 }} /> :
                 speechEnabled ? <VolumeUpIcon sx={{ fontSize: 18 }} /> : <VolumeOffIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            )}
            <IconButton
              color="inherit"
              onClick={handleExpandToggle}
              size="small"
              sx={{
                opacity: 0.8,
                '&:hover': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <CollapseIcon sx={{ fontSize: 18 }} /> : <ExpandIcon sx={{ fontSize: 18 }} />}
            </IconButton>
            <IconButton
              color="inherit"
              onClick={clearChat}
              size="small"
              sx={{
                opacity: 0.8,
                '&:hover': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
              title="Clear chat"
            >
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
              sx={{
                opacity: 0.8,
                '&:hover': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Messages Area */}
        <DialogContent
          sx={{
            p: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#fafafa',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#ccc',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#999',
              },
            }}
          >
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg.message}
                isBot={msg.isBot}
                timestamp={msg.timestamp}
                chartConfig={msg.chartConfig}
                onAddToDashboard={() => handleAddToDashboard({
                  title: msg.chartConfig?.title || 'AI Generated Chart',
                  chartConfig: msg.chartConfig
                })}
                isTyping={msg.isBot && msg.id === typingMessageId}
                onTypingComplete={() => handleTypingComplete(msg.id)}
                isSpeaking={msg.isBot && isSpeaking}
              />
            ))}

            {loading && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 0.25,
                  mb: 0.8,
                  animation: 'fadeIn 0.3s ease-in',
                  '@keyframes fadeIn': {
                    from: { opacity: 0, transform: 'translateY(10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                {/* Avatar - matching ChatMessage style */}
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: '#092f57',
                    fontSize: '0.75rem',
                    animation: 'botPulse 2s ease-in-out infinite',
                    '@keyframes botPulse': {
                      '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
                      '25%': { transform: 'rotate(10deg) scale(1.1)' },
                      '50%': { transform: 'rotate(-10deg) scale(1)' },
                      '75%': { transform: 'rotate(0deg) scale(1.1)' },
                    },
                  }}
                >
                  <ChatIcon fontSize="small" />
                </Avatar>

                {/* Message Content - matching ChatMessage style */}
                <Box
                  sx={{
                    maxWidth: '75%',
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      borderRadius: '18px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      color: '#1e293b',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                      backdropFilter: 'blur(10px)',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Animated dots */}
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {[0, 1, 2].map((index) => (
                          <Box
                            key={index}
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: '#1976d2',
                              animation: `dotPulse 1.5s ease-in-out infinite`,
                              animationDelay: `${index * 0.2}s`,
                              '@keyframes dotPulse': {
                                '0%, 100%': {
                                  transform: 'scale(1)',
                                  opacity: 0.5
                                },
                                '50%': {
                                  transform: 'scale(1.2)',
                                  opacity: 1
                                },
                              },
                            }}
                          />
                        ))}
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{
                          color: '#64748b',
                          fontSize: '0.9rem',
                          fontStyle: 'italic',
                        }}
                      >
                        AI is analyzing...
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box sx={{ p: 3, backgroundColor: 'white', borderTop: '1px solid', borderColor: 'grey.200' }}>
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
                disabled={loading || isListening}
                variant="outlined"
                size="small"
                placeholder={isListening ? "Listening..." : "Type your message..."}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isListening ? '#e3f2fd' : 'grey.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: isListening ? 'primary.main' : 'grey.300',
                    minHeight: '40px',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused': {
                      borderColor: 'primary.main',
                      backgroundColor: 'white',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    py: 0.75,
                    px: 1.5,
                  },
                }}
              />

              {/* Microphone Button */}
              {voiceSupported && (
                <IconButton
                  onClick={isListening ? stopListening : startListening}
                  disabled={loading}
                  sx={{
                    backgroundColor: isListening ? 'error.main' : 'grey.100',
                    color: isListening ? 'white' : 'grey.700',
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: isListening ? 'error.dark' : 'grey.200',
                    },
                    '&:disabled': {
                      backgroundColor: 'grey.300',
                      color: 'grey.500',
                    },
                  }}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? <StopIcon sx={{ fontSize: 18 }} /> : <MicIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              )}

              {/* Send Button */}
              <IconButton
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading || isListening}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '&:disabled': {
                    backgroundColor: 'grey.300',
                    color: 'grey.500',
                  },
                }}
                title="Send message"
              >
                <SendIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatBot;
