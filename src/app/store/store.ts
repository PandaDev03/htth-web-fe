import { configureStore } from "@reduxjs/toolkit";

import authReducer, {
  logout,
  setCredentials,
} from "@/features/auth/model/authSlice";
import { configureHttpAuthSessionSynchronizer } from "@/shared/api/httpClient";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

configureHttpAuthSessionSynchronizer((session) => {
  if (store.getState().auth.activeRequestId) {
    return;
  }

  if (session) {
    store.dispatch(setCredentials(session));
    return;
  }

  store.dispatch(logout());
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
