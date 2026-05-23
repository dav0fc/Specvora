import schemaDb from './specSchema.json';
import vehiclesDb from './vehicles.json';

export type SpecValue = string | number | boolean | null;

export type SpecDefinition = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean';
};

export type SpecCategory = {
  id: string;
  name: string;
  specs: SpecDefinition[];
};

export type VehicleRecord = {
  id: string;
  baseVehicleId?: string;
  brand: string;
  model: string;
  version: string;
  year?: string | null;
  vehicleCategory?: string | null;
  engine?: string | null;
  specs: Record<string, SpecValue>;
};

export type Vehicle = VehicleRecord;

export type VehicleSearchParams = {
  brand: string;
  model: string;
  version: string;
};

export type VehicleFilters = {
  category?: string | null;
  brand?: string | null;
  model?: string | null;
};

export type VehicleInput = Omit<VehicleRecord, 'id'> & {
  id?: string;
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
  category?: string;
  label: string;
  values: string[];
};

export type AttributeOption = {
  key: string;
  category: string;
  label: string;
};

type SchemaDb = {
  schemaVersion: number;
  categories: SpecCategory[];
};

type VehiclesDb = {
  schemaVersion: number;
  vehicles: VehicleRecord[];
};

const schema = schemaDb as SchemaDb;
const database = vehiclesDb as VehiclesDb;

export const specCategories = schema.categories;
export const vehicleSeed = database.vehicles;

export function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function makeVehicleId(vehicle: Pick<VehicleRecord, 'brand' | 'model' | 'version'>) {
  return `${vehicle.brand}-${vehicle.model}-${vehicle.version}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getSpecKey(category: string, label: string) {
  return `${normalize(category)}::${normalize(label)}`;
}

export function findSpecDefinitionByLabel(label: string) {
  for (const category of specCategories) {
    const spec = category.specs.find((item) => normalize(item.label) === normalize(label));

    if (spec) return spec;
  }

  return null;
}

function resolveVehicle(
  record: VehicleRecord,
  source: VehicleRecord[],
  resolvingIds: Set<string>
): Vehicle {
  if (!record.baseVehicleId) {
    return {
      ...record,
      specs: {
        ...record.specs,
      },
    };
  }

  if (resolvingIds.has(record.id)) {
    throw new Error(`Referência circular encontrada no veículo ${record.id}.`);
  }

  const baseVehicle = source.find((item) => item.id === record.baseVehicleId);

  if (!baseVehicle) {
    return {
      ...record,
      specs: {
        ...record.specs,
      },
    };
  }

  resolvingIds.add(record.id);

  const resolvedBase = resolveVehicle(baseVehicle, source, resolvingIds);

  resolvingIds.delete(record.id);

  return {
    ...record,
    specs: {
      ...resolvedBase.specs,
      ...record.specs,
    },
  };
}

export function resolveVehicles(source: VehicleRecord[] = vehicleSeed): Vehicle[] {
  return source.map((vehicle) => resolveVehicle(vehicle, source, new Set<string>()));
}

export const vehicles = resolveVehicles();

function filterVehicles(source: Vehicle[], filters?: VehicleFilters) {
  return source.filter((vehicle) => {
    if (filters?.category && normalize(vehicle.vehicleCategory ?? '') !== normalize(filters.category)) {
      return false;
    }

    if (filters?.brand && normalize(vehicle.brand) !== normalize(filters.brand)) {
      return false;
    }

    if (filters?.model && normalize(vehicle.model) !== normalize(filters.model)) {
      return false;
    }

    return true;
  });
}

export function getVehicleCategories(source: Vehicle[] = vehicles) {
  return Array.from(
    new Set(
      source
        .map((vehicle) => vehicle.vehicleCategory)
        .filter((category): category is string => Boolean(category))
    )
  ).sort();
}

export function getBrands(category?: string | null, source: Vehicle[] = vehicles) {
  return Array.from(
    new Set(filterVehicles(source, { category }).map((vehicle) => vehicle.brand))
  ).sort();
}

export function getModels(
  brand: string,
  category?: string | null,
  source: Vehicle[] = vehicles
) {
  return Array.from(
    new Set(
      filterVehicles(source, { category, brand }).map((vehicle) => vehicle.model)
    )
  ).sort();
}

export function getVersions(
  brand: string,
  model: string,
  category?: string | null,
  source: Vehicle[] = vehicles
) {
  return Array.from(
    new Set(
      filterVehicles(source, { category, brand, model }).map((vehicle) => vehicle.version)
    )
  ).sort();
}

export function findVariant(
  { brand, model, version }: VehicleSearchParams,
  source: Vehicle[] = vehicles
) {
  return (
    source.find(
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

export function getAttributeOptions(): AttributeOption[] {
  return specCategories.flatMap((category) =>
    category.specs.map((spec) => ({
      key: spec.key,
      category: category.name,
      label: spec.label,
    }))
  );
}

function hasAvailableValue(value: SpecValue | undefined) {
  if (typeof value === 'boolean') return value;

  return value !== null && value !== undefined && value !== '';
}

function getSpecValue(vehicle: Vehicle, specLabel: string) {
  const spec = findSpecDefinitionByLabel(specLabel);

  if (!spec) return null;

  return vehicle.specs[spec.key];
}

function specNumber(vehicle: Vehicle, specLabel: string) {
  const value = getSpecValue(vehicle, specLabel);

  if (typeof value === 'number') return value;

  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function maxSpec(specLabel: string) {
  return Math.max(...vehicles.map((vehicle) => specNumber(vehicle, specLabel)), 1);
}

function normalizeNumber(value: number, max: number) {
  return Math.round(Math.min(100, Math.max(0, (value / max) * 100)));
}

function categoryScore(vehicle: Vehicle, categoryNames: string[]) {
  const categoryKeys = specCategories
    .filter((category) => categoryNames.includes(category.name))
    .flatMap((category) => category.specs.map((spec) => spec.key));

  if (categoryKeys.length === 0) return 0;

  const availableSpecs = categoryKeys.filter((key) => hasAvailableValue(vehicle.specs[key])).length;

  return Math.round((availableSpecs / categoryKeys.length) * 100);
}

export function getRadarMetrics(vehicle: Vehicle): RadarMetric[] {
  const performance = Math.round(
    (normalizeNumber(specNumber(vehicle, 'Potência'), maxSpec('Potência')) +
      normalizeNumber(specNumber(vehicle, 'Torque'), maxSpec('Torque'))) /
      2
  );

  const efficiency = Math.round(
    (normalizeNumber(
      specNumber(vehicle, 'Economia de Combustível'),
      maxSpec('Economia de Combustível')
    ) +
      normalizeNumber(
        specNumber(vehicle, 'Consumo Rodoviário — Diesel'),
        maxSpec('Consumo Rodoviário — Diesel')
      )) /
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

export function getComparisonRows(
  selectedVehicles: Vehicle[],
  selectedAttributeKeys: string[] = []
): ComparisonRow[] {
  if (selectedVehicles.length < 2) return [];

  const selectedKeySet = new Set(selectedAttributeKeys);

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

  const specRows = specCategories.flatMap((category) =>
    category.specs
      .filter((spec) => selectedKeySet.size === 0 || selectedKeySet.has(spec.key))
      .map((spec) => ({
        category: category.name,
        label: spec.label,
        values: selectedVehicles.map((vehicle) => displaySpecValue(vehicle.specs[spec.key])),
      }))
  );

  return [...fixedRows, ...specRows];
}
