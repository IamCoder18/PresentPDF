import localforage from 'localforage';

export const pdfStorage = localforage.createInstance({
  name: 'PresentPDF',
  storeName: 'pdfs'
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
}
