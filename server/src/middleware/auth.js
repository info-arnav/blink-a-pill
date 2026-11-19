const { unauthorized, forbidden } = require('#lib/app-error');
const { verifySession } = require('#modules/auth/session.service');
const db = require('#lib/db');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const requireUser = async (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(unauthorized());
  const session = await verifySession(token, 'user');
  if (!session) return next(unauthorized());
  const user = await db.one('SELECT id, phone, name FROM users WHERE id = $1', [session.id]);
  if (!user) return next(unauthorized());
  req.user = { ...user, sessionId: session.sessionId };
  next();
};

const requirePharmacy = async (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(unauthorized());
  const session = await verifySession(token, 'pharmacy');
  if (!session) return next(unauthorized());
  const pharmacy = await db.one('SELECT id, name, licence_number, phone FROM pharmacies WHERE id = $1', [session.id]);
  if (!pharmacy) return next(unauthorized());
  req.pharmacy = { ...pharmacy, sessionId: session.sessionId };
  next();
};

const requirePatientAccess = async (req, _res, next) => {
  const patientId = req.params.patientId;
  if (!UUID.test(patientId ?? '')) return next(forbidden());
  const member = await db.one(
    'SELECT role FROM patient_members WHERE patient_id = $1 AND user_id = $2',
    [patientId, req.user.id],
  );
  if (!member) return next(forbidden());
  req.member = member;
  req.actor = { id: req.user.id, name: req.user.name, role: member.role };
  next();
};

module.exports = { requireUser, requirePharmacy, requirePatientAccess };
