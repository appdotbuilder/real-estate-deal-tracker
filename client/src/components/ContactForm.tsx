import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { CreateContactInput, Contact } from '../../../server/src/schema';

interface ContactFormProps {
  propertyDealId: number;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Contact;
  isEdit?: boolean;
}

const CONTACT_ROLES = [
  'Lawyer',
  'Architect', 
  'Banker',
  'Inspector',
  'Permit Officer',
  'Contractor',
  'Real Estate Agent',
  'Appraiser',
  'Insurance Agent',
  'Other'
];

export function ContactForm({ propertyDealId, onSuccess, onCancel, initialData, isEdit = false }: ContactFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateContactInput>({
    property_deal_id: propertyDealId,
    name: initialData?.name || '',
    role: initialData?.role || '',
    organization: initialData?.organization || null,
    email: initialData?.email || null,
    phone: initialData?.phone || null,
    notes: initialData?.notes || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEdit && initialData) {
        await trpc.updateContact.mutate({
          id: initialData.id,
          name: formData.name,
          role: formData.role,
          organization: formData.organization,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes,
        });
      } else {
        await trpc.createContact.mutate(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateContactInput) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Contact full name"
          required
        />
      </div>

      <div>
        <Label htmlFor="role">Role *</Label>
        <Select
          value={formData.role}
          onValueChange={(value) =>
            setFormData((prev: CreateContactInput) => ({ ...prev, role: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select contact role" />
          </SelectTrigger>
          <SelectContent>
            {CONTACT_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="organization">Organization</Label>
        <Input
          id="organization"
          value={formData.organization || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateContactInput) => ({ 
              ...prev, 
              organization: e.target.value || null 
            }))
          }
          placeholder="Company or organization name"
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateContactInput) => ({ 
              ...prev, 
              email: e.target.value || null 
            }))
          }
          placeholder="contact@example.com"
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateContactInput) => ({ 
              ...prev, 
              phone: e.target.value || null 
            }))
          }
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateContactInput) => ({ 
              ...prev, 
              notes: e.target.value || null 
            }))
          }
          placeholder="Additional notes about this contact..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Update Contact' : 'Create Contact'}
        </Button>
      </div>
    </form>
  );
}