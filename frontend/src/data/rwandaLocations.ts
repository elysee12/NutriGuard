import rwandaLocationsData from '../assets/rwanda_locations.json';

interface Cell {
  type: string;
  name: string;
  villages: string[];
}

interface Sector {
  type: string;
  name: string;
  cells: Cell[];
}

interface District {
  type: string;
  name: string;
  sectors: Sector[];
}

interface Province {
  type: string;
  name: string;
  districts: District[];
}

export interface LocationData {
  items: Province[];
}

// Map province names to match display names and normalize the data
export const rwandaLocations: LocationData = {
  items: rwandaLocationsData.items.map((province: any) => ({
    ...province,
    // Normalize "Kigali" to "Kigali City" for display
    name: province.name === 'Kigali' ? 'Kigali City' : province.name,
  })),
};
