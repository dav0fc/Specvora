import { ScrollView, Text, View } from 'react-native';

import { ComparisonRow, Vehicle } from '../data/vehicles';

type ComparisonTableProps = {
  vehicles: Vehicle[];
  rows: ComparisonRow[];
};

function vehicleName(vehicle: Vehicle) {
  return `${vehicle.model} ${vehicle.version}`;
}

export function ComparisonTable({ vehicles, rows }: ComparisonTableProps) {
  if (vehicles.length < 2) {
    return (
      <View className="rounded-3xl border border-[#D8E3F2] bg-white p-5">
        <Text className="text-lg font-bold text-[#00142E]">Dados</Text>
        <Text className="mt-5 text-sm font-bold text-[#7C93AF]">Selecione dois veículos</Text>
      </View>
    );
  }

  return (
    <View className="rounded-3xl border border-[#D8E3F2] bg-white p-5">
      <Text className="mb-4 text-lg font-bold text-[#00142E]">Dados</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View className="flex-row border-b border-[#D8E3F2] pb-3">
            <Text className="w-44 text-xs font-bold uppercase tracking-[2px] text-[#517198]">
              Item
            </Text>

            {vehicles.map((vehicle) => (
              <Text
                key={`${vehicle.brand}-${vehicle.model}-${vehicle.version}`}
                className="w-44 px-3 text-xs font-bold uppercase tracking-[2px] text-[#517198]"
                numberOfLines={1}
              >
                {vehicleName(vehicle)}
              </Text>
            ))}
          </View>

          {rows.map((row) => (
            <View key={row.label} className="flex-row border-b border-[#EEF2F7] py-4">
              <Text className="w-44 pr-4 text-sm font-bold text-[#00142E]">{row.label}</Text>

              {row.values.map((value, index) => (
                <Text
                  key={`${row.label}-${index}`}
                  className="w-44 px-3 text-sm font-semibold text-[#00142E]"
                  numberOfLines={2}
                >
                  {value}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
