const sb = window.ackumenSupabase;
const $ = (s) => document.querySelector(s);
function notice(message, type='error') { const el=$('#form-notice'); if(!el) return; el.textContent=message; el.className='notice '+type; el.hidden=false; }
function clearNotice(){const el=$('#form-notice'); if(el) el.hidden=true;}
function ensureConfigured(){ if(!window.ackumenConfigured){notice('Connect your Supabase project first. Follow SETUP_SUPABASE.txt and edit js/supabase-config.js.'); return false;} return true; }
function friendlyError(error){ const m=error?.message || 'Something went wrong. Please try again.'; if(/already registered/i.test(m)) return 'An account with this email already exists. Please sign in.'; if(/invalid login credentials/i.test(m)) return 'Email or password is incorrect.'; if(/rate limit/i.test(m)) return 'Too many attempts. Please wait before trying again.'; return m; }
async function requireUser(){ if(!sb) return null; const {data:{session}}=await sb.auth.getSession(); if(!session){location.href='signin.html';return null;} return session.user; }
async function signOut(){ if(sb) await sb.auth.signOut(); location.href='index.html'; }
window.AckumenAuth={sb,$,notice,clearNotice,ensureConfigured,friendlyError,requireUser,signOut};
