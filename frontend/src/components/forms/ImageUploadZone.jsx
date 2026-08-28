import { useState, useRef } from "react";
import { Paperclip, X, UploadCloud } from "lucide-react";
import api from "../../api/axios.js"; // or use your configured API client instance

const ImageUploadZone = ({ value, onChange, folder = "general", label = "Upload Image" }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Optional validation (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds maximum 5MB threshold allocation.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);//When we call this the browser constructs a multipart/form-data request body.

    setUploading(true);
    setError("");

    try {
      // Direct API upload request block passing destination query parameter strings
      const response = await api.post(`/v1/upload?folder=${folder}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data?.url) {
        onChange(response.data.url); // Sends the Cloudinary url string back up to form state handler
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "File upload processing system error.");
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = (e) => {
    e.preventDefault();
    onChange(""); // Resets image url to empty state
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {!value ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 hover:border-gray-400 transition-all group disabled:opacity-50"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <span className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Uploading assets...</span>
            </div>
          ) : (
            <>
              <UploadCloud size={20} className="text-gray-400 group-hover:text-gray-600 mb-1.5 transition-colors" />
              <span className="text-xs font-medium text-gray-600">Click to upload image asset</span>
              <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, JPEG up to 5MB</span>
            </>
          )}
        </button>
      ) : (
        <div className="relative h-32 w-full border border-gray-100 rounded-xl overflow-hidden group">
          <img src={value} alt="Upload asset asset snapshot" className="w-full h-full object-cover" />
          <button
            onClick={clearSelection}
            className="absolute top-2 right-2 p-1.5 bg-gray-900/80 hover:bg-gray-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150 backdrop-blur-xs"
          >
            <X size={12} />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default ImageUploadZone;