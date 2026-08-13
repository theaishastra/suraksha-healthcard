const CONFIG = {
  SUPABASE_URL:      'https://elxsdgiwdpqlmscibynh.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseHNkZ2l3ZHBxbG1zY2lieW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MTUxMTAsImV4cCI6MjEwMjA5MTExMH0.jSbu7G-ckyJwFvUTQsDZ1IwKb8eyq3Hln9ZCpe23ZnE',
  BUCKET_AADHAR:     'aadhar',
  BUCKET_SELFIE:     'selfie',
  BUCKET_CARDS:      'cards',
  // Google Apps Script Web App URL (ends in /exec) — from appscript/Code.gs deployment.
  APPSCRIPT_EMAIL_URL: 'https://script.google.com/macros/s/AKfycbzynoWbwrORQr8oTWByeIYQ0SOGa8qFcqgzPPDj1QkPrqpf4MTzTSEIq8bc9MdGFQk_/exec',
  YEAR_PREFIX:       String(new Date().getFullYear()).slice(-2),
};
Object.freeze(CONFIG);
