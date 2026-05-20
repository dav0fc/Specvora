import {
  findVariant,
  getBrands,
  getModels,
  getVehicleCategories,
  getVersions,
  Vehicle,
  VehicleSearchParams,
} from '../data/vehicles';

const API_BASE_URL = '';

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

export async function listVehicleCategories() {
  return getVehicleCategories();
}

export async function listBrands(category?: string | null) {
  return getBrands(category);
}

export async function listModels(brand: string, category?: string | null) {
  return getModels(brand, category);
}

export async function listVersions(brand: string, model: string, category?: string | null) {
  return getVersions(brand, model, category);
}

export async function findVehicle(params: VehicleSearchParams): Promise<Vehicle | null> {
  try {
    const vehicleFromApi = await request<Vehicle>('/vehicles/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (vehicleFromApi) return vehicleFromApi;
  } catch {
    return findVariant(params);
  }

  return findVariant(params);
}
