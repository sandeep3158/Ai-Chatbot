import { useEffect, useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import botIcon from './assets/bot.svg';
import userIcon from './assets/user.svg';
import sendIcon from './assets/send.svg';
import './App.css'

function App() {
  const [chatHistory, setChatHistory] = useState(() => {
    const savedData = sessionStorage.getItem('content');
    return savedData ? JSON.parse(savedData) : [];
  });

  // Effect to update sessionStorage when chatHistory changes
  useEffect(() => {
    sessionStorage.setItem('content', JSON.stringify(chatHistory));
  }, [chatHistory]);
  const handleSubmit = async (e) => {
    e.preventDefault();

    const API_KEY = import.meta.env.VITE_API_KEY;
    const genAI = new GoogleGenerativeAI(API_KEY);

    const data = new FormData(e.target);
    const prompt = data.get('prompt');
    const uniqueId = generateUniqueId();

    setChatHistory(prevChat => [
      ...prevChat,
      { id: `user${uniqueId}`, isAi: false, value: prompt }
    ]);
    e.target.reset();
    setChatHistory(prevChat => [
      ...prevChat,
      { id: uniqueId, isAi: true, value: 'Loading...' }
    ]);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;

      if (response) {
        const responseData = await response.text();
        const parsedData = responseData.trim();
        setChatHistory(prevChat => {
          const updatedChat = [...prevChat];
          const aiMessageIndex = updatedChat.findIndex(msg => msg.id === uniqueId);
          if (aiMessageIndex !== -1) {
            updatedChat[aiMessageIndex].value = parsedData;
          }
          return updatedChat;
        });
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      setChatHistory(prevChat => {
        const updatedChat = [...prevChat];
        const aiMessageIndex = updatedChat.findIndex(msg => msg.id === uniqueId);
        if (aiMessageIndex !== -1) {
          updatedChat[aiMessageIndex].value = 'Something went wrong';
        }
        return updatedChat;
      });
      alert(error.message);
    }
  };

  const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
  };

  const renderChatHistory = () => {
    return chatHistory.map((message, index) => (
      <div key={index} className={`wrapper ${message.isAi ? 'ai' : ''}`}>
        <div className="chat">
          <div className="profile">
            <img src={message.isAi ? botIcon : userIcon} alt={message.isAi ? 'bot' : 'user'} />
          </div>
          <div className="message" id={message.id}>
            {message.value}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div id="container">
      <h1> <i className="fas fa-robot"> </i>  My Ai ChatBot App</h1>
      <div id="chat_container" className="chat-container">
        {renderChatHistory()}
      </div>
      <form onSubmit={handleSubmit}>
        <input type="text" name="prompt" placeholder='Ask Me...' />
        <button type="submit"><img src={sendIcon} /></button>
      </form>
    </div>
  );
};

export default App;
