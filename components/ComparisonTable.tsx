import { ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { ComparisonRow, Vehicle } from '../data/vehicles';

type ComparisonTableProps = {
  vehicles: Vehicle[];
  rows: ComparisonRow[];
};

type TableItem =
  | { kind: 'group'; label: string }
  | { kind: 'row'; row: ComparisonRow };

function vehicleName(vehicle: Vehicle) {
  return `${vehicle.model} - ${vehicle.version}`;
}

function buildTableItems(rows: ComparisonRow[]): TableItem[] {
  const items: TableItem[] = [];
  let lastCategory: string | undefined;

  for (const row of rows) {
    if (row.category && row.category !== lastCategory) {
      items.push({ kind: 'group', label: row.category });
      lastCategory = row.category;
    } else if (!row.category) {
      lastCategory = undefined;
    }

    items.push({ kind: 'row', row });
  }

  return items;
}

export function ComparisonTable({ vehicles, rows }: ComparisonTableProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const firstColumnWidth = isTablet ? 260 : 210;
  const vehicleColumnWidth = isTablet ? 250 : 190;
  const tableMinWidth = firstColumnWidth + vehicleColumnWidth * Math.max(vehicles.length, 1);

  if (vehicles.length === 0) {
    return (
      <View className="min-h-72 rounded-3xl border border-[#D8E3F2] bg-white p-5">
        <Text className="text-lg font-bold text-[#00142E]">Dados</Text>
        <View className="flex-1 items-center justify-center">
          <Text className="mt-5 text-sm font-bold text-[#7C93AF]">
            Selecione um veículo
          </Text>
        </View>
      </View>
    );
  }

  const attributeCount = Math.max(rows.length - 3, 0);
  const tableItems = buildTableItems(rows);

  return (
    <View className="rounded-3xl border border-[#D8E3F2] bg-white p-5">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-[#00142E]">Dados</Text>
        <Text className="text-xs font-bold uppercase tracking-[2px] text-[#517198]">
          {attributeCount} {attributeCount === 1 ? 'atributo' : 'atributos'}
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

            {vehicles.map((vehicle, index) => (
              <Text
                key={`col-${index}`}
                className="px-3 text-sm font-bold text-[#00142E]"
                style={{ width: vehicleColumnWidth }}
                numberOfLines={2}
              >
                {vehicleName(vehicle)}
              </Text>
            ))}
          </View>

          {tableItems.map((item) =>
            item.kind === 'group' ? (
              <View
                key={`group-${item.label}`}
                className="mt-2 border-b border-[#D8E3F2] bg-[#F5F8FC] px-3 py-2"
              >
                <Text className="text-[10px] font-bold uppercase tracking-[2px] text-[#517198]">
                  {item.label}
                </Text>
              </View>
            ) : (
              <View
                key={`row-${item.row.label}`}
                className="flex-row border-b border-[#EEF2F7] py-3"
              >
                <View className="pr-4" style={{ width: firstColumnWidth }}>
                  <Text className="text-sm font-bold text-[#00142E]">
                    {item.row.label}
                  </Text>
                </View>

                {item.row.values.map((value, index) => (
                  <Text
                    key={`value-${index}`}
                    className="px-3 text-sm font-semibold text-[#00142E]"
                    style={{ width: vehicleColumnWidth }}
                  >
                    {value}
                  </Text>
                ))}
              </View>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}
