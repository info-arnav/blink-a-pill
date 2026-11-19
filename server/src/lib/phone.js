const toE164India = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return null;
};

const maskPhone = (phone) => `+${phone.slice(0, 2)} ${'•'.repeat(6)}${phone.slice(-4)}`;

module.exports = { toE164India, maskPhone };
