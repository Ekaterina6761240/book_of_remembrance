import { useState, type FormEvent } from 'react';
import { ChevronRight, ImagePlus, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import { HeroEditorSection } from '../components/HeroEditorSection';
import { HeroMediaPicker } from '../components/HeroMediaPicker';
import { MediaPreview } from '../components/MediaPreview';
import { UnsavedChangesModal } from '../components/UnsavedChangesModal';
import styles from '../components/HeroEditor.module.css';
import { useHeroEditor } from '../hooks/useHeroEditor';

type MediaTarget = 'main' | 'gallery';

export function StaffHeroFormPage() {
  const { id } = useParams();
  const editor = useHeroEditor(id);
  const [mediaTarget, setMediaTarget] = useState<MediaTarget | null>(null);
  const fullName = [editor.values.lastName, editor.values.firstName, editor.values.middleName].filter(Boolean).join(' ');
  const pageTitle = editor.isEdit ? 'Редактирование страницы' : 'Новая страница';
  const saveLabel = editor.isSaving
    ? 'Сохранение…'
    : editor.isEdit
      ? 'Обновить'
      : editor.values.status === 'published' ? 'Опубликовать' : 'Сохранить';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void editor.save();
  };

  if (editor.isLoading) {
    return <main className={styles.page}><div className={styles.stateMessage} role="status"><span className={styles.spinner} />Загрузка редактора…</div></main>;
  }

  if (editor.loadError) {
    return (
      <main className={styles.page}>
        <div className={styles.stateMessage} role="alert"><p>{editor.loadError}</p><button type="button" onClick={() => void editor.reload()}>Повторить</button><Link to={ROUTES.staffHeroes}>Вернуться к героям</Link></div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
          <Link to={ROUTES.staffHeroes}>Герои</Link><ChevronRight size={12} /><Link to={ROUTES.staffHeroes}>Все герои</Link>
          {editor.isEdit && <><ChevronRight size={12} /><span>{fullName}</span></>}
          <ChevronRight size={12} /><span>{pageTitle}</span>
        </nav>
        <div className={styles.titleRow}>
          <h1>{pageTitle}</h1>
          {editor.isDirty && <span className={styles.dirtyState}>Есть несохранённые изменения</span>}
        </div>
      </header>

      {editor.feedback && (
        <div className={`${styles.feedback} ${editor.feedback.type === 'error' ? styles.feedbackError : ''}`} role={editor.feedback.type === 'error' ? 'alert' : 'status'}>
          <span>{editor.feedback.message}</span>
          <button type="button" onClick={editor.dismissFeedback} aria-label="Скрыть сообщение"><X size={12} /></button>
        </div>
      )}

      <form className={styles.editorGrid} onSubmit={handleSubmit} noValidate>
        <div className={styles.mainColumn}>
          <section className={styles.nameCard}>
            <h2>{fullName || 'Новый герой'}</h2>
            <div className={styles.nameFields}>
              <label className={styles.field}>
                <span>Фамилия <b>*</b></span>
                <input value={editor.values.lastName} onChange={(event) => editor.updateField('lastName', event.target.value)} aria-label="Фамилия" aria-invalid={Boolean(editor.errors.lastName)} />
                {editor.errors.lastName && <small>{editor.errors.lastName}</small>}
              </label>
              <label className={styles.field}>
                <span>Имя <b>*</b></span>
                <input value={editor.values.firstName} onChange={(event) => editor.updateField('firstName', event.target.value)} aria-label="Имя" aria-invalid={Boolean(editor.errors.firstName)} />
                {editor.errors.firstName && <small>{editor.errors.firstName}</small>}
              </label>
              <label className={styles.field}>
                <span>Отчество</span>
                <input value={editor.values.middleName} onChange={(event) => editor.updateField('middleName', event.target.value)} aria-label="Отчество" />
              </label>
            </div>
          </section>

          <HeroEditorSection title="Годы жизни">
            <div className={styles.dateFields}>
              <label className={styles.field}>
                <span>Дата рождения</span>
                <input type="date" value={editor.values.birthDate} onChange={(event) => editor.updateField('birthDate', event.target.value)} aria-label="Дата рождения" />
              </label>
              <label className={styles.field}>
                <span>Дата смерти</span>
                <input type="date" value={editor.values.deathDate} onChange={(event) => editor.updateField('deathDate', event.target.value)} aria-label="Дата смерти" aria-invalid={Boolean(editor.errors.deathDate)} />
                {editor.errors.deathDate && <small>{editor.errors.deathDate}</small>}
              </label>
            </div>
          </HeroEditorSection>

          <HeroEditorSection title="Биография">
            <textarea value={editor.values.biography} onChange={(event) => editor.updateField('biography', event.target.value)} aria-label="Биография" />
          </HeroEditorSection>

          <HeroEditorSection title="Подвиги">
            <textarea value={editor.values.feat} onChange={(event) => editor.updateField('feat', event.target.value)} aria-label="Подвиги" />
          </HeroEditorSection>

          <HeroEditorSection title="Награды">
            <textarea value={editor.values.awards} onChange={(event) => editor.updateField('awards', event.target.value)} aria-label="Награды" />
          </HeroEditorSection>

          <HeroEditorSection title="Галерея">
            {editor.values.gallery.length > 0 && (
              <div className={styles.gallery}>
                {editor.values.gallery.map((item) => (
                  <div className={styles.galleryItem} key={item.id}>
                    <MediaPreview media={item} className={styles.galleryPreview} />
                    <button type="button" onClick={() => editor.removeGalleryMedia(item.id)} aria-label={`Удалить ${item.name ?? `изображение ${item.id}`} из галереи`}><X size={12} /></button>
                    <span title={item.name}>{item.name ?? `Изображение ${item.id}`}</span>
                  </div>
                ))}
              </div>
            )}
            <button className={styles.darkButton} type="button" onClick={() => setMediaTarget('gallery')}><ImagePlus size={14} />Добавить изображение</button>
          </HeroEditorSection>
        </div>

        <aside className={styles.sideColumn}>
          <section className={styles.publishCard}>
            <h2>Опубликовать</h2>
            <label className={styles.field}>
              <span>Статус</span>
              <select value={editor.values.status} onChange={(event) => editor.updateField('status', event.target.value as 'draft' | 'published')} aria-label="Статус">
                <option value="draft">Черновик</option>
                <option value="published">Опубликовано</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Опубликовать</span>
              <select value={editor.values.publishMode} onChange={(event) => editor.updateField('publishMode', event.target.value as 'now' | 'scheduled')} aria-label="Режим публикации">
                <option value="now">Сразу</option>
                <option value="scheduled">Выбрать дату и время</option>
              </select>
            </label>
            {editor.values.status === 'published' && editor.values.publishMode === 'scheduled' && (
              <div className={styles.scheduleFields}>
                <span>Дата и время публикации</span>
                <div>
                  <label className={styles.field}><input type="date" value={editor.values.publishDate} onChange={(event) => editor.updateField('publishDate', event.target.value)} aria-label="Дата публикации" aria-invalid={Boolean(editor.errors.publishDate)} />{editor.errors.publishDate && <small>{editor.errors.publishDate}</small>}</label>
                  <label className={styles.field}><input type="time" value={editor.values.publishTime} onChange={(event) => editor.updateField('publishTime', event.target.value)} aria-label="Время публикации" aria-invalid={Boolean(editor.errors.publishTime)} />{editor.errors.publishTime && <small>{editor.errors.publishTime}</small>}</label>
                </div>
              </div>
            )}
            <button className={styles.saveButton} type="submit" disabled={editor.isSaving || editor.isUploading}>{saveLabel}</button>
            <button className={styles.cancelButton} type="button" onClick={editor.cancel}><X size={12} />Отменить</button>
          </section>

          <HeroEditorSection title="Район">
            <div className={styles.districtList} role="radiogroup" aria-label="Район героя">
              {editor.districts.map((district) => (
                <label key={district.id}><input type="radio" name="district" checked={editor.values.districtId === district.id} onChange={() => editor.updateField('districtId', district.id)} /><span>{district.name}</span></label>
              ))}
            </div>
            {editor.errors.districtId && <small className={styles.standaloneError}>{editor.errors.districtId}</small>}
            <Link className={styles.addDistrictLink} to={ROUTES.staffDistricts}>+ Добавить новый район</Link>
          </HeroEditorSection>

          <HeroEditorSection title="Фотография героя">
            {editor.values.mainImage ? (
              <div className={styles.mainImage}>
                <button className={styles.imageSelect} type="button" onClick={() => setMediaTarget('main')} aria-label="Изменить фотографию героя"><MediaPreview media={editor.values.mainImage} className={styles.mainImagePreview} /></button>
                <button className={styles.removeMainImage} type="button" onClick={() => editor.updateField('mainImage', null)} aria-label="Удалить фотографию героя"><X size={12} /></button>
                <p>Нажмите на изображение, чтобы изменить или обновить его</p>
              </div>
            ) : (
              <button className={`${styles.darkButton} ${styles.fullButton}`} type="button" onClick={() => setMediaTarget('main')}><ImagePlus size={14} />Выбрать изображение</button>
            )}
          </HeroEditorSection>
        </aside>
      </form>

      {mediaTarget && (
        <HeroMediaPicker
          title={mediaTarget === 'main' ? 'Фотография героя' : 'Добавить в галерею'}
          media={editor.media}
          selectionMode={mediaTarget === 'main' ? 'single' : 'multiple'}
          disabledIds={new Set(mediaTarget === 'main' ? (editor.values.mainImage ? [editor.values.mainImage.id] : []) : editor.values.gallery.map((item) => item.id))}
          isUploading={editor.isUploading}
          uploadProgress={editor.uploadProgress}
          uploadError={editor.feedback?.type === 'error' ? editor.feedback.message : null}
          onConfirm={(items) => {
            if (mediaTarget === 'main') editor.updateField('mainImage', items[0] ?? null);
            else items.forEach(editor.addGalleryMedia);
            setMediaTarget(null);
          }}
          onUpload={(files) => {
            void (async () => {
              let succeeded = true;
              for (const file of files) succeeded = await editor.uploadMedia(file, mediaTarget) && succeeded;
              if (succeeded) setMediaTarget(null);
            })();
          }}
          onClose={() => setMediaTarget(null)}
        />
      )}

      {editor.isNavigationBlocked && <UnsavedChangesModal onConfirm={editor.confirmNavigation} onCancel={editor.cancelNavigation} />}
    </main>
  );
}
