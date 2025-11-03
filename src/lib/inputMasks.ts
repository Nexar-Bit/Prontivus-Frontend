export function onlyDigits(value: string): string {
  return (value || '').replace(/\D+/g, '');
}

// CPF: 000.000.000-00
export function maskCPF(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  const parts = [] as string[];
  if (digits.length > 3) parts.push(digits.slice(0, 3));
  if (digits.length > 6) parts.push(digits.slice(3, 6));
  if (digits.length > 9) parts.push(digits.slice(6, 9));
  const rest = digits.slice(9);
  let out = '';
  if (digits.length <= 3) out = digits;
  else if (digits.length <= 6) out = `${digits.slice(0,3)}.${digits.slice(3)}`;
  else if (digits.length <= 9) out = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
  else out = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
  return out;
}

export function validateCPF(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(cpf.charAt(10));
}

// Phone masks
export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 10) {
    // (00) 0000-0000
    const part1 = d.slice(0, 2);
    const part2 = d.slice(2, 6);
    const part3 = d.slice(6, 10);
    if (d.length <= 2) return `(${part1}`;
    if (d.length <= 6) return `(${part1}) ${part2}`;
    return `(${part1}) ${part2}-${part3}`;
  }
  // 11 digits -> mobile (00) 00000-0000
  const part1 = d.slice(0, 2);
  const part2 = d.slice(2, 7);
  const part3 = d.slice(7, 11);
  return `(${part1}) ${part2}-${part3}`;
}

export function validatePhone(value: string): boolean {
  const d = onlyDigits(value);
  return d.length === 10 || d.length === 11;
}

// Date dd/mm/yyyy
export function maskDate(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`;
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
}

export function validateDate(value: string): boolean {
  const m = /^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/(\d{4})$/.exec(value || '');
  if (!m) return false;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  const dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
}

// CEP 00000-000 with lookup
export function maskCEP(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0,5)}-${d.slice(5)}`;
}

export async function lookupAddressByCEP(cep: string): Promise<{
  street?: string; neighborhood?: string; city?: string; state?: string;
} | null> {
  const d = onlyDigits(cep);
  if (d.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
    const data = await res.json();
    if (data && !data.erro) {
      return {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      };
    }
    return null;
  } catch {
    return null;
  }
}


