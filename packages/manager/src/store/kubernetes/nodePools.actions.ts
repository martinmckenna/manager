import {
  KubeNodePoolResponse,
  PoolNodeRequest
} from 'linode-js-sdk/lib/kubernetes';
import actionCreatorFactory from 'typescript-fsa';

import { EntityError } from 'src/store/types';

export interface ExtendedNodePool extends KubeNodePoolResponse {
  clusterID: number; // clusterID of the cluster this node is associated with
}

export const actionCreator = actionCreatorFactory(
  `@@manager/kubernetes/nodePools`
);

export const requestNodePoolsActions = actionCreator.async<
  void,
  ExtendedNodePool[],
  Linode.ApiFieldError[]
>('request');

export const addOrUpdateNodePool = actionCreator<KubeNodePoolResponse>(
  'add_or_update'
);

export const upsertNodePool = actionCreator<KubeNodePoolResponse>(`upsert`);

export const setErrors = actionCreator<EntityError>('set-errors');

export interface ClusterID {
  clusterID: number;
}

export interface NodePoolID {
  nodePoolID: number;
}

export type CreateNodePoolParams = ClusterID & PoolNodeRequest;
export const createNodePoolActions = actionCreator.async<
  CreateNodePoolParams,
  ExtendedNodePool,
  Linode.ApiFieldError[]
>(`create-node-pool`);

export type UpdateNodePoolParams = ClusterID & NodePoolID & PoolNodeRequest;
export const updateNodePoolActions = actionCreator.async<
  UpdateNodePoolParams,
  ExtendedNodePool,
  Linode.ApiFieldError[]
>(`update-node-pool`);

export type DeleteClusterParams = ClusterID;
export const deleteClusterActions = actionCreator.async<
  DeleteClusterParams,
  {},
  Linode.ApiFieldError[]
>(`delete-cluster`);

export type DeleteNodePoolParams = ClusterID & NodePoolID;
export const deleteNodePoolActions = actionCreator.async<
  DeleteNodePoolParams,
  {},
  Linode.ApiFieldError[]
>(`delete-node-pool`);
