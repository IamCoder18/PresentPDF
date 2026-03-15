import localforage from 'localforage';

export const pdfStorage = localforage.createInstance({
  name: 'PresentPDF',
  storeName: 'pdfs'
});

export const notesStorage = localforage.createInstance({
  name: 'PresentPDF',
  storeName: 'notes'
});

export async function savePDF(id: string, file: File): Promise<void> {
  const arrayBuffer = await file.arrayBuffer();
  await pdfStorage.setItem(id, arrayBuffer);
}

export async function getPDF(id: string): Promise<ArrayBuffer | null> {
  return await pdfStorage.getItem<ArrayBuffer>(id);
}

export async function deletePDF(id: string): Promise<void> {
  await pdfStorage.removeItem(id);
  await deleteNotes(id); // Delete associated notes when PDF is deleted
}

export async function saveNotes(id: string, notes: Record<number, string>): Promise<void> {
  await notesStorage.setItem(id, notes);
}

export async function getNotes(id: string): Promise<Record<number, string> | null> {
  return await notesStorage.getItem<Record<number, string>>(id);
}

export async function deleteNotes(id: string): Promise<void> {
  await notesStorage.removeItem(id);
}
