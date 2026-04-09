import api from "./api";

export async function uploadMedicalDocument(file, docType = "OTHER", label = "Document") {
  const formData = new FormData();
  formData.append("file", file);
  
  // The backend might accept docType and label in the future, 
  // but currently upload just handles the Cloudinary portion.
  // We attach it to return the full payload needed for the Record creation.
  
  const res = await api.post("/records/documents/upload/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  
  if (res.data.success) {
    return {
      doc_type: docType,
      label,
      cloudinary_url: res.data.data.cloudinary_url,
      cloudinary_public_id: res.data.data.cloudinary_public_id,
      file_type: file.name.split('.').pop().toLowerCase() === 'pdf' ? 'pdf' : 'image',
    };
  }
  throw new Error(res.data.message || "Upload failed");
}

export async function deleteMedicalDocument(id) {
  const res = await api.delete(`/records/documents/${id}/`);
  return res.data;
}
