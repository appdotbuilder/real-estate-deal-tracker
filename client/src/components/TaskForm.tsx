import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { CreateTaskInput, Contact } from '../../../server/src/schema';

interface TaskFormProps {
  propertyDealId: number;
  contacts: Contact[];
  onSuccess: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreateTaskInput & { contact_id?: number | null }>;
  isEdit?: boolean;
  taskId?: number;
}

export function TaskForm({ 
  propertyDealId,
  contacts,
  onSuccess, 
  onCancel, 
  isLoading = false, 
  initialData,
  isEdit = false,
  taskId
}: TaskFormProps) {
  const [formData, setFormData] = useState<CreateTaskInput>({
    property_deal_id: propertyDealId,
    contact_id: initialData?.contact_id || null,
    name: initialData?.name || '',
    description: initialData?.description || '',
    due_date: initialData?.due_date || new Date(),
    status: initialData?.status || 'To Do'
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (isEdit && taskId) {
        await trpc.updateTask.mutate({
          id: taskId,
          ...formData
        });
      } else {
        await trpc.createTask.mutate(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'To Do', label: 'To Do' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Blocked', label: 'Blocked' },
  ];

  // Format date for input[type="date"]
  const formatDateForInput = (date: Date) => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Task Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateTaskInput) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter task name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateTaskInput) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Enter task description"
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="due_date">Due Date *</Label>
        <Input
          id="due_date"
          type="date"
          value={formatDateForInput(formData.due_date)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateTaskInput) => ({ 
              ...prev, 
              due_date: new Date(e.target.value) 
            }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select 
          value={formData.status || 'To Do'} 
          onValueChange={(value: string) =>
            setFormData((prev: CreateTaskInput) => ({ ...prev, status: value }))
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
        <Label htmlFor="contact">Assign To Contact</Label>
        <Select 
          value={formData.contact_id?.toString() || 'unassigned'} 
          onValueChange={(value: string) =>
            setFormData((prev: CreateTaskInput) => ({ 
              ...prev, 
              contact_id: value === 'unassigned' ? null : parseInt(value)
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select contact (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {contacts.map((contact) => (
              <SelectItem key={contact.id} value={contact.id.toString()}>
                {contact.name} - {contact.role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="submit"
          disabled={submitting || isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {submitting ? 'Saving...' : (isEdit ? 'Update Task' : 'Create Task')}
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