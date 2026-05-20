import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { getVehicleStats, SpecItem, Vehicle } from '../data/vehicles';
import { findVehicle } from '../services/vehicleService';

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function displayValue(value: SpecItem['value']) {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

function isAvailable(value: SpecItem['value']) {
  if (typeof value === 'boolean') return value;
  return value !== null && value !== undefined && value !== '';
}

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    brand?: string;
    model?: string;
    version?: string;
  }>();

  const brand = getParam(params.brand);
  const model = getParam(params.model);
  const version = getParam(params.version);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    async function loadVehicle() {
      setLoading(true);
      const result = await findVehicle({ brand, model, version });
      setVehicle(result);
      setLoading(false);
    }

    loadVehicle();
  }, [brand, model, version]);

  const stats = useMemo(() => {
    if (!vehicle) return null;
    return getVehicleStats(vehicle);
  }, [vehicle]);

  const sections = useMemo(() => {
    if (!vehicle) return [];

    const normalizedFilter = filter.trim().toLowerCase();

    return vehicle.categories
      .map((category) => {
        const specs = category.specs.filter((spec) => {
          if (!normalizedFilter) return true;

          return (
            spec.name.toLowerCase().includes(normalizedFilter) ||
            category.category.toLowerCase().includes(normalizedFilter)
          );
        });

        return {
          title: category.category,
          data: specs,
        };
      })
      .filter((section) => section.data.length > 0);
  }, [vehicle, filter]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0b1f3a] px-6">
        <ActivityIndicator color="#60a5fa" />
        <Text className="mt-3 text-base text-[#c7d2fe]">
          Carregando análise...
        </Text>
      </View>
    );
  }

  if (!vehicle || !stats) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0b1f3a] px-6">
        <Text className="mb-4 text-center text-lg font-bold text-white">
          Veículo não encontrado.
        </Text>

        <TouchableOpacity
          className="rounded-2xl bg-[#2563eb] px-6 py-3"
          onPress={() => router.back()}
        >
          <Text className="font-bold text-white">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SectionList
      className="flex-1 bg-[#0b1f3a]"
      sections={sections}
      keyExtractor={(item, index) => `${item.name}-${index}`}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingBottom: 32 }}
      ListHeaderComponent={
        <View className="px-6 pb-4 pt-14">
          <TouchableOpacity
            className="mb-6 self-start rounded-full bg-[#1e293b] px-4 py-2"
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Text className="font-semibold text-[#bfdbfe]">← Voltar</Text>
          </TouchableOpacity>

          <Text className="text-sm font-semibold uppercase tracking-[3px] text-[#8fb3ff]">
            Análise técnica
          </Text>

          <Text className="mt-2 text-3xl font-bold text-white">
            {vehicle.model}
          </Text>

          <Text className="mt-1 text-base text-[#c7d2fe]">
            {vehicle.brand} • {vehicle.version}
          </Text>

          <View className="mt-4 flex-row flex-wrap gap-2">
            {vehicle.year && (
              <Text className="rounded-full bg-[#1e3a8a] px-3 py-1 text-xs font-semibold text-[#dbeafe]">
                Ano {vehicle.year}
              </Text>
            )}

            {vehicle.engine && (
              <Text className="rounded-full bg-[#1e3a8a] px-3 py-1 text-xs font-semibold text-[#dbeafe]">
                Motor {vehicle.engine}
              </Text>
            )}

            {vehicle.vehicleCategory && (
              <Text className="rounded-full bg-[#1e3a8a] px-3 py-1 text-xs font-semibold text-[#dbeafe]">
                {vehicle.vehicleCategory}
              </Text>
            )}
          </View>

          <View className="mt-6 flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-[#102a4c] p-4">
              <Text className="text-2xl font-bold text-white">
                {stats.availableSpecs}
              </Text>
              <Text className="mt-1 text-xs text-[#c7d2fe]">
                recursos disponíveis
              </Text>
            </View>

            <View className="flex-1 rounded-2xl bg-[#102a4c] p-4">
              <Text className="text-2xl font-bold text-white">
                {stats.availabilityPercent}%
              </Text>
              <Text className="mt-1 text-xs text-[#c7d2fe]">
                disponibilidade
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-[#102a4c] p-4">
              <Text className="text-2xl font-bold text-white">
                {stats.totalSpecs}
              </Text>
              <Text className="mt-1 text-xs text-[#c7d2fe]">
                itens analisados
              </Text>
            </View>

            <View className="flex-1 rounded-2xl bg-[#102a4c] p-4">
              <Text className="text-2xl font-bold text-white">
                {stats.totalCategories}
              </Text>
              <Text className="mt-1 text-xs text-[#c7d2fe]">
                categorias
              </Text>
            </View>
          </View>

          <TextInput
            className="mt-6 rounded-2xl border border-[#1d4ed8] bg-[#0f172a] px-4 py-4 text-base text-white"
            placeholder="Filtrar por item ou categoria..."
            placeholderTextColor="#64748b"
            value={filter}
            onChangeText={setFilter}
          />
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View className="mx-6 mb-3 mt-5 rounded-2xl bg-[#1e3a8a] px-4 py-3">
          <Text className="text-sm font-bold uppercase tracking-[2px] text-[#dbeafe]">
            {section.title}
          </Text>
        </View>
      )}
      renderItem={({ item }) => {
        const available = isAvailable(item.value);

        return (
          <View className="mx-6 mb-2 flex-row items-center justify-between rounded-2xl border border-[#1e293b] bg-[#0f172a] px-4 py-4">
            <Text className="flex-1 pr-4 text-sm leading-5 text-[#cbd5e1]">
              {item.name}
            </Text>

            <Text
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                available
                  ? 'bg-[#064e3b] text-[#bbf7d0]'
                  : 'bg-[#3f1d1d] text-[#fecaca]'
              }`}
            >
              {displayValue(item.value)}
            </Text>
          </View>
        );
      }}
      ListEmptyComponent={
        <Text className="mt-8 text-center text-sm text-[#94a3b8]">
          Nenhuma especificação encontrada para esse filtro.
        </Text>
      }
    />
  );
}
