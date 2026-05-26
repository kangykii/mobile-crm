import { InMemoryLeadRepository } from "./InMemoryLeadRepository.js";
import { WebNotifier } from "./WebNotifier.js";
import { WebSettingsStore } from "./WebSettingsStore.js";

export function createWebPlatform({ toast } = {}) {
  const repository = new InMemoryLeadRepository([]);
  const settings = new WebSettingsStore();
  const notifier = new WebNotifier(toast);

  return {
    repository,
    settings,
    notifier,
  };
}
