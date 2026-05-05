import { Carousel, Typography } from "antd";
import PropTypes from "prop-types";
// import '../styles/Login.css'
const { Title, Paragraph } = Typography;

const data = [
  {
    img: "/images/Carousel1.png",
    title: "Kho học liệu miễn phí",
    desc:
      "Miễn phí truy cập kho tài liệu khổng lồ, bao gồm bài giảng, video và tài liệu đọc phù hợp với mọi đối tượng."
  },
  {
    img: "/images/Carousel2.png",
    title: "Hình thức E-learning",
    desc:
      "Học mọi lúc, mọi nơi thông qua bài giảng trực tuyến, nội dung đa dạng và linh hoạt."
  },
  {
    img: "/images/Carousel3.png",
    title: "Bài tập vận dụng mô phỏng",
    desc:
      "Áp dụng kiến thức thông qua các bài tập mô phỏng gần với môi trường thực tế."
  }
];

export default function CarouselLogin({ slides = data, ...props }) {
  return (
    <div className="hero-carousel">
      <Carousel
        autoplay
        effect="fade"
        dots={{ className: 'dots-rounded' }}   
        className="carousel-login" {...props}>
        {slides.map((s, i) => (
          <div key={i}>
            <div className="carousel-image">
              <img src={s.img} alt={s.title || `slide-${i}`} />
              <div className="overlay"></div>
              <div className="carousel-content">
                <Title level={3} style={{ color: "rgba(255, 255, 255, 1)" }} className="carousel-title">
                  {s.title}
                </Title>

                <Paragraph className="carousel-des">{s.desc}</Paragraph>
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
}

CarouselLogin.propTypes = {
  slides: PropTypes.arrayOf(
    PropTypes.shape({
      img: PropTypes.string.isRequired,
      title: PropTypes.string,
      desc: PropTypes.string
    })
  )
};
