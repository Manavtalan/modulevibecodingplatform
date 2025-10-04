import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Clock, 
  Trash2, 
  Loader2, 
  Search, 
  Calendar,
  Hash,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';

interface Conversation {
  id: string;
  title: string;
  last_active: string;
  created_at: string;
  total_messages: number;
  status: string;
  mode?: string;
}

const ChatHistory: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_active', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      toast({
        title: "Success",
        description: "Conversation deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  const handleViewConversation = (conversationId: string) => {
    navigate('/', { state: { conversationId } });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex w-full">
      {/* Sidebar */}
      <Sidebar initialCollapsed={true} />
      
      {/* Main Content Area */}
      <div className="flex-1 min-h-screen transition-[margin-left] duration-[260ms] ease-[cubic-bezier(0.2,0.9,0.2,1)] ml-0 sm:ml-[72px]">
        {/* Background Graphics */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 relative z-[1]">
          
          {/* Header */}
          <div className="mb-8 sm:mb-10 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                    Chat History
                  </h1>
                </div>
                <p className="text-base sm:text-lg text-muted-foreground">
                  View and manage all your conversations
                </p>
              </div>
              <Button
                onClick={() => navigate('/')}
                className="bg-gradient-primary hover:opacity-90"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-card border-border/50 focus:border-primary"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <Card className="glass-card border-border/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Conversations</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">{conversations.length}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-border/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Messages</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">
                      {conversations.reduce((sum, conv) => sum + (conv.total_messages || 0), 0)}
                    </p>
                  </div>
                  <Hash className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Chats</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">
                      {conversations.filter(c => c.status === 'active').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversations List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <Card className="glass-card border-border/50 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <CardContent className="p-8 sm:p-12 text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground mb-2">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search terms' : 'Start a new chat to begin your first conversation'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
              {filteredConversations.map((conversation) => (
                <Card 
                  key={conversation.id}
                  className="glass-card border-border/50 hover:border-primary/50 transition-all hover:scale-[1.01] cursor-pointer group"
                  onClick={() => handleViewConversation(conversation.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors mb-2 truncate">
                          {conversation.title || 'Untitled Conversation'}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Created: {format(new Date(conversation.created_at), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Last active: {formatDistanceToNow(new Date(conversation.last_active), { addSuffix: true })}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewConversation(conversation.id);
                          }}
                          className="glass-card"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(conversation.id, e)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="secondary" className="glass-card">
                        <Hash className="w-3 h-3 mr-1" />
                        {conversation.total_messages || 0} messages
                      </Badge>
                      {conversation.mode && (
                        <Badge variant="outline" className="glass-card border-primary/50 text-primary">
                          {conversation.mode}
                        </Badge>
                      )}
                      <Badge 
                        variant={conversation.status === 'active' ? 'default' : 'secondary'}
                        className={conversation.status === 'active' ? 'bg-gradient-primary' : 'glass-card'}
                      >
                        {conversation.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;