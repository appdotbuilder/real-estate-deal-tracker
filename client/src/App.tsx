import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Plus, Building2, FileText, MessageSquare, CheckSquare2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { PropertyDeal } from '../../server/src/schema';
import { PropertyDealForm } from '@/components/PropertyDealForm';
import { PropertyDealDetail } from '@/components/PropertyDealDetail';

function App() {
  const [propertyDeals, setPropertyDeals] = useState<PropertyDeal[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading] = useState(false);

  const loadPropertyDeals = useCallback(async () => {
    try {
      const result = await trpc.getPropertyDeals.query();
      setPropertyDeals(result);
    } catch (error) {
      console.error('Failed to load property deals:', error);
    }
  }, []);

  useEffect(() => {
    loadPropertyDeals();
  }, [loadPropertyDeals]);

  const handleCreateSuccess = useCallback(() => {
    setShowCreateForm(false);
    loadPropertyDeals();
  }, [loadPropertyDeals]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    }
  };

  if (selectedDealId) {
    return (
      <PropertyDealDetail
        dealId={selectedDealId}
        onBack={() => setSelectedDealId(null)}
        onDealUpdate={loadPropertyDeals}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Real Estate Management</h1>
                <p className="text-gray-600">Track and manage your property deals lifecycle</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Property Deal
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{propertyDeals.length}</div>
              <p className="text-xs text-muted-foreground">
                Property deals in pipeline
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
              <CheckSquare2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {propertyDeals.filter(deal => deal.status.toLowerCase() === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed Deals</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {propertyDeals.filter(deal => deal.status.toLowerCase() === 'closed').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {propertyDeals.filter(deal => {
                  const dealDate = new Date(deal.created_at);
                  const now = new Date();
                  return dealDate.getMonth() === now.getMonth() && 
                         dealDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                New deals created
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Property Deals List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Property Deals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {propertyDeals.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No property deals yet</p>
                <p className="text-gray-400 mb-4">Create your first property deal to get started</p>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Property Deal
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {propertyDeals.map((deal: PropertyDeal) => (
                  <Card 
                    key={deal.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedDealId(deal.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {deal.name}
                            </h3>
                            <Badge className={getStatusColor(deal.status)}>
                              {deal.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">{deal.address}</p>
                          <p className="text-gray-500 text-sm line-clamp-2">
                            {deal.description}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm text-gray-500">Created</p>
                          <p className="text-sm font-medium">
                            {deal.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Property Deal Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create New Property Deal</h2>
              <PropertyDealForm
                onSuccess={handleCreateSuccess}
                onCancel={() => setShowCreateForm(false)}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;