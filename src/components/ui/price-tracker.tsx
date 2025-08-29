'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, TrendingDown, TrendingUp, Minus, DollarSign, AlertCircle } from 'lucide-react';

interface PriceAlert {
  id: string;
  targetPrice: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  product: {
    id: string;
    name: string;
    brand?: string;
    priceCents: number;
    currency: string;
    imageUrl?: string;
    url: string;
  };
}

interface PriceTrackerProps {
  userId: string;
}

export function PriceTracker({ userId }: PriceTrackerProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [targetPrice, setTargetPrice] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, [userId]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/price-alerts?userId=${userId}`);
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching price alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async () => {
    if (!selectedProduct || !targetPrice) return;

    try {
      const response = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId: selectedProduct.id,
          targetPrice: parseFloat(targetPrice) * 100, // Convert to cents
          currency: selectedProduct.currency
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts([data.alert, ...alerts]);
        setShowCreateDialog(false);
        setTargetPrice('');
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Error creating price alert:', error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/price-alerts?alertId=${alertId}&userId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAlerts(alerts.filter(alert => alert.id !== alertId));
      }
    } catch (error) {
      console.error('Error deleting price alert:', error);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(cents / 100);
  };

  const getPriceStatus = (currentPrice: number, targetPrice: number) => {
    if (currentPrice <= targetPrice) {
      return { status: 'triggered', icon: TrendingDown, color: 'text-green-600' };
    }
    const diff = ((currentPrice - targetPrice) / targetPrice) * 100;
    if (diff <= 10) {
      return { status: 'close', icon: Minus, color: 'text-yellow-600' };
    }
    return { status: 'waiting', icon: TrendingUp, color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading price alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Price Tracker</h2>
          <p className="text-muted-foreground">
            Get notified when items go on sale
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Bell className="mr-2 h-4 w-4" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Price Alert</DialogTitle>
              <DialogDescription>
                Get notified when a product drops to your target price
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Product</Label>
                <p className="text-sm text-muted-foreground">
                  Search and select a product from our catalog
                </p>
                {/* This would integrate with a product search component */}
                <div className="mt-2 p-3 border rounded-md bg-muted">
                  <p className="text-sm">Product search coming soon...</p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="target-price">Target Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="target-price"
                    type="number"
                    step="0.01"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createAlert}
                  disabled={!selectedProduct || !targetPrice}
                >
                  Create Alert
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No price alerts yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first price alert to get notified of great deals
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Bell className="mr-2 h-4 w-4" />
              Create Your First Alert
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const priceStatus = getPriceStatus(alert.product.priceCents, alert.targetPrice);
            const StatusIcon = priceStatus.icon;
            
            return (
              <Card key={alert.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    {alert.product.imageUrl && (
                      <div className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                        <img
                          src={alert.product.imageUrl}
                          alt={alert.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-medium">{alert.product.name}</h3>
                      {alert.product.brand && (
                        <p className="text-sm text-muted-foreground">{alert.product.brand}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm">
                          Current: {formatPrice(alert.product.priceCents, alert.product.currency)}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm">
                          Target: {formatPrice(alert.targetPrice, alert.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <StatusIcon className={`h-4 w-4 ${priceStatus.color}`} />
                      <Badge 
                        variant={priceStatus.status === 'triggered' ? 'default' : 'secondary'}
                        className={priceStatus.status === 'triggered' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {priceStatus.status === 'triggered' && 'Price Hit!'}
                        {priceStatus.status === 'close' && 'Close'}
                        {priceStatus.status === 'waiting' && 'Waiting'}
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(alert.product.url, '_blank')}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAlert(alert.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            How Price Tracking Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div>
              <h4 className="font-medium">Set Your Target Price</h4>
              <p className="text-sm text-muted-foreground">
                Choose the maximum price you're willing to pay for an item
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div>
              <h4 className="font-medium">We Monitor Prices</h4>
              <p className="text-sm text-muted-foreground">
                Our system checks prices regularly across multiple retailers
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              3
            </div>
            <div>
              <h4 className="font-medium">Get Instant Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Receive alerts when prices drop to or below your target
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
