import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    currentUser: null,
    loading: false,
    error: null
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.currentUser = action.payload;
            state.loading = false;
            state.error = null;
        },
        updateUserProfile: (state, action) => {
            state.currentUser = {
                ...state.currentUser,
                ...action.payload,
            };
        },
        clearUser: (state) => {
            state.currentUser = null;
            state.loading = false;
            state.error = null;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        }
    }
});

export const {
    setUser,
    updateUserProfile,
    clearUser,
    setLoading,
    setError
} = userSlice.actions;

export default userSlice.reducer; 