import vehiclesRaw from './merged_output.json';

export type SpecValue = string | number | boolean | null;

export type RawSpecItem = {
  name: string;
  value: SpecValue;
};

export type RawCategory = {
  name: string;
  items?: RawSpecItem[];
};

export type RawVehicle = {
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

export type ComparisonSlot = {
  id: string;
  label: string;
  brand: string | null;
  model: string | null;
  version: string | null;
};

export type RadarMetric = {
  key: string;
  label: string;
  value: number;
};

export type ComparisonRow = {
  label: string;
  values: string[];
};

const KEY_SPECS = [
  'Potência',
  'Torque',
  'Economia de Combustível',
  'Consumo Urbano — Diesel',
  'Consumo Rodoviário — Diesel',
  'CO₂ (g/km) - Gasolina/Diesel',
  'Airbag (cada)',
  'Multimedia polegadas',
  'Câmera 360 graus',
  'Piloto Automático Adaptativo',
  'AEB (Autonomous Emergency Brake)',
  'Tração integral (AWD)',
];

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

function filterByCategory(category?: string | null) {
  if (!category) return vehicles;

  return vehicles.filter(
    (vehicle) => normalize(vehicle.vehicleCategory ?? '') === normalize(category)
  );
}

export function getVehicleCategories() {
  return Array.from(
    new Set(
      vehicles
        .map((vehicle) => vehicle.vehicleCategory)
        .filter((category): category is string => Boolean(category))
    )
  ).sort();
}

export function getBrands(category?: string | null) {
  return Array.from(new Set(filterByCategory(category).map((vehicle) => vehicle.brand))).sort();
}

export function getModels(brand: string, category?: string | null) {
  return Array.from(
    new Set(
      filterByCategory(category)
        .filter((vehicle) => normalize(vehicle.brand) === normalize(brand))
        .map((vehicle) => vehicle.model)
    )
  ).sort();
}

export function getVersions(brand: string, model: string, category?: string | null) {
  return Array.from(
    new Set(
      filterByCategory(category)
        .filter(
          (vehicle) =>
            normalize(vehicle.brand) === normalize(brand) &&
            normalize(vehicle.model) === normalize(model)
        )
        .map((vehicle) => vehicle.version)
    )
  ).sort();
}

export function findVariant({ brand, model, version }: VehicleSearchParams) {
  return (
    vehicles.find(
      (vehicle) =>
        normalize(vehicle.brand) === normalize(brand) &&
        normalize(vehicle.model) === normalize(model) &&
        normalize(vehicle.version) === normalize(version)
    ) ?? null
  );
}

export function displaySpecValue(value: SpecValue | undefined) {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';

  return String(value);
}

function isAvailable(value: SpecValue) {
  if (typeof value === 'boolean') return value;

  return value !== null && value !== undefined && value !== '';
}

function findSpec(vehicle: Vehicle, specName: string) {
  for (const category of vehicle.categories) {
    const spec = category.specs.find((item) => normalize(item.name) === normalize(specName));

    if (spec) return spec;
  }

  return null;
}

function specNumber(vehicle: Vehicle, specName: string) {
  const value = findSpec(vehicle, specName)?.value;

  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function maxSpec(specName: string) {
  return Math.max(...vehicles.map((vehicle) => specNumber(vehicle, specName)), 1);
}

function normalizeNumber(value: number, max: number) {
  return Math.round(Math.min(100, Math.max(0, (value / max) * 100)));
}

function categoryScore(vehicle: Vehicle, categoryNames: string[]) {
  const specs = vehicle.categories
    .filter((category) => categoryNames.includes(category.category))
    .flatMap((category) => category.specs);

  if (specs.length === 0) return 0;

  const availableSpecs = specs.filter((spec) => isAvailable(spec.value)).length;

  return Math.round((availableSpecs / specs.length) * 100);
}

export function getRadarMetrics(vehicle: Vehicle): RadarMetric[] {
  const performance = Math.round(
    (normalizeNumber(specNumber(vehicle, 'Potência'), maxSpec('Potência')) +
      normalizeNumber(specNumber(vehicle, 'Torque'), maxSpec('Torque'))) /
      2
  );

  const efficiency = Math.round(
    (normalizeNumber(specNumber(vehicle, 'Economia de Combustível'), maxSpec('Economia de Combustível')) +
      normalizeNumber(specNumber(vehicle, 'Consumo Rodoviário — Diesel'), maxSpec('Consumo Rodoviário — Diesel'))) /
      2
  );

  return [
    { key: 'performance', label: 'Perf.', value: performance },
    { key: 'efficiency', label: 'Eficiência', value: efficiency },
    { key: 'safety', label: 'Segurança', value: categoryScore(vehicle, ['Safety']) },
    {
      key: 'technology',
      label: 'Tech',
      value: categoryScore(vehicle, ['Connectivity', 'High Tech', 'Ice Line Up']),
    },
    {
      key: 'comfort',
      label: 'Conforto',
      value: categoryScore(vehicle, ['Air Conditioning', 'Seats', 'Trim', 'Sunroof']),
    },
    {
      key: 'utility',
      label: 'Uso',
      value: categoryScore(vehicle, ['4X4', 'Wheels', 'Others']),
    },
  ];
}

export function getComparisonRows(selectedVehicles: Vehicle[]): ComparisonRow[] {
  if (selectedVehicles.length < 2) return [];

  const fixedRows: ComparisonRow[] = [
    {
      label: 'Ano',
      values: selectedVehicles.map((vehicle) => vehicle.year ?? 'N/A'),
    },
    {
      label: 'Categoria',
      values: selectedVehicles.map((vehicle) => vehicle.vehicleCategory ?? 'N/A'),
    },
    {
      label: 'Motor',
      values: selectedVehicles.map((vehicle) => vehicle.engine ?? 'N/A'),
    },
  ];

  const specRows = KEY_SPECS.map((specName) => ({
    label: specName,
    values: selectedVehicles.map((vehicle) => displaySpecValue(findSpec(vehicle, specName)?.value)),
  }));

  return [...fixedRows, ...specRows];
}
