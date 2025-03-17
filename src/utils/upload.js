import axios from "axios";

const upload = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "hackmack"); // Replace with your actual upload preset
  formData.append("resource_type", "auto"); // Allow Cloudinary to detect the file type automatically

  try {
    const response = await axios.post(
      "https://api.cloudinary.com/v1_1/dwcxhstwg/upload", // Corrected endpoint
      formData
    );

    return response.data.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
};

export default upload;
