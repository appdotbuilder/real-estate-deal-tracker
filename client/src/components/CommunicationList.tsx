import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Calendar, MessageSquare, Phone, Mail, Video, FileText } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Communication } from '../../../server/src/schema';
import { CommunicationForm } from '@/components/CommunicationForm';

interface CommunicationListProps {
  communications: Communication[];
  onCommunicationUpdate: () => void;
  dealId: number;
}

export function CommunicationList({ communications, onCommunicationUpdate, dealId }: CommunicationListProps) {
  const [editingCommunication, setEditingCommunication] = useState<Communication | null>(null);

  const handleDeleteCommunication = async (communicationId: number) => {
    if (window.confirm('Are you sure you want to delete this communication?')) {
      try {
        await trpc.deleteCommunication.mutate({ id: communicationId });
        onCommunicationUpdate();
      } catch (error) {
        console.error('Failed to delete communication:', error);
      }
    }
  };

  const handleEditSuccess = () => {
    setEditingCommunication(null);
    onCommunicationUpdate();
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'phone call':
        return <Phone className="h-4 w-4" />;
      case 'video call':
        return <Video className="h-4 w-4" />;
      case 'meeting note':
        return <FileText className="h-4 w-4" />;
      case 'text message':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'phone call':
        return 'bg-green-100 text-green-800';
      case 'video call':
        return 'bg-purple-100 text-purple-800';
      case 'meeting note':
        return 'bg-orange-100 text-orange-800';
      case 'text message':
        return 'bg-indigo-100 text-indigo-800';
      case 'letter':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const sortedCommunications = [...communications].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (communications.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">No communications yet</p>
        <p className="text-gray-400">Add your first communication to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {sortedCommunications.map((communication: Communication) => (
          <Card key={communication.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(communication.type)}
                      <h4 className="font-medium text-gray-900">{communication.subject}</h4>
                    </div>
                    <Badge className={getTypeColor(communication.type)}>
                      {communication.type}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">{communication.notes}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {communication.date.toLocaleDateString()} at {communication.date.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingCommunication(communication)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteCommunication(communication.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Communication Modal */}
      {editingCommunication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Communication</h2>
            <CommunicationForm
              propertyDealId={dealId}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingCommunication(null)}
              initialData={editingCommunication}
              isEdit={true}
              communicationId={editingCommunication.id}
            />
          </div>
        </div>
      )}
    </>
  );
}