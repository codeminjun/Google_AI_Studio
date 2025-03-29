const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config();

// (추가) 파일 시스템 모듈
const fs = require("fs");

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3000;

// 최대 대화 기록 수 (필요에 맞게 수정)
const MAX_HISTORY = 10;
// 대화 기록이 저장될 파일 경로
const HISTORY_FILE = path.join(__dirname, "conversation.json");

// 메모리에 대화 기록을 보관할 배열
let conversationHistory = [];

/* -------------------- 1) 서버 시작 시 JSON 파일 로드 -------------------- */
function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      const data = fs.readFileSync(HISTORY_FILE, "utf8");
      conversationHistory = JSON.parse(data);
    } catch (error) {
      console.error("JSON 파싱 오류:", error);
      conversationHistory = [];
    }
  } else {
    conversationHistory = [];
  }
}

/* -------------------- 2) 대화 기록을 JSON 파일에 저장 -------------------- */
function saveHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(conversationHistory, null, 2));
  } catch (error) {
    console.error("JSON 저장 오류:", error);
  }
}

// 서버 시작 시 기존 대화 기록 로드
loadHistory();

// 미들웨어 설정: JSON 및 URL-encoded 데이터 파싱
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 정적 파일 제공 (예: public 폴더 사용)
app.use(express.static(path.join(__dirname, "public")));

// Google Generative AI 설정
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-pro-exp-03-25",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 65536,
  responseModalities: [],
  responseMimeType: "text/plain",
};

// 루트 경로에서 index.html 제공
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 클라이언트에서 프롬프트를 받아 AI API를 호출하는 엔드포인트
app.post("/ask", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is missing." });
    }

    // 새로운 채팅 세션 시작
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    // 클라이언트에서 받은 프롬프트를 전송
    const result = await chatSession.sendMessage(prompt);
    // AI 응답 텍스트 추출
    const answer = result.response.text();
    console.log("AI Answer:", answer);

    // (추가) 대화 기록에 저장
    conversationHistory.push({ prompt, answer });

    // (추가) 최대 기록 수 초과 시 오래된 항목 제거
    if (conversationHistory.length > MAX_HISTORY) {
      conversationHistory.shift(); // 맨 앞(가장 오래된 기록) 제거
    }

    // (추가) 변경된 대화 기록을 JSON 파일에 저장
    saveHistory();

    // 클라이언트로 응답
    res.status(200).json({ answer });
  } catch (error) {
    console.error("Error calling AI API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});