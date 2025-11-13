import { FC, useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Calendar, Settings, Save, Github, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GitHubConnections from '@/components/GitHubConnections';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';

const Profile: FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    joinDate: '',
    bio: '',
    avatar: ''
  });

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('display_name, bio, avatar_url, created_at')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        setProfileData({
          name: profile?.display_name || '',
          email: user.email || '',
          joinDate: profile?.created_at || '',
          bio: profile?.bio || '',
          avatar: profile?.avatar_url || ''
        });
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profileData.name,
          bio: profileData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    // Reload the profile data from the database
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, bio, avatar_url, created_at')
        .eq('id', user.id)
        .single();

      if (profile) {
        setProfileData({
          name: profile.display_name || '',
          email: user.email || '',
          joinDate: profile.created_at || '',
          bio: profile.bio || '',
          avatar: profile.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error reloading profile:', error);
    }
    
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Navigation />
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Navigation />
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <Card className="glass-card border-0">
              <CardHeader className="text-center">
                <div className="relative inline-block">
                   <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-primary/20">
                     <AvatarImage src={profileData.avatar} />
                     <AvatarFallback className="text-xl font-bold bg-gradient-primary text-primary-foreground">
                       {profileData.name ? profileData.name.split(' ').map(n => n[0]).join('') : 'U'}
                     </AvatarFallback>
                   </Avatar>
                </div>
                 <CardTitle className="text-foreground text-xl">
                   {profileData.name || 'No name set'}
                 </CardTitle>
                 <CardDescription className="text-muted-foreground">
                   {profileData.bio || 'No bio yet'}
                 </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {profileData.email}
                </div>
                 <div className="flex items-center gap-3 text-sm text-muted-foreground">
                   <Calendar className="w-4 h-4" />
                   Joined {profileData.joinDate ? new Date(profileData.joinDate).toLocaleDateString() : 'Unknown'}
                 </div>
              </CardContent>
            </Card>

          </div>

          {/* Profile Settings with Tabs */}
          <div className="md:col-span-2">
            <Card className="glass-card border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account and integrations
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                     <Button
                       variant="default"
                       size="sm"
                       onClick={handleSave}
                       disabled={saving}
                       className="flex items-center gap-2"
                     >
                       {saving ? (
                         <>
                           <Loader2 className="w-4 h-4 animate-spin" />
                           Saving...
                         </>
                       ) : (
                         <>
                           <Save className="w-4 h-4" />
                           Save
                         </>
                       )}
                     </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="profile">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="github">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </TabsTrigger>
                  </TabsList>

                  {/* Profile Tab */}
                  <TabsContent value="profile" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-foreground font-medium">
                      Full Name
                    </Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleInputChange}
                        className="chat-input pl-10 border-0"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                   <div>
                     <Label htmlFor="email" className="text-foreground font-medium">
                       Email Address
                     </Label>
                     <div className="relative mt-2">
                       <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="email"
                         name="email"
                         type="email"
                         value={profileData.email}
                         className="chat-input pl-10 border-0 bg-muted/50"
                         disabled
                         title="Email cannot be changed"
                       />
                     </div>
                     <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                   </div>
                </div>

                 <div>
                   <Label htmlFor="bio" className="text-foreground font-medium">
                     Bio
                   </Label>
                   <Textarea
                     id="bio"
                     name="bio"
                     value={profileData.bio}
                     onChange={handleInputChange}
                     className="chat-input border-0 mt-2 min-h-[100px]"
                     placeholder="Tell us about yourself..."
                     disabled={!isEditing}
                   />
                 </div>

                 <div>
                   <Label className="text-foreground font-medium">
                     Member Since
                   </Label>
                   <div className="relative mt-2">
                     <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                     <Input
                       value={profileData.joinDate ? new Date(profileData.joinDate).toLocaleDateString('en-US', { 
                         year: 'numeric', 
                         month: 'long', 
                         day: 'numeric' 
                       }) : 'Unknown'}
                       className="chat-input pl-10 border-0 bg-muted/50"
                       disabled
                     />
                   </div>
                 </div>

                  </TabsContent>

                  {/* GitHub Tab */}
                  <TabsContent value="github">
                    <GitHubConnections />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;