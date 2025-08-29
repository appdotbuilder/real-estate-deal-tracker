import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Task } from '../../../server/src/schema';
import { TaskForm } from '@/components/TaskForm';

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: () => void;
  dealId: number;
}

export function TaskList({ tasks, onTaskUpdate, dealId }: TaskListProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await trpc.deleteTask.mutate({ id: taskId });
        onTaskUpdate();
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleEditSuccess = () => {
    setEditingTask(null);
    onTaskUpdate();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'to do':
        return 'bg-gray-100 text-gray-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate: Date, status: string) => {
    const today = new Date();
    return new Date(dueDate) < today && status.toLowerCase() !== 'completed';
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    // Sort by status (completed last), then by due date
    if (a.status.toLowerCase() === 'completed' && b.status.toLowerCase() !== 'completed') return 1;
    if (a.status.toLowerCase() !== 'completed' && b.status.toLowerCase() === 'completed') return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">No tasks yet</p>
        <p className="text-gray-400">Add your first task to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {sortedTasks.map((task: Task) => (
          <Card key={task.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{task.name}</h4>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                    {isOverdue(task.due_date, task.status) && (
                      <Badge variant="destructive" className="flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Overdue</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {task.due_date.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingTask(task)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteTask(task.id)}
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

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Task</h2>
            <TaskForm
              propertyDealId={dealId}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingTask(null)}
              initialData={editingTask}
              isEdit={true}
              taskId={editingTask.id}
            />
          </div>
        </div>
      )}
    </>
  );
}