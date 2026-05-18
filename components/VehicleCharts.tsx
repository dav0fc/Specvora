// components/VehicleCharts.tsx
import { View, Text, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Vehicle } from '../data/vehicles';

interface VehicleChartsProps {
  vehicle: Vehicle;
  compareVehicle?: Vehicle | null;
}

export function VehicleCharts({ vehicle, compareVehicle }: VehicleChartsProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 48, 600); // limita largura máxima

  // Especificações numéricas que aparecerão no gráfico
  const numericSpecs = [
    { name: 'Potência', key: 'Potência' },
    { name: 'Torque', key: 'Torque' },
    { name: 'Peso (kg)', key: 'Peso em ordem de marchas' },
    { name: 'Cilindrada', key: 'Cilindrada' },
    { name: 'Economia (km/l)', key: 'Economia de Combustível' },
  ];

  // Extrai valor numérico de uma especificação pelo nome
  const getValue = (specs: { name: string; value: string | boolean | null }[], key: string) => {
    const item = specs.find(s => s.name === key);
    if (item && typeof item.value === 'string') {
      const parsed = parseFloat(item.value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const allSpecs = vehicle.categories.flatMap(c => c.specs);
  const compareSpecs = compareVehicle?.categories.flatMap(c => c.specs) || [];

  // Monta os dados para o BarChart
  const barData = {
    labels: numericSpecs.map(s => s.name),
    datasets: [
      {
        data: numericSpecs.map(s => getValue(allSpecs, s.key)),
        color: (opacity = 1) => `rgba(233, 69, 96, ${opacity})`, // accent (#e94560)
        strokeWidth: 2,
      },
      ...(compareVehicle
        ? [
            {
              data: numericSpecs.map(s => getValue(compareSpecs, s.key)),
              color: (opacity = 1) => `rgba(0, 119, 182, ${opacity})`, // azul (#0077b6)
              strokeWidth: 2,
            },
          ]
        : []),
    ],
  };

  return (
    <View className="mb-6">
      <Text className="text-[#e0e0e0] text-lg font-bold mb-4">Performance Overview</Text>

      <View className="bg-[#16213e] rounded-2xl p-4 border border-[#0f3460]">
        <BarChart
          data={barData}
          width={chartWidth}
          height={240}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#16213e',
            backgroundGradientFrom: '#16213e',
            backgroundGradientTo: '#16213e',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(233, 69, 96, ${opacity})`,
            labelColor: () => '#a0a0b0',
            style: {
              borderRadius: 8,
            },
            barPercentage: 0.6,
            propsForLabels: {
              fontSize: 11,
            },
          }}
          fromZero
          showBarTops
        />

        {/* Legenda de comparação */}
        {compareVehicle && (
          <View className="flex-row justify-center mt-3">
            <View className="flex-row items-center mx-2">
              <View className="w-3 h-3 rounded-full bg-[#e94560] mr-1" />
              <Text className="text-[#a0a0b0] text-xs">
                {vehicle.brand} {vehicle.model}
              </Text>
            </View>
            <View className="flex-row items-center mx-2">
              <View className="w-3 h-3 rounded-full bg-[#0077b6] mr-1" />
              <Text className="text-[#a0a0b0] text-xs">
                {compareVehicle.brand} {compareVehicle.model}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}