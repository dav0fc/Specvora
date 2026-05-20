import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { ComparisonTable } from '../components/ComparisonTable';
import { RadarChart } from '../components/RadarChart';
import { VehicleSelector } from '../components/VehicleSelector';
import { VehicleTypeDrawer } from '../components/VehicleTypeDrawer';
import {
  ComparisonSlot,
  getComparisonRows,
  getRadarMetrics,
  Vehicle,
} from '../data/vehicles';
import { colors } from '../styles/colors';
import { findVehicle, listVehicleCategories } from '../services/vehicleService';

const MAX_VEHICLES = 3;

function createSlot(index: number): ComparisonSlot {
  return {
    id: `vehicle-${index + 1}`,
    label: `Veículo ${String.fromCharCode(65 + index)}`,
    brand: null,
    model: null,
    version: null,
  };
}

function vehicleTitle(vehicle: Vehicle) {
  return `${vehicle.model} ${vehicle.version}`;
}

export default function CompareScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [slots, setSlots] = useState<ComparisonSlot[]>([createSlot(0), createSlot(1)]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      setLoading(true);
      setCategories(await listVehicleCategories());
      setLoading(false);
    }

    loadCategories();
  }, []);

  useEffect(() => {
    async function loadVehicles() {
      const selectedVehicles = await Promise.all(
        slots.map((slot) => {
          if (!slot.brand || !slot.model || !slot.version) return null;

          return findVehicle({
            brand: slot.brand,
            model: slot.model,
            version: slot.version,
          });
        })
      );

      setVehicles(selectedVehicles.filter(Boolean) as Vehicle[]);
    }

    loadVehicles();
  }, [slots]);

  const radarSeries = useMemo(
    () =>
      vehicles.map((vehicle, index) => ({
        name: vehicleTitle(vehicle),
        color: [colors.fordBlue, colors.fordGrabber, colors.sky][index],
        values: getRadarMetrics(vehicle),
      })),
    [vehicles]
  );

  const comparisonRows = useMemo(() => getComparisonRows(vehicles), [vehicles]);

  function updateSlot(slotId: string, nextSlot: ComparisonSlot) {
    setSlots((currentSlots) =>
      currentSlots.map((slot) => (slot.id === slotId ? nextSlot : slot))
    );
  }

  function addVehicle() {
    if (slots.length >= MAX_VEHICLES) return;
    setSlots((currentSlots) => [...currentSlots, createSlot(currentSlots.length)]);
  }

  function removeVehicle(slotId: string) {
    if (slots.length <= 2) return;
    setSlots((currentSlots) => currentSlots.filter((slot) => slot.id !== slotId));
  }

  function handleCategorySelect(category: string | null) {
    setSelectedCategory(category);
    setSlots([createSlot(0), createSlot(1)]);
    setDrawerVisible(false);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F5F8FC]">
        <ActivityIndicator color={colors.fordBlue} />
      </View>
    );
  }

  return (
    <View className={`flex-1 bg-[#F5F8FC] ${isTablet ? 'flex-row' : 'flex-col'}`}>
      <View
        className={`border-[#D8E3F2] bg-white ${
          isTablet ? 'w-32 border-r px-4 py-6' : 'border-b px-4 py-3'
        }`}
      >
        <View className={isTablet ? 'gap-4' : 'flex-row items-center justify-between'}>
          <View>
            <Text className="text-xs font-bold uppercase tracking-[3px] text-[#00095B]">
              FORD
            </Text>
            <Text className="mt-1 text-lg font-bold text-[#00142E]">Specvora</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => setDrawerVisible(true)}
            className="rounded-2xl border border-[#D8E3F2] bg-[#F5F8FC] px-4 py-3"
          >
            <Text className="text-xs font-bold uppercase tracking-[2px] text-[#00095B]">
              Tipo
            </Text>
            <Text className="mt-1 text-sm font-semibold text-[#00142E]" numberOfLines={1}>
              {selectedCategory ?? 'Todos'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: isTablet ? 24 : 16 }}>
        <View className={isTablet ? 'mb-6 flex-row items-center justify-between' : 'mb-5'}>
          <View>
            <Text className="text-3xl font-bold text-[#00142E]">Comparativo</Text>
            <Text className="mt-1 text-sm font-semibold uppercase tracking-[2px] text-[#517198]">
              {vehicles.length} selecionado(s)
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.82}
            disabled={slots.length >= MAX_VEHICLES}
            onPress={addVehicle}
            className={`mt-4 rounded-2xl px-5 py-3 ${
              isTablet ? 'mt-0' : ''
            } ${slots.length >= MAX_VEHICLES ? 'bg-[#CBD5E1]' : 'bg-[#00095B]'}`}
          >
            <Text className="text-sm font-bold text-white">Adicionar</Text>
          </TouchableOpacity>
        </View>

        <View className={isTablet ? 'flex-row gap-5' : 'flex-col gap-4'}>
          <View style={{ flex: isTablet ? 0.42 : undefined }} className="gap-4">
            {slots.map((slot) => (
              <VehicleSelector
                key={slot.id}
                slot={slot}
                category={selectedCategory}
                canRemove={slots.length > 2}
                onChange={(nextSlot) => updateSlot(slot.id, nextSlot)}
                onRemove={() => removeVehicle(slot.id)}
              />
            ))}
          </View>

          <View style={{ flex: 1 }} className="gap-4">
            <View className="rounded-3xl border border-[#D8E3F2] bg-white p-5">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-[#00142E]">Radar</Text>
                <Text className="text-xs font-bold uppercase tracking-[2px] text-[#517198]">
                  0 - 100
                </Text>
              </View>

              <RadarChart series={radarSeries} size={isTablet ? 330 : 280} />
            </View>

            <ComparisonTable vehicles={vehicles} rows={comparisonRows} />
          </View>
        </View>
      </ScrollView>

      <VehicleTypeDrawer
        visible={drawerVisible}
        categories={categories}
        selectedCategory={selectedCategory}
        onClose={() => setDrawerVisible(false)}
        onSelect={handleCategorySelect}
      />
    </View>
  );
}
