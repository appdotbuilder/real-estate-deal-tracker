import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, User, Building, Mail, Phone, FileText } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { Contact } from '../../../server/src/schema';
import { ContactForm } from './ContactForm';

interface ContactListProps {
  contacts: Contact[];
  onContactUpdate: () => void;
  dealId: number;
}

export function ContactList({ contacts, onContactUpdate, dealId }: ContactListProps) {
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const handleDeleteContact = async (contactId: number) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await trpc.deleteContact.mutate({ id: contactId });
        onContactUpdate();
      } catch (error) {
        console.error('Failed to delete contact:', error);
      }
    }
  };

  const handleEditSuccess = () => {
    setEditingContact(null);
    onContactUpdate();
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'lawyer':
        return 'bg-blue-100 text-blue-800';
      case 'architect':
        return 'bg-purple-100 text-purple-800';
      case 'banker':
        return 'bg-green-100 text-green-800';
      case 'inspector':
        return 'bg-orange-100 text-orange-800';
      case 'permit officer':
        return 'bg-red-100 text-red-800';
      case 'contractor':
        return 'bg-yellow-100 text-yellow-800';
      case 'real estate agent':
        return 'bg-indigo-100 text-indigo-800';
      case 'appraiser':
        return 'bg-pink-100 text-pink-800';
      case 'insurance agent':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (contacts.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">No contacts yet</p>
        <p className="text-gray-400">Add contacts to coordinate with lawyers, architects, banks, and other professionals</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {contacts.map((contact: Contact) => (
          <Card key={contact.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {contact.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getRoleColor(contact.role)}>
                          {contact.role}
                        </Badge>
                        {contact.organization && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Building className="h-3 w-3" />
                            <span>{contact.organization}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 ml-11">
                    {contact.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <a 
                          href={`mailto:${contact.email}`} 
                          className="hover:text-blue-600 transition-colors"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    
                    {contact.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <a 
                          href={`tel:${contact.phone}`} 
                          className="hover:text-blue-600 transition-colors"
                        >
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    
                    {contact.notes && (
                      <div className="flex items-start space-x-2 text-sm text-gray-600 mt-3">
                        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p className="leading-relaxed">{contact.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    onClick={() => setEditingContact(contact)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteContact(contact.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                Created: {contact.created_at.toLocaleDateString()} • 
                Updated: {contact.updated_at.toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Edit Contact</h2>
            <ContactForm
              propertyDealId={dealId}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingContact(null)}
              initialData={editingContact}
              isEdit={true}
            />
          </div>
        </div>
      )}
    </>
  );
}