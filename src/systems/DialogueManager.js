import { matchesConditions } from "./ConditionEvaluator.js";

export class DialogueManager {
  constructor(definitions) {
    this.definitions = definitions;
    this.session = null;
  }

  start(dialogueId, world) {
    const dialogue = this.definitions[dialogueId];
    if (!dialogue) return null;
    const entry = dialogue.entries.find((candidate) => matchesConditions(candidate.when, world));
    if (!entry || !dialogue.nodes[entry.node]) return null;
    this.session = { dialogueId, nodeId: entry.node };
    return this.getView(world);
  }

  getView(world) {
    if (!this.session) return null;
    const dialogue = this.definitions[this.session.dialogueId];
    const node = dialogue?.nodes[this.session.nodeId];
    if (!node) return null;

    const choices = (node.choices || [])
      .filter((choice) => matchesConditions(choice.when, world))
      .map((choice, index) => ({
        id: `${this.session.nodeId}:${index}`,
        index,
        label: choice.label,
      }));

    return {
      dialogueId: this.session.dialogueId,
      nodeId: this.session.nodeId,
      speaker: node.speaker,
      text: node.text,
      choices,
    };
  }

  choose(choiceId, world) {
    if (!this.session) return { closed: true, view: null };
    const dialogue = this.definitions[this.session.dialogueId];
    const node = dialogue.nodes[this.session.nodeId];
    const available = (node.choices || []).filter((choice) => matchesConditions(choice.when, world));
    const choice = available.find((entry, index) => `${this.session.nodeId}:${index}` === choiceId)
      || available[Number(choiceId.split(":").at(-1))];
    if (!choice) return { closed: false, view: this.getView(world) };

    for (const effect of choice.effects || []) this.#applyEffect(effect, world);

    if (choice.close || !choice.next) {
      this.session = null;
      return { closed: true, view: null };
    }

    if (!dialogue.nodes[choice.next]) throw new Error(`Dialog odkazuje na neznámý uzel: ${choice.next}`);
    this.session.nodeId = choice.next;
    return { closed: false, view: this.getView(world) };
  }

  close() {
    this.session = null;
  }

  #applyEffect(effect, world) {
    switch (effect.type) {
      case "startQuest":
        world.startQuest(effect.questId);
        break;
      case "questEvent":
        world.emitQuestEvent(effect.event, effect.target, effect.amount || 1);
        break;
      case "setFlag":
        world.flags[effect.key] = effect.value ?? true;
        break;
      case "giveItem":
        world.addItem(effect.itemId, effect.amount || 1, effect.name || effect.itemId);
        break;
      case "takeItem":
        world.removeItem(effect.itemId, effect.amount || 1);
        break;
      case "gold":
        world.gold += Number(effect.amount) || 0;
        break;
      case "reputation":
        world.reputation += Number(effect.amount) || 0;
        break;
      case "faction":
        world.adjustFaction(effect.factionId, effect.amount || 0);
        break;
      default:
        throw new Error(`Neznámý efekt dialogu: ${effect.type}`);
    }
  }
}
