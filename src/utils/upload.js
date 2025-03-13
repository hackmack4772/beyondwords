
import axios from "axios";

const upload = async (file) => {
  const date = new Date();
  const formData=new FormData()
  formData.append("file",file);
  formData.append("upload_preset","hackmack")
  try {
    const response=await axios.post("https://api.cloudinary.com/v1_1/dwcxhstwg/image/upload",
      formData
    );

    return response.data.secure_url;
    

  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }

  
};

export default upload;




