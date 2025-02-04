import React, { ChangeEvent, FormEvent, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { cn } from "@/util/client";

interface ImageUploaderProps {
  onSubmit: (file: File) => Promise<any>;
  title?: string;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onSubmit, title, className }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (selectedFile) {
        setLoading(true);
        await onSubmit(selectedFile);
        setPreviewUrl(null);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 h-full justify-center items-center">
      {title && <h1 className="text-xs font-bold uppercase">{title}</h1>}

      {previewUrl && <img src={previewUrl} alt="Preview" className="aspect-square h-32 w-32" />}
      {!previewUrl && <div className="aspect-square h-32 w-32 bg-primary/20"></div>}

      <p className="text-center text-xs opacity-50">
        Choose an image (must be smaller than 64kb). Square images work best.
      </p>
      <div className="flex items-center justify-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full text-xs flex flex-col file:mr-4 file:rounded-md file:rounded-sm file:border-0 file:bg-blue-50 file:bg-secondary file:py-2 file:text-sm file:font-semibold file:text-white hover:file:cursor-pointer hover:file:opacity-70"
        />
      </div>

      <Button type="submit" disabled={!selectedFile} size="md" variant="primary" className="w-full mt-2">
        {!loading && "Update Image"}
        {loading && <ArrowPathIcon className="size-4 animate-spin" />}
      </Button>
    </form>
  );
};

export default ImageUploader;
