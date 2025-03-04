import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentUser: null,
  isLoading: true,
};

const userSlice = createSlice({
  name: 'usersData',
  initialState,
  reducers: {
    fetchUserInfo: (state, action) => {
      const userData = action.payload;
      if (!userData) {
        state.currentUser = null;
        state.isLoading = false;
      } else {
        state.currentUser = userData;
        state.isLoading = false;
      }
    },
  },
});

export const { fetchUserInfo } = userSlice.actions;
export default userSlice.reducer;
