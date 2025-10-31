
"use client";

import { useState, useRef, useEffect } from 'react';
import { Edit, Save, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { callAuthApi } from '@/lib/auth-api';
import { LANGUAGE_MAP } from '@/types/agent';

type ProfileData = {
  name: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  language: string;
  avatar?: string;
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t, setLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const agentDataString = localStorage.getItem('agent_data');
      if (agentDataString) {
        const agentData = JSON.parse(agentDataString);

        // Parse phone into country code and number
        const fullPhone = agentData.agent_phone || '';
        let phoneCountryCode = '';
        let phoneNumber = '';

        if (fullPhone) {
          // Try to extract country code (e.g., "+351" or "(+351)")
          const countryCodeMatch = fullPhone.match(/^\(?(\+\d+)\)?/);
          if (countryCodeMatch) {
            phoneCountryCode = countryCodeMatch[1];
            phoneNumber = fullPhone.replace(/^\(?(\+\d+)\)?\s*/, '').trim();
          } else {
            // If no country code found, treat entire string as phone number
            phoneNumber = fullPhone;
          }
        }

        const profileData = {
          name: agentData.agent_name || '',
          email: agentData.agent_email || '',
          phoneCountryCode,
          phoneNumber,
          language: agentData.agent_language || 'English',
          avatar: agentData.agent_image_url || undefined,
        };
        setProfile(profileData);
        setOriginalProfile(profileData);
        setAvatarPreview(profileData.avatar || null);
      }
    } catch (error) {
        console.error("Failed to load agent data", error)
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleLanguageChange = (value: string) => {
    if (!profile) return;
    setProfile(prev => prev ? { ...prev, language: value } : null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);

    try {
      // Get current agent data from localStorage
      const agentDataString = localStorage.getItem('agent_data');
      if (!agentDataString) {
        throw new Error('Agent data not found');
      }

      const agentData = JSON.parse(agentDataString);

      // Combine phone fields
      const combinedPhone = `${profile.phoneCountryCode} ${profile.phoneNumber}`.trim();

      // Prepare update payload
      const updatePayload = {
        agent_id: agentData.agent_id,
        agent_name: profile.name,
        agent_email: profile.email,
        agent_phone: combinedPhone,
        agent_language: profile.language,
        agent_image_url: avatarPreview || profile.avatar || '',
        login_username: agentData.login_username,
        sheet_url: agentData.sheet_url || '',
      };

      // Call update_agent webhook
      const response = await callAuthApi('update_agent', updatePayload);

      if (response.success) {
        // Update localStorage with new data
        const updatedAgentData = {
          ...agentData,
          agent_name: profile.name,
          agent_email: profile.email,
          agent_phone: combinedPhone,
          agent_language: profile.language,
          agent_image_url: avatarPreview || profile.avatar,
        };
        localStorage.setItem('agent_data', JSON.stringify(updatedAgentData));

        // Update language context
        const languageCode = LANGUAGE_MAP[profile.language] || 'pt';
        setLanguage(languageCode);

        const updatedProfile = { ...profile, avatar: avatarPreview || profile.avatar };
        setOriginalProfile(updatedProfile);
        setProfile(updatedProfile);

        toast({
          title: t.profile.messages.successTitle,
          description: t.profile.messages.successDescription,
        });

        setIsEditing(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: t.profile.messages.errorTitle,
        description: error.message || t.profile.messages.errorDescription,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalProfile) {
        setProfile(originalProfile);
        setAvatarPreview(originalProfile.avatar || null);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center p-4 text-center">
        <p>Could not load your agent profile. Please try logging out and back in.</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between py-4">
        <h2 className="text-2xl font-bold text-gray-800">{t.profile.title}</h2>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>{t.profile.cancel}</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {t.profile.save}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              {t.profile.edit}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || undefined} alt={profile.name} />
                <AvatarFallback>{profile.name ? profile.name.charAt(0).toUpperCase() : 'A'}</AvatarFallback>
              </Avatar>
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white shadow-md"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>
            <div className="text-center">
                <h3 className="text-xl font-bold">{profile.name}</h3>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">{t.profile.fullName}</Label>
              {isEditing ? (
                <Input id="name" name="name" value={profile.name} onChange={handleInputChange} />
              ) : (
                <p className="text-base py-2.5 text-gray-900">{profile.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t.profile.phoneNumber}</Label>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    id="phoneCountryCode"
                    name="phoneCountryCode"
                    type="tel"
                    value={profile.phoneCountryCode}
                    onChange={handleInputChange}
                    placeholder="+351"
                    className="w-28"
                  />
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={profile.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="8072624362"
                    className="flex-1"
                  />
                </div>
              ) : (
                <p className="text-base py-2.5 text-gray-900">
                  {profile.phoneCountryCode} {profile.phoneNumber}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.profile.emailAddress}</Label>
              {isEditing ? (
                <Input id="email" name="email" type="email" value={profile.email} onChange={handleInputChange} />
              ) : (
                <p className="text-base py-2.5 text-gray-900">{profile.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t.profile.language}</Label>
              {isEditing ? (
                <Select name="language" value={profile.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder={t.profile.selectLanguage} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Portuguese">Portuguese</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-base py-2.5 text-gray-900">{profile.language}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
