import { Text, View } from 'react-native';

type VehicleLegendItem = {
  name: string;
  dotClassName: string;
};

type VehicleLegendProps = {
  series: VehicleLegendItem[];
  className?: string;
};

export function VehicleLegend({ series, className = '' }: VehicleLegendProps) {
  if (series.length < 2) return null;

  return (
    <View className={className}>
      <Text className="mb-3 text-xs font-bold uppercase tracking-[2px] text-[#517198]">
        Veículos
      </Text>

      <View className="gap-2">
        {series.map((item, index) => (
          <View
            key={item.name}
            className="flex-row items-center rounded-2xl bg-[#F5F8FC] px-3 py-2"
          >
            <View className={`mr-3 h-3 w-3 rounded-full ${item.dotClassName}`} />
            <Text className="flex-1 text-sm font-bold text-[#00142E]" numberOfLines={2}>
              {index + 1}. {item.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
