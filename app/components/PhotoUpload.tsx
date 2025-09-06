import { useState, useRef } from "react";
import type { DailyPhoto, PhotoType, AppDispatch } from "~/types";
import { createSupabaseClient } from "~/lib/supabase.client";
import { DatabaseService } from "~/services/database";
import type { User } from "@supabase/supabase-js";

interface PhotoUploadProps {
  date: string;
  existingPhotos: DailyPhoto[];
  dispatch: AppDispatch;
  user: User;
  onPhotosUpdated?: () => void;
}

const PHOTO_TYPES: { type: PhotoType; label: string; icon: string }[] = [
  { type: "front", label: "Frente", icon: "👤" },
  { type: "back", label: "Espalda", icon: "🔄" },
  { type: "side", label: "Lado", icon: "↩️" },
];

export function PhotoUpload({ date, existingPhotos, dispatch, user, onPhotosUpdated }: PhotoUploadProps) {
  const [uploadingPhoto, setUploadingPhoto] = useState<PhotoType | null>(null);
  const fileInputRefs = useRef<{ [key in PhotoType]: HTMLInputElement | null }>({
    front: null,
    back: null,
    side: null,
  });

  const getExistingPhoto = (type: PhotoType): DailyPhoto | undefined => {
    return existingPhotos.find(photo => photo.type === type);
  };

  const handleFileSelect = async (type: PhotoType, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Por favor selecciona una imagen menor a 5MB');
      return;
    }

    setUploadingPhoto(type);

    try {
      const supabase = createSupabaseClient();
      const db = new DatabaseService(supabase);

      // Upload photo to Supabase Storage and save to database
      const uploadedPhotoData = await db.uploadPhoto(user.id, date, file, type);
      
      // Create local photo object with signed URL for immediate display
      const signedUrl = await db.getSignedPhotoUrl(uploadedPhotoData.photo_url);
      const newPhoto: DailyPhoto = {
        id: uploadedPhotoData.id,
        type,
        dataUrl: signedUrl, // Use signed URL for secure access
        fileName: uploadedPhotoData.photo_url, // Store file path for deletion
        timestamp: uploadedPhotoData.created_at,
      };

      const existingPhoto = getExistingPhoto(type);

      if (existingPhoto) {
        // Replace existing photo
        dispatch({
          type: "REPLACE_DAILY_PHOTO",
          date,
          photoType: type,
          newPhoto,
        });
      } else {
        // Add new photo
        dispatch({
          type: "ADD_DAILY_PHOTOS",
          date,
          photos: [newPhoto],
        });
      }

      onPhotosUpdated?.();
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error al subir la imagen. Por favor intenta de nuevo.');
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handleDeletePhoto = async (photoId: string, type: PhotoType) => {
    if (confirm(`¿Estás seguro de que quieres eliminar la foto de ${PHOTO_TYPES.find(pt => pt.type === type)?.label}?`)) {
      try {
        const existingPhoto = getExistingPhoto(type);
        if (existingPhoto && existingPhoto.fileName) {
          const supabase = createSupabaseClient();
          const db = new DatabaseService(supabase);
          
          // Delete from storage and database
          await db.deletePhoto(photoId, existingPhoto.fileName);
        }
        
        // Update local state
        dispatch({
          type: "DELETE_DAILY_PHOTO",
          date,
          photoId,
        });
        onPhotosUpdated?.();
      } catch (error) {
        console.error('Error deleting photo:', error);
        alert('Error al eliminar la foto. Por favor intenta de nuevo.');
      }
    }
  };

  const triggerFileInput = (type: PhotoType) => {
    fileInputRefs.current[type]?.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-xl">📸</span>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
          Fotografías de Progreso
        </h4>
        <span className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
          {existingPhotos.length}/3
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PHOTO_TYPES.map(({ type, label, icon }) => {
          const existingPhoto = getExistingPhoto(type);
          const isUploading = uploadingPhoto === type;

          return (
            <div key={type} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{label}</span>
                </div>
                {existingPhoto && (
                  <button
                    onClick={() => handleDeletePhoto(existingPhoto.id, type)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    title="Eliminar foto"
                    aria-label={`Eliminar foto de ${label}`}
                  >
                    🗑️
                  </button>
                )}
              </div>

              <div
                className={`
                  relative aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600
                  ${existingPhoto ? 'bg-gray-50 dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}
                  ${isUploading ? 'opacity-50' : ''}
                  transition-colors cursor-pointer overflow-hidden
                `}
                onClick={() => !isUploading && triggerFileInput(type)}
              >
                {existingPhoto ? (
                  <>
                    <img
                      src={existingPhoto.dataUrl}
                      alt={`Foto de ${label}`}
                      className="w-full h-full object-cover rounded-lg"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                      <span className="text-white opacity-0 hover:opacity-100 transition-opacity">
                        Cambiar foto
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    {isUploading ? (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        <span className="text-sm">Subiendo...</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-4xl mb-2">📷</span>
                        <span className="text-sm text-center px-4">
                          Click para agregar foto de {label.toLowerCase()}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {existingPhoto && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Agregada: {new Date(existingPhoto.timestamp).toLocaleString('es-ES')}
                </div>
              )}

              <input
                ref={el => fileInputRefs.current[type] = el}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileSelect(type, file);
                  }
                  e.target.value = '';
                }}
              />
            </div>
          );
        })}
      </div>

      {existingPhotos.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          💡 <strong>Consejo:</strong> Para mejores resultados, toma las fotos en condiciones similares 
          (misma iluminación, hora del día y ropa) para poder comparar mejor tu progreso.
        </div>
      )}
    </div>
  );
}

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}