import api from "./authService"; 

const CATEGORY_PATH = "/categories"; 



export const getAllCategoriesAPI = async () => {
    const response = await api.get(CATEGORY_PATH); 
    // Trả về mảng dữ liệu trực tiếp
    return response.data; 
};

export const getAllCategories = async () => {
    const response = await api.get(CATEGORY_PATH); 
    return response.data; 
};

export const createCategory = async (dto) => {
    const response = await api.post(CATEGORY_PATH, dto);
    return response.data;
};

export const updateCategory = async (id, dto) => {
    const response = await api.put(`${CATEGORY_PATH}/${id}`, dto);
    return response.data;
};

export const deleteCategory = async (id) => {
    await api.delete(`${CATEGORY_PATH}/${id}`);
};