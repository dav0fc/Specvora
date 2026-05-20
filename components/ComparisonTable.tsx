import { ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { ComparisonRow, Vehicle } from '../data/vehicles';

type ComparisonTableProps = {
  vehicles: Vehicle[];
  rows: ComparisonRow[];
};

function vehicleName(vehicle: Vehicle) {
  return `${vehicle.model} - ${vehicle.version}`;
}

export function ComparisonTable({ vehicles, rows }: ComparisonTableProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const firstColumnWidth = isTablet ? 260 : 210;
  const vehicleColumnWidth = isTablet ? 250 : 190;
  const tableMinWidth = firstColumnWidth + vehicleColumnWidth * Math.max(vehicles.length, 1);

  if (vehicles.length < 2) {
    return (
      <View className="min-h-72 rounded-3xl border border-[#D8E3F2] bg-white p-5">
        <Text className="text-lg font-bold text-[#00142E]">Dados</Text>
        <View className="flex-1 items-center justify-center">
          <Text className="mt-5 text-sm font-bold text-[#7C93AF]">
            Selecione dois veículos
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-3xl border border-[#D8E3F2] bg-white p-5">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-[#00142E]">Dados</Text>
        <Text className="text-xs font-bold uppercase tracking-[2px] text-[#517198]">
          {rows.length} itens
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: tableMinWidth }}>
          <View className="flex-row border-b border-[#D8E3F2] pb-3">
            <Text
              className="text-xs font-bold uppercase tracking-[2px] text-[#517198]"
              style={{ width: firstColumnWidth }}
            >
              Item
            </Text>

            {vehicles.map((vehicle) => (
              <Text
                key={`${vehicle.brand}-${vehicle.model}-${vehicle.version}`}
                className="px-3 text-sm font-bold text-[#00142E]"
                style={{ width: vehicleColumnWidth }}
                numberOfLines={2}
              >
                {vehicleName(vehicle)}
              </Text>
            ))}
          </View>

          {rows.map((row) => (
            <View
              key={`${row.category ?? 'base'}-${row.label}`}
              className="flex-row border-b border-[#EEF2F7] py-4"
            >
              <View className="pr-4" style={{ width: firstColumnWidth }}>
                {row.category && (
                  <Text className="mb-1 text-[10px] font-bold uppercase tracking-[2px] text-[#517198]">
                    {row.category}
                  </Text>
                )}
                <Text className="text-sm font-bold text-[#00142E]">
                  {row.label}
                </Text>
              </View>

              {row.values.map((value, index) => (
                <Text
                  key={`${row.label}-${index}`}
                  className="px-3 text-sm font-semibold text-[#00142E]"
                  style={{ width: vehicleColumnWidth }}
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
