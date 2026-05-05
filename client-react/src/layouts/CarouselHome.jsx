import { Carousel } from 'antd';
import { motion } from 'framer-motion';
import '.././styles/header.css';

const CarouselHome = () => (
    <motion.div
        className="hero-carousel-home"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
    >
        <Carousel dots autoplay arrows>
            <div>
                <motion.div
                    className="hero-slide"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <img src="/images/README.svg" alt="README" className="hero-image" />
                </motion.div>
            </div>
            <div>
                <motion.div
                    className="hero-slide"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <img src="/images/README.svg" alt="README" className="hero-image" />
                </motion.div>
            </div>
            <div>
                <motion.div
                    className="hero-slide"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <img src="/images/README.svg" alt="README" className="hero-image" />
                </motion.div>
            </div>
            <div>
                <motion.div
                    className="hero-slide"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <img src="/images/README.svg" alt="README" className="hero-image" />
                </motion.div>
            </div>
        </Carousel>
    </motion.div>
);

export default CarouselHome