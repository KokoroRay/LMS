// src/components/common/ProgressFireworks.jsx
import React, { useEffect, useRef } from "react";
import { Progress } from "antd";
import confetti from "canvas-confetti";
import PropTypes from "prop-types";

export default function ProgressFireworks({ percent, onComplete, status, ...rest }) {
    const hasFiredRef = useRef(false);

    useEffect(() => {
        if (percent >= 100 && !hasFiredRef.current) {
            hasFiredRef.current = true;

            const duration = 200; // ms
            const end = Date.now() + duration;
            const colors = ["#F37142", "#FFB703", "#2A9D8F", "#E76F51", "#264653"];

            const frame = () => {
                confetti({
                    particleCount: 24,
                    spread: 70,
                    startVelocity: 40,
                    scalar: 0.9,
                    ticks: 150,
                    origin: { x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.4 + 0.5 },
                    colors,
                });
                if (Date.now() < end) requestAnimationFrame(frame);
            };
            frame();

            if (onComplete) onComplete();
        }

        if (percent < 100) {
            hasFiredRef.current = false;
        }
    }, [percent, onComplete]);

    const computedStatus = percent >= 100 ? "success" : status;

    return <Progress percent={percent} status={computedStatus} {...rest} />;
}

ProgressFireworks.propTypes = {
    percent: PropTypes.number.isRequired,
    onComplete: PropTypes.func,
    status: PropTypes.oneOf(["normal", "exception", "active", "success"]),
};