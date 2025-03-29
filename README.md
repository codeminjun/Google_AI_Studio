Programmer Information
•	Name: Min Jun Kim
•	Email: koexmin@gmail.com
•	GitHub: codeminjun

 Usage
1.	Open your browser and navigate to http://localhost:3000.
2.	On the front-end page, you will see a form where you can enter your prompt/question.
3.	Click the “질문 보내기” (Send Question) button:
•	Your prompt is sent to the backend via the /ask endpoint.
•	The server calls the AI API using your prompt and processes the response.
•	The AI’s answer is saved along with your prompt in conversation.json (up to a maximum of 10 records; if the limit is exceeded, the oldest record is removed).
•	The AI’s answer is then returned to the front-end and displayed in the response area.
