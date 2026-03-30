const ImageStore = {
  storageKey: StorageKeys.IMAGE_SETS,

  getAll() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("ImageStore.getAll parse error:", error);
      return [];
    }
  },

  saveAll(imageSets) {
    localStorage.setItem(this.storageKey, JSON.stringify(imageSets));
  },

  getByExamId(examId) {
    return this.getAll().find((item) => item.examId === examId) || null;
  },

  createEmptyStandardImageSet(examId) {
    return {
      id: `imgset_std_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      examId,
      type: "standard",
      views: {
        front: [null, null, null],
        back: [null, null, null],
        left: [null, null, null],
        right: [null, null, null],
      },
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  ensureStandardImageSet(examId) {
    const current = this.getByExamId(examId);
    if (current) return current;

    const imageSet = this.createEmptyStandardImageSet(examId);
    const all = this.getAll();
    all.push(imageSet);
    this.saveAll(all);
    return imageSet;
  },

  saveSlot(examId, slotData) {
    const imageSet = this.ensureStandardImageSet(examId);
    const all = this.getAll();
    const index = all.findIndex((item) => item.id === imageSet.id);

    if (index === -1) return null;

    const viewArray = [...all[index].views[slotData.view]];
    viewArray[slotData.indexInView - 1] = slotData;

    all[index] = {
      ...all[index],
      views: {
        ...all[index].views,
        [slotData.view]: viewArray,
      },
      updatedAt: new Date().toISOString(),
    };

    all[index].completed = this.isImageSetComplete(all[index]);
    this.saveAll(all);
    return all[index];
  },

  getSlot(examId, view, indexInView) {
    const imageSet = this.getByExamId(examId);
    if (!imageSet) return null;

    const viewArray = imageSet.views[view] || [];
    return viewArray[indexInView - 1] || null;
  },

  countCaptured(examId) {
    const imageSet = this.getByExamId(examId);
    if (!imageSet) return 0;

    return Object.values(imageSet.views).reduce((sum, items) => {
      return sum + items.filter(Boolean).length;
    }, 0);
  },

  isImageSetComplete(imageSet) {
    const allViews = Object.values(imageSet.views);
    return allViews.every((items) => items.every(Boolean));
  },
};