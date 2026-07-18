export function matchesConditions(conditions, world) {
  if (!conditions) return true;
  const list = Array.isArray(conditions) ? conditions : [conditions];
  return list.every((condition) => matchesCondition(condition, world));
}

export function matchesCondition(condition, world) {
  if (!condition) return true;

  switch (condition.type) {
    case "all":
      return (condition.conditions || []).every((entry) => matchesCondition(entry, world));
    case "any":
      return (condition.conditions || []).some((entry) => matchesCondition(entry, world));
    case "not":
      return !matchesCondition(condition.condition, world);
    case "flag":
      return world.flags?.[condition.key] === (condition.value ?? true);
    case "item":
      return (world.getItemCount?.(condition.itemId) || 0) >= (condition.min ?? 1);
    case "questStatus":
      return world.quests?.getStatus(condition.questId) === condition.status;
    case "questStage": {
      const state = world.quests?.getState(condition.questId);
      return state?.status === "active" && state.stageIndex === condition.stageIndex;
    }
    case "faction": {
      const value = Number(world.factions?.[condition.factionId]) || 0;
      return value >= (condition.min ?? -Infinity) && value <= (condition.max ?? Infinity);
    }
    default:
      return false;
  }
}
