import { ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { ComparisonRow, Vehicle } from '../data/vehicles';

type ComparisonTableProps = {
  vehicles: Vehicle[];
  rows: ComparisonRow[];
  fill?: boolean;
};

function vehicleName(vehicle: Vehicle) {
  return `${vehicle.model} ${vehicle.version}`;
}

export function ComparisonTable({ vehicles, rows, fill = false }: ComparisonTableProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const firstColumnWidth = isTablet ? 190 : 176;
  const estimatedPanelWidth = isTablet ? width - 620 : width - 32;
  const vehicleColumnWidth = isTablet
    ? Math.max(220, Math.floor((estimatedPanelWidth - firstColumnWidth) / Math.max(vehicles.length, 1)))
    : 176;

  if (vehicles.length < 2) {
    return (
      <View
        className="rounded-3xl border border-[#D8E3F2] bg-white p-5"
        style={fill ? { flex: 1 } : undefined}
      >
        <Text className="text-lg font-bold text-[#00142E]">Dados</Text>
        <View className="flex-1 items-center justify-center">
          <Text className="mt-5 text-sm font-bold text-[#7C93AF]">
            Selecione dois veículos
          </Text>
        </View>
      </View>
    );
  }

  const tableMinWidth = firstColumnWidth + vehicleColumnWidth * vehicles.length;

  return (
    <View
      className="rounded-3xl border border-[#D8E3F2] bg-white p-5"
      style={fill ? { flex: 0.48 } : undefined}
    >
      <Text className="mb-4 text-lg font-bold text-[#00142E]">Dados</Text>

      <View className={fill ? 'flex-1' : ''}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={fill ? { maxHeight: '100%' } : undefined}
          >
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
                    className="px-3 text-xs font-bold uppercase tracking-[2px] text-[#517198]"
                    style={{ width: vehicleColumnWidth }}
                    numberOfLines={1}
                  >
                    {vehicleName(vehicle)}
                  </Text>
                ))}
              </View>

              {rows.map((row) => (
                <View key={row.label} className="flex-row border-b border-[#EEF2F7] py-4">
                  <Text
                    className="pr-4 text-sm font-bold text-[#00142E]"
                    style={{ width: firstColumnWidth }}
                  >
                    {row.label}
                  </Text>

                  {row.values.map((value, index) => (
                    <Text
                      key={`${row.label}-${index}`}
                      className="px-3 text-sm font-semibold text-[#00142E]"
                      style={{ width: vehicleColumnWidth }}
                      numberOfLines={2}
                    >
                      {value}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      </View>
    </View>
  );
}
