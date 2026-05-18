// app/details.tsx
import { useState, useMemo } from 'react';
import { View, Text, SectionList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { findVariant, Vehicle, SpecItem } from '../data/vehicles';
import { VehicleCharts } from '../components/VehicleCharts';

function displayValue(value: string | boolean | null): string {
  if (value === null || value === '' || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return value.toString();
}

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    brand: string;
    model: string;
    version: string;
    compareBrand?: string;
    compareModel?: string;
    compareVersion?: string;
  }>();

  // Veículo principal (obrigatório)
  const vehicle = useMemo(
    () => findVariant(params.brand, params.model, params.version) ?? null,
    [params.brand, params.model, params.version]
  );

  // Veículo de comparação (opcional)
  const compareVehicle = useMemo(() => {
    if (params.compareBrand && params.compareModel && params.compareVersion) {
      return findVariant(params.compareBrand, params.compareModel, params.compareVersion) ?? null;
    }
    return null;
  }, [params.compareBrand, params.compareModel, params.compareVersion]);

  // Indica se o usuário tentou comparar (para exibir mensagem se não encontrado)
  const comparisonRequested = !!(params.compareBrand && params.compareModel && params.compareVersion);

  const [filter, setFilter] = useState('');

  const sections = useMemo(() => {
    if (!vehicle) return [];
    return vehicle.categories
      .map((cat) => ({
        title: cat.category,
        data: cat.specs.filter((spec) =>
          spec.name.toLowerCase().includes(filter.toLowerCase())
        ),
      }))
      .filter((s) => s.data.length > 0);
  }, [vehicle, filter]);

  if (!vehicle) {
    return (
      <View className="flex-1 bg-[#133a7c] justify-center items-center p-6">
        <Text className="text-[#e0e0e0] text-lg mb-3">Vehicle not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[#e94560] text-base">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SectionList
      className="flex-1 bg-[#133a7c]"
      sections={sections}
      keyExtractor={(item, index) => item.name + index}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View className="p-6 pb-0">
          {/* Botão voltar + resumo do veículo principal */}
          <TouchableOpacity
            className="bg-[#16213e] rounded-2xl border border-[#0f3460] px-7 py-4 mb-4 items-center shadow-lg"
            onPress={() => router.back()}
          >
            <Text className="text-[#a0a0b0] text-xs font-semibold tracking-wider mb-1">
              {vehicle.brand}
            </Text>
            <Text className="text-[#e94560] text-base font-bold text-center">
              {vehicle.model} — {vehicle.version}
            </Text>
          </TouchableOpacity>

          {/* Card do veículo de comparação */}
          {comparisonRequested && (
            <View className="bg-[#16213e] rounded-2xl border border-[#0077b6] px-7 py-4 mb-4 items-center">
              {compareVehicle ? (
                <>
                  <Text className="text-[#a0a0b0] text-xs font-semibold tracking-wider mb-1">
                    {compareVehicle.brand}
                  </Text>
                  <Text className="text-[#0077b6] text-base font-bold text-center">
                    {compareVehicle.model} — {compareVehicle.version}
                  </Text>
                </>
              ) : (
                <Text className="text-[#a0a0b0] text-sm">
                  Comparison vehicle not found
                </Text>
              )}
            </View>
          )}

          {/* Gráficos comparativos (se houver veículo de comparação, ele será usado) */}
          <VehicleCharts vehicle={vehicle} compareVehicle={compareVehicle} />

          <Text className="text-[#e0e0e0] text-lg font-bold mb-4 mt-4">All Specifications</Text>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View className="bg-[#0f3460] rounded-lg px-3.5 py-2 mb-2 mt-1 mx-6">
          <Text className="text-[#e94560] text-xs font-bold tracking-wider uppercase">
            {section.title}
          </Text>
        </View>
      )}
      renderItem={({ item }: { item: SpecItem }) => (
        <View className="bg-[#16213e] rounded-lg border border-[#0f3460] px-4 py-3 mb-2 mx-6 flex-row justify-between items-center">
          <Text className="text-[#a0a0b0] text-sm flex-1 pr-3">{item.name}</Text>
          <Text className="text-[#e0e0e0] text-sm font-semibold text-right">
            {displayValue(item.value)}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <Text className="text-[#606070] text-sm mt-5 text-center">
          No specs match your search.
        </Text>
      }
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
}