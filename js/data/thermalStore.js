const ThermalStore = {
  storageKey: "skoliose_thermal_sets_v1",

  getAll() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("ThermalStore.getAll parse error:", error);
      return [];
    }
  },

  saveAll(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  },

  getByExamId(examId) {
    return this.getAll().find((item) => item.examId === examId) || null;
  },

  createEmptySet(examId) {
    return {
      id: `thermal_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      examId,
      type: "thermal",
      views: {
        back: [null, null, null],
        left45: [null, null, null],
        right45: [null, null, null],
      },
      deviceType: "HIKMICRO Import",
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  ensureSet(examId) {
    const current = this.getByExamId(examId);
    if (current) return current;

    const set = this.createEmptySet(examId);
    const all = this.getAll();
    all.push(set);
    this.saveAll(all);
    return set;
  },

  saveSlot(examId, slotData) {
    const set = this.ensureSet(examId);
    const all = this.getAll();
    const index = all.findIndex((item) => item.id === set.id);
    if (index === -1) return null;

    const viewItems = [...all[index].views[slotData.view]];
    viewItems[slotData.indexInView - 1] = slotData;

    all[index] = {
      ...all[index],
      views: {
        ...all[index].views,
        [slotData.view]: viewItems,
      },
      completed: this.isComplete({
        ...all[index],
        views: {
          ...all[index].views,
          [slotData.view]: viewItems,
        },
      }),
      updatedAt: new Date().toISOString(),
    };

    this.saveAll(all);
    return all[index];
  },

  getSlot(examId, view, indexInView) {
    const set = this.getByExamId(examId);
    if (!set) return null;

    const items = set.views[view] || [];
    return items[indexInView - 1] || null;
  },

  countImported(examId) {
    const set = this.getByExamId(examId);
    if (!set) return 0;

    return Object.values(set.views).reduce((sum, items) => {
      return sum + items.filter(Boolean).length;
    }, 0);
  },

  isComplete(set) {
    return Object.values(set.views).every((items) => items.every(Boolean));
  },
};