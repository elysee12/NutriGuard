import { useState, useCallback } from 'react';
import { rwandaLocations } from '@/data/rwandaLocations';

interface LocationState {
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
}

export function useRwandaLocations() {
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [sector, setSector] = useState('');
  const [cell, setCell] = useState('');
  const [village, setVillage] = useState('');

  // Get all provinces
  const provinces = rwandaLocations.items.map((p) => p.name);

  // Get districts for selected province
  const districts = province
    ? rwandaLocations.items
        .find((p) => p.name === province)
        ?.districts.map((d) => d.name) || []
    : [];

  // Get sectors for selected district
  const sectors = district && province
    ? rwandaLocations.items
        .find((p) => p.name === province)
        ?.districts.find((d) => d.name === district)
        ?.sectors.map((s) => s.name) || []
    : [];

  // Get cells for selected sector
  const cells = sector && district && province
    ? rwandaLocations.items
        .find((p) => p.name === province)
        ?.districts.find((d) => d.name === district)
        ?.sectors.find((s) => s.name === sector)
        ?.cells.map((c) => c.name) || []
    : [];

  // Get villages for selected cell
  const villages = cell && sector && district && province
    ? rwandaLocations.items
        .find((p) => p.name === province)
        ?.districts.find((d) => d.name === district)
        ?.sectors.find((s) => s.name === sector)
        ?.cells.find((c) => c.name === cell)
        ?.villages || []
    : [];

  const handleProvinceChange = useCallback((newProvince: string) => {
    setProvince(newProvince);
    setDistrict('');
    setSector('');
    setCell('');
    setVillage('');
  }, []);

  const handleDistrictChange = useCallback((newDistrict: string) => {
    setDistrict(newDistrict);
    setSector('');
    setCell('');
    setVillage('');
  }, []);

  const handleSectorChange = useCallback((newSector: string) => {
    setSector(newSector);
    setCell('');
    setVillage('');
  }, []);

  const handleCellChange = useCallback((newCell: string) => {
    setCell(newCell);
    setVillage('');
  }, []);

  const handleVillageChange = useCallback((newVillage: string) => {
    setVillage(newVillage);
  }, []);

  const setLocation = useCallback((newLocation: LocationState) => {
    if (newLocation.province !== undefined) setProvince(newLocation.province);
    if (newLocation.district !== undefined) setDistrict(newLocation.district);
    if (newLocation.sector !== undefined) setSector(newLocation.sector);
    if (newLocation.cell !== undefined) setCell(newLocation.cell);
    if (newLocation.village !== undefined) setVillage(newLocation.village);
  }, []);

  const resetLocation = useCallback(() => {
    setProvince('');
    setDistrict('');
    setSector('');
    setCell('');
    setVillage('');
  }, []);

  return {
    province,
    district,
    sector,
    cell,
    village,
    provinces,
    districts,
    sectors,
    cells,
    villages,
    handleProvinceChange,
    handleDistrictChange,
    handleSectorChange,
    handleCellChange,
    handleVillageChange,
    setLocation,
    resetLocation,
  };
}
