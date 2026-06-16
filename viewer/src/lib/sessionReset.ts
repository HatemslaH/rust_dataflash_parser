import { queryClient } from "./queryClient";
import { plotStoreApi } from "../stores/plotStore";
import { timeStoreApi } from "../stores/timeStore";

export function resetViewerData(): void {
  plotStoreApi.getState().clearPlots();
  timeStoreApi.getState().reset();
  queryClient.clear();
}
