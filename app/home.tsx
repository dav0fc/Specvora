import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ComparisonTable } from '../components/ComparisonTable';
import { RadarChart } from '../components/RadarChart';
import { VehicleLegend } from '../components/VehicleLegend';
import { VehicleSelector } from '../components/VehicleSelector';
import { VehicleTypeDrawer } from '../components/VehicleTypeDrawer';
import { VehicleTypePanel } from '../components/VehicleTypePanel';
import {
  ComparisonSlot,
  getComparisonRows,
  getRadarMetrics,
  Vehicle,
} from '../data/vehicles';
import { logoutUser, waitForAuthState } from '../services/authService';
import { findVehicle, listVehicleCategories } from '../services/vehicleService';

const RADAR_COLORS = ['#00095B', '#1700F4'];
const RADAR_DOT_CLASSES = ['bg-[#00095B]', 'bg-[#1700F4]'];

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
  return `${vehicle.model} - ${vehicle.version}`;
}

function getUserName(displayName?: string | null, email?: string | null) {
  if (displayName?.trim()) return displayName.trim();
  if (email?.trim()) return email.split('@')[0];

  return 'Usuário';
}

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [typePanelOpen, setTypePanelOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [slots, setSlots] = useState<ComparisonSlot[]>([createSlot(0), createSlot(1)]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [userName, setUserName] = useState('Usuário');
  const [loading, setLoading] = useState(true);

  const sideWidth = typePanelOpen
    ? Math.min(340, Math.max(260, Math.round(width * 0.22)))
    : 76;

  const selectorWidth = width >= 1200 ? 380 : 340;

  const radarSize = isTablet
    ? Math.min(430, Math.max(300, Math.round(Math.min(width * 0.28, height * 0.38))))
    : Math.min(300, width - 48);

  useEffect(() => {
    let mounted = true;

    async function checkAuthAndLoadData() {
      setLoading(true);

      const user = await waitForAuthState();

      if (!mounted) return;

      if (!user) {
        router.replace('/');
        return;
      }

      setUserName(getUserName(user.displayName, user.email));
      setCategories(await listVehicleCategories());
      setLoading(false);
    }

    checkAuthAndLoadData();

    return () => {
      mounted = false;
    };
  }, [router]);

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
        color: RADAR_COLORS[index],
        dotClassName: RADAR_DOT_CLASSES[index],
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

  function handleCategorySelect(category: string | null) {
    setSelectedCategory(category);
    setSlots([createSlot(0), createSlot(1)]);
    setDrawerVisible(false);
  }

  async function handleLogout() {
    await logoutUser();
    router.replace('/');
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F5F8FC]">
        <ActivityIndicator color="#00095B" />
      </View>
    );
  }

  if (isTablet) {
    return (
      <View className="flex-1 flex-row bg-[#F5F8FC]">
        <VehicleTypePanel
          width={sideWidth}
          expanded={typePanelOpen}
          categories={categories}
          selectedCategory={selectedCategory}
          onToggle={() => setTypePanelOpen((current) => !current)}
          onSelect={handleCategorySelect}
        />

        <View
          className="h-full border-r border-[#D8E3F2] bg-white"
          style={{ width: selectorWidth }}
        >
          <View className="border-b border-[#D8E3F2] px-5 pb-5 pt-7">
            <View className="flex-row items-center justify-between gap-4">
              <Text className="flex-1 text-2xl font-bold text-[#00142E]" numberOfLines={1}>
                {userName}
              </Text>

              <TouchableOpacity
                activeOpacity={0.82}
                onPress={handleLogout}
                className="rounded-full border border-[#D8E3F2] px-4 py-3"
              >
                <Text className="text-xs font-bold text-[#00095B]">Sair</Text>
              </TouchableOpacity>
            </View>
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
                compact
                onChange={(nextSlot) => updateSlot(slot.id, nextSlot)}
              />
            ))}
          </ScrollView>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 28 }}
        >
          <View className="rounded-3xl border border-[#D8E3F2] bg-white p-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-[#00142E]">Radar</Text>
              <Text className="text-xs font-bold uppercase tracking-[2px] text-[#517198]">
                0 - 100
              </Text>
            </View>

            <View className="flex-row items-center justify-center gap-6">
              <RadarChart series={radarSeries} size={radarSize} />
              <VehicleLegend series={radarSeries} className="max-w-64 flex-1" />
            </View>
          </View>

          <ComparisonTable vehicles={vehicles} rows={comparisonRows} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F8FC]">
      <View className="border-b border-[#D8E3F2] bg-white px-4 pb-4 pt-5">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-2xl font-bold text-[#00142E]" numberOfLines={1}>
            {userName}
          </Text>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={handleLogout}
              className="rounded-2xl border border-[#D8E3F2] bg-white px-4 py-3"
            >
              <Text className="text-sm font-bold text-[#00095B]">Sair</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => setDrawerVisible(true)}
              className="rounded-2xl border border-[#D8E3F2] bg-[#F5F8FC] px-4 py-3"
            >
              <Text className="text-xs font-bold uppercase tracking-[2px] text-[#00095B]">
                Tipo
              </Text>
              <Text
                className="mt-1 max-w-28 text-sm font-semibold text-[#00142E]"
                numberOfLines={1}
              >
                {selectedCategory ?? 'Todos'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 14, gap: 14 }}>
        {slots.map((slot) => (
          <VehicleSelector
            key={slot.id}
            slot={slot}
            category={selectedCategory}
            onChange={(nextSlot) => updateSlot(slot.id, nextSlot)}
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
          <VehicleLegend series={radarSeries} className="mt-3" />
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
