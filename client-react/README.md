# Ứng dụng E-Learning Client React

Đây là ứng dụng frontend cho nền tảng e-learning, được xây dựng bằng React và Vite. Ứng dụng cung cấp giao diện cho sinh viên, giảng viên và quản trị viên để quản lý khóa học, bài học, điểm danh, và các tính năng khác.

## Mục lục
- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt](#cài-đặt)
- [Chạy dự án](#chạy-dự-án)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Thư viện chính và cách sử dụng](#thư-viện-chính-và-cách-sử-dụng)
- [Scripts](#scripts)
- [Đóng góp](#đóng-góp)

## Tính năng chính
- Quản lý khóa học và bài học
- Điểm danh và theo dõi tiến độ
- Hệ thống quiz và bài tập
- Diễn đàn thảo luận
- Quản lý người dùng (sinh viên, giảng viên, admin)
- Tích hợp video và tài liệu

## Công nghệ sử dụng
- **React 18**: Thư viện JavaScript cho xây dựng giao diện người dùng
- **Vite**: Công cụ build nhanh cho dự án frontend
- **Ant Design (Antd)**: Thư viện UI components
- **Redux Toolkit**: Quản lý trạng thái ứng dụng
- **React Router**: Điều hướng trong ứng dụng
- **Axios**: Thư viện HTTP client
- **Và nhiều thư viện khác** (xem package.json)
- **npm install @antv/g6** (chart)

## Cài đặt

### 1. Clone repository
```bash
git clone https://git.rikkei.edu.vn/ojt-fu-cantho/b2/group01/client-react.git
cd client-react
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cài đặt các thư viện bổ sung (nếu cần)
Một số thư viện chính đã được liệt kê trong package.json. Nếu gặp lỗi thiếu thư viện, cài đặt thêm:
```bash
npm install react-router-dom antd axios lucide-react moment prismjs framer-motion
```

## Chạy dự án

### Chạy ở chế độ development
```bash
npm run dev
```
Ứng dụng sẽ chạy tại `http://localhost:5173` (hoặc port khác nếu bị chiếm).

### Build cho production
```bash
npm run build
```

### Preview build
```bash
npm run preview
```

### Lint code
```bash
npm run lint
```

## Cấu trúc dự án
```
src/
├── App.jsx              # Component chính của ứng dụng
├── main.jsx             # Điểm vào của ứng dụng
├── components/          # Các component tái sử dụng
├── pages/               # Các trang của ứng dụng
├── layouts/             # Layouts cho các trang
├── routes/              # Cấu hình routing
├── redux/               # Quản lý trạng thái với Redux
├── services/            # API services
├── utils/               # Các utility functions
├── styles/              # CSS và styles
└── config/              # Cấu hình ứng dụng
```

## Thư viện chính và cách sử dụng

### React và React DOM
- **React**: Xây dựng giao diện người dùng với components.
- **React DOM**: Render React components vào DOM.

### Ant Design (Antd)
- Thư viện UI components phong phú.
- Cách sử dụng: Import components từ `antd` và sử dụng trong JSX.
```jsx
import { Button, Card } from 'antd';

function MyComponent() {
  return (
    <Card>
      <Button type="primary">Click me</Button>
    </Card>
  );
}
```

### Redux Toolkit
- Quản lý trạng thái toàn cục.
- Cách sử dụng: Tạo slices, dispatch actions, và select state.
```jsx
import { useDispatch, useSelector } from 'react-redux';
import { someAction } from './redux/slices/someSlice';

function MyComponent() {
  const dispatch = useDispatch();
  const data = useSelector(state => state.someSlice.data);

  const handleClick = () => {
    dispatch(someAction());
  };

  return <button onClick={handleClick}>Action</button>;
}
```

### React Router DOM
- Điều hướng giữa các trang.
- Cách sử dụng: Sử dụng `BrowserRouter`, `Routes`, `Route`.
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Axios
- Gửi HTTP requests.
- Cách sử dụng: Tạo instance axios và sử dụng cho API calls.
```jsx
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com'
});

function fetchData() {
  return api.get('/data');
}
```

### Các thư viện khác
- **@cloudinary/react**: Tích hợp Cloudinary cho upload và hiển thị ảnh.
- **@monaco-editor/react**: Editor code Monaco.
- **framer-motion**: Animation cho React.
- **highlight.js**: Highlight code.
- **hls.js**: Phát video HLS.
- **lodash**: Utility functions.
- **moment**: Xử lý ngày tháng.
- **prismjs**: Syntax highlighting.
- **react-quill**: Rich text editor.
- **sockjs-client**: WebSocket client.
- **xlsx**: Xử lý file Excel.

## Scripts
- `npm run dev`: Chạy development server
- `npm run build`: Build cho production
- `npm run lint`: Kiểm tra linting
- `npm run preview`: Preview build production

## Đóng góp
1. Fork repository
2. Tạo branch mới cho feature
3. Commit changes
4. Push và tạo Pull Request

## Lưu ý
- Đảm bảo Node.js version >= 16
- Sử dụng npm để quản lý packages
- Tuân thủ ESLint rules
