import vehiclesRaw from './merged_output.json';

// ---------- Tipos do JSON real ----------
interface RawSpecItem {
  name: string;
  value: string | boolean | number | null;
}

interface RawCategory {
  name: string;          // corresponde a "category" no app
  items: RawSpecItem[];  // corresponde a "specs" no app
}

interface RawVehicle {
  brand: string;
  model: string;
  version: string;
  categories: RawCategory[];
  // outros campos como engine, year etc. são ignorados aqui
}

// ---------- Tipos usados pelo app ----------
export type SpecItem = {
  name: string;
  value: string | boolean | null;   // convertemos números para string
};

export type SpecCategory = {
  category: string;
  specs: SpecItem[];
};

export type Vehicle = {
  brand: string;
  model: string;
  version: string;
  categories: SpecCategory[];
};

// ---------- Conversão ----------
function rawToVehicle(raw: RawVehicle): Vehicle {
  return {
    brand: raw.brand,
    model: raw.model,
    version: raw.version,
    categories: raw.categories.map((cat) => ({
      category: cat.name,
      specs: (cat.items || []).map((item) => ({
        name: item.name,
        value: typeof item.value === 'number' ? String(item.value) : item.value,
      })),
    })),
  };
}

// Dados já convertidos
const vehicles: Vehicle[] = (vehiclesRaw as RawVehicle[]).map(rawToVehicle);

// ---------- Funções auxiliares ----------
export const BRANDS = [...new Set(vehicles.map(v => v.brand))].sort();

export const getModels = (brand: string): string[] => {
  return [...new Set(vehicles.filter(v => v.brand === brand).map(v => v.model))].sort();
};

export const getVersions = (brand: string, model: string): string[] => {
  return [...new Set(vehicles.filter(v => v.brand === brand && v.model === model).map(v => v.version))].sort();
};

export const findVariant = (brand: string, model: string, version: string): Vehicle | undefined => {
  return vehicles.find(v => v.brand === brand && v.model === model && v.version === version);
};