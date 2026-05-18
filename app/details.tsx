import { useState, useMemo } from 'react';
import { View, Text, TextInput, SectionList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { findVariant, SpecItem } from '../data/vehicles';

function displayValue(value: string | boolean | null): string {
  if (value === null || value === '' || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return value.toString();
}

export default function DetailsScreen() {
  const { brand, model, version } = useLocalSearchParams<{
    brand: string;
    model: string;
    version: string;
  }>();
  const router = useRouter();
  const [filter, setFilter] = useState('');

  const variant = useMemo(
    () => findVariant(brand, model, version),
    [brand, model, version]
  );

  const sections = useMemo(() => {
    if (!variant) return [];
    const filteredCategories = variant.categories.map((cat) => {
      const filteredSpecs = cat.specs.filter((spec) =>
        spec.name.toLowerCase().includes(filter.toLowerCase())
      );
      return { ...cat, specs: filteredSpecs };
    }).filter((cat) => cat.specs.length > 0);

    return filteredCategories.map((cat) => ({
      title: cat.category,
      data: cat.specs,
    }));
  }, [variant, filter]);

  if (!variant) {
    return (
      <View className="flex-1 bg-[#133a7c] justify-center items-center">
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
        <>
          <TouchableOpacity
            className="bg-[#16213e] rounded-2xl border border-[#0f3460] px-7 py-4.5 mb-6 items-center shadow-lg shadow-black/20"
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text className="text-[#a0a0b0] text-xs font-semibold tracking-wider mb-1">
              {variant.brand}
            </Text>
            <Text className="text-[#e94560] text-base font-bold text-center">
              {variant.model} — {variant.version}
            </Text>
          </TouchableOpacity>

          <View className="mb-5 px-6">
            <TextInput
              className="bg-[#16213e] rounded-lg border border-[#0f3460] px-4 py-3 text-[#e0e0e0] text-sm"
              placeholder="Filter specs..."
              placeholderTextColor="#606070"
              value={filter}
              onChangeText={setFilter}
            />
          </View>
        </>
      }
      renderSectionHeader={({ section }) => (
        <View className="bg-[#0f3460] rounded-lg px-3.5 py-2 mb-2 mt-1 mx-6">
          <Text className="text-[#e94560] text-xs font-bold tracking-wider uppercase">
            {section.title}
          </Text>
        </View>
      )}
      renderItem={({ item }: { item: SpecItem }) => (
        <View className="bg-[#16213e] rounded-lg border border-[#0f3460] px-4.5 py-3.5 mb-2 mx-6 flex-row justify-between items-center">
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
      contentContainerStyle={{ paddingVertical: 24 }}
    />
  );
}