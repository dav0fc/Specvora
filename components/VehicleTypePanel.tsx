import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

type VehicleTypePanelProps = {
  width: number;
  expanded: boolean;
  categories: string[];
  selectedCategory: string | null;
  onToggle: () => void;
  onSelect: (category: string | null) => void;
};

export function VehicleTypePanel({
  width,
  expanded,
  categories,
  selectedCategory,
  onToggle,
  onSelect,
}: VehicleTypePanelProps) {
  const options = [null, ...categories];

  if (!expanded) {
    return (
      <View
        className="h-full items-center border-r border-[#D8E3F2] bg-[#00142E] px-3 pt-7"
        style={{ width }}
      >
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={onToggle}
          className="w-full rounded-2xl bg-white px-2 py-4"
        >
          <Text className="text-center text-xs font-bold text-[#00095B]">
            Tipos
          </Text>
        </TouchableOpacity>

        <Text
          className="mt-4 text-center text-[10px] font-bold uppercase tracking-[2px] text-[#8FB3FF]"
          numberOfLines={2}
        >
          {selectedCategory ?? 'Todos'}
        </Text>
      </View>
    );
  }

  return (
    <View
      className="h-full border-r border-[#D8E3F2] bg-[#00142E] px-4 pt-7"
      style={{ width }}
    >
      <View className="mb-6 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-white">Tipos</Text>

        <TouchableOpacity onPress={onToggle}>
          <Text className="text-sm font-bold text-[#8FB3FF]">Ocultar</Text>
        </TouchableOpacity>
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
