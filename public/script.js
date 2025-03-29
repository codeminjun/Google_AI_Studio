document.getElementById('submitBtn').addEventListener('click', async () => {
    const promptText = document.getElementById('promptInput').value;
    const responseArea = document.getElementById('responseArea');
    
    if (!promptText.trim()) {
      responseArea.innerText = "질문을 입력하세요.";
      return;
    }
    
    responseArea.classList.add('loading');
    responseArea.innerText = "AI의 답변을 기다리는 중...";
  
    try {
      const res = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        responseArea.innerText = `오류 발생: ${errorData.error}`;
        responseArea.classList.remove('loading');
        return;
      }
      
      const data = await res.json();
      responseArea.classList.remove('loading');
      responseArea.innerText = data.answer || "응답이 없습니다.";
    } catch (error) {
      console.error('Error:', error);
      responseArea.classList.remove('loading');
      responseArea.innerText = '서버와 통신 중 오류 발생.';
    }
  });