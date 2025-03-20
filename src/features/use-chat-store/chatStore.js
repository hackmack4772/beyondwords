import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    chatId: null,
    user: null,
    isCurrentUserBlocked: false,
    isReceiverBlocked: false,
};

export const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        changeUser: (state, action) => {            
            const { chatId, user } = action.payload;
            if (!user || !chatId) {
                state.chatId = null;
                state.user = null;
                state.isCurrentUserBlocked = false;
                state.isReceiverBlocked = false;
                return;
            }

            // Ensure user object has all required fields
            const cleanUser = {
                id: user.id,
                username: user.username || 'Unknown User',
                avatar: user.avatar || './avatar.png',
                blocked: user.blocked || [],
                about: user.about || ''
            };


            

            state.user = cleanUser;
            state.chatId = chatId;
            state.isCurrentUserBlocked = cleanUser.blocked.includes(cleanUser.id);
            state.isReceiverBlocked = cleanUser.blocked.includes(cleanUser.id);

        },
        changeBlock: (state) => {
            state.isReceiverBlocked = !state.isReceiverBlocked;
        },
        resetChat: (state) => {
            state.chatId = null;
            state.user = null;
            state.isCurrentUserBlocked = false;
            state.isReceiverBlocked = false;
        },
    },
});

export const { changeUser, changeBlock, resetChat } = chatSlice.actions;
export default chatSlice.reducer;
