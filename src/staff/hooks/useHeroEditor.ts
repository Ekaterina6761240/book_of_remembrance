import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, useNavigate } from 'react-router-dom';
import { useServices } from '../../app/providers/ServicesProvider';
import { ROUTES } from '../../shared/constants/routes';
import type { District, Hero, HeroFormData, HeroStatus, MediaFile } from '../../shared/types';

export type PublishMode = 'now' | 'scheduled';

export type HeroEditorValues = {
  firstName: string;
  lastName: string;
  middleName: string;
  districtId: number | null;
  birthDate: string;
  deathDate: string;
  mainImage: MediaFile | null;
  biography: string;
  feat: string;
  awards: string;
  gallery: MediaFile[];
  status: HeroStatus;
  publishMode: PublishMode;
  publishDate: string;
  publishTime: string;
};

export type HeroEditorErrors = Partial<Record<'firstName' | 'lastName' | 'districtId' | 'birthDate' | 'deathDate' | 'publishDate' | 'publishTime', string>>;

export type HeroEditorFeedback = {
  type: 'success' | 'error';
  message: string;
};

const EMPTY_VALUES: HeroEditorValues = {
  firstName: '',
  lastName: '',
  middleName: '',
  districtId: null,
  birthDate: '',
  deathDate: '',
  mainImage: null,
  biography: '',
  feat: '',
  awards: '',
  gallery: [],
  status: 'draft',
  publishMode: 'now',
  publishDate: '',
  publishTime: '',
};

const serializeValues = (values: HeroEditorValues): string => JSON.stringify(values);

const toEditorValues = (hero: Hero): HeroEditorValues => ({
  firstName: hero.firstName,
  lastName: hero.lastName,
  middleName: hero.middleName ?? '',
  districtId: hero.districtId,
  birthDate: hero.birthDate ?? '',
  deathDate: hero.deathDate ?? '',
  mainImage: hero.mainImage ?? null,
  biography: hero.biography ?? '',
  feat: hero.feat ?? '',
  awards: hero.awards ?? '',
  gallery: hero.gallery,
  status: hero.status ?? 'draft',
  publishMode: hero.publishedAt ? 'scheduled' : 'now',
  publishDate: hero.publishedAt?.slice(0, 10) ?? '',
  publishTime: hero.publishedAt?.slice(11, 16) ?? '',
});

const toFormData = (values: HeroEditorValues): HeroFormData => ({
  firstName: values.firstName.trim(),
  lastName: values.lastName.trim(),
  middleName: values.middleName.trim() || undefined,
  districtId: values.districtId!,
  birthDate: values.birthDate || undefined,
  deathDate: values.deathDate || undefined,
  mainImage: values.mainImage ?? undefined,
  biography: values.biography.trim() || undefined,
  feat: values.feat.trim() || undefined,
  awards: values.awards.trim() || undefined,
  gallery: values.gallery,
  status: values.status,
  publishedAt: values.status === 'published' && values.publishMode === 'scheduled'
    ? `${values.publishDate}T${values.publishTime}:00`
    : undefined,
});

