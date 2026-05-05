import api from "./authService";

const unwrap = (res) => res?.data?.data ?? res?.data ?? res;

const progressService = {
  _updateTimer: null,
  _pendingUpdate: null,

  async getLessonProgress(lessonId) {
    try {
      const res = await api.get(`/progress/lesson/${lessonId}`, {
        validateStatus: (status) => [200, 204].includes(status),
      });
      if (res.status === 204) {
        return { lessonId, watchedSeconds: 0, isCompleted: false };
      }
      return unwrap(res);
    } catch (error) {
      console.error(`Failed to get progress for lesson ${lessonId}:`, error);
      return { lessonId, watchedSeconds: 0, isCompleted: false };
    }
  },

  async getUserProgress() {
    try {
      const res = await api.get("/progress");
      return unwrap(res) || [];
    } catch (error) {
      console.error('❌ Failed to get user progress:', error);
      return [];
    }
  },

  async updateProgress(lessonId, watchedSeconds, isCompleted = false) {
    try {
      const payload = {
        lessonId,
        watchedSeconds: Math.floor(watchedSeconds),
        isCompleted,
      };
      const res = await api.post('/progress', payload);
      return unwrap(res);
    } catch (error) {
      console.error('❌ Failed to update progress:', error);
      return null;
    }
  },

  updateProgressDebounced(lessonId, watchedSeconds, isCompleted = false) {
    if (this._updateTimer) {
      clearTimeout(this._updateTimer);
    }
    this._pendingUpdate = { lessonId, watchedSeconds, isCompleted };
    this._updateTimer = setTimeout(async () => {
      if (this._pendingUpdate) {
        await this.updateProgress(
          this._pendingUpdate.lessonId,
          this._pendingUpdate.watchedSeconds,
          this._pendingUpdate.isCompleted
        );
        this._pendingUpdate = null;
      }
    }, 2000);
  },

  async updateProgressImmediate(lessonId, watchedSeconds, isCompleted = false) {
    if (this._updateTimer) {
      clearTimeout(this._updateTimer);
      this._updateTimer = null;
    }
    return await this.updateProgress(lessonId, watchedSeconds, isCompleted);
  }
};

export default progressService;