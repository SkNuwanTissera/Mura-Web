import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Fab,
  IconButton,
  Paper,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchChatHistory, fetchChildren, sendChatMessage } from '../api';
import { ChatMessage, Child } from '../types';
import ChatActivitySuggestion from './ChatActivitySuggestion';

const SELECTED_CHILD_KEY = 'mura-chat-selected-child';

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function matchChildByName(input: string, children: Child[]): Child | undefined {
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  return (
    children.find((child) => child.name.toLowerCase() === normalized) ||
    children.find((child) => normalized.includes(child.name.toLowerCase()))
  );
}

function buildChildSelectionPrompt(children: Child[]) {
  const names = children.map((child) => `${child.name} (${child.age} yrs)`).join(', ');
  return `Hi! Who are we finding activities for today?\n\nReply with a name: ${names}`;
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 1.5,
      }}
    >
      <Box sx={{ maxWidth: '85%' }}>
        <Paper
          elevation={0}
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            bgcolor: isUser ? '#dcf8c6' : '#ffffff',
            border: isUser ? 'none' : '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
        </Paper>

        {!isUser && message.activities && message.activities.length > 0 && (
          <Box sx={{ mt: 1, display: 'grid', gap: 1 }}>
            {message.activities.map((activity) => (
              <ChatActivitySuggestion key={activity.id} activity={activity} />
            ))}
          </Box>
        )}

        {message.createdAt && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5, textAlign: isUser ? 'right' : 'left', px: 0.5 }}
          >
            {formatTime(message.createdAt)}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function ChildSelectionPrompt({
  children,
  onSelect,
}: {
  children: Child[];
  onSelect: (child: Child) => void;
}) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Paper
        elevation={0}
        sx={{
          px: 1.5,
          py: 1,
          borderRadius: '18px 18px 18px 4px',
          bgcolor: '#ffffff',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1.5 }}>
          {buildChildSelectionPrompt(children)}
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {children.map((child) => (
            <Chip
              key={child.id}
              label={`${child.name} (${child.age} yrs)`}
              clickable
              color="primary"
              variant="outlined"
              onClick={() => onSelect(child)}
            />
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedChild = children.find((child) => child.id === selectedChildId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [messages, open, sending, selectedChildId, scrollToBottom]);

  useEffect(() => {
    if (!open || !user?.parentId) {
      return;
    }

    setLoadingChildren(true);
    setError('');
    fetchChildren(user.parentId)
      .then((list) => {
        setChildren(list);
        const storedChildId = window.sessionStorage.getItem(SELECTED_CHILD_KEY) || '';
        if (list.some((child) => child.id === storedChildId)) {
          setSelectedChildId(storedChildId);
        } else {
          setSelectedChildId('');
          window.sessionStorage.removeItem(SELECTED_CHILD_KEY);
        }
      })
      .catch((err) => {
        setChildren([]);
        setSelectedChildId('');
        setError(err instanceof Error ? err.message : 'Could not load children.');
      })
      .finally(() => setLoadingChildren(false));
  }, [open, user?.parentId]);

  useEffect(() => {
    if (!open || !user?.parentId || !selectedChildId) {
      setMessages([]);
      return;
    }

    window.sessionStorage.setItem(SELECTED_CHILD_KEY, selectedChildId);
    setLoadingHistory(true);
    setError('');
    fetchChatHistory(user.parentId, selectedChildId)
      .then(setMessages)
      .catch((err) => {
        setMessages([]);
        setError(err instanceof Error ? err.message : 'Could not load chat history.');
      })
      .finally(() => setLoadingHistory(false));
  }, [open, user?.parentId, selectedChildId]);

  const handleSelectChild = (child: Child) => {
    setError('');
    setSelectedChildId(child.id);
    window.sessionStorage.setItem(SELECTED_CHILD_KEY, child.id);
  };

  const handleSend = async () => {
    if (!user?.parentId || !draft.trim() || sending || children.length === 0) {
      return;
    }

    const text = draft.trim();

    if (!selectedChildId) {
      const matchedChild = matchChildByName(text, children);
      if (!matchedChild) {
        setError(`Please choose one of your children: ${children.map((child) => child.name).join(', ')}`);
        return;
      }
      setDraft('');
      setError('');
      handleSelectChild(matchedChild);
      return;
    }

    setDraft('');
    setSending(true);
    setError('');

    try {
      await sendChatMessage(user.parentId, selectedChildId, text);
      const history = await fetchChatHistory(user.parentId, selectedChildId);
      setMessages(history);
    } catch (err) {
      setDraft(text);
      setError(err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {!open && (
        <Fab
          color="primary"
          aria-label="Open chat"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            zIndex: 1400,
          }}
        >
          <ChatIcon />
        </Fab>
      )}

      {open && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            width: { xs: 'calc(100vw - 32px)', sm: 380 },
            height: { xs: 'min(80vh, 560px)', sm: 560 },
            zIndex: 1400,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Mura
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {selectedChild
                  ? `Finding activities for ${selectedChild.name}`
                  : 'Activity recommendations for your child'}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'inherit' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              px: 2,
              py: 2,
              bgcolor: '#ece5dd',
            }}
          >
            {loadingChildren && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {!loadingChildren && children.length === 0 && (
              <Alert severity="info">
                Add a child profile first to get personalised recommendations.{' '}
                <Button component={RouterLink} to="/children" size="small">
                  Manage children
                </Button>
              </Alert>
            )}

            {!loadingChildren && !selectedChildId && children.length > 0 && (
              <ChildSelectionPrompt children={children} onSelect={handleSelectChild} />
            )}

            {loadingHistory && selectedChildId && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {!loadingHistory &&
              selectedChildId &&
              messages.length === 0 &&
              selectedChild && (
                <Paper
                  elevation={0}
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: '18px 18px 18px 4px',
                    bgcolor: '#ffffff',
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 1.5,
                  }}
                >
                  <Typography variant="body2">
                    Great, I&apos;ll suggest activities for {selectedChild.name}. What kind of activities are you
                    looking for?
                  </Typography>
                </Paper>
              )}

            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}

            {sending && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: '18px 18px 18px 4px',
                    bgcolor: '#ffffff',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <CircularProgress size={16} />
                </Paper>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {error && (
            <Box sx={{ px: 2, pt: 1 }}>
              <Alert severity="error" onClose={() => setError('')} sx={{ py: 0 }}>
                {error}
              </Alert>
            </Box>
          )}

          <Box
            sx={{
              px: 1.5,
              py: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              gap: 1,
              alignItems: 'flex-end',
              bgcolor: 'background.paper',
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={4}
              size="small"
              placeholder={
                !selectedChildId && children.length > 0
                  ? "Type your child's name..."
                  : 'Ask for activity ideas...'
              }
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              disabled={children.length === 0 || sending}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={children.length === 0 || !draft.trim() || sending}
              aria-label="Send message"
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
}
