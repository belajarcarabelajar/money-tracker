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
    const error = {
      error: {
        message: `Missing required environment variables: ${missing.join(', ')}`,
        category: 'ENV_MISSING'
      }
    };
    if (res && res.status) {
      return res.status(500).json(error);
    }
    console.error(error);
    process.exit(1);
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('Environment warnings:', warnings);
  }

  next();
}

export function validateEnvSync() {
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error({
      error: {
        message: `Missing required environment variables: ${missing.join(', ')}`,
        category: 'ENV_MISSING'
      }
    });
    process.exit(1);
  }
}

export default { validateEnv, validateEnvSync };
