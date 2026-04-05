const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'phi3:latest';

export async function checkOllamaHealth() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        healthy: false,
        serverHealthy: true,
        error: `Ollama server returned status ${response.status}`,
        details: await response.text()
      };
    }

    const data = await response.json();
    const availableModels = data.models?.map(m => m.name) || [];
    const modelAvailable = availableModels.includes(MODEL);

    return {
      healthy: modelAvailable,
      serverHealthy: true,
      availableModels,
      modelAvailable,
      configuredModel: MODEL,
      error: modelAvailable ? null : `Model ${MODEL} is not available. Please run: ollama pull ${MODEL}`
    };
  } catch (err) {
    const isConnectionRefused = err.code === 'ECONNREFUSED' ||
      err.message?.includes('fetch') ||
      err.message?.includes('ECONNREFUSED') ||
      err.cause?.code === 'ECONNREFUSED';

    if (isConnectionRefused) {
      return {
        healthy: false,
        serverHealthy: false,
        error: 'Server AI (Ollama) tidak berjalan. Pastikan Ollama sudah dinyalakan.',
        details: `Connection refused to ${OLLAMA_HOST}`
      };
    }

    if (err.name === 'AbortError') {
      return {
        healthy: false,
        serverHealthy: false,
        error: 'Server AI (Ollama) tidak merespons. Pastikan Ollama sudah dinyalakan.',
        details: `Connection timed out to ${OLLAMA_HOST}`
      };
    }

    return {
      healthy: false,
      serverHealthy: false,
      error: 'Gagal terhubung ke server AI. Silakan coba lagi nanti.',
      details: err.message
    };
  }
}

export default { checkOllamaHealth };
