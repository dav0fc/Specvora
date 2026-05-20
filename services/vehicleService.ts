import {
  BRANDS,
  findVariant,
  getModels,
  getVersions,
  Vehicle,
  VehicleSearchParams,
} from '../data/vehicles';

/**
 * Deixe vazio enquanto estiver usando o JSON mockado.
 *
 * Quando o back-end estiver rodando, você pode trocar para:
 * const API_BASE_URL = 'http://SEU_IP_LOCAL:8080';
 *
 * No Android Emulator, localhost do computador costuma ser:
 * http://10.0.2.2:8080
 */
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

export async function listBrands() {
  // Mantém comportamento assíncrono para simular API e facilitar troca futura.
  return BRANDS;
}

export async function listModels(brand: string) {
  return getModels(brand);
}

export async function listVersions(brand: string, model: string) {
  return getVersions(brand, model);
}

export async function findVehicle(params: VehicleSearchParams): Promise<Vehicle | null> {
  try {
    const vehicleFromApi = await request<Vehicle>('/vehicles/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (vehicleFromApi) return vehicleFromApi;
  } catch {
    // Em sala, é melhor o app continuar funcionando com a base mockada.
    // Quando a API estiver estável, você pode mostrar o erro para o usuário.
  }

  return findVariant(params);
}
