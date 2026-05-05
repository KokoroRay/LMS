// Fake quiz service to simulate API calls

const FAKE_QUIZ_DATA = {
    1: {
        title: "[Quizz] JS Cơ bản",
        kind: "Bài kiểm tra",
        count: "5 câu hỏi",
        image: "/images/lesson-quizz.png",
        description:
            "Ornare eu elementum felis porttitor nunc tortor. Ornare neque accumsan metus nulla ultricies maecenas rhoncus ultrices cras. Vestibulum varius adipiscing ipsum.",
        durationSec: 120,
        questions: [
            {
                id: "q1",
                points: 20,
                text: "Có thể không sử dụng CSS vẫn layout được hay không?",
                options: ["Đúng", "Sai", "Vừa vừa", "Cả 3 đáp án trên đều đúng"],
                correctIndex: 0,
            },
            {
                id: "q2",
                points: 20,
                text: "Phương thức nào dùng để chuyển chuỗi thành số nguyên trong JavaScript?",
                options: [
                    "Number.parseInt()",
                    "JSON.parse()",
                    "toString()",
                    "Math.floor()",
                ],
                correctIndex: 0,
            },
            {
                id: "q3",
                points: 20,
                text: "let khác var ở điểm nào?",
                options: [
                    "Phạm vi block",
                    "Hoisting",
                    "Không khác",
                    "Chỉ dùng trong function",
                ],
                correctIndex: 0,
            },
            {
                id: "q4",
                points: 20,
                text: "Array.prototype.filter trả về gì?",
                options: ["Số", "Chuỗi", "Mảng mới đã lọc", "Boolean"],
                correctIndex: 2,
            },
            {
                id: "q5",
                points: 20,
                text: "DOM là viết tắt của?",
                options: [
                    "Document Object Model",
                    "Data Object Mapping",
                    "Display Object Model",
                    "Document Oriented Map",
                ],
                correctIndex: 0,
            },
        ],
    },
};


export const getQuizByLessonId = (lessonId) => {
    console.log(`Fetching quiz for lessonId: ${lessonId}`);
    return new Promise((resolve) => {
        setTimeout(() => {
            // Return data for lessonId 1, or the first available quiz as a fallback
            const quizData = FAKE_QUIZ_DATA[lessonId] || FAKE_QUIZ_DATA[1];
            resolve(quizData);
        }, 500); // Simulate network delay
    });
};
