"use client";

import { useState, useRef } from 'react';
import { Edit, Save, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const initialProfileData = {
  name: 'Ethan Carter',
  email: 'ethan.carter@example.com',
  phone: '123-456-7890',
  language: 'English',
  avatar: 'https://i.pravatar.cc/150?u=ethan',
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState(initialProfileData);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialProfileData.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleLanguageChange = (value: string) => {
    setProfile(prev => ({ ...prev, language: value }));
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
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real app, you would save the data to your backend
    toast({
      title: "Success",
      description: "Your profile has been updated.",
    });
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setProfile(initialProfileData);
    setAvatarPreview(initialProfileData.avatar);
    setIsEditing(false);
  };

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between py-4">
        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        <div>
          {isEditing ? (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
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
                <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {isEditing && (
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
                <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" value={profile.name} onChange={handleInputChange} readOnly={!isEditing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" value={profile.phone} onChange={handleInputChange} readOnly={!isEditing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" value={profile.email} onChange={handleInputChange} readOnly={!isEditing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              {isEditing ? (
                <Select name="language" value={profile.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Portuguese">Portuguese</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input id="language" name="language" value={profile.language} readOnly />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isEditing && (
        <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
