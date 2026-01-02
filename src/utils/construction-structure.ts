// 18 blocos: A até R
export const BLOCKS = Array.from({ length: 18 }, (_, i) => String.fromCharCode(65 + i)); // A, B, C, ..., R

// 5 andares, 4 apartamentos por andar
export const APARTMENTS_PER_BLOCK = 20;

// Gera a lista de números de apartamentos (101, 102, ..., 504)
export const generateApartmentNumbers = (): string[] => {
  const apartmentNumbers: string[] = [];
  for (let floor = 1; floor <= 5; floor++) {
    for (let unit = 1; unit <= 4; unit++) {
      apartmentNumbers.push(`${floor}0${unit}`);
    }
  }
  return apartmentNumbers;
};

// Áreas de circulação por andar e total
export const CIRCULATION_AREAS = ['CIR 1', 'CIR 2', 'CIR 3', 'CIR 4', 'CIR 5', 'CIR TD'];

// Lista completa de locais (Aptos + Circulações)
export const APARTMENT_NUMBERS = [...generateApartmentNumbers(), ...CIRCULATION_AREAS];

export const DEMAND_STATUSES = ['Pendente', 'Resolvido'];

// Locais de aplicação da cerâmica
export const CERAMIC_LOCATIONS = ['Apartamentos', 'Circulação', 'Sacada'];

// Locais de aplicação da pintura
export const PAINTING_LOCATIONS = ['Apartamento', 'Sacada', 'Banheiro', 'Circulação'];

// Status de rastreamento de pintura
export const PAINTING_STATUSES = ['Em Andamento', 'Finalizado', 'Entregue'];

// Demãos de pintura
export const PAINTING_COATS = ['Primeira Demão', 'Segunda Demão'];

// Tipos de aberturas para apartamentos
export const OPENING_TYPES_APARTMENT = ['Q1', 'Q2', 'Banheiro', 'Cozinha'];

// Tipos de aberturas para circulação (andares)
export const OPENING_TYPES_CIRCULATION = ['Circulação'];

// Tipos de aberturas especiais para apartamentos do 1º andar
export const OPENING_TYPES_FIRST_FLOOR = ['Poço'];

// Tipos de aberturas especiais para o 1º andar (entrada do bloco)
export const OPENING_TYPES_ENTRANCE = ['Entrada do Bloco'];

// Tipos de portas
export const DOOR_LOCATIONS = ['Entrada', 'Q1', 'Q2', 'Banheiro'];

// Status de rastreamento de portas
export const DOOR_STATUSES = ['Falta', 'Instalada', 'Corrigir', 'Entregue', 'Falta Arremate'];

// Tipos de Localização para Atribuições de Funcionários
export const ASSIGNMENT_LOCATION_TYPES = [
  'Bloco Todo',
  'Andar Específico',
  'Apartamento Específico',
  'Circulação Toda',
  'Andar da Circulação',
];

// Status de Atribuição
export const ASSIGNMENT_STATUSES = ['Em Andamento', 'Finalizado'];

// Critérios de Avaliação
export const RATING_CRITERIA = ['speed', 'quality', 'cleanliness', 'organization'] as const;