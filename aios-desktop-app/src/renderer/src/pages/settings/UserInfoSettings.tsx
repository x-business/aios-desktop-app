import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUserInfoStore, UserInfo } from '@/stores/userInfoStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const UserInfoSettings: React.FC = () => {
  const { userInfo, setUserInfo } = useUserInfoStore();
  
  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserInfo({ [name]: value });
  };

  // Handle arrays (languages, websites)
  const [newLanguage, setNewLanguage] = useState('');
  const [newWebsite, setNewWebsite] = useState('');

  const addLanguage = () => {
    if (newLanguage.trim()) {
      setUserInfo({ languages: [...(userInfo.languages || []), newLanguage.trim()] });
      setNewLanguage('');
    }
  };

  const removeLanguage = (index: number) => {
    const updatedLanguages = [...userInfo.languages];
    updatedLanguages.splice(index, 1);
    setUserInfo({ languages: updatedLanguages });
  };

  const addWebsite = () => {
    if (newWebsite.trim()) {
      setUserInfo({ websites: [...(userInfo.websites || []), newWebsite.trim()] });
      setNewWebsite('');
    }
  };

  const removeWebsite = (index: number) => {
    const updatedWebsites = [...userInfo.websites];
    updatedWebsites.splice(index, 1);
    setUserInfo({ websites: updatedWebsites });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">User Information</h3>
        <p className="text-sm text-muted-foreground">
          Add personal information to improve AI personalization.
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="misc">Additional</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card className="p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={userInfo.fullName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={userInfo.dateOfBirth}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={userInfo.email}
                  onChange={handleInputChange}
                  placeholder="john.doe@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={userInfo.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={userInfo.address}
                  onChange={handleInputChange}
                  placeholder="123 Main St, City, State, Zip"
                  rows={3}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="professional" className="space-y-4">
          <Card className="p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  name="occupation"
                  value={userInfo.occupation}
                  onChange={handleInputChange}
                  placeholder="Software Developer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  value={userInfo.company}
                  onChange={handleInputChange}
                  placeholder="Acme Corp"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Languages</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {userInfo.languages && userInfo.languages.map((lang, index) => (
                    <div key={index} className="flex items-center bg-muted px-2 py-1 rounded">
                      <span>{lang}</span>
                      <button
                        onClick={() => removeLanguage(index)}
                        className="ml-2 text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Add a language"
                    onKeyDown={(e) => e.key === 'Enter' && addLanguage()}
                  />
                  <Button onClick={addLanguage} type="button" variant="outline">Add</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Websites</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {userInfo.websites && userInfo.websites.map((website, index) => (
                    <div key={index} className="flex items-center bg-muted px-2 py-1 rounded">
                      <span>{website}</span>
                      <button
                        onClick={() => removeWebsite(index)}
                        className="ml-2 text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    placeholder="Add a website"
                    onKeyDown={(e) => e.key === 'Enter' && addWebsite()}
                  />
                  <Button onClick={addWebsite} type="button" variant="outline">Add</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Life Goals</Label>
                <Textarea
                  id="goals"
                  name="goals"
                  value={userInfo.goals}
                  onChange={handleInputChange}
                  placeholder="Describe your personal and professional goals..."
                  rows={3}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="misc" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preferences">Preferences</Label>
                <Textarea
                  id="preferences"
                  name="preferences"
                  value={userInfo.preferences}
                  onChange={handleInputChange}
                  placeholder="Describe your preferences (e.g., UI themes, formats, communication styles)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contacts">Contacts</Label>
                <Textarea
                  id="contacts"
                  name="contacts"
                  value={userInfo.contacts}
                  onChange={handleInputChange}
                  placeholder="Describe key contacts in your network"
                  rows={3}
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserInfoSettings; 