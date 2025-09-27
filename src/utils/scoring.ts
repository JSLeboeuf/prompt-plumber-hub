interface Client {
  service_history?: any[];
  email?: string;
  phone?: string;
  notes?: string;
  status: string;
}

export const calculateClientScore = (client: Client): number => {
  let score = 50; // Base score
  
  // Service history scoring
  const historyLength = client.service_history?.length || 0;
  if (historyLength > 5) score += 30;
  else if (historyLength > 2) score += 20;
  else if (historyLength > 0) score += 10;
  
  // Contact information completeness
  if (client.email && client.phone) score += 10;
  
  // Additional information
  if (client.notes) score += 5;
  
  // Status bonus
  if (client.status === 'active') score += 15;
  
  return Math.min(100, score);
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
};

export const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Chaud';
  if (score >= 60) return 'Tiède';
  return 'Froid';
};