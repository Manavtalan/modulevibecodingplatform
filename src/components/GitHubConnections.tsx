import { useState, useEffect } from 'react';
import { Github, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GitHubConnection {
  id: string;
  repo_url: string;
  repo_name: string;
  connected_at: string;
  last_synced: string | null;
  is_active: boolean;
}

export const GitHubConnections = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<GitHubConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('github_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('connected_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching GitHub connections:', error);
      toast.error('Failed to load GitHub connections');
    } finally {
      setLoading(false);
    }
  };

  const addConnection = async () => {
    if (!newRepoUrl.trim()) {
      toast.error('Please enter a repository URL');
      return;
    }

    // Extract repo name from URL
    const urlParts = newRepoUrl.split('/');
    const repoName = urlParts[urlParts.length - 1].replace('.git', '');

    if (!repoName) {
      toast.error('Invalid repository URL');
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from('github_connections')
        .insert({
          user_id: user!.id,
          repo_url: newRepoUrl,
          repo_name: repoName,
        });

      if (error) throw error;

      toast.success('Repository connected successfully');
      setNewRepoUrl('');
      fetchConnections();
    } catch (error: any) {
      console.error('Error adding connection:', error);
      if (error.code === '23505') {
        toast.error('This repository is already connected');
      } else {
        toast.error('Failed to connect repository');
      }
    } finally {
      setAdding(false);
    }
  };

  const removeConnection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('github_connections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Repository disconnected');
      fetchConnections();
    } catch (error) {
      console.error('Error removing connection:', error);
      toast.error('Failed to disconnect repository');
    }
  };

  const syncConnection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('github_connections')
        .update({ last_synced: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast.success('Repository synced');
      fetchConnections();
    } catch (error) {
      console.error('Error syncing connection:', error);
      toast.error('Failed to sync repository');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">GitHub Connections</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your GitHub repositories for code management
          </p>
        </div>
      </div>

      {/* Add New Connection */}
      <Card className="p-4 bg-card/50 border-border">
        <div className="flex gap-3">
          <Input
            placeholder="https://github.com/username/repository"
            value={newRepoUrl}
            onChange={(e) => setNewRepoUrl(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && addConnection()}
          />
          <Button
            onClick={addConnection}
            disabled={adding || !newRepoUrl.trim()}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect
          </Button>
        </div>
      </Card>

      {/* Connections List */}
      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading connections...</p>
        </Card>
      ) : connections.length === 0 ? (
        <Card className="p-8 text-center">
          <Github className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No GitHub repositories connected yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add a repository URL above to get started
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {connections.map((connection) => (
            <Card key={connection.id} className="p-4 bg-card/50 border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium text-foreground">{connection.repo_name}</h3>
                    <a
                      href={connection.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {connection.repo_url}
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      Connected {new Date(connection.connected_at).toLocaleDateString()}
                      {connection.last_synced && ` • Last synced ${new Date(connection.last_synced).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => syncConnection(connection.id)}
                    title="Sync repository"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeConnection(connection.id)}
                    className="text-destructive hover:text-destructive"
                    title="Disconnect repository"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GitHubConnections;
