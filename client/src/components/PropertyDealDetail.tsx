import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus, 
  CheckSquare2, 
  FileText, 
  MessageSquare,
  Calendar,
  MapPin,
  AlertCircle,
  Users
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { PropertyDeal, Task, Document, Communication, Contact } from '../../../server/src/schema';
import { PropertyDealForm } from '@/components/PropertyDealForm';
import { TaskForm } from '@/components/TaskForm';
import { DocumentForm } from '@/components/DocumentForm';
import { CommunicationForm } from '@/components/CommunicationForm';
import { ContactForm } from '@/components/ContactForm';
import { TaskList } from '@/components/TaskList';
import { DocumentList } from '@/components/DocumentList';
import { CommunicationList } from '@/components/CommunicationList';
import { ContactList } from '@/components/ContactList';

interface PropertyDealDetailProps {
  dealId: number;
  onBack: () => void;
  onDealUpdate: () => void;
}

export function PropertyDealDetail({ dealId, onBack, onDealUpdate }: PropertyDealDetailProps) {
  const [deal, setDeal] = useState<PropertyDeal | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showCommunicationForm, setShowCommunicationForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadDealData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dealData, tasksData, documentsData, communicationsData, contactsData] = await Promise.all([
        trpc.getPropertyDealById.query({ id: dealId }),
        trpc.getTasksByPropertyDeal.query({ property_deal_id: dealId }),
        trpc.getDocumentsByPropertyDeal.query({ property_deal_id: dealId }),
        trpc.getCommunicationsByPropertyDeal.query({ property_deal_id: dealId }),
        trpc.getContactsByPropertyDeal.query({ property_deal_id: dealId })
      ]);
      
      setDeal(dealData);
      setTasks(tasksData);
      setDocuments(documentsData);
      setCommunications(communicationsData);
      setContacts(contactsData);
    } catch (error) {
      console.error('Failed to load deal data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    loadDealData();
  }, [loadDealData]);

  const handleEditSuccess = useCallback(() => {
    setShowEditForm(false);
    loadDealData();
    onDealUpdate();
  }, [loadDealData, onDealUpdate]);

  const handleDeleteDeal = async () => {
    if (window.confirm('Are you sure you want to delete this property deal? This action cannot be undone.')) {
      try {
        await trpc.deletePropertyDeal.mutate({ id: dealId });
        onBack();
        onDealUpdate();
      } catch (error) {
        console.error('Failed to delete property deal:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'on hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const completedTasks = tasks.filter(task => task.status.toLowerCase() === 'completed').length;
  const overdueTasks = tasks.filter(task => {
    const today = new Date();
    const dueDate = new Date(task.due_date);
    return dueDate < today && task.status.toLowerCase() !== 'completed';
  }).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading property deal...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Property deal not found</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to List</span>
            </Button>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowEditForm(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </Button>
              <Button
                onClick={handleDeleteDeal}
                variant="destructive"
                className="flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{deal.name}</h1>
                    <Badge className={getStatusColor(deal.status)}>
                      {deal.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>{deal.address}</span>
                  </div>
                  <p className="text-gray-600">{deal.description}</p>
                </div>
                <div className="text-right ml-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {deal.created_at.toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Updated: {deal.updated_at.toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
                  <div className="text-sm text-gray-600">Total Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{documents.length}</div>
                  <div className="text-sm text-gray-600">Documents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{communications.length}</div>
                  <div className="text-sm text-gray-600">Communications</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{contacts.length}</div>
                  <div className="text-sm text-gray-600">Contacts</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Tasks, Documents, Communications, Contacts */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tasks" className="flex items-center space-x-2">
              <CheckSquare2 className="h-4 w-4" />
              <span>Tasks</span>
              {overdueTasks > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {overdueTasks}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="communications" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Communications</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Contacts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <CheckSquare2 className="h-5 w-5" />
                    <span>Tasks ({tasks.length})</span>
                  </CardTitle>
                  <Button
                    onClick={() => setShowTaskForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TaskList 
                  tasks={tasks} 
                  contacts={contacts}
                  onTaskUpdate={loadDealData}
                  dealId={dealId}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Documents ({documents.length})</span>
                  </CardTitle>
                  <Button
                    onClick={() => setShowDocumentForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DocumentList 
                  documents={documents} 
                  onDocumentUpdate={loadDealData}
                  dealId={dealId}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communications">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Communications ({communications.length})</span>
                  </CardTitle>
                  <Button
                    onClick={() => setShowCommunicationForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Communication
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CommunicationList 
                  communications={communications} 
                  onCommunicationUpdate={loadDealData}
                  dealId={dealId}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Contacts ({contacts.length})</span>
                  </CardTitle>
                  <Button
                    onClick={() => setShowContactForm(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ContactList 
                  contacts={contacts} 
                  onContactUpdate={loadDealData}
                  dealId={dealId}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Property Deal Modal */}
        {showEditForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Edit Property Deal</h2>
              <PropertyDealForm
                onSuccess={handleEditSuccess}
                onCancel={() => setShowEditForm(false)}
                initialData={deal}
                isEdit={true}
                dealId={dealId}
              />
            </div>
          </div>
        )}

        {/* Task Form Modal */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
              <TaskForm
                propertyDealId={dealId}
                contacts={contacts}
                onSuccess={() => {
                  setShowTaskForm(false);
                  loadDealData();
                }}
                onCancel={() => setShowTaskForm(false)}
              />
            </div>
          </div>
        )}

        {/* Document Form Modal */}
        {showDocumentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Add New Document</h2>
              <DocumentForm
                propertyDealId={dealId}
                onSuccess={() => {
                  setShowDocumentForm(false);
                  loadDealData();
                }}
                onCancel={() => setShowDocumentForm(false)}
              />
            </div>
          </div>
        )}

        {/* Communication Form Modal */}
        {showCommunicationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Add New Communication</h2>
              <CommunicationForm
                propertyDealId={dealId}
                onSuccess={() => {
                  setShowCommunicationForm(false);
                  loadDealData();
                }}
                onCancel={() => setShowCommunicationForm(false)}
              />
            </div>
          </div>
        )}

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Add New Contact</h2>
              <ContactForm
                propertyDealId={dealId}
                onSuccess={() => {
                  setShowContactForm(false);
                  loadDealData();
                }}
                onCancel={() => setShowContactForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}