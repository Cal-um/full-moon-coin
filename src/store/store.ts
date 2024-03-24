import { configureStore } from "@reduxjs/toolkit"
import walletSlice from "./walletSlice"
import mojoNodeAPI from "./mojonodeAPI"

export const store = configureStore({
  reducer: {
    wallet: walletSlice,
    [mojoNodeAPI.reducerPath]: mojoNodeAPI.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(mojoNodeAPI.middleware),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
