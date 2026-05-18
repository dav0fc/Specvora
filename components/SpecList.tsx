import { useState } from 'react';
import { View, Text, TextInput, SectionList } from 'react-native';
import { Vehicle, SpecItem } from '../data/vehicles';

function displayValue(value: string | boolean | null): string {
  if (value === null || value === '' || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return value.toString();
}

interface SpecListProps {
  vehicle: Vehicle;
}

export function SpecList({ vehicle }: SpecListProps) {
  const [filter, setFilter] = useState('');

  const sections = vehicle.categories
    .map((cat) => ({
      ...cat,
      specs: cat.specs.filter((spec) =>
        spec.name.toLowerCase().includes(filter.toLowerCase())
      ),
    }))
    .filter((cat) => cat.specs.length > 0)
    .map((cat) => ({
      title: cat.category,
      data: cat.specs,
    }));

  return (
    <View className="flex-1">
      <TextInput
        className="bg-[#16213e] rounded-lg border border-[#0f3460] px-4 py-3 text-[#e0e0e0] text-sm mb-4"
        placeholder="Filter specs..."
        placeholderTextColor="#606070"
        value={filter}
        onChangeText={setFilter}
      />
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.name + index}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View className="bg-[#0f3460] rounded-lg px-3.5 py-2 mb-2 mt-1">
            <Text className="text-[#e94560] text-xs font-bold tracking-wider uppercase">
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }: { item: SpecItem }) => (
          <View className="bg-[#16213e] rounded-lg border border-[#0f3460] px-4 py-3 mb-2 flex-row justify-between items-center">
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
    </View>
  );
}