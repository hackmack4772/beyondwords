import { configureStore } from '@reduxjs/toolkit'
import userReducer from '../features/user-data/usersdata'
import chatReducer from '../features/use-chat-store/chatStore'

export default configureStore({
  reducer: {
    user: userReducer,
    chat:chatReducer
  },
})