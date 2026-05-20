import vehiclesRaw from './merged_output.json';

export type SpecValue = string | number | boolean | null;

type RawSpecItem = {
  name: string;
  value: SpecValue;
};

type RawCategory = {
  name: string;
  items?: RawSpecItem[];
};

type RawVehicle = {
  brand: string;
  model: string;
  version: string;
  engine?: string;
  year?: string;
  vehicleCategory?: string;
  categories: RawCategory[];
};

export type SpecItem = {
  name: string;
  value: SpecValue;
};

export type SpecCategory = {
  category: string;
  specs: SpecItem[];
};

export type Vehicle = {
  brand: string;
  model: string;
  version: string;
  engine?: string;
  year?: string;
  vehicleCategory?: string;
  categories: SpecCategory[];
};

export type VehicleSearchParams = {
  brand: string;
  model: string;
  version: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function rawToVehicle(raw: RawVehicle): Vehicle {
  return {
    brand: raw.brand,
    model: raw.model,
    version: raw.version,
    engine: raw.engine,
    year: raw.year,
    vehicleCategory: raw.vehicleCategory,
    categories: raw.categories.map((category) => ({
      category: category.name,
      specs: (category.items ?? []).map((item) => ({
        name: item.name,
        value: item.value,
      })),
    })),
  };
}

export const vehicles: Vehicle[] = (vehiclesRaw as RawVehicle[]).map(rawToVehicle);

export const BRANDS = Array.from(new Set(vehicles.map((vehicle) => vehicle.brand))).sort();

export function getModels(brand: string) {
  return Array.from(
    new Set(
      vehicles
        .filter((vehicle) => normalize(vehicle.brand) === normalize(brand))
        .map((vehicle) => vehicle.model)
    )
  ).sort();
}

export function getVersions(brand: string, model: string) {
  return Array.from(
    new Set(
      vehicles
        .filter(
          (vehicle) =>
            normalize(vehicle.brand) === normalize(brand) &&
            normalize(vehicle.model) === normalize(model)
        )
        .map((vehicle) => vehicle.version)
    )
  ).sort();
}

export function findVariant({
  brand,
  model,
  version,
}: VehicleSearchParams): Vehicle | null {
  return (
    vehicles.find(
      (vehicle) =>
        normalize(vehicle.brand) === normalize(brand) &&
        normalize(vehicle.model) === normalize(model) &&
        normalize(vehicle.version) === normalize(version)
    ) ?? null
  );
}

function hasAvailableValue(value: SpecValue) {
  if (typeof value === 'boolean') return value;
  return value !== null && value !== undefined && value !== '';
}

export function getVehicleStats(vehicle: Vehicle) {
  const specs = vehicle.categories.flatMap((category) => category.specs);
  const availableSpecs = specs.filter((spec) => hasAvailableValue(spec.value)).length;
  const totalSpecs = specs.length;

  return {
    totalCategories: vehicle.categories.length,
    totalSpecs,
    availableSpecs,
    availabilityPercent:
      totalSpecs === 0 ? 0 : Math.round((availableSpecs / totalSpecs) * 100),
  };
}
