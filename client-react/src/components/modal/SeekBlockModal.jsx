import PropTypes from "prop-types";
import { CloseOutlined } from "@ant-design/icons";

const SeekBlockModal = ({
  open,
  onClose,
  title = "Bạn không thể tua nhanh video!",
  subtitle = "Hãy học theo trình tự bài bạn nhé!",
  illustration = "/images/warning-lesson.png",
}) => {
  if (!open) return null;

  return (
    <div className="seek-modal__overlay" role="dialog" aria-modal="true">
      <div className="seek-modal__container">
        <button
          className="seek-modal__close"
          aria-label="Đóng"
          onClick={onClose}
        >
          <CloseOutlined />
        </button>

        <div className="seek-modal__body">
          <img
            src={illustration}
            alt="Không tua nhanh video"
            className="seek-modal__img"
          />

          <h3 className="seek-modal__title">{title}</h3>
          <p className="seek-modal__subtitle">{subtitle}</p>

          <button className="seek-modal__primary" onClick={onClose}>
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};

SeekBlockModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  illustration: PropTypes.string,
};

export default SeekBlockModal;
