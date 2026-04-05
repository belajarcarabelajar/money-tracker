export function validateEnv(req, res, next) {
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);

  const warnings = [];

  if (!process.env.OLLAMA_HOST) {
    warnings.push(`OLLAMA_HOST not set, defaulting to http://localhost:11434`);
  }
  if (!process.env.OLLAMA_MODEL) {
    warnings.push(`OLLAMA_MODEL not set, defaulting to gemma4:31b-cloud`);
  }

  if (missing.length > 0) {
    return res.status(500).json({
      error: {
        message: `Missing required environment variables: ${missing.join(', ')}`,
        category: 'ENV_MISSING'
      }
    });
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('Environment warnings:', warnings);
  }

  next();
}

export default { validateEnv };
