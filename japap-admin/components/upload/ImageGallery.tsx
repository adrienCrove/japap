"use client";

import React, { useState } from 'react';
import { Image as ImageType } from '@/lib/imageApi';
import { getImageUrl, deleteImage } from '@/lib/imageApi';
import { Trash2, Download, Eye, X, ExternalLink } from 'lucide-react';

interface ImageGalleryProps {
  images: ImageType[];
  onDelete?: (imageId: string) => void;
  showActions?: boolean;
  columns?: 2 | 3 | 4 | 5;
}

export default function ImageGallery({
  images,
  onDelete,
  showActions = true,
  columns = 4,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  };

  // Supprimer une image
  const handleDelete = async (imageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      return;
    }

    setIsDeleting(imageId);

    try {
      await deleteImage(imageId);
      onDelete?.(imageId);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'image');
    } finally {
      setIsDeleting(null);
    }
  };

  // Télécharger une image
  const handleDownload = (image: ImageType) => {
    const link = document.createElement('a');
    link.href = getImageUrl(image.path);
    link.download = image.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Aucune image disponible</p>
      </div>
    );
  }

  return (
    <>
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {images.map((image) => (
          <div
            key={image.id}
            className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Image */}
            <div className="aspect-square bg-gray-100">
              <img
                src={getImageUrl(image.path)}
                alt={image.originalName}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setSelectedImage(image)}
              />
            </div>

            {/* Actions overlay */}
            {showActions && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Voir"
                  >
                    <Eye className="w-5 h-5 text-gray-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(image)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Télécharger"
                  >
                    <Download className="w-5 h-5 text-gray-700" />
                  </button>

                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(image.id)}
                      disabled={isDeleting === image.id}
                      className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="p-3 space-y-1">
              <p className="text-sm font-medium text-gray-900 truncate" title={image.originalName}>
                {image.originalName}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{(image.size / 1024 / 1024).toFixed(2)} MB</span>
                {image.width && image.height && (
                  <span>{image.width} × {image.height}</span>
                )}
              </div>
              {image.category && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  {image.category}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de prévisualisation */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">
                {selectedImage.originalName}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Image */}
            <div className="p-4 overflow-auto max-h-[60vh]">
              <img
                src={getImageUrl(selectedImage.path)}
                alt={selectedImage.originalName}
                className="w-full h-auto rounded"
              />
            </div>

            {/* Details */}
            <div className="p-4 border-t border-gray-200 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Taille:</span>
                  <span className="ml-2 text-gray-600">
                    {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                {selectedImage.width && selectedImage.height && (
                  <div>
                    <span className="font-medium text-gray-700">Dimensions:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedImage.width} × {selectedImage.height}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 text-gray-600">{selectedImage.mimeType}</span>
                </div>
                {selectedImage.category && (
                  <div>
                    <span className="font-medium text-gray-700">Catégorie:</span>
                    <span className="ml-2 text-gray-600">{selectedImage.category}</span>
                  </div>
                )}
                {selectedImage.uploader && (
                  <div>
                    <span className="font-medium text-gray-700">Uploadé par:</span>
                    <span className="ml-2 text-gray-600">{selectedImage.uploader.name}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Date:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(selectedImage.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => handleDownload(selectedImage)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Télécharger</span>
                </button>

                <a
                  href={getImageUrl(selectedImage.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>Ouvrir</span>
                </a>

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDelete(selectedImage.id);
                      setSelectedImage(null);
                    }}
                    disabled={isDeleting === selectedImage.id}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
