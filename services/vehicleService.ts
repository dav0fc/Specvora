import {
  findVariant,
  getBrands,
  getModels,
  getVehicleCategories,
  getVersions,
  makeVehicleId,
  resolveVehicles,
  Vehicle,
  VehicleFilters,
  VehicleInput,
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

  return source.filter((vehicle) => {
    if (filters?.category && vehicle.vehicleCategory !== filters.category) return false;
    if (filters?.brand && vehicle.brand !== filters.brand) return false;
    if (filters?.model && vehicle.model !== filters.model) return false;

    return true;
  });
}

export async function listVehicleCategories() {
  const source = await listVehicles();

  return getVehicleCategories(source);
}

export async function listBrands(category?: string | null) {
  const source = await listVehicles();

  return getBrands(category, source);
}

export async function listModels(brand: string, category?: string | null) {
  const source = await listVehicles();

  return getModels(brand, category, source);
}

export async function listVersions(brand: string, model: string, category?: string | null) {
  const source = await listVehicles();

  return getVersions(brand, model, category, source);
}

export async function findVehicle(params: VehicleSearchParams) {
  const vehicleFromApi = await request<Vehicle>('/vehicles/search', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  if (vehicleFromApi) return vehicleFromApi;

  return findVariant(params, getLocalVehicles());
}

export async function getVehicleById(vehicleId: string) {
  const vehicleFromApi = await request<Vehicle>(`/vehicles/${vehicleId}`);

  if (vehicleFromApi) return vehicleFromApi;

  return getLocalVehicles().find((vehicle) => vehicle.id === vehicleId) ?? null;
}

export async function createVehicle(input: VehicleInput) {
  const createdFromApi = await request<Vehicle>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (createdFromApi) return createdFromApi;

  const id = input.id ?? makeVehicleId(input);
  const newVehicle: VehicleRecord = {
    ...input,
    id,
  };

  localVehicles = [...localVehicles, newVehicle];

  return getVehicleById(id);
}

export async function updateVehicle(vehicleId: string, input: Partial<VehicleInput>) {
  const updatedFromApi = await request<Vehicle>(`/vehicles/${vehicleId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

  if (updatedFromApi) return updatedFromApi;

  localVehicles = localVehicles.map((vehicle) =>
    vehicle.id === vehicleId
      ? {
          ...vehicle,
          ...input,
          id: vehicleId,
          specs: {
            ...vehicle.specs,
            ...(input.specs ?? {}),
          },
        }
      : vehicle
  );

  return getVehicleById(vehicleId);
}

export async function deleteVehicle(vehicleId: string) {
  const deletedFromApi = await request<{ ok: boolean }>(`/vehicles/${vehicleId}`, {
    method: 'DELETE',
  });

  if (deletedFromApi) return deletedFromApi.ok;

  localVehicles = localVehicles.filter((vehicle) => vehicle.id !== vehicleId);

  return true;
}
