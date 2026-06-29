import { Label } from "@/components/ui/label";
import { FaMapMarkerAlt, FaBuilding, FaHome } from "react-icons/fa";
import { Building2, MapPin } from "lucide-react";

interface LocationFieldsProps {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  provinces: string[];
  districts: string[];
  sectors: string[];
  cells: string[];
  villages: string[];
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onSectorChange: (value: string) => void;
  onCellChange: (value: string) => void;
  onVillageChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  showIcons?: boolean;
  className?: string;
}

export function LocationFields({
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
  onProvinceChange,
  onDistrictChange,
  onSectorChange,
  onCellChange,
  onVillageChange,
  required = false,
  disabled = false,
  showIcons = true,
  className = "",
}: LocationFieldsProps) {
  const selectClassName = "flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors";
  const selectWithIconClassName = "flex h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors";

  return (
    <div className={className}>
      {/* Province */}
      <div className="space-y-2">
        <Label className={showIcons ? "flex items-center gap-2" : ""}>
          {showIcons && <MapPin className="h-3.5 w-3.5 text-primary" />}
          Province
        </Label>
        {showIcons ? (
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <select
              className={selectWithIconClassName}
              value={province}
              onChange={(e) => onProvinceChange(e.target.value)}
              required={required}
              disabled={disabled}
            >
              <option value="">Select Province</option>
              {provinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        ) : (
          <select
            className={selectClassName}
            value={province}
            onChange={(e) => onProvinceChange(e.target.value)}
            required={required}
            disabled={disabled}
          >
            <option value="">Select Province</option>
            {provinces.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
      </div>

      {/* District */}
      <div className="space-y-2">
        <Label className={showIcons ? "flex items-center gap-2" : ""}>
          {showIcons && <FaMapMarkerAlt className="h-3.5 w-3.5 text-primary" />}
          District
        </Label>
        {showIcons ? (
          <div className="relative">
            <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <select
              className={selectWithIconClassName}
              value={district}
              onChange={(e) => onDistrictChange(e.target.value)}
              required={required}
              disabled={disabled || !province}
            >
              <option value="">Select District</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        ) : (
          <select
            className={selectClassName}
            value={district}
            onChange={(e) => onDistrictChange(e.target.value)}
            required={required}
            disabled={disabled || !province}
          >
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
      </div>

      {/* Sector */}
      <div className="space-y-2">
        <Label className={showIcons ? "flex items-center gap-2" : ""}>
          {showIcons && <FaBuilding className="h-3.5 w-3.5 text-primary" />}
          Sector
        </Label>
        {showIcons ? (
          <div className="relative">
            <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <select
              className={selectWithIconClassName}
              value={sector}
              onChange={(e) => onSectorChange(e.target.value)}
              required={required}
              disabled={disabled || !district}
            >
              <option value="">Select Sector</option>
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        ) : (
          <select
            className={selectClassName}
            value={sector}
            onChange={(e) => onSectorChange(e.target.value)}
            required={required}
            disabled={disabled || !district}
          >
            <option value="">Select Sector</option>
            {sectors.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {/* Cell */}
      <div className="space-y-2">
        <Label className={showIcons ? "flex items-center gap-2" : ""}>
          {showIcons && <Building2 className="h-3.5 w-3.5 text-primary" />}
          Cell
        </Label>
        {showIcons ? (
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <select
              className={selectWithIconClassName}
              value={cell}
              onChange={(e) => onCellChange(e.target.value)}
              required={required}
              disabled={disabled || !sector}
            >
              <option value="">Select Cell</option>
              {cells.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        ) : (
          <select
            className={selectClassName}
            value={cell}
            onChange={(e) => onCellChange(e.target.value)}
            required={required}
            disabled={disabled || !sector}
          >
            <option value="">Select Cell</option>
            {cells.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Village */}
      <div className="space-y-2">
        <Label className={showIcons ? "flex items-center gap-2" : ""}>
          {showIcons && <FaHome className="h-3.5 w-3.5 text-primary" />}
          Village
        </Label>
        {showIcons ? (
          <div className="relative">
            <FaHome className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <select
              className={selectWithIconClassName}
              value={village}
              onChange={(e) => onVillageChange(e.target.value)}
              required={required}
              disabled={disabled || !cell}
            >
              <option value="">Select Village</option>
              {villages.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        ) : (
          <select
            className={selectClassName}
            value={village}
            onChange={(e) => onVillageChange(e.target.value)}
            required={required}
            disabled={disabled || !cell}
          >
            <option value="">Select Village</option>
            {villages.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
