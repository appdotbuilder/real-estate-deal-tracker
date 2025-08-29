import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Calendar, FileText, ExternalLink } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Document } from '../../../server/src/schema';
import { DocumentForm } from '@/components/DocumentForm';

interface DocumentListProps {
  documents: Document[];
  onDocumentUpdate: () => void;
  dealId: number;
}

export function DocumentList({ documents, onDocumentUpdate, dealId }: DocumentListProps) {
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

  const handleDeleteDocument = async (documentId: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await trpc.deleteDocument.mutate({ id: documentId });
        onDocumentUpdate();
      } catch (error) {
        console.error('Failed to delete document:', error);
      }
    }
  };

  const handleEditSuccess = () => {
    setEditingDocument(null);
    onDocumentUpdate();
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'contract':
        return 'bg-blue-100 text-blue-800';
      case 'report':
        return 'bg-green-100 text-green-800';
      case 'financial':
        return 'bg-yellow-100 text-yellow-800';
      case 'legal':
        return 'bg-red-100 text-red-800';
      case 'inspection':
        return 'bg-purple-100 text-purple-800';
      case 'insurance':
        return 'bg-orange-100 text-orange-800';
      case 'permit':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => 
    new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
  );

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">No documents yet</p>
        <p className="text-gray-400">Add your first document to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {sortedDocuments.map((document: Document) => (
          <Card key={document.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <h4 className="font-medium text-gray-900">{document.name}</h4>
                    <Badge className={getTypeColor(document.type)}>
                      {document.type}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Uploaded: {document.upload_date.toLocaleDateString()}</span>
                    </div>
                  </div>
                  {document.file_path && (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => {
                          if (document.file_path?.startsWith('http')) {
                            window.open(document.file_path, '_blank');
                          } else {
                            // Handle local file path - would need backend implementation
                            console.log('Opening file:', document.file_path);
                          }
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View File
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingDocument(document)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteDocument(document.id)}
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

      {/* Edit Document Modal */}
      {editingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Document</h2>
            <DocumentForm
              propertyDealId={dealId}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingDocument(null)}
              initialData={editingDocument}
              isEdit={true}
              documentId={editingDocument.id}
            />
          </div>
        </div>
      )}
    </>
  );
}