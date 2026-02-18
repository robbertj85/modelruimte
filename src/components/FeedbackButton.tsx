'use client';

import { useState } from 'react';
import { MessageSquarePlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FeedbackType = 'bug' | 'suggestie' | 'vraag';
type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface FeedbackButtonProps {
  variant: 'webapp' | 'dmi' | 'rebel';
}

export default function FeedbackButton({ variant }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<FeedbackType>('bug');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [issueUrl, setIssueUrl] = useState('');

  function resetForm() {
    setTitle('');
    setDescription('');
    setType('bug');
    setFormState('idle');
    setErrorMessage('');
    setIssueUrl('');
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setFormState('error');
      setErrorMessage('Vul alle velden in.');
      return;
    }

    setFormState('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), type }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormState('error');
        setErrorMessage(data.error || 'Er ging iets mis.');
        return;
      }

      setFormState('success');
      setIssueUrl(data.issueUrl);
    } catch {
      setFormState('error');
      setErrorMessage('Kon geen verbinding maken met de server.');
    }
  }

  // Variant-specific trigger button styles
  const triggerButton = (() => {
    switch (variant) {
      case 'webapp':
        return (
          <Button variant="outline" size="sm">
            <MessageSquarePlus size={16} />
            Feedback
          </Button>
        );
      case 'dmi':
        return (
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.3)',
              backgroundColor: 'transparent',
              color: '#ffffff',
              fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            <MessageSquarePlus size={14} />
            Feedback
          </button>
        );
      case 'rebel':
        return (
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0 14px',
              height: '100%',
              backgroundColor: 'transparent',
              color: '#cccccc',
              border: 'none',
              borderRight: '1px solid #666666',
              fontSize: '0.7rem',
              fontFamily: 'Calibri, Arial, sans-serif',
              fontWeight: 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            <MessageSquarePlus size={12} />
            Feedback
          </button>
        );
    }
  })();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Feedback Geven</DialogTitle>
          <DialogDescription>
            Meld een bug, doe een suggestie, of stel een vraag.
          </DialogDescription>
        </DialogHeader>

        {formState === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="size-10 text-green-600" />
            <p className="text-sm font-medium">Bedankt voor je feedback!</p>
            {issueUrl && (
              <a
                href={issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline underline-offset-4"
              >
                Bekijk issue op GitHub
              </a>
            )}
            <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)} className="mt-2">
              Sluiten
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="feedback-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
                <SelectTrigger id="feedback-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="suggestie">Suggestie</SelectItem>
                  <SelectItem value="vraag">Vraag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="feedback-title">Titel</Label>
              <Input
                id="feedback-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Korte omschrijving"
                maxLength={256}
                disabled={formState === 'submitting'}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="feedback-description">Beschrijving</Label>
              <Textarea
                id="feedback-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Geef zoveel mogelijk detail..."
                maxLength={5000}
                rows={4}
                disabled={formState === 'submitting'}
              />
            </div>

            {formState === 'error' && errorMessage && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={formState === 'submitting'}>
                {formState === 'submitting' ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Verzenden...
                  </>
                ) : (
                  'Verzenden'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
