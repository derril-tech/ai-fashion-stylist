'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Crown, Shield, User, Mail, Calendar } from 'lucide-react';

interface Household {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  owner: {
    id: string;
    name?: string;
    email: string;
  };
  members: Array<{
    id: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      name?: string;
      email: string;
    };
  }>;
  items: Array<{
    id: string;
    title?: string;
    category: string;
  }>;
}

interface HouseholdManagerProps {
  userId: string;
}

export function HouseholdManager({ userId }: HouseholdManagerProps) {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [householdName, setHouseholdName] = useState('');

  useEffect(() => {
    fetchHouseholds();
  }, [userId]);

  const fetchHouseholds = async () => {
    try {
      const response = await fetch(`/api/households?userId=${userId}`);
      const data = await response.json();
      setHouseholds(data.households || []);
    } catch (error) {
      console.error('Error fetching households:', error);
    } finally {
      setLoading(false);
    }
  };

  const createHousehold = async () => {
    if (!householdName.trim()) return;

    try {
      const response = await fetch('/api/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: householdName,
          ownerId: userId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setHouseholds([data.household, ...households]);
        setShowCreateDialog(false);
        setHouseholdName('');
      }
    } catch (error) {
      console.error('Error creating household:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading households...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Household Manager</h2>
          <p className="text-muted-foreground">
            Share and manage wardrobes with family members
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Household
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Household</DialogTitle>
              <DialogDescription>
                Create a shared wardrobe space for your family
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="household-name">Household Name</Label>
                <Input
                  id="household-name"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="e.g., The Smith Family"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createHousehold}
                  disabled={!householdName.trim()}
                >
                  Create Household
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {households.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No households yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create a household to start sharing wardrobes with family members
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Household
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {households.map((household) => (
            <Card key={household.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      {household.name}
                    </CardTitle>
                    <CardDescription>
                      Created {new Date(household.createdAt).toLocaleDateString()} • {household.items.length} items
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {household.members.length} member{household.members.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="members" className="w-full">
                  <TabsList>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="items">Items</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="members" className="space-y-4">
                    <div className="space-y-3">
                      {household.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                              {getRoleIcon(member.role)}
                            </div>
                            <div>
                              <p className="font-medium">
                                {member.user.name || member.user.email}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center">
                                <Mail className="mr-1 h-3 w-3" />
                                {member.user.email}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge variant={getRoleBadgeVariant(member.role)}>
                              {member.role}
                            </Badge>
                            <div className="text-xs text-muted-foreground flex items-center">
                              <Calendar className="mr-1 h-3 w-3" />
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {household.ownerId === userId && (
                      <Button variant="outline" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Invite Member
                      </Button>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="items">
                    <div className="space-y-3">
                      {household.items.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No shared items yet
                        </p>
                      ) : (
                        household.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">
                                {item.title || `${item.category} item`}
                              </p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {item.category}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="settings">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Household Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Owner:</span>
                            <span>{household.owner.name || household.owner.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Created:</span>
                            <span>{new Date(household.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Members:</span>
                            <span>{household.members.length}</span>
                          </div>
                        </div>
                      </div>
                      
                      {household.ownerId === userId && (
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full">
                            Edit Household
                          </Button>
                          <Button variant="destructive" className="w-full">
                            Delete Household
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Household Features</CardTitle>
          <CardDescription>
            What you can do with shared wardrobes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Shared Access
              </h4>
              <p className="text-sm text-muted-foreground">
                All household members can view and use shared items for outfit generation
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Role-Based Permissions
              </h4>
              <p className="text-sm text-muted-foreground">
                Control who can add, edit, or manage items with different permission levels
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