const validate = (values: HeroEditorValues): HeroEditorErrors => {
  const errors: HeroEditorErrors = {};
  if (!values.lastName.trim()) errors.lastName = 'Укажите фамилию';
  if (!values.firstName.trim()) errors.firstName = 'Укажите имя';
  if (values.districtId === null) errors.districtId = 'Выберите район';
  if (values.birthDate && values.deathDate && values.deathDate < values.birthDate) {
    errors.deathDate = 'Дата смерти не может быть раньше даты рождения';
  }
  if (values.status === 'published' && values.publishMode === 'scheduled') {
    if (!values.publishDate) errors.publishDate = 'Выберите дату публикации';
    if (!values.publishTime) errors.publishTime = 'Выберите время публикации';
  }
  return errors;
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const useHeroEditor = (idParam: string | undefined) => {
  const navigate = useNavigate();
  const { districts: districtsService, heroes: heroesService, media: mediaService } = useServices();
  const heroId = idParam === undefined ? null : Number(idParam);
  const isEdit = heroId !== null;
  const [values, setValues] = useState<HeroEditorValues>(EMPTY_VALUES);
  const [baseline, setBaseline] = useState(() => serializeValues(EMPTY_VALUES));
  const [districts, setDistricts] = useState<District[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [errors, setErrors] = useState<HeroEditorErrors>({});
  const [feedback, setFeedback] = useState<HeroEditorFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const allowNavigationRef = useRef(false);

  const isDirty = useMemo(() => serializeValues(values) !== baseline, [baseline, values]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    allowNavigationRef.current = false;
    try {
      if (isEdit && (!Number.isInteger(heroId) || heroId! <= 0)) {
        throw new Error('Некорректный идентификатор героя.');
      }
      const [nextDistricts, nextMedia, hero] = await Promise.all([
        districtsService.getAll(),
        mediaService.getAll(),
        isEdit ? heroesService.getById(heroId!) : Promise.resolve(null),
      ]);
      const nextValues = hero ? toEditorValues(hero) : EMPTY_VALUES;
      setDistricts(nextDistricts.sort((left, right) => left.name.localeCompare(right.name, 'ru')));
      setMedia(nextMedia);
      setValues(nextValues);
      setBaseline(serializeValues(nextValues));
      setErrors({});
    } catch (error: unknown) {
      setLoadError(getErrorMessage(error, 'Не удалось загрузить редактор героя.'));
    } finally {
      setIsLoading(false);
    }
  }, [districtsService, heroId, heroesService, isEdit, mediaService]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || isSaving) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isSaving]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    isDirty
    && !isSaving
    && !allowNavigationRef.current
    && currentLocation.pathname !== nextLocation.pathname,
  );

  const updateField = <Key extends keyof HeroEditorValues>(field: Key, value: HeroEditorValues[Key]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback(null);
  };

  const save = async () => {
    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFeedback({ type: 'error', message: 'Проверьте обязательные поля формы.' });
      return;
    }
    setIsSaving(true);
    setFeedback(null);
    try {
      const savedHero = isEdit
        ? await heroesService.update(heroId!, toFormData(values))
        : await heroesService.create(toFormData(values));
      const savedValues = toEditorValues(savedHero);
      setValues(savedValues);
      setBaseline(serializeValues(savedValues));
      setFeedback({ type: 'success', message: isEdit ? 'Изменения сохранены.' : 'Герой создан.' });
      if (!isEdit) {
        allowNavigationRef.current = true;
        navigate(`${ROUTES.staffHeroes}/${savedHero.id}`, { replace: true });
      }
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Не удалось сохранить героя.') });
    } finally {
      setIsSaving(false);
    }
  };

  const uploadMedia = async (file: File, target: 'main' | 'gallery') => {
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Можно загрузить только изображение.' });
      return false;
    }
    setIsUploading(true);
    setUploadProgress(0);
    setFeedback(null);
    try {
      const uploaded = await mediaService.upload({ file, name: file.name }, setUploadProgress);
      setMedia((current) => [...current, uploaded]);
      if (target === 'main') updateField('mainImage', uploaded);
      else setValues((current) => ({ ...current, gallery: [...current.gallery, uploaded] }));
      return true;
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Не удалось загрузить изображение.') });
      return false;
    } finally {
      setIsUploading(false);
      window.setTimeout(() => setUploadProgress(null), 400);
    }
  };

  const addGalleryMedia = (item: MediaFile) => {
    setValues((current) => current.gallery.some((galleryItem) => galleryItem.id === item.id)
      ? current
      : { ...current, gallery: [...current.gallery, item] });
    setFeedback(null);
  };

  const removeGalleryMedia = (id: number) =>
    setValues((current) => ({ ...current, gallery: current.gallery.filter((item) => item.id !== id) }));

  const cancel = () => navigate(ROUTES.staffHeroes);

  const confirmNavigation = () => {
    allowNavigationRef.current = true;
    blocker.proceed?.();
  };

  return {
    values,
    districts,
    media,
    errors,
    feedback,
    isEdit,
    isDirty,
    isLoading,
    isSaving,
    isUploading,
    uploadProgress,
    loadError,
    isNavigationBlocked: blocker.state === 'blocked',
    updateField,
    save,
    uploadMedia,
    addGalleryMedia,
    removeGalleryMedia,
    cancel,
    confirmNavigation,
    cancelNavigation: () => blocker.reset?.(),
    dismissFeedback: () => setFeedback(null),
    reload: load,
  };
};
