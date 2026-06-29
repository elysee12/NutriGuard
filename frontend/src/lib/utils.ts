import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

interface UserWithHealthCenter {
  role: string;
  name: string;
  village?: string | null;
  healthCenter?: {
    name: string;
    location?: string;
  } | null;
}

export function formatSubmittedBy(user: UserWithHealthCenter): string {
  if (user.role === 'NURSE') {
    return `Nurse: ${user.healthCenter?.name || 'Unknown Health Center'}`;
  } else { // CHW
    return `Community Health Worker (CHW): ${user.village || user.name}`;
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatChildId(id: number): string {
  if (id < 10) return `CH00${id}`;
  if (id < 100) return `CH0${id}`;
  return `CH${id}`;
}

/**
 * Filters an array of assessments to only keep the most recent one per child
 * @param assessments Array of assessments
 * @returns Filtered array with only the latest assessment per child
 */
export function getLatestPerChild<T extends { child: { id: number }; date: string }>(
  assessments: T[]
): T[] {
  const latestMap = new Map<number, T>();
  
  for (const assessment of assessments) {
    const childId = assessment.child.id;
    const existing = latestMap.get(childId);
    
    if (!existing || new Date(assessment.date) > new Date(existing.date)) {
      latestMap.set(childId, assessment);
    }
  }
  
  return Array.from(latestMap.values());
}

/**
 * Groups an array of items by a key and adds rowspan information for table rendering
 * @param items Array of items to group
 * @param getKey Function to get the group key from an item
 * @returns Array of items with isFirst and rowspan properties
 */
export function groupWithRowspan<T>(
  items: T[],
  getKey: (item: T) => string | number
): Array<T & { isFirst: boolean; rowspan: number }> {
  const result: Array<T & { isFirst: boolean; rowspan: number }> = [];
  const keyCounts = new Map<string | number, number>();

  // First pass: count occurrences of each key
  for (const item of items) {
    const key = getKey(item);
    keyCounts.set(key, (keyCounts.get(key) || 0) + 1);
  }

  // Second pass: add isFirst and rowspan properties
  let lastKey: string | number | null = null;
  for (const item of items) {
    const key = getKey(item);
    const isFirst = key !== lastKey;
    result.push({
      ...item,
      isFirst,
      rowspan: keyCounts.get(key) || 1,
    });
    lastKey = key;
  }

  return result;
}
