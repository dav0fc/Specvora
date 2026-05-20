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

import { displaySpecValue, SpecItem, Vehicle } from '../data/vehicles';
import { findVehicle } from '../services/vehicleService';
import { colors } from '../styles/colors';

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    brand?: string;
    model?: string;
    version?: string;
  }>();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const brand = getParam(params.brand);
  const model = getParam(params.model);
  const version = getParam(params.version);

  useEffect(() => {
    async function loadVehicle() {
      setLoading(true);
      setVehicle(await findVehicle({ brand, model, version }));
      setLoading(false);
    }

    loadVehicle();
  }, [brand, model, version]);

  const sections = useMemo(() => {
    if (!vehicle) return [];

    const term = filter.trim().toLowerCase();

    return vehicle.categories
      .map((category) => ({
        title: category.category,
        data: category.specs.filter((spec) =>
          term
            ? spec.name.toLowerCase().includes(term) ||
              category.category.toLowerCase().includes(term)
            : true
        ),
      }))
      .filter((section) => section.data.length > 0);
  }, [vehicle, filter]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F5F8FC]">
        <ActivityIndicator color={colors.fordBlue} />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F5F8FC] px-6">
        <Text className="mb-5 text-xl font-bold text-[#00142E]">Não encontrado</Text>
        <TouchableOpacity className="rounded-2xl bg-[#00095B] px-6 py-3" onPress={router.back}>
          <Text className="font-bold text-white">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SectionList
      className="flex-1 bg-[#F5F8FC]"
      sections={sections}
      stickySectionHeadersEnabled={false}
      keyExtractor={(item, index) => `${item.name}-${index}`}
      contentContainerStyle={{ paddingBottom: 32 }}
      ListHeaderComponent={
        <View className="px-5 pb-4 pt-12">
          <TouchableOpacity className="mb-5 self-start rounded-2xl bg-white px-4 py-3" onPress={router.back}>
            <Text className="font-bold text-[#00095B]">Voltar</Text>
          </TouchableOpacity>

          <Text className="text-3xl font-bold text-[#00142E]">{vehicle.model}</Text>
          <Text className="mt-1 text-base font-semibold text-[#517198]">
            {vehicle.brand} • {vehicle.version}
          </Text>

          <View className="mt-5 flex-row flex-wrap gap-2">
            {[vehicle.year, vehicle.engine, vehicle.vehicleCategory]
              .filter((item): item is string => Boolean(item))
              .map((item) => (
                <Text key={item} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-[#00095B]">
                  {item}
                </Text>
              ))}
          </View>

          <TextInput
            className="mt-6 rounded-2xl border border-[#D8E3F2] bg-white px-4 py-4 text-base text-[#00142E]"
            placeholder="Filtrar"
            placeholderTextColor="#7C93AF"
            value={filter}
            onChangeText={setFilter}
          />
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View className="mx-5 mb-2 mt-5 rounded-2xl bg-[#00095B] px-4 py-3">
          <Text className="text-sm font-bold uppercase tracking-[2px] text-white">
            {section.title}
          </Text>
        </View>
      )}
      renderItem={({ item }: { item: SpecItem }) => (
        <View className="mx-5 mb-2 flex-row items-center justify-between rounded-2xl border border-[#D8E3F2] bg-white px-4 py-4">
          <Text className="flex-1 pr-4 text-sm font-medium text-[#00142E]">{item.name}</Text>
          <Text className="text-sm font-bold text-[#00095B]">{displaySpecValue(item.value)}</Text>
        </View>
      )}
    />
  );
}
