const db = require('#lib/db');
const schedule = require('#modules/schedule/schedule.service');
const medication = require('#modules/medication/medication.service');
const flag = require('#modules/flag/flag.service');

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const answers = async (patientId) => {
  const [today, meds, openFlags, courses] = await Promise.all([
    schedule.day(patientId),
    medication.list(patientId, false),
    flag.list(patientId, { openOnly: true }),
    medication.coursesDue(patientId),
  ]);
  const remaining = today.doses.filter((d) => d.status === 'upcoming' || d.status === 'due');
  const missed = today.doses.filter((d) => d.status === 'missed');
  const taken = today.doses.filter((d) => d.status === 'taken');
  const antibiotics = meds.filter((m) => m.is_antibiotic);

  const list = [
    {
      id: 'today',
      question: 'What do I take today?',
      answer: today.doses.length
        ? today.doses.map((d) => `${d.time}: ${d.name}, ${d.amount}${d.meal ? `, ${d.meal}` : ''}`).join('\n')
        : 'Nothing is scheduled for today.',
    },
    {
      id: 'next',
      question: 'What is my next medicine?',
      answer: today.next ? `${today.next.name} at ${today.next.time}, ${today.next.amount}${today.next.meal ? `, ${today.next.meal}` : ''}.` : 'You are done for today.',
    },
    {
      id: 'progress',
      question: 'Have I taken everything?',
      answer: `Taken: ${plural(taken.length, 'dose')}. Still to take: ${plural(remaining.length, 'dose')}. Marked missed: ${plural(missed.length, 'dose')}.${
        missed.length ? ' If you missed a dose, do not take two at once. Ask your pharmacist what to do.' : ''
      }`,
    },
    {
      id: 'concerns',
      question: 'Is anything wrong with my medicines?',
      answer: openFlags.length
        ? `There ${openFlags.length === 1 ? 'is 1 thing' : `are ${openFlags.length} things`} to check with your doctor: ${openFlags.map((f) => f.title).join('; ')}. Do not stop or change anything on your own.`
        : 'Nothing is waiting for a doctor right now.',
    },
  ];
  if (antibiotics.length) {
    list.push({
      id: 'antibiotics',
      question: 'How long is my antibiotic course?',
      answer: antibiotics
        .map((m) => (m.days_left != null ? `${m.name}: ${plural(m.days_left, 'day')} left, finishing on ${m.end_date}.` : `${m.name}: no end date recorded. Ask your doctor how many days.`))
        .join('\n'),
    });
  }
  return { questions: list, courses_due: courses };
};

const notifications = (patientId) =>
  db.many('SELECT id, kind, title, body, flag_id, read_at, created_at FROM notifications WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 50', [patientId]);

const markRead = (patientId) => db.query('UPDATE notifications SET read_at = now() WHERE patient_id = $1 AND read_at IS NULL', [patientId]);

module.exports = { answers, notifications, markRead };
