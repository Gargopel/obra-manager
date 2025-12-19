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

export const APARTMENT_NUMBERS = generateApartmentNumbers();

export const DEMAND_STATUSES = ['Pendente', 'Resolvido'];

// Locais de aplicação da cerâmica
export const CERAMIC_LOCATIONS = ['Apartamentos', 'Circulação', 'Sacada'];

// Locais de aplicação da pintura
export const PAINTING_LOCATIONS = ['Apartamento', 'Sacada', 'Banheiro', 'Circulação'];

// Status de rastreamento de pintura
export const PAINTING_STATUSES = ['Em Andamento', 'Finalizado', 'Entregue'];