import json
from typing import Optional
import google.generativeai as genai
from app.core.config import settings
from app.models.challenge import CodingChallenge


def _configure_gemini():
    if settings.GEMINI_API_KEY:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            return True
        except Exception:
            return False
    return False


async def generate_hint(
    challenge: CodingChallenge,
    user_code: str,
    hint_level: int = 1
) -> str:
    """
    Generates a progressive Socratic hint:
    - Level 1: Conceptual clue / what to think about.
    - Level 2: Specific guidance on structure / variables / logic.
    - Level 3: Concrete approach or pseudocode (never full solution).
    """
    configured = _configure_gemini()
    if configured and settings.GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            level_instructions = {
                1: "Provide a gentle conceptual hint. Ask a Socratic question to guide the student's thinking. Do NOT mention exact syntax.",
                2: "Provide a targeted hint pointing at the logical structure or specific function/condition needed. Do not write the full code.",
                3: "Provide a step-by-step approach or pseudocode. Show where in their code the adjustment is needed, without solving it completely."
            }
            prompt = f"""
You are Code2Learn's AI Programming Tutor.
Challenge Title: {challenge.title}
Challenge Instructions: {challenge.instructions}
Starter Code: {challenge.starter_code}

Student's current code:
```python
{user_code}
```

The student requested a Level {hint_level} hint (out of 3).
Rule: {level_instructions.get(hint_level, level_instructions[1])}
Constraint: Keep your response concise (2-4 sentences max), friendly, motivating, and encouraging. Never give away the full final solution code.
"""
            response = await model.generate_content_async(prompt)
            if response and response.text:
                return response.text.strip()
        except Exception:
            pass

    # Intelligent fallback hints based on challenge topic & code analysis
    if hint_level == 1:
        if not user_code or user_code.strip() == challenge.starter_code.strip():
            return "Start by looking at what inputs the challenge gives you and what type of value it expects back. Are you printing or returning?"
        return "Think about the core concept tested here: what variables do you need to declare or update?"
    elif hint_level == 2:
        if "def " in challenge.starter_code and "return " not in user_code:
            return "Notice that the function signature expects a return value. Make sure you use the `return` keyword instead of just printing."
        if "for " in challenge.instructions.lower() and "for " not in user_code:
            return "This challenge asks for repetition. Try using a `for ... in range(...)` or iterating through the collection directly."
        return f"Focus on this specific rule: {challenge.instructions[:120]}... Check if your logic satisfies this condition."
    else:
        return f"Here is a recommended approach: 1. Receive the input parameters. 2. Process them using the expected Python syntax. 3. Return or output the exact format. Check the test cases to match the expected format exactly!"


async def explain_concept(concept_title: str, user_question: str, user_code: Optional[str] = None) -> str:
    """Explains a Python concept in simple, encouraging beginner-friendly terms."""
    configured = _configure_gemini()
    if configured and settings.GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""
You are the friendly Code2Learn Python tutor explaining to a beginner programmer.
Concept: {concept_title}
User Question: {user_question}
Optional Code: {user_code or 'None'}

Provide an intuitive explanation using a real-world metaphor, a 3-line Python example, and common pitfalls to avoid. Keep it under 150 words.
"""
            response = await model.generate_content_async(prompt)
            if response and response.text:
                return response.text.strip()
        except Exception:
            pass

    return f"**Understanding {concept_title}**:\nIn Python, {concept_title.lower()} is a fundamental building block. Think of it like a specialized tool in your toolbox: it allows you to organize data and instruct the computer clearly. Always check your syntax and indentation!"
