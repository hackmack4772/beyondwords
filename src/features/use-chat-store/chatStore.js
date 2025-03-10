import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
    name: "chat",
    initialState: {
        chatId: null,
        user: null,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
    },
    reducers: {
        changeChat: (state, action) => {
            const { currentUser, user, chatId } = action.payload;
            if (user.blocked.includes(currentUser.id)) {
                state.chatId = chatId,
                    state.user = null;
                state.isCurrentUserBlocked = true,
                    state.isReceiverBlocked = false
            }
            else if (currentUser.blocked.includes(user.id)) {
                state.chatId = chatId,
                    state.user = user;
                state.isCurrentUserBlocked = false,
                    state.isReceiverBlocked = true
            }
            else {

                state.chatId = chatId,
                    state.user = user;
                state.isCurrentUserBlocked = false,
                    state.isReceiverBlocked = false

            }

        },
    },
});

export const { changeChat } = chatSlice.actions;
export default chatSlice.reducer;
