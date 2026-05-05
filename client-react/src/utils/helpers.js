import dayjs from "dayjs";
export const normalize = (s = "") =>
  s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export const slugify = (text) => {
  if (!text) return "";
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};
export const authorName = (author) => {
  if (author?.firstName || author?.lastName) {
    return `${author?.firstName ?? ""} ${author?.lastName ?? ""}`.trim();
  }
  return author?.username || (author?.id ? `#${author.id}` : "-");
};
export const toPreview = (fileOrUrl) => {
  if (typeof fileOrUrl === "string") return fileOrUrl;
  if (!fileOrUrl) return null;
  const f = fileOrUrl?.originFileObj || fileOrUrl;
  try {
    return URL.createObjectURL(f);
  } catch {
    return null;
  }
};
export const formatDate = (dateValue, format = "DD/MM/YYYY HH:mm") => {
  if (!dateValue) return null;
  try {
    const parsed = dayjs(dateValue);
    return parsed.isValid() ? parsed.format(format) : null;
  } catch {
    return null;
  }
};
export const safeParseDate = (dateValue) => {
  if (!dateValue) return null;
  try {
    const parsed = dayjs(dateValue);
    return parsed.isValid() ? parsed : null;
  } catch {
    return null;
  }
};
export const fixQuillContent = (htmlString) => {
  if (!htmlString || typeof htmlString !== "string") return "";

  let content = htmlString;

  content = content.replace(/^<div>(.*)<\/div>$/s, "$1");

  return content;
};

export const convertHtmlToText = (html) => {
  if (!html) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");

  return doc.body.textContent || "";
};

// Map category từ backend sang display format
export const formatCategoryDisplay = (category) => {
  if (!category) return "";
  
  const categoryMap = {
    FRONT_END: "Front-End",
    BACK_END: "Back-End",
    DEVOPS_CLOUD: "DevOps-Cloud",
    DATA_AI: "Data-AI",
    UI_UX_DESIGN: "UI/UX-Design",
    // Giữ lại các giá trị cũ để backward compatibility
    ARTICLE: "Article",
    VIDEO: "Video",
  };
  
  return categoryMap[category.toUpperCase()] || category;
};

// Map display format về backend format (dùng cho form)
export const formatCategoryBackend = (displayCategory) => {
  if (!displayCategory) return "";
  
  const reverseMap = {
    "Front-End": "FRONT_END",
    "Back-End": "BACK_END",
    "DevOps-Cloud": "DEVOPS_CLOUD",
    "Data-AI": "DATA_AI",
    "UI/UX-Design": "UI_UX_DESIGN",
    // Giữ lại các giá trị cũ
    Article: "ARTICLE",
    Video: "VIDEO",
  };
  
  return reverseMap[displayCategory] || displayCategory.toUpperCase();
};

// Danh sách categories với display format cho Select options
export const CATEGORY_OPTIONS = [
  { value: "FRONT_END", label: "Front-End" },
  { value: "BACK_END", label: "Back-End" },
  { value: "DEVOPS_CLOUD", label: "DevOps-Cloud" },
  { value: "DATA_AI", label: "Data-AI" },
  { value: "UI_UX_DESIGN", label: "UI/UX-Design" },
];

// Tạo màu tag động dựa trên category (dùng để đồng bộ màu tag giữa các trang)
export const getDynamicTagColor = (category) => {
  if (!category) return "default";

  const colors = [
    "red",
    "blue",
    "green",
    "purple",
    "orange",
    "cyan",
    "magenta",
    "gold",
  ];
  let hash = 0;
  const categoryStr = typeof category === "string" ? category : String(category);
  for (let i = 0; i < categoryStr.length; i++) {
    hash = categoryStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
