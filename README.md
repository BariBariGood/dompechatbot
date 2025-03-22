# Dompé IT Support Chatbot

A modern IT support chatbot for Dompé Pharmaceuticals that uses OpenAI's GPT models to provide assistance with IT-related questions and issues.

<img width="908" alt="Screenshot 2025-03-22 at 4 19 55 PM" src="https://github.com/user-attachments/assets/7f9e766e-22dc-40a1-8b41-9d2f9f846f6d" />

## Features

- Beautiful React-based user interface
- Node.js Express backend
- Built-in knowledge base about Dompé and its IT systems
- Friendly conversation starter
- Markdown support for rich text formatting
- Web search capability for unknown information
- Conversation history management
- Simple to deploy and use

## Branding

The application uses Dompé's official branding elements:

- **Logo**: A red hexagon with a stylized white "D" implemented as an SVG for optimal quality at any size
- **Colors**: Uses Dompé's official red (#E30613) for the logo and blue (#0063a3) for accent elements
- **Typography**: Clean, professional font styling consistent with corporate branding

The logo is implemented directly in React using SVG, eliminating the need for external image files and ensuring fast loading times.

## How It Works

1. The chatbot first tries to answer questions using its built-in knowledge base about Dompé's IT systems.
2. If it doesn't have the information, it will automatically search the web for you.
3. Search results are displayed in the chat interface along with a conversational answer.
4. Links to sources are provided for further reading.

## Prerequisites

- Node.js 16.x or higher
- npm or yarn
- OpenAI API key

## Installation

1. Clone this repository or download the files.

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

4. Make sure your OpenAI API key is set in the `.env` file in the root directory:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Usage

### Quick Start

The easiest way to start both servers is to use the included script:
```
./start.sh
```

This will start both the frontend and backend servers and open the application in your browser.

### Development Mode (Manual)

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```

2. In a separate terminal, start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

### Production Mode

1. Build the frontend:
   ```
   cd frontend
   npm run build
   ```

2. Start the backend server which will serve the built frontend:
   ```
   cd backend
   npm start
   ```

3. Access the application at `http://localhost:5001`

## Terminal-based Version

If you prefer the terminal-based version, you can still use it:

```
python dompe_chatbot.py
```

## Customizing the Knowledge Base

You can customize the knowledge base by editing the files in the `knowledge_base` directory:

- Add new `.txt` files with additional information
- Modify existing files to update information

The chatbot automatically loads all `.txt` files from this directory during startup.

## Troubleshooting

If you encounter any issues:

1. Ensure your API key is correctly set in the `.env` file
2. Check your internet connection
3. Verify that the required packages are installed
4. Make sure you have the `knowledge_base` directory and files
5. Check console logs for any error messages
6. If port 5001 is in use, you can modify the port in `backend/server.js` and update the proxy in `frontend/package.json`
