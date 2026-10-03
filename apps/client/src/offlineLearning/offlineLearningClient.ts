import type { OfflineLearningPackage } from './offlineLearningPackage';

export interface OfflineLearningInstallStatus {
  installed: boolean;
  packageId: string | null;
  protocolVersion: string | null;
  provenanceBaseSha: string | null;
  reviewValidUntil: string | null;
  installedAt: string | null;
  nodeCount: number;
}

type WorkerRequest =
  | { type: 'OFFLINE_LEARNING_STATUS' }
  | { type: 'OFFLINE_LEARNING_INSTALL'; operationId: string; packageValue: OfflineLearningPackage }
  | { type: 'OFFLINE_LEARNING_CANCEL'; operationId: string }
  | { type: 'OFFLINE_LEARNING_DELETE' };

interface WorkerResponse<T> {
  ok: boolean;
  result?: T;
  error?: string;
}

export const emptyOfflineLearningStatus: OfflineLearningInstallStatus = {
  installed: false,
  packageId: null,
  protocolVersion: null,
  provenanceBaseSha: null,
  reviewValidUntil: null,
  installedAt: null,
  nodeCount: 0,
};

export async function registerOfflineLearningWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator) || !('caches' in window)) {
    throw new Error('הדפדפן אינו תומך באחסון offline מאובטח.');
  }
  const registration = await navigator.serviceWorker.register('/offline-learning-sw.js', {
    scope: '/',
    type: 'module',
  });
  await navigator.serviceWorker.ready;
  return registration;
}

async function sendWorkerRequest<T>(request: WorkerRequest): Promise<T> {
  const registration = await registerOfflineLearningWorker();
  const worker = registration.active ?? registration.waiting ?? registration.installing;
  if (!worker) throw new Error('Service Worker אינו פעיל.');

  return new Promise<T>((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => reject(new Error('הפעולה נמשכה זמן רב מדי.')), 60_000);
    channel.port1.onmessage = ({ data }: MessageEvent<WorkerResponse<T>>) => {
      window.clearTimeout(timeout);
      if (data.ok && data.result !== undefined) resolve(data.result);
      else reject(new Error(data.error ?? 'פעולת offline נכשלה.'));
    };
    worker.postMessage(request, [channel.port2]);
  });
}

export const getOfflineLearningStatus = (): Promise<OfflineLearningInstallStatus> =>
  sendWorkerRequest<OfflineLearningInstallStatus>({ type: 'OFFLINE_LEARNING_STATUS' });

export const installOfflineLearningPackage = (
  packageValue: OfflineLearningPackage,
  operationId: string,
): Promise<OfflineLearningInstallStatus> =>
  sendWorkerRequest<OfflineLearningInstallStatus>({
    type: 'OFFLINE_LEARNING_INSTALL',
    operationId,
    packageValue,
  });

export const cancelOfflineLearningInstall = (operationId: string): Promise<{ cancelled: boolean }> =>
  sendWorkerRequest<{ cancelled: boolean }>({
    type: 'OFFLINE_LEARNING_CANCEL',
    operationId,
  });

export const deleteOfflineLearningPackage = (): Promise<OfflineLearningInstallStatus> =>
  sendWorkerRequest<OfflineLearningInstallStatus>({ type: 'OFFLINE_LEARNING_DELETE' });
