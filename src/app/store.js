import { configureStore } from '@reduxjs/toolkit'
import userReducer from '../features/user-data/usersdata'

export default configureStore({
  reducer: {
    user: userReducer,
  },
})