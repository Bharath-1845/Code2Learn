const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('c2l_access_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Network request failed' }));
    throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Authentication API
export const authApi = {
  login: (data: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (data: any) => apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

// Curriculum API
export const curriculumApi = {
  getModes: () => apiRequest('/curriculum/modes'),
  getWorlds: (modeId = 'beginner') => apiRequest(`/curriculum/worlds?mode_id=${modeId}`),
  getLesson: (topicId: string) => apiRequest(`/curriculum/lesson/${topicId}`),
  completeLesson: (topicId: string) => apiRequest(`/curriculum/lesson/${topicId}/complete`, { method: 'POST' }),
  getMiniPractices: (topicId: string) => apiRequest(`/curriculum/mini-practice/${topicId}`),
  submitMiniPractices: (topicId: string, answers: any) =>
    apiRequest(`/curriculum/mini-practice/${topicId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
};

// Challenge & Execution API
export const challengeApi = {
  getChallenge: (topicId: string) => apiRequest(`/challenges/topic/${topicId}`),
  runCode: (code: string, stdin = '') =>
    apiRequest('/challenges/run', { method: 'POST', body: JSON.stringify({ code, stdin }) }),
  submitChallenge: (challengeId: string, code: string, conceptAnswer?: string) =>
    apiRequest('/challenges/submit', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId, code, concept_answer: conceptAnswer }),
    }),
  getGame: (topicId: string) => apiRequest(`/challenges/game/${topicId}`),
  submitGame: (gameId: string, score: number, completed: boolean) =>
    apiRequest(`/challenges/game/${gameId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ score, completed }),
    }),
  getBossBattle: (worldId: string) => apiRequest(`/challenges/boss/${worldId}`),
  submitBossBattle: (bossId: string, passed: boolean) =>
    apiRequest(`/challenges/boss/${bossId}/submit?boss_id=${bossId}&passed=${passed}`, { method: 'POST' }),
};

// Assessment API
export const assessmentApi = {
  getAssessment: (topicId: string) => apiRequest(`/assessments/topic/${topicId}`),
  submitAssessment: (topicId: string, answers: any[], timeTaken = 0) =>
    apiRequest(`/assessments/topic/${topicId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, time_taken_seconds: timeTaken }),
    }),
};

// Progress API
export const progressApi = {
  getDashboard: () => apiRequest('/progress/dashboard'),
  getAchievements: () => apiRequest('/progress/achievements'),
};

// AI API
export const aiApi = {
  getHint: (challengeId: string, userCode: string, hintLevel: number) =>
    apiRequest('/ai/hint', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId, user_code: userCode, hint_level: hintLevel }),
    }),
  explainConcept: (conceptTitle: string, userQuestion: string, userCode?: string) =>
    apiRequest('/ai/explain', {
      method: 'POST',
      body: JSON.stringify({ concept_title: conceptTitle, user_question: userQuestion, user_code: userCode }),
    }),
  getRecommendation: () => apiRequest('/ai/recommend'),
};

// Admin API
export const adminApi = {
  getStats: () => apiRequest('/admin/stats'),
  getUsers: () => apiRequest('/admin/users'),
  toggleUser: (userId: string) => apiRequest(`/admin/users/${userId}/status`, { method: 'POST' }),
  deleteUser: (userId: string) => apiRequest(`/admin/users/${userId}`, { method: 'DELETE' }),
};
