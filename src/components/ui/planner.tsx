'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Download } from 'lucide-react';

interface PlannerProps {
  userId: string;
}

interface EventRow {
  id: string;
  title: string;
  date: string;
  location?: string;
  dressCode?: string;
}

export function Planner({ userId }: PlannerProps) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', location: '', dressCode: '' });

  useEffect(() => {
    load();
  }, [userId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/planner/events?userId=${userId}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    if (!form.title || !form.date) return;
    setLoading(true);
    try {
      const res = await fetch('/api/planner/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...form })
      });
      if (!res.ok) throw new Error('Failed');
      setForm({ title: '', date: '', location: '', dressCode: '' });
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Planner</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Team offsite" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="San Francisco" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dress">Dress Code</Label>
              <Input id="dress" value={form.dressCode} onChange={(e) => setForm(f => ({ ...f, dressCode: e.target.value }))} placeholder="Business casual" />
            </div>
          </div>
          <Button onClick={create} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" /> Add Event
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-gray-600">No events yet. Add one above.</p>
          ) : (
            <div className="space-y-2">
              {events.map((e) => (
                <div key={e.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-xs text-gray-500">{new Date(e.date).toDateString()} {e.location ? `• ${e.location}` : ''}</p>
                  </div>
                  {e.dressCode && <Badge variant="outline">{e.dressCode}</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <a href={`/api/planner/export?userId=${userId}`}>
            <Download className="h-4 w-4 mr-2" /> Download ICS
          </a>
        </Button>
      </div>
    </div>
  );
}
