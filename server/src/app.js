const express = require('express');
const helmet = require('helmet');
const { requestContext, notFoundRoute, errorHandler } = require('#middleware/http');
const { requireUser, requirePatientAccess } = require('#middleware/auth');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.get('/ready', (_req, res) => res.status(200).json({ ok: true }));

app.use(helmet());
app.use(express.json({ limit: '200kb' }));
app.use(requestContext);

const scoped = [requireUser, requirePatientAccess];

app.use('/v1/auth', require('#modules/auth/auth.routes'));
app.use('/v1/drugs', require('#modules/drug/drug.routes'));
app.use('/v1/patients', require('#modules/capture/capture.routes'));
app.use('/v1/patients/:patientId/medications', scoped, require('#modules/medication/medication.routes'));
app.use('/v1/patients/:patientId/schedule', scoped, require('#modules/schedule/schedule.routes'));
app.use('/v1/patients/:patientId/labs', scoped, require('#modules/lab/lab.routes'));
app.use('/v1/patients/:patientId/flags', scoped, require('#modules/flag/flag.routes'));
app.use('/v1/patients/:patientId/card', scoped, require('#modules/card/card.routes'));
app.use('/v1/patients/:patientId/abha', scoped, require('#modules/abha/abha.routes'));
app.use('/v1/patients/:patientId/me', scoped, require('#modules/summary/summary.routes'));
app.use('/v1/patients', require('#modules/patient/patient.routes'));
app.use('/v1/links', require('#modules/link/link.routes'));
app.use('/v1/cards', require('#modules/card/card.public.routes'));
app.use('/v1/pharmacy', require('#modules/pharmacy/pharmacy.routes'));

app.use(notFoundRoute);
app.use(errorHandler);

module.exports = app;
