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
import { VehicleTypePanel } from '../components/VehicleTypePanel';
import {
  ComparisonSlot,
  getComparisonRows,
  getRadarMetrics,
  Vehicle,
} from '../data/vehicles';
import { findVehicle, listVehicleCategories } from '../services/vehicleService';
import { colors } from '../styles/colors';

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
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [slots, setSlots] = useState<ComparisonSlot[]>([createSlot(0), createSlot(1)]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const sideWidth = width >= 1100 ? 260 : 220;
  const selectorWidth = width >= 1100 ? 380 : 340;
  const radarSize = isTablet
    ? Math.min(460, Math.max(330, Math.round(Math.min(width * 0.33, height * 0.44))))
    : Math.min(300, width - 48);

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

  if (isTablet) {
    return (
      <View className="flex-1 flex-row bg-[#F5F8FC]">
        <VehicleTypePanel
          width={sideWidth}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={handleCategorySelect}
        />

        <View
          className="h-full border-r border-[#D8E3F2] bg-white"
          style={{ width: selectorWidth }}
        >
          <View className="border-b border-[#D8E3F2] px-5 py-5">
            <View className="mb-4 flex-row items-start justify-between gap-4">
              <View>
                <Text className="text-xs font-bold uppercase tracking-[3px] text-[#00095B]">
                  FORD
                </Text>
                <Text className="mt-1 text-2xl font-bold text-[#00142E]">
                  Comparativo
                </Text>
              </View>

              <View className="rounded-full bg-[#F5F8FC] px-3 py-2">
                <Text className="text-xs font-bold text-[#517198]">
                  {vehicles.length}/{slots.length}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.82}
              disabled={slots.length >= MAX_VEHICLES}
              onPress={addVehicle}
              className={`rounded-2xl px-4 py-3 ${
                slots.length >= MAX_VEHICLES ? 'bg-[#CBD5E1]' : 'bg-[#00095B]'
              }`}
            >
              <Text className="text-center text-sm font-bold text-white">
                Adicionar veículo
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
          >
            {slots.map((slot) => (
              <VehicleSelector
                key={slot.id}
                slot={slot}
                category={selectedCategory}
                canRemove={slots.length > 2}
                compact
                onChange={(nextSlot) => updateSlot(slot.id, nextSlot)}
                onRemove={() => removeVehicle(slot.id)}
              />
            ))}
          </ScrollView>
        </View>

        <View className="flex-1 p-4">
          <View className="flex-1 gap-4">
            <View className="rounded-3xl border border-[#D8E3F2] bg-white p-5" style={{ flex: 0.52 }}>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xl font-bold text-[#00142E]">Radar</Text>
                <Text className="text-xs font-bold uppercase tracking-[2px] text-[#517198]">
                  0 - 100
                </Text>
              </View>

              <View className="flex-1 items-center justify-center">
                <RadarChart series={radarSeries} size={radarSize} />
              </View>
            </View>

            <ComparisonTable vehicles={vehicles} rows={comparisonRows} fill />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F8FC]">
      <View className="border-b border-[#D8E3F2] bg-white px-4 py-4">
        <View className="flex-row items-center justify-between gap-3">
          <View>
            <Text className="text-xs font-bold uppercase tracking-[3px] text-[#00095B]">
              FORD
            </Text>
            <Text className="mt-1 text-2xl font-bold text-[#00142E]">Comparativo</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => setDrawerVisible(true)}
            className="rounded-2xl border border-[#D8E3F2] bg-[#F5F8FC] px-4 py-3"
          >
            <Text className="text-xs font-bold uppercase tracking-[2px] text-[#00095B]">
              Tipo
            </Text>
            <Text className="mt-1 max-w-28 text-sm font-semibold text-[#00142E]" numberOfLines={1}>
              {selectedCategory ?? 'Todos'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 14, gap: 14 }}>
        <TouchableOpacity
          activeOpacity={0.82}
          disabled={slots.length >= MAX_VEHICLES}
          onPress={addVehicle}
          className={`rounded-2xl px-5 py-3 ${
            slots.length >= MAX_VEHICLES ? 'bg-[#CBD5E1]' : 'bg-[#00095B]'
          }`}
        >
          <Text className="text-center text-sm font-bold text-white">Adicionar veículo</Text>
        </TouchableOpacity>

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

        <View className="rounded-3xl border border-[#D8E3F2] bg-white p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-[#00142E]">Radar</Text>
            <Text className="text-xs font-bold uppercase tracking-[2px] text-[#517198]">
              0 - 100
            </Text>
          </View>

          <RadarChart series={radarSeries} size={radarSize} />
        </View>

        <ComparisonTable vehicles={vehicles} rows={comparisonRows} />
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
