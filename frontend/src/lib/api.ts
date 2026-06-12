export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface PublicStats {
  totalChildren: number;
  totalHealthWorkers: number;
  detectionRate: string;
}

export const fetchPublicStats = async (): Promise<PublicStats> => {
  const response = await fetch(`${API_URL}/stats/public`);
  if (!response.ok) {
    throw new Error('Failed to fetch public stats');
  }
  return response.json();
};
