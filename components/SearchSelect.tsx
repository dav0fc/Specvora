import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

type SearchSelectProps = {
  label: string;
  value: string | null;
  options: string[];
  disabled?: boolean;
  compact?: boolean;
  onSelect: (value: string) => void;
};

export function SearchSelect({
  label,
  value,
  options,
  disabled = false,
  compact = false,
  onSelect,
}: SearchSelectProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [visible, setVisible] = useState(false);
  const [term, setTerm] = useState('');

  const filteredOptions = useMemo(() => {
    const search = term.trim().toLowerCase();

    if (!search) return options;

    return options.filter((option) => option.toLowerCase().includes(search));
  }, [options, term]);

  function open() {
    if (!disabled && options.length > 0) {
      setVisible(true);
    }
  }

  function close() {
    setVisible(false);
    setTerm('');
  }

  return (
    <View className={compact ? 'mb-2' : 'mb-3'}>
      <Text className="mb-2 text-xs font-bold uppercase tracking-[2px] text-[#517198]">
        {label}
      </Text>

      <TouchableOpacity
        activeOpacity={disabled ? 1 : 0.82}
        onPress={open}
        className={`rounded-2xl border px-4 ${
          compact ? 'py-3' : 'py-4'
        } ${
          disabled ? 'border-[#E2E8F0] bg-[#F1F5F9]' : 'border-[#D8E3F2] bg-white'
        }`}
      >
        <View className="flex-row items-center justify-between gap-3">
          <Text
            className={`flex-1 ${
              compact ? 'text-sm' : 'text-base'
            } ${value ? 'font-bold text-[#00142E]' : 'font-semibold text-[#7C93AF]'}`}
            numberOfLines={1}
          >
            {value ?? 'Selecionar'}
          </Text>
          <Text className="text-base font-bold text-[#00095B]">＋</Text>
        </View>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/25 px-4">
          <View
            className="max-h-[76%] rounded-3xl bg-white p-5"
            style={{ width: isTablet ? 520 : '100%' }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-[#00142E]">{label}</Text>
              <TouchableOpacity onPress={close}>
                <Text className="text-sm font-bold text-[#00095B]">Fechar</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              className="mb-3 rounded-2xl border border-[#D8E3F2] bg-[#F5F8FC] px-4 py-3 text-base text-[#00142E]"
              placeholder="Buscar"
              placeholderTextColor="#7C93AF"
              value={term}
              onChangeText={setTerm}
              autoCapitalize="none"
            />

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View className="h-px bg-[#EEF2F7]" />}
              ListEmptyComponent={
                <Text className="py-6 text-center text-sm font-semibold text-[#7C93AF]">
                  Nenhum item
                </Text>
              }
              renderItem={({ item }) => {
                const selected = item === value;

                return (
                  <Pressable
                    className="py-4"
                    onPress={() => {
                      onSelect(item);
                      close();
                    }}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        selected ? 'text-[#00095B]' : 'text-[#00142E]'
                      }`}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
