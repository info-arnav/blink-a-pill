const FREQUENCIES = Object.freeze({
  OD: { label: 'Once a day', times: ['08:00'] },
  BD: { label: 'Twice a day', times: ['08:00', '20:00'] },
  TID: { label: 'Three times a day', times: ['08:00', '14:00', '20:00'] },
  QID: { label: 'Four times a day', times: ['07:00', '12:00', '17:00', '22:00'] },
  HS: { label: 'At bedtime', times: ['21:30'] },
  CUSTOM: { label: 'At set times', times: [] },
});

const timesFromPattern = (pattern) => {
  if (!pattern) return null;
  const parts = pattern.split(/[-–]/).map((p) => p.trim());
  if (parts.length !== 3 || parts.some((p) => !/^\d+(\.\d+)?$|^½$/.test(p))) return null;
  const slots = ['08:00', '14:00', '21:00'];
  const times = slots.filter((_, i) => parts[i] !== '0');
  return times.length ? times : null;
};

module.exports = { FREQUENCIES, timesFromPattern };
