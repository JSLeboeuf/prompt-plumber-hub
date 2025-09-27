export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    // Client statuses
    'active': 'bg-green-100 text-green-800 border-green-200',
    'lead': 'bg-blue-100 text-blue-800 border-blue-200',
    'inactive': 'bg-gray-100 text-gray-800 border-gray-200',
    
    // Intervention statuses
    'planned': 'bg-blue-100 text-blue-800 border-blue-200',
    'in_progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'completed': 'bg-green-100 text-green-800 border-green-200',
    'cancelled': 'bg-red-100 text-red-800 border-red-200',
    'invoiced': 'bg-purple-100 text-purple-800 border-purple-200',
    
    // Call statuses
    'pending': 'bg-orange-100 text-orange-800 border-orange-200',
    'answered': 'bg-green-100 text-green-800 border-green-200',
    'missed': 'bg-red-100 text-red-800 border-red-200',
    
    // Support ticket statuses
    'open': 'bg-red-100 text-red-800 border-red-200',
    'resolved': 'bg-green-100 text-green-800 border-green-200',
    'closed': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  
  return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getPriorityColor = (priority: string): string => {
  const priorityColors: Record<string, string> = {
    'low': 'bg-gray-100 text-gray-800 border-gray-200',
    'normal': 'bg-blue-100 text-blue-800 border-blue-200',
    'high': 'bg-orange-100 text-orange-800 border-orange-200',
    'urgent': 'bg-red-100 text-red-800 border-red-200',
    'P1': 'bg-red-100 text-red-800 border-red-200',
    'P2': 'bg-orange-100 text-orange-800 border-orange-200',
    'P3': 'bg-blue-100 text-blue-800 border-blue-200',
    'P4': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  
  return priorityColors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getIconColor = (status: string): string => {
  const iconColors: Record<string, string> = {
    'active': 'text-green-600',
    'lead': 'text-blue-600',
    'inactive': 'text-gray-600',
    'urgent': 'text-red-600',
    'high': 'text-orange-600',
    'normal': 'text-blue-600',
    'low': 'text-gray-600'
  };
  
  return iconColors[status] || 'text-primary';
};