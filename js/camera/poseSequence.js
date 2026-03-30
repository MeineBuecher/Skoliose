const PoseSequence = {
  getAll() {
    return CaptureSequence;
  },

  getByIndex(index) {
    return CaptureSequence[index] || null;
  },

  getNextIndex(index) {
    return index < CaptureSequence.length - 1 ? index + 1 : null;
  },

  getPreviousIndex(index) {
    return index > 0 ? index - 1 : null;
  },

  getTotal() {
    return CaptureSequence.length;
  },
};