#!/usr/bin/env python3
import os
import sys
import json
from dotenv import load_dotenv
from openai import OpenAI
from colorama import Fore, Style, init

# Initialize colorama
init()

# Load environment variables
load_dotenv()

# Get API key from environment
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print(f"{Fore.RED}Error: OpenAI API key not found. Please check your .env file.{Style.RESET_ALL}")
    sys.exit(1)

# Initialize OpenAI client
client = OpenAI(api_key=api_key)

# Load knowledge base
def load_knowledge_base():
    kb_content = ""
    kb_dir = "knowledge_base"
    
    if not os.path.exists(kb_dir):
        print(f"{Fore.YELLOW}Warning: Knowledge base directory not found.{Style.RESET_ALL}")
        return kb_content
    
    for filename in os.listdir(kb_dir):
        if filename.endswith(".txt"):
            with open(os.path.join(kb_dir, filename), 'r') as file:
                kb_content += file.read() + "\n\n"
    
    return kb_content

# Setup system prompt with Dompe knowledge
def get_system_prompt():
    kb_content = load_knowledge_base()
    return f"""You are DompeAssist, an AI-powered IT support chatbot for Dompé Pharmaceuticals.
You help employees with IT-related questions and issues, using the following knowledge base:

{kb_content}

Always be professional, concise, and helpful. If you don't know the answer to a specific question about Dompé's IT systems,
acknowledge that and suggest the user contact their IT department directly for specialized assistance.
"""

# Chat function with conversation history
def chat_with_dompe_bot():
    print(f"{Fore.CYAN}╔══════════════════════════════════════════════╗")
    print(f"║          {Fore.WHITE}DompeAssist IT Support Bot{Fore.CYAN}          ║")
    print(f"╚══════════════════════════════════════════════╝{Style.RESET_ALL}")
    print(f"{Fore.CYAN}Type your IT questions below. Type 'exit' to quit.{Style.RESET_ALL}\n")
    
    messages = [
        {"role": "system", "content": get_system_prompt()}
    ]
    
    while True:
        # Get user input
        user_input = input(f"{Fore.GREEN}You: {Style.RESET_ALL}")
        
        # Check if user wants to exit
        if user_input.lower() in ["exit", "quit", "bye"]:
            print(f"\n{Fore.CYAN}Thank you for using DompeAssist. Goodbye!{Style.RESET_ALL}")
            break
        
        # Add user message to history
        messages.append({"role": "user", "content": user_input})
        
        try:
            print(f"{Fore.YELLOW}DompeAssist: {Style.RESET_ALL}", end="")
            
            # Call OpenAI API with streaming
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",  # You can change this to a different model if needed
                messages=messages,
                stream=True,
                max_tokens=1000
            )
            
            # Process the streaming response
            assistant_message = ""
            for chunk in response:
                if chunk.choices[0].delta.content:
                    chunk_content = chunk.choices[0].delta.content
                    print(chunk_content, end="", flush=True)
                    assistant_message += chunk_content
            
            print()  # Add newline after response
            
            # Add assistant response to conversation history
            messages.append({"role": "assistant", "content": assistant_message})
            
        except Exception as e:
            print(f"\n{Fore.RED}Error: {str(e)}{Style.RESET_ALL}")
    
if __name__ == "__main__":
    chat_with_dompe_bot() 