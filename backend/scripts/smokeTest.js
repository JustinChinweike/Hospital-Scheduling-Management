import fetch from 'node-fetch';

const API = process.env.API_URL || 'http://localhost:5000';

const log = (label, data) => console.log(`\n=== ${label} ===\n`, data);

async function run() {
  try {
    // Register temp user
    const email = `user_${Date.now()}@example.com`;
    let res = await fetch(`${API}/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username:'tempuser', email, password:'password' })});
    const reg = await res.json();
    log('Register', reg);

    res = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password:'password' })});
    const login = await res.json();
    log('Login', login);
    const token = login.token;
    if (!token) throw new Error('Login failed');

    // Create schedule
    res = await fetch(`${API}/schedules`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body: JSON.stringify({ doctorName:'Dr Test', patientName:'Patient X', dateTime:new Date().toISOString(), department:'Cardiology' })});
    const created = await res.json();
    log('Create Schedule', created);

    // List schedules
    res = await fetch(`${API}/schedules?page=1&limit=5`, { headers:{'Authorization':`Bearer ${token}`} });
    const list = await res.json();
    log('List Schedules', list);

    console.log('\nSmoke test finished.');
  } catch (e) {
    console.error('Smoke test failed:', e.message);
    process.exit(1);
  }
}

run();