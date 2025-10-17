"use client";

import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  onUploadSuccess?: (images: UploadedImage[]) => void;
  onUploadError?: (error: string) => void;
  category?: 'alert' | 'user' | 'admin' | 'broadcast' | 'temp';
  entityId?: string;
  userId?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // En MB
}

interface UploadedImage {
  id: string;
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  dimensions?: {
    width: number | null;
    height: number | null;
  };
}

export default function ImageUploader({
  onUploadSuccess,
  onUploadError,
  category = 'temp',
  entityId,
  userId,
  multiple = false,
  maxFiles = 5,
  maxSize = 10,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Valider un fichier
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return `${file.name}: Type de fichier non autorisé`;
    }

    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `${file.name}: Fichier trop volumineux (max ${maxSize}MB)`;
    }

    return null;
  };

  // Générer une prévisualisation
  const generatePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Gérer la sélection de fichiers
  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    const errors: string[] = [];

    const filesToProcess = Array.from(fileList).slice(0, multiple ? maxFiles : 1);

    for (const file of filesToProcess) {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
        continue;
      }

      newFiles.push(file);
      try {
        const preview = await generatePreview(file);
        newPreviews.push(preview);
      } catch (err) {
        console.error('Erreur lors de la génération de la prévisualisation:', err);
      }
    }

    if (errors.length > 0) {
      onUploadError?.(errors.join('\n'));
    }

    setFiles(multiple ? [...files, ...newFiles].slice(0, maxFiles) : newFiles);
    setPreviews(multiple ? [...previews, ...newPreviews].slice(0, maxFiles) : newPreviews);
  }, [files, previews, multiple, maxFiles, onUploadError]);

  // Gérer le drag & drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Gérer la sélection via input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Supprimer un fichier
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  // Uploader les fichiers
  const uploadFiles = async () => {
    if (files.length === 0) {
      onUploadError?.('Aucun fichier sélectionné');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedImages: UploadedImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        // Construire l'URL avec les paramètres
        const params = new URLSearchParams({
          category,
          ...(entityId && { entityId }),
          ...(userId && { userId }),
        });

        const response = await fetch(`/api/upload?${params.toString()}`, {
          method: 'POST',
          body: formData,
          // TODO: Ajouter le token d'authentification
          // headers: {
          //   'Authorization': `Bearer ${token}`,
          // },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de l\'upload');
        }

        const data = await response.json();
        uploadedImages.push(data);

        // Mettre à jour la progression
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      // Succès
      onUploadSuccess?.(uploadedImages);

      // Réinitialiser
      setFiles([]);
      setPreviews([]);
      setUploadProgress(0);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      onUploadError?.(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Zone de drop */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-2">
          {uploading ? (
            <>
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">Upload en cours... {uploadProgress.toFixed(0)}%</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Cliquez ou glissez-déposez vos images ici
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {multiple ? `Max ${maxFiles} fichiers` : '1 fichier'} · Max {maxSize}MB · JPG, PNG, GIF, WebP
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Prévisualisations */}
      {previews.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Fichiers sélectionnés ({previews.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img
                    src={preview}
                    alt={files[index].name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="mt-1 text-xs text-gray-600 truncate">
                  {files[index].name}
                </p>
                <p className="text-xs text-gray-400">
                  {(files[index].size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton d'upload */}
      {files.length > 0 && !uploading && (
        <button
          type="button"
          onClick={uploadFiles}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Upload className="w-5 h-5" />
          <span>Uploader {files.length} image{files.length > 1 ? 's' : ''}</span>
        </button>
      )}

      {/* Barre de progression */}
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
