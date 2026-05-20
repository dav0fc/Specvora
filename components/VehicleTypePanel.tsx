import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

type VehicleTypePanelProps = {
  width: number;
  categories: string[];
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
};

export function VehicleTypePanel({
  width,
  categories,
  selectedCategory,
  onSelect,
}: VehicleTypePanelProps) {
  const options = [null, ...categories];

  return (
    <View
      className="h-full border-r border-[#D8E3F2] bg-[#00142E] px-4 py-5"
      style={{ width }}
    >
      <View className="mb-6">
        <Text className="text-xs font-bold uppercase tracking-[3px] text-[#8FB3FF]">
          Menu
        </Text>
        <Text className="mt-1 text-2xl font-bold text-white">Tipos</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {options.map((category) => {
          const label = category ?? 'Todos';
          const active = category === selectedCategory;

          return (
            <TouchableOpacity
              key={label}
              activeOpacity={0.82}
              onPress={() => onSelect(category)}
              className={`mb-2 rounded-2xl border px-4 py-4 ${
                active
                  ? 'border-white bg-white'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  active ? 'text-[#00095B]' : 'text-white'
                }`}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
