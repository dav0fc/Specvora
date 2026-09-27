import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AttributeSelector } from '../components/AttributeSelector';
import { ComparisonTable } from '../components/ComparisonTable';
import { RadarChart } from '../components/RadarChart';
import { VehicleLegend } from '../components/VehicleLegend';
import { VehicleSearchCard } from '../components/VehicleSearchCard';
import {
  ComparisonSlot,
  getAttributeOptions,
  getComparisonRows,
  getRadarMetrics,
  vehicles,
  Vehicle,
} from '../data/vehicles';
import { logoutUser, waitForAuthState } from '../services/authService';

const RADAR_COLORS = ['#00095B', '#1700F4'];
const RADAR_DOT_CLASSES = ['bg-[#00095B]', 'bg-[#1700F4]'];

function createSlot(index: number): ComparisonSlot {
  return {
    id: `vehicle-${index + 1}`,
    label: `Veículo ${String.fromCharCode(65 + index)}`,
    term: '',
    vehicleId: null,
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
  const insets = useSafeAreaInsets();

  const isTablet = width >= 768;

  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [slots, setSlots] = useState<ComparisonSlot[]>([createSlot(0), createSlot(1)]);
  const [userName, setUserName] = useState('Usuário');
  const [loading, setLoading] = useState(true);

  const selectedVehicles = useMemo(
    () =>
      slots
        .map((slot) => vehicles.find((vehicle) => vehicle.id === slot.vehicleId) ?? null)
        .filter((vehicle): vehicle is Vehicle => vehicle !== null),
    [slots]
  );

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
      setLoading(false);
    }

    checkAuthAndLoadData();

    return () => {
      mounted = false;
    };
  }, [router]);

  const attributeOptions = useMemo(() => getAttributeOptions(), []);

  const radarSeries = useMemo(
    () =>
      selectedVehicles.map((vehicle, index) => ({
        name: vehicleTitle(vehicle),
        color: RADAR_COLORS[index],
        dotClassName: RADAR_DOT_CLASSES[index],
        values: getRadarMetrics(vehicle),
      })),
    [selectedVehicles]
  );

  const comparisonRows = useMemo(
    () => getComparisonRows(selectedVehicles, selectedAttributes),
    [selectedVehicles, selectedAttributes]
  );

  function updateSlot(slotId: string, patch: Partial<ComparisonSlot>) {
    setSlots((currentSlots) =>
      currentSlots.map((slot) => (slot.id === slotId ? { ...slot, ...patch } : slot))
    );
  }

  function handleSelectVehicle(slotId: string, vehicleId: string) {
    const duplicate = slots.find((slot) => slot.id !== slotId && slot.vehicleId === vehicleId);

    if (duplicate) {
      Alert.alert('Veículo duplicado', `Este veículo já está selecionado no ${duplicate.label}.`);
      return;
    }

    updateSlot(slotId, { term: '', vehicleId });
  }

  function getExcludedVehicleIds(slotId: string) {
    return slots
      .filter((slot) => slot.id !== slotId && slot.vehicleId)
      .map((slot) => slot.vehicleId as string);
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
        <View
          className="h-full border-r border-[#D8E3F2] bg-white"
          style={{ width: selectorWidth }}
        >
          <View
            className="border-b border-[#D8E3F2] px-5 pb-5"
            style={{ paddingTop: insets.top + 28 }}
          >
            <View className="flex-row items-center justify-between gap-4">
              <Text className="flex-1 text-2xl font-bold text-[#00142E]" numberOfLines={1}>
                {userName}
              </Text>

              <TouchableOpacity
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Sair da conta"
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
              <VehicleSearchCard
                key={slot.id}
                slot={slot}
                vehicles={vehicles}
                excludedVehicleIds={getExcludedVehicleIds(slot.id)}
                compact
                onTermChange={(term) => updateSlot(slot.id, { term })}
                onSelect={(vehicleId) => handleSelectVehicle(slot.id, vehicleId)}
                onClear={() => updateSlot(slot.id, { term: '', vehicleId: null })}
              />
            ))}

            <AttributeSelector
              options={attributeOptions}
              selectedKeys={selectedAttributes}
              onChange={setSelectedAttributes}
            />
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

          <ComparisonTable vehicles={selectedVehicles} rows={comparisonRows} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F8FC]">
      <View
        className="border-b border-[#D8E3F2] bg-white px-4 pb-4"
        style={{ paddingTop: insets.top + 20 }}
      >
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-2xl font-bold text-[#00142E]" numberOfLines={1}>
            {userName}
          </Text>

          <TouchableOpacity
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            onPress={handleLogout}
            className="rounded-2xl border border-[#D8E3F2] bg-white px-4 py-3"
          >
            <Text className="text-sm font-bold text-[#00095B]">Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 14, gap: 14 }}>
        {slots.map((slot) => (
          <VehicleSearchCard
            key={slot.id}
            slot={slot}
            vehicles={vehicles}
            excludedVehicleIds={getExcludedVehicleIds(slot.id)}
            onTermChange={(term) => updateSlot(slot.id, { term })}
            onSelect={(vehicleId) => handleSelectVehicle(slot.id, vehicleId)}
            onClear={() => updateSlot(slot.id, { term: '', vehicleId: null })}
          />
        ))}

        <AttributeSelector
          options={attributeOptions}
          selectedKeys={selectedAttributes}
          onChange={setSelectedAttributes}
        />

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

        <ComparisonTable vehicles={selectedVehicles} rows={comparisonRows} />
      </ScrollView>
    </View>
  );
}
