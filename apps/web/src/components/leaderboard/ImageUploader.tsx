import React, { ChangeEvent, FormEvent, useState } from "react";

interface ImageUploaderProps {
  onSubmit: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onSubmit }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedFile) {
      onSubmit(selectedFile);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-md">
      <div className="mb-4">
        <label htmlFor="image-upload" className="mb-2 block text-sm font-medium text-gray-700">
          Choose an image
        </label>
        <input
          type="file"
          id="image-upload"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      {previewUrl && (
        <div className="mb-4">
          <img src={previewUrl} alt="Preview" className="h-auto max-w-full rounded-lg" />
        </div>
      )}
      <button
        type="submit"
        disabled={!selectedFile}
        className="w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        Upload Image
      </button>
    </form>
  );
};

export default ImageUploader;
