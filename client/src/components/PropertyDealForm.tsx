import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { CreatePropertyDealInput } from '../../../server/src/schema';

interface PropertyDealFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreatePropertyDealInput>;
  isEdit?: boolean;
  dealId?: number;
}

export function PropertyDealForm({ 
  onSuccess, 
  onCancel, 
  isLoading = false, 
  initialData,
  isEdit = false,
  dealId
}: PropertyDealFormProps) {
  const [formData, setFormData] = useState<CreatePropertyDealInput>({
    name: initialData?.name || '',
    address: initialData?.address || '',
    status: initialData?.status || 'Active',
    description: initialData?.description || ''
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (isEdit && dealId) {
        await trpc.updatePropertyDeal.mutate({
          id: dealId,
          ...formData
        });
      } else {
        await trpc.createPropertyDeal.mutate(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save property deal:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Closed', label: 'Closed' },
    { value: 'On Hold', label: 'On Hold' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Property Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreatePropertyDealInput) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter property name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreatePropertyDealInput) => ({ ...prev, address: e.target.value }))
          }
          placeholder="Enter property address"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select 
          value={formData.status || 'Active'} 
          onValueChange={(value: string) =>
            setFormData((prev: CreatePropertyDealInput) => ({ ...prev, status: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreatePropertyDealInput) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Enter property description"
          rows={3}
          required
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="submit"
          disabled={submitting || isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {submitting ? 'Saving...' : (isEdit ? 'Update Deal' : 'Create Deal')}
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