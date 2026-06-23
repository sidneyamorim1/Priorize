import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // CORS Headers
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  const { to_email, subject, message } = request.body;

  if (!to_email || !subject || !message) {
    return response.status(400).json({ error: 'Parâmetros em falta: to_email, subject, message são obrigatórios.' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return response.status(500).json({ 
      error: 'A chave RESEND_API_KEY não está configurada no ambiente do servidor.' 
    });
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'Priorize <onboarding@resend.dev>',
        to: [to_email],
        subject: subject,
        text: message,
        html: `<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); padding: 24px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; tracking-wide: uppercase; letter-spacing: 0.05em;">Priorize</h1>
          </div>
          <div style="padding: 24px 16px;">
            <h3 style="margin-top: 0; color: #1e293b; font-size: 16px; font-weight: 750;">Olá,</h3>
            <p style="white-space: pre-wrap; font-size: 14px; color: #475569;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
            Este é um e-mail automático enviado pelo seu aplicativo Priorize.
          </div>
        </div>`
      })
    });

    if (res.ok) {
      const data = await res.json();
      return response.status(200).json({ success: true, data });
    } else {
      const errorText = await res.text();
      return response.status(500).json({ error: `Erro na API do Resend: ${errorText}` });
    }
  } catch (err: any) {
    console.error(err);
    return response.status(500).json({ error: err.message || 'Erro interno no servidor.' });
  }
}
