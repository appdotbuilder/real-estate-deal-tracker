import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { CreateDocumentInput } from '../../../server/src/schema';

interface DocumentFormProps {
  propertyDealId: number;
  onSuccess: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreateDocumentInput>;
  isEdit?: boolean;
  documentId?: number;
}

export function DocumentForm({ 
  propertyDealId,
  onSuccess, 
  onCancel, 
  isLoading = false, 
  initialData,
  isEdit = false,
  documentId
}: DocumentFormProps) {
  const [formData, setFormData] = useState<CreateDocumentInput>({
    property_deal_id: propertyDealId,
    name: initialData?.name || '',
    type: initialData?.type || 'Contract',
    file_path: initialData?.file_path || null
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (isEdit && documentId) {
        await trpc.updateDocument.mutate({
          id: documentId,
          ...formData
        });
      } else {
        await trpc.createDocument.mutate(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save document:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const documentTypes = [
    { value: 'Contract', label: 'Contract' },
    { value: 'Report', label: 'Report' },
    { value: 'Financial', label: 'Financial Document' },
    { value: 'Legal', label: 'Legal Document' },
    { value: 'Inspection', label: 'Inspection Report' },
    { value: 'Insurance', label: 'Insurance Document' },
    { value: 'Permit', label: 'Permit/License' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Document Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateDocumentInput) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter document name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Document Type *</Label>
        <Select 
          value={formData.type || 'Contract'} 
          onValueChange={(value: string) =>
            setFormData((prev: CreateDocumentInput) => ({ ...prev, type: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file_path">File Path (optional)</Label>
        <Input
          id="file_path"
          value={formData.file_path || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateDocumentInput) => ({ 
              ...prev, 
              file_path: e.target.value || null 
            }))
          }
          placeholder="Enter file path or URL"
        />
        <p className="text-xs text-gray-500">
          Note: File upload functionality would require additional backend implementation
        </p>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="submit"
          disabled={submitting || isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {submitting ? 'Saving...' : (isEdit ? 'Update Document' : 'Create Document')}
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