import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '../features/user-data/usersdata'

export default configureStore({
  reducer: {
    counter: counterReducer,
  },
})