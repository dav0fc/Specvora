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

import { AttributeOption } from '../data/vehicles';

type AttributeSelectorProps = {
  options: AttributeOption[];
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
};

export function AttributeSelector({
  options,
  selectedKeys,
  onChange,
}: AttributeSelectorProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [visible, setVisible] = useState(false);
  const [term, setTerm] = useState('');

  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const filteredOptions = useMemo(() => {
    const search = term.trim().toLowerCase();

    if (!search) return options;

    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(search) ||
        option.category.toLowerCase().includes(search)
    );
  }, [options, term]);

  function toggleAttribute(key: string) {
    if (selectedSet.has(key)) {
      onChange(selectedKeys.filter((selectedKey) => selectedKey !== key));
      return;
    }

    onChange([...selectedKeys, key]);
  }

  function clearSelection() {
    onChange([]);
  }

  function close() {
    setVisible(false);
    setTerm('');
  }

  return (
    <View className="rounded-3xl border border-[#D8E3F2] bg-[#F8FAFD] p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-bold text-[#00142E]">Atributos</Text>
          <Text className="mt-1 text-xs font-bold uppercase tracking-[2px] text-[#517198]">
            {selectedKeys.length > 0 ? `${selectedKeys.length} selecionados` : 'Todos'}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => setVisible(true)}
          className="rounded-2xl bg-[#00095B] px-4 py-3"
        >
          <Text className="text-sm font-bold text-white">Selecionar</Text>
        </TouchableOpacity>
      </View>

      {selectedKeys.length > 0 && (
        <TouchableOpacity activeOpacity={0.82} onPress={clearSelection}>
          <Text className="text-sm font-bold text-[#00095B]">Mostrar todos</Text>
        </TouchableOpacity>
      )}

      <Modal visible={visible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/25 px-4">
          <View
            className="max-h-[82%] rounded-3xl bg-white p-5"
            style={{ width: isTablet ? 620 : '100%' }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-bold text-[#00142E]">Atributos</Text>
                <Text className="mt-1 text-xs font-bold uppercase tracking-[2px] text-[#517198]">
                  {selectedKeys.length > 0 ? `${selectedKeys.length} selecionados` : 'Todos'}
                </Text>
              </View>

              <TouchableOpacity onPress={close}>
                <Text className="text-sm font-bold text-[#00095B]">Fechar</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              className="mb-3 rounded-2xl border border-[#D8E3F2] bg-[#F5F8FC] px-4 py-3 text-base text-[#00142E]"
              placeholder="Buscar equipamento ou atributo"
              placeholderTextColor="#7C93AF"
              value={term}
              onChangeText={setTerm}
              autoCapitalize="none"
            />

            <View className="mb-3 flex-row gap-2">
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => onChange(options.map((option) => option.key))}
                className="flex-1 rounded-2xl border border-[#D8E3F2] bg-[#F5F8FC] px-4 py-3"
              >
                <Text className="text-center text-sm font-bold text-[#00095B]">
                  Selecionar todos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.82}
                onPress={clearSelection}
                className="flex-1 rounded-2xl border border-[#D8E3F2] bg-white px-4 py-3"
              >
                <Text className="text-center text-sm font-bold text-[#00095B]">
                  Limpar
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.key}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View className="h-px bg-[#EEF2F7]" />}
              ListEmptyComponent={
                <Text className="py-6 text-center text-sm font-semibold text-[#7C93AF]">
                  Nenhum atributo encontrado
                </Text>
              }
              renderItem={({ item }) => {
                const selected = selectedSet.has(item.key);

                return (
                  <Pressable
                    className="flex-row items-center py-4"
                    onPress={() => toggleAttribute(item.key)}
                  >
                    <View
                      className={`mr-3 h-5 w-5 rounded-md border ${
                        selected
                          ? 'border-[#00095B] bg-[#00095B]'
                          : 'border-[#D8E3F2] bg-white'
                      }`}
                    />

                    <View className="flex-1">
                      <Text className="text-sm font-bold text-[#00142E]">
                        {item.label}
                      </Text>
                      <Text className="mt-1 text-xs font-bold uppercase tracking-[2px] text-[#517198]">
                        {item.category}
                      </Text>
                    </View>
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
