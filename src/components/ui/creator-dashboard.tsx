'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Share2, Eye, Users, Palette, Calendar } from 'lucide-react';

interface Capsule {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  shareCode?: string;
  items: Array<{
    itemId: string;
    order: number;
    item: {
      id: string;
      title?: string;
      category: string;
      colors: string[];
      imageS3: string;
    };
  }>;
  createdAt: string;
}

interface CreatorDashboardProps {
  userId: string;
}

export function CreatorDashboard({ userId }: CreatorDashboardProps) {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [userItems, setUserItems] = useState<any[]>([]);

  // Form state
  const [capsuleName, setCapsuleName] = useState('');
  const [capsuleDescription, setCapsuleDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    fetchCapsules();
    fetchUserItems();
  }, [userId]);

  const fetchCapsules = async () => {
    try {
      const response = await fetch(`/api/capsules?userId=${userId}`);
      const data = await response.json();
      setCapsules(data.capsules || []);
    } catch (error) {
      console.error('Error fetching capsules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserItems = async () => {
    try {
      const response = await fetch(`/api/items?userId=${userId}`);
      const data = await response.json();
      setUserItems(data.items || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const createCapsule = async () => {
    if (!capsuleName || selectedItems.length === 0) return;

    try {
      const response = await fetch('/api/capsules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: capsuleName,
          description: capsuleDescription,
          isPublic,
          itemIds: selectedItems
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCapsules([data.capsule, ...capsules]);
        setShowCreateDialog(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating capsule:', error);
    }
  };

  const resetForm = () => {
    setCapsuleName('');
    setCapsuleDescription('');
    setIsPublic(false);
    setSelectedItems([]);
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const shareUrl = (shareCode: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    return `${baseUrl}/share/${shareCode}`;
  };

  const copyShareUrl = (shareCode: string) => {
    navigator.clipboard.writeText(shareUrl(shareCode));
    // Could add toast notification here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your capsules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Creator Dashboard</h2>
          <p className="text-muted-foreground">
            Create and manage your fashion capsules
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Capsule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Capsule</DialogTitle>
              <DialogDescription>
                Curate a collection of your favorite pieces to share with others
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Capsule Name</Label>
                <Input
                  id="name"
                  value={capsuleName}
                  onChange={(e) => setCapsuleName(e.target.value)}
                  placeholder="e.g., Summer Essentials"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={capsuleDescription}
                  onChange={(e) => setCapsuleDescription(e.target.value)}
                  placeholder="Describe your capsule..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="public">Make public and shareable</Label>
              </div>
              
              <div>
                <Label>Select Items ({selectedItems.length} selected)</Label>
                <div className="grid grid-cols-4 gap-2 mt-2 max-h-64 overflow-y-auto">
                  {userItems.map((item) => (
                    <div
                      key={item.id}
                      className={`relative cursor-pointer rounded-lg border-2 transition-colors ${
                        selectedItems.includes(item.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleItemSelection(item.id)}
                    >
                      <div className="aspect-square bg-muted rounded-md">
                        {item.imageS3 && (
                          <img
                            src={item.imageS3}
                            alt={item.title || item.category}
                            className="w-full h-full object-cover rounded-md"
                          />
                        )}
                      </div>
                      <div className="p-1">
                        <p className="text-xs truncate">{item.title || item.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createCapsule}
                  disabled={!capsuleName || selectedItems.length === 0}
                >
                  Create Capsule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="my-capsules" className="w-full">
        <TabsList>
          <TabsTrigger value="my-capsules">My Capsules</TabsTrigger>
          <TabsTrigger value="public-capsules">Discover</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-capsules" className="space-y-4">
          {capsules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Palette className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No capsules yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first capsule to start curating your style
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Capsule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {capsules.map((capsule) => (
                <Card key={capsule.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{capsule.name}</CardTitle>
                        {capsule.description && (
                          <CardDescription className="mt-1">
                            {capsule.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {capsule.isPublic && (
                          <Badge variant="secondary">
                            <Users className="mr-1 h-3 w-3" />
                            Public
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-1 mb-4">
                      {capsule.items.slice(0, 4).map((capsuleItem) => (
                        <div key={capsuleItem.itemId} className="aspect-square bg-muted rounded">
                          {capsuleItem.item.imageS3 && (
                            <img
                              src={capsuleItem.item.imageS3}
                              alt={capsuleItem.item.title || capsuleItem.item.category}
                              className="w-full h-full object-cover rounded"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <span>{capsule.items.length} items</span>
                      <span>{new Date(capsule.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      {capsule.shareCode && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyShareUrl(capsule.shareCode!)}
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="public-capsules">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Discover Public Capsules</h3>
              <p className="text-muted-foreground text-center">
                Explore capsules shared by other creators
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
