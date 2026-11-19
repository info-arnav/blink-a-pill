const TZ = 'Asia/Kolkata';

const todayIst = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

const nowTimeIst = () =>
  new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());

const addDays = (isoDate, days) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const daysBetween = (from, to) =>
  Math.round((new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000);

const ageFrom = (birthYear) => Number(todayIst().slice(0, 4)) - birthYear;

module.exports = { todayIst, nowTimeIst, addDays, daysBetween, ageFrom };
