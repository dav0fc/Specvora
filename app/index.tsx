import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Dropdown } from '../components/Dropdown';
import {
  findVehicle,
  listBrands,
  listModels,
  listVersions,
} from '../services/vehicleService';

export default function SearchScreen() {
  const router = useRouter();

  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [versions, setVersions] = useState<string[]>([]);

  const [brand, setBrand] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canSearch = useMemo(
    () => Boolean(brand && model && version && !loading),
    [brand, model, version, loading]
  );

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        setBrands(await listBrands());
      } catch {
        setError('Não foi possível carregar os dados dos veículos.');
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  async function handleBrandSelect(selectedBrand: string) {
    setBrand(selectedBrand);
    setModel(null);
    setVersion(null);
    setVersions([]);
    setError(null);
    setModels(await listModels(selectedBrand));
  }

  async function handleModelSelect(selectedModel: string) {
    if (!brand) return;

    setModel(selectedModel);
    setVersion(null);
    setError(null);
    setVersions(await listVersions(brand, selectedModel));
  }

  async function handleSearch() {
    if (!brand || !model || !version) {
      setError('Selecione marca, modelo e versão para continuar.');
      return;
    }

    const vehicle = await findVehicle({ brand, model, version });

    if (!vehicle) {
      setError('Veículo não encontrado na base de dados.');
      return;
    }

    router.push({
      pathname: '/details',
      params: { brand, model, version },
    });
  }

  return (
    <ScrollView className="flex-1 bg-[#0b1f3a]">
      <View className="px-6 pb-10 pt-14">
        <View className="mb-8">
          <Text className="text-sm font-semibold uppercase tracking-[3px] text-[#8fb3ff]">
            Specvora
          </Text>

          <Text className="mt-2 text-3xl font-bold text-white">
            Inteligência competitiva automotiva
          </Text>

          <Text className="mt-3 text-base leading-6 text-[#c7d2fe]">
            Consulte versões de veículos, visualize especificações técnicas e
            apoie decisões de produto com dados organizados.
          </Text>
        </View>

        <View className="mb-6 rounded-3xl border border-[#1d4ed8] bg-[#102a4c] p-5">
          <Text className="mb-4 text-lg font-bold text-white">
            Buscar veículo
          </Text>

          {loading ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#60a5fa" />
              <Text className="mt-3 text-sm text-[#c7d2fe]">
                Carregando base de veículos...
              </Text>
            </View>
          ) : (
            <>
              <Dropdown
                label="Marca"
                value={brand}
                options={brands}
                onSelect={handleBrandSelect}
              />

              <Dropdown
                label="Modelo"
                value={model}
                options={models}
                onSelect={handleModelSelect}
                disabled={!brand}
              />

              <Dropdown
                label="Versão"
                value={version}
                options={versions}
                onSelect={(selectedVersion) => {
                  setVersion(selectedVersion);
                  setError(null);
                }}
                disabled={!model}
              />

              {error && (
                <Text className="mb-4 rounded-xl bg-[#3b0d1d] px-4 py-3 text-sm text-[#fecdd3]">
                  {error}
                </Text>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={!canSearch}
                onPress={handleSearch}
                className={`mt-2 rounded-2xl px-5 py-4 ${
                  canSearch ? 'bg-[#2563eb]' : 'bg-[#334155]'
                }`}
              >
                <Text className="text-center text-base font-bold uppercase tracking-[2px] text-white">
                  Ver análise
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View className="rounded-3xl border border-[#1e3a8a] bg-[#0f172a] p-5">
          <Text className="text-base font-bold text-white">
            Valor para a Ford
          </Text>
          <Text className="mt-2 text-sm leading-6 text-[#cbd5e1]">
            O app transforma uma base técnica em uma experiência simples para
            analistas compararem versões, identificarem recursos disponíveis e
            entenderem diferenças de produto com mais velocidade.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
