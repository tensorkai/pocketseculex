// Local test server only. Never imported by application code.
import { createServer } from 'node:http';
const person = '00000000-0000-0000-0000-000000000001';
const responder = '00000000-0000-0000-0000-000000000002';
const pending = '00000000-0000-0000-0000-000000000003';
const branch = { id: '10000000-0000-0000-0000-000000000001', name: 'Central Rescue Station', jurisdiction: 'Manila', latitude: 14.605, longitude: 120.99, contact_phone: '+63281234567' };
const incident = { id: '30000000-0000-0000-0000-000000000001', owner_id: person, organization_id: branch.id, status: 'received', triggered_at: '2026-10-31T08:00:00Z', latitude: 14.59, longitude: 120.98, brief: 'User requested assistance. Confirm the situation before deployment.', brief_status: 'ready' };
let status = 'received';
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:54321');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, apikey, content-type, x-client-info, x-supabase-api-version, prefer, accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  let body = '';
  for await (const chunk of req) body += chunk;
  const send = (value, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
  if (url.pathname === '/__test/reset') { status = 'received'; return send({}); }
  if (url.pathname === '/__test/dispatch') { status = 'dispatched'; return send({}); }
  if (url.pathname === '/') return send({ ready: true });
  let id;
  try { id = JSON.parse(Buffer.from(req.headers.authorization.split(' ')[1].split('.')[1], 'base64url').toString()).sub; } catch {}
  const lgu = id === responder || id === pending;
  const user = { id, email: `${lgu ? 'responder' : 'personal'}@example.test`, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} };
  if (url.pathname === '/auth/v1/user') return id ? send(user) : send({ message: 'No session' }, 401);
  if (!id) return send({ message: 'No session' }, 401);
  const table = url.pathname.split('/').at(-1);
  if (table === 'profiles') return send({ id, account_type: lgu ? 'lgu' : 'user', full_name: lgu ? 'Alex Responder' : 'Sam Santos', phone: '+639171234567' });
  if (table === 'lgu_memberships') return send(id === responder ? [{ organization_id: branch.id, active: true, department: 'rescue' }] : []);
  if (table === 'lgu_access_requests') return send(null);
  if (table === 'devices') return send([{ id: 'device-1', serial_number: 'PSX-001', active: true }]);
  if (table === 'organizations') return send(id === pending ? [] : [branch]);
  if (table === 'latest_incident_locations') return send(id === pending ? [] : [{ incident_id: incident.id, latitude: 14.5995, longitude: 120.9842, recorded_at: '2026-10-31T08:05:00Z' }]);
  if (table === 'location_updates') return send({ latitude: 14.5995, longitude: 120.9842, recorded_at: '2026-10-31T08:05:00Z' });
  if (table === 'responder_locations') return send(null);
  if (table === 'incidents') {
    if (req.method === 'PATCH') {
      if (id !== responder || url.searchParams.get('status') !== `eq.${status}`) return send({ message: 'Conflict' }, 409);
      status = JSON.parse(body).status;
      return send({ id: incident.id });
    }
    return send(id === pending ? [] : [{ ...incident, status }]);
  }
  return send({ message: 'Unexpected fixture request' }, 404);
}).listen(54321, '127.0.0.1');
