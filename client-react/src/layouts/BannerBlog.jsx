import { Breadcrumb } from "antd"
import { HomeOutlined } from '@ant-design/icons'
import { Link } from "react-router-dom"
import '../styles/bannerblog.css'

const BannerBlog = () => {
    return (
        <div className="banner-blog-container">
            {/* Hình nền */}
            <img
                src="/images/TextureBanner-E-Learning.svg"
                alt="Banner Background"
                className="banner-blog-background"
            />

            {/* Overlay màu cam phủ ảnh nền */}
            <div className="banner-blog-overlay" />

            {/* Nội dung banner */}
            <div className="banner-blog-content">
                <Breadcrumb
                    className="banner-breadcrumb"
                    separator="/"
                    items={[
                        {
                            title: (
                                <Link to="/" className="banner-breadcrumb-link">
                                    Trang chủ
                                </Link>
                            ),
                        },
                        {
                            title: <span className="banner-breadcrumb-text">Bài viết</span>,
                        },
                    ]}
                />
                <h1 className="banner-title">
                    Bài viết
                </h1>
            </div>
        </div>
    )
}

export default BannerBlog
