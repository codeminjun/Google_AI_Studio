const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config();
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3000;

// 파일 경로
const HISTORY_FILE = path.join(__dirname, "conversation.json");

// 미들웨어
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Gemini 모델 초기화
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 65536,
  responseModalities: [],
  responseMimeType: "text/plain",
};

// 대화 기록 불러오기 (content → parts 변환)
function loadHistoryFromFile() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, "utf8");
      const rawHistory = JSON.parse(data);
      return rawHistory
        .filter((item) => item.role && item.content)
        .map((item) => ({
          role: item.role,
          parts: [{ text: item.content }],
        }));
    }
  } catch (error) {
    console.error("Error loading conversation history:", error);
  }
  return [];
}

// 대화 기록 저장 (parts → content 변환)
function saveHistoryToFile(partsHistory) {
  const plainHistory = partsHistory.map((item) => ({
    role: item.role,
    content: item.parts?.[0]?.text || "",
  }));
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(plainHistory, null, 2));
  } catch (error) {
    console.error("Error saving conversation history:", error);
  }
}

// 루트 경로
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 대화 API
app.post("/ask", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is missing." });
    }

    // 히스토리 불러오기
    const history = loadHistoryFromFile();

    // 세션 시작
    const chatSession = model.startChat({
      generationConfig,
      history,
    });

    // 메시지 보내기
    const result = await chatSession.sendMessage(prompt);
    const answer = result.response.text();
    console.log("AI Answer:", answer);

    // 새 기록 추가
    const newHistory = [
      ...history,
      { role: "user", parts: [{ text: prompt }] },
      { role: "model", parts: [{ text: answer }] },
    ];

    // 저장
    saveHistoryToFile(newHistory);

    // 응답 전송
    res.status(200).json({ answer });
  } catch (error) {
    console.error("Error during AI interaction:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 대화 기록 조회
app.get("/history", (req, res) => {
  try {
    const plainHistory = fs.existsSync(HISTORY_FILE)
      ? JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"))
      : [];
    res.status(200).json({ history: plainHistory });
  } catch (error) {
    console.error("Error reading history:", error);
    res.status(500).json({ error: "Failed to load history." });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
