import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { CreateCommunicationInput } from '../../../server/src/schema';

interface CommunicationFormProps {
  propertyDealId: number;
  onSuccess: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreateCommunicationInput>;
  isEdit?: boolean;
  communicationId?: number;
}

export function CommunicationForm({ 
  propertyDealId,
  onSuccess, 
  onCancel, 
  isLoading = false, 
  initialData,
  isEdit = false,
  communicationId
}: CommunicationFormProps) {
  const [formData, setFormData] = useState<CreateCommunicationInput>({
    property_deal_id: propertyDealId,
    date: initialData?.date || new Date(),
    type: initialData?.type || 'Email',
    subject: initialData?.subject || '',
    notes: initialData?.notes || ''
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (isEdit && communicationId) {
        await trpc.updateCommunication.mutate({
          id: communicationId,
          ...formData
        });
      } else {
        await trpc.createCommunication.mutate(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save communication:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const communicationTypes = [
    { value: 'Email', label: 'Email' },
    { value: 'Phone Call', label: 'Phone Call' },
    { value: 'Meeting Note', label: 'Meeting Note' },
    { value: 'Text Message', label: 'Text Message' },
    { value: 'Letter', label: 'Letter' },
    { value: 'Video Call', label: 'Video Call' },
    { value: 'Other', label: 'Other' },
  ];

  // Format date for input[type="datetime-local"]
  const formatDateTimeForInput = (date: Date) => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .slice(0, 16);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Communication Type *</Label>
        <Select 
          value={formData.type || 'Email'} 
          onValueChange={(value: string) =>
            setFormData((prev: CreateCommunicationInput) => ({ ...prev, type: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select communication type" />
          </SelectTrigger>
          <SelectContent>
            {communicationTypes.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date & Time *</Label>
        <Input
          id="date"
          type="datetime-local"
          value={formatDateTimeForInput(formData.date)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateCommunicationInput) => ({ 
              ...prev, 
              date: new Date(e.target.value) 
            }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject *</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateCommunicationInput) => ({ ...prev, subject: e.target.value }))
          }
          placeholder="Enter communication subject"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes *</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateCommunicationInput) => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Enter communication notes or details"
          rows={4}
          required
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="submit"
          disabled={submitting || isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {submitting ? 'Saving...' : (isEdit ? 'Update Communication' : 'Create Communication')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}