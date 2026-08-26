import { type FormEvent, useState } from 'react';
import { X } from 'lucide-react';
import type { DistrictFormData } from '../../shared/types';
import { createSlug } from '../../shared/utils';
import type { DistrictEditor } from '../hooks/useStaffDistricts';
import styles from './Districts.module.css';

type DistrictFormProps = {
  editor: Exclude<DistrictEditor, null>;
  isSaving: boolean;
  onSubmit(data: DistrictFormData): Promise<boolean>;
  onCancel(): void;
};

export function DistrictForm({ editor, isSaving, onSubmit, onCancel }: DistrictFormProps) {
  const district = editor.mode === 'edit' ? editor.district : null;
  const [name, setName] = useState(district?.name ?? '');
  const [slug, setSlug] = useState(district?.slug ?? '');
  const [slugWasEdited, setSlugWasEdited] = useState(editor.mode === 'edit');
  const isDisabled = isSaving || name.trim() === '' || slug.trim() === '';

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugWasEdited) setSlug(createSlug(value));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDisabled) return;
    await onSubmit({ name: name.trim(), slug: createSlug(slug) });
  };

  return (
    <form className={styles.formCard} onSubmit={handleSubmit}>
      <div className={styles.formFields}>
        <label className={styles.formField}>
          <input value={name} onChange={(event) => handleNameChange(event.target.value)} placeholder="Название" aria-label="Название" disabled={isSaving} />
          <span>Название определяет, как элемент будет отображаться на вашем сайте</span>
        </label>
        <label className={styles.formField}>
          <input value={slug} onChange={(event) => { setSlug(event.target.value); setSlugWasEdited(true); }} placeholder="Ярлык" aria-label="Ярлык" disabled={isSaving} />
          <span>Вариант названия, подходящий для URL. Обычно содержит только латинские буквы в нижнем регистре, цифры и дефисы</span>
        </label>
      </div>
      <div className={styles.formActions}>
        <button className={styles.primaryButton} type="submit" disabled={isDisabled}>{isSaving ? 'Сохранение…' : editor.mode === 'create' ? 'Добавить' : 'Сохранить'}</button>
        <button className={styles.cancelButton} type="button" onClick={onCancel} disabled={isSaving}><X size={12} />Отменить</button>
      </div>
    </form>
  );
}
