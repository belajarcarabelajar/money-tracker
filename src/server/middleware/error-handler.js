const ERROR_CATEGORIES = {
  DB_CONNECTION: 'DB_CONNECTION',
  DB_QUERY: 'DB_QUERY',
  OLLAMA_CONNECTION: 'OLLAMA_CONNECTION',
  OLLAMA_RESPONSE: 'OLLAMA_RESPONSE',
  VALIDATION: 'VALIDATION',
  UNKNOWN: 'UNKNOWN'
};

function categorizeError(err) {
  if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
    return ERROR_CATEGORIES.DB_CONNECTION;
  }
  if (err.message?.includes('Ollama') || err.category === 'OLLAMA_CONNECTION' || err.category === 'OLLAMA_RESPONSE') {
    return err.category || ERROR_CATEGORIES.OLLAMA_CONNECTION;
  }
  if (err.code && (err.code.startsWith('22') || err.code === '42P01' || err.code === '23505')) {
    return ERROR_CATEGORIES.DB_QUERY;
  }
  if (err.status === 400 || err.status === 422) {
    return ERROR_CATEGORIES.VALIDATION;
  }
  return ERROR_CATEGORIES.UNKNOWN;
}

function getUserFriendlyMessage(err, category) {
  const messages = {
    [ERROR_CATEGORIES.DB_CONNECTION]: 'Tidak dapat terhubung ke database. Silakan coba lagi nanti.',
    [ERROR_CATEGORIES.DB_QUERY]: 'Gagal mengambil data transaksi. Silakan coba lagi.',
    [ERROR_CATEGORIES.OLLAMA_CONNECTION]: 'Server AI (Ollama) tidak berjalan. Pastikan Ollama sudah dinyalakan.',
    [ERROR_CATEGORIES.OLLAMA_RESPONSE]: 'Server AI sedang sibuk atau mengalami masalah. Silakan coba beberapa saat lagi.',
    [ERROR_CATEGORIES.VALIDATION]: err.message || 'Data yang dikirim tidak valid.',
    [ERROR_CATEGORIES.UNKNOWN]: err.message || 'Terjadi kesalahan yang tidak diketahui.'
  };
  return messages[category] || messages[ERROR_CATEGORIES.UNKNOWN];
}

export default function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  const status = err.status || err.statusCode || 500;
  const category = categorizeError(err);
  const userMessage = getUserFriendlyMessage(err, category);
  const isDev = process.env.NODE_ENV === 'development';

  res.status(status).json({
    error: {
      message: userMessage,
      category,
      status,
      timestamp: new Date().toISOString(),
      ...(isDev && {
        originalError: err.message,
        stack: err.stack
      })
    }
  });
}

export { ERROR_CATEGORIES, categorizeError, getUserFriendlyMessage };
