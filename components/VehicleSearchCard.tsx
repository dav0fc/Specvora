import { useMemo } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ComparisonSlot, displaySpecValue, searchVehicles, Vehicle } from '../data/vehicles';

type VehicleSearchCardProps = {
  slot: ComparisonSlot;
  vehicles: Vehicle[];
  excludedVehicleIds: string[];
  compact?: boolean;
  onTermChange: (term: string) => void;
  onSelect: (vehicleId: string) => void;
  onClear: () => void;
};

function vehicleTitle(vehicle: Vehicle) {
  return `${vehicle.brand} ${vehicle.model} — ${vehicle.version}`;
}

function vehicleHint(vehicle: Vehicle) {
  return [
    vehicle.engine ?? '',
    vehicle.specs.cilindrada != null && vehicle.specs.cilindrada !== ''
      ? `Cilindrada ${displaySpecValue(vehicle.specs.cilindrada, 'L')}`
      : '',
    typeof vehicle.specs.potencia === 'number' ? `${vehicle.specs.potencia} cv` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

export function VehicleSearchCard({
  slot,
  vehicles,
  excludedVehicleIds,
  compact = false,
  onTermChange,
  onSelect,
  onClear,
}: VehicleSearchCardProps) {
  const excludeKey = excludedVehicleIds.join(',');

  const results = useMemo(
    () =>
      slot.vehicleId || !slot.term.trim()
        ? []
        : searchVehicles(slot.term, vehicles, excludeKey ? excludeKey.split(',') : []),
    [slot.vehicleId, slot.term, vehicles, excludeKey]
  );

  const selectedVehicle = slot.vehicleId
    ? vehicles.find((vehicle) => vehicle.id === slot.vehicleId) ?? null
    : null;

  return (
    <View
      className={`rounded-3xl border border-[#D8E3F2] bg-[#F8FAFD] ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <View
        className={`flex-row items-center justify-between ${compact ? 'mb-2' : 'mb-3'}`}
      >
        <Text className={`${compact ? 'text-base' : 'text-lg'} font-bold text-[#00142E]`}>
          {slot.label}
        </Text>

        {selectedVehicle ? (
          <TouchableOpacity
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={`Trocar ${slot.label.toLowerCase()}`}
            onPress={onClear}
            className="rounded-full border border-[#D8E3F2] bg-white px-3 py-2"
          >
            <Text className="text-xs font-bold text-[#00095B]">Trocar</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {selectedVehicle ? (
        <View className="rounded-2xl border border-[#B9CDE8] bg-white px-4 py-3">
          <Text className="text-base font-bold text-[#00095B]">
            {vehicleTitle(selectedVehicle)}
          </Text>
          <Text className="mt-1 text-xs font-semibold text-[#517198]">
            {vehicleHint(selectedVehicle)}
          </Text>
        </View>
      ) : (
        <>
          <TextInput
            accessibilityLabel={`Pesquisar ${slot.label.toLowerCase()}`}
            autoCapitalize="none"
            className="rounded-2xl border border-[#D8E3F2] bg-white px-4 py-3 text-base text-[#00142E]"
            onChangeText={onTermChange}
            placeholder="Ex.: ranger, raptor, 1.5, diesel 4x4"
            placeholderTextColor="#7C93AF"
            value={slot.term}
          />

          {!slot.term.trim() ? (
            <Text className="mt-2 text-xs font-semibold text-[#7C93AF]">
              Digite o nome do carro (ex.: ranger) ou uma especificação (ex.: 1.5, diesel).
            </Text>
          ) : results.length === 0 ? (
            <Text className="mt-2 text-xs font-semibold text-[#7C93AF]">
              Nenhum veículo encontrado. Tente: ranger, raptor, 1.5, diesel.
            </Text>
          ) : (
            <View className="mt-3">
              <Text className="text-xs font-bold uppercase tracking-[2px] text-[#517198]">
                {results.length}{' '}
                {results.length === 1 ? 'veículo encontrado' : 'veículos encontrados'}
              </Text>

              {results.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel={vehicleTitle(vehicle)}
                  onPress={() => onSelect(vehicle.id)}
                  className="mt-2 rounded-2xl border border-[#D8E3F2] bg-white px-4 py-3"
                >
                  <Text className="text-sm font-bold text-[#00142E]">
                    {vehicleTitle(vehicle)}
                  </Text>
                  <Text className="mt-1 text-xs font-semibold text-[#517198]">
                    {vehicleHint(vehicle)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}
