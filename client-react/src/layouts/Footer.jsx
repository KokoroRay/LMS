import '.././styles/footer.css'

const Footer = () => {
    return (
        <div className="footer-container">
            {/* Hình nền */}
            <img
                src="/images/background-footer.svg"
                alt="README"
                className="footer-background"
            />

            {/* Overlay cam blend giữ chi tiết ảnh */}
            <div className="footer-overlay footer-overlay-blend" />
            <div className="footer-overlay footer-overlay-opacity" />

            {/* Nội dung footer */}
            <div className="footer-content">
                {/* Logo + title */}
                <div className="footer-header">
                    <img
                        className="footer-logo"
                        src="/images/logowhite-Mankai.svg"
                        alt="Mankai Academy"
                    />
                    <div className="footer-title">
                        MANKAI ACADEMY - HỌC VIỆN ĐÀO TẠO PHÁT TRIỂN TIẾNG NHẬT THỰC CHIẾN
                    </div>
                    <hr className="footer-divider" />
                </div>

                {/* Info 3 cột */}
                <div className="footer-grid">
                    {/* Thông tin liên hệ */}
                    <div className="footer-section">
                        <h3>THÔNG TIN LIÊN HỆ</h3>
                        <div className="footer-contact-item">
                            <img src="/icons/icon-address-footer.svg" alt="location" className="footer-icon top" />
                            <span><b>Địa chỉ:</b> Tòa Sông Đà, Đường Phạm Hùng, Mỹ Đình, Nam Từ Liêm, Hà Nội</span>
                        </div>
                        <div className="footer-contact-item center">
                            <img src="/icons/icon-phone-footer.svg" alt="phone" className="footer-icon" />
                            <span><b>Hotline:</b> 0835 662 538</span>
                        </div>
                        <div className="footer-contact-item center">
                            <img src="/icons/icon-email-footer.svg" alt="email" className="footer-icon" />
                            <span><b>Email:</b> support@mankai.edu.vn</span>
                        </div>
                    </div>

                    {/* Social */}
                    <div className="footer-section">
                        <h3>THEO DÕI CHÚNG TÔI TẠI</h3>
                        <div className="footer-social">
                            <img src="/icons/icon-facebook-footer.svg" alt="Facebook" />
                            <img src="/icons/icon-youtube-footer.svg" alt="YouTube" />
                        </div>
                    </div>

                    {/* Quote */}
                    <div className="footer-section">
                        <div className="footer-quote">
                            "Hạnh phúc là điểm khởi đầu của giáo dục và cũng là đích đến cuối cùng.
                            Giang, với hơn 10 năm kinh nghiệm giảng dạy và luyện thi JLPT, mong
                            muốn giúp các bạn rút ngắn thời gian, vượt qua khó khăn trong việc học
                            tiếng Nhật, và chinh phục tấm bằng JLPT. Hãy biến học tập thành không
                            chỉ là mục tiêu phát triển bản thân mà còn là hành trình hạnh phúc để
                            hiện thực hóa những giấc mơ."
                            <span className="footer-quote-author">
                                Giang Suke Sensei - CEO Mankai Academy
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bản quyền */}
                <div className="footer-copyright">
                    © 2024 By Rikkei Academy - Rikkei Education - All rights reserved.
                </div>
            </div>
        </div>
    )
}

export default Footer
