import { FC, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Calendar, Settings, Camera, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Profile: FC = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Alex Developer',
    email: 'alex@example.com',
    joinDate: '2024-01-15',
    bio: 'Full-stack developer passionate about AI and clean code.',
    avatar: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data if needed
  };

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
                      {profileData.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="icon"
                      variant="glass"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <CardTitle className="text-foreground text-xl">
                  {profileData.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {profileData.bio}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {profileData.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(profileData.joinDate).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="glass-card border-0 mt-6">
              <CardHeader>
                <CardTitle className="text-foreground text-lg">Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Chats Created</span>
                  <span className="font-bold text-primary">47</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Code Generated</span>
                  <span className="font-bold text-accent">234</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Bugs Fixed</span>
                  <span className="font-bold text-warm">89</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Settings */}
          <div className="md:col-span-2">
            <Card className="glass-card border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Profile Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account information and preferences
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
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
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
                        onChange={handleInputChange}
                        className="chat-input pl-10 border-0"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-foreground font-medium">
                    Bio
                  </Label>
                  <Input
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    className="chat-input border-0 mt-2"
                    placeholder="Tell us about yourself..."
                    disabled={!isEditing}
                  />
                </div>

                {/* Preferences */}
                <div className="pt-6 border-t border-glass-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Preferences
                  </h3>
                  <div className="space-y-4">
                    <div className="glass-card p-4">
                      <h4 className="font-medium text-foreground mb-2">Code Style</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Choose your preferred coding style and formatting
                      </p>
                      <div className="flex gap-2">
                        <Button variant="glass" size="sm">JavaScript</Button>
                        <Button variant="glass" size="sm">TypeScript</Button>
                        <Button variant="glass" size="sm">Python</Button>
                      </div>
                    </div>

                    <div className="glass-card p-4">
                      <h4 className="font-medium text-foreground mb-2">Assistant Behavior</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Customize how the AI assistant responds to you
                      </p>
                      <div className="flex gap-2">
                        <Button variant="glass" size="sm">Detailed</Button>
                        <Button variant="glass" size="sm">Concise</Button>
                        <Button variant="glass" size="sm">Beginner-friendly</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;