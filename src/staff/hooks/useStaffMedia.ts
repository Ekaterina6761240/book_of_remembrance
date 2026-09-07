import { useCallback, useEffect, useMemo, useState } from 'react';
import { useServices } from '../../app/providers/ServicesProvider';
import type { MediaFile } from '../../shared/types';

export type MediaFeedback = {
  type: 'success' | 'error';
  message: string;
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const useStaffMedia = () => {
  const { media: mediaService } = useServices();
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [deleteCandidates, setDeleteCandidates] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<MediaFeedback | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setMedia(await mediaService.getAll());
    } catch (error: unknown) {
      setLoadError(getErrorMessage(error, 'Не удалось загрузить медиафайлы.'));
    } finally {
      setIsLoading(false);
    }
  }, [mediaService]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const uploadFiles = async (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith('image/'));
    if (images.length !== files.length) {
      setUploadError('Можно загрузить только изображения.');
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setFeedback(null);
    const uploaded: MediaFile[] = [];
    try {
      for (let index = 0; index < images.length; index += 1) {
        const file = images[index];
        if (!file) continue;
        const item = await mediaService.upload(
          { file, name: file.name },
          (fileProgress) => setUploadProgress(Math.round(((index + fileProgress / 100) / images.length) * 100)),
        );
        uploaded.push(item);
        setMedia((current) => [...current, item]);
      }
      setSelectedIds(new Set(uploaded.map((item) => item.id)));
      setFeedback({ type: 'success', message: uploaded.length === 1 ? 'Файл загружен.' : `Загружено файлов: ${uploaded.length}.` });
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Не удалось загрузить файлы.');
      setUploadError(message);
    } finally {
      setIsUploading(false);
      window.setTimeout(() => setUploadProgress(null), 500);
    }
  };

  const selectedMedia = useMemo(
    () => media.filter((item) => selectedIds.has(item.id)),
    [media, selectedIds],
  );

  const requestDelete = (candidates: MediaFile[]) => {
    setFeedback(null);
    setDeleteCandidates(candidates);
  };

  const confirmDelete = async () => {
    if (deleteCandidates.length === 0) return;
    setIsDeleting(true);
    try {
      await Promise.all(deleteCandidates.map((item) => mediaService.delete(item.id)));
      const deletedIds = new Set(deleteCandidates.map((item) => item.id));
      setMedia((current) => current.filter((item) => !deletedIds.has(item.id)));
      setSelectedIds(new Set());
      setFeedback({ type: 'success', message: deleteCandidates.length === 1 ? 'Файл удалён.' : `Удалено файлов: ${deleteCandidates.length}.` });
      setDeleteCandidates([]);
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Не удалось удалить файлы.') });
      setDeleteCandidates([]);
      await reload();
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    media,
    selectedIds,
    selectedMedia,
    deleteCandidates,
    isLoading,
    isUploading,
    isDeleting,
    uploadProgress,
    uploadError,
    loadError,
    feedback,
    setSelectedIds,
    uploadFiles,
    requestDelete,
    confirmDelete,
    cancelDelete: () => setDeleteCandidates([]),
    dismissFeedback: () => setFeedback(null),
    reload,
  };
};
