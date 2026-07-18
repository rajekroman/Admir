const STATUS = Object.freeze({
  NOT_STARTED: "notStarted",
  ACTIVE: "active",
  COMPLETED: "completed",
});

export class QuestManager {
  constructor(definitions, snapshot = null) {
    this.definitions = definitions;
    this.states = {};
    this.trackedQuestId = null;
    this.sequence = 0;
    if (snapshot) this.restore(snapshot);
  }

  start(questId) {
    const definition = this.definitions[questId];
    if (!definition) throw new Error(`Neznámý quest: ${questId}`);
    if (this.getStatus(questId) !== STATUS.NOT_STARTED) return { changed: false, notifications: [], rewards: [] };

    this.sequence += 1;
    this.states[questId] = {
      status: STATUS.ACTIVE,
      stageIndex: 0,
      objectiveProgress: {},
      startedOrder: this.sequence,
      completedOrder: null,
    };
    if (!this.trackedQuestId) this.trackedQuestId = questId;

    return {
      changed: true,
      notifications: [
        { type: "quest", message: `Nový úkol: ${definition.title}` },
        { type: "objective", message: this.getCurrentStage(questId)?.title || "Nový cíl" },
      ],
      rewards: [],
    };
  }

  emit(type, target, amount = 1) {
    const notifications = [];
    const rewards = [];
    let changed = false;

    for (const questId of Object.keys(this.states)) {
      const state = this.states[questId];
      if (state.status !== STATUS.ACTIVE) continue;
      const definition = this.definitions[questId];
      const stage = definition.stages[state.stageIndex];
      if (!stage) continue;
      let questChanged = false;

      for (const objective of stage.objectives) {
        if (objective.event !== type || objective.target !== target) continue;
        const required = objective.count ?? 1;
        const current = state.objectiveProgress[objective.id] || 0;
        if (current >= required) continue;
        const next = Math.min(required, current + Math.max(1, amount));
        state.objectiveProgress[objective.id] = next;
        changed = true;
        questChanged = true;
        notifications.push({
          type: "objective",
          message: required > 1 ? `${objective.label}: ${next}/${required}` : `Splněno: ${objective.label}`,
        });
      }

      if (questChanged && this.#isStageComplete(questId)) {
        const result = this.#advance(questId);
        notifications.push(...result.notifications);
        rewards.push(...result.rewards);
      }
    }

    return { changed, notifications, rewards };
  }

  getStatus(questId) {
    return this.states[questId]?.status || STATUS.NOT_STARTED;
  }

  getState(questId) {
    const state = this.states[questId];
    return state ? structuredClone(state) : null;
  }

  getCurrentStage(questId) {
    const state = this.states[questId];
    if (!state || state.status !== STATUS.ACTIVE) return null;
    return this.definitions[questId]?.stages[state.stageIndex] || null;
  }

  setTracked(questId) {
    if (this.getStatus(questId) !== STATUS.ACTIVE) return false;
    this.trackedQuestId = questId;
    return true;
  }

  getTrackedSummary() {
    let questId = this.trackedQuestId;
    if (!questId || this.getStatus(questId) !== STATUS.ACTIVE) {
      questId = Object.keys(this.states).find((id) => this.states[id].status === STATUS.ACTIVE) || null;
      this.trackedQuestId = questId;
    }
    if (!questId) return null;

    const definition = this.definitions[questId];
    const state = this.states[questId];
    const stage = definition.stages[state.stageIndex];
    const objectives = stage.objectives.map((objective) => ({
      label: objective.label,
      current: state.objectiveProgress[objective.id] || 0,
      required: objective.count ?? 1,
      complete: (state.objectiveProgress[objective.id] || 0) >= (objective.count ?? 1),
    }));

    return { questId, title: definition.title, stageTitle: stage.title, objectives };
  }

  getJournalEntries() {
    return Object.entries(this.states)
      .map(([questId, state]) => {
        const definition = this.definitions[questId];
        const stage = state.status === STATUS.ACTIVE ? definition.stages[state.stageIndex] : null;
        return {
          questId,
          ...definition,
          state: structuredClone(state),
          currentStage: stage ? {
            ...stage,
            objectives: stage.objectives.map((objective) => ({
              ...objective,
              current: state.objectiveProgress[objective.id] || 0,
              complete: (state.objectiveProgress[objective.id] || 0) >= (objective.count ?? 1),
            })),
          } : null,
          tracked: this.trackedQuestId === questId,
        };
      })
      .sort((a, b) => {
        if (a.state.status !== b.state.status) return a.state.status === STATUS.ACTIVE ? -1 : 1;
        return (a.state.startedOrder || 0) - (b.state.startedOrder || 0);
      });
  }

  snapshot() {
    return {
      states: structuredClone(this.states),
      trackedQuestId: this.trackedQuestId,
      sequence: this.sequence,
    };
  }

  restore(snapshot) {
    this.states = snapshot?.states && typeof snapshot.states === "object" ? structuredClone(snapshot.states) : {};
    this.trackedQuestId = typeof snapshot?.trackedQuestId === "string" ? snapshot.trackedQuestId : null;
    this.sequence = Number(snapshot?.sequence) || Object.keys(this.states).length;

    for (const questId of Object.keys(this.states)) {
      if (!this.definitions[questId]) delete this.states[questId];
    }
  }

  #isStageComplete(questId) {
    const state = this.states[questId];
    const stage = this.definitions[questId].stages[state.stageIndex];
    return stage.objectives.every((objective) => (
      (state.objectiveProgress[objective.id] || 0) >= (objective.count ?? 1)
    ));
  }

  #advance(questId) {
    const definition = this.definitions[questId];
    const state = this.states[questId];
    state.stageIndex += 1;
    state.objectiveProgress = {};

    if (state.stageIndex >= definition.stages.length) {
      this.sequence += 1;
      state.status = STATUS.COMPLETED;
      state.completedOrder = this.sequence;
      if (this.trackedQuestId === questId) this.trackedQuestId = null;
      return {
        notifications: [{ type: "complete", message: `Úkol dokončen: ${definition.title}` }],
        rewards: structuredClone(definition.rewards || []),
      };
    }

    const stage = definition.stages[state.stageIndex];
    return {
      notifications: [{ type: "quest", message: `Nový cíl — ${stage.title}` }],
      rewards: [],
    };
  }
}
