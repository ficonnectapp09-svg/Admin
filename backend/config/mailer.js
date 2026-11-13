const nodemailer = require('nodemailer');

const createTransporter = (overridePort = null) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  // Default to port 587 for cloud reliability (port 465 is frequently blocked by cloud firewalls like Render)
  const defaultPort = Number(process.env.SMTP_PORT) || 587;
  const port = overridePort || defaultPort;
  // Port 465 is direct SSL; port 587 uses STARTTLS (secure: false with automatic TLS upgrade)
  const secure = port === 465;
  const user = ((process.env.SMTP_USER && process.env.SMTP_USER.trim()) || 'ficonnectblr@gmail.com').trim();
  const rawPass = (process.env.SMTP_PASS && process.env.SMTP_PASS.trim()) || '';
  // Strip spaces from Gmail 16-character App Password
  const pass = rawPass.replace(/\s+/g, '');

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    },
    // Balanced timeouts for cloud server reliability (avoids hanging boot processes)
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
};

const getTransporter = () => {
  return createTransporter();
};

const verifyTransporter = async () => {
  try {
    const user = ((process.env.SMTP_USER && process.env.SMTP_USER.trim()) || 'ficonnectblr@gmail.com').trim();
    const rawPass = (process.env.SMTP_PASS && process.env.SMTP_PASS.trim()) || '';

    // If SMTP_PASS is missing or empty, skip active verification gracefully without throwing ETIMEDOUT
    if (!rawPass) {
      console.warn('⚠️ [SMTP Mailer] SMTP_PASS not configured in environment. Skipping active SMTP verification during startup.');
      return false;
    }

    const primaryPort = Number(process.env.SMTP_PORT) || 587;
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';

    console.log(`[SMTP Mailer] Attempting SMTP verification (${host}:${primaryPort})...`);
    console.log('SMTP user:', user);

    try {
      const primaryTransporter = createTransporter(primaryPort);
      await primaryTransporter.verify();
      console.log(`✅ [SMTP Mailer] Connection verified successfully on host: ${host}, port: ${primaryPort}`);
      return true;
    } catch (primaryErr) {
      // If primary port failed (e.g. timeout on blocked cloud port), try alternate port fallback
      const fallbackPort = primaryPort === 587 ? 465 : 587;
      console.warn(`⚠️ [SMTP Mailer] Primary port ${primaryPort} connection issue (${primaryErr.code || primaryErr.message}). Attempting fallback to port ${fallbackPort}...`);

      try {
        const fallbackTransporter = createTransporter(fallbackPort);
        await fallbackTransporter.verify();
        console.log(`✅ [SMTP Mailer] Connection verified successfully via fallback port: ${fallbackPort}`);
        return true;
      } catch (fallbackErr) {
        console.error('SMTP ERROR:', {
          code: primaryErr.code || fallbackErr.code,
          response: primaryErr.response || fallbackErr.response,
          command: primaryErr.command || fallbackErr.command,
          message: primaryErr.message || fallbackErr.message
        });
        return false;
      }
    }
  } catch (error) {
    console.error('SMTP ERROR:', {
      code: error.code,
      response: error.response,
      command: error.command,
      message: error.message
    });
    return false;
  }
};

module.exports = {
  getTransporter,
  createTransporter,
  verifyTransporter
};
