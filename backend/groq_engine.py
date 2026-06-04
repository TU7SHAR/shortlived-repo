import logging
import asyncio
import re
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from config import GROQ_API_KEY, model

logger = logging.getLogger(__name__)

llm = ChatGroq(
    model=model,
    api_key=GROQ_API_KEY,
    temperature=0.3
)

prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "You are Salesji, an expert internal Sales Assistant for this company. \n"
        "Your ONLY source of truth is the CONTEXT provided below. \n\n"
        "CRITICAL INSTRUCTIONS:\n"
        "1. You MUST answer the user's question using ONLY the provided CONTEXT.\n"
        "2. If the answer cannot be found in the CONTEXT, you MUST refuse to answer and say exactly: 'I do not have information on that in the company knowledge base.'\n"
        "3. DO NOT use outside world knowledge. DO NOT guess, infer, or make up information.\n"
        "4. Always mention the source file(s) you used at the very end of your answer in a new line (e.g., 'Source: [filename]').\n\n"
        "CONTEXT:\n{context}"
    )),
    MessagesPlaceholder(variable_name="chat_history", optional=True),
    ("human", "{question}")
])

async def get_groq_response(user_message: str, context: str, temperature: float = 0.3) -> str:
    MAX_CHARS = 25000
    if len(context) > MAX_CHARS:
        context = context[:MAX_CHARS] + "\n... [Context truncated to fit AI memory limits]"
        
    logger.info(f"GROQ API CALL -> Query: '{user_message[:50]}...' | Temp: {temperature} | Context Size: {len(context)} chars")
    
    try:
        dynamic_llm = llm.bind(temperature=temperature)
        chain = prompt | dynamic_llm
        
        response = await chain.ainvoke({"context": context, "question": user_message})
        final_answer = re.sub(r'<think>.*?</think>', '', response.content, flags=re.DOTALL).strip()
        
        logger.info(f"GROQ API 200 -> Success. Response length: {len(final_answer)} chars")
        return final_answer
        
    except Exception as e:
        logger.error(f"GROQ API ERROR -> {e}")
        return "I apologize, but I encountered an error processing that request."