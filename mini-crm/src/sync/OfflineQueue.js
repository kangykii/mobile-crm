const QUEUE_KEY = "crm_offline_queue";
const DEVICE_ID_KEY = "crm_device_id";

function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export class OfflineQueue {
  async enqueue(operation, payload) {
    const entry = {
      id: crypto.randomUUID(),
      operation,
      payload,
      queuedAt: new Date().toISOString(),
      deviceId: getDeviceId(),
    };

    const queue = await this.getAll();
    queue.push(entry);
    await idbKeyval.set(QUEUE_KEY, queue);
    return entry;
  }

  async getAll() {
    return (await idbKeyval.get(QUEUE_KEY)) || [];
  }

  async remove(id) {
    const queue = await this.getAll();
    const nextQueue = queue.filter((entry) => entry.id !== id);
    await idbKeyval.set(QUEUE_KEY, nextQueue);
  }

  async clear() {
    await idbKeyval.set(QUEUE_KEY, []);
  }

  async count() {
    const queue = await this.getAll();
    return queue.length;
  }
}
