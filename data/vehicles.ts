import schemaDb from './specSchema.json';
import vehiclesDb from './vehicles.json';

export type SpecValue = string | number | boolean | null;

export type SpecDefinition = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean';
  unit?: string;
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
  brand?: string | null;
  model?: string | null;
};

export type VehicleInput = Omit<VehicleRecord, 'id'> & {
  id?: string;
};

export type ComparisonSlot = {
  id: string;
  label: string;
  term: string;
  vehicleId: string | null;
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

function validateVehicleIds(source: VehicleRecord[] = vehicleSeed) {
  const seen = new Set<string>();

  for (const vehicle of source) {
    if (seen.has(vehicle.id)) {
      console.warn(
        `[Specvora] ID de veículo duplicado: "${vehicle.id}". Corrija o id em data/vehicles.json.`
      );
    }

    seen.add(vehicle.id);
  }
}

validateVehicleIds();

export function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function makeVehicleId(
  vehicle: Pick<VehicleRecord, 'brand' | 'model' | 'version'> & {
    year?: string | null;
  },
  existingIds: string[] = vehicleSeed.map((record) => record.id)
) {
  const yearSuffix = vehicle.year?.trim() ? `-${vehicle.year.trim()}` : '';
  const base = `${vehicle.brand}-${vehicle.model}-${vehicle.version}${yearSuffix}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  let id = base;
  let suffix = 2;

  while (existingIds.includes(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  return id;
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

export function filterVehicles(source: Vehicle[], filters?: VehicleFilters) {
  return source.filter((vehicle) => {
    if (filters?.brand && normalize(vehicle.brand) !== normalize(filters.brand)) {
      return false;
    }

    if (filters?.model && normalize(vehicle.model) !== normalize(filters.model)) {
      return false;
    }

    return true;
  });
}

export function getBrands(source: Vehicle[] = vehicles) {
  return Array.from(new Set(source.map((vehicle) => vehicle.brand))).sort();
}

export function getModels(brand: string, source: Vehicle[] = vehicles) {
  return Array.from(
    new Set(filterVehicles(source, { brand }).map((vehicle) => vehicle.model))
  ).sort();
}

export function getVersions(brand: string, model: string, source: Vehicle[] = vehicles) {
  return Array.from(
    new Set(
      filterVehicles(source, { brand, model }).map((vehicle) => vehicle.version)
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

export function displaySpecValue(value: SpecValue | undefined, unit?: string) {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';

  if (typeof value === 'number' && unit) {
    const text = Number.isInteger(value) ? value.toFixed(1) : String(value);

    return `${text} ${unit}`;
  }

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

export function stripAccents(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeSearch(value: string) {
  return stripAccents(value.trim().toLowerCase());
}

export function vehicleSearchText(vehicle: Vehicle): string {
  const parts: string[] = [
    vehicle.brand,
    vehicle.model,
    vehicle.version,
    vehicle.year ?? '',
    vehicle.engine ?? '',
  ];

  for (const category of specCategories) {
    for (const spec of category.specs) {
      const value = vehicle.specs[spec.key];

      if (value === true) {
        // Equipamento presente: busca pelo nome do equipamento (ex.: "diesel", "camera 360")
        parts.push(spec.label);
      } else if (typeof value === 'number' || (typeof value === 'string' && value !== '')) {
        // Valor numerico/texto: busca pelo valor (ex.: "1.6", "3.0", "397")
        parts.push(displaySpecValue(value, spec.unit));
      }
    }
  }

  return normalizeSearch(parts.join(' '));
}

function textContains(text: string, token: string): boolean {
  let index = text.indexOf(token);

  while (index !== -1) {
    const previous = index > 0 ? text[index - 1] : '';

    // Antecedido por dígito = parte de outro numero (ex.: "1.5" dentro de "11.5")
    if (!/\d/.test(previous)) return true;

    index = text.indexOf(token, index + 1);
  }

  return false;
}

export function searchVehicles(
  term: string,
  source: Vehicle[] = vehicles,
  excludeIds: string[] = []
): Vehicle[] {
  const search = normalizeSearch(term);

  if (!search) return [];

  const excluded = new Set(excludeIds);
  const tokens = search.split(/\s+/).filter(Boolean);

  return source.filter((vehicle) => {
    if (excluded.has(vehicle.id)) return false;

    const text = vehicleSearchText(vehicle);
    return tokens.every((token) => textContains(text, token));
  });
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

const maxSpecCache = new Map<string, number>();

function maxSpec(specLabel: string) {
  if (!maxSpecCache.has(specLabel)) {
    maxSpecCache.set(
      specLabel,
      Math.max(...vehicles.map((vehicle) => specNumber(vehicle, specLabel)), 1)
    );
  }

  return maxSpecCache.get(specLabel)!;
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
  if (selectedVehicles.length === 0) return [];

  const selectedKeySet = new Set(selectedAttributeKeys);

  const fixedRows: ComparisonRow[] = [
    {
      label: 'Ano',
      values: selectedVehicles.map((vehicle) => vehicle.year ?? 'N/A'),
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
        values: selectedVehicles.map((vehicle) =>
          displaySpecValue(vehicle.specs[spec.key], spec.unit)
        ),
      }))
  );

  return [...fixedRows, ...specRows];
}
