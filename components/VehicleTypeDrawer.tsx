import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

type VehicleTypeDrawerProps = {
  visible: boolean;
  categories: string[];
  selectedCategory: string | null;
  onClose: () => void;
  onSelect: (category: string | null) => void;
};

export function VehicleTypeDrawer({
  visible,
  categories,
  selectedCategory,
  onClose,
  onSelect,
}: VehicleTypeDrawerProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const drawerWidth = isTablet ? Math.round(width * 0.35) : Math.round(width * 0.86);

  const options = [null, ...categories];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 flex-row bg-black/25">
        <View className="h-full bg-white px-6 pt-7" style={{ width: drawerWidth }}>
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-[#00142E]">Tipo</Text>

            <TouchableOpacity onPress={onClose}>
              <Text className="text-sm font-bold text-[#00095B]">Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((category) => {
              const label = category ?? 'Todos';
              const active = category === selectedCategory;

              return (
                <TouchableOpacity
                  key={label}
                  activeOpacity={0.82}
                  onPress={() => onSelect(category)}
                  className={`mb-3 rounded-2xl border px-4 py-4 ${
                    active
                      ? 'border-[#00095B] bg-[#00095B]'
                      : 'border-[#D8E3F2] bg-[#F5F8FC]'
                  }`}
                >
                  <Text
                    className={`text-base font-bold ${active ? 'text-white' : 'text-[#00142E]'}`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <Pressable className="flex-1" onPress={onClose} />
      </View>
    </Modal>
  );
}
