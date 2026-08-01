/**
 * Main-process-only carrier for Vertex credentials between registry hydration
 * and the WCore spawn. The symbol property is non-enumerable so it cannot enter
 * persisted model JSON or renderer IPC by an incidental object spread.
 */
import type { TProviderWithModel } from '@/common/config/storage';

const VERTEX_SPAWN_CREDENTIALS = Symbol('wayland.vertexSpawnCredentials');

export type VertexSpawnCredentials = Readonly<{
  projectId: string;
  region: string;
  serviceAccountJson: string;
}>;

type VertexHydratedModel = TProviderWithModel & {
  [VERTEX_SPAWN_CREDENTIALS]?: VertexSpawnCredentials;
};

export function attachVertexSpawnCredentials<T extends TProviderWithModel>(
  model: T,
  credentials: VertexSpawnCredentials
): T {
  Object.defineProperty(model, VERTEX_SPAWN_CREDENTIALS, {
    value: Object.freeze({ ...credentials }),
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return model;
}

export function vertexSpawnCredentialsForModel(model: TProviderWithModel): VertexSpawnCredentials | undefined {
  return (model as VertexHydratedModel)[VERTEX_SPAWN_CREDENTIALS];
}
