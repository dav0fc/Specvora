#!/usr/bin/env node
/**
 * Validações do Specvora (rodar com: npm run validate)
 *
 * 1. IDs de veículos únicos em data/vehicles.json;
 * 2. Toda chave de specs dos veículos existe no specSchema.json (e vice-versa:
 *    todo spec do schema é usado pelo menos uma vez) + tipos coerentes
 *    (specs type "number" não podem vir como string);
 * 3. baseVehicleId sempre aponta para um id existente;
 * 4. Ranger Raptor (caso de validação do Pedido_Desafio.txt): resolve a
 *    herança e compara com os valores esperados do slide oficial.
 *
 * Saída: 0 = tudo ok · 1 = falhou.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const schema = JSON.parse(
  readFileSync(join(root, 'data/specSchema.json'), 'utf8')
);
const db = JSON.parse(readFileSync(join(root, 'data/vehicles.json'), 'utf8'));

const errors = [];
const warnings = [];

// ---------------------------------------------------------------------------
// 1. IDs únicos
// ---------------------------------------------------------------------------
const seenIds = new Map();
for (const vehicle of db.vehicles) {
  if (seenIds.has(vehicle.id)) {
    errors.push(
      `ID duplicado: "${vehicle.id}" (${seenIds.get(vehicle.id)} e ${vehicle.model} ${vehicle.version}).`
    );
  }
  seenIds.set(vehicle.id, `${vehicle.model} ${vehicle.version}`);
}

// ---------------------------------------------------------------------------
// 2. Chaves de specs ↔ schema + tipos
// ---------------------------------------------------------------------------
const schemaKeys = new Map();
for (const category of schema.categories) {
  for (const spec of category.specs) {
    if (schemaKeys.has(spec.key)) {
      errors.push(`Chave duplicada no schema: "${spec.key}".`);
    }
    schemaKeys.set(spec.key, spec);
  }
}

const usedKeys = new Set();
for (const vehicle of db.vehicles) {
  for (const [key, value] of Object.entries(vehicle.specs)) {
    usedKeys.add(key);

    const spec = schemaKeys.get(key);

    if (!spec) {
      errors.push(`${vehicle.id}: spec fora do schema: "${key}".`);
      continue;
    }

    if (spec.type === 'number' && typeof value === 'string') {
      errors.push(
        `${vehicle.id}: "${key}" é type number no schema, mas veio string (${JSON.stringify(value)}).`
      );
    }

    if (spec.type === 'boolean' && typeof value !== 'boolean' && value !== null) {
      warnings.push(
        `${vehicle.id}: "${key}" é type boolean no schema, mas veio ${typeof value}.`
      );
    }
  }
}

for (const key of schemaKeys.keys()) {
  if (!usedKeys.has(key)) {
    warnings.push(`Spec do schema nunca preenchida por nenhum veículo: "${key}".`);
  }
}

// ---------------------------------------------------------------------------
// 3. baseVehicleId existente
// ---------------------------------------------------------------------------
for (const vehicle of db.vehicles) {
  if (vehicle.baseVehicleId && !seenIds.has(vehicle.baseVehicleId)) {
    errors.push(
      `${vehicle.id}: baseVehicleId não encontrado: "${vehicle.baseVehicleId}".`
    );
  }
}

// ---------------------------------------------------------------------------
// 4. Ranger Raptor — valores do slide (P0-2)
//    Estes são os valores que o app DEVE exibir para a validação do desafio.
//    Se o slide oficial mudar, atualize esta tabela.
// ---------------------------------------------------------------------------
function resolveVehicle(record, source, seen = new Set()) {
  if (!record.baseVehicleId) return { ...record, specs: { ...record.specs } };
  if (seen.has(record.id)) {
    throw new Error(`Referência circular no veículo ${record.id}.`);
  }

  const base = source.find((item) => item.id === record.baseVehicleId);
  if (!base) return { ...record, specs: { ...record.specs } };

  seen.add(record.id);
  const resolvedBase = resolveVehicle(base, source, seen);
  seen.delete(record.id);

  return {
    ...record,
    specs: { ...resolvedBase.specs, ...record.specs },
  };
}

const RAPTOR_ID = 'ford-ranger-raptor-3-0-v6-ecoboost-2026';
const raptorRecord = db.vehicles.find((vehicle) => vehicle.id === RAPTOR_ID);

if (!raptorRecord) {
  errors.push(`Ranger Raptor não encontrado no banco (id: ${RAPTOR_ID}).`);
} else {
  const raptor = resolveVehicle(raptorRecord, db.vehicles);

  const expected = {
    peso_em_ordem_de_marchas: 2475,
    cilindrada: 3, // litros, 1 decimal (convenção do schema) → exibido "3.0 L"
    potencia: 397,
    torque: 583,
    economia_de_combustivel: 8.3,
    motor_diesel: false,
    tecnologia_biturbo: true,
    polegadas: 17,
    pneus_atr_plus_60_40: true,
    trail_control: true,
    suspensao_off_road_fox_live_valve_eixo_frontal_traseiro: true,
    terrain_management_system_modes_auto_sand_snow_mud_rock: true,
    tracao_integral_awd: true,
    airbag_cada: 7,
    multimedia_polegadas: 12,
    camera_360_graus: true,
    piloto_automatico_adaptativo: true,
    sistema_de_monitoramento_de_ponto_cego_blis: true,
    classificacao_inmetro_geral: 'E',
  };

  for (const [key, value] of Object.entries(expected)) {
    const actual = raptor.specs[key];
    if (actual !== value) {
      errors.push(
        `Ranger Raptor: "${key}" esperado ${JSON.stringify(value)}, veio ${JSON.stringify(actual)}.`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------
if (warnings.length > 0) {
  console.log(`⚠️  ${warnings.length} aviso(s):`);
  for (const warning of warnings) console.log(`   - ${warning}`);
}

if (errors.length > 0) {
  console.error(`❌ ${errors.length} erro(s):`);
  for (const error of errors) console.error(`   - ${error}`);
  process.exit(1);
}

console.log('✅ Validações ok: ids únicos, specs × schema, heranças e Ranger Raptor.');
