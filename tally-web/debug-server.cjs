const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 4000 });
const sessions = new Map();

console.log('Debug Bridge Server running on ws://localhost:4000\n');

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const role = url.searchParams.get('role') || 'unknown';
  const sessionId = url.searchParams.get('sessionId') || 'default';
  
  if (!sessions.has(sessionId)) sessions.set(sessionId, { app: null, agents: new Set() });
  const session = sessions.get(sessionId);
  
  if (role === 'app') { session.app = ws; console.log('✅ App connected'); }
  else { session.agents.add(ws); console.log('✅ Agent connected'); }
  
  ws.on('message', (data) => {
    const session = sessions.get(sessionId);
    if (!session) return;
    try {
      const msg = JSON.parse(data.toString());
      console.log('[' + role + '] ' + msg.type);
      
      if (role === 'agent' && session.app?.readyState === WebSocket.OPEN) {
        session.app.send(data.toString());
      } else if (role === 'app') {
        session.agents.forEach(a => { if (a.readyState === WebSocket.OPEN) a.send(data.toString()); });
        if (msg.type === 'ui_tree') console.log('  ' + (msg.items?.length || 0) + ' elements');
      }
    } catch (e) {}
  });
  
  ws.on('close', () => {
    const session = sessions.get(sessionId);
    if (session) { if (role === 'app') session.app = null; else session.agents.delete(ws); }
    console.log('❌ ' + role + ' disconnected');
  });
});
