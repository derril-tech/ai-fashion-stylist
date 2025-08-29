"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Edit, Eye, EyeOff, Save, X } from 'lucide-react'

export interface ClothingItem {
  id: string
  title?: string
  brand?: string
  category: string
  colors: string[]
  pattern: string
  fabric: string
  size?: string
  notes?: string
  isPrivate: boolean
  imageUrl: string
}

interface ItemEditorProps {
  item: ClothingItem
  onSave: (updatedItem: ClothingItem) => void
  onCancel: () => void
  className?: string
}

const CATEGORIES = [
  'shirt', 'pants', 'dress', 'skirt', 'jacket', 'coat', 'sweater', 'blouse',
  'jeans', 'shorts', 't-shirt', 'hoodie', 'cardigan', 'blazer', 'suit',
  'shoes', 'boots', 'sneakers', 'heels', 'flats', 'sandals',
  'bag', 'purse', 'backpack', 'handbag', 'clutch',
  'hat', 'cap', 'beanie', 'scarf', 'belt', 'jewelry'
]

const COLORS = [
  'black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 
  'brown', 'gray', 'beige', 'navy', 'olive', 'maroon', 'burgundy', 
  'cream', 'tan', 'khaki', 'coral', 'teal', 'turquoise', 'lavender', 
  'mint', 'gold', 'silver', 'bronze', 'copper'
]

const PATTERNS = [
  'solid', 'striped', 'polka_dot', 'floral', 'geometric', 'plaid', 'checkered',
  'paisley', 'animal_print', 'tie_dye', 'camouflage', 'abstract', 'tribal',
  'chevron', 'herringbone', 'houndstooth', 'gingham', 'tartan', 'argyle'
]

const FABRICS = [
  'cotton', 'polyester', 'wool', 'silk', 'linen', 'denim', 'leather', 'suede',
  'velvet', 'satin', 'chiffon', 'lace', 'mesh', 'fleece', 'cashmere', 'acrylic',
  'nylon', 'spandex', 'rayon', 'viscose', 'jersey', 'tweed', 'corduroy'
]

const SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  '0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20'
]

export function ItemEditor({ item, onSave, onCancel, className }: ItemEditorProps) {
  const [editedItem, setEditedItem] = useState<ClothingItem>({ ...item })
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = () => {
    onSave(editedItem)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setEditedItem({ ...item })
    onCancel()
    setIsOpen(false)
  }

  const addColor = (color: string) => {
    if (!editedItem.colors.includes(color)) {
      setEditedItem(prev => ({
        ...prev,
        colors: [...prev.colors, color]
      }))
    }
  }

  const removeColor = (color: string) => {
    setEditedItem(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== color)
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Clothing Item</DialogTitle>
          <DialogDescription>
            Update the details for this clothing item. Changes will be saved automatically.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Preview */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                src={editedItem.imageUrl}
                alt={editedItem.title || 'Clothing item'}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Privacy Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="privacy" className="text-sm font-medium">
                Private Item
              </Label>
              <Switch
                id="privacy"
                checked={editedItem.isPrivate}
                onCheckedChange={(checked) => 
                  setEditedItem(prev => ({ ...prev, isPrivate: checked }))
                }
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedItem.title || ''}
                onChange={(e) => setEditedItem(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter item title"
              />
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={editedItem.brand || ''}
                onChange={(e) => setEditedItem(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="Enter brand name"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={editedItem.category}
                onValueChange={(value) => setEditedItem(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <Label>Colors</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editedItem.colors.map((color) => (
                  <Badge key={color} variant="secondary" className="flex items-center gap-1">
                    {color}
                    <button
                      onClick={() => removeColor(color)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Select onValueChange={addColor}>
                <SelectTrigger>
                  <SelectValue placeholder="Add color" />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.filter(color => !editedItem.colors.includes(color)).map((color) => (
                    <SelectItem key={color} value={color}>
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pattern */}
            <div className="space-y-2">
              <Label htmlFor="pattern">Pattern</Label>
              <Select
                value={editedItem.pattern}
                onValueChange={(value) => setEditedItem(prev => ({ ...prev, pattern: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  {PATTERNS.map((pattern) => (
                    <SelectItem key={pattern} value={pattern}>
                      {pattern.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fabric */}
            <div className="space-y-2">
              <Label htmlFor="fabric">Fabric</Label>
              <Select
                value={editedItem.fabric}
                onValueChange={(value) => setEditedItem(prev => ({ ...prev, fabric: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fabric" />
                </SelectTrigger>
                <SelectContent>
                  {FABRICS.map((fabric) => (
                    <SelectItem key={fabric} value={fabric}>
                      {fabric.charAt(0).toUpperCase() + fabric.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size */}
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Select
                value={editedItem.size || ''}
                onValueChange={(value) => setEditedItem(prev => ({ ...prev, size: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={editedItem.notes || ''}
                onChange={(e) => setEditedItem(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes about this item"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Compact item display component
export function ItemDisplay({ item }: { item: ClothingItem }) {
  return (
    <Card className="fashion-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{item.title || 'Untitled Item'}</CardTitle>
            <CardDescription className="text-sm">
              {item.brand && `${item.brand} • `}{item.category}
            </CardDescription>
          </div>
          {item.isPrivate && (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-3">
          <img
            src={item.imageUrl}
            alt={item.title || 'Clothing item'}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {item.colors.map((color) => (
              <Badge key={color} variant="outline" className="text-xs">
                {color}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{item.pattern} • {item.fabric}</span>
            {item.size && <span>Size: {item.size}</span>}
          </div>
          
          {item.notes && (
            <p className="text-sm text-muted-foreground">{item.notes}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
