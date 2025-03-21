import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../../../../config/firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useNotification } from "../../../../contexts/NotificationContext";
import styles from "./EditProfile.module.css";
import { fetchUserInfo } from "../../../../features/user-data/usersdata";
import { updateUserProfile } from "../../../../features/user-slice/userSlice";

const EditProfile = ({ setShowEditMode }) => {
    const dispatch = useDispatch();
    const currentUser = useSelector((state) => state.user.currentUser);
    const { showSuccess, showError } = useNotification();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        username: "",
        about: "",
        avatar: null,
    });
    const [previewUrl, setPreviewUrl] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getUserInfo = async () => {
            if (!currentUser?.uid) return;
            
            try {
                const userInfo = await fetchUserInfo(currentUser.uid);
                setUser(userInfo);
                setFormData({
                    username: userInfo?.username || "",
                    about: userInfo?.about || "",
                    avatar: null,
                });
            } catch (error) {
                console.error("Error fetching user info:", error);
                showError("Failed to load user information");
            }
        };
        getUserInfo();
    }, [currentUser?.uid, showError]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "avatar" && files?.[0]) {
            setFormData(prev => ({
                ...prev,
                avatar: files[0],
            }));
            setPreviewUrl(URL.createObjectURL(files[0]));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let avatarUrl = user?.avatar;

            if (formData.avatar) {
                const storageRef = ref(storage, `avatars/${currentUser.uid}`);
                const uploadTask = uploadBytesResumable(storageRef, formData.avatar);

                avatarUrl = await new Promise((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        null,
                        reject,
                        async () => {
                            try {
                                const url = await getDownloadURL(uploadTask.snapshot.ref);
                                resolve(url);
                            } catch (error) {
                                reject(error);
                            }
                        }
                    );
                });
            }

            const userRef = doc(db, "users", currentUser.uid);
            const updatedData = {
                username: formData.username || user?.username,
                about: formData.about || user?.about,
                avatar: avatarUrl,
                updatedAt: new Date()
            };

            await updateDoc(userRef, updatedData);

            // Update Redux store
            dispatch(updateUserProfile({
                ...currentUser,
                ...updatedData
            }));

            showSuccess("Profile updated successfully!");
            setShowEditMode(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            showError("Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.editProfileContainer}>
            <form onSubmit={handleSubmit} className={styles.editForm}>
                <div className={styles.avatarSection}>
                    <img
                        src={previewUrl || user?.avatar || "/avatar.png"}
                        alt="Profile"
                        className={styles.avatar}
                    />
                    <input
                        type="file"
                        name="avatar"
                        accept="image/*"
                        onChange={handleChange}
                        className={styles.fileInput}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter username"
                        required
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="about">About</label>
                    <textarea
                        id="about"
                        name="about"
                        value={formData.about}
                        onChange={handleChange}
                        placeholder="Write something about yourself"
                        rows="3"
                    />
                </div>
                <div className={styles.buttonGroup}>
                    <button
                        type="button"
                        onClick={() => setShowEditMode(false)}
                        className={styles.cancelButton}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className={styles.saveButton}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;
