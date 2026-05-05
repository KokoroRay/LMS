import React from 'react';

const NoskipVideoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const finalImage = "/icons/noskipvideo.png";

  return (
    <div style={styles.overlay} onClick={onClose}>
      {/* Thêm thẻ style trực tiếp vào đây để định nghĩa Keyframes */}
      <style>
        {`
          @keyframes overlayFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes modalPopIn {
            from { opacity: 0; transform: scale(0.9) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}
      </style>

      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Nút đóng (X) */}
        <button 
          style={styles.closeButton} 
          onClick={onClose}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'} 
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 6L18 18" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Nội dung chính */}
        <div style={styles.content}>
          <div style={styles.imageWrapper}>
            <img 
              src={finalImage} 
              alt="Không thể tua nhanh" 
              style={styles.image}
            />
          </div>

          <h2 style={styles.title}>Bạn không thể tua nhanh video!</h2>
          <p style={styles.subtitle}>Hãy học theo trình tự bài bạn nhé!</p>
        </div>
      </div>
    </div>
  );
};

// Định nghĩa Style Object
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    // Thêm animation cho nền đen
    animation: 'overlayFadeIn 0.3s ease-out forwards',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    width: '640px',        
    borderRadius: '16px',  
    padding: '40px',        
    position: 'relative',   
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    maxWidth: '90%',        
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif',
    // Thêm animation cho hộp thoại (nảy lên nhẹ)
    animation: 'modalPopIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', 
  },
  closeButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  imageWrapper: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'center',
  },
  image: {
    width: '359px',   
    height: '288px',  
    objectFit: 'contain',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#000000',
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#666666',
    margin: 0,
  }
};

export default NoskipVideoModal;