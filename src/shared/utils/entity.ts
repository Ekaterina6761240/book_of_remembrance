export const nextEntityId = (entities: ReadonlyArray<{ id: number }>): number =>
  entities.reduce((maxId, entity) => Math.max(maxId, entity.id), 0) + 1;

export const findEntityIndex = (entities: ReadonlyArray<{ id: number }>, id: number): number => {
  const index = entities.findIndex((entity) => entity.id === id);
  if (index === -1) {
    throw new Error(`Entity with id ${id} was not found`);
  }
  return index;
};
