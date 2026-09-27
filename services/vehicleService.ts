import {
  filterVehicles,
  findVariant,
  getBrands,
  getModels,
  getVersions,
  resolveVehicles,
  Vehicle,
  VehicleFilters,
  VehicleRecord,
  VehicleSearchParams,
  vehicleSeed,
} from '../data/vehicles';

const API_BASE_URL = '';

let localVehicles: VehicleRecord[] = JSON.parse(JSON.stringify(vehicleSeed));

async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
  if (!API_BASE_URL) return null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function getLocalVehicles() {
  return resolveVehicles(localVehicles);
}

export async function listVehicles(filters?: VehicleFilters) {
  const vehiclesFromApi = await request<Vehicle[]>('/vehicles');

  const source = vehiclesFromApi ?? getLocalVehicles();

  return filterVehicles(source, filters);
}

export async function listBrands() {
  const source = await listVehicles();

  return getBrands(source);
}

export async function listModels(brand: string) {
  const source = await listVehicles();

  return getModels(brand, source);
}

export async function listVersions(brand: string, model: string) {
  const source = await listVehicles();

  return getVersions(brand, model, source);
}

export async function findVehicle(params: VehicleSearchParams) {
  const vehicleFromApi = await request<Vehicle>('/vehicles/search', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  if (vehicleFromApi) return vehicleFromApi;

  return findVariant(params, getLocalVehicles());
}
