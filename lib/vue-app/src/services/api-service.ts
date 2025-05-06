import axios from "axios";
import HttpClient from "@/services/http-client";
import { fetchAuthSession } from "aws-amplify/auth";
import { useWebSocketStore } from "@/store/websocket";

const sharedAxiosInstance = axios.create();
const websocket = useWebSocketStore();

const apiBaseUrl = import.meta.env.VITE_REST_API_URL || "";
const httpClient = new HttpClient(sharedAxiosInstance, apiBaseUrl);

async function getHeaders() {
  const authSession = await fetchAuthSession();
  const idToken = authSession.tokens?.idToken?.toString();
  return {'Authorization': 'Bearer ' + idToken};
}

export async function chatApi(apiResource: string, payload: any) {
  await websocket.refreshWebSocketConnection();
  const headers = await getHeaders();
  payload['session_id'] = websocket.webSocketSessionId;
  payload['websocket_id'] = websocket.webSocketId;
  return apiBaseUrl
    ? httpClient.post(
        apiResource,
        payload,
        headers
      )
    : {};
}

export async function saveSubmissionApi(payload: any) {
  const headers = await getHeaders()
  return apiBaseUrl
    ? httpClient.post("submission", payload, headers)
    : {};
}

export async function extractCustomerApi(payload: any) {
  const headers = await getHeaders();
  return apiBaseUrl
    ? httpClient.post("extract_name", payload, headers)
    : {};
}

export async function recommendSubmissionsApi(payload: any) {
  await websocket.refreshWebSocketConnection();
  const headers = await getHeaders();
  payload['session_id'] = websocket.webSocketSessionId;
  payload['websocket_id'] = websocket.webSocketId;
  return apiBaseUrl
    ? httpClient.post(
        "recommend_submissions",
        payload,
        headers
      )
    : {};
}

export async function combineSubmissionsApi(payload: any) {
  await websocket.refreshWebSocketConnection();
  const headers = await getHeaders();
  payload['websocket_id'] = websocket.webSocketId;
  return apiBaseUrl
    ? httpClient.post(
        "combine_submissions",
        payload,
        headers
      )
    : {};
}

export async function viewAssociateApi(query: any) {
  const headers = await getHeaders();
  return apiBaseUrl
    ? httpClient.get("view_submission_associates", query, headers)
    : {};
}

export async function viewManagerApi(query: any) {
  const headers = await getHeaders();
  return apiBaseUrl
    ? httpClient.get("view_submission_managers", query, headers)
    : {};
}
